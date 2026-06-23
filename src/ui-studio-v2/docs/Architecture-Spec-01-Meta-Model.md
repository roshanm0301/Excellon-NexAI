# Excellon Platform — Architecture Specification

**Document 01 of the series · Master Index + Chapter 1: Meta Model**
Status: Draft · governed by the Platform Constitution v1.0 (no section may contradict it without a §9 amendment)
Audience: platform engineers, solution architects, and the product owner directing the build.

---

## A. About this specification

This is a multi-document specification, built section by section. A complete, useful architecture spec for a platform of this ambition runs to many tens of thousands of words; producing it in one pass would sacrifice the depth that makes a *specification* (as opposed to an overview) worth having. Each document in the series specifies one subsystem at implementation-guiding depth.

**Conventions used throughout:**
- **Normative language:** *must* / *must not* = a hard invariant (often a constitution law). *should* = strong default. *may* = permitted option.
- **Law references:** `[L#]` cites an Architectural Law from the Constitution; `[⚑]` marks a commercial-fork item requiring a §9 amendment before it is built.
- **Field tables** give: name · type · required · description.
- **Identity:** `id` = system UUID (opaque); `logicalKey` = stable human-meaningful cross-cascade identity.
- **Cascade** = Platform → Vertical → Tenant(OEM) → Org(Dealer).
- Examples use JSON-like pseudocode; the wire format (JSON/protobuf) is a Runtime-doc decision, not a Meta-Model one.

---

## B. Master index (the full spec structure)

Status: ✅ drafted · 🔜 this series, pending · ⚑ amendment-gated.

| # | Document | Subsystem(s) from your list | Status |
|---|---|---|---|
| 01 | **Meta Model** | Application, Page, View, Layout, Component, Action, Event, State, Workflow Binding (+ supporting objects) | ✅ this doc |
| 02 | **Runtime Core** | Renderer, State Manager, Navigation Engine, Binding Engine | 🔜 |
| 03 | **Web Runtime** | React 19 / MUI Pro renderer; PWA delivery | 🔜 |
| 04 | **Mobile Runtime** | Native contract (renderer deferred); PWA-as-mobile | 🔜 (native ⚑/deferred) |
| 05 | **Studio** | Canvas, Inspector, Explorer, Asset Library | 🔜 |
| 06 | **Design System Engine** | Tokens, theming, semantic→MUI mapping, versioning | 🔜 |
| 07 | **Compiler & Build** | Cascade resolution, binding resolution, validation, artifact emission, schema evolution | 🔜 |
| 08 | **Multi-Tenant Architecture** | Control/data plane, isolation, routing, residency | 🔜 |
| 09 | **Deployment Architecture** | Environments, regions, promotion, rollback, infra topology | 🔜 |
| 10 | **Curated Extension Framework** | Custom components (governed); *open plugin marketplace* | 🔜 (open = ⚑) |
| 11 | **AI-Readiness Interface** | Seams for future AI authoring (not a built AI runtime) | 🔜 (AI-Native = ⚑) |
| 12 | **Security Architecture** | Identity, authz, tenant-claim routing, audit | 🔜 |
| 13 | **Observability & Operations** | Tracing, "explain this render", SLAs | 🔜 |

This document specifies **#01**. The remainder follow in subsequent turns at equal depth.

---

# Chapter 1 — Meta Model

> Constitutional basis: `[L1]` one canonical model; `[L2]` all UI metadata-driven; `[L3]` declarative & serializable; `[L4]` no logic in UI; `[L6]` bindings are first-class registry references; `[L7]` customize by overlay, never copy. The Meta Model is the substance these laws govern.

## 1.1 Foundations

### 1.1.1 The two dimensions
Every Meta Model object lives at the intersection of two orthogonal hierarchies:

- **Composition** (how a UI is built): `Application → Module → Page → View → Section → Component`.
- **Cascade** (who owns/overrides a definition): `Platform → Vertical → Tenant → Org`.

A composition node is *authored at a cascade level* and *resolved across the cascade at compile time*. These dimensions never collapse into one another. *(Phase 3 §1; normative here.)*

