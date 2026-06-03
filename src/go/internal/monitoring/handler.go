package monitoring

// handler.go provides the monitoring API endpoints for rule coverage analysis,
// workflow health metrics, and unified execution log queries.

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/middleware"
)

// Handler serves monitoring dashboard API routes.
type Handler struct {
	pool *db.Pool
}

// NewHandler creates a new monitoring Handler.
func NewHandler(pool *db.Pool) *Handler {
	return &Handler{pool: pool}
}

// RegisterRoutes mounts monitoring endpoints on the given chi.Router.
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/rules/coverage", h.getRuleCoverage)
	r.Get("/rules/top-fired", h.getTopFiredRules)
	r.Get("/rules/dead-rules", h.getDeadRules)
	r.Get("/rules/execution-log", h.getRuleExecutionLog)
	r.Get("/rules/execution-stats", h.getRuleExecutionStats)
	r.Get("/workflow/health", h.getWorkflowHealth)
	r.Get("/workflow/step-metrics", h.getWorkflowStepMetrics)
	r.Get("/workflow/execution-log", h.getWorkflowExecutionLog)
	r.Get("/workflow/sla-breaches", h.getSLABreaches)
}

// ─── Rule Coverage ────────────────────────────────────────────────────────────

// getRuleCoverage returns per-entity-type coverage stats: total rules, fired rules, dead rules.
func (h *Handler) getRuleCoverage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	entityType := r.URL.Query().Get("entity_type")
	days := queryInt(r, "days", 30)

	since := time.Now().UTC().AddDate(0, 0, -days)

	rows, err := h.pool.Query(ctx, `
		WITH all_rules AS (
			SELECT DISTINCT rule_set_key, entity_type
			FROM rule_execution_log
			WHERE tenant_id = $1
			  AND ($2 = '' OR entity_type = $2)
		),
		fired_rules AS (
			SELECT DISTINCT jsonb_array_elements_text(fired_rules) as rule_key, entity_type
			FROM rule_execution_log
			WHERE tenant_id = $1
			  AND created_at >= $3
			  AND ($2 = '' OR entity_type = $2)
			  AND is_simulation = false
		),
		stats AS (
			SELECT
				entity_type,
				COUNT(DISTINCT rule_set_key) as total_rule_sets,
				COUNT(*) FILTER (WHERE is_simulation = false) as total_executions,
				AVG(execution_ms) FILTER (WHERE is_simulation = false) as avg_execution_ms,
				COUNT(*) FILTER (WHERE jsonb_array_length(violations) > 0 AND is_simulation = false) as blocked_count
			FROM rule_execution_log
			WHERE tenant_id = $1
			  AND created_at >= $3
			  AND ($2 = '' OR entity_type = $2)
			GROUP BY entity_type
		)
		SELECT
			s.entity_type,
			s.total_rule_sets,
			s.total_executions,
			COALESCE(s.avg_execution_ms, 0) as avg_execution_ms,
			s.blocked_count,
			(SELECT COUNT(DISTINCT rule_key) FROM fired_rules f WHERE f.entity_type = s.entity_type) as fired_rule_count
		FROM stats s
		ORDER BY s.total_executions DESC`,
		tenantID, entityType, since)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type CoverageRow struct {
		EntityType     string  `json:"entity_type"`
		TotalRuleSets  int     `json:"total_rule_sets"`
		TotalExecs     int     `json:"total_executions"`
		AvgExecMs      float64 `json:"avg_execution_ms"`
		BlockedCount   int     `json:"blocked_count"`
		FiredRuleCount int     `json:"fired_rule_count"`
	}

	var items []CoverageRow
	for rows.Next() {
		var row CoverageRow
		if err := rows.Scan(&row.EntityType, &row.TotalRuleSets, &row.TotalExecs,
			&row.AvgExecMs, &row.BlockedCount, &row.FiredRuleCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items, "days": days})
}

