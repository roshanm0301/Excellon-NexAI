# CLAUDE.md â€” Excellon NexAI Platform

> **Read this file completely before writing any code, creating any file, or making any decision.**
> This is the primary operating instruction file for Claude Code.

---

## What This Project Is


This is **not a greenfield project**. A sophisticated architecture already exists. Your job is to implement it faithfully, extend it deliberately, and never contradict it.

---

## Mandatory Reading Before Any Task

Before working on any subsystem, read the corresponding doc in `/docs/`:

| Task area | Read first |
|-----------|-----------|
| Any backend work | `docs/architecture/BACKEND-STANDARDS.md` |
| Any frontend work | `docs/architecture/FRONTEND-STANDARDS.md` |
| Entity Designer | `docs/prd/ENTITY-DESIGNER.md` |
| Rules Engine | `docs/prd/RULES-ENGINE.md` |
| Overlay System | `docs/prd/OVERLAY-SYSTEM.md` |
| Expression Engine | `docs/prd/EXPRESSION-ENGINE.md` |
| Data concerns (PII, audit, lifecycle) | `docs/prd/CROSS-CUTTING.md` |
| Database work | `docs/architecture/DATA-ARCHITECTURE.md` |
| Design system / UI | `docs/architecture/DESIGN-SYSTEM.md` |
| AI agent division of work | `docs/AI-AGENT-GUIDE.md` |

---

## Where It Lives

```
/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ go/                          # Go backend service
â”‚   â”‚   â”œâ”€â”€ cmd/server/main.go       # Entry point
â”‚   â”‚   â””â”€â”€ internal/
â”‚   â”‚       â”œâ”€â”€ admin/               # Studio API: artifacts, nodes, attributes, indexes
â”‚   â”‚       â”œâ”€â”€ compiler/            # 6-step entity schema compiler
â”‚   â”‚       â”œâ”€â”€ entityruntime/       # Entity CRUD handler + repo + computed fields
â”‚   â”‚       â”œâ”€â”€ expression/          # JSONata engine (goja VM pool)
â”‚   â”‚       â”œâ”€â”€ rules/               # Rules evaluator (ProductionEvaluator)
â”‚   â”‚       â”œâ”€â”€ overlay/             # 5-layer overlay resolver
â”‚   â”‚       â”œâ”€â”€ pii/                 # AES-256-GCM encryption, vault, masking
â”‚   â”‚       â”œâ”€â”€ audit/               # Fire-and-forget audit trail
â”‚   â”‚       â”œâ”€â”€ recycle/             # Soft-delete + recycle bin
â”‚   â”‚       â”œâ”€â”€ retention/           # Data lifecycle policy resolution
â”‚   â”‚       â”œâ”€â”€ purge/               # Background lifecycle agent
â”‚   â”‚       â”œâ”€â”€ indexmgmt/           # Auto-index rules + DDL queue
â”‚   â”‚       â”œâ”€â”€ idgen/               # UUID v4/v7 generation
â”‚   â”‚       â””â”€â”€ nlp/                 # NLP/AI layer (expression generation, field import)
â”‚   â”‚
â”‚   â”œâ”€â”€ react/                       # React 19 frontend (TypeScript, Vite)
â”‚   â”‚   â””â”€â”€ src/
â”‚   â”‚       â”œâ”€â”€ pages/
â”‚   â”‚       â”‚   â”œâ”€â”€ admin/           # Entity Designer list, Rule Builder list
â”‚   â”‚       â”œâ”€â”€ components/
â”‚   â”‚       â”‚   â”œâ”€â”€ studio/          # All framework UI components
â”‚   â”‚       â”‚   â””â”€â”€ expression/      # ExpressionEditor (Monaco + JSONata)
â”‚   â”‚       â”œâ”€â”€ config/
â”‚   â”‚       â”‚   â””â”€â”€ studioApi.ts     # All API calls â€” the ONLY place fetch() is called
â”‚   â”‚       â””â”€â”€ design-system/       # excellon-design-system/ components + tokens
â”‚   â”‚
â”‚   â””â”€â”€ node/                        # Node.js middleware layer (TypeScript)
â”‚       â””â”€â”€ src/
â”‚           â”œâ”€â”€ rules/               # TypeScript rules evaluator (mirrors Go)
â”‚           â””â”€â”€ overlay/             # TypeScript overlay resolver (mirrors Go)
â”‚
â”œâ”€â”€ db/
â”‚   â”œâ”€â”€ migrations/                  # golang-migrate files: {timestamp}_{desc}.up.sql + .down.sql
â”‚   â”œâ”€â”€ queries/                     # sqlc query files (when sqlc is used)
â”‚   â””â”€â”€ schema/                      # Canonical schema documentation
â”‚
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ AI-AGENT-GUIDE.md
â”‚   â”œâ”€â”€ architecture/                # Tech standards documents
â”‚   â””â”€â”€ prd/                         # Subsystem PRDs
â”‚
â””â”€â”€ .claude/
    â””â”€â”€ commands/                    # Custom Claude Code slash commands
```

