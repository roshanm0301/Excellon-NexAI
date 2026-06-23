# UI Studio — Phase 4: Frontend Architecture Specification

**Excellon Enterprise Platform · UI Studio product**
Status: Draft · governed by Constitution v1.0, PDR, Phase 2/3
Scope: implementation-ready frontend architecture. Backend engines are **mocked** behind typed service interfaces. Feeds Phase 5 (blueprint) and Phase 6 (Claude Code prompts).

**Stack:** React 19 · TypeScript · Vite · TanStack Router · TanStack Query · Zustand · Tailwind · shadcn/ui · React DnD · React Hook Form · Zod.

## 0. Architecture principles
1. **Strict state separation** (§3): client/UI state (Zustand) ≠ server state (TanStack Query) ≠ form state (RHF+Zod). Never duplicate server data into Zustand.
2. **Cascade context is global and drives data** (§3.4): `editingLevel`/`previewScope` are Zustand state *and* query-key inputs; changing them re-derives the whole workspace.
3. **Backend behind interfaces** (§5): every engine call goes through a typed service interface with real and mock implementations; the app never imports a mock directly.
4. **Chrome ≠ Canvas content** (§7): shadcn chrome and the interpreted Canvas renderer are separated by a hard boundary.
5. **Types are the contract:** Meta Model types (§2), Zod-validated at every boundary.

## 1. Folder structure (feature-sliced)
```
src/
  app/                      # shell, providers, router mount
    App.tsx  providers.tsx  router.tsx
  routes/                   # TanStack Router route tree (§4)
    __root.tsx  index.tsx
    editor.$appId.tsx  editor.$appId.$pageId.tsx
    home.tsx  signin.tsx  settings.tsx
  features/                 # one folder per UX surface (Phase 2/3)
    explorer/   canvas/   inspector/   asset-library/
    binding/    events/    preview/    problems/
    publish/    versioning/   command-palette/   cascade-context/
      # each: components/  hooks/  state/  api/  __tests__/  index.ts
  domain/                   # Meta Model types + pure logic (§2)
    types/                  # Application, Page, View, Component, ...
    cascade/                # origin-state derivation, override ops (pure)
    validation/             # client-side validation helpers
  services/                 # typed engine clients + interfaces (§5)
    interfaces/  http/  index.ts (DI)
  mocks/                    # MSW handlers + fixtures (§6)
    handlers/  fixtures/  browser.ts  server.ts
  stores/                   # Zustand slices (§3.1)
    workspace.store.ts  selection.store.ts  panels.store.ts
  shared/
    ui/                     # shadcn components (chrome only)
    hooks/  lib/  query/ (query-key factory, client)  config/
  runtime-preview/          # the interpreted Canvas renderer (runtime vocabulary)
    Renderer.tsx  componentMap.ts  overlay/ (selection|drop|badge layers)
  test/                     # setup, utilities
```
Rule: cross-feature imports go through `domain`, `services`, `shared`, or a feature's `index.ts` barrel — never deep-import another feature.

## 2. Domain types (the contract)
Meta Model objects (Spec Doc 01) as discriminated unions; the single source of truth shared by chrome, renderer, services, and mocks.
```ts
type CascadeLevel = 'platform'|'vertical'|'tenant'|'org';
type OriginState = 'inherited'|'overridden'|'own'|'suppressed'|'orphaned';

interface NodeBase {
  id: string; logicalKey: string;
  cascadeLevel: CascadeLevel; overrideOf?: string;
  objectVersion: number; audit: Audit; securityRef?: string;
}
interface ComponentNode extends NodeBase {
  kind: 'component'; semanticType: string;
  props: Record<string, Literal | Binding>;
  dataBinding?: Binding; stateBindings?: Binding[];
  events?: string[]; validations?: string[]; children?: NodeRef[];
}
type Binding = { bind: { kind:'dataSource'|'state'|'rule'|'workflow'; ref:string; path?:string } };
// Page, View, Layout, Action, Event, State, WorkflowBinding, DataSource ... likewise
```
`domain/cascade/` holds **pure functions**: `deriveOrigin(node, editingLevel)`, `resolveCascade(levels)`, `applyOverrideOps(...)`. Pure → unit-testable without UI (testing seam).

## 3. State architecture (three tiers)

