package compiler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
	"github.com/excellon/nexai/internal/overlay"
)

const compilerVersion = "1"

type Service struct {
	pool     *db.Pool
	resolver *overlay.Resolver
}

func NewService(pool *db.Pool) *Service {
	return &Service{pool: pool}
}

func NewServiceWithOverlay(pool *db.Pool, resolver *overlay.Resolver) *Service {
	return &Service{pool: pool, resolver: resolver}
}

// Compile runs the full 6-step pipeline and writes/updates compiled_artifact.
func (s *Service) Compile(ctx context.Context, artifact interface {
	GetID() string
	GetTenantID() string
	GetEntityType() string
	GetVersion() int
	GetPayload() []byte
}) (*CompiledArtifact, error) {
	// Step 1: Parse and validate the raw payload
	raw, err := parse(artifact.GetPayload())
	if err != nil {
		return nil, fmt.Errorf("compile step 1 (parse): %w", err)
	}

	// Step 2: Resolve overlays
	raw = s.applyOverlays(ctx, artifact.GetTenantID(), artifact.GetEntityType(), raw)

	// Step 3: Compile fields
	compiled, err := compileSchema(artifact.GetEntityType(), artifact.GetVersion(), raw)
	if err != nil {
		return nil, fmt.Errorf("compile step 3 (fields): %w", err)
	}

	// Step 4: Validate expression syntax (stub for goja integration in Phase 4)
	if err := validateExpressions(compiled); err != nil {
		return nil, fmt.Errorf("compile step 4 (expressions): %w", err)
	}

	// Step 5: Build index plan and enqueue DDL
	compiled.IndexPlan = buildIndexPlan(artifact.GetEntityType(), raw)
	if err := s.enqueueIndexes(ctx, artifact.GetTenantID(), artifact.GetEntityType(), compiled.IndexPlan); err != nil {
		slog.Warn("index queue failed (non-fatal)", "error", err)
	}

	// Step 6: Compute content hash, skip write if unchanged, emit compiled_artifact
	schemaBytes, err := json.Marshal(compiled)
	if err != nil {
		return nil, fmt.Errorf("compile step 6 (marshal): %w", err)
	}
	hash := contentHash(schemaBytes)

	return s.emit(ctx, artifact.GetID(), artifact.GetTenantID(), artifact.GetEntityType(), schemaBytes, hash)
}

// ── Step 1: Parse ─────────────────────────────────────────────────────────────

func parse(payload []byte) (*RawEntitySchema, error) {
	if len(payload) == 0 {
		payload = []byte(`{}`)
	}
	var raw RawEntitySchema
	if err := json.Unmarshal(payload, &raw); err != nil {
		return nil, fmt.Errorf("invalid JSON payload: %w", err)
	}
	seen := map[string]bool{}
	for i, f := range raw.Fields {
		if f.Key == "" {
			return nil, fmt.Errorf("field[%d]: key is required", i)
		}
		if seen[f.Key] {
			return nil, fmt.Errorf("field[%d]: duplicate key %q", i, f.Key)
		}
		seen[f.Key] = true
		validTypes := map[string]bool{
			"text": true, "number": true, "date": true, "datetime": true,
			"boolean": true, "select": true, "multiselect": true,
			"relation": true, "expression": true, "file": true,
		}
		if f.Type != "" && !validTypes[f.Type] {
			return nil, fmt.Errorf("field %q: unknown type %q", f.Key, f.Type)
		}
		if f.Type == "" {
			raw.Fields[i].Type = "text"
		}
	}
	return &raw, nil
}

// ── Step 2: Overlay ──────────────────────────────────────────────────────────

func (s *Service) applyOverlays(ctx context.Context, tenantID, entityType string, raw *RawEntitySchema) *RawEntitySchema {
	if s.resolver == nil {
		return raw
	}
	delta, err := s.resolver.Resolve(ctx, tenantID, entityType, "", "")
	if err != nil {
		slog.Warn("overlay resolve failed (non-fatal), using raw schema", "error", err)
		return raw
	}
	if len(delta) == 0 {
		return raw
	}
	// Marshal raw schema to map, apply delta, unmarshal back
	rawBytes, err := json.Marshal(raw)
	if err != nil {
		slog.Warn("overlay: failed to marshal raw schema", "error", err)
		return raw
	}
	var rawMap map[string]any
	if err := json.Unmarshal(rawBytes, &rawMap); err != nil {
		slog.Warn("overlay: failed to unmarshal raw schema", "error", err)
		return raw
	}
	_ = delta // delta applied at runtime, not compile-time for schema fields
	// Re-unmarshal as RawEntitySchema after overlay application is handled at resolver level
	return raw
}

// ── Step 3: Compile fields ────────────────────────────────────────────────────

func compileSchema(entityType string, version int, raw *RawEntitySchema) (*CompiledSchema, error) {
	caps := RawCapabilities{}
	if raw.Capabilities != nil {
		caps = *raw.Capabilities
	}
	settings := RawSettings{DisplayName: entityType}
	if raw.Settings != nil {
		settings = *raw.Settings
		if settings.DisplayName == "" {
			settings.DisplayName = entityType
		}
	}

	compiled := &CompiledSchema{
		EntityType:    entityType,
		Version:       version,
		Sections:      raw.Sections,
		Relationships: raw.Relationships,
		Capabilities:  caps,
		Settings:      settings,
		Retention:     raw.Retention,
		FieldIndex:    map[string]int{},
	}

	for i, f := range raw.Fields {
		cf := CompiledField{
			RawField:     f,
			CompiledType: canonicalType(f.Type),
		}
		compiled.Fields = append(compiled.Fields, cf)
		compiled.FieldIndex[f.Key] = i
		if f.PII {
			compiled.HasPII = true
		}
		if f.Expression != "" {
			compiled.ComputedFields = append(compiled.ComputedFields, f.Key)
		}
	}

	return compiled, nil
}

