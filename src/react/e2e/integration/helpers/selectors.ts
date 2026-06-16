// Stable selectors for Playwright integration tests

export const SEL = {
  // ViewDesignerListPage
  viewsGrid: '[data-testid="views-grid"]',
  createViewModal: '[data-testid="create-view-modal"]',
  newViewBtn: 'button:has-text("New View")',
  searchInput: 'input[placeholder*="Search views"]',

  // ViewDesignerPage
  vdToolbar: '[data-testid="vd-toolbar"]',
  vdSaveBtn: '[data-testid="vd-save-btn"]',
  vdPublishBtn: '[data-testid="vd-publish-btn"]',
  vdPreviewBtn: '[data-testid="vd-preview-btn"]',

  // Designer panels
  componentPalette: '[data-testid="component-palette"]',
  componentTree: '[data-testid="component-tree"]',
  propertyPanel: '[data-testid="property-panel"]',
  bindingEditor: '[data-testid="binding-editor"]',
  eventEditor: '[data-testid="event-editor"]',
  visibilityRuleBuilder: '[data-testid="visibility-rule-builder"]',

  // Tabs in property panel
  propsTab: 'button[role="tab"]:has-text("Properties")',
  bindingsTab: 'button[role="tab"]:has-text("Bindings")',
  eventsTab: 'button[role="tab"]:has-text("Events")',
  visibilityTab: 'button[role="tab"]:has-text("Visibility")',
} as const
