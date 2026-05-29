package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/excellon/nexai/internal/admin"
	"github.com/excellon/nexai/internal/compiler"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/entityruntime"
	"github.com/excellon/nexai/internal/expression"
	"github.com/excellon/nexai/internal/middleware"
	"github.com/excellon/nexai/internal/rules"
	"github.com/excellon/nexai/internal/workflow"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel(),
	}))
	slog.SetDefault(logger)

	pool, err := db.NewPool(context.Background(), mustEnv("DATABASE_URL"))
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Ensure runtime-created tables exist
	rulesRepo := rules.NewRepo(pool)
	if err := rulesRepo.EnsureTable(context.Background()); err != nil {
		slog.Warn("rules table ensure failed", "error", err)
	}

	// Initialise services
	artifactRepo := admin.NewArtifactRepo(pool)
	compilerSvc := compiler.NewService(pool)
	artifactHandler := admin.NewArtifactHandler(artifactRepo, compilerSvc)

	entityRepo := entityruntime.NewRepo(pool)
	entityHandler := entityruntime.NewHandler(entityRepo)

	rulesEvaluator := rules.NewProductionEvaluator()
	rulesHandler := rules.NewHandler(rulesRepo, rulesEvaluator)

	workflowRuntime := workflow.NewRuntime(pool)
	_ = workflowRuntime // used by entity handler in Phase 4 integration

	// Expression engine — graceful degradation if no jsonata bundle
	exprEngine := expression.NewEngine("")
	_ = exprEngine // wired into entity runtime in Phase 4

	// SLA worker — runs in background
	slaWorker := workflow.NewSLAWorker(pool, 5*time.Minute)
	workerCtx, cancelWorker := context.WithCancel(context.Background())
	go slaWorker.Start(workerCtx)

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.DevContext)

	r.Get("/health", healthHandler(pool))

	r.Route("/api", func(r chi.Router) {
		r.Route("/artifacts", func(r chi.Router) {
			artifactHandler.RegisterRoutes(r)
		})
		r.Route("/entities/{entityType}", func(r chi.Router) {
			entityHandler.RegisterRoutes(r)
		})
		r.Route("/rules", func(r chi.Router) {
			rulesHandler.RegisterRoutes(r)
		})
	})

	port := envOr("PORT", "8080")
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	slog.Info("server starting", "port", port)

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-stop
	slog.Info("shutting down")

	cancelWorker()
	slaWorker.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "error", err)
	}
	slog.Info("server stopped")
}

func healthHandler(pool *db.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "ok"
		if err := pool.Ping(r.Context()); err != nil {
			slog.Error("health check db ping failed", "error", err)
			dbStatus = "error"
		}

		status := "ok"
		httpStatus := http.StatusOK
		if dbStatus != "ok" {
			status = "degraded"
			httpStatus = http.StatusServiceUnavailable
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(httpStatus)
		fmt.Fprintf(w, `{"status":%q,"db":%q,"ts":%q}`, status, dbStatus, time.Now().UTC().Format(time.RFC3339))
	}
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		slog.Error("required environment variable not set", "key", key)
		os.Exit(1)
	}
	return v
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func logLevel() slog.Level {
	switch os.Getenv("LOG_LEVEL") {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
