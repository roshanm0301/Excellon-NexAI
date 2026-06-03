package rules

// conflict_resolver.go implements the user-defined conflict resolution matrix.
// When multiple rules produce conflicting outputs for the same field, this resolver
// determines the winning value based on the configured strategy per field.

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/excellon/nexai/internal/db"
)

// ConflictResolver loads and caches the conflict matrix for rule sets,
// then applies the configured resolution strategy when conflicts occur.
type ConflictResolver struct {
	pool  *db.Pool
	mu    sync.RWMutex
	cache map[string]*matrixCacheEntry
}

type matrixCacheEntry struct {
	matrix    map[string]ConflictMatrixEntry // field_name → entry
	loadedAt  time.Time
}

const matrixCacheTTL = 5 * time.Minute

// NewConflictResolver creates a new ConflictResolver.
func NewConflictResolver(pool *db.Pool) *ConflictResolver {
	return &ConflictResolver{
		pool:  pool,
		cache: make(map[string]*matrixCacheEntry),
	}
}

// LoadMatrix fetches the conflict matrix for a rule set from the database.
// Results are cached for 5 minutes.
func (cr *ConflictResolver) LoadMatrix(ctx context.Context, tenantID, ruleSetKey string) (map[string]ConflictMatrixEntry, error) {
	cacheKey := tenantID + ":" + ruleSetKey

	cr.mu.RLock()
	entry, ok := cr.cache[cacheKey]
	cr.mu.RUnlock()

	if ok && time.Since(entry.loadedAt) < matrixCacheTTL {
		return entry.matrix, nil
	}

	rows, err := cr.pool.Query(ctx, `
		SELECT id, tenant_id, rule_set_key, field_name, resolution_type,
		       COALESCE(custom_rule_key, ''), priority_override
		FROM rule_conflict_matrix
		WHERE tenant_id = $1 AND rule_set_key = $2`,
		tenantID, ruleSetKey)
	if err != nil {
		return nil, fmt.Errorf("conflict_resolver: load matrix: %w", err)
	}
	defer rows.Close()

	matrix := make(map[string]ConflictMatrixEntry)
	for rows.Next() {
		var e ConflictMatrixEntry
		var priorityOverride *int
		if err := rows.Scan(&e.ID, &e.TenantID, &e.RuleSetKey, &e.FieldName,
			&e.ResolutionType, &e.CustomRuleKey, &priorityOverride); err != nil {
			return nil, fmt.Errorf("conflict_resolver: scan: %w", err)
		}
		e.PriorityOverride = priorityOverride
		matrix[e.FieldName] = e
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("conflict_resolver: rows: %w", err)
	}

	cr.mu.Lock()
	cr.cache[cacheKey] = &matrixCacheEntry{matrix: matrix, loadedAt: time.Now()}
	cr.mu.Unlock()

	return matrix, nil
}

// ResolveFieldConflicts resolves conflicts for a single field that has multiple pending actions.
// Returns the winning action and a conflict log entry.
//
// Parameters:
//   - matrix: the field→resolution mapping (from LoadMatrix)
//   - field: the field name with conflict
//   - actions: all actions targeting this field, in priority order (first = lowest priority number)
func (cr *ConflictResolver) ResolveFieldConflicts(
	matrix map[string]ConflictMatrixEntry,
	field string,
	actions []fieldAction,
) (fieldAction, *ConflictLogEntry) {
	if len(actions) <= 1 {
		if len(actions) == 1 {
			return actions[0], nil
		}
		return fieldAction{}, nil
	}

	// Look up resolution strategy for this field
	entry, hasEntry := matrix[field]
	resolution := ResolutionLastWriter // default
	if hasEntry {
		resolution = entry.ResolutionType
	}

	var winner fieldAction
	switch resolution {
	case ResolutionFirstWriter:
		winner = actions[0]
	case ResolutionLastWriter:
		winner = actions[len(actions)-1]
	case ResolutionMostRestrictive:
		winner = cr.resolveMostRestrictive(actions)
	case ResolutionCustomRule:
		// Custom rule resolution falls back to last_writer if no custom evaluator is wired.
		// The custom rule evaluation is handled at a higher level (evaluator calls back into itself).
		winner = actions[len(actions)-1]
	default:
		winner = actions[len(actions)-1]
	}

	// Build conflict log entry
	logEntry := &ConflictLogEntry{
		Field:      field,
		RuleKeyA:   actions[0].ruleKey,
		RuleKeyB:   actions[len(actions)-1].ruleKey,
		ActionA:    actions[0].value,
		ActionB:    actions[len(actions)-1].value,
		Resolution: string(resolution),
		Winner:     winner.ruleKey,
	}

	return winner, logEntry
}

