package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	chimw "github.com/go-chi/chi/v5/middleware"
)

type contextKey string

const (
	TenantIDKey contextKey = "tenantID"
	UserIDKey   contextKey = "userID"
	RoleKey     contextKey = "role"
)

const (
	defaultLocalTenantID = "00000000-0000-0000-0000-000000000001"
	defaultLocalUserID   = "00000000-0000-0000-0000-000000000001"
	defaultLocalRole     = "admin"
)

// AuthConfig controls request identity extraction. Local mode is the only mode
// that accepts browser-supplied x-tenant-id/x-user-id/x-role headers.
type AuthConfig struct {
	Mode          string
	JWTSecret     string
	Issuer        string
	Audience      string
	LocalTenantID string
	LocalUserID   string
	LocalRole     string
}

type authError struct {
	status  int
	code    string
	message string
}

func (e authError) Error() string {
	return e.message
}

// AuthConfigFromEnv returns a production-safe default. Without
// NEXAI_AUTH_MODE=local, dev identity headers are ignored.
func AuthConfigFromEnv() AuthConfig {
	return AuthConfig{
		Mode:          envOr("NEXAI_AUTH_MODE", "jwt"),
		JWTSecret:     os.Getenv("NEXAI_JWT_HS256_SECRET"),
		Issuer:        os.Getenv("NEXAI_JWT_ISSUER"),
		Audience:      os.Getenv("NEXAI_JWT_AUDIENCE"),
		LocalTenantID: envOr("NEXAI_LOCAL_TENANT_ID", defaultLocalTenantID),
		LocalUserID:   envOr("NEXAI_LOCAL_USER_ID", defaultLocalUserID),
		LocalRole:     envOr("NEXAI_LOCAL_ROLE", defaultLocalRole),
	}
}