---

## Technology Stack â€” Non-Negotiable

### Backend (Go)
- **Language:** Go 1.22+
- **Router:** `chi` v5
- **DB driver:** `pgx/v5` with `pgxpool.Pool`
- **JSONata runtime:** `goja` with embedded `jsonata-bundle.js`
- **UUID:** `github.com/google/uuid` â€” v4 default, v7 for time-ordered entities
- **Logging:** `log/slog` structured JSON
- **No ORM** â€” raw SQL via `pgx`, or `sqlc` for type-safe generated code

### Frontend (React)
- **Framework:** React 19, TypeScript (strict mode)
- **Build:** Vite
- **Server state:** TanStack Query v5
- **Code editor:** `@monaco-editor/react` (Monaco 0.52+)
- **HTTP:** `studioFetch<T>()` wrapper in `studioApi.ts` â€” never call `fetch()` directly
- **Design system:** excellon-design-system/ â€” see `docs/architecture/DESIGN-SYSTEM.md`

### Database
- **PostgreSQL 16+**
- Single `entity_record` table with `payload JSONB` for all entity records
- `compiled_artifact` table as the schema cache
- Redis for overlay resolution cache (6h TTL) â€” optional, graceful fallback

### Node.js layer
- **TypeScript** â€” mirrors Go rules evaluator and overlay resolver
- Used at API gateway level only

---

## Authentication â€” NONE During Initial Build

**There is no authentication in the initial build.** No JWT. No Keycloak. No OIDC.

All request context is provided via **dev-mode headers**. Every handler reads these headers:

| Header | Meaning |
|--------|---------|
| `x-tenant-id` | Active tenant ID |
| `x-user-id` | Acting user ID |
| `x-role` | Acting user role |

These headers are **always trusted** in this phase. The auth middleware slot exists in the router but is a passthrough that extracts these headers into the request context. Future auth integration will replace this middleware only â€” all handler code stays unchanged.

**Never add JWT validation, token parsing, or Keycloak calls to any handler.**

---

## The Compiled Schema Contract â€” Critical

This is the most important architectural rule:

> **Runtime code reads only `compiled_artifact`. Never the raw `artifact_version.payload`.**

The flow is always:
1. Admin edits in Entity Designer â†’ saves to `artifact_version` (raw payload)
2. Publish â†’ Go compiler runs 6-step pipeline â†’ writes `compiled_artifact`

Adding a property to the artifact payload JSON has **no effect at runtime** unless the compiler (Step 3, 5, or pass-through in Step 5) is also updated to carry it into the compiled output.

---

## Key Design Principles

2. **Compile-then-serve** â€” Raw artifact payload is never read at runtime. Publishing always compiles.
3. **Overlay inheritance** â€” Base schemas are customised per tenant/node/role through delta operations. 5-layer merge.
4. **Soft-delete everywhere** â€” Nothing is hard-deleted immediately. Records move through a lifecycle pipeline.
5. **Zero-downtime indexes** â€” All index changes via `CREATE INDEX CONCURRENTLY`. No table locks.
6. **Fire-and-forget audit** â€” Audit failures never block entity operations.

---

## Database Rules

- **All tables:** must have `tenant_id`, `created_at`, `updated_at`, `created_by`
- **Soft delete:** use `deleted_at TIMESTAMPTZ NULL` â€” never hard delete business data
- **Runtime queries:** always filter `AND deleted_at IS NULL`
- **Migrations:** golang-migrate format, in `db/migrations/`. Named `{timestamp}_{description}.up.sql`
- **No per-entity DDL:** Entity records go in `entity_record`. No new tables per entity type
- **Indexes:** all added via `CREATE INDEX CONCURRENTLY` through the index queue â€” never inline in migrations for production data tables
- **IDs:** UUID v7 for high-insert-rate entities (time-ordered), UUID v4 otherwise

---

## Code Style Rules

### Go
- Constructor injection â€” no global state, no init() singletons
- Interfaces at consumption sites â€” define interface where it's used, not where it's implemented
- No service layer between handler and repo for simple CRUD â€” handler calls repo directly
- Error wrapping: `fmt.Errorf("context: %w", err)`
- All SQL in handler/repo files â€” no inline SQL in business logic

### TypeScript / React
- Functional components and hooks only â€” no class components
- `studioApi.ts` is the only file that calls `fetch()` â€” all API calls go through it
- Local `useState` for editor state â€” no global store for the Entity Designer
- TanStack Query for all server state â€” `useQuery` / `useMutation`
- Strict TypeScript â€” no `any`, no `as unknown as X` hacks

### Both
- No new dependencies without creating an ADR in `docs/adr/`
- No hardcoded tenant IDs, user IDs, or role names in code
- No `console.log` in committed code (use `slog` in Go, structured logging in Node.js)

