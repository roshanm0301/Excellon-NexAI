package viewstudio

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/excellon/nexai/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func TestRuntimeGetViewByCodeRequiresEntityAndSurface(t *testing.T) {
	h := NewHandler(nil)
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(middleware.DevContext)
	r.Route("/studio", h.RegisterRoutes)

	req := httptest.NewRequest(http.MethodGet, "/studio/runtime/views/by-code/sale_order_default", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"code":"BAD_REQUEST"`) {
		t.Fatalf("expected structured BAD_REQUEST body, got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"trace_id"`) {
		t.Fatalf("expected trace_id in body, got %s", rec.Body.String())
	}
}

func TestPluginRoutesDisabledByDefault(t *testing.T) {
	h := NewHandler(nil)
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(middleware.DevContext)
	r.Route("/studio", h.RegisterRoutes)

	req := httptest.NewRequest(http.MethodGet, "/studio/plugins", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "plugin management is disabled") {
		t.Fatalf("expected disabled plugin message, got %s", rec.Body.String())
	}
}