### 1.1.2 Universal definition fields
Every cascade-able object *must* carry these:

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | UUID | yes | System identity, opaque, immutable |
| `logicalKey` | string | yes | Stable cross-cascade identity; unique within its parent scope at a level `[L10]` |
| `cascadeLevel` | enum(platform,vertical,tenant,org) | yes | Owning level |
| `overrideOf` | logicalKey | no | Present iff this node overrides an inherited node; *must* resolve to an existing higher-level node or it is an orphan → build error `[L22]` |
| `overrideOps` | OverrideOp[] | no | Operations when this is an override (see 1.1.3) |
| `objectVersion` | int (monotonic) | yes | Increments per change `[L20]` |
| `audit` | Audit | yes | createdBy/At, modifiedBy/At `[L43]` |
| `securityRef` | ref(Security) | no | Optional authorization metadata |

### 1.1.3 Override operations (normative)
Overrides are **node-scoped**, never positional `[L10]`. Permitted operations:

| Op | Target | Effect |
|---|---|---|
| `set` | a property | Replace a property value on an inherited node |
| `merge` | an object property | Deep-merge into an inherited object |
| `insert` | a child collection | Add a child at a keyed position (relative to a sibling `logicalKey`) |
| `remove` | an inherited node | Suppress an inherited node |
| `replace` | an inherited node | Replace wholesale |

Resolution is deterministic, most-specific-wins `[L11]`. Conflicts that cannot resolve deterministically are build errors, never runtime behavior `[L11][L21]`.

### 1.1.4 Binding model (normative)
A *binding* is a first-class reference into the shared registry `[L6]`, never a copied schema or free string. Bindings appear as property values of the form:
```
{ "bind": { "kind": "dataSource|state|rule|workflow", "ref": "<logicalKey or registry id>", "path": "<optional sub-path>" } }
```
The compiler resolves every binding against the registry and records the dependency `[L23]`; an unresolved binding is a build error `[L22]`.

## 1.2 Object catalogue & relationships

```
Application ─1*─ Module ─1*─ Page ──ref──► Layout
                              │ 1            ▲
                              *─ View ─1*─ Section ─1*─ Component ──┐
                              │   │ ref         ref                │ refs:
                              │   └──► DataSource ◄── ref ──────────┤  dataBinding ─► DataSource ─► [REGISTRY: Entity/Rel/Query]
                              │                                     │  stateBindings ─► State
   Workflow Binding ─attaches─┤                                     │  eventHandlers ─► Event ─► Action ─► {Rule|Workflow|Nav|State|Entity|API}
   (View/Component/Action)    │                                     │  validations ─► Validation ─► [Rule/Expression Engine]
                              └─ Page state/actions                 └  a11y/responsive/mobile/security
   Cascade fields (1.1.2) decorate EVERY composition node and resolve at compile → compiled_artifact [L19]
```

The **primary objects** (your list) are specified in 1.3–1.11. **Supporting objects** required for coherence (Module, Section, Data Source, Navigation, Theme, Validation, Rule Binding, and the cross-cutting metadata) are specified condensed in 1.12; their full treatment is canonical but secondary to this chapter's focus.

## 1.3 Application
**Definition.** The top-level installable/runnable unit (e.g., "Dealer Management System"). Root of a composition tree.

| Field | Type | Req | Description |
|---|---|---|---|
| `name`, `description` | string | yes/no | — |
| `verticalScope` | ref(Vertical) | yes | The vertical baseline it derives from |
| `targetProfiles` | enum[](web,pwa,native) | yes | Which renderers it ships to (native deferred) |
| `modules` | ref(Module)[] | yes | Functional groupings |
| `navigationRef` | ref(Navigation) | yes | App-level nav |
| `themeRef` | ref(Theme) | yes | Resolved per cascade for branding `[L33]` |
| `defaultEntryRef` | ref(Page) | yes | Landing page |
| `featureFlags` | map | no | Module/feature toggles, cascade-overridable |

**Relationships.** Contains Modules. References Navigation, Theme, Security.
**Lifecycle.** Authored (any level) → cascade-resolved per Org → compiled into the artifact's app manifest.
**Invariants.** *Must* reference a `verticalScope`. `targetProfiles` *must not* include `native` unless a native renderer is registered for its components (else build error). All referenced Modules *must* resolve.

## 1.4 Page
**Definition.** A routable screen, instantiated from an **archetype** `[L34 implies structured, not freeform]`.

