# IMPLEMENTATION-GUIDE.md â€” What To Do Next: Step-by-Step

> **For the Product Manager.** This is your operational guide for setting up the project and directing Claude Code.

---

## Before You Start â€” Checklist

- [ ] GitHub repository created
- [ ] Claude Code installed and connected to the repository
- [ ] Claude Design project exists with the Excellon Design System
- [ ] PostgreSQL available (local Docker or cloud instance)
- [ ] Redis available (optional for initial build â€” overlay cache falls back gracefully)

---

## Phase 0 â€” Project Setup (Do This Yourself)

These are one-time setup steps you do before Claude Code writes any code.

### Step 1 â€” Create the GitHub Repository

Create a new GitHub repository. Name it something like `excellon-platform`. Initialize with a README.

### Step 2 â€” Create the Folder Structure

In the repo root, create these empty folders (with `.gitkeep` files so they commit):

```
src/go/
src/react/
src/node/
db/migrations/
db/queries/
db/schema/
docs/architecture/
docs/prd/
docs/adr/
docs/patterns/
.claude/commands/
```

### Step 3 â€” Upload the Documentation Pack

Upload all the `.md` files from this documentation pack into your repo:

```
CLAUDE.md                              â†’ repo root (critical â€” Claude Code reads this automatically)
docs/AI-AGENT-GUIDE.md
docs/architecture/BACKEND-STANDARDS.md
docs/architecture/FRONTEND-STANDARDS.md
docs/architecture/DATA-ARCHITECTURE.md
docs/architecture/DESIGN-SYSTEM.md
docs/prd/ENTITY-DESIGNER.md
docs/prd/RULES-ENGINE.md
docs/prd/OVERLAY-SYSTEM.md
docs/prd/EXPRESSION-ENGINE.md
docs/prd/CROSS-CUTTING.md
```

Place the service-level CLAUDE.md files into their respective directories:
```
src/go/internal/compiler/CLAUDE.md    (from service-claudes/compiler-CLAUDE.md)
```

### Step 4 â€” Connect Claude Design

In your Claude project settings, link the Excellon Design System Claude Design file. This makes it accessible to Claude Code when it writes React components.

### Step 5 â€” Set Up Environment Files

Create `.env.example` in the repo root:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/excellon_dev
REDIS_URL=redis://localhost:6379
ENCRYPTION_MASTER_KEY=your-32-byte-hex-key-here
VITE_TENANT_ID=default-tenant
VITE_USER_ID=dev-user
VITE_ROLE=ADMIN
```

Copy to `.env.local` (gitignored) with your actual local values.

### Step 6 â€” Create .gitignore

```gitignore
.env.local
.env
node_modules/
dist/
build/
*.exe
*.test
vendor/
```

---

## Phase 1 â€” Foundation (First Claude Code Session)

**Goal:** Running Go service, connected to PostgreSQL, all base tables created, dev context middleware working, React app booting.

### Prompt 1 â€” Go Module & Service Scaffold

Give Claude Code this prompt:

> Read CLAUDE.md and docs/architecture/BACKEND-STANDARDS.md first.
> 
> Scaffold the Go service:
> 1. Initialize Go module as `github.com/excellon/platform` in `src/go/`
> 2. Create `src/go/cmd/server/main.go` with chi router, dev context middleware (x-tenant-id, x-user-id, x-role headers), and a health check endpoint `GET /health`
> 3. Create the dev context middleware in `src/go/internal/middleware/devcontext.go`
> 4. Create `src/go/internal/idgen/idgen.go` with UUID v4 and v7 generation
> 5. Add `go.mod` with these dependencies: chi v5, pgx/v5, uuid, slog
> 6. Create `src/go/Makefile` with targets: `run`, `test`, `build`
> 
> Do not add any auth logic. The dev headers ARE the auth for now.

### Prompt 2 â€” Base Database Migrations

> Read docs/architecture/DATA-ARCHITECTURE.md first.
> 
> Create the base database migration files in `db/migrations/`:
> 1. `{timestamp}_create_artifact_tables.up.sql` â€” artifact_header, artifact_version, compiled_artifact tables with all indexes
> 2. `{timestamp}_create_entity_record.up.sql` â€” entity_record, entity_sequence tables
> 3. `{timestamp}_create_overlay_delta.up.sql` â€” artifact_overlay_delta table
> 4. `{timestamp}_create_studio_node.up.sql` â€” studio_node table
> 5. `{timestamp}_create_index_queue.up.sql` â€” entity_index_queue table
> 6. `{timestamp}_create_audit_event.up.sql` â€” audit_event partitioned table
> 
> Create matching `.down.sql` files for each. Follow the exact schemas in DATA-ARCHITECTURE.md.
> Also create a migration runner setup using golang-migrate in the Go service startup.

### Prompt 3 â€” React App Scaffold

> Read CLAUDE.md and docs/architecture/FRONTEND-STANDARDS.md first.
> 
> Scaffold the React application in `src/react/`:
> 1. Initialize Vite + React 19 + TypeScript project
> 2. Set up folder structure: `src/pages/admin/`, `src/pages/studio/`, `src/components/studio/`, `src/components/expression/`, `src/config/`, `src/hooks/`, `src/design-system/`
> 3. Create `src/config/studioApi.ts` with `studioFetch<T>()` wrapper using the dev headers from environment variables
> 4. Set up TanStack Query provider in `main.tsx`
> 5. Set up React Router with lazy-loaded routes (empty placeholder pages for now)
> 6. Create `src/design-system/index.ts` as a barrel export (empty for now â€” will be populated when design system is read)
> 7. Configure Vite proxy: `/api` â†’ `http://localhost:8080`
> 
> Do not write any design system components yet â€” those come after reading the Excellon Design System.

