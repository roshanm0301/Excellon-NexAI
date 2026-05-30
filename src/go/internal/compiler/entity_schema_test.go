package compiler

import (
	"encoding/json"
	"strings"
	"testing"
)

// ── Step 1: Field Type Resolution ─────────────────────────────────────────────

func TestStep1_FieldTypeResolution(t *testing.T) {
	payload := []byte(`{
		"fields": [
			{"key": "name", "type": "text"},
			{"key": "age", "type": "number"},
			{"key": "active", "type": "boolean"},
			{"key": "created", "type": "date"},
			{"key": "updated", "type": "datetime"},
			{"key": "score", "type": "expression", "expression": "payload.base * 2"}
		]
	}`)

	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}

	compiled, err := compileSchema("test_entity", 1, raw)
	if err != nil {
		t.Fatalf("compileSchema failed: %v", err)
	}

	typeMap := map[string]string{}
	for _, f := range compiled.Fields {
		typeMap[f.Key] = f.CompiledType
	}

	cases := map[string]string{
		"name":    "string",
		"age":     "float64",
		"active":  "bool",
		"created": "time",
		"updated": "time",
		"score":   "expression",
	}
	for key, want := range cases {
		got, ok := typeMap[key]
		if !ok {
			t.Errorf("field %q missing from compiled output", key)
			continue
		}
		if got != want {
			t.Errorf("field %q: compiled type = %q, want %q", key, got, want)
		}
	}

	// Computed fields should be flagged
	if len(compiled.ComputedFields) != 1 || compiled.ComputedFields[0] != "score" {
		t.Errorf("expected ComputedFields=[score], got %v", compiled.ComputedFields)
	}
}

func TestStep1_DefaultTypeIsText(t *testing.T) {
	payload := []byte(`{"fields": [{"key": "title"}]}`)
	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	if raw.Fields[0].Type != "text" {
		t.Errorf("empty type should default to text, got %q", raw.Fields[0].Type)
	}
}

func TestStep1_UnknownTypeReturnsError(t *testing.T) {
	payload := []byte(`{"fields": [{"key": "f1", "type": "banana"}]}`)
	_, err := parse(payload)
	if err == nil {
		t.Error("expected error for unknown type, got nil")
	}
}

func TestStep1_DuplicateKeyReturnsError(t *testing.T) {
	payload := []byte(`{"fields": [{"key": "name"}, {"key": "name"}]}`)
	_, err := parse(payload)
	if err == nil {
		t.Error("expected error for duplicate field key, got nil")
	}
}

// ── Step 2: Validation Rules ───────────────────────────────────────────────────

func TestStep2_ValidationRules(t *testing.T) {
	payload := []byte(`{
		"fields": [
			{"key": "email", "type": "text", "required": true, "unique": true},
			{"key": "bio", "type": "text", "required": false}
		]
	}`)

	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	compiled, err := compileSchema("user", 1, raw)
	if err != nil {
		t.Fatalf("compileSchema failed: %v", err)
	}

	idx, ok := compiled.FieldIndex["email"]
	if !ok {
		t.Fatal("email field not found in FieldIndex")
	}
	f := compiled.Fields[idx]
	if !f.Required {
		t.Error("email should be required")
	}
	if !f.Unique {
		t.Error("email should be unique")
	}

	idx2, ok := compiled.FieldIndex["bio"]
	if !ok {
		t.Fatal("bio field not found in FieldIndex")
	}
	f2 := compiled.Fields[idx2]
	if f2.Required {
		t.Error("bio should not be required")
	}
}

// ── Step 3: Status Flow Compilation ──────────────────────────────────────────

func TestStep3_StatusFlowCompilation(t *testing.T) {
	// Status fields use type "select" with options representing transitions.
	// Verify select options are preserved through compilation.
	payload := []byte(`{
		"fields": [
			{
				"key": "status",
				"type": "select",
				"options": [
					{"value": "DRAFT", "label": "Draft"},
					{"value": "ACTIVE", "label": "Active"},
					{"value": "ARCHIVED", "label": "Archived"}
				]
			}
		]
	}`)

	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	compiled, err := compileSchema("contract", 1, raw)
	if err != nil {
		t.Fatalf("compileSchema failed: %v", err)
	}

	idx, ok := compiled.FieldIndex["status"]
	if !ok {
		t.Fatal("status field not in FieldIndex")
	}
	if len(compiled.Fields[idx].Options) != 3 {
		t.Errorf("expected 3 options, got %d", len(compiled.Fields[idx].Options))
	}
	if compiled.Fields[idx].Options[0].Value != "DRAFT" {
		t.Errorf("first option should be DRAFT, got %q", compiled.Fields[idx].Options[0].Value)
	}
	if compiled.Fields[idx].Options[2].Value != "ARCHIVED" {
		t.Errorf("third option should be ARCHIVED, got %q", compiled.Fields[idx].Options[2].Value)
	}
}

