//go:build integration

package viewstudio_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/excellon/nexai/internal/middleware"
	"github.com/excellon/nexai/internal/viewstudio"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

const (
	httpTestTenantID = "00000000-0000-0000-eeee-000000000001"
	httpTestUserID   = "00000000-0000-0000-0000-000000000001"
)

// newIntegrationServer wires a real router + handler + real DB repo.
func newIntegrationServer(t *testing.T) *httptest.Server {
	t.Helper()
	repo := viewstudio.NewRepo(testPool)
	h := viewstudio.NewHandler(repo)

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	// Use local/dev mode so that x-tenant-id/x-user-id/x-role headers are trusted.
	r.Use(middleware.AuthContext(middleware.AuthConfig{
		Mode:          "local",
		LocalTenantID: httpTestTenantID,
		LocalUserID:   httpTestUserID,
		LocalRole:     "admin",
	}))
	r.Route("/studio", h.RegisterRoutes)
	return httptest.NewServer(r)
}

// devHeaders returns the default dev identity headers.
func devHeaders(tenantID, userID, role string) http.Header {
	h := make(http.Header)
	h.Set("x-tenant-id", tenantID)
	h.Set("x-user-id", userID)
	h.Set("x-role", role)
	return h
}

// doRequest performs an HTTP request with the given headers and returns the response.
func doRequest(t *testing.T, method, url string, body io.Reader, headers http.Header) *http.Response {
	t.Helper()
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		t.Fatalf("http.NewRequest: %v", err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for k, vals := range headers {
		for _, v := range vals {
			req.Header.Set(k, v)
		}
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("http.Do: %v", err)
	}
	return resp
}

// createViewViaAPI is a helper to create a view via the API and return its artifact ID.
func createViewViaAPI(t *testing.T, srv *httptest.Server, tenantID, viewLabel, surfaceType, entity string) string {
	t.Helper()
	reqBody := viewstudio.CreateViewRequest{
		ViewLabel:     viewLabel,
		SurfaceType:   surfaceType,
		PrimaryEntity: entity,
	}
	b, _ := json.Marshal(reqBody)
	hdrs := devHeaders(tenantID, httpTestUserID, "admin")

	resp := doRequest(t, http.MethodPost, srv.URL+"/studio/views", bytes.NewReader(b), hdrs)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("createViewViaAPI: expected 201, got %d: %s", resp.StatusCode, body)
	}

	var view viewstudio.View
	if err := json.NewDecoder(resp.Body).Decode(&view); err != nil {
		t.Fatalf("decode create view response: %v", err)
	}
	return view.ArtifactID
}

// ─── 1. GET /studio/views returns 200 + items array (never null) ─────────────

func TestHTTP_Integ_ListViews(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")
	resp := doRequest(t, http.MethodGet, srv.URL+"/studio/views", nil, hdrs)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, body)
	}

	var result viewstudio.ViewListResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	// Items must never be null — always an array (even empty)
	if result.Items == nil {
		t.Error("expected items to be a non-null array, got null")
	}
}

// ─── 2. POST /studio/views creates a view, returns 201 ──────────────────────

func TestHTTP_Integ_CreateView(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	reqBody := viewstudio.CreateViewRequest{
		ViewLabel:     "HTTP Integration View",
		SurfaceType:   "standard_crud",
		PrimaryEntity: "account",
	}
	b, _ := json.Marshal(reqBody)
	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")

	resp := doRequest(t, http.MethodPost, srv.URL+"/studio/views", bytes.NewReader(b), hdrs)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 201, got %d: %s", resp.StatusCode, body)
	}

	var view viewstudio.View
	if err := json.NewDecoder(resp.Body).Decode(&view); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if view.ArtifactID == "" {
		t.Error("expected non-empty artifact_id in response")
	}
	if view.ViewLabel != reqBody.ViewLabel {
		t.Errorf("view_label: got %q want %q", view.ViewLabel, reqBody.ViewLabel)
	}
	if view.TenantID != httpTestTenantID {
		t.Errorf("tenant_id: got %q want %q", view.TenantID, httpTestTenantID)
	}

	// Cleanup via archive
	t.Cleanup(func() {
		repo := viewstudio.NewRepo(testPool)
		_ = repo.ArchiveView(t.Context(), httpTestTenantID, view.ArtifactID, httpTestUserID)
	})
}

