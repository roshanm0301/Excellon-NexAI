# UI Studio — Phase 3: UI Design Specification

**Excellon Enterprise Platform · UI Studio product**
Status: Draft · governed by Constitution v1.0, the PDR, and the Phase 2 UX Spec
Scope: visual/structural design for the Studio surfaces — wireframes, layout, component hierarchy (shadcn chrome per PDR-01), and states. Depth is weighted to the differentiating surfaces; routine surfaces are compact.

## 0. Conventions
**ASCII legend:** `│ ─ ┌ └` panel borders · `[ ]` button · `▸ ▾` disclosure · `◉ ○` selection · `▢` drop target · `…` truncation.
**State taxonomy** (every surface specifies these): **Default · Empty · Loading · Error** (plus differentiator-specific states where relevant).
**Chrome stack:** shadcn/ui + Tailwind. The **Canvas content** is an embedded interpreted preview rendering authored output via the runtime vocabulary (Excellon DS / MUI Pro) — not shadcn.

## 1. Shared visual language: origin badges (the cascade legibility primitive)
Defined once; used in Explorer, Canvas, Inspector. Relative to the current **editing level**:

| State | Visual | Meaning |
|---|---|---|
| Inherited | dashed muted outline · `↑V`/`↑P` badge | from a higher level; read-only here |
| Overridden | solid accent outline · `●` dot | inherited but changed here |
| Own | solid neutral · `+` badge | created here |
| Suppressed | strikethrough ghost | inherited then removed |
| Orphaned | red outline · `!` badge | override whose source vanished |

shadcn `Badge` variants + Tailwind ring/border tokens implement these. Color is never the *only* signal (a11y): each state has a badge glyph + tooltip.

---

## 2. Editor Workspace — master shell
**Wireframe**
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Editing: Automotive ▸ Toyota(OEM) ▾   Preview as: Dealer-X ▾    [⌘K]   ●●  [Validate][Publish]│ Context Bar
├──┬────────────────────────┬─────────────────────────────────────────────┬──────────────────┤
│⊞ │ EXPLORER          ⌕   │  Sales Order            [⊟ desktop|tablet|mobile]│ INSPECTOR        │
│⌕ │ ▾ DMS (app)           │  ┌─────────────────────────────────────────┐  │ DataTable ●over  │
│! │  ▾ Sales (module)     │  │ Order Header        [↑V inherited]        │  │ [Props][Bind]    │
│⟲ │   ▾ Sales Order ●     │  │  Customer ▢   Date ▢   Status: ◉Chip      │  │ [Events][Valid]  │
│▷ │    ▾ Header View ↑V   │  ├─────────────────────────────────────────┤  │ ────────────     │
│⚙ │     · Customer ↑V     │  │ Lines (DataTable) ●overridden             │  │ editable  [t/f]↑V│
│  │     · Discount ⊘supp  │  │  ┌──┬─────┬─────┬──────┐                  │  │ aggregations ●   │
│  │    ▾ Lines View +     │  │  │# │Item │Qty  │Amount│  ◉ selected      │  │  amount: sum     │
│  │     · LinesGrid ●     │  │  ├──┼─────┼─────┼──────┤                  │  │ ──────────       │
│  │ ── Asset Library ──   │  │  │1 │...  │ 2   │ 120  │                  │  │ Binding:         │
│  │ [Archetypes][Comps]   │  │  └──┴─────┴─────┴──────┘ Σ 120           │  │  ds.OrderLine ▸  │
│  │  ▦ DataTable          │  │            [+ Add line]                   │  │ Origin: ●Toyota  │
│  │  ▦ FormField …        │  └─────────────────────────────────────────┘  │  [revert ↩]      │
├──┴────────────────────────┴─────────────────────────────────────────────┴──────────────────┤
│ PROBLEMS (0)   PREVIEW   |  ✓ no issues                                                       │ Bottom dock
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
**Layout structure:** CSS grid — Context Bar (fixed top), Activity Bar (fixed left), resizable Left panel (Explorer/Asset Library tabs), flexible Canvas (center), resizable Right panel (Inspector), resizable Bottom dock (Problems/Preview). shadcn `ResizablePanelGroup`.
**Component hierarchy:** `ShellLayout` → `ContextBar` (`Select` ×2, `Button`, `Avatar` presence, `Command` trigger) · `ActivityBar` (`Tooltip` icon `Button`s) · `LeftPanel` (`Tabs` → `ExplorerTree` | `AssetLibrary`) · `CanvasHost` (`CanvasToolbar` + `CanvasSurface`) · `InspectorPanel` (`Tabs`) · `BottomDock` (`Tabs`).
**States:** *Default* above · *Empty* = no app open → Workspace Home (§12) · *Loading* = skeleton panels (shadcn `Skeleton`) while registry loads · *Error* = registry/API unreachable → full-panel error with retry + "network settings" note.