### 3.1 Client/UI state — Zustand
Ephemeral workspace state only; never server data.
```ts
interface WorkspaceState {
  env: 'dev'|'staging'|'prod';
  editingLevel: CascadeLevel; editingScopeId: string;   // write target
  previewScopeId: string; previewRole?: string;          // read view (independent)
  setEditingLevel(l,s): void;  setPreviewScope(s): void;
}
// selection.store: selectedKeys[], hoverKey; panels.store: panel sizes/visibility, breakpoint
```
### 3.2 Server state — TanStack Query
All engine data: definitions tree, resolved preview model, validation, impact, presence, versions. **Query-key factory** keys everything by context so cascade changes refetch correctly:
```ts
const qk = {
  tree:    (env,appId,editingLevel,scopeId)=>['tree',env,appId,editingLevel,scopeId],
  node:    (id)=>['node',id],
  preview: (env,appId,pageId,previewScopeId,role)=>['preview',env,appId,pageId,previewScopeId,role],
  validate:(env,appId)=>['validate',env,appId],
  impact:  (env,appId,level,scopeId)=>['impact',env,appId,level,scopeId],
};
```
Mutations (create/override/bind/wire) optimistically update + invalidate `tree`/`node`/`validate`. Suspense mode + error boundaries realize the Phase-3 loading/error states.

### 3.3 Form state — RHF + Zod
Inspector property forms, binding picker, event builder use RHF with Zod resolvers; Zod schemas derive from semantic-component contracts (Doc 06) so invalid props can't be saved (Phase 3 §5 error state).

### 3.4 The cascade-context wiring (the key integration)
`editingLevel` change → re-key `tree` query → server returns nodes → `deriveOrigin` (pure) badges them → Explorer/Canvas/Inspector re-render. `previewScope` change → re-key `preview` query only → Canvas preview re-renders. This single dependency chain is the architectural heart; it is what makes the two-axis navigation (Phase 2 §2) work.

## 4. Routing architecture — TanStack Router
Type-safe route tree; **context lives in search params** so any authoring state is deep-linkable.
```
/signin
/home                                  ?env=
/editor/$appId                         ?env&editingLevel&scopeId&previewScopeId
/editor/$appId/$pageId                 ?...&selection
/settings
```
- Search params validated by Zod (`validateSearch`); typed `useSearch()`.
- Route **loaders** prefetch via `queryClient.ensureQueryData(qk.tree(...))` so panels render with data, not flicker.
- Editing level / preview scope are **search params** (not Zustand-only) → shareable URLs; Zustand mirrors them for ergonomic access, with the router as source of truth on load.
- Code-splitting per route + per heavy feature (Canvas, Versioning) via lazy routes.

## 5. Service architecture (engines behind interfaces)
One interface per engine; the app depends on interfaces, not implementations.
```ts
interface MetadataService {            // registry CRUD + tree
  getTree(p:{env;appId;editingLevel;scopeId}): Promise<TreeNode[]>;
  getNode(id:string): Promise<Node>;
  createNode(n:NodeInput): Promise<Node>;
  overrideNode(p:{logicalKey;level;ops:OverrideOp[]}): Promise<Node>;
}
interface CompilerService { validate(p):Promise<Issue[]>; impact(p):Promise<Impact>; publish(p):Promise<PublishResult>; }
interface PreviewService  { resolve(p:{env;appId;pageId;previewScopeId;role}):Promise<ResolvedModel>; }
interface RegistryService { search(q):Promise<RegistryHit[]>; shape(ref):Promise<TypeShape>; }
interface PresenceService { subscribe(appId, cb):Unsub; lock(key):Promise<Lock>; }
```
- All responses **Zod-parsed** at the boundary (`schema.parse(res)`); a contract violation throws before reaching UI.
- **DI:** `services/index.ts` exports a `services` object wired to `http/` (real) or, in dev/test, to mocks via MSW (so the *same* http clients run against intercepted requests — no separate mock client). This keeps the real code path exercised.

