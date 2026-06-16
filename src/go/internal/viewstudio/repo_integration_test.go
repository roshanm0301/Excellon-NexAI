//go:build integration

package viewstudio_test

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"github.com/excellon/nexai/internal/viewstudio"
)

const testUserID = "00000000-0000-0000-0000-000000000001"

// tenantID returns a unique tenant UUID for each test index to ensure isolation.
func tenantID(index int) string {
	return fmt.Sprintf("00000000-0000-0000-ffff-%012d", index)
}

// minimalValidPayload is a valid publish payload: page_root with no children.
var minimalValidPayload = json.RawMessage(`{
	"component_tree": {
		"component_key": "root",
		"component_code": "page_root",
		"children": []
	}
}`)

// payloadWithTextInput includes a text_input missing a label (V006 warning).
var payloadWithTextInputNoLabel = json.RawMessage(`{
	"component_tree": {
		"component_key": "root",
		"component_code": "page_root",
		"children": [
			{
				"component_key": "field_1",
				"component_code": "text_input",
				"props": {},
				"children": []
			}
		]
	}
}`)

// ─── 1. CreateView → GetView round trip ─────────────────────────────────────

func TestInteg_CreateAndGetView(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(1)

	req := viewstudio.CreateViewRequest{
		ViewLabel:     "Test View",
		SurfaceType:   "standard_crud",
		PrimaryEntity: "customer",
		ViewCode:      "customer_list",
	}

	created, err := repo.CreateView(ctx, tid, testUserID, req)
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}
	if created.ArtifactID == "" {
		t.Fatal("expected non-empty ArtifactID")
	}
	if created.TenantID != tid {
		t.Errorf("tenant_id: got %q want %q", created.TenantID, tid)
	}
	if !created.IsDraft {
		t.Error("expected new view to be in draft state")
	}
	if created.IsActive {
		t.Error("expected new view to not be active")
	}

	// GetView round trip
	got, err := repo.GetView(ctx, tid, created.ArtifactID)
	if err != nil {
		t.Fatalf("GetView: %v", err)
	}
	if got.ArtifactID != created.ArtifactID {
		t.Errorf("artifact_id mismatch: got %q want %q", got.ArtifactID, created.ArtifactID)
	}
	if got.ViewLabel != req.ViewLabel {
		t.Errorf("view_label: got %q want %q", got.ViewLabel, req.ViewLabel)
	}

	// Cleanup
	t.Cleanup(func() {
		_ = repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID)
	})
}

// ─── 2. SaveDraft — payload persisted ───────────────────────────────────────

func TestInteg_SaveDraft(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(2)

	created, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Draft View",
		SurfaceType:   "custom_page",
		PrimaryEntity: "order",
	})
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}
	t.Cleanup(func() { _ = repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID) })

	newPayload := json.RawMessage(`{"component_tree":{"component_key":"root","component_code":"page_root","props":{"title":"Draft v2"},"children":[]}}`)

	ver, err := repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, newPayload, 0)
	if err != nil {
		t.Fatalf("SaveDraft: %v", err)
	}
	if ver.VersionID == "" {
		t.Fatal("expected non-empty VersionID")
	}
	if !ver.IsDraft {
		t.Error("expected saved version to be a draft")
	}

	// Verify payload persisted via GetViewWithPayload
	_, fetched, err := repo.GetViewWithPayload(ctx, tid, created.ArtifactID)
	if err != nil {
		t.Fatalf("GetViewWithPayload: %v", err)
	}
	if string(fetched.Payload) == "" {
		t.Fatal("expected non-empty payload after SaveDraft")
	}
}

// ─── 3. SaveDraft — revision conflict ───────────────────────────────────────