| Field | Type | Req | Description |
|---|---|---|---|
| `archetype` | enum | yes | list-report \| transaction-entry \| master-detail \| object-detail \| dashboard \| workspace \| wizard |
| `route` | string | yes | Unique within the app |
| `title` | string\|binding | yes | Static or bound |
| `primaryDataSourceRef` | ref(DataSource) | cond | Required for data-bound archetypes |
| `views` | ref(View)[] | yes | One or more regions |
| `layoutRef` | ref(Layout) | yes | Page-level arrangement |
| `pageState` | ref(State)[] | no | Page-scoped client state |
| `pageActions` | ref(Action)[] | no | Page-level actions (e.g., "New") |
| `accessibilityRef` | ref(Accessibility) | yes | Default-on per archetype `[L35]` |
| `responsiveRef` | ref(Responsive) | yes | Breakpoint behavior `[L36]` |
| `securityRef` | ref(Security) | no | Page-level authz |

**Invariants.** `archetype` is immutable after creation (changing archetype = new Page) — archetypes carry structural/a11y/responsive defaults that can't be retrofitted. Data-bound archetypes *must* have a `primaryDataSourceRef`.

## 1.5 View
**Definition.** A bounded region within a Page with its own data context and lifecycle (e.g., the order-lines grid).

| Field | Type | Req | Description |
|---|---|---|---|
| `dataSourceRef` | ref(DataSource) | cond | The View's data context; may inherit Page's |
| `sections` | ref(Section)[] | yes | Structural groupings (may be a single implicit section) |
| `viewState` | ref(State)[] | no | View-scoped state |
| `events` | ref(Event)[] | no | View-level events (e.g., onLoad) |
| `layoutRef` | ref(Layout) | yes | View arrangement |