## 6. Mock API architecture — MSW
Mocks make the entire Studio usable with no backend (brief requirement) and must simulate the behaviors the UX depends on.
```
mocks/
  fixtures/ dms-app.ts (a seeded DMS: Vertical baseline + Toyota OEM overlay + Dealer-X)
            registry.ts (entities: SalesOrder, OrderLine, ...; rules; workflows)
  handlers/ metadata.ts compiler.ts preview.ts registry.ts presence.ts
  browser.ts (dev)  server.ts (tests)
```
- **In-memory mutable store** seeded from fixtures so create/override/bind round-trip and persist within a session.
- **Cascade resolution simulated:** the `preview.resolve` handler runs the *real* pure `resolveCascade` (domain/cascade) over the in-memory levels for `previewScopeId` — so preview-as-Org is faithful and dogfoods the same logic the runtime uses.
- **Validation simulated:** `compiler.validate` runs pure checks (broken bindings, orphaned overrides, type mismatches) → drives the Problems dock and the broken-binding red-placeholder (Phase 3 §4) deterministically.
- **Impact simulated:** counts affected OEMs/dealers/orphans from fixtures for the Cascade Impact gate.
- Deterministic seeds; latency/error toggles to exercise loading/error states.

## 7. Component architecture
### 7.1 Chrome vs Canvas boundary
- **Chrome** (`shared/ui`, feature `components/`): shadcn + Tailwind. Panels, trees, inspectors, dialogs, command palette.
- **Canvas content** (`runtime-preview/`): the **interpreted renderer** maps `semanticType → runtime component` (Excellon/MUI) — a separate dependency graph. Chrome never renders runtime components and vice-versa (lint boundary).

### 7.2 The Canvas overlay system (Phase 3 OI-P3-2, the hard part)
```
runtime-preview/
  Renderer.tsx        # walks ResolvedModel → runtime components; registers each node's DOM rect
  nodeRegistry.ts     # Map<logicalKey, {rect, level, origin}>  (observed via ResizeObserver)
  overlay/
    SelectionLayer    # absolutely-positioned handles over selected node rect
    DropTargetLayer   # region drop zones from layout metadata
    OriginBadgeLayer  # origin badges anchored to node rects
```
- The renderer renders content in **flow layout** `[L34]`; overlays read `nodeRegistry` rects and position **handles/badges absolutely over the canvas coordinate space**. *(Absolute positioning here is studio chrome for selection overlays — it does NOT violate `[L34]`, which forbids absolute positioning in **authored** layouts.)*
- `ResizeObserver`/`IntersectionObserver` keep rects fresh on scroll/zoom/reflow; overlays are pure functions of `nodeRegistry` + selection state.
- React DnD: Asset Library cards are drag sources; `DropTargetLayer` zones are drop targets resolving to layout-region inserts (with keyboard DnD alternative for a11y).

### 7.3 Shared primitives
`OriginBadge` (the §Phase3-1 visual language), `CascadeContextBar`, `PropertyRow` (label+control+origin+revert), `RegistryBrowser`, `EngineBrowser` — reused across features.

## 8. Cross-cutting
- **Loading/error:** Suspense + error boundaries per panel realize Phase-3 states; query `isPending/isError`.
- **Performance:** virtualize Explorer tree and Canvas grids (the latter via the runtime DataTable's own virtualization); code-split routes/heavy features; memoize origin derivation by `(node, editingLevel)`.
- **Accessibility:** chrome built on shadcn/Radix (accessible primitives); keyboard DnD; focus management; origin badges carry text labels (Phase 3 §1). Studio target WCAG 2.2 AA.
- **Testing seams:** pure `domain/cascade` + `domain/validation` unit-tested; MSW enables full integration tests without a backend; services mockable via DI.
- **Config/security:** auth token + verified tenant claim attached by the http layer; the app never sends a tenant id from client state `[L16][L17]`.

## 9. Phase 4 summary & open items
**Covered:** folder structure, domain types, three-tier state with the cascade-context wiring, type-safe routing with context in search params, services-behind-interfaces, MSW mocks that *simulate cascade resolution and validation*, and the Canvas overlay architecture.
**Open items into Phase 5:**
- OI-P4-1: The `nodeRegistry` rect-tracking under zoom/virtualized scroll is the highest-risk implementation detail (Canvas); prototype first (carries OI-P3-2).
- OI-P4-2: Optimistic-update + invalidation choreography for override mutations vs. origin re-derivation — specify precise cache flows in Phase 5 stories.
- OI-P4-3: Presence/lock transport (poll vs ws) — poll for v1 (carries WR2), behind `PresenceService`.

*Next: Phase 5 — Claude Code Implementation Blueprint: Epics → Features → Stories → Tasks, each with objective, files to create/modify, acceptance criteria, and dependencies, derived directly from this architecture.*
