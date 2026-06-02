# Phase 2 — Component Registry

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M3 |
| **Gate Condition** | All 56 platform components queryable via API; admin screen renders them |
| **Depends On** | [Phase 1](P1-metadata-foundation.md) migration committed — `ui_component_registry` table must exist |
| **Agents** | Agent 7 (Component Registry) ‖ Agent 4 (Backend API) → Agent 14 (QA) + Agent 17 (Contract) + Agent 15 (Docs) + Agent 16 (Coordinator) |
| **Code Changes** | ✅ SQL seed · Go API routes · React admin page |
| **Commit** | `feat: ui-studio Phase 2 — component registry, 56 platform components seeded, plugin contract, admin screen` |

> **Depends on Phase 1:** `ui_component_registry` table created in migration `025_ui_studio_foundation.up.sql`.

---

## New Files to Create

```
app/db/seed/008_ui_studio_components.sql
app/src/react/src/pages/admin/ui-studio/ComponentRegistryPage.tsx   NEW
app/src/react/src/config/studioViewsApi.ts                          ← extend existing
```

---

## 2.1 Component Registry Seed — `008_ui_studio_components.sql`

```sql
INSERT INTO ui_component_registry
  (component_code, component_name, category, supported_surfaces, supported_bindings,
   is_container, event_support, runtime_renderer, designer_panel)
VALUES
-- LAYOUT (8 components)
('page_root',        'Page Root',              'layout', '["all"]', '["none"]',                              true,  '{}',                              'PageRoot',             'PageRootPanel'),
('section',          'Section',                'layout', '["all"]', '["none"]',                              true,  '{}',                              'Section',              'SectionPanel'),
('tab_container',    'Tab Container',          'layout', '["all"]', '["none"]',                              true,  '{}',                              'TabContainer',         'TabContainerPanel'),
('column_layout',    'Column Layout',          'layout', '["all"]', '["none"]',                              true,  '{}',                              'ColumnLayout',         'ColumnLayoutPanel'),
('card',             'Card',                   'layout', '["all"]', '["none"]',                              true,  '{}',                              'Card',                 'CardPanel'),
('accordion',        'Accordion',              'layout', '["all"]', '["none"]',                              true,  '{}',                              'Accordion',            'AccordionPanel'),
('page_header',      'Page Header',            'layout', '["all"]', '["none"]',                              false, '{}',                              'PageHeader',           'PageHeaderPanel'),
('action_bar',       'Action Bar',             'layout', '["all"]', '["none"]',                              false, '{"emits":["onClick"]}',           'ActionBar',            'ActionBarPanel'),

-- FORM (14 components)
('text_input',       'Text Input',             'form', '["standard_crud","advanced_crud","header_line","wizard"]', '["entity_field"]',                false, '{"emits":["onChange"]}',          'TextInput',            'TextInputPanel'),
('textarea',         'Text Area',              'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'TextArea',             'TextAreaPanel'),
('number_input',     'Number Input',           'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'NumberInput',          'NumberInputPanel'),
('currency_input',   'Currency Input',         'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'CurrencyInput',        'CurrencyInputPanel'),
('date_picker',      'Date Picker',            'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'DatePicker',           'DatePickerPanel'),
('datetime_picker',  'Date Time Picker',       'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'DateTimePicker',       'DateTimePickerPanel'),
('toggle',           'Toggle',                 'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'Toggle',               'TogglePanel'),
('dropdown',         'Dropdown',               'form', '["all"]', '["entity_field","data_source"]',          false, '{"emits":["onChange"]}',          'Dropdown',             'DropdownPanel'),
('multi_select',     'Multi Select',           'form', '["all"]', '["entity_field","data_source"]',          false, '{"emits":["onChange"]}',          'MultiSelect',          'MultiSelectPanel'),
('entity_picker',    'Entity Picker',          'form', '["all"]', '["entity_field","data_source"]',          false, '{"emits":["onChange","onSelect"]}','EntityPicker',         'EntityPickerPanel'),
('file_upload',      'File Upload',            'form', '["all"]', '["entity_field"]',                        false, '{}',                              'FileUpload',           'FileUploadPanel'),
('rich_text_editor', 'Rich Text Editor',       'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'RichTextEditor',       'RichTextPanel'),
('signature_capture','Signature Capture',      'form', '["standard_crud","header_line"]', '["entity_field"]',false, '{"emits":["onSign"]}',            'SignatureCapture',      'SignaturePanel'),
('rating_scoring',   'Rating / Scoring',       'form', '["all"]', '["entity_field"]',                        false, '{"emits":["onChange"]}',          'RatingScoring',        'RatingPanel'),

-- DISPLAY (10 components)
('text_display',     'Text Display',           'display', '["all"]', '["entity_field","computed"]',          false, '{}',                              'TextDisplay',          'TextDisplayPanel'),
('status_badge',     'Status Badge',           'display', '["all"]', '["entity_field"]',                     false, '{}',                              'StatusBadge',          'StatusBadgePanel'),
('currency_display', 'Currency Display',       'display', '["all"]', '["entity_field","computed"]',          false, '{}',                              'CurrencyDisplay',      'CurrencyDisplayPanel'),
('date_display',     'Date Display',           'display', '["all"]', '["entity_field"]',                     false, '{}',                              'DateDisplay',          'DateDisplayPanel'),
('entity_link',      'Entity Link',            'display', '["all"]', '["entity_field"]',                     false, '{}',                              'EntityLink',           'EntityLinkPanel'),
('image',            'Image',                  'display', '["all"]', '["entity_field"]',                     false, '{}',                              'Image',                'ImagePanel'),
('progress_bar',     'Progress Bar / Gauge',   'display', '["all"]', '["entity_field","computed"]',          false, '{}',                              'ProgressBar',          'ProgressBarPanel'),
('separator',        'Separator',              'display', '["all"]', '["none"]',                             false, '{}',                              'Separator',            'SeparatorPanel'),
('qr_barcode',       'QR / Barcode Display',   'display', '["all"]', '["entity_field","computed"]',          false, '{}',                              'QRBarcode',            'QRBarcodePanel'),
('sparkline',        'Sparkline / Mini Chart', 'display', '["dashboard","standard_crud"]', '["data_source","computed"]', false, '{}',                  'Sparkline',            'SparklinePanel'),

-- DATA (8 components)
('list_grid',        'List Grid',              'data', '["standard_crud","advanced_crud"]', '["data_source"]',          false, '{"emits":["onRowSelect","onRowClick"]}',                                           'ListGrid',             'ListGridPanel'),
('editor_grid',      'Editor Grid',            'data', '["header_line","advanced_crud"]',   '["data_source","relationship"]', false, '{"emits":["onCellChange","onRowAdd","onRowDelete","onRowSelect"]}',          'EditorGrid',           'EditorGridPanel'),
('kpi_card',         'KPI Card',               'data', '["dashboard"]', '["computed","data_source"]',         false, '{}',                              'KPICard',              'KPICardPanel'),
('bar_chart',        'Bar Chart',              'data', '["dashboard"]', '["data_source"]',                    false, '{}',                              'BarChart',             'BarChartPanel'),
('line_chart',       'Line Chart',             'data', '["dashboard"]', '["data_source"]',                    false, '{}',                              'LineChart',            'LineChartPanel'),
('donut_chart',      'Donut Chart',            'data', '["dashboard"]', '["data_source"]',                    false, '{}',                              'DonutChart',           'DonutChartPanel'),
('tree_view',        'Tree / Hierarchy View',  'data', '["all"]', '["data_source","relationship"]',           false, '{}',                              'TreeView',             'TreeViewPanel'),
('conditional_row_format','Conditional Row Format','data','["standard_crud","advanced_crud","header_line"]','["computed"]', false, '{}',               'ConditionalRowFmt',    'CondRowFmtPanel'),

-- TRANSACTION (6 components)
('totals_panel',           'Totals Panel',               'transaction', '["header_line"]',                  '["computed"]',                false, '{}',                              'TotalsPanel',          'TotalsPanelPanel'),
('tax_charge_column',      'Tax / Charge Column',        'transaction', '["header_line"]',                  '["computed","data_source"]',  false, '{}',                              'TaxChargeColumn',      'TaxChargePanel'),
('action_bar_transaction', 'Transaction Action Bar',     'transaction', '["header_line","standard_crud"]',  '["none"]',                    false, '{"emits":["onClick"]}',            'ActionBarTransaction',  'ActionBarTransactionPanel'),
('validation_summary',     'Validation Summary',         'transaction', '["all"]',                          '["none"]',                    false, '{}',                              'ValidationSummary',    'ValidationSummaryPanel'),
('attachment_notes',       'Attachment / Notes',         'transaction', '["all"]',                          '["none"]',                    false, '{}',                              'AttachmentNotes',      'AttachmentNotesPanel'),
('record_highlights',      'Record Summary / Highlights','transaction', '["all"]',                          '["computed"]',                false, '{}',                              'RecordHighlights',     'RecordHighlightsPanel'),

-- VISUALIZATION (4 components)
('calendar_view',    'Calendar / Schedule',    'visualization', '["all"]',    '["data_source"]',                       false, '{}', 'CalendarView',   'CalendarViewPanel'),
('timeline_gantt',   'Timeline / Gantt',       'visualization', '["all"]',    '["data_source"]',                       false, '{}', 'TimelineGantt',  'TimelineGanttPanel'),
('map_geolocation',  'Map / Geolocation',      'visualization', '["all"]',    '["entity_field","data_source"]',        false, '{}', 'MapGeolocation', 'MapGeolocationPanel'),
('kanban_board',     'Kanban / Board',         'visualization', '["kanban"]', '["data_source"]',                       false, '{}', 'KanbanBoard',    'KanbanBoardPanel'),

-- WORKFLOW (4 components)
('workflow_status_strip',    'Workflow Status Strip',    'workflow', '["all"]', '["workflow_state"]',  false, '{"emits":["onAction"]}',                  'WorkflowStatusStrip',      'WorkflowStatusStripPanel'),
('approval_panel',           'Approval Panel',           'workflow', '["all"]', '["workflow_state"]',  false, '{"emits":["onApprove","onReject"]}',       'ApprovalPanel',            'ApprovalPanelPanel'),
('audit_timeline',           'Audit Timeline',           'workflow', '["all"]', '["none"]',            false, '{}',                                       'AuditTimeline',            'AuditTimelinePanel'),
('workflow_action_button',   'Workflow Action Button',   'workflow', '["all"]', '["workflow_state"]',  false, '{"emits":["onClick"]}',                    'WorkflowActionButton',     'WorkflowActionButtonPanel'),

-- MEDIA (2 components)
('image_document_gallery', 'Image / Document Gallery', 'media', '["all"]', '["none"]', false, '{}', 'ImageDocumentGallery', 'ImageGalleryPanel'),
('embedded_view',          'Embedded View',            'media', '["all"]', '["none"]', false, '{}', 'EmbeddedView',         'EmbeddedViewPanel');
```

