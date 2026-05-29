# CLAUDE.md — Excellon NexAI Platform

> **Read this file completely before writing any code, creating any file, or making any decision.**
> This is the primary operating instruction file for Claude Code.

---

## What This Project Is

The **Excellon Enterprise Platform** is a metadata-driven enterprise application builder (v3.x, active production codebase). Business teams define data models (entities), rules, workflows, and UIs without writing code. Those definitions are stored as versioned artifacts, compiled server-side, and served to a runtime that renders fully functional CRUD applications and process workflows.

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
| Workflow Engine | `docs/prd/WORKFLOW-ENGINE.md` |
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
├── src/
│   ├── go/                          # Go backend service
│   │   ├── cmd/server/main.go       # Entry point
│   │   └── internal/
│   │       ├── admin/               # Studio API: artifacts, nodes, attributes, indexes
│   │       ├── compiler/            # 6-step entity schema compiler
│   │       ├── entityruntime/       # Entity CRUD handler + repo + computed fields
│   │       ├── expression/          # JSONata engine (goja VM pool)
│   │       ├── rules/               # Rules evaluator (ProductionEvaluator)
│   │       ├── workflow/            # Workflow state machine + SLA worker
│   │       ├── business_workflow/   # Multi-step process orchestration engine
│   │       ├── overlay/             # 5-layer overlay resolver
│   │       ├── pii/                 # AES-256-GCM encryption, vault, masking
│   │       ├── audit/               # Fire-and-forget audit trail
│   │       ├── recycle/             # Soft-delete + recycle bin
│   │       ├── retention/           # Data lifecycle policy resolution
│   │       ├── purge/               # Background lifecycle agent
│   │       ├── indexmgmt/           # Auto-index rules + DDL queue
│   │       ├── idgen/               # UUID v4/v7 generation
│   │       └── nlp/                 # NLP/AI layer (expression generation, field import)
│   │
│   ├── react/                       # React 19 frontend (TypeScript, Vite)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── admin/           # Entity Designer list, Rule Builder list
│   │       │   └── studio/          # Entity Editor, Workflow Canvas, Expression Studio
│   │       ├── components/
│   │       │   ├── studio/          # All framework UI components
│   │       │   └── expression/      # ExpressionEditor (Monaco + JSONata)
│   │       ├── config/
│   │       │   └── studioApi.ts     # All API calls — the ONLY place fetch() is called
│   │       └── design-system/       # excellon-design-system/ components + tokens
│   │
│   └── node/                        # Node.js middleware layer (TypeScript)
│       └── src/
│           ├── rules/               # TypeScript rules evaluator (mirrors Go)
│           └── overlay/             # TypeScript overlay resolver (mirrors Go)
│
├── db/
│   ├── migrations/                  # golang-migrate files: {timestamp}_{desc}.up.sql + .down.sql
│   ├── queries/                     # sqlc query files (when sqlc is used)
│   └── schema/                      # Canonical schema documentation
│
├── docs/
│   ├── AI-AGENT-GUIDE.md
│   ├── architecture/                # Tech standards documents
│   └── prd/                         # Subsystem PRDs
│
└── .claude/
    └── commands/                    # Custom Claude Code slash commands