// ─── 3. GET /studio/views/:key returns the view ──────────────────────────────

func TestHTTP_Integ_GetView(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	artifactID := createViewViaAPI(t, srv, httpTestTenantID, "Get View Test", "detail_page", "contact")
	t.Cleanup(func() {
		repo := viewstudio.NewRepo(testPool)
		_ = repo.ArchiveView(t.Context(), httpTestTenantID, artifactID, httpTestUserID)
	})

	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")
	resp := doRequest(t, http.MethodGet, fmt.Sprintf("%s/studio/views/%s", srv.URL, artifactID), nil, hdrs)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, body)
	}

	// Response includes view fields + latest_payload
	var result map[string]json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if _, ok := result["artifact_id"]; !ok {
		t.Error("expected artifact_id in response")
	}
	if _, ok := result["latest_payload"]; !ok {
		t.Error("expected latest_payload in response")
	}
}

// ─── 4. GET /studio/component-registry returns items ─────────────────────────

func TestHTTP_Integ_ComponentRegistry_NotEmpty(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")
	resp := doRequest(t, http.MethodGet, srv.URL+"/studio/component-registry", nil, hdrs)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, body)
	}

	var items []viewstudio.ComponentEntry
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	// If seed migration ran, there should be components. If not, skip gracefully.
	if len(items) == 0 {
		t.Skip("component registry is empty — seed migration may not have run")
	}
}

// ─── 5. Publish with wrong root (V002) → 422 VALIDATION_ERROR ───────────────

func TestHTTP_Integ_PublishValidation_V002(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	artifactID := createViewViaAPI(t, srv, httpTestTenantID, "Publish Validation V002", "standard_crud", "lead")
	t.Cleanup(func() {
		repo := viewstudio.NewRepo(testPool)
		_ = repo.ArchiveView(t.Context(), httpTestTenantID, artifactID, httpTestUserID)
	})

	// Save a draft with an invalid root component (button instead of page_root)
	invalidPayload := json.RawMessage(`{
		"component_tree": {
			"component_key": "root",
			"component_code": "button",
			"children": []
		}
	}`)
	draftReq := viewstudio.SaveDraftRequest{Payload: invalidPayload}
	draftBody, _ := json.Marshal(draftReq)
	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")

	draftResp := doRequest(t, http.MethodPut, fmt.Sprintf("%s/studio/views/%s/draft", srv.URL, artifactID), bytes.NewReader(draftBody), hdrs)
	defer draftResp.Body.Close()
	if draftResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(draftResp.Body)
		t.Fatalf("saveDraft: expected 200, got %d: %s", draftResp.StatusCode, body)
	}

	// Now attempt to publish
	publishBody, _ := json.Marshal(viewstudio.PublishRequest{Changelog: "should fail"})
	pubResp := doRequest(t, http.MethodPost, fmt.Sprintf("%s/studio/views/%s/publish", srv.URL, artifactID), bytes.NewReader(publishBody), hdrs)
	defer pubResp.Body.Close()

	if pubResp.StatusCode != http.StatusUnprocessableEntity {
		body, _ := io.ReadAll(pubResp.Body)
		t.Fatalf("expected 422, got %d: %s", pubResp.StatusCode, body)
	}

	var errResp map[string]json.RawMessage
	if err := json.NewDecoder(pubResp.Body).Decode(&errResp); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	errBody := string(errResp["error"])
	if errBody == "" {
		t.Fatal("expected error body in response")
	}
	// Should contain VALIDATION_ERROR code
	if !bytes.Contains([]byte(errBody), []byte("VALIDATION_ERROR")) {
		t.Errorf("expected VALIDATION_ERROR in error body, got: %s", errBody)
	}
}

// ─── 6. Publish with text_input missing label → 200 + warnings (V006) ───────