// ── Step 4: Index Generation ──────────────────────────────────────────────────

func TestStep4_IndexGeneration(t *testing.T) {
	payload := []byte(`{
		"fields": [
			{"key": "email", "type": "text", "indexed": true},
			{"key": "code", "type": "text", "unique": true},
			{"key": "description", "type": "text"}
		]
	}`)

	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}

	plan := buildIndexPlan("customer", raw)
	if len(plan) != 2 {
		t.Fatalf("expected 2 indexes, got %d", len(plan))
	}

	byName := map[string]CompiledIndex{}
	for _, idx := range plan {
		byName[idx.Name] = idx
	}

	emailIdx, ok := byName["idx_er_customer_email"]
	if !ok {
		t.Error("expected index idx_er_customer_email")
	} else {
		if emailIdx.Unique {
			t.Error("email index should not be unique")
		}
		if !strings.Contains(emailIdx.DDL, "CREATE INDEX CONCURRENTLY") {
			t.Errorf("DDL should use CONCURRENTLY: %q", emailIdx.DDL)
		}
		if !strings.Contains(emailIdx.DDL, "entity_type = 'customer'") {
			t.Errorf("DDL should filter by entity_type: %q", emailIdx.DDL)
		}
		if !strings.Contains(emailIdx.DDL, "deleted_at IS NULL") {
			t.Errorf("DDL should filter deleted_at IS NULL: %q", emailIdx.DDL)
		}
	}

	codeIdx, ok := byName["idx_er_customer_code"]
	if !ok {
		t.Error("expected index idx_er_customer_code")
	} else {
		if !codeIdx.Unique {
			t.Error("code index should be unique")
		}
		if !strings.Contains(codeIdx.DDL, "CREATE UNIQUE INDEX") {
			t.Errorf("DDL should be UNIQUE: %q", codeIdx.DDL)
		}
	}
}

func TestStep4_CompositeIndexGeneration(t *testing.T) {
	payload := []byte(`{
		"fields": [
			{"key": "tenant_ref", "type": "text"},
			{"key": "code", "type": "text"}
		],
		"indexes": [
			{"name": "tenant_code", "fields": ["tenant_ref", "code"], "unique": true}
		]
	}`)

	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	plan := buildIndexPlan("order", raw)
	if len(plan) != 1 {
		t.Fatalf("expected 1 composite index, got %d", len(plan))
	}
	if plan[0].Name != "idx_er_order_tenant_code" {
		t.Errorf("unexpected index name: %q", plan[0].Name)
	}
	if !plan[0].Unique {
		t.Error("composite index should be unique")
	}
}

// ── Step 5: Compiled Output ───────────────────────────────────────────────────

func TestStep5_CompiledOutput(t *testing.T) {
	payload := []byte(`{
		"fields": [
			{"key": "name", "type": "text", "pii": true},
			{"key": "total", "type": "number", "expression": "payload.qty * payload.price"}
		],
		"settings": {"display_name": "Invoice"},
		"capabilities": {"pii": true, "audit": true}
	}`)

	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	compiled, err := compileSchema("invoice", 3, raw)
	if err != nil {
		t.Fatalf("compileSchema failed: %v", err)
	}

	if compiled.EntityType != "invoice" {
		t.Errorf("EntityType = %q, want invoice", compiled.EntityType)
	}
	if compiled.Version != 3 {
		t.Errorf("Version = %d, want 3", compiled.Version)
	}
	if !compiled.HasPII {
		t.Error("HasPII should be true when any field has pii=true")
	}
	if compiled.Settings.DisplayName != "Invoice" {
		t.Errorf("DisplayName = %q, want Invoice", compiled.Settings.DisplayName)
	}
	if !compiled.Capabilities.PII {
		t.Error("Capabilities.PII should be true")
	}
	if !compiled.Capabilities.Audit {
		t.Error("Capabilities.Audit should be true")
	}
	if len(compiled.ComputedFields) != 1 || compiled.ComputedFields[0] != "total" {
		t.Errorf("ComputedFields = %v, want [total]", compiled.ComputedFields)
	}
	if compiled.FieldIndex == nil {
		t.Error("FieldIndex should not be nil")
	}
}