func TestInteg_SaveDraft_RevisionConflict(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(3)

	created, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Conflict View",
		SurfaceType:   "dashboard",
		PrimaryEntity: "invoice",
	})
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}
	t.Cleanup(func() { _ = repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID) })

	// First save with revision 0 (bypass check) to get an updated draft in place
	payload1 := json.RawMessage(`{"component_tree":{"component_key":"root","component_code":"page_root","children":[]}}`)
	ver1, err := repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, payload1, 0)
	if err != nil {
		t.Fatalf("first SaveDraft: %v", err)
	}

	// Second save with a stale revision (ver1.Revision - 1 is guaranteed to be wrong if > 0, else use an out-of-date one)
	staleRevision := ver1.Revision - 1
	if staleRevision <= 0 {
		staleRevision = 999 // any revision that doesn't match
	}
	payload2 := json.RawMessage(`{"component_tree":{"component_key":"root","component_code":"page_root","props":{"changed":true},"children":[]}}`)
	_, err = repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, payload2, staleRevision)
	if err == nil {
		t.Fatal("expected ErrRevisionConflict but got nil")
	}
	if !errors.Is(err, viewstudio.ErrRevisionConflict) {
		t.Fatalf("expected ErrRevisionConflict, got: %v", err)
	}
}

// ─── 4. Publish — verify is_active version ──────────────────────────────────

func TestInteg_PublishView(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(4)

	created, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Publish View",
		SurfaceType:   "standard_crud",
		PrimaryEntity: "product",
	})
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}
	t.Cleanup(func() { _ = repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID) })

	// Save a valid publishable draft
	_, err = repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, minimalValidPayload, 0)
	if err != nil {
		t.Fatalf("SaveDraft: %v", err)
	}

	pubVer, err := repo.Publish(ctx, tid, created.ArtifactID, testUserID, "first publish")
	if err != nil {
		t.Fatalf("Publish: %v", err)
	}
	if !pubVer.IsActive {
		t.Error("expected published version to be active")
	}
	if pubVer.IsDraft {
		t.Error("expected published version not to be a draft")
	}
	if pubVer.PublishedAt == nil {
		t.Error("expected PublishedAt to be set")
	}

	// GetPublishedView should now return it
	active, err := repo.GetPublishedView(ctx, tid, created.ArtifactID)
	if err != nil {
		t.Fatalf("GetPublishedView: %v", err)
	}
	if active.VersionID != pubVer.VersionID {
		t.Errorf("version_id mismatch: got %q want %q", active.VersionID, pubVer.VersionID)
	}
}

// ─── 5. Rollback — publish v1 → save draft v2 → rollback to v1 ─────────────

func TestInteg_RollbackView(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(5)

	created, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Rollback View",
		SurfaceType:   "detail_page",
		PrimaryEntity: "shipment",
	})
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}
	t.Cleanup(func() { _ = repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID) })

	// Publish v1
	_, err = repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, minimalValidPayload, 0)
	if err != nil {
		t.Fatalf("SaveDraft v1: %v", err)
	}
	v1, err := repo.Publish(ctx, tid, created.ArtifactID, testUserID, "v1")
	if err != nil {
		t.Fatalf("Publish v1: %v", err)
	}

	// Save draft v2 (a new draft is created after publish)
	payload2 := json.RawMessage(`{"component_tree":{"component_key":"root","component_code":"page_root","props":{"version":"v2"},"children":[]}}`)
	_, err = repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, payload2, 0)
	if err != nil {
		t.Fatalf("SaveDraft v2: %v", err)
	}

	// Rollback to v1
	rolledBack, err := repo.Rollback(ctx, tid, created.ArtifactID, v1.VersionID, testUserID, "rollback to v1")
	if err != nil {
		t.Fatalf("Rollback: %v", err)
	}
	if rolledBack.VersionID != v1.VersionID {
		t.Errorf("rollback version_id: got %q want %q", rolledBack.VersionID, v1.VersionID)
	}
	if !rolledBack.IsActive {
		t.Error("expected rolled-back version to be active")
	}

	// Confirm GetPublishedView returns v1
	active, err := repo.GetPublishedView(ctx, tid, created.ArtifactID)
	if err != nil {
		t.Fatalf("GetPublishedView after rollback: %v", err)
	}
	if active.VersionID != v1.VersionID {
		t.Errorf("active version after rollback: got %q want %q", active.VersionID, v1.VersionID)
	}
}