// getTopFiredRules returns the most frequently fired rules.
func (h *Handler) getTopFiredRules(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	limit := queryInt(r, "limit", 20)
	days := queryInt(r, "days", 30)
	since := time.Now().UTC().AddDate(0, 0, -days)

	rows, err := h.pool.Query(ctx, `
		SELECT rule_key, entity_type, fire_count, last_fired
		FROM (
			SELECT
				elem->>'rule_key' as rule_key,
				entity_type,
				COUNT(*) as fire_count,
				MAX(created_at) as last_fired
			FROM rule_execution_log,
				jsonb_array_elements(fired_rules::jsonb) as elem
			WHERE tenant_id = $1
			  AND created_at >= $2
			  AND is_simulation = false
			GROUP BY elem->>'rule_key', entity_type
		) sub
		ORDER BY fire_count DESC
		LIMIT $3`,
		tenantID, since, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type TopRule struct {
		RuleKey    string    `json:"rule_key"`
		EntityType string    `json:"entity_type"`
		FireCount  int       `json:"fire_count"`
		LastFired  time.Time `json:"last_fired"`
	}

	var items []TopRule
	for rows.Next() {
		var row TopRule
		if err := rows.Scan(&row.RuleKey, &row.EntityType, &row.FireCount, &row.LastFired); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items})
}

// getDeadRules returns rules that have never fired in the given time window.
func (h *Handler) getDeadRules(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	days := queryInt(r, "days", 30)
	since := time.Now().UTC().AddDate(0, 0, -days)

	rows, err := h.pool.Query(ctx, `
		WITH all_known_rules AS (
			SELECT DISTINCT elem->>'rule_key' as rule_key, entity_type
			FROM rule_execution_log,
				jsonb_array_elements(fired_rules::jsonb) as elem
			WHERE tenant_id = $1
			  AND is_simulation = false
		),
		recently_fired AS (
			SELECT DISTINCT elem->>'rule_key' as rule_key
			FROM rule_execution_log,
				jsonb_array_elements(fired_rules::jsonb) as elem
			WHERE tenant_id = $1
			  AND created_at >= $2
			  AND is_simulation = false
		)
		SELECT a.rule_key, a.entity_type
		FROM all_known_rules a
		WHERE a.rule_key NOT IN (SELECT rule_key FROM recently_fired)
		ORDER BY a.entity_type, a.rule_key`,
		tenantID, since)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type DeadRule struct {
		RuleKey    string `json:"rule_key"`
		EntityType string `json:"entity_type"`
	}

	var items []DeadRule
	for rows.Next() {
		var row DeadRule
		if err := rows.Scan(&row.RuleKey, &row.EntityType); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items, "window_days": days})
}

// getRuleExecutionLog returns paginated rule execution log entries.
func (h *Handler) getRuleExecutionLog(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	entityType := r.URL.Query().Get("entity_type")
	ruleSetKey := r.URL.Query().Get("rule_set_key")
	showSim := r.URL.Query().Get("include_simulations") == "true"
	limit := queryInt(r, "limit", 50)
	offset := queryInt(r, "offset", 0)

	rows, err := h.pool.Query(ctx, `
		SELECT id, rule_set_key, entity_type, entity_id, trigger_type,
			   fired_rules, (jsonb_array_length(violations) > 0) as blocked, execution_ms, is_simulation, created_at
		FROM rule_execution_log
		WHERE tenant_id = $1
		  AND ($2 = '' OR entity_type = $2)
		  AND ($3 = '' OR rule_set_key = $3)
		  AND ($4 = true OR is_simulation = false)
		ORDER BY created_at DESC
		LIMIT $5 OFFSET $6`,
		tenantID, entityType, ruleSetKey, showSim, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type LogEntry struct {
		ID           string          `json:"id"`
		RuleSetKey   string          `json:"rule_set_key"`
		EntityType   string          `json:"entity_type"`
		EntityID     string          `json:"entity_id"`
		TriggerType  string          `json:"trigger_type"`
		FiredRules   json.RawMessage `json:"fired_rules"`
		Blocked      bool            `json:"blocked"`
		ExecutionMs  int             `json:"execution_ms"`
		IsSimulation bool            `json:"is_simulation"`
		CreatedAt    time.Time       `json:"created_at"`
	}

	var items []LogEntry
	for rows.Next() {
		var row LogEntry
		if err := rows.Scan(&row.ID, &row.RuleSetKey, &row.EntityType, &row.EntityID,
			&row.TriggerType, &row.FiredRules, &row.Blocked, &row.ExecutionMs,
			&row.IsSimulation, &row.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items, "limit": limit, "offset": offset})
}

// getRuleExecutionStats returns time-bucketed execution stats (hourly/daily).
func (h *Handler) getRuleExecutionStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	days := queryInt(r, "days", 7)
	since := time.Now().UTC().AddDate(0, 0, -days)

	rows, err := h.pool.Query(ctx, `
		SELECT
			date_trunc('hour', created_at) as bucket,
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE jsonb_array_length(violations) > 0) as blocked,
			AVG(execution_ms) as avg_ms
		FROM rule_execution_log
		WHERE tenant_id = $1
		  AND created_at >= $2
		  AND is_simulation = false
		GROUP BY bucket
		ORDER BY bucket ASC`,
		tenantID, since)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type StatBucket struct {
		Bucket  time.Time `json:"bucket"`
		Total   int       `json:"total"`
		Blocked int       `json:"blocked"`
		AvgMs   float64   `json:"avg_ms"`
	}

	var items []StatBucket
	for rows.Next() {
		var row StatBucket
		if err := rows.Scan(&row.Bucket, &row.Total, &row.Blocked, &row.AvgMs); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items, "days": days})
}