func TestStep5_DefaultDisplayName(t *testing.T) {
	payload := []byte(`{"fields": [{"key": "x", "type": "text"}]}`)
	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse failed: %v", err)
	}
	compiled, err := compileSchema("my_entity", 1, raw)
	if err != nil {
		t.Fatalf("compileSchema failed: %v", err)
	}
	if compiled.Settings.DisplayName != "my_entity" {
		t.Errorf("DisplayName should default to entity type, got %q", compiled.Settings.DisplayName)
	}
}

// ── Content Hash Deduplication ────────────────────────────────────────────────

func TestContentHashDeduplication(t *testing.T) {
	payload1 := []byte(`{"entity_type":"invoice","version":1}`)
	payload2 := []byte(`{"entity_type":"invoice","version":1}`)
	payload3 := []byte(`{"entity_type":"invoice","version":2}`)

	h1 := contentHash(payload1)
	h2 := contentHash(payload2)
	h3 := contentHash(payload3)

	if h1 != h2 {
		t.Errorf("same payload should produce same hash: %q != %q", h1, h2)
	}
	if h1 == h3 {
		t.Errorf("different payloads should produce different hashes")
	}
	if len(h1) != 64 {
		t.Errorf("sha256 hex string should be 64 chars, got %d", len(h1))
	}
}

func TestContentHashIsHex(t *testing.T) {
	data := []byte(`{"test": true}`)
	h := contentHash(data)
	for _, c := range h {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			t.Errorf("hash contains non-hex char %q in %q", c, h)
		}
	}
}

// ── Validate Expressions ───────────────────────────────────────────────────────

func TestValidateExpressions_EmptyExpressionError(t *testing.T) {
	compiled := &CompiledSchema{
		ComputedFields: []string{"bad_field"},
		FieldIndex:     map[string]int{"bad_field": 0},
		Fields: []CompiledField{
			{RawField: RawField{Key: "bad_field", Type: "expression", Expression: ""}},
		},
	}
	if err := validateExpressions(compiled); err == nil {
		t.Error("expected error for empty expression in computed field")
	}
}

func TestValidateExpressions_ValidExpression(t *testing.T) {
	compiled := &CompiledSchema{
		ComputedFields: []string{"total"},
		FieldIndex:     map[string]int{"total": 0},
		Fields: []CompiledField{
			{RawField: RawField{Key: "total", Type: "expression", Expression: "payload.qty * payload.price"}},
		},
	}
	if err := validateExpressions(compiled); err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

// ── Canonical type coverage ───────────────────────────────────────────────────

func TestCanonicalType(t *testing.T) {
	cases := []struct{ in, want string }{
		{"text", "string"},
		{"", "string"},
		{"number", "float64"},
		{"boolean", "bool"},
		{"date", "time"},
		{"datetime", "time"},
		{"relation", "relation"},
		{"select", "select"},
		{"file", "file"},
	}
	for _, c := range cases {
		got := canonicalType(c.in)
		if got != c.want {
			t.Errorf("canonicalType(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

// ── JSON round-trip ───────────────────────────────────────────────────────────

func TestCompiledSchemaJSONRoundTrip(t *testing.T) {
	payload := []byte(`{
		"fields": [{"key": "name", "type": "text"}, {"key": "age", "type": "number"}],
		"settings": {"display_name": "Person"}
	}`)
	raw, err := parse(payload)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	compiled, err := compileSchema("person", 1, raw)
	if err != nil {
		t.Fatalf("compileSchema: %v", err)
	}

	b, err := json.Marshal(compiled)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var out CompiledSchema
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if out.EntityType != "person" {
		t.Errorf("EntityType after round-trip = %q", out.EntityType)
	}
	if len(out.Fields) != 2 {
		t.Errorf("Fields count after round-trip = %d", len(out.Fields))
	}
}