**Phase 1 acceptance check:**
- Go service starts, `GET /health` returns 200
- Migrations run successfully, all tables exist
- React app boots at localhost:5173 without errors

---

## Phase 2 â€” Artifact Versioning & Entity Designer Backend

**Goal:** The artifact CRUD API works. Entity schemas can be saved, versioned, and published. The compiler runs.

### Prompt 4 â€” Artifact CRUD Handler

> Read docs/prd/ENTITY-DESIGNER.md (Backend â€” Artifact Versioning API section) and docs/architecture/BACKEND-STANDARDS.md.
> 
> Implement the artifact versioning API in `src/go/internal/admin/handler.go`:
> - All 9 endpoints from the PRD (list, create, get, delete, latest, active, save version, list versions, publish)
> - The repo layer for `artifact_header` and `artifact_version` tables
> - The publish endpoint must trigger compilation (stub the compiler call for now â€” just log "compile triggered")
> 
> Follow the handler pattern in BACKEND-STANDARDS.md exactly. Include the error catalog codes.

### Prompt 5 â€” Go Compiler Pipeline

> Read docs/prd/ENTITY-DESIGNER.md (Backend â€” 6-Step Compiler Pipeline section).
> 
> Implement the Go compiler in `src/go/internal/compiler/entity_schema.go`:
> - All 6 steps as described in the PRD
> - Write to compiled_artifact table with content hash deduplication
> - Wire the compiler into the publish endpoint from Prompt 4
> 
> Read the CLAUDE.md in src/go/internal/compiler/ before starting.

### Prompt 6 â€” Entity Runtime CRUD

> Read docs/prd/ENTITY-DESIGNER.md (Backend â€” Entity Runtime CRUD section) and docs/architecture/BACKEND-STANDARDS.md.
> 
> Implement the entity runtime in `src/go/internal/entityruntime/`:
> - `handler.go` â€” all 7 endpoints
> - `repo.go` â€” create, read, list, update, softDelete flows exactly as described in the PRD
> - `computed.go` â€” computed field evaluation (stub the expression engine call for now â€” return null for computed fields)
> - ID generation via idgen
> - Display ID via entity_sequence atomic upsert
> - Composite key checking
> 
> Rules evaluation and PII masking are stubs for now â€” add TODO comments marking where they'll be called.

---

## Phase 3 â€” Entity Designer Frontend

**Goal:** The Entity Designer UI works end to end. Admins can define entities, publish them, and see them in the list.

### Prompt 7 â€” Read the Design System First

> Open the Excellon Design System in Claude Design (linked in project settings).
> 
> Before writing any React code:
> 1. Read all component documentation
> 2. Create `src/react/src/design-system/` with the actual components from the design system
> 3. Create `src/react/src/design-system/tokens/index.ts` with all design tokens
> 4. Update `src/react/src/design-system/index.ts` barrel export
> 
> This must be done before any page or component is written.

### Prompt 8 â€” Entity Designer List Page

> Read docs/prd/ENTITY-DESIGNER.md (Frontend â€” Pages section) and docs/architecture/FRONTEND-STANDARDS.md.
> 
> Implement EntityDesignerPage (`src/react/src/pages/admin/EntityDesignerPage.tsx`):
> - All columns as specified: Entity Type (strip entity. prefix), Category, Status badge, Layer, Node, Last Updated
> - Row actions: Edit, Delete (confirm dialog), Duplicate
> - Header actions: New Entity, Bulk Delete, View Map
> - Data from `listEntityArtifacts()` via TanStack Query
> - Use VirtualGrid from the design system
> 
> Also implement the studioApi.ts functions needed: listEntityArtifacts, deleteArtifact.

