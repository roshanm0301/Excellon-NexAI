package business_workflow

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// ApprovalHandler manages approval workflows — both sequential and parallel.
type ApprovalHandler struct {
	pool   *db.Pool
	logger *ExecutionLogger
}

// NewApprovalHandler constructs an ApprovalHandler.
func NewApprovalHandler(pool *db.Pool, logger *ExecutionLogger) *ApprovalHandler {
	return &ApprovalHandler{pool: pool, logger: logger}
}

// InitiateApproval creates approval records based on the approval config.
func (h *ApprovalHandler) InitiateApproval(ctx context.Context, tenantID, instanceID, stepID string, cfg *ApprovalConfig) error {
	if cfg == nil || len(cfg.Approvers) == 0 {
		return fmt.Errorf("approval: no approvers configured for step %s", stepID)
	}

	for _, approver := range cfg.Approvers {
		record := &ApprovalRecord{
			ID:           idgen.NewV4(),
			TenantID:     tenantID,
			InstanceID:   instanceID,
			StepID:       stepID,
			ApproverRole: approver.Value,
			Decision:     "pending",
			CreatedAt:    time.Now().UTC(),
		}
		if approver.Type == "user" {
			record.ApproverID = approver.Value
			record.ApproverRole = ""
		}

		if err := h.createApprovalRecord(ctx, record); err != nil {
			return fmt.Errorf("approval: create record: %w", err)
		}
	}

	h.logger.LogAsync(ctx, tenantID, instanceID, stepID, StepApproval, "waiting", nil, map[string]any{
		"mode":          cfg.Mode,
		"policy":        cfg.Policy,
		"approverCount": len(cfg.Approvers),
	})
	return nil
}

// ProcessDecision records an approver's decision and checks if the approval step is resolved.
// Returns (resolved bool, approved bool, error).
func (h *ApprovalHandler) ProcessDecision(ctx context.Context, tenantID, instanceID, stepID, approverID, decision, comment string) (bool, bool, error) {
	if decision != "approved" && decision != "rejected" {
		return false, false, fmt.Errorf("approval: invalid decision %q", decision)
	}

	// Find the pending record for this approver
	record, err := h.findPendingRecord(ctx, tenantID, instanceID, stepID, approverID)
	if err != nil {
		return false, false, fmt.Errorf("approval: find pending record: %w", err)
	}
	if record == nil {
		return false, false, fmt.Errorf("approval: no pending approval found for approver %s on step %s", approverID, stepID)
	}

	// Update the record
	now := time.Now().UTC()
	record.Decision = decision
	record.Comment = comment
	record.ApproverID = approverID
	record.DecidedAt = &now

	if err := h.updateApprovalRecord(ctx, record); err != nil {
		return false, false, fmt.Errorf("approval: update record: %w", err)
	}

	// Check if the step is now resolved
	allRecords, err := h.getApprovalRecords(ctx, tenantID, instanceID, stepID)
	if err != nil {
		return false, false, fmt.Errorf("approval: load records: %w", err)
	}

	// Load the approval config from the instance (we'll need the policy)
	// For now, determine resolution based on available records
	resolved, approved := h.evaluateResolution(allRecords)
	if resolved {
		h.logger.LogAsync(ctx, tenantID, instanceID, stepID, StepApproval, decision, nil, map[string]any{
			"resolved": true,
			"approved": approved,
			"decidedBy": approverID,
		})
	}

	return resolved, approved, nil
}

// evaluateResolution checks if all approvals are decided. Returns (resolved, approved).
// Default policy: unanimous — all must approve.
func (h *ApprovalHandler) evaluateResolution(records []*ApprovalRecord) (bool, bool) {
	if len(records) == 0 {
		return false, false
	}

	pending := 0
	approved := 0
	rejected := 0

	for _, r := range records {
		switch r.Decision {
		case "pending":
			pending++
		case "approved":
			approved++
		case "rejected":
			rejected++
		}
	}

	total := len(records)

	// If any rejection, immediately resolved as rejected
	if rejected > 0 {
		return true, false
	}

	// If all approved, resolved as approved
	if approved == total {
		return true, true
	}

	// Still pending
	return false, false
}