---

## Design System â€” excellon-design-system/

The project uses the **excellon-design-system/** located in `src/react/src/design-system/`.

**All UI components must come from the design system.** No raw HTML elements styled ad-hoc. No third-party component libraries (no MUI, no Ant Design, no Chakra).

Components live in `src/react/src/design-system/`. When a needed UI pattern doesn't exist in the design system, extend it there first before using it.

---

## Subsystem Quick Reference

| Subsystem | Go package | Key files | What it does |
|-----------|-----------|-----------|-------------|
| Artifact Versioning | `admin` | `handler.go` | Save/publish/version all metadata artifacts |
| Overlay System | `overlay` | `resolver.go` | 5-layer deepMerge before compilation |
| Go Compiler | `compiler` | `entity_schema.go` | 6-step pipeline â†’ `compiled_artifact` |
| Entity Runtime | `entityruntime` | `handler.go`, `repo.go` | CRUD for entity records |
| Expression Engine | `expression` | `engine.go` | JSONata via goja VM pool |
| Rules Engine | `rules` | `production_evaluator.go` | Condition tree â†’ BLOCK/WARN/SET_FIELD |
| Node Tree | `admin` | `handler.go` (node routes) | Org hierarchy scoping |
| PII & Compliance | `pii` | `service.go`, `vault.go` | AES-256-GCM encrypt/mask/erase |
| Audit Trail | `audit` | `service.go` | Immutable change log |
| Data Lifecycle | `recycle`, `retention`, `purge` | `service.go`, `agent.go` | Soft delete â†’ archive â†’ purge pipeline |
| Index Management | `indexmgmt` | `service.go` | Auto-index DDL queue |
| NLP Layer | `nlp` | `handler.go` | AI-assisted field generation, expression authoring |

---

## What NOT to Do

- **Do not** create new database tables for business entity types â€” use `entity_record` with JSONB payload
- **Do not** read `artifact_version.payload` in runtime code â€” only `compiled_artifact`
- **Do not** add JWT parsing, Keycloak calls, or token validation
- **Do not** use third-party UI component libraries
- **Do not** hardcode roles, tenant IDs, or entity types in logic
- **Do not** add new npm/Go dependencies without an ADR
- **Do not** write raw `fetch()` calls in React â€” use `studioApi.ts`
- **Do not** add auth/permission logic to handler code â€” it belongs in middleware only
- **Do not** apply index changes inline in migrations â€” use the index queue
- **Do not** introduce a global React store (Zustand/Redux) for editor state â€” `useState` is correct

---

## Mandatory Testing Standards

These rules are permanent and apply to ALL future development:

### Every feature must have a Playwright integration test
- Config: `src/react/playwright.integration.config.ts`
- All tests in `src/react/e2e/integration/**/*.spec.ts`
- **VITE_MSW must be `false`** — tests call the real Go backend via Vite proxy
- Run: `make test-e2e` or `cd src/react && npm run e2e:integration`

### Every repo method must have a Go integration test
- Build tag: `//go:build integration`
- Tests in `src/go/internal/<package>/repo_integration_test.go`
- Run: `make test-integration`

### Infrastructure lifecycle
```bash
# Start test backend (postgres + Go server on :9080)
bash scripts/start-test-backend.sh

# Apply DMS seed data
bash db/seeds/seed_all.sh

# Stop
bash scripts/stop-test-backend.sh
```

### Two Playwright configs
| Config | File | VITE_MSW | Use |
|--------|------|----------|-----|
| Smoke | `playwright.config.ts` | `true` | Quick check: page loads |
| Integration | `playwright.integration.config.ts` | `false` | Full-stack: browser→Go→PostgreSQL |

### Full-stack test wiring
```
Chrome (Playwright)
  └─ http://localhost:5174/Excellon-NexAI/   (Vite dev, VITE_MSW=false)
       └─ proxy /api → http://localhost:9080
            └─ Go backend (PORT=9080, NEXAI_AUTH_MODE=local)
                 └─ PostgreSQL 16 via Docker (host port 5433)
```

Auth in tests: `NEXAI_AUTH_MODE=local` — dev headers `x-tenant-id / x-user-id / x-role: admin` are trusted.

### DMS domain entities seeded
Entities seeded in `db/seeds/test_entities.sql`: vehicle, customer, supplier, parts, employee, technician, finance_company, part_category, sale_order, service_order, purchase_order, parts_request.

Views seeded in `db/seeds/test_views.sql`: 14 views across 5 surface types (standard_crud, header_line, dashboard, wizard, split_panel).

---

## When in Doubt

1. Check `docs/prd/` for the subsystem you're working on
2. Check existing code in the same package for patterns to follow
3. Check `docs/adr/` for prior decisions
4. If the answer isn't in docs and you're about to invent something new â€” stop, document the decision in a new ADR first

---

*This file is read by Claude Code at the start of every session. Keep it accurate and current.*
