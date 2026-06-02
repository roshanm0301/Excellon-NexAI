# Skills Specification — 5 Claude Code Skills

> These are Claude Code skills (not agents) that accelerate UI Studio development.
> Invoke with `/skill ui-studio-<name>` during implementation.

---

## Skill 1: `ui-studio-component-builder`

**Purpose:** Scaffold a complete new component entry.

**Input:** component_code, component_name, category, supported_surfaces

**Output (all files generated):**
1. `ComponentRegistryEntry` SQL `INSERT` statement for `008_ui_studio_components.sql`
2. Runtime renderer stub: `components/studio-v2/runtime/{ComponentName}Runtime.tsx`
3. Designer panel stub: `components/studio-v2/panels/{ComponentName}Panel.tsx`
4. `config_schema` JSON Schema object
5. Unit test file: `__tests__/{ComponentName}Runtime.test.tsx`
6. `RUNTIME_MAP` entry for `ComponentRenderer.tsx`

**Example invocation:**
```
/skill ui-studio-component-builder
component_code: approval_checklist
component_name: Approval Checklist
category: workflow
supported_surfaces: ["standard_crud","header_line"]
```

---

## Skill 2: `ui-studio-view-generator`

**Purpose:** Generate a valid `ViewArtifactPayload` JSON from a specification.

**Input:** surface_type, primary_entity, field_list (comma-separated)

**Output:** Complete `ViewArtifactPayload` JSON ready for:
- Import via `POST /api/v1/studio/views/import`
- Direct DB insert as draft artifact_version
- Test fixture use in renderer/binding tests

**Example invocation:**
```
/skill ui-studio-view-generator
surface_type: standard_crud
primary_entity: customer
fields: name, email, phone, status, assigned_agent
```

---

## Skill 3: `ui-studio-event-builder`

**Purpose:** Generate `EventDefinition` JSON from plain English.

**Input:** plain-language description of the event behavior

**Output:**
- `EventDefinition` JSON matching the schema in `types/studio.ts`
- Validates against event schema (checks action types, field references)
- Ready to paste into view payload `event_definitions` array

**Example invocation:**
```
/skill ui-studio-event-builder
"When qty changes and qty > 0, recalculate amount as qty * rate.
 Also refresh the itemCode lookup when productType changes."
```

---

## Skill 4: `ui-studio-migration-builder`

**Purpose:** Generate safe UP + DOWN migration SQL for UI Studio schema changes.

**Input:** description of the schema change (add table, add column, add index)

**Output:**
- `UP` migration SQL with `IF NOT EXISTS` guards
- `DOWN` migration SQL (reversible)
- Impact check: lists any existing artifact rows affected
- Migration unit test stub

**Example invocation:**
```
/skill ui-studio-migration-builder
Add column 'is_template' BOOLEAN DEFAULT false to artifact_header.
```

---

## Skill 5: `ui-studio-test-generator`

**Purpose:** Generate complete test coverage for a UI Studio feature.

**Input:** feature spec section (copy from phase file) + implemented file paths

**Output:**
- Unit test file (`*.test.ts`) — function-level tests for pure logic
- Integration test file (`*.integration.test.ts`) — API + DB tests
- E2E test file (`*.e2e.ts`) — Playwright user flow tests
- Test cases match the Testing section of the relevant phase file
- Coverage includes: happy path, edge cases, error conditions

**Example invocation:**
```
/skill ui-studio-test-generator
feature: "Field Change Event Configuration" (P0-13)
phase_file: docs/ui-studio/phases/P5-event-engine.md, section 5.6
files: src/lib/studio-v2/eventEngine.ts, src/lib/studio-v2/useEventEngine.ts
```
