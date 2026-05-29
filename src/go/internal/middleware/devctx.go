package middleware

import (
	"context"
	"net/http"
)

type contextKey string

const (
	TenantIDKey contextKey = "tenantID"
	UserIDKey   contextKey = "userID"
	RoleKey     contextKey = "role"
)

// DevContext extracts dev-mode request context headers into the request context.
// In this build there is no auth — headers are trusted as-is.
func DevContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		if v := r.Header.Get("x-tenant-id"); v != "" {
			ctx = context.WithValue(ctx, TenantIDKey, v)
		}
		if v := r.Header.Get("x-user-id"); v != "" {
			ctx = context.WithValue(ctx, UserIDKey, v)
		}
		if v := r.Header.Get("x-role"); v != "" {
			ctx = context.WithValue(ctx, RoleKey, v)
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
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