// AuthContext authenticates requests and injects tenant/user/role into context.
func AuthContext(cfg AuthConfig) func(http.Handler) http.Handler {
	mode := strings.ToLower(strings.TrimSpace(cfg.Mode))
	if mode == "" {
		mode = "jwt"
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, err := authenticateRequest(r, cfg, mode)
			if err != nil {
				var authErr authError
				if !errors.As(err, &authErr) {
					authErr = authError{status: http.StatusUnauthorized, code: "AUTH_REQUIRED", message: "authentication required"}
				}
				writeAuthError(w, r, authErr.status, authErr.code, authErr.message)
				return
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// DevContext is retained for tests and explicit local-only callers.
func DevContext(next http.Handler) http.Handler {
	return AuthContext(AuthConfig{
		Mode:          "local",
		LocalTenantID: defaultLocalTenantID,
		LocalUserID:   defaultLocalUserID,
		LocalRole:     defaultLocalRole,
	})(next)
}

// RequireRole allows admin by default and otherwise requires one of the listed roles.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := map[string]bool{"admin": true}
	for _, role := range roles {
		if role != "" {
			allowed[strings.ToLower(role)] = true
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := strings.ToLower(Role(r.Context()))
			if role == "" || !allowed[role] {
				writeAuthError(w, r, http.StatusForbidden, "FORBIDDEN", "insufficient role for this operation")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func authenticateRequest(r *http.Request, cfg AuthConfig, mode string) (context.Context, error) {
	switch mode {
	case "local", "dev", "development":
		tenantID := firstNonEmpty(r.Header.Get("x-tenant-id"), cfg.LocalTenantID, defaultLocalTenantID)
		userID := firstNonEmpty(r.Header.Get("x-user-id"), cfg.LocalUserID, defaultLocalUserID)
		role := firstNonEmpty(r.Header.Get("x-role"), cfg.LocalRole, defaultLocalRole)
		return withIdentity(r.Context(), tenantID, userID, role), nil
	case "jwt", "oidc":
		tenantID, userID, role, err := claimsFromBearer(r, cfg)
		if err != nil {
			return nil, err
		}
		return withIdentity(r.Context(), tenantID, userID, role), nil
	default:
		return nil, authError{status: http.StatusInternalServerError, code: "AUTH_MODE_UNSUPPORTED", message: "unsupported authentication mode"}
	}
}

func claimsFromBearer(r *http.Request, cfg AuthConfig) (string, string, string, error) {
	if cfg.JWTSecret == "" {
		return "", "", "", authError{status: http.StatusServiceUnavailable, code: "AUTH_NOT_CONFIGURED", message: "JWT authentication is not configured"}
	}

	auth := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return "", "", "", authError{status: http.StatusUnauthorized, code: "AUTH_REQUIRED", message: "bearer token is required"}
	}

	claims, err := verifyHS256JWT(strings.TrimSpace(auth[7:]), []byte(cfg.JWTSecret))
	if err != nil {
		return "", "", "", authError{status: http.StatusUnauthorized, code: "AUTH_INVALID", message: "bearer token is invalid"}
	}
	if err := validateJWTClaims(claims, cfg); err != nil {
		return "", "", "", err
	}

	tenantID := claimString(claims, "tenant_id", "tid", "tenant")
	userID := claimString(claims, "sub", "user_id", "uid")
	role := claimString(claims, "role")
	if role == "" {
		role = firstClaimArrayValue(claims, "roles")
	}
	if tenantID == "" || userID == "" || role == "" {
		return "", "", "", authError{status: http.StatusUnauthorized, code: "AUTH_CLAIMS_MISSING", message: "token must include tenant, user, and role claims"}
	}
	return tenantID, userID, role, nil
}

func verifyHS256JWT(token string, secret []byte) (map[string]any, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed token")
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, err
	}
	var header map[string]any
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return nil, err
	}
	if alg, _ := header["alg"].(string); alg != "HS256" {
		return nil, errors.New("unsupported alg")
	}

	signingInput := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(signingInput))
	expected := mac.Sum(nil)
	got, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, err
	}
	if !hmac.Equal(got, expected) {
		return nil, errors.New("invalid signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}
	var claims map[string]any
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, err
	}
	return claims, nil
}

func validateJWTClaims(claims map[string]any, cfg AuthConfig) error {
	now := time.Now().Unix()
	if exp, ok := numericClaim(claims, "exp"); ok && exp <= now {
		return authError{status: http.StatusUnauthorized, code: "AUTH_EXPIRED", message: "bearer token is expired"}
	}
	if nbf, ok := numericClaim(claims, "nbf"); ok && nbf > now {
		return authError{status: http.StatusUnauthorized, code: "AUTH_NOT_YET_VALID", message: "bearer token is not yet valid"}
	}
	if cfg.Issuer != "" && claimString(claims, "iss") != cfg.Issuer {
		return authError{status: http.StatusUnauthorized, code: "AUTH_ISSUER_INVALID", message: "bearer token issuer is invalid"}
	}
	if cfg.Audience != "" && !claimAudienceMatches(claims["aud"], cfg.Audience) {
		return authError{status: http.StatusUnauthorized, code: "AUTH_AUDIENCE_INVALID", message: "bearer token audience is invalid"}
	}
	return nil
}

func withIdentity(ctx context.Context, tenantID, userID, role string) context.Context {
	ctx = context.WithValue(ctx, TenantIDKey, tenantID)
	ctx = context.WithValue(ctx, UserIDKey, userID)
	ctx = context.WithValue(ctx, RoleKey, role)
	return ctx
}

func TenantID(ctx context.Context) string {
	v, _ := ctx.Value(TenantIDKey).(string)
	return v
}

func UserID(ctx context.Context) string {
	v, _ := ctx.Value(UserIDKey).(string)
	return v
}

func Role(ctx context.Context) string {
	v, _ := ctx.Value(RoleKey).(string)
	return v
}

func writeAuthError(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	traceID := chimw.GetReqID(r.Context())
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error": map[string]any{
			"code":     code,
			"message":  message,
			"trace_id": traceID,
		},
	})
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func claimString(claims map[string]any, keys ...string) string {
	for _, key := range keys {
		if v, ok := claims[key].(string); ok && v != "" {
			return v
		}
	}
	return ""
}

func firstClaimArrayValue(claims map[string]any, key string) string {
	values, ok := claims[key].([]any)
	if !ok || len(values) == 0 {
		return ""
	}
	value, _ := values[0].(string)
	return value
}

func numericClaim(claims map[string]any, key string) (int64, bool) {
	switch v := claims[key].(type) {
	case float64:
		return int64(v), true
	case int64:
		return v, true
	case json.Number:
		n, err := v.Int64()
		return n, err == nil
	default:
		return 0, false
	}
}

func claimAudienceMatches(raw any, expected string) bool {
	switch aud := raw.(type) {
	case string:
		return aud == expected
	case []any:
		for _, item := range aud {
			if item == expected {
				return true
			}
		}
	}
	return false
}
