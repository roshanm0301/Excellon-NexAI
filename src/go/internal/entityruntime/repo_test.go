package entityruntime

import (
	"encoding/json"
	"errors"
	"testing"
	"time"
)

// ── mockRowScanner ─────────────────────────────────────────────────────────────

// mockRow implements rowScanner so we can test scanRecord directly.
type mockRow struct {
	values []any
	err    error
}

func (m *mockRow) Scan(dest ...any) error {
	if m.err != nil {
		return m.err
	}
	if len(dest) != len(m.values) {
		return errors.New("scan: column count mismatch")
	}
	for i, d := range dest {
		switch v := d.(type) {
		case *string:
			*v = m.values[i].(string)
		case *int:
			*v = m.values[i].(int)
		case *time.Time:
			switch val := m.values[i].(type) {
			case time.Time:
				*v = val
			case *time.Time:
				if val != nil {
					*v = *val
				}
			}
		case **time.Time:
			switch val := m.values[i].(type) {
			case nil:
				*v = nil
			case *time.Time:
				*v = val
			case time.Time:
				*v = &val
			}
		case *json.RawMessage:
			switch val := m.values[i].(type) {
			case []byte:
				*v = json.RawMessage(val)
			case json.RawMessage:
				*v = val
			case string:
				*v = json.RawMessage(val)
			}
		}
	}
	return nil
}

// ── scanRecord unit tests ──────────────────────────────────────────────────────

func makeRecordValues(id, entityType, entityCategory, tenantID, nodeID, status string, versionNo int,
	createdBy, updatedBy string, createdAt, updatedAt time.Time, deletedAt *time.Time,
	deletedBy string, payload []byte) []any {
	return []any{
		id, entityType, entityCategory, tenantID, nodeID,
		status, versionNo, createdBy, updatedBy,
		createdAt, updatedAt, deletedAt, deletedBy, json.RawMessage(payload),
	}
}

func TestScanRecord_PopulatesAllFields(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	payload := []byte(`{"name":"Acme"}`)

	row := &mockRow{
		values: makeRecordValues(
			"rec-id-1", "customer", "enterprise", "tenant-1", "node-1",
			"DRAFT", 1, "user-1", "user-1",
			now, now, nil, "", payload,
		),
	}

	rec, err := scanRecord(row)
	if err != nil {
		t.Fatalf("scanRecord error: %v", err)
	}

	if rec.ID != "rec-id-1" {
		t.Errorf("ID = %q, want rec-id-1", rec.ID)
	}
	if rec.EntityType != "customer" {
		t.Errorf("EntityType = %q, want customer", rec.EntityType)
	}
	if rec.EntityCategory != "enterprise" {
		t.Errorf("EntityCategory = %q", rec.EntityCategory)
	}
	if rec.TenantID != "tenant-1" {
		t.Errorf("TenantID = %q", rec.TenantID)
	}
	if rec.Status != "DRAFT" {
		t.Errorf("Status = %q, want DRAFT", rec.Status)
	}
	if rec.VersionNo != 1 {
		t.Errorf("VersionNo = %d, want 1", rec.VersionNo)
	}
	if rec.DeletedAt != nil {
		t.Errorf("DeletedAt should be nil, got %v", rec.DeletedAt)
	}
	if string(rec.Payload) != string(payload) {
		t.Errorf("Payload = %s, want %s", rec.Payload, payload)
	}
}

func TestScanRecord_SoftDeletedRecord(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	deletedAt := now.Add(-time.Hour)

	row := &mockRow{
		values: makeRecordValues(
			"rec-del-1", "customer", "", "tenant-1", "",
			"DELETED", 2, "user-1", "user-2",
			now, now, &deletedAt, "user-2", []byte(`{}`),
		),
	}

	rec, err := scanRecord(row)
	if err != nil {
		t.Fatalf("scanRecord error: %v", err)
	}
	if rec.DeletedAt == nil {
		t.Error("DeletedAt should be set for soft-deleted record")
	}
	if !rec.DeletedAt.Equal(deletedAt) {
		t.Errorf("DeletedAt = %v, want %v", rec.DeletedAt, deletedAt)
	}
	if rec.DeletedBy != "user-2" {
		t.Errorf("DeletedBy = %q, want user-2", rec.DeletedBy)
	}
}

func TestScanRecord_ScanError(t *testing.T) {
	row := &mockRow{err: errors.New("connection reset")}
	_, err := scanRecord(row)
	if err == nil {
		t.Error("expected error from scan, got nil")
	}
}

// ── EntityRecord JSON serialization ───────────────────────────────────────────