---

## 2.2 Admin Page — `pages/admin/ui-studio/ComponentRegistryPage.tsx`

Key UI requirements:
- Table columns: Code | Name | Category | Surfaces | Bindings | Events | Source
- Row expand: full `config_schema` as formatted JSON
- Filter chips: by category (Layout / Form / Display / Data / Transaction / Visualization / Workflow / Media)
- Filter: by surface type — show only components valid for selected surface
- Platform components: read-only rows
- Plugin components: editable, removable rows
- Plugin section at bottom: install plugin (paste manifest URL), list installed plugins with remove button

---

## 2.3 Navigation — add to router config

```typescript
// Add nav group "UI Studio":
{ path: '/admin/ui-studio',            label: 'View Designer' }
{ path: '/admin/ui-studio/components', label: 'Component Registry' }
```

---

## Testing Phase 2

### Unit Tests — `ComponentRegistry.test.ts`

```typescript
// 1. Seed count
// Query ui_component_registry → expect exactly 56 rows
test('seeds exactly 56 platform components', async () => {
  const result = await db.query('SELECT COUNT(*) FROM ui_component_registry WHERE source = $1', ['platform'])
  expect(Number(result.rows[0].count)).toBe(56)
})

// 2. Category counts
// layout=8, form=14, display=10, data=8, transaction=6, visualization=4, workflow=4, media=2
const EXPECTED_COUNTS = { layout:8, form:14, display:10, data:8, transaction:6, visualization:4, workflow:4, media:2 }
Object.entries(EXPECTED_COUNTS).forEach(([cat, count]) => {
  test(`category '${cat}' has ${count} components`, async () => { ... })
})

// 3. All runtime_renderer and designer_panel fields populated
test('no component has null runtime_renderer', async () => {
  const result = await db.query('SELECT component_code FROM ui_component_registry WHERE runtime_renderer IS NULL')
  expect(result.rows).toHaveLength(0)
})
```

