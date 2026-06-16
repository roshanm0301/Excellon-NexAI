package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	chimw "github.com/go-chi/chi/v5/middleware"
)

func TestAuthContext_LocalModeAcceptsDevHeaders(t *testing.T) {
	handler := chimw.RequestID(AuthContext(AuthConfig{Mode: "local"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := TenantID(r.Context()); got != "tenant-local" {
			t.Fatalf("TenantID = %q", got)
		}
		if got := UserID(r.Context()); got != "user-local" {
			t.Fatalf("UserID = %q", got)
		}
		if got := Role(r.Context()); got != "designer" {
			t.Fatalf("Role = %q", got)
		}
		w.WriteHeader(http.StatusNoContent)
	})))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("x-tenant-id", "tenant-local")
	req.Header.Set("x-user-id", "user-local")
	req.Header.Set("x-role", "designer")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d", rec.Code)
	}
}

func TestAuthContext_JWTModeRejectsMissingBearerAndDevHeaderSpoof(t *testing.T) {
	handler := chimw.RequestID(AuthContext(AuthConfig{Mode: "jwt", JWTSecret: "secret"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("x-tenant-id", "spoofed-tenant")
	req.Header.Set("x-user-id", "spoofed-user")
	req.Header.Set("x-role", "admin")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), `"code":"AUTH_REQUIRED"`) {
		t.Fatalf("expected structured AUTH_REQUIRED body, got %s", rec.Body.String())
	}
}

func TestAuthContext_JWTModeUsesTokenClaimsNotDevHeaders(t *testing.T) {
	handler := chimw.RequestID(AuthContext(AuthConfig{Mode: "jwt", JWTSecret: "secret"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := TenantID(r.Context()); got != "tenant-token" {
			t.Fatalf("TenantID = %q", got)
		}
		if got := UserID(r.Context()); got != "user-token" {
			t.Fatalf("UserID = %q", got)
		}
		if got := Role(r.Context()); got != "viewer" {
			t.Fatalf("Role = %q", got)
		}
		w.WriteHeader(http.StatusNoContent)
	})))

	token := signTestJWT(t, "secret", map[string]any{
		"tenant_id": "tenant-token",
		"sub":       "user-token",
		"role":      "viewer",
		"exp":       time.Now().Add(time.Hour).Unix(),
	})
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("x-tenant-id", "spoofed-tenant")
	req.Header.Set("x-user-id", "spoofed-user")
	req.Header.Set("x-role", "admin")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d body=%s", rec.Code, rec.Body.String())
	}
}

func TestRequireRoleRejectsViewerMutation(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	req = req.WithContext(withIdentity(req.Context(), "tenant", "user", "viewer"))
	rec := httptest.NewRecorder()

	chimw.RequestID(RequireRole("designer")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))).ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d", rec.Code)
	}
}

func signTestJWT(t *testing.T, secret string, claims map[string]any) string {
	t.Helper()
	header := map[string]any{"alg": "HS256", "typ": "JWT"}
	headerJSON, err := json.Marshal(header)
	if err != nil {
		t.Fatal(err)
	}
	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		t.Fatal(err)
	}
	encodedHeader := base64.RawURLEncoding.EncodeToString(headerJSON)
	encodedClaims := base64.RawURLEncoding.EncodeToString(claimsJSON)
	signingInput := encodedHeader + "." + encodedClaims
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signingInput))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return signingInput + "." + sig
}