---

## 3. Explorer
**Wireframe**
```
┌ EXPLORER ───────────────── ⌕ ┐
│ Editing: Toyota(OEM) ▾        │
│ Filter:[all|mine|orphans] ▾   │
│ ▾ DMS                         │
│  ▾ Sales                      │
│   ▾ Sales Order        ●      │
│    ▾ Header View       ↑V     │
│     · Customer         ↑V     │
│     · Discount         ⊘      │
│    ▾ Lines View        +      │
│     · LinesGrid        ●      │
│   ▸ Order List         ↑V     │
└───────────────────────────────┘
```
**Layout:** vertical tree, sticky cascade header + filter. **Hierarchy:** `ExplorerPanel` → `CascadeHeader` (`Select`) → `FilterBar` (`ToggleGroup`) → `Tree` (`TreeItem` with `Badge` origin glyph, context `DropdownMenu`: override-here / rename / delete / reveal-in-canvas). **States:** *Empty* = "No application open" + [Open]/[New] · *Loading* = tree skeleton · *Error* = "Couldn't load definitions" + retry. *Special:* orphaned nodes pinned to top of filter when "orphans" selected.

## 4. Canvas
**Wireframe** (selection + breakpoint shown)
```
┌ Sales Order  [desktop|tablet|mobile]  [100%▾] [fit] ─────────────┐
│  ┌── Header View [↑V] ─────────────────────────────────────────┐ │
│  │  Customer:[▢ bind]   Date:[▢]   Status:[◉ Chip]              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌── Lines View [+] ───────────────────────────────────────────┐ │
│  │  ▢ drop component here                                       │ │
│  │  ┌ LinesGrid [●] ───────────────────────────────┐  ◉ handles │ │
│  │  │ #  Item        Qty   Amount                   │           │ │
│  │  │ 1  Brake pad    2     120                      │           │ │
│  │  └────────────────────────────────────Σ 120──────┘           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```
**Layout:** toolbar (breakpoint `ToggleGroup`, zoom `Select`, fit) + scrollable surface; nodes rendered in flow layout with region drop targets `[L34]`; selected node shows handles + origin badge. **Hierarchy:** `CanvasHost` → `CanvasToolbar` → `CanvasSurface` (embeds the **interpreted preview renderer**; overlays a `SelectionLayer` + `DropTargetLayer` + `OriginBadgeLayer` on top of the rendered tree). **States:** *Default* above · *Empty* = page with no content → centered "Drop an archetype or component" + [Choose archetype] · *Loading* = "Resolving preview…" shimmer over surface · *Error* = preview/interpret failure → inline banner "Can't render: <reason>" with jump-to-Problems; broken-binding nodes render as red placeholder boxes, not blanks.

## 5. Inspector
**Wireframe** (DataTable selected, Bindings tab)
```
┌ INSPECTOR ─ DataTable ● overridden ┐
│ [Props][Bindings][Events][Valid]…  │
│ ── Data binding ──                 │
│  Source: ds.OrderLine        ▸     │
│  Origin: ● Toyota   [revert ↩]     │
│ ── Columns (from entity) ──        │
│  ☑ item    ☑ qty    ☑ amount       │
│  ☐ discount  ↑V (inherited shown)  │
│ ── Behavior ──                     │
│  editable        [on] ↑V           │
│  aggregations    amount: [sum▾] ●  │
└────────────────────────────────────┘
```
**Layout:** sticky node header (name + origin) + `Tabs` + scroll. Each property row: label · control · **origin badge** · revert affordance. **Hierarchy:** `InspectorPanel` → `NodeHeader` (`Badge`) → `Tabs` → `PropertyRow`* (`Label`, control [`Input`/`Switch`/`Select`/`Combobox`], `OriginBadge`, revert `Button`) · static↔bound toggle opens `BindingPicker` (§7). **States:** *Empty* = no selection → "Select a node to edit" · *Loading* = row skeletons · *Error* = invalid value inline (`FormMessage`, Zod) blocking save.