**Relationships.** Belongs to a Page; contains Sections. Selection/state in one View may drive another via shared State (master-detail).
**Invariants.** A View's components *must* bind only to data reachable from the View's (or Page's) DataSource scope — out-of-scope bindings are build errors `[L22]`.

## 1.6 Layout
**Definition.** *How* children are arranged, decoupled from *what* they are. Flow/constraint-based only `[L34]`.

| Field | Type | Req | Description |
|---|---|---|---|
| `type` | enum | yes | stack \| flex \| grid \| split \| form-grid \| responsive-grid |
| `direction` | enum(row,column) | cond | For stack/flex |
| `gap`, `padding` | token ref | no | From design-system tokens, not raw px `[L33]` |
| `regions` | Region[] | cond | Named slots children attach to |
| `breakpointRules` | BreakpointRule[] | no | Reflow/collapse/reorder per breakpoint `[L36]` |
| `constraints` | Constraint[] | no | Min/max/grow/shrink |

**Invariants.** *Must not* express absolute x/y coordinates `[L34]`. All sizing references design-system tokens, not literals, except where a token explicitly permits a literal.

## 1.7 Component
**Definition.** An instance of a **semantic** design-system component, bound to data/state/events. The composition leaf.

| Field | Type | Req | Description |
|---|---|---|---|
| `semanticType` | enum | yes | DataTable \| FormField \| ObjectHeader \| KpiCard \| Stepper \| StatusChip \| Button \| … (Design System Engine, doc 06, owns the catalogue) |
| `props` | map<string, literal\|binding> | no | Typed against the semantic contract |
| `dataBindingRef` | binding | no | Registry-resolved data `[L6]` |
| `stateBindings` | binding[] | no | To State objects |
| `eventHandlers` | ref(Event)[] | no | — |
| `validations` | ref(Validation)[] | no | — |
| `children`/`slots` | ref(Component\|Section)[] | no | For container semantics |
| `accessibility`/`responsive`/`mobile` | overrides | no | Override archetype defaults |
| `securityRef` | ref(Security) | no | Field/action-level authz `[L31] server-enforced` |

**Invariants.** `semanticType` *must* exist in the registered design-system catalogue `[L32]`; foreign component types are build errors. Props *must* satisfy the semantic contract's types. A Component *must not* contain business logic `[L4]` — only bindings and declarative props.

## 1.8 Action
**Definition.** A named, invokable unit of behavior. The verbs of the model. Actions reference engines; they never embed logic `[L4][L5]`.

| Field | Type | Req | Description |
|---|---|---|---|
| `kind` | enum | yes | mutate-entity \| invoke-rule \| trigger-workflow-transition \| navigate \| set-state \| call-api \| composite |
| `target` | ref | yes | Entity \| Rule \| WorkflowTransition \| route \| State \| Connector, per kind |
| `inputs` | map (bindings) | no | Parameter mapping from data/state |
| `preconditions` | ref(Rule)[] | no | Gate evaluation (server-authoritative for integrity `[L31]`) |
| `confirmation` | Confirmation | no | Optional user confirm |
| `securityGate` | ref(Security) | no | Authz; server-enforced `[L42]` |
| `onSuccess`/`onError` | ref(Action\|Event)[] | no | Chaining |

**Invariants.** A `trigger-workflow-transition` Action's `target` *must* be a transition valid in the bound workflow's state machine `[L39]` (validated at build). `mutate-entity` Actions affecting integrity *must* be server-executed `[L31]`.

## 1.9 Event
**Definition.** Declarative wiring of a trigger to ordered Actions.

| Field | Type | Req | Description |
|---|---|---|---|
| `trigger` | enum | yes | onClick \| onChange \| onLoad \| onSelect \| onSubmit \| onWorkflowEvent \| onTimer |
| `sourceRef` | ref(Component\|View\|Page) | yes | Emitter |
| `conditions` | ref(Rule)[] | no | Guard (if-rule) |
| `actions` | ref(Action)[] | yes | Ordered |

**Invariants.** `sourceRef` *must* be a node in the same composition scope. `onWorkflowEvent` *must* reference a workflow the page is bound to.

## 1.10 State
**Definition.** Transient, non-persisted view data — selection, filters, drafts, wizard step. Distinct from persisted Data Sources `[separation; Phase 3]`.

| Field | Type | Req | Description |
|---|---|---|---|
| `scope` | enum(page,view,component) | yes | Visibility/lifetime |
| `shape` | TypeSchema | yes | Typed structure |
| `initialValue` | literal\|binding | no | — |
| `persistence` | enum(none,session) | yes | Never persisted to the entity store |
| `derivation` | ref(Rule) | no | Computed state (server or client per `[L31]`) |

**Invariants.** State *must not* be the system of record for any entity data — writes to entities go through Actions `[L4][L31]`.

## 1.11 Workflow Binding
**Definition.** Attaches Workflow Engine constructs to UI; the mechanism behind the workflow-native differentiator.

| Field | Type | Req | Description |
|---|---|---|---|
| `workflowRef` | ref(Workflow) | yes | Registry reference `[L6]` |
| `bindingKind` | enum | yes | show-current-state \| available-transitions \| trigger-transition \| task-inbox \| timeline |
| `attachPoint` | ref(View\|Component\|Action) | yes | Where it binds |
| `stateMappings` | map<workflowState, UITreatment> | no | e.g., state → StatusChip color/label |
| `transitionActions` | map<transition, ref(Action)> | no | UI affordances for transitions |

**Invariants.** The UI *must not* implement transition logic; it only displays state and requests transitions, which the Workflow Engine authorizes `[L39]`. `stateMappings` keys *must* be valid states of `workflowRef` (build-validated).

## 1.12 Supporting objects (condensed)
Specified fully in their canonical sections; included here for coherence.
- **Module** — functional grouping of Pages; unit of feature on/off across the cascade.
- **Section** — labeled grouping within a View; finest common cascade override target.
- **Data Source** — named registry binding; `type` ∈ {entity, relationship, aggregation, query, search, api, context}; carries filter/sort/paging/writeCapability; resolves to the registry `[L6]`. Data-dense reads served by read models `[L30]`.
- **Navigation** — routing/menu tree referencing Pages; per-profile variants (web vs native).
- **Theme** — token sets mapped to the design system; primary cascade branding lever `[L33]`.
- **Validation** — declarative constraint referencing the Rule/Expression engine; prime `merge` override target.
- **Rule Binding** — attaches a Rule Engine rule to a binding point (visibility/enablement/default/derived).
- **Accessibility / Responsive / Mobile / Security metadata** — cross-cutting; default-on where applicable `[L35]`.

## 1.13 Cross-object invariants (normative summary)
1. Every binding resolves to a registry object or it is a build error `[L6][L22]`.
2. `logicalKey` is unique within (parent scope, cascade level) `[L10]`.
3. `overrideOf` resolves to an existing higher-level node or it is an orphan → build error `[L22]`.
4. Components bind only within their View/Page DataSource scope `[L22]`.
5. Workflow/transition references are validated against the engine's state machine `[L39]`.
6. No object carries business logic; logic is referenced from the Rule/Workflow engines `[L4][L5]`.
7. No `semanticType` outside the registered design-system catalogue `[L32]`.
8. No layout expresses absolute coordinates `[L34]`.
9. Every node is cascade-decorated and resolves deterministically `[L11]`.

## 1.14 Worked example — a Sales Order page (abridged)
A `transaction-entry` Page: header View + line-items View, submit triggers a workflow transition; an OEM overlay hides a field.

```jsonc
// Vertical (Automotive) baseline
{ "object":"Page","logicalKey":"page.salesOrder","cascadeLevel":"vertical",
  "archetype":"transaction-entry","route":"/orders/:id",
  "primaryDataSourceRef":"ds.salesOrder",
  "views":["view.orderHeader","view.orderLines"],
  "layoutRef":"layout.split.vertical",
  "pageActions":["action.submitOrder"] }

{ "object":"DataSource","logicalKey":"ds.salesOrder","cascadeLevel":"vertical",
  "type":"entity","targetRef":"entity.SalesOrder","writeCapability":true }

{ "object":"View","logicalKey":"view.orderLines","cascadeLevel":"vertical",
  "dataSourceRef":"ds.orderLines","layoutRef":"layout.stack",
  "sections":["section.lines"] }

{ "object":"Component","logicalKey":"cmp.linesGrid","cascadeLevel":"vertical",
  "semanticType":"DataTable",
  "dataBindingRef":{"bind":{"kind":"dataSource","ref":"ds.orderLines"}},
  "props":{"editable":true,"aggregations":{"amount":"sum"}} }

{ "object":"Action","logicalKey":"action.submitOrder","cascadeLevel":"vertical",
  "kind":"trigger-workflow-transition",
  "target":{"workflow":"wf.orderApproval","transition":"submit"},
  "preconditions":["rule.orderHasLines"],"securityGate":"sec.canSubmitOrder" }

{ "object":"WorkflowBinding","logicalKey":"wb.orderStatus","cascadeLevel":"vertical",
  "workflowRef":"wf.orderApproval","bindingKind":"show-current-state",
  "attachPoint":"view.orderHeader",
  "stateMappings":{"draft":"StatusChip.neutral","approved":"StatusChip.success"} }

// OEM (Toyota) overlay — hide a field, no copy of the page [L7]
{ "object":"Component","logicalKey":"cmp.discountField","cascadeLevel":"tenant",
  "overrideOf":"cmp.discountField","overrideOps":[{"op":"remove"}] }
```
At compile, Toyota's resolved artifact = Vertical baseline with `cmp.discountField` suppressed; Dealers inheriting Toyota get the same unless they override further. The runtime reads only the resolved artifact `[L19]`.

## 1.15 Open items (Meta Model)
- O1: Confirm the canonical `semanticType` enumeration — owned by doc 06 (Design System Engine); the Meta Model only requires that it be a closed, registered set `[L32]`.
- O2: Wizard archetype's step model — is a Wizard one Page with step-State, or multiple Pages? (Affects State scope.) Proposed: one Page, step-scoped State; confirm.
- O3: Section necessity — keep Section as a distinct object, or allow View→Component directly with Section optional? Proposed: Section optional but available; confirm.
- O4: `objectVersion` vs. cascade-level versioning interaction — reconciled in doc 07 (Compiler).

---

## Next document
**02 — Runtime Core (Renderer · State Manager · Navigation Engine · Binding Engine):** how the compiled artifact built from this Meta Model is interpreted at runtime — the four engines, their contracts, and how they realize `[L19][L26][L27][L31]`. Following the same spec depth.

*End of Document 01. The Meta Model is the foundation every subsequent document references; changes here ripple, so O1–O4 are worth resolving before doc 02 hardens the Runtime contracts against them.*
