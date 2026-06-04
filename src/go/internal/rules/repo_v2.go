package rules

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/excellon/nexai/internal/idgen"
)

type RuleSetV2Record struct {
	ID              string               `json:"id"`
	TenantID        string               `json:"tenant_id"`
	RuleSetKey      string               `json:"rule_set_key"`
	EntityType      string               `json:"entity_type"`
	Name            string               `json:"name"`
	RuleCategory    RuleCategory         `json:"rule_category"`
	ContentType     ContentType          `json:"content_type"`
	Classifications []RuleClassification `json:"classifications"`
	Priority        int                  `json:"priority"`
	HitPolicy       HitPolicy            `json:"hit_policy,omitempty"`
	Enabled         bool                 `json:"enabled"`
	VersionStatus   string               `json:"version_status"`
	Definition      json.RawMessage      `json:"definition"`
	CreatedAt       time.Time            `json:"created_at"`
	UpdatedAt       time.Time            `json:"updated_at"`
}

func (r *Repo) ListV2(ctx context.Context, tenantID, entityType, category string) ([]RuleSetV2, error) {
	query := `
		SELECT id, tenant_id, rule_set_key, entity_type, name, definition, enabled,
		       content_type, classifications, priority, hit_policy, rule_category,
		       version_status, created_at, updated_at
		FROM rule_set
		WHERE tenant_id = $1 AND deleted_at IS NULL`
	args := []any{tenantID}
	argN := 2

	if entityType != "" {
		query += fmt.Sprintf(" AND entity_type = $%d", argN)
		args = append(args, entityType)
		argN++
	}
	if category != "" {
		query += fmt.Sprintf(" AND rule_category = $%d", argN)
		args = append(args, string(NormalizeRuleCategory(category)))
	}
	query += " ORDER BY priority ASC, updated_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("rules v2 list: %w", err)
	}
	defer rows.Close()

	var items []RuleSetV2
	for rows.Next() {
		item, err := scanRuleSetV2(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *Repo) GetV2(ctx context.Context, tenantID, idOrKey string) (*RuleSetV2, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, rule_set_key, entity_type, name, definition, enabled,
		       content_type, classifications, priority, hit_policy, rule_category,
		       version_status, created_at, updated_at
		FROM rule_set
		WHERE tenant_id = $1
		  AND (id::text = $2 OR rule_set_key = $2)
		  AND deleted_at IS NULL
		LIMIT 1`,
		tenantID, idOrKey)
	if err != nil {
		return nil, fmt.Errorf("rules v2 get: %w", err)
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, fmt.Errorf("rules v2 get: not found")
	}
	return scanRuleSetV2(rows)
}

func (r *Repo) SaveV2(ctx context.Context, tenantID, createdBy string, rs RuleSetV2) (*RuleSetV2, error) {
	if rs.ID == "" {
		rs.ID = idgen.NewV4()
	}
	if rs.RuleSetKey == "" {
		rs.RuleSetKey = rs.ID
	}
	if rs.Name == "" {
		rs.Name = "Untitled Rule"
	}
	if rs.RuleCategory == "" {
		rs.RuleCategory = NormalizeRuleCategory("")
	} else {
		rs.RuleCategory = NormalizeRuleCategory(string(rs.RuleCategory))
	}
	if rs.ContentType == "" {
		rs.ContentType = ContentTypeConditionTree
	}
	if rs.Priority == 0 {
		rs.Priority = 100
	}
	if rs.VersionStatus == "" {
		rs.VersionStatus = "Draft"
	}
	if rs.HitPolicy == "" {
		rs.HitPolicy = HitPolicyFirst
	}
	if len(rs.Classifications) == 0 {
		rs.Classifications = []RuleClassification{RuleClassification(rs.RuleCategory)}
	}
	definition, err := marshalRuleDefinition(rs)
	if err != nil {
		return nil, err
	}

	var hitPolicy *string
	if rs.HitPolicy != "" {
		hp := string(rs.HitPolicy)
		hitPolicy = &hp
	}
	classifications := make([]string, len(rs.Classifications))
	for i, cls := range rs.Classifications {
		classifications[i] = string(cls)
	}

	_, err = r.pool.Exec(ctx, `
		INSERT INTO rule_set (
			id, tenant_id, rule_set_key, entity_type, name, definition, enabled,
			content_type, classifications, priority, hit_policy, rule_category,
			version_status, created_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT (id) DO UPDATE SET
			rule_set_key = EXCLUDED.rule_set_key,
			entity_type = EXCLUDED.entity_type,
			name = EXCLUDED.name,
			definition = EXCLUDED.definition,
			enabled = EXCLUDED.enabled,
			content_type = EXCLUDED.content_type,
			classifications = EXCLUDED.classifications,
			priority = EXCLUDED.priority,
			hit_policy = EXCLUDED.hit_policy,
			rule_category = EXCLUDED.rule_category,
			version_status = EXCLUDED.version_status,
			updated_at = now()`,
		rs.ID, tenantID, rs.RuleSetKey, rs.EntityType, rs.Name, definition, rs.Enabled,
		string(rs.ContentType), classifications, rs.Priority, hitPolicy, string(rs.RuleCategory),
		rs.VersionStatus, createdBy)
	if err != nil {
		return nil, fmt.Errorf("rules v2 save: %w", err)
	}

	return r.GetV2(ctx, tenantID, rs.ID)
}

func marshalRuleDefinition(rs RuleSetV2) ([]byte, error) {
	switch rs.ContentType {
	case ContentTypeDecisionTable:
		if rs.DecisionTable == nil {
			rs.DecisionTable = &DecisionTable{Columns: []DTColumn{}, Rows: []DTRow{}, HitPolicy: rs.HitPolicy}
		}
		if rs.DecisionTable.HitPolicy == "" {
			rs.DecisionTable.HitPolicy = rs.HitPolicy
		}
		return json.Marshal(rs.DecisionTable)
	case ContentTypeDecisionGraph:
		if rs.DecisionGraph == nil {
			rs.DecisionGraph = &GoRulesDecisionGraph{
				ContentType: "application/vnd.gorules.decision",
				Nodes:       []map[string]any{},
				Edges:       []map[string]any{},
			}
		}
		if rs.DecisionGraph.ContentType == "" {
			rs.DecisionGraph.ContentType = "application/vnd.gorules.decision"
		}
		return json.Marshal(rs.DecisionGraph)
	default:
		return json.Marshal(struct {
			Conditions *Condition `json:"conditions,omitempty"`
			Actions    []ActionV2 `json:"actions,omitempty"`
		}{Conditions: rs.Conditions, Actions: rs.Actions})
	}
}

func scanRuleSetV2(rows interface{ Scan(...any) error }) (*RuleSetV2, error) {
	var (
		rs              RuleSetV2
		definition      []byte
		contentType     string
		classifications []string
		hitPolicy       *string
		ruleCategory    string
		createdAt       time.Time
		updatedAt       time.Time
	)
	if err := rows.Scan(
		&rs.ID, &rs.TenantID, &rs.RuleSetKey, &rs.EntityType, &rs.Name, &definition,
		&rs.Enabled, &contentType, &classifications, &rs.Priority, &hitPolicy,
		&ruleCategory, &rs.VersionStatus, &createdAt, &updatedAt,
	); err != nil {
		return nil, err
	}
	rs.ContentType = ContentType(contentType)
	rs.RuleCategory = NormalizeRuleCategory(ruleCategory)
	rs.Classifications = toClassifications(classifications)
	if len(rs.Classifications) == 0 {
		rs.Classifications = []RuleClassification{RuleClassification(rs.RuleCategory)}
	}
	if hitPolicy != nil {
		rs.HitPolicy = HitPolicy(*hitPolicy)
	}
	if rs.HitPolicy == "" {
		rs.HitPolicy = HitPolicyFirst
	}
	rs.CreatedAt = createdAt
	rs.UpdatedAt = updatedAt

	applyRuleDefinition(&rs, definition)
	return &rs, nil
}

func applyRuleDefinition(rs *RuleSetV2, definition []byte) {
	switch rs.ContentType {
	case ContentTypeDecisionTable:
		var dt DecisionTable
		if err := json.Unmarshal(definition, &dt); err == nil {
			if dt.HitPolicy == "" {
				dt.HitPolicy = rs.HitPolicy
			}
			rs.DecisionTable = &dt
		}
	case ContentTypeDecisionGraph:
		var graph GoRulesDecisionGraph
		if err := json.Unmarshal(definition, &graph); err == nil {
			if graph.ContentType == "" {
				graph.ContentType = "application/vnd.gorules.decision"
			}
			if graph.Nodes == nil {
				graph.Nodes = []map[string]any{}
			}
			if graph.Edges == nil {
				graph.Edges = []map[string]any{}
			}
			rs.DecisionGraph = &graph
		}
	default:
		var v2 struct {
			Conditions *Condition `json:"conditions,omitempty"`
			Actions    []ActionV2 `json:"actions,omitempty"`
		}
		if err := json.Unmarshal(definition, &v2); err == nil && (v2.Conditions != nil || v2.Actions != nil) {
			rs.Conditions = v2.Conditions
			rs.Actions = v2.Actions
			return
		}
		var legacy RuleSet
		if err := json.Unmarshal(definition, &legacy); err == nil {
			rs.Conditions = &legacy.Definition.Conditions
			rs.Actions = legacyActionsToV2(legacy.Definition.Actions)
		}
	}
}

func legacyActionsToV2(actions []Action) []ActionV2 {
	out := make([]ActionV2, 0, len(actions))
	for _, a := range actions {
		action := ActionV2{
			Type:    a.Type,
			Message: a.Message,
			Field:   a.Field,
		}
		if a.Value != nil {
			var value any
			_ = json.Unmarshal(a.Value, &value)
			action.Value = value
		}
		out = append(out, action)
	}
	return out
}

var nonSlugChars = regexp.MustCompile(`[^a-z0-9._-]+`)

func slugRuleKey(entityType, name string) string {
	base := strings.ToLower(strings.TrimSpace(entityType + "." + name))
	base = strings.ReplaceAll(base, " ", "_")
	base = nonSlugChars.ReplaceAllString(base, "_")
	base = strings.Trim(base, "._-")
	if base == "" {
		return idgen.NewV4()
	}
	return base
}