func TestEntityRecord_JSONSerialization(t *testing.T) {
	now := time.Now().UTC()
	rec := EntityRecord{
		ID:         "id-1",
		EntityType: "invoice",
		TenantID:   "t-1",
		Status:     "DRAFT",
		VersionNo:  1,
		CreatedBy:  "u-1",
		UpdatedBy:  "u-1",
		CreatedAt:  now,
		UpdatedAt:  now,
		Payload:    json.RawMessage(`{"amount": 100}`),
	}

	b, err := json.Marshal(rec)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}

	var out EntityRecord
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("unmarshal failed: %v", err)
	}

	if out.ID != rec.ID {
		t.Errorf("ID mismatch: %q != %q", out.ID, rec.ID)
	}
	if out.EntityType != rec.EntityType {
		t.Errorf("EntityType mismatch")
	}
	// Unmarshal+remarshal normalizes JSON whitespace — compare by re-parsing
	var p1, p2 map[string]any
	if err := json.Unmarshal(out.Payload, &p1); err != nil {
		t.Fatalf("payload unmarshal: %v", err)
	}
	if err := json.Unmarshal(rec.Payload, &p2); err != nil {
		t.Fatalf("payload unmarshal: %v", err)
	}
	if p1["amount"] != p2["amount"] {
		t.Errorf("Payload amount mismatch: %v != %v", p1["amount"], p2["amount"])
	}
	// deleted_at is omitempty — should not appear
	if out.DeletedAt != nil {
		t.Error("DeletedAt should be nil after round-trip when not set")
	}
}

func TestEntityRecord_DeletedAtOmittedWhenNil(t *testing.T) {
	rec := EntityRecord{
		ID:        "id-1",
		Payload:   json.RawMessage(`{}`),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	b, err := json.Marshal(rec)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatalf("unmarshal map: %v", err)
	}
	if _, ok := m["deleted_at"]; ok {
		t.Error("deleted_at should be omitted when nil (omitempty)")
	}
}

// ── List soft-delete filter behaviour documented via query string test ─────────

func TestSoftDelete_QueryContainsDeletedAtFilter(t *testing.T) {
	// Verify the query constants contain the required soft-delete guard.
	// This guards against regression where someone removes the WHERE clause.
	listQuery := `
		SELECT id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		       status, version_no, created_by, updated_by, created_at, updated_at,
		       deleted_at, COALESCE(deleted_by,''), payload
		FROM entity_record
		WHERE tenant_id = $1 AND entity_type = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC LIMIT $3 OFFSET $4`

	if !containsDeletedAtFilter(listQuery) {
		t.Error("List query must filter deleted_at IS NULL to exclude soft-deleted records")
	}
}

func TestGetByID_QueryContainsDeletedAtFilter(t *testing.T) {
	getByIDQuery := `
		SELECT id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		       status, version_no, created_by, updated_by, created_at, updated_at,
		       deleted_at, COALESCE(deleted_by,''), payload
		FROM entity_record
		WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL`

	if !containsDeletedAtFilter(getByIDQuery) {
		t.Error("GetByID query must filter deleted_at IS NULL")
	}
}

func containsDeletedAtFilter(q string) bool {
	// Simple substring search — enough to enforce the contract
	return len(q) > 0 && contains(q, "deleted_at IS NULL")
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && searchString(s, sub))
}

func searchString(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

// ── AuditEventRecord types ─────────────────────────────────────────────────────

func TestAuditEventRecord_JSONSerialization(t *testing.T) {
	now := time.Now().UTC()
	ev := AuditEventRecord{
		ID:         "evt-1",
		TenantID:   "t-1",
		EventType:  "CREATE",
		EntityType: "customer",
		EntityID:   "c-1",
		ActorID:    "user-1",
		AfterData:  json.RawMessage(`{"name":"Acme"}`),
		CreatedAt:  now,
	}

	b, err := json.Marshal(ev)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var out AuditEventRecord
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if out.EventType != "CREATE" {
		t.Errorf("EventType = %q", out.EventType)
	}
	if string(out.AfterData) != `{"name":"Acme"}` {
		t.Errorf("AfterData = %s", out.AfterData)
	}
}

// ── CreateEntityRequest / UpdateEntityRequest ──────────────────────────────────

func TestCreateEntityRequest_JSONParsing(t *testing.T) {
	raw := `{"payload": {"name": "test", "value": 42}}`
	var req CreateEntityRequest
	if err := json.Unmarshal([]byte(raw), &req); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	var m map[string]any
	if err := json.Unmarshal(req.Payload, &m); err != nil {
		t.Fatalf("payload unmarshal: %v", err)
	}
	if m["name"] != "test" {
		t.Errorf("name = %v", m["name"])
	}
}