```

---

## Technology Stack — Non-Negotiable

### Backend (Go)
- **Language:** Go 1.22+
- **Router:** `chi` v5
- **DB driver:** `pgx/v5` with `pgxpool.Pool`
- **JSONata runtime:** `goja` with embedded `jsonata-bundle.js`
- **UUID:** `github.com/google/uuid` — v4 default, v7 for time-ordered entities
- **Logging:** `log/slog` structured JSON
- **No ORM** — raw SQL via `pgx`, or `sqlc` for type-safe generated code

### Frontend (React)
- **Framework:** React 19, TypeScript (strict mode)
- **Build:** Vite
- **Server state:** TanStack Query v5
- **ER diagrams / Workflow canvas:** `@xyflow/react` v12
- **Code editor:** `@monaco-editor/react` (Monaco 0.52+)
- **HTTP:** `studioFetch<T>()` wrapper in `studioApi.ts` — never call `fetch()` directly
- **Design system:** excellon-design-system/ — see `docs/architecture/DESIGN-SYSTEM.md`

### Database
- **PostgreSQL 16+**
- Single `entity_record` table with `payload JSONB` for all entity records
- `compiled_artifact` table as the schema cache
- Redis for overlay resolution cache (6h TTL) — optional, graceful fallback

### Node.js layer
- **TypeScript** — mirrors Go rules evaluator and overlay resolver
- Used at API gateway level only

---

## Authentication — NONE During Initial Build

**There is no authentication in the initial build.** No JWT. No Keycloak. No OIDC.

All request context is provided via **dev-mode headers**. Every handler reads these headers:

| Header | Meaning |
|--------|---------|
| `x-tenant-id` | Active tenant ID |
| `x-user-id` | Acting user ID |
| `x-role` | Acting user role |

These headers are **always trusted** in this phase. The auth middleware slot exists in the router but is a passthrough that extracts these headers into the request context. Future auth integration will replace this middleware only — all handler code stays unchanged.

**Never add JWT validation, token parsing, or Keycloak calls to any handler.**

---

## The Compiled Schema Contract — Critical

This is the most important architectural rule:

> **Runtime code reads only `compiled_artifact`. Never the raw `artifact_version.payload`.**

The flow is always:
1. Admin edits in Entity Designer → saves to `artifact_version` (raw payload)
2. Publish → Go compiler runs 6-step pipeline → writes `compiled_artifact`
3. Entity Runtime, Rules Engine, Workflow Engine → all read from `compiled_artifact`

Adding a property to the artifact payload JSON has **no effect at runtime** unless the compiler (Step 3, 5, or pass-through in Step 5) is also updated to carry it into the compiled output.

---

## Key Design Principles

1. **Metadata-driven** — Every structural decision (fields, statuses, rules, workflows) is stored as a versioned artifact. No code changes needed to extend an entity.
2. **Compile-then-serve** — Raw artifact payload is never read at runtime. Publishing always compiles.
3. **Overlay inheritance** — Base schemas are customised per tenant/node/role through delta operations. 5-layer merge.
4. **Soft-delete everywhere** — Nothing is hard-deleted immediately. Records move through a lifecycle pipeline.
5. **Zero-downtime indexes** — All index changes via `CREATE INDEX CONCURRENTLY`. No table locks.
6. **Fire-and-forget audit** — Audit failures never block entity operations.
7. **Async post-operations** — Audit, workflow post-actions, SLA creation, outbox events are goroutines. Entity operations do not wait.

---

## Database Rules

- **All tables:** must have `tenant_id`, `created_at`, `updated_at`, `created_by`
- **Soft delete:** use `deleted_at TIMESTAMPTZ NULL` — never hard delete business data
- **Runtime queries:** always filter `AND deleted_at IS NULL`
- **Migrations:** golang-migrate format, in `db/migrations/`. Named `{timestamp}_{description}.up.sql`
- **No per-entity DDL:** Entity records go in `entity_record`. No new tables per entity type
- **Indexes:** all added via `CREATE INDEX CONCURRENTLY` through the index queue — never inline in migrations for production data tables
- **IDs:** UUID v7 for high-insert-rate entities (time-ordered), UUID v4 otherwise

---

## Code Style Rules

### Go
- Constructor injection — no global state, no init() singletons
- Interfaces at consumption sites — define interface where it's used, not where it's implemented
- No service layer between handler and repo for simple CRUD — handler calls repo directly
- Error wrapping: `fmt.Errorf("context: %w", err)`
- All SQL in handler/repo files — no inline SQL in business logic

### TypeScript / React
- Functional components and hooks only — no class components
- `studioApi.ts` is the only file that calls `fetch()` — all API calls go through it
- Local `useState` for editor state — no global store for the Entity Designer
- TanStack Query for all server state — `useQuery` / `useMutation`
- Strict TypeScript — no `any`, no `as unknown as X` hacks

### Both
- No new dependencies without creating an ADR in `docs/adr/`
- No hardcoded tenant IDs, user IDs, or role names in code
- No `console.log` in committed code (use `slog` in Go, structured logging in Node.js)

---

## Design System — excellon-design-system/

The project uses the **excellon-design-system/** located in `src/react/src/design-system/`.

**All UI components must come from the design system.** No raw HTML elements styled ad-hoc. No third-party component libraries (no MUI, no Ant Design, no Chakra).

Components live in `src/react/src/design-system/`. When a needed UI pattern doesn't exist in the design system, extend it there first before using it.

---

## Subsystem Quick Reference

| Subsystem | Go package | Key files | What it does |
|-----------|-----------|-----------|-------------|
| Artifact Versioning | `admin` | `handler.go` | Save/publish/version all metadata artifacts |
| Overlay System | `overlay` | `resolver.go` | 5-layer deepMerge before compilation |
| Go Compiler | `compiler` | `entity_schema.go` | 6-step pipeline → `compiled_artifact` |
| Entity Runtime | `entityruntime` | `handler.go`, `repo.go` | CRUD for entity records |
| Expression Engine | `expression` | `engine.go` | JSONata via goja VM pool |
| Rules Engine | `rules` | `production_evaluator.go` | Condition tree → BLOCK/WARN/SET_FIELD |
| Workflow Engine | `workflow` | `production_runtime.go` | Status state machine + SLA |
| Business Workflow | `business_workflow` | `engine.go` | Multi-step process orchestration |
| Node Tree | `admin` | `handler.go` (node routes) | Org hierarchy scoping |
| PII & Compliance | `pii` | `service.go`, `vault.go` | AES-256-GCM encrypt/mask/erase |
| Audit Trail | `audit` | `service.go` | Immutable change log |
| Data Lifecycle | `recycle`, `retention`, `purge` | `service.go`, `agent.go` | Soft delete → archive → purge pipeline |
| Index Management | `indexmgmt` | `service.go` | Auto-index DDL queue |
| NLP Layer | `nlp` | `handler.go` | AI-assisted field generation, expression authoring |

---

## What NOT to Do

- **Do not** create new database tables for business entity types — use `entity_record` with JSONB payload
- **Do not** read `artifact_version.payload` in runtime code — only `compiled_artifact`
- **Do not** add JWT parsing, Keycloak calls, or token validation
- **Do not** use third-party UI component libraries
- **Do not** hardcode roles, tenant IDs, or entity types in logic
- **Do not** add new npm/Go dependencies without an ADR
- **Do not** write raw `fetch()` calls in React — use `studioApi.ts`
- **Do not** add auth/permission logic to handler code — it belongs in middleware only
- **Do not** apply index changes inline in migrations — use the index queue
- **Do not** introduce a global React store (Zustand/Redux) for editor state — `useState` is correct

---

## When in Doubt

1. Check `docs/prd/` for the subsystem you're working on
2. Check existing code in the same package for patterns to follow
3. Check `docs/adr/` for prior decisions
4. If the answer isn't in docs and you're about to invent something new — stop, document the decision in a new ADR first

---

*This file is read by Claude Code at the start of every session. Keep it accurate and current.*