// ─── Workflow Health ──────────────────────────────────────────────────────────

// getWorkflowHealth returns overall workflow system health metrics.
func (h *Handler) getWorkflowHealth(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	days := queryInt(r, "days", 7)
	since := time.Now().UTC().AddDate(0, 0, -days)

	var health struct {
		ActiveInstances    int     `json:"active_instances"`
		CompletedInstances int     `json:"completed_instances"`
		FailedInstances    int     `json:"failed_instances"`
		AbortedInstances   int     `json:"aborted_instances"`
		WaitingInstances   int     `json:"waiting_instances"`
		TotalInstances     int     `json:"total_instances"`
		AvgDurationMs      float64 `json:"avg_duration_ms"`
		FailureRate        float64 `json:"failure_rate"`
	}

	err := h.pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE status = 'running') as active,
			COUNT(*) FILTER (WHERE status = 'completed') as completed,
			COUNT(*) FILTER (WHERE status = 'failed') as failed,
			COUNT(*) FILTER (WHERE status = 'aborted') as aborted,
			COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
			COUNT(*) as total,
			COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) FILTER (WHERE completed_at IS NOT NULL), 0) as avg_dur,
			CASE WHEN COUNT(*) > 0
				THEN COUNT(*) FILTER (WHERE status = 'failed')::float / COUNT(*)::float
				ELSE 0
			END as fail_rate
		FROM workflow_instance
		WHERE tenant_id = $1 AND created_at >= $2`,
		tenantID, since).Scan(
		&health.ActiveInstances, &health.CompletedInstances, &health.FailedInstances,
		&health.AbortedInstances, &health.WaitingInstances, &health.TotalInstances,
		&health.AvgDurationMs, &health.FailureRate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, health)
}

// getWorkflowStepMetrics returns per-step-type aggregated performance metrics.
func (h *Handler) getWorkflowStepMetrics(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	days := queryInt(r, "days", 7)
	since := time.Now().UTC().AddDate(0, 0, -days)

	rows, err := h.pool.Query(ctx, `
		SELECT
			step_type,
			COUNT(*) as total_executions,
			COUNT(*) FILTER (WHERE status = 'completed') as completed,
			COUNT(*) FILTER (WHERE status = 'failed') as failed,
			AVG(duration_ms) FILTER (WHERE duration_ms > 0) as avg_duration_ms,
			MAX(duration_ms) as max_duration_ms,
			PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms > 0) as p95_ms
		FROM workflow_execution_log
		WHERE tenant_id = $1
		  AND started_at >= $2
		GROUP BY step_type
		ORDER BY total_executions DESC`,
		tenantID, since)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type StepMetric struct {
		StepType    string  `json:"step_type"`
		TotalExecs  int     `json:"total_executions"`
		Completed   int     `json:"completed"`
		Failed      int     `json:"failed"`
		AvgDuration float64 `json:"avg_duration_ms"`
		MaxDuration int     `json:"max_duration_ms"`
		P95Duration float64 `json:"p95_duration_ms"`
	}

	var items []StepMetric
	for rows.Next() {
		var row StepMetric
		if err := rows.Scan(&row.StepType, &row.TotalExecs, &row.Completed, &row.Failed,
			&row.AvgDuration, &row.MaxDuration, &row.P95Duration); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items})
}

// getWorkflowExecutionLog returns paginated workflow step execution logs.
func (h *Handler) getWorkflowExecutionLog(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	instanceID := r.URL.Query().Get("instance_id")
	stepType := r.URL.Query().Get("step_type")
	status := r.URL.Query().Get("status")
	limit := queryInt(r, "limit", 50)
	offset := queryInt(r, "offset", 0)

	rows, err := h.pool.Query(ctx, `
		SELECT id, instance_id, step_id, step_type, status, error_message,
			   started_at, completed_at, duration_ms
		FROM workflow_execution_log
		WHERE tenant_id = $1
		  AND ($2 = '' OR instance_id = $2)
		  AND ($3 = '' OR step_type = $3)
		  AND ($4 = '' OR status = $4)
		ORDER BY started_at DESC
		LIMIT $5 OFFSET $6`,
		tenantID, instanceID, stepType, status, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type LogRow struct {
		ID           string     `json:"id"`
		InstanceID   string     `json:"instance_id"`
		StepID       string     `json:"step_id"`
		StepType     string     `json:"step_type"`
		Status       string     `json:"status"`
		ErrorMessage string     `json:"error_message,omitempty"`
		StartedAt    time.Time  `json:"started_at"`
		CompletedAt  *time.Time `json:"completed_at,omitempty"`
		DurationMs   int        `json:"duration_ms"`
	}

	var items []LogRow
	for rows.Next() {
		var row LogRow
		if err := rows.Scan(&row.ID, &row.InstanceID, &row.StepID, &row.StepType,
			&row.Status, &row.ErrorMessage, &row.StartedAt, &row.CompletedAt, &row.DurationMs); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items, "limit": limit, "offset": offset})
}

// getSLABreaches returns workflow instances that have breached their SLA.
func (h *Handler) getSLABreaches(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.TenantID(ctx)
	limit := queryInt(r, "limit", 20)

	rows, err := h.pool.Query(ctx, `
		SELECT wi.id, wi.definition_id, wi.entity_type, wi.entity_id, wi.status,
			   wi.started_at,
			   EXTRACT(EPOCH FROM (NOW() - wi.started_at)) * 1000 as elapsed_ms
		FROM workflow_instance wi
		JOIN workflow_sla ws ON ws.instance_id = wi.id AND ws.tenant_id = wi.tenant_id
		WHERE wi.tenant_id = $1
		  AND wi.status IN ('running', 'waiting')
		  AND ws.deadline_at < NOW()
		  AND ws.resolved = false
		ORDER BY ws.deadline_at ASC
		LIMIT $2`,
		tenantID, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type SLABreach struct {
		InstanceID   string     `json:"instance_id"`
		DefinitionID string     `json:"definition_id"`
		EntityType   string     `json:"entity_type"`
		EntityID     string     `json:"entity_id"`
		Status       string     `json:"status"`
		StartedAt    *time.Time `json:"started_at"`
		ElapsedMs    float64    `json:"elapsed_ms"`
	}

	var items []SLABreach
	for rows.Next() {
		var row SLABreach
		if err := rows.Scan(&row.InstanceID, &row.DefinitionID, &row.EntityType,
			&row.EntityID, &row.Status, &row.StartedAt, &row.ElapsedMs); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, row)
	}

	writeJSON(w, map[string]any{"items": items})
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func queryInt(r *http.Request, key string, fallback int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return fallback
	}
	v, err := strconv.Atoi(s)
	if err != nil || v < 0 {
		return fallback
	}
	return v
}