// EvaluateResolutionWithPolicy applies a specific policy to determine resolution.
func (h *ApprovalHandler) EvaluateResolutionWithPolicy(records []*ApprovalRecord, policy ApprovalPolicy) (bool, bool) {
	if len(records) == 0 {
		return false, false
	}

	pending := 0
	approved := 0
	rejected := 0

	for _, r := range records {
		switch r.Decision {
		case "pending":
			pending++
		case "approved":
			approved++
		case "rejected":
			rejected++
		}
	}

	total := len(records)

	switch policy {
	case PolicyUnanimous:
		if rejected > 0 {
			return true, false
		}
		if approved == total {
			return true, true
		}
		return false, false

	case PolicyMajority:
		majority := total/2 + 1
		if approved >= majority {
			return true, true
		}
		if rejected >= majority {
			return true, false
		}
		// If remaining can't change outcome
		if rejected > 0 && (total-rejected) < majority {
			return true, false
		}
		return false, false

	case PolicyAny:
		if approved > 0 {
			return true, true
		}
		if rejected == total {
			return true, false
		}
		return false, false

	default:
		return h.evaluateResolution(records)
	}
}

// GetPendingApprovals returns all pending approvals for a given role or user.
func (h *ApprovalHandler) GetPendingApprovals(ctx context.Context, tenantID, approverRole string) ([]*ApprovalRecord, error) {
	rows, err := h.pool.Query(ctx, `
		SELECT id, tenant_id, instance_id, step_id, approver_id, approver_role, decision, comment, decided_at, created_at
		FROM workflow_approval
		WHERE tenant_id = $1 AND approver_role = $2 AND decision = 'pending'
		ORDER BY created_at ASC`,
		tenantID, approverRole)
	if err != nil {
		return nil, fmt.Errorf("approval: query pending: %w", err)
	}
	defer rows.Close()

	var records []*ApprovalRecord
	for rows.Next() {
		r := &ApprovalRecord{}
		if err := rows.Scan(&r.ID, &r.TenantID, &r.InstanceID, &r.StepID, &r.ApproverID, &r.ApproverRole, &r.Decision, &r.Comment, &r.DecidedAt, &r.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, rows.Err()
}

// --- Database operations ---

func (h *ApprovalHandler) createApprovalRecord(ctx context.Context, record *ApprovalRecord) error {
	_, err := h.pool.Exec(ctx, `
		INSERT INTO workflow_approval (id, tenant_id, instance_id, step_id, approver_id, approver_role, decision, comment, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		record.ID, record.TenantID, record.InstanceID, record.StepID,
		nilToEmpty(record.ApproverID), record.ApproverRole, record.Decision, record.Comment, record.CreatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (h *ApprovalHandler) updateApprovalRecord(ctx context.Context, record *ApprovalRecord) error {
	_, err := h.pool.Exec(ctx, `
		UPDATE workflow_approval
		SET decision = $1, comment = $2, approver_id = $3, decided_at = $4
		WHERE id = $5 AND tenant_id = $6`,
		record.Decision, record.Comment, nilToEmpty(record.ApproverID), record.DecidedAt, record.ID, record.TenantID)
	return err
}

func (h *ApprovalHandler) findPendingRecord(ctx context.Context, tenantID, instanceID, stepID, approverID string) (*ApprovalRecord, error) {
	// First try by user ID match
	r := &ApprovalRecord{}
	err := h.pool.QueryRow(ctx, `
		SELECT id, tenant_id, instance_id, step_id, approver_id, approver_role, decision, comment, decided_at, created_at
		FROM workflow_approval
		WHERE tenant_id = $1 AND instance_id = $2 AND step_id = $3 AND decision = 'pending'
		ORDER BY created_at ASC
		LIMIT 1`,
		tenantID, instanceID, stepID).Scan(
		&r.ID, &r.TenantID, &r.InstanceID, &r.StepID, &r.ApproverID, &r.ApproverRole, &r.Decision, &r.Comment, &r.DecidedAt, &r.CreatedAt)
	if err != nil {
		slog.Debug("approval: no pending record found", "tenant", tenantID, "instance", instanceID, "step", stepID)
		return nil, nil
	}
	return r, nil
}

func (h *ApprovalHandler) getApprovalRecords(ctx context.Context, tenantID, instanceID, stepID string) ([]*ApprovalRecord, error) {
	rows, err := h.pool.Query(ctx, `
		SELECT id, tenant_id, instance_id, step_id, approver_id, approver_role, decision, comment, decided_at, created_at
		FROM workflow_approval
		WHERE tenant_id = $1 AND instance_id = $2 AND step_id = $3
		ORDER BY created_at ASC`,
		tenantID, instanceID, stepID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*ApprovalRecord
	for rows.Next() {
		r := &ApprovalRecord{}
		if err := rows.Scan(&r.ID, &r.TenantID, &r.InstanceID, &r.StepID, &r.ApproverID, &r.ApproverRole, &r.Decision, &r.Comment, &r.DecidedAt, &r.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, rows.Err()
}

func nilToEmpty(s string) string {
	return s // pgx handles empty strings correctly
}
