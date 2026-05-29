# AI-AGENT-GUIDE.md — Claude Code & GitHub Copilot Division of Work

> **Audience:** Claude Code (primary), GitHub Copilot (secondary)
> **Purpose:** Define exactly what each agent does, when to switch, and the handoff protocol

---

## The Core Rule

> **Claude Code sets the pattern. Copilot follows it.**

Claude Code is responsible for all architectural decisions, complex subsystems, security-sensitive code, and establishing canonical patterns. GitHub Copilot is responsible for high-volume repetitive work — replicating established patterns at speed.

A pattern that Copilot has not yet seen established by Claude Code must not be invented by Copilot. It must wait.

---

## Claude Code — Full Ownership Areas

Claude Code must own these without exception:

### Framework Subsystems
- All of `src/go/internal/compiler/` — the 6-step entity schema compiler
- All of `src/go/internal/overlay/` — 5-layer overlay resolver
- All of `src/go/internal/pii/` — encryption, vault, masking
- All of `src/go/internal/audit/` — audit trail service
- All of `src/go/internal/expression/` — JSONata goja VM pool
- All of `src/go/internal/rules/production_evaluator.go` — rule evaluation engine
- All of `src/go/internal/workflow/production_runtime.go` — workflow state machine
- All of `src/go/internal/business_workflow/` — process orchestration engine
- All of `src/go/internal/indexmgmt/` — index queue and DDL generation

### Architecture-level decisions
- New database table schemas
- New Go package structures
- New gRPC/REST interface definitions
- Any code touching `compiled_artifact` read/write paths
- Any code that processes `pii_category` fields
- Middleware chain modifications

### Security-sensitive code
- Dev-mode header extraction middleware
- Any code that reads `x-tenant-id`, `x-user-id`, `x-role` headers
- PII encryption and decryption paths
- Overlay cache invalidation

### New patterns
- The first handler of any new type
- The first repository function using a new SQL pattern
- The first React component using a new design system pattern
- The first TanStack Query hook for a new API endpoint group

---

## GitHub Copilot — Approved Areas

Copilot can work on these **after Claude Code has established the pattern**:

### Go backend (pattern-replication)
- Additional CRUD handlers following the exact pattern of an existing handler
- Additional `sqlc` query files for entities following the established query pattern
- Additional `repo.go` functions (list, getByID, create, update, softDelete) for new entity types
- Test scaffolding (`_test.go` files) following the existing test pattern
- Error catalog additions in handler files

### React frontend (pattern-replication)
- Additional page components for business modules following the EntityDesignerPage pattern
- Additional `studioApi.ts` functions for new API endpoints — **must follow existing type patterns**
- Additional TanStack Query hooks following established patterns
- Form components for business module Masters and Transactions
- List view pages following the VirtualGrid pattern

### Database (routine work)
- Migration files for adding columns to existing tables (following the migration naming convention)
- Index additions via the queue (not inline DDL)
- Additional `entity_sequence` seed entries

### Test files
- Additional test cases for existing functions
- Integration test setup following existing `testcontainers` patterns

---

## The Handoff Protocol

When Claude Code completes a subsystem or establishes a new pattern, it must:

1. Create a Pattern Reference note in `docs/patterns/{pattern-name}.md`
2. The Pattern Reference must include: what the pattern is, a canonical code example, the list of things Copilot can replicate, and the list of things Copilot must NOT do with this pattern

Pattern References already needed (create these as you implement each subsystem):
- `docs/patterns/go-handler-pattern.md` — after first entity handler is complete
- `docs/patterns/go-repo-pattern.md` — after first repo is complete
- `docs/patterns/react-list-page-pattern.md` — after EntityDesignerPage is complete
- `docs/patterns/react-editor-page-pattern.md` — after EntityEditorPage is complete
- `docs/patterns/studioapits-pattern.md` — after studioApi.ts first functions are written
- `docs/patterns/tanstack-query-pattern.md` — after first useQuery hook is written

---

## Escalation Signal

Copilot must signal for Claude Code review when:
- The task requires understanding the compiled schema contract
- The task involves any PII field property
- The task involves overlay delta operations
- The task requires a new database table (not `entity_record`)
- The existing pattern doesn't cleanly fit the new requirement
- The task touches the 6-step compiler pipeline

The signal is: create a file `docs/review-needed/{task-name}.md` describing what decision is needed.

---

## Session Start Checklist for Claude Code

At the start of every Claude Code session:

1. Read `CLAUDE.md` (this is automatic — it's in the root)
2. Read the PRD for the subsystem being worked on
3. Read the Pattern Reference for any pattern being replicated
4. Check `docs/review-needed/` for any pending decisions
5. Check `docs/adr/` for any recent architecture decisions that may affect the work

---

## What "Pattern Established" Means

A pattern is established when:
- The first implementation is complete and committed
- The Pattern Reference document is written
- At least one test covers the pattern

A pattern is NOT established just because Claude Code wrote some code. The Pattern Reference doc is the signal.

---

## Node.js Migration Track

The current backend is Go. A future migration to Node.js is planned. During the initial build:

- All backend implementation is in Go (`src/go/`)
- The Node.js layer (`src/node/`) contains only the rules evaluator and overlay resolver mirrors
- Do NOT begin Node.js migration of Go services until explicitly instructed
- When Node.js migration is instructed, a separate migration ADR will be created first

---

## GitHub Copilot Specific Instructions

When GitHub Copilot is active on this codebase:

1. **Always read the file header comments** — every major file has a comment block describing what it does and what it does NOT do
2. **Never modify** files in `src/go/internal/compiler/`, `src/go/internal/pii/`, `src/go/internal/overlay/` without explicit human instruction
3. **Check `docs/patterns/`** before writing any new code — if a pattern doc exists, follow it exactly
4. **Follow the studioApi.ts convention** — all new API functions go in that file with the same typed wrapper pattern
5. **Design system only** — every React component must use only components from `src/react/src/design-system/`
