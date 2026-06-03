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
	"github.com/excellon/nexai/internal/indexmgmt"
	"github.com/excellon/nexai/internal/middleware"
	"github.com/excellon/nexai/internal/nlp"
	"github.com/excellon/nexai/internal/overlay"
	"github.com/excellon/nexai/internal/pii"
	"github.com/excellon/nexai/internal/purge"
	"github.com/excellon/nexai/internal/recycle"
	"github.com/excellon/nexai/internal/retention"
	"github.com/excellon/nexai/internal/rules"
	"github.com/excellon/nexai/internal/monitoring"
	"github.com/excellon/nexai/internal/viewstudio"
	"github.com/excellon/nexai/internal/workflow"
	business_workflow "github.com/excellon/nexai/internal/business_workflow"
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

	// Initialize Redis cache for overlay resolution (graceful degradation)
	var overlayCache *overlay.Cache
	if cache, cacheErr := overlay.NewCache(os.Getenv("REDIS_URL")); cacheErr != nil {
		slog.Warn("Redis unavailable, overlay cache disabled", "err", cacheErr)
	} else {
		overlayCache = cache
	}

	// Initialize overlay resolver and handler
	overlayResolver := overlay.NewResolver(pool, overlayCache)
	overlayRepo := overlay.NewRepo(pool)
	overlayHandler := overlay.NewHandler(overlayRepo, overlayResolver)

	// Initialise services — compiler now wired with overlay resolver
	artifactRepo := admin.NewArtifactRepo(pool)
	compilerSvc := compiler.NewServiceWithOverlay(pool, overlayResolver)
	artifactHandler := admin.NewArtifactHandler(artifactRepo, compilerSvc)

	// PII service
	piiService := pii.NewService(os.Getenv("PII_MASTER_KEY"))
	_ = piiService // wired into entity runtime as needed

	entityRepo := entityruntime.NewRepo(pool)
	entityHandler := entityruntime.NewHandlerWithPool(entityRepo, pool)

	rulesEvaluator := rules.NewProductionEvaluator()
	rulesHandler := rules.NewHandler(rulesRepo, rulesEvaluator)
	rulesExecLogger := rules.NewExecutionLogger(pool)
	rulesConflictResolver := rules.NewConflictResolver(pool)
	rulesEvalV2 := rules.NewEvaluatorV2(pool, expression.NewEngine(""), rulesConflictResolver, rulesExecLogger)
	rulesSimulator := rules.NewSimulator(rulesEvalV2, rulesExecLogger)
	rulesHandlerV2 := rules.NewHandlerV2(rulesSimulator, rulesConflictResolver, rulesExecLogger, rulesRepo)

	workflowRuntime := workflow.NewRuntime(pool)
	_ = workflowRuntime

	// Expression engine
	exprEngine := expression.NewEngine("")
	expressionHandler := expression.NewHandler(exprEngine)

	// SLA worker — runs in background
	slaWorker := workflow.NewSLAWorker(pool, 5*time.Minute)
	workerCtx, cancelWorker := context.WithCancel(context.Background())
	go slaWorker.Start(workerCtx)

	// Business workflow engine
	bwEngine := business_workflow.NewEngine(pool)
	bwRepo := business_workflow.NewRepo(pool)
	if err := bwRepo.EnsureTables(context.Background()); err != nil {
		slog.Warn("business workflow tables ensure failed", "error", err)
	}
	bwHandler := business_workflow.NewHandler(bwEngine, pool)
	bwHandlerV2 := business_workflow.NewHandlerV2(pool, exprEngine)

	// NLP handler
	nlpHandler := nlp.NewHandler(os.Getenv("ANTHROPIC_API_KEY"), "claude-haiku-4-5-20251001")

	// View Studio
	viewStudioRepo := viewstudio.NewRepo(pool)
	viewStudioHandler := viewstudio.NewHandler(viewStudioRepo)

	// Monitoring
	monitoringHandler := monitoring.NewHandler(pool)

	// Index management
	indexService := indexmgmt.NewService(pool)
	indexHandler := indexmgmt.NewHandler(indexService)

	// Recycle bin
	recycleService := recycle.NewService(pool)
	recycleHandler := recycle.NewHandler(recycleService)

	// Retention + Purge
	retentionService := retention.NewService()
	purgeAgent := purge.NewAgent(pool, retentionService)
	go purgeAgent.Start(workerCtx)

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.DevContext)

	r.Get("/health", healthHandler(pool))

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/artifacts", func(r chi.Router) {
			artifactHandler.RegisterRoutes(r)
		})
		r.Route("/entities/{entityType}", func(r chi.Router) {
			entityHandler.RegisterRoutes(r)
		})
		r.Route("/admin", func(r chi.Router) {
			r.Route("/rules", func(r chi.Router) {
				rulesHandler.RegisterRoutes(r)
				r.Route("/v2", func(r chi.Router) {
					rulesHandlerV2.RegisterRoutes(r)
				})
			})
			r.Route("/overlay-deltas", func(r chi.Router) {
				overlayHandler.RegisterRoutes(r)
			})
			r.Route("/indexes", func(r chi.Router) {
				indexHandler.RegisterRoutes(r)
			})
			r.Route("/recycle-bin", func(r chi.Router) {
				recycleHandler.RegisterRoutes(r)
			})
		})
		r.Route("/expressions", func(r chi.Router) {
			expressionHandler.RegisterRoutes(r)
		})
		r.Route("/processes", func(r chi.Router) {
			bwHandler.RegisterRoutes(r)
		})
		r.Route("/workflows", func(r chi.Router) {
			bwHandlerV2.RegisterRoutesV2(r)
		})
		r.Route("/studio", func(r chi.Router) {
			viewStudioHandler.RegisterRoutes(r)
		})
		r.Route("/monitoring", func(r chi.Router) {
			monitoringHandler.RegisterRoutes(r)
		})
	})
	r.Route("/api/nlp", func(r chi.Router) {
		nlpHandler.RegisterRoutes(r)
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
	purgeAgent.Stop()

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