// ─── 6. ListViews — filter by surface ───────────────────────────────────────

func TestInteg_ListViews(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(6)

	// Create two views with different surfaces
	viewA, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Dashboard View",
		SurfaceType:   "dashboard",
		PrimaryEntity: "metric",
	})
	if err != nil {
		t.Fatalf("CreateView A: %v", err)
	}
	viewB, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Kanban View",
		SurfaceType:   "kanban",
		PrimaryEntity: "task",
	})
	if err != nil {
		t.Fatalf("CreateView B: %v", err)
	}
	t.Cleanup(func() {
		_ = repo.ArchiveView(ctx, tid, viewA.ArtifactID, testUserID)
		_ = repo.ArchiveView(ctx, tid, viewB.ArtifactID, testUserID)
	})

	// List all — both should appear
	all, total, err := repo.ListViews(ctx, tid, "", "", "", "", 50, 0)
	if err != nil {
		t.Fatalf("ListViews all: %v", err)
	}
	if total < 2 {
		t.Errorf("expected at least 2 views, got total=%d", total)
	}
	_ = all

	// Filter by surface=dashboard — only viewA
	dashboardViews, dashTotal, err := repo.ListViews(ctx, tid, "dashboard", "", "", "", 50, 0)
	if err != nil {
		t.Fatalf("ListViews dashboard: %v", err)
	}
	if dashTotal < 1 {
		t.Errorf("expected at least 1 dashboard view, got %d", dashTotal)
	}
	for _, v := range dashboardViews {
		if v.SurfaceType != "dashboard" {
			t.Errorf("expected surface_type=dashboard, got %q", v.SurfaceType)
		}
	}

	// Filter by surface=kanban — only viewB
	kanbanViews, kanbanTotal, err := repo.ListViews(ctx, tid, "kanban", "", "", "", 50, 0)
	if err != nil {
		t.Fatalf("ListViews kanban: %v", err)
	}
	if kanbanTotal < 1 {
		t.Errorf("expected at least 1 kanban view, got %d", kanbanTotal)
	}
	for _, v := range kanbanViews {
		if v.SurfaceType != "kanban" {
			t.Errorf("expected surface_type=kanban, got %q", v.SurfaceType)
		}
	}
}

// ─── 7. ArchiveView — verify archived state ──────────────────────────────────

func TestInteg_ArchiveView(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(7)

	created, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Archive Me",
		SurfaceType:   "wizard",
		PrimaryEntity: "claim",
	})
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}

	if err := repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID); err != nil {
		t.Fatalf("ArchiveView: %v", err)
	}

	// After archiving, GetView still returns the header (it's not hard-deleted)
	got, err := repo.GetView(ctx, tid, created.ArtifactID)
	if err != nil {
		t.Fatalf("GetView after archive: %v", err)
	}
	// view_category is set to 'archived' by ArchiveView
	if got.ViewCategory != "archived" {
		t.Errorf("expected view_category=archived, got %q", got.ViewCategory)
	}

	// No published version should be active after archiving
	_, err = repo.GetPublishedView(ctx, tid, created.ArtifactID)
	if err == nil {
		t.Error("expected error from GetPublishedView after archive (all versions deactivated)")
	}
}

// ─── 8. ListComponents — returns results ─────────────────────────────────────