func TestHTTP_Integ_PublishValidation_V006_Warning(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	// We test the /validate endpoint (dry-run) which returns warnings without blocking publish.
	artifactID := createViewViaAPI(t, srv, httpTestTenantID, "Publish Validation V006", "standard_crud", "opportunity")
	t.Cleanup(func() {
		repo := viewstudio.NewRepo(testPool)
		_ = repo.ArchiveView(t.Context(), httpTestTenantID, artifactID, httpTestUserID)
	})

	// Save a draft with text_input missing label
	draftReq := viewstudio.SaveDraftRequest{Payload: payloadWithTextInputNoLabel}
	draftBody, _ := json.Marshal(draftReq)
	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")

	draftResp := doRequest(t, http.MethodPut, fmt.Sprintf("%s/studio/views/%s/draft", srv.URL, artifactID), bytes.NewReader(draftBody), hdrs)
	defer draftResp.Body.Close()
	if draftResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(draftResp.Body)
		t.Fatalf("saveDraft: expected 200, got %d: %s", draftResp.StatusCode, body)
	}

	// Call validate endpoint with no body (uses current draft)
	valResp := doRequest(t, http.MethodPost, fmt.Sprintf("%s/studio/views/%s/validate", srv.URL, artifactID), bytes.NewReader([]byte(`{}`)), hdrs)
	defer valResp.Body.Close()

	// text_input without label has no hard errors, only warnings — expect 200
	if valResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(valResp.Body)
		t.Fatalf("validate: expected 200, got %d: %s", valResp.StatusCode, body)
	}

	var valResult viewstudio.ValidationResult
	if err := json.NewDecoder(valResp.Body).Decode(&valResult); err != nil {
		t.Fatalf("decode validation result: %v", err)
	}
	if len(valResult.Errors) != 0 {
		t.Errorf("expected no errors, got %d: %+v", len(valResult.Errors), valResult.Errors)
	}
	// Expect at least one V006 warning for the text_input without label
	hasV006 := false
	for _, w := range valResult.Warnings {
		if w.Code == "V006" {
			hasV006 = true
			break
		}
	}
	if !hasV006 {
		t.Errorf("expected V006 warning for text_input without label, got warnings: %+v", valResult.Warnings)
	}
}

// ─── 7. POST /studio/views/:key/validate (dry-run) → 200 or 422 ─────────────

func TestHTTP_Integ_ValidateRoute(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	artifactID := createViewViaAPI(t, srv, httpTestTenantID, "Validate Route Test", "custom_page", "project")
	t.Cleanup(func() {
		repo := viewstudio.NewRepo(testPool)
		_ = repo.ArchiveView(t.Context(), httpTestTenantID, artifactID, httpTestUserID)
	})

	// Save a valid draft first
	draftReq := viewstudio.SaveDraftRequest{Payload: minimalValidPayload}
	draftBody, _ := json.Marshal(draftReq)
	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")

	draftResp := doRequest(t, http.MethodPut, fmt.Sprintf("%s/studio/views/%s/draft", srv.URL, artifactID), bytes.NewReader(draftBody), hdrs)
	defer draftResp.Body.Close()
	if draftResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(draftResp.Body)
		t.Fatalf("saveDraft: expected 200, got %d: %s", draftResp.StatusCode, body)
	}

	// Validate the current draft (no body — falls back to current draft)
	valResp := doRequest(t, http.MethodPost, fmt.Sprintf("%s/studio/views/%s/validate", srv.URL, artifactID), bytes.NewReader([]byte(`{}`)), hdrs)
	defer valResp.Body.Close()

	// Valid payload should return 200
	if valResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(valResp.Body)
		t.Fatalf("validate: expected 200, got %d: %s", valResp.StatusCode, body)
	}

	var valResult viewstudio.ValidationResult
	if err := json.NewDecoder(valResp.Body).Decode(&valResult); err != nil {
		t.Fatalf("decode validation result: %v", err)
	}
	if len(valResult.Errors) != 0 {
		t.Errorf("valid payload should have no errors, got: %+v", valResult.Errors)
	}
}

// ─── 8. GET /studio/entities/nonexistent/fields → 404 ────────────────────────

func TestHTTP_Integ_EntityFields_Empty(t *testing.T) {
	srv := newIntegrationServer(t)
	defer srv.Close()

	hdrs := devHeaders(httpTestTenantID, httpTestUserID, "admin")
	resp := doRequest(t, http.MethodGet, srv.URL+"/studio/entities/nonexistent_entity_xyz/fields", nil, hdrs)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNotFound {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 404 for nonexistent entity, got %d: %s", resp.StatusCode, body)
	}

	var errResp map[string]json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	if _, ok := errResp["error"]; !ok {
		t.Error("expected structured error body with 'error' key")
	}
}