### Prompt 9 â€” Entity Editor Page (Tabs 1-5)

> Read docs/prd/ENTITY-DESIGNER.md (Frontend â€” 8 Tabs section).
> 
> Implement EntityEditorPage with tabs 1-5:
> - Full state management as specified (local useState only â€” no global store)
> - Tab 1: FieldBuilder with all field properties (Core, Storage, Display, Lookup, Reference, Compliance sections)
> - Tab 2: SectionBuilder with drag-and-drop
> - Tab 3: RelationshipBuilder
> - Tab 4: CapabilityFlagsPanel
> - Tab 5: Settings inline form
> - Save Draft and Save & Publish buttons wired to studioApi.ts
> - Dirty state guard with beforeunload warning

### Prompt 10 â€” Entity Editor Page (Tabs 6-8 + ER Diagram)

> Continue EntityEditorPage:
> - Tab 6: NodeScopePicker (read Node Tree PRD in docs/prd/CROSS-CUTTING.md)
> - Tab 7: CompositeIndexPanel + IndexMigrationPanel with 5-second polling
> - Tab 8: RetentionPanel with pipeline visualization
> - EntityMapPage with @xyflow/react (ER diagram from relationships and reference fields)
> - ExpressionEditor component (Monaco + JSONata + field chips)

---



### Prompts for this phase:

> Implement the Rules Engine Go ProductionEvaluator â€” read docs/prd/RULES-ENGINE.md.
> Wire it into the entity runtime handler (remove the TODO stub from Prompt 6).

> Implement the Expression Engine Go goja VM pool â€” read docs/prd/EXPRESSION-ENGINE.md.
> Wire computed field evaluation into entityruntime/computed.go (remove the TODO stub).


> Implement the Rule Builder UI â€” read docs/prd/RULES-ENGINE.md (Rule Builder UI section).

---

## Phase 5 â€” Overlay System, PII, Audit

**Goal:** Multi-tenant schema customisation works. PII fields are encrypted. Audit trail is recording.

> Implement the Overlay Resolver â€” read docs/prd/OVERLAY-SYSTEM.md.
> Wire it into the compiler's publish flow.

> Implement PII service (src/go/internal/pii/) â€” read docs/prd/CROSS-CUTTING.md (PII section).
> Wire ProcessWrite and ProcessRead into the entity runtime (remove TODO stubs).

> Implement Audit service (src/go/internal/audit/) â€” read docs/prd/CROSS-CUTTING.md (Audit section).
> Wire fire-and-forget audit events into entity create/update/delete.

---

## Phase 6 â€” Business Modules (Masters & Transactions)

**Goal:** Use the framework to create the first real business modules.

At this point, the framework layer is stable. Business modules are created **through the Entity Designer**, not through code.

Steps:
1. Log into the running platform
2. Use Entity Designer to define each master entity (Customer, Vendor, Product, etc.)
3. Configure UI layouts in UI Studio (when available)
5. Claude Code only writes code for genuinely custom business logic that cannot be expressed through the framework

---

## Tips for Directing Claude Code Effectively

### Be specific about which PRD to read
Always start prompts with: "Read [specific doc] first." Claude Code works best when it has the right context loaded.

### One subsystem per session
Don't ask Claude Code to implement multiple subsystems in one prompt. Each subsystem is complex â€” one at a time produces better results.

### Reference the existing patterns
Once a pattern is established (e.g. after the first handler is written), say: "Follow the exact same pattern as the artifact handler in admin/handler.go."

### Use GitHub Copilot for repetition
After Claude Code has written the first entity handler, use Copilot to generate similar handlers for other entity types. Claude Code set the pattern; Copilot replicates it.

### Check docs/review-needed/ regularly
Claude Code will create files there when it needs a decision from you before proceeding.

---

## When Something Goes Wrong

| Problem | What to do |
|---------|-----------|
| Claude Code invents a new pattern not in the docs | Stop, clarify the correct pattern, update the relevant doc, restart |
| A new dependency was added without an ADR | Create the ADR in docs/adr/, decide if the dependency stays |
| Runtime code is reading artifact_version.payload directly | This breaks the compiled schema contract â€” fix immediately |
| A business module has a custom DB table | Remove it â€” use entity_record. Update CLAUDE.md if the constraint needs reinforcing |
| The design system is being bypassed | Remove the violation, update DESIGN-SYSTEM.md if the gap needs to be filled |