### API Integration Tests — `ComponentRegistryAPI.integration.test.ts`

```typescript
// Test 1: list all
GET /api/v1/studio/component-registry
Expected: 200, array.length === 56

// Test 2: filter by surface
GET /api/v1/studio/component-registry?surface=header_line
Expected: only components with "header_line" in supported_surfaces
  (editor_grid, totals_panel, tax_charge_column, action_bar_transaction,
   validation_summary, attachment_notes, record_highlights — plus "all" components)

// Test 3: filter by category
GET /api/v1/studio/component-registry?category=transaction
Expected: exactly 6 components
  (totals_panel, tax_charge_column, action_bar_transaction,
   validation_summary, attachment_notes, record_highlights)

// Test 4: get single component
GET /api/v1/studio/component-registry/editor_grid
Expected: 200, component_code='editor_grid',
  supported_surfaces includes 'header_line' and 'advanced_crud'
  event_support.emits includes 'onCellChange', 'onRowAdd', 'onRowDelete'

// Test 5: plugin registration
POST /api/v1/studio/plugins
Body: { "plugin_name":"Test Plugin","version":"1.0.0","author":"test","tenant_id":"..." }
Expected: 201

GET /api/v1/studio/plugins
Expected: 200, includes the registered plugin

DELETE /api/v1/studio/plugins/:pluginId
Expected: 200 — plugin removed
```