## 6. Asset Library
**Wireframe**
```
┌ ASSET LIBRARY ──────── ⌕ ┐
│ [Archetypes][Components]  │
│ ▸ Foundation              │
│ ▾ Data Display            │
│   ▦ DataTable             │
│   ▦ KpiCard               │
│   ▦ Chart                 │
│ ▾ Workflow                │
│   ▦ TaskInbox …           │
└───────────────────────────┘
```
**Layout:** tabbed, collapsible categories, draggable cards. **Hierarchy:** `AssetLibrary` → `Tabs` → `Accordion` category → `DraggableCard` (`Badge` if custom/approved). **States:** *Empty* (search no match) = "No components match" · *Loading* = card skeletons · *Error* = "Couldn't load catalogue" + retry. Items unavailable for the app's target profile render dimmed with tooltip.

## 7. Registry Binding Picker (differentiator)
**Wireframe**
```
┌ Bind data ───────────────────────────── ✕ ┐
│ ⌕ search entities/relationships/queries    │
│ ▾ Entities                                 │
│   ▸ SalesOrder                             │
│   ▾ OrderLine                ◉ selected    │
│      item (string)  qty (int)  amount (dec)│
│ Suggested: DataTable columns = item,qty,amt│
│ Preview shape: { item, qty, amount } ✓     │
│                         [Cancel] [Bind]     │
└─────────────────────────────────────────────┘
```
**Layout:** search + registry tree + suggestion + resolved-shape preview + actions. Free text is impossible — only registry picks `[L6]`. **Hierarchy:** `Dialog` → `Command`(search) → `RegistryTree` → `SuggestionPanel` → `ShapePreview` → `DialogFooter`. **States:** *Empty* (no match) = "No matching registry objects" · *Loading* = "Querying registry…" · *Error* = "Registry unavailable" + retry; *Invalid* = type-incompatible target disables [Bind] with reason.

## 8. Event / Action Builder
**Wireframe**
```
┌ Event: onClick (Submit) ───────── ✕ ┐
│ When: onClick ▾                      │
│ If (rule): orderHasLines ▸           │
│ Do:                                  │
│  1. trigger-workflow-transition      │
│     workflow: orderApproval          │
│     transition: submit ▾ (valid set) │
│  2. navigate → /orders               │
│  [+ add action]                      │
│ Security: canSubmitOrder ▸           │
│                    [Cancel] [Save]    │
└───────────────────────────────────────┘
```
**Layout:** trigger → condition → ordered action list → security. Transition picker shows only valid transitions `[L39]`. **Hierarchy:** `Dialog` → `Select`(trigger) → `RuleBrowser` → `SortableList`(`ActionRow` with kind `Select` + target browser) → security browser. **States:** *Empty* = no actions → "Add an action" · *Loading* = engine fetch skeleton · *Error* = invalid transition → row error, save blocked.

## 9. Override-here flow
**Wireframe** (popover on inherited node)
```
┌ Override at Toyota level? ─────┐
│ Inherited from Automotive (V). │
│ Editing here forks this node;  │
│ the baseline is unchanged.     │
│        [Cancel] [Override]      │
└─────────────────────────────────┘
```
**Hierarchy:** `Popover`/`AlertDialog` from an inherited node’s edit attempt. **States:** single confirm; post-override the node flips to `●`. Revert path mirrors this (`revert-to-inherited`).

