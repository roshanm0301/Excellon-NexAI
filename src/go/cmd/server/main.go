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
	"github.com/excellon/nexai/internal/nodestudio"
	"github.com/excellon/nexai/internal/overlay"
	"github.com/excellon/nexai/internal/pii"
	"github.com/excellon/nexai/internal/purge"
	"github.com/excellon/nexai/internal/recycle"
	"github.com/excellon/nexai/internal/retention"
	"github.com/excellon/nexai/internal/viewstudio"
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

	runtimePolicy := entityruntime.NewRuntimePolicy(pool, nil)
	entityHandler.SetRuntimePolicy(runtimePolicy)

	// Expression engine
	exprEngine := expression.NewEngine("")
	expressionHandler := expression.NewHandler(exprEngine)

	// NLP handler
	nlpHandler := nlp.NewHandler(os.Getenv("ANTHROPIC_API_KEY"), "claude-haiku-4-5-20251001")

	// View Studio
	viewStudioRepo := viewstudio.NewRepo(pool)
	viewStudioHandler := viewstudio.NewHandler(viewStudioRepo, viewstudio.HandlerOptions{
		PluginsEnabled: envBool("NEXAI_STUDIO_PLUGINS_ENABLED", false),
	})

	// Organisation node studio
	nodeRepo := nodestudio.NewRepo(pool)
	nodeHandler := nodestudio.NewHandler(nodeRepo)

	// Index management
	indexService := indexmgmt.NewService(pool)
	indexHandler := indexmgmt.NewHandler(indexService)

	// Recycle bin
	recycleService := recycle.NewService(pool)
	recycleHandler := recycle.NewHandler(recycleService)

	// Retention + Purge
	retentionService := retention.NewService()
	purgeAgent := purge.NewAgent(pool, retentionService)
	purgeCtx, cancelPurge := context.WithCancel(context.Background())
	go purgeAgent.Start(purgeCtx)

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)

	r.Get("/health", healthHandler(pool))

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.AuthContext(middleware.AuthConfigFromEnv()))
		r.Route("/artifacts", func(r chi.Router) {
			artifactHandler.RegisterRoutes(r)
		})
		r.Route("/entities/{entityType}", func(r chi.Router) {
			entityHandler.RegisterRoutes(r)
		})
		r.Route("/admin", func(r chi.Router) {
			r.Route("/overlay-deltas", func(r chi.Router) {
				overlayHandler.RegisterRoutes(r)
			})
			r.Route("/indexes", func(r chi.Router) {
				indexHandler.RegisterRoutes(r)
			})
			r.Route("/nodes", func(r chi.Router) {
				nodeHandler.RegisterRoutes(r)
			})
			r.Route("/recycle-bin", func(r chi.Router) {
				recycleHandler.RegisterRoutes(r)
			})
		})
		r.Route("/expressions", func(r chi.Router) {
			expressionHandler.RegisterRoutes(r)
		})
		r.Route("/studio", func(r chi.Router) {
			viewStudioHandler.RegisterRoutes(r)
		})
	})
	if envBool("NEXAI_AI_FEATURES_ENABLED", false) {
		r.Route("/api/nlp", func(r chi.Router) {
			r.Use(middleware.AuthContext(middleware.AuthConfigFromEnv()))
			nlpHandler.RegisterRoutes(r)
		})
		r.Route("/api/v1/nlp", func(r chi.Router) {
			r.Use(middleware.AuthContext(middleware.AuthConfigFromEnv()))
			nlpHandler.RegisterRoutes(r)
		})
	}

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

	cancelPurge()
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

func envBool(key string, fallback bool) bool {
	switch os.Getenv(key) {
	case "1", "true", "TRUE", "yes", "YES", "on", "ON":
		return true
	case "0", "false", "FALSE", "no", "NO", "off", "OFF":
		return false
	default:
		return fallback
	}
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