### Admin Screen Tests — `ComponentRegistryPage.e2e.ts` (Playwright)

```typescript
// E2E 1: Admin screen loads all components
test('admin screen shows 56 components', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/components')
  await expect(page.locator('table tbody tr')).toHaveCount(56)
})

// E2E 2: Category filter
test('transaction filter shows 6 rows', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/components')
  await page.click('[data-filter="transaction"]')
  await expect(page.locator('table tbody tr')).toHaveCount(6)
})

// E2E 3: Row expand shows config_schema JSON
test('row expand shows formatted JSON', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/ui-studio/components')
  await page.click('text=text_input')
  await expect(page.locator('[data-config-schema]')).toBeVisible()
})
```

---

## Agents — Phase 2

> 🔀 **PARALLEL** — Agent 7 owns seed SQL + admin page; Agent 4 owns API routes. No dependency between them.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 7: Component Registry](../reference/agent-specifications.md#agent-7-component-registry-agent)** | Write seed SQL for all 56 components, build admin screen | `008_ui_studio_components.sql`, `ComponentRegistryPage.tsx` |
| B | **[Agent 4: Backend API](../reference/agent-specifications.md#agent-4-backend-api-agent)** | Add component list/get/filter routes, plugin registration routes | `go/internal/studio/views/handler.go` |

After both complete:

| Agent | Task |
|---|---|
| **Agent 14: QA** | Run all unit, integration, and E2E tests above |
| **Agent 17: API Contract Alignment** | Validate `ComponentRegistryEntry` TypeScript type matches Go response struct |
| **Agent 15: Documentation** | M3 milestone summary + component catalog draft |
| **Agent 16: Phase Coordinator** | Confirm all 56 queryable, plugin install/remove works — **gate M4** |

---

## ✅ Gate Condition — M3

```bash
# Must pass before Phase 3 begins:

GET http://localhost:8080/api/v1/studio/component-registry
Expected: 200, exactly 56 entries

GET http://localhost:8080/api/v1/studio/component-registry?surface=header_line
Expected: correct subset returned

Navigate: http://localhost:5173/admin/ui-studio/components
Expected: all 56 components visible; category filter works
```

> **Previous phase:** [Phase 1](P1-metadata-foundation.md)
> **Next phase:** [Phase 3 — View Designer](P3-view-designer.md)