## 10. Preview Mode
**Wireframe**
```
┌ PREVIEW  as: [Dealer-X ▾]  role:[Sales ▾]  [desktop|tablet|mobile]  data:[sample▾] ┐
│  (full interpreted render of the resolved cascade for Dealer-X, role-filtered)     │
└────────────────────────────────────────────────────────────────────────────────────┘
```
**Layout:** preview toolbar + full-bleed interpreted render. **Hierarchy:** `PreviewToolbar` (`Select`s, `ToggleGroup`) → `PreviewSurface` (interpreted renderer, no edit overlays). **States:** *Empty* = "Nothing to preview" · *Loading* = "Resolving for Dealer-X…" · *Error* = resolution failure → reasons + jump-to-Problems.

## 11. Problems / Validation & 12. Cascade Impact (gates)
**Problems wireframe**
```
┌ PROBLEMS (2) ───────────────────────────────────────┐
│ ✗ Broken binding · LinesGrid · ds.OrderLine missing  │ → [Go]
│ ! Orphaned override · Discount (Toyota) · source gone │ → [Go]
└────────────────────────────────────────────────────────┘
```
**Cascade Impact wireframe** (publish gate)
```
┌ Publish baseline change — impact ──────────── ✕ ┐
│ Affects: 3 OEMs · 41 dealers                     │
│ Overrides at risk: 5    Would orphan: 2          │
│ ▸ details by OEM                                 │
│        [Cancel]   [Proceed to publish]            │
└───────────────────────────────────────────────────┘
```
**Hierarchy:** Problems = `Tabs` dock → `DataTable` of issues (severity `Badge`, jump `Button`). Impact = `Dialog` → summary stats + `Accordion` by OEM. **States:** Problems *Empty* = "✓ No issues"; *Loading* = "Validating…"; *Error* = validation service error. Impact *Loading* = "Computing impact…"; *Error* = "Couldn't compute impact — publish blocked" (fail-safe `[L45]`).

## 13. Publish / Promote
**Wireframe**
```
┌ Publish ───────────────────────────── ✕ ┐
│ Target: [staging ▾]                       │
│ Validation: ✓ passed                      │
│ Impact: 3 OEMs / 41 dealers (view ▸)      │
│ [Promote dev→staging]   [Rollback ↩]      │
└────────────────────────────────────────────┘
```
**Hierarchy:** `Dialog` → env `Select` → validation summary → impact link (§12) → promote/rollback `Button`s (calls Compiler API, PDR-14). **States:** *Loading* = "Compiling…" progress; *Error* = build failed → links to Problems (fail loud `[L21]`); *Success* = toast + version pinned.

## 14. Routine surfaces (compact)
- **Sign-in (A1):** centered `Card` + SSO `Button`. Loading = spinner; Error = "Sign-in failed" + retry.
- **Workspace Home (A2):** top env/level bar + `Card` grid of apps (name, vertical, presence, lock) + [New]. Empty = "No applications yet" + [Create]; Loading = card skeletons; Error = retry.
- **Command Palette (B6):** `Command` overlay, grouped results. Empty = "No commands match"; no error state (local).
- **Version history & diff (D3):** timeline list + node-level `diff` view. Empty = "No history"; Loading = skeleton; Error = retry.
- **Settings (E1):** sectioned form (`Tabs` + `Form`), incl. theme-token authoring. Standard form states.

---

## 15. Phase 3 summary & open items
**Covered:** wireframes, layout, shadcn component hierarchy, and empty/loading/error states for all surfaces, with the origin-badge visual language defined once and reused — the cascade legibility primitive.
**Open items into Phase 4:**
- OI-P3-1: Build a clickable prototype of Explorer + Canvas + Inspector origin-badge interaction and the override-here flow, and user-test it (carries OI-P2-1 / Investment U1). Still the top risk.
- OI-P3-2: Canvas overlay architecture (selection/drop/badge layers atop an interpreted renderer) is the hardest piece — detailed in Phase 4 component architecture.
- OI-P3-3: Broken-binding render-as-red-placeholder behavior must be consistent between Canvas preview and runtime.

*Next: Phase 4 — Frontend Architecture Specification (folder structure, state, component, service, mock-API, and routing architecture) for the React 19 / TS / Vite / TanStack / Zustand / Tailwind / shadcn / React DnD / RHF / Zod stack, with backend mocked.*