// resolveMostRestrictive selects the most restrictive field behavior from the candidates.
// For non-behavior actions (SET_FIELD), falls back to last_writer.
func (cr *ConflictResolver) resolveMostRestrictive(actions []fieldAction) fieldAction {
	bestIdx := 0
	bestPrecedence := -1

	for i, a := range actions {
		if a.behaviorType != "" {
			p := fieldBehaviorPrecedence[a.behaviorType]
			if p > bestPrecedence {
				bestPrecedence = p
				bestIdx = i
			}
		}
	}

	if bestPrecedence < 0 {
		// No behavior actions — fall back to last writer
		return actions[len(actions)-1]
	}
	return actions[bestIdx]
}

// ResolveAllConflicts processes a full set of field mutations/behaviors and resolves all conflicts.
// It groups actions by field, then resolves each group independently.
//
// Returns:
//   - resolved: deduplicated map of field → winning value
//   - behaviors: deduplicated map of field → winning behavior
//   - conflictLog: all conflict entries for logging/simulation trace
func (cr *ConflictResolver) ResolveAllConflicts(
	ctx context.Context,
	tenantID, ruleSetKey string,
	mutations []fieldAction,
	behaviors []fieldAction,
) (map[string]any, map[string]FieldBehaviorType, []ConflictLogEntry, error) {
	matrix, err := cr.LoadMatrix(ctx, tenantID, ruleSetKey)
	if err != nil {
		// On matrix load failure, apply defaults (last_writer for mutations, most_restrictive for behaviors)
		matrix = map[string]ConflictMatrixEntry{}
	}

	resolvedMutations := make(map[string]any)
	resolvedBehaviors := make(map[string]FieldBehaviorType)
	var conflictLog []ConflictLogEntry

	// Group mutations by field
	mutationsByField := groupByField(mutations)
	for field, fieldActions := range mutationsByField {
		if len(fieldActions) == 1 {
			resolvedMutations[field] = fieldActions[0].value
			continue
		}
		winner, logEntry := cr.ResolveFieldConflicts(matrix, field, fieldActions)
		resolvedMutations[field] = winner.value
		if logEntry != nil {
			conflictLog = append(conflictLog, *logEntry)
		}
	}

	// Group behaviors by field — default to most_restrictive unless matrix says otherwise
	behaviorsByField := groupByField(behaviors)
	for field, fieldActions := range behaviorsByField {
		if len(fieldActions) == 1 {
			resolvedBehaviors[field] = fieldActions[0].behaviorType
			continue
		}
		// Override resolution for behaviors: default to most_restrictive
		behaviorMatrix := make(map[string]ConflictMatrixEntry)
		for k, v := range matrix {
			behaviorMatrix[k] = v
		}
		if _, has := behaviorMatrix[field]; !has {
			behaviorMatrix[field] = ConflictMatrixEntry{
				FieldName:      field,
				ResolutionType: ResolutionMostRestrictive,
			}
		}
		winner, logEntry := cr.ResolveFieldConflicts(behaviorMatrix, field, fieldActions)
		resolvedBehaviors[field] = winner.behaviorType
		if logEntry != nil {
			conflictLog = append(conflictLog, *logEntry)
		}
	}

	return resolvedMutations, resolvedBehaviors, conflictLog, nil
}

// InvalidateCache removes cached matrix entries for a tenant/rule set.
func (cr *ConflictResolver) InvalidateCache(tenantID, ruleSetKey string) {
	cacheKey := tenantID + ":" + ruleSetKey
	cr.mu.Lock()
	delete(cr.cache, cacheKey)
	cr.mu.Unlock()
}

// ─── Internal Types ──────────────────────────────────────────────────────────

// fieldAction represents a pending action for conflict resolution grouping.
type fieldAction struct {
	field        string
	value        any
	behaviorType FieldBehaviorType
	ruleKey      string
	priority     int
}

// groupByField groups actions by their target field.
func groupByField(actions []fieldAction) map[string][]fieldAction {
	grouped := make(map[string][]fieldAction)
	for _, a := range actions {
		grouped[a.field] = append(grouped[a.field], a)
	}
	return grouped
}
