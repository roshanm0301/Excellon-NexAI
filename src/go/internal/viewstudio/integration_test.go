//go:build integration

package viewstudio_test

import (
	"context"
	"log/slog"
	"os"
	"testing"

	"github.com/excellon/nexai/internal/db"
)

var testPool *db.Pool

func TestMain(m *testing.M) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://nexai:nexai@localhost:5433/nexai?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		slog.Error("integration: cannot connect to database", "error", err, "dsn", dsn)
		os.Exit(1)
	}
	testPool = pool
	defer pool.Close()

	os.Exit(m.Run())
}