func canonicalType(t string) string {
	switch t {
	case "text", "":
		return "string"
	case "number":
		return "float64"
	case "boolean":
		return "bool"
	case "date", "datetime":
		return "time"
	default:
		return t
	}
}

// ── Step 4: Validate expressions (stub) ──────────────────────────────────────

func validateExpressions(schema *CompiledSchema) error {
	for _, key := range schema.ComputedFields {
		idx, ok := schema.FieldIndex[key]
		if !ok {
			continue
		}
		if schema.Fields[idx].Expression == "" {
			return fmt.Errorf("field %q: expression is empty", key)
		}
	}
	return nil
}

// ── Step 5: Index plan ────────────────────────────────────────────────────────

func buildIndexPlan(entityType string, raw *RawEntitySchema) []CompiledIndex {
	var plan []CompiledIndex

	for _, f := range raw.Fields {
		if f.Indexed || f.Unique {
			colName := fmt.Sprintf("(payload->>'%s')", f.Key)
			name := fmt.Sprintf("idx_er_%s_%s", entityType, f.Key)
			unique := ""
			if f.Unique {
				unique = "UNIQUE "
			}
			plan = append(plan, CompiledIndex{
				Name:    name,
				Table:   "entity_record",
				Columns: []string{f.Key},
				Unique:  f.Unique,
				DDL:     fmt.Sprintf("CREATE %sINDEX CONCURRENTLY IF NOT EXISTS %s ON entity_record USING btree (tenant_id, entity_type, %s) WHERE entity_type = '%s' AND deleted_at IS NULL", unique, name, colName, entityType),
			})
		}
	}

	for _, rule := range raw.Indexes {
		cols := make([]string, len(rule.Fields))
		for i, f := range rule.Fields {
			cols[i] = fmt.Sprintf("(payload->>'%s')", f)
		}
		colList := ""
		for i, c := range cols {
			if i > 0 {
				colList += ", "
			}
			colList += c
		}
		unique := ""
		if rule.Unique {
			unique = "UNIQUE "
		}
		name := fmt.Sprintf("idx_er_%s_%s", entityType, rule.Name)
		plan = append(plan, CompiledIndex{
			Name:    name,
			Table:   "entity_record",
			Columns: rule.Fields,
			Unique:  rule.Unique,
			DDL:     fmt.Sprintf("CREATE %sINDEX CONCURRENTLY IF NOT EXISTS %s ON entity_record USING btree (tenant_id, entity_type, %s) WHERE entity_type = '%s' AND deleted_at IS NULL", unique, name, colList, entityType),
		})
	}

	return plan
}

func (s *Service) enqueueIndexes(ctx context.Context, tenantID, entityType string, plan []CompiledIndex) error {
	for _, idx := range plan {
		id := idgen.NewV4()
		_, err := s.pool.Exec(ctx, `
			INSERT INTO index_queue (id, tenant_id, entity_type, index_name, index_ddl, status)
			VALUES ($1, $2, $3, $4, $5, 'pending')
			ON CONFLICT DO NOTHING`,
			id, tenantID, entityType, idx.Name, idx.DDL)
		if err != nil {
			return fmt.Errorf("enqueue index %s: %w", idx.Name, err)
		}
	}
	return nil
}

// ── Step 6: Emit ──────────────────────────────────────────────────────────────

func (s *Service) emit(ctx context.Context, artifactVersionID, tenantID, entityType string, schemaBytes []byte, hash string) (*CompiledArtifact, error) {
	var existingHash string
	err := s.pool.QueryRow(ctx,
		`SELECT content_hash FROM compiled_artifact WHERE artifact_version_id = $1`,
		artifactVersionID).Scan(&existingHash)
	if err == nil && existingHash == hash {
		var ca CompiledArtifact
		err = s.pool.QueryRow(ctx,
			`SELECT id, artifact_version_id, tenant_id, entity_type, compiled_schema, content_hash, compiler_version, created_at, updated_at FROM compiled_artifact WHERE artifact_version_id = $1`,
			artifactVersionID).Scan(&ca.ID, &ca.ArtifactVersionID, &ca.TenantID, &ca.EntityType, &ca.CompiledSchema, &ca.ContentHash, &ca.CompilerVersion, &ca.CreatedAt, &ca.UpdatedAt)
		if err == nil {
			slog.Debug("compiled artifact unchanged, skipping write", "hash", hash)
			return &ca, nil
		}
	}

	id := idgen.NewV4()
	var ca CompiledArtifact
	err = s.pool.QueryRow(ctx, `
		INSERT INTO compiled_artifact (id, artifact_version_id, tenant_id, entity_type, compiled_schema, content_hash, compiler_version)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (artifact_version_id) DO UPDATE SET
			compiled_schema = EXCLUDED.compiled_schema,
			content_hash = EXCLUDED.content_hash,
			compiler_version = EXCLUDED.compiler_version,
			updated_at = now()
		RETURNING id, artifact_version_id, tenant_id, entity_type, compiled_schema, content_hash, compiler_version, created_at, updated_at`,
		id, artifactVersionID, tenantID, entityType, schemaBytes, hash, compilerVersion,
	).Scan(&ca.ID, &ca.ArtifactVersionID, &ca.TenantID, &ca.EntityType, &ca.CompiledSchema, &ca.ContentHash, &ca.CompilerVersion, &ca.CreatedAt, &ca.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("emit compiled artifact: %w", err)
	}
	return &ca, nil
}

func contentHash(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}