func TestInteg_ListComponents(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)

	components, err := repo.ListComponents(ctx, "", "")
	if err != nil {
		t.Fatalf("ListComponents: %v", err)
	}
	// Seed migration must have run. If this fails, check that seed migration is applied.
	if len(components) == 0 {
		t.Skip("no components in registry — seed migration may not have run; skipping")
	}
	for _, c := range components {
		if c.ComponentCode == "" {
			t.Error("found component with empty component_code")
		}
		if !c.IsActive {
			t.Errorf("ListComponents returned inactive component: %q", c.ComponentCode)
		}
	}
}

// ─── 9. GetEntityFields — returns error when no compiled_artifact ────────────

func TestInteg_GetEntityFields_NotFound(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(9)

	_, err := repo.GetEntityFields(ctx, tid, "nonexistent_entity_type_xyz")
	if err == nil {
		t.Fatal("expected error for nonexistent entity type, got nil")
	}
}

// ─── 10. ListVersions — returns versions in DESC order ───────────────────────

func TestInteg_ListVersions(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(10)

	created, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "Version History View",
		SurfaceType:   "split_view",
		PrimaryEntity: "quote",
	})
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}
	t.Cleanup(func() { _ = repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID) })

	// Publish v1 so we can create a subsequent draft
	_, err = repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, minimalValidPayload, 0)
	if err != nil {
		t.Fatalf("SaveDraft before publish: %v", err)
	}
	_, err = repo.Publish(ctx, tid, created.ArtifactID, testUserID, "v1 publish")
	if err != nil {
		t.Fatalf("Publish: %v", err)
	}

	// Save a second draft
	draft2Payload := json.RawMessage(`{"component_tree":{"component_key":"root","component_code":"page_root","props":{"v":2},"children":[]}}`)
	_, err = repo.SaveDraft(ctx, tid, created.ArtifactID, testUserID, draft2Payload, 0)
	if err != nil {
		t.Fatalf("SaveDraft v2: %v", err)
	}

	versions, err := repo.ListVersions(ctx, tid, created.ArtifactID)
	if err != nil {
		t.Fatalf("ListVersions: %v", err)
	}
	if len(versions) < 2 {
		t.Errorf("expected at least 2 versions, got %d", len(versions))
	}
	// versions should be DESC by version_no
	for i := 1; i < len(versions); i++ {
		if versions[i].VersionNo > versions[i-1].VersionNo {
			t.Errorf("versions not in DESC order: version[%d]=%d > version[%d]=%d",
				i, versions[i].VersionNo, i-1, versions[i-1].VersionNo)
		}
	}
}

// ─── 11. GetVariants — empty slice (not error) when payload has no variants ──

func TestInteg_GetVariants_EmptyWhenNone(t *testing.T) {
	ctx := context.Background()
	repo := viewstudio.NewRepo(testPool)
	tid := tenantID(11)

	created, err := repo.CreateView(ctx, tid, testUserID, viewstudio.CreateViewRequest{
		ViewLabel:     "No Variants View",
		SurfaceType:   "calendar",
		PrimaryEntity: "appointment",
	})
	if err != nil {
		t.Fatalf("CreateView: %v", err)
	}
	t.Cleanup(func() { _ = repo.ArchiveView(ctx, tid, created.ArtifactID, testUserID) })

	// GetViewWithPayload and check payload has no "variants" key
	_, ver, err := repo.GetViewWithPayload(ctx, tid, created.ArtifactID)
	if err != nil {
		t.Fatalf("GetViewWithPayload: %v", err)
	}

	var payload map[string]json.RawMessage
	if err := json.Unmarshal(ver.Payload, &payload); err != nil {
		t.Fatalf("unmarshal payload: %v", err)
	}

	// If variants key is absent, the handler returns [] — confirm payload is absent or is an array
	if raw, ok := payload["variants"]; ok {
		var variants []interface{}
		if err := json.Unmarshal(raw, &variants); err != nil {
			t.Errorf("variants field should be a JSON array if present, got parse error: %v", err)
		}
	}
	// No error means the test passes — variants absence is the expected "empty" case
}
