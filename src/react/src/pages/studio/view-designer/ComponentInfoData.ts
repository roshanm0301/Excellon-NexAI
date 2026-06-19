/**
 * ComponentInfoData — Static descriptive metadata for every component in the registry.
 * Used by ComponentInfoPopover to show visual explanations to designers.
 */

export interface ComponentInfoEntry {
  /** One-line summary shown as the sub-heading */
  tagline: string
  /** 1–2 sentence explanation of what the component does */
  description: string
  /** Real-world examples of where this component is used */
  useCases: string[]
  /** Most important configurable properties */
  keyProps: string[]
  /** Which mini-visual template to render in the popover preview */
  previewTemplate: MiniPreviewTemplate
}

export type MiniPreviewTemplate =
  | 'text_input'
  | 'number_input'
  | 'date_picker'
  | 'dropdown'
  | 'multi_select'
  | 'checkbox'
  | 'radio_group'
  | 'toggle'
  | 'textarea'
  | 'file_upload'
  | 'reference_select'
  | 'button'
  | 'label'
  | 'heading'
  | 'badge'
  | 'status_badge'
  | 'metric'
  | 'avatar'
  | 'data_table'
  | 'card_grid'
  | 'filter_panel'
  | 'related_list'
  | 'section'
  | 'card'
  | 'row_col'
  | 'toolbar'
  | 'tab_container'
  | 'accordion'
  | 'divider'
  | 'modal'
  | 'drawer'
  | 'conditional'
  | 'totals_panel'
  | 'wizard_step'
  | 'split_panel'
  | 'dashboard_grid'
  | 'kanban'

export const COMPONENT_INFO: Record<string, ComponentInfoEntry> = {

  // ─── Layout ──────────────────────────────────────────────────────────────
  page_root: {
    tagline: 'Root canvas of every view',
    description: 'The top-level container that holds all other components. Every view has exactly one page_root and it cannot be deleted.',
    useCases: ['Automatically created when a new view is started'],
    keyProps: ['background', 'max_width', 'padding'],
    previewTemplate: 'section',
  },
  section: {
    tagline: 'Collapsible titled container',
    description: 'Groups related fields under a titled, collapsible block. Use it to organise long forms into logical segments like "Personal Info" or "Billing Details".',
    useCases: ['Customer details form', 'Vehicle specification groups', 'Order line-item sections'],
    keyProps: ['title', 'collapsible', 'default_collapsed', 'columns'],
    previewTemplate: 'section',
  },
  card: {
    tagline: 'Raised surface container',
    description: 'A visually elevated container with border, shadow and optional header. Good for grouping widgets on a dashboard or rendering summary cards.',
    useCases: ['KPI summary cards', 'Profile info panel', 'Recent-activity widget'],
    keyProps: ['title', 'subtitle', 'elevation', 'padding'],
    previewTemplate: 'card',
  },
  grid_row: {
    tagline: 'CSS grid row',
    description: 'A horizontal row that divides into equally-spaced grid columns. Drop grid_column children inside to build responsive multi-column form layouts.',
    useCases: ['Two-column address form', 'Three-column date/time pickers', 'Side-by-side totals'],
    keyProps: ['columns', 'gap', 'align_items'],
    previewTemplate: 'row_col',
  },
  grid_column: {
    tagline: 'Grid column slot',
    description: 'A column slot inside a grid_row. Fields placed here align to the column grid. Can span multiple columns with the col_span property.',
    useCases: ['Half-width name field', 'Full-width description field', 'Third-width status badge'],
    keyProps: ['col_span', 'align_items'],
    previewTemplate: 'row_col',
  },
  row: {
    tagline: 'Flexbox row container',
    description: 'Arranges child components horizontally using flexbox. Good for inline buttons, icon+label combos, or custom toolbar-like layouts.',
    useCases: ['Inline action buttons', 'Label + badge pairs', 'Icon + value display'],
    keyProps: ['gap', 'align', 'justify', 'wrap'],
    previewTemplate: 'row_col',
  },
  column: {
    tagline: 'Flexbox column container',
    description: 'Stacks child components vertically using flexbox. Useful for controlled spacing between groups of fields or widgets.',
    useCases: ['Stacked field groups', 'Sidebar content', 'Footer summary layout'],
    keyProps: ['gap', 'align', 'justify'],
    previewTemplate: 'row_col',
  },
  toolbar: {
    tagline: 'Horizontal action bar',
    description: 'A fixed-height strip designed to hold action buttons, filters, and status labels. Typically placed at the top of a section or view.',
    useCases: ['Save/Cancel/Delete row', 'Bulk action bar in list views', 'View switcher strip'],
    keyProps: ['sticky', 'justify', 'border_bottom'],
    previewTemplate: 'toolbar',
  },
  header_line_section: {
    tagline: 'Header + lines container (Header+Line surface only)',
    description: 'Combines a document header form with a child line-items grid and a totals footer. Exclusively used on the Header+Line surface type (e.g. sale orders, invoices).',
    useCases: ['Sale Order header + lines', 'Purchase Order form', 'Service Job card'],
    keyProps: ['header_entity', 'line_entity', 'show_totals'],
    previewTemplate: 'section',
  },

  // ─── Input ───────────────────────────────────────────────────────────────
  text_input: {
    tagline: 'Single-line text field',
    description: 'A labelled text input bound to a single entity field. Supports required, read-only, min/max length, and regex validation.',
    useCases: ['Customer name', 'Part number', 'Address line', 'Email address'],
    keyProps: ['label', 'placeholder', 'required', 'max_length', 'read_only'],
    previewTemplate: 'text_input',
  },
  number_input: {
    tagline: 'Numeric entry field',
    description: 'Input restricted to numbers. Supports min/max bounds, decimal places, and step increments. Renders a numeric keypad on mobile.',
    useCases: ['Quantity', 'Engine CC', 'Stock level', 'Discount percentage'],
    keyProps: ['label', 'min', 'max', 'decimal_places', 'step'],
    previewTemplate: 'number_input',
  },
  currency_input: {
    tagline: 'Currency amount field',
    description: 'A number input pre-configured for currency — shows currency symbol, formats with thousands separators, and defaults to 2 decimal places.',
    useCases: ['Unit price', 'Invoice total', 'Deposit amount', 'Outstanding balance'],
    keyProps: ['label', 'currency_symbol', 'decimal_places', 'read_only'],
    previewTemplate: 'number_input',
  },
  date_picker: {
    tagline: 'Calendar date selector',
    description: 'Opens a calendar popover for date selection. Supports min/max date constraints and formatting options.',
    useCases: ['Date of birth', 'Service date', 'Contract start date', 'Expiry date'],
    keyProps: ['label', 'min_date', 'max_date', 'date_format', 'required'],
    previewTemplate: 'date_picker',
  },
  time_picker: {
    tagline: 'Time-of-day selector',
    description: 'Lets the user pick a time using a clock or spinner. Supports 12h/24h format and minute step increments.',
    useCases: ['Appointment time', 'Shift start', 'Pickup time slot', 'Opening hours'],
    keyProps: ['label', 'format', 'minute_step', 'required'],
    previewTemplate: 'date_picker',
  },
  datetime_picker: {
    tagline: 'Combined date and time picker',
    description: 'Picks both date and time in a single field. Stores as an ISO 8601 timestamp.',
    useCases: ['Booking slot', 'Event start', 'Delivery scheduled at', 'Service appointment'],
    keyProps: ['label', 'min_datetime', 'max_datetime', 'date_format', 'required'],
    previewTemplate: 'date_picker',
  },
  dropdown_select: {
    tagline: 'Single-option dropdown',
    description: 'A searchable dropdown for selecting one value from a fixed or dynamic list. Options can come from a static list or an entity query.',
    useCases: ['Status (Active/Inactive)', 'Vehicle fuel type', 'Payment method', 'Country'],
    keyProps: ['label', 'options_source', 'search_enabled', 'required', 'placeholder'],
    previewTemplate: 'dropdown',
  },
  multi_select: {
    tagline: 'Multi-option picker',
    description: 'A pill-based selector that allows picking multiple values from a list. Good for tags, roles, and feature flags.',
    useCases: ['Applicable vehicle models', 'Assigned technicians', 'Product categories', 'Permission roles'],
    keyProps: ['label', 'options_source', 'max_selections', 'required'],
    previewTemplate: 'multi_select',
  },
  checkbox: {
    tagline: 'Single boolean toggle',
    description: 'A single checkbox for a yes/no field. When checked the bound field stores true; when unchecked it stores false.',
    useCases: ['Active / Inactive flag', 'Consent agreed', 'Is warranty covered', 'Email opt-in'],
    keyProps: ['label', 'default_value', 'required'],
    previewTemplate: 'checkbox',
  },
  checkbox_group: {
    tagline: 'Multiple checkbox options',
    description: 'A group of checkboxes where each can be independently toggled. Stores selected values as an array.',
    useCases: ['Applicable service types', 'Supported payment modes', 'Notification preferences'],
    keyProps: ['label', 'options', 'layout', 'min_selected', 'max_selected'],
    previewTemplate: 'checkbox',
  },
  radio_group: {
    tagline: 'Exclusive choice buttons',
    description: 'A set of radio buttons where exactly one option can be selected. Good for small, fixed sets of mutually exclusive values.',
    useCases: ['Gender', 'Priority (Low/Med/High)', 'Delivery method', 'Vehicle condition'],
    keyProps: ['label', 'options', 'layout', 'required', 'default_value'],
    previewTemplate: 'radio_group',
  },
  toggle_switch: {
    tagline: 'On/off switch',
    description: 'A slide toggle for a boolean field — visually clearer than a checkbox for state-change actions.',
    useCases: ['Enable/disable feature', 'Active status', 'Email notifications on/off', 'Maintenance mode'],
    keyProps: ['label', 'on_label', 'off_label', 'default_value'],
    previewTemplate: 'toggle',
  },
  textarea: {
    tagline: 'Multi-line text area',
    description: 'An expandable text field for longer free-text content. Supports character limits and auto-grow height.',
    useCases: ['Notes / remarks', 'Description', 'Address block', 'Internal comments'],
    keyProps: ['label', 'rows', 'max_length', 'placeholder', 'required'],
    previewTemplate: 'textarea',
  },
  rich_text_editor: {
    tagline: 'Formatted text editor',
    description: 'A WYSIWYG editor with bold, italic, lists, and links. Stores content as HTML. Use only when formatting matters — prefer textarea for plain text.',
    useCases: ['Product description', 'Email template body', 'Announcement content', 'Job description'],
    keyProps: ['label', 'toolbar_items', 'max_length', 'required'],
    previewTemplate: 'textarea',
  },
  file_upload: {
    tagline: 'File or image attachment',
    description: 'Lets users upload one or more files. Shows upload progress and previews images inline. Files are stored in the platform\'s document store.',
    useCases: ['Vehicle photo upload', 'Invoice attachment', 'ID document scan', 'Certificate upload'],
    keyProps: ['label', 'accepted_types', 'max_size_mb', 'max_files', 'show_preview'],
    previewTemplate: 'file_upload',
  },
  reference_select: {
    tagline: 'Foreign-key lookup field',
    description: 'A searchable selector that queries another entity type. Stores the related record\'s ID and displays its display-name field. Supports inline "create new" action.',
    useCases: ['Customer on sale order', 'Assigned technician', 'Supplier on purchase order', 'Part on service job'],
    keyProps: ['label', 'reference_entity', 'display_field', 'search_fields', 'allow_create'],
    previewTemplate: 'reference_select',
  },

  // ─── Display ─────────────────────────────────────────────────────────────
  label: {
    tagline: 'Read-only field display',
    description: 'Shows a field value as styled read-only text. Use in detail views where the field should be visible but not editable.',
    useCases: ['Display record ID', 'Show created-by user', 'Read-only status in review mode'],
    keyProps: ['label', 'value_binding', 'font_size', 'color'],
    previewTemplate: 'label',
  },
  heading: {
    tagline: 'Section or page heading',
    description: 'Renders a styled heading (H1–H4). Use to provide visual hierarchy and clearly separate sections on a form or page.',
    useCases: ['Page title', 'Section heading', 'Step label in wizard', 'Dashboard panel title'],
    keyProps: ['text', 'level', 'align', 'color'],
    previewTemplate: 'heading',
  },
  paragraph: {
    tagline: 'Static descriptive text',
    description: 'Renders a block of static or dynamically bound text. Good for instructions, help text, or computed narratives.',
    useCases: ['Help text under a form', 'Terms & conditions snippet', 'Computed summary sentence'],
    keyProps: ['text', 'binding', 'size', 'color', 'align'],
    previewTemplate: 'label',
  },
  badge: {
    tagline: 'Colour-coded label chip',
    description: 'A small pill badge showing a static or bound text value with a configurable colour. Good for category tags or type indicators.',
    useCases: ['Entity type tag', 'Priority label', 'Category indicator', 'Feature flag chip'],
    keyProps: ['text', 'color', 'binding', 'size'],
    previewTemplate: 'badge',
  },
  status_badge: {
    tagline: 'Record status indicator',
    description: 'Automatically maps a status field value to a colour-coded badge (green=active, amber=pending, red=closed, etc.). Configuration is driven by the field\'s value-map.',
    useCases: ['Order status (Draft/Confirmed/Closed)', 'Lead stage', 'Payment status', 'Job status'],
    keyProps: ['status_binding', 'value_map', 'size'],
    previewTemplate: 'status_badge',
  },
  metric_comparison: {
    tagline: 'KPI metric card with trend',
    description: 'Shows a headline number with a period-over-period comparison (e.g. +12% vs last month) and trend arrow. Used in dashboard layouts.',
    useCases: ['Total revenue this month', 'Open service jobs', 'Parts stock value', 'Units sold today'],
    keyProps: ['title', 'value_binding', 'comparison_binding', 'format', 'unit'],
    previewTemplate: 'metric',
  },
  avatar: {
    tagline: 'User or entity photo',
    description: 'Displays a profile photo or entity image with fallback initials. Supports circle and square shapes.',
    useCases: ['Customer profile picture', 'Technician photo', 'Product thumbnail', 'Company logo'],
    keyProps: ['image_binding', 'name_binding', 'size', 'shape'],
    previewTemplate: 'avatar',
  },

  // ─── Data ────────────────────────────────────────────────────────────────
  data_table: {
    tagline: 'Searchable, paginated data grid',
    description: 'Fetches and displays a list of entity records in a sortable, searchable grid with pagination. Supports row actions (edit, delete, open).',
    useCases: ['Customer list', 'Parts catalog table', 'Sales order lines grid', 'Stock movement history'],
    keyProps: ['entity_type', 'columns', 'page_size', 'searchable', 'row_actions'],
    previewTemplate: 'data_table',
  },
  data_card_grid: {
    tagline: 'Card-per-record grid',
    description: 'Displays records as a responsive card grid instead of a table. Each card shows key fields. Better than tables for image-heavy entities.',
    useCases: ['Product catalogue browse', 'Vehicle showroom grid', 'Employee directory cards'],
    keyProps: ['entity_type', 'card_template', 'columns', 'page_size'],
    previewTemplate: 'card_grid',
  },
  filter_panel: {
    tagline: 'Sidebar filter controls',
    description: 'A panel of filter inputs (dropdowns, date ranges, checkboxes) that update a bound data_table or card_grid. Supports collapsible filter groups.',
    useCases: ['Left-side search filters for a parts list', 'Date-range picker for orders', 'Status filter for leads'],
    keyProps: ['target_component', 'filters', 'collapsed_groups', 'apply_on_change'],
    previewTemplate: 'filter_panel',
  },
  related_list: {
    tagline: 'Child records grid',
    description: 'Shows records of a related entity that are linked to the current record via a foreign key. Common in detail pages and Header+Line views.',
    useCases: ['Service items on a job card', 'Payment history on a customer', 'Contacts on a company record'],
    keyProps: ['related_entity', 'foreign_key_field', 'columns', 'allow_add'],
    previewTemplate: 'related_list',
  },
  relationship_panel: {
    tagline: 'Relationship grid panel',
    description: 'Displays child or linked records in a titled panel. Identical to related_list but preferred when the relationship needs a distinct panel header.',
    useCases: ['Parts requested on a service order', 'Allocated vehicles for a customer'],
    keyProps: ['related_entity', 'foreign_key_field', 'columns', 'allow_add'],
    previewTemplate: 'related_list',
  },

  // ─── Action ──────────────────────────────────────────────────────────────
  button: {
    tagline: 'Clickable action trigger',
    description: 'A button that fires a configured action when clicked. Actions can be navigation, API calls, field-set operations, or rule triggers.',
    useCases: ['Save record', 'Submit form', 'Navigate to detail', 'Trigger approval workflow', 'Print document'],
    keyProps: ['label', 'variant', 'icon', 'on_click_action', 'disabled_when'],
    previewTemplate: 'button',
  },

  // ─── Composite ───────────────────────────────────────────────────────────
  totals_panel: {
    tagline: 'Order totals summary strip',
    description: 'A fixed footer showing subtotal, discount, tax, and grand total fields. Automatically sums bound line-item fields. Used in Header+Line views.',
    useCases: ['Sale order totals footer', 'Purchase order summary', 'Invoice total strip'],
    keyProps: ['subtotal_binding', 'tax_binding', 'discount_binding', 'total_binding', 'currency'],
    previewTemplate: 'totals_panel',
  },
  tax_charge_column: {
    tagline: 'Tax / charge row with rate',
    description: 'A composite row showing a charge type dropdown, rate input, and computed amount. Used inside totals panels on transactional documents.',
    useCases: ['VAT line on invoice', 'Handling charge on purchase order', 'Service surcharge on job card'],
    keyProps: ['charge_type_options', 'rate_binding', 'base_binding', 'amount_binding'],
    previewTemplate: 'totals_panel',
  },

  // ─── Container ───────────────────────────────────────────────────────────
  modal_container: {
    tagline: 'Pop-up modal dialog',
    description: 'A full-screen modal overlay that can contain any other components. Opened by a button\'s on_click action and closed with the built-in close button or Escape key.',
    useCases: ['Confirm before delete', 'Quick-create sub-record', 'Photo preview overlay', 'Detail popup from list'],
    keyProps: ['title', 'size', 'closeable', 'close_on_backdrop'],
    previewTemplate: 'modal',
  },
  drawer_container: {
    tagline: 'Slide-in side drawer',
    description: 'A panel that slides in from the right. Keeps the background view partially visible and is less disruptive than a modal.',
    useCases: ['Edit record in-context from list', 'Filter configuration panel', 'Activity log side panel'],
    keyProps: ['title', 'width', 'placement', 'closeable'],
    previewTemplate: 'drawer',
  },
  side_panel: {
    tagline: 'Persistent sidebar panel',
    description: 'A fixed side container that sits beside main content (unlike a drawer which overlays it). Used in split_view surface layouts.',
    useCases: ['Detail panel in split view', 'Navigation/filter sidebar', 'Inspector panel'],
    keyProps: ['width', 'placement', 'border', 'padding'],
    previewTemplate: 'drawer',
  },
  conditional_container: {
    tagline: 'Visibility-controlled wrapper',
    description: 'A container whose children are only visible when a configured condition is true. The condition can reference field values, roles, or expressions.',
    useCases: [
      'Show shipping fields only when delivery_method = "courier"',
      'Show tax row only when taxable = true',
      'Show manager section for role = manager only',
    ],
    keyProps: ['condition_type', 'field_binding', 'operator', 'compare_value'],
    previewTemplate: 'conditional',
  },

  // ─── Navigation ──────────────────────────────────────────────────────────
  tab_container: {
    tagline: 'Tabbed section switcher',
    description: 'Organises content into multiple named tabs. Only one tab panel is visible at a time. Reduces scroll and groups content by topic.',
    useCases: ['Customer: Details / Orders / Contacts', 'Vehicle: Specs / History / Documents'],
    keyProps: ['tabs', 'default_tab', 'lazy_render'],
    previewTemplate: 'tab_container',
  },
  tab_panel: {
    tagline: 'Content panel within a tab',
    description: 'A named container inside a tab_container. Each tab_panel represents one tab\'s content area.',
    useCases: ['"Details" tab content', '"Documents" tab content', '"History" tab content'],
    keyProps: ['label', 'icon', 'badge_count'],
    previewTemplate: 'tab_container',
  },
  accordion: {
    tagline: 'Expand-collapse content block',
    description: 'A header bar that expands to reveal content when clicked. Good for optional or secondary information that needn\'t be visible by default.',
    useCases: ['Advanced settings section', 'Optional shipping details', 'Historical notes', 'Audit info'],
    keyProps: ['title', 'default_expanded', 'icon'],
    previewTemplate: 'accordion',
  },
  divider: {
    tagline: 'Visual separator line',
    description: 'A thin horizontal rule for visually separating groups of fields or sections within a container.',
    useCases: ['Separate personal and contact info', 'Divide form sections without a titled block'],
    keyProps: ['color', 'thickness', 'margin'],
    previewTemplate: 'divider',
  },

  // ─── Surface-specific ────────────────────────────────────────────────────
  dashboard_grid: {
    tagline: 'Dashboard tile grid (Dashboard surface)',
    description: 'A 2-column responsive grid specifically designed for dashboard surfaces. Drop metric_comparison, data_table, and chart components as tiles.',
    useCases: ['Sales KPI dashboard', 'Service ops overview', 'Parts stock monitoring screen'],
    keyProps: ['columns', 'gap', 'tile_min_height'],
    previewTemplate: 'dashboard_grid',
  },
  wizard_step: {
    tagline: 'One step in a wizard flow',
    description: 'A named step container in a wizard surface. The wizard automatically shows prev/next navigation and validates the step before advancing.',
    useCases: ['Step 1: Customer details', 'Step 2: Vehicle selection', 'Step 3: Finance options'],
    keyProps: ['step_label', 'step_icon', 'validate_on_next'],
    previewTemplate: 'wizard_step',
  },
  wizard_step_container: {
    tagline: 'Wizard root container (Wizard surface)',
    description: 'The root container for a wizard surface, holding all wizard_step children with built-in step progress indicator and navigation controls.',
    useCases: ['New sale order wizard', 'Test drive booking wizard', 'Employee onboarding wizard'],
    keyProps: ['steps', 'show_progress', 'allow_skip'],
    previewTemplate: 'wizard_step',
  },
  split_panel: {
    tagline: 'Left + right split layout (Split View surface)',
    description: 'Divides the canvas into a resizable left list pane and a right detail pane. Classic master-detail pattern.',
    useCases: ['Customer list + customer detail', 'Parts catalogue + part specs', 'Lead list + lead form'],
    keyProps: ['left_width', 'min_left_width', 'resizable'],
    previewTemplate: 'split_panel',
  },
  split_pane: {
    tagline: 'Pane inside a split panel',
    description: 'One half of a split_panel container — either the left or right pane. Holds any other components.',
    useCases: ['List pane on the left', 'Detail pane on the right'],
    keyProps: ['placement', 'overflow'],
    previewTemplate: 'split_panel',
  },
  kanban_board: {
    tagline: 'Kanban column board (Kanban surface)',
    description: 'Displays entity records as draggable cards across named columns. Each column represents a status or stage value.',
    useCases: [
      'Lead pipeline (New/Contacted/Qualified/Won)',
      'Job card stages (Received/In Progress/Complete)',
      'Parts procurement stages',
    ],
    keyProps: ['status_field', 'column_values', 'card_template', 'allow_drag'],
    previewTemplate: 'kanban',
  },

  // ─── Input (new) ──────────────────────────────────────────────────────────
  address_block: {
    tagline: 'Full address entry with multiple lines',
    description: 'Captures structured address data across multiple fields in one component.',
    useCases: ['Customer delivery address', 'Dealer branch address', 'Supplier location'],
    keyProps: ['address_line1', 'city', 'state', 'pincode'],
    previewTemplate: 'section',
  },
  // ─── Display (new) ────────────────────────────────────────────────────────
  progress_bar: {
    tagline: 'Visual indicator of completion percentage',
    description: 'Shows progress towards a goal — like job completion, target achievement, or capacity.',
    useCases: ['Service job completion %', 'Sales target progress', 'Parts stock level'],
    keyProps: ['value', 'max', 'showPercentage', 'color'],
    previewTemplate: 'metric',
  },
  qr_barcode: {
    tagline: 'Display QR code or barcode from a value',
    description: 'Renders a scannable QR code or barcode from any text or ID field.',
    useCases: ['Vehicle QR for workshop', 'Part barcode display', 'Job card QR code'],
    keyProps: ['value', 'type', 'size'],
    previewTemplate: 'label',
  },

  // ─── Navigation (new) ─────────────────────────────────────────────────────
  breadcrumb: {
    tagline: 'Navigation trail showing current location',
    description: 'Shows the path of where the user is in the application hierarchy.',
    useCases: ['Sales → Customer → Profile breadcrumb', 'Service → Job Card breadcrumb'],
    keyProps: ['items', 'separator'],
    previewTemplate: 'label',
  },

  // ─── Action (new) ─────────────────────────────────────────────────────────
  menu_dropdown: {
    tagline: 'Button that opens a dropdown menu of actions',
    description: 'A button that reveals a list of action options when clicked — for contextual menus.',
    useCases: ['More actions button', 'Export options', 'Status change actions'],
    keyProps: ['label', 'variant'],
    previewTemplate: 'button',
  },
  icon_button: {
    tagline: 'Compact action button with just an icon',
    description: 'A small button showing only an icon — used for toolbar actions, row actions, and compact UIs.',
    useCases: ['Edit row icon', 'Delete icon', 'Refresh icon in toolbar'],
    keyProps: ['icon', 'variant', 'tooltip'],
    previewTemplate: 'button',
  },

  // ─── Data (new) ───────────────────────────────────────────────────────────
  timeline_view: {
    tagline: 'Chronological event timeline display',
    description: 'Shows a list of events in time order with date stamps, making history easy to scan.',
    useCases: ['Vehicle service history', 'Customer interaction log', 'Complaint status timeline'],
    keyProps: ['events', 'groupBy'],
    previewTemplate: 'related_list',
  },

  // ─── Composite (new) ──────────────────────────────────────────────────────
  kpi_card: {
    tagline: 'KPI metric card with value, target and trend',
    description: 'A rich metric display combining the current value, target, and trend arrow — ideal for dashboards.',
    useCases: ['Sales today vs target', 'Open service jobs', 'Parts turnover'],
    keyProps: ['title', 'value', 'target', 'trend', 'format'],
    previewTemplate: 'metric',
  },
  signature_block: {
    tagline: 'Capture a digital signature',
    description: 'A signature capture and display area for approval sign-offs, consent, and delivery confirmation.',
    useCases: ['Customer delivery acknowledgement', 'Approval sign-off', 'PDI sign-off'],
    keyProps: ['label', 'showTimestamp'],
    previewTemplate: 'section',
  },
  document_attachment: {
    tagline: 'Upload and view document attachments',
    description: 'Allows users to attach and view documents — PDFs, images, and files — against a record.',
    useCases: ['KYC document upload', 'Insurance document', 'Service report attachment'],
    keyProps: ['label', 'maxFiles', 'accept'],
    previewTemplate: 'section',
  },

  // ── Newly added: missing info entries ──────────────────────────────────────

  action_menu: {
    tagline: 'Contextual dropdown with record actions',
    description: 'A button that opens a dropdown menu with context-sensitive actions for the current record — edit, duplicate, delete, change status, etc.',
    useCases: ['Row-level actions on a list', 'Record header action menu', 'Bulk operation dropdown'],
    keyProps: ['label', 'items', 'variant'],
    previewTemplate: 'button',
  },

  alert_banner: {
    tagline: 'Inline system message or notification',
    description: 'Displays informational, warning, success, or error messages inline within a view. Used for validation summaries, save confirmations, and policy alerts.',
    useCases: ['Form validation error summary', 'Save/submit confirmation', 'Credit limit warning'],
    keyProps: ['message', 'variant', 'dismissible'],
    previewTemplate: 'section',
  },

  calendar_view: {
    tagline: 'Monthly or weekly appointment calendar',
    description: 'Renders entity records as calendar events on a month or week grid. Ideal for scheduling, appointments, and date-driven workflows.',
    useCases: ['Service appointment calendar', 'Delivery schedule', 'Holiday calendar'],
    keyProps: ['date_field', 'title_field', 'color_field', 'view_mode'],
    previewTemplate: 'section',
  },

  code_editor: {
    tagline: 'Structured text entry for expressions or scripts',
    description: 'A syntax-highlighted code editor for entering JSONata expressions, SQL snippets, or other structured text. Used in advanced configuration and automation fields.',
    useCases: ['Business rule expression', 'Computed field formula', 'Custom filter expression'],
    keyProps: ['language', 'label', 'read_only', 'min_height'],
    previewTemplate: 'textarea',
  },

  color_indicator: {
    tagline: 'Traffic-light or RAG status dot',
    description: 'A small coloured dot or pill that communicates status at a glance — green for active, amber for at-risk, red for overdue.',
    useCases: ['Payment status indicator', 'SLA breach indicator', 'Stock availability dot'],
    keyProps: ['color', 'label', 'size'],
    previewTemplate: 'badge',
  },

  color_picker: {
    tagline: 'Visual colour selection input',
    description: 'Lets users pick or enter a hex colour value for custom fields, category colours, or visual labels.',
    useCases: ['Category colour assignment', 'Brand colour field', 'Custom label colour'],
    keyProps: ['label', 'default_color', 'format'],
    previewTemplate: 'text_input',
  },

  comment_thread: {
    tagline: 'Threaded notes on a record',
    description: 'Shows a conversation thread of comments or notes attached to the current record. Users can add replies and tag colleagues.',
    useCases: ['Service order notes', 'Customer query thread', 'Vehicle inspection remarks'],
    keyProps: ['max_visible', 'allow_attachments', 'placeholder'],
    previewTemplate: 'section',
  },

  detail_panel: {
    tagline: 'Read-only key-value summary panel',
    description: 'Displays a grid of field labels and their values in a compact read-only panel — ideal for record headers, summary cards, and sidebars.',
    useCases: ['Customer summary on sale order', 'Vehicle details sidebar', 'Supplier contact info'],
    keyProps: ['title', 'fields', 'columns'],
    previewTemplate: 'section',
  },

  file_preview: {
    tagline: 'Attachment preview with download link',
    description: 'Shows a file name, extension, and size with a download button. Suitable for invoice attachments, photos, and document previews.',
    useCases: ['Invoice PDF attachment', 'Vehicle photo', 'Insurance certificate'],
    keyProps: ['label', 'show_size', 'allow_download'],
    previewTemplate: 'section',
  },

  form_section: {
    tagline: 'Labelled group of input fields',
    description: 'A bordered container with a title that groups related input fields together. Provides visual structure to complex forms.',
    useCases: ['Customer details section', 'Vehicle specification group', 'Billing address block'],
    keyProps: ['title', 'collapsible', 'columns'],
    previewTemplate: 'section',
  },

  icon: {
    tagline: 'Standalone decorative or semantic icon',
    description: 'Renders a single icon from the design system icon set. Used for visual cues, status indicators, and decorative accents in layouts.',
    useCases: ['Warning icon before a label', 'Section header icon', 'Status icon in a badge'],
    keyProps: ['icon', 'size', 'color'],
    previewTemplate: 'section',
  },

  image: {
    tagline: 'Photo or logo display block',
    description: 'Displays an image from a URL or entity field — vehicle photos, customer logos, product images, or document thumbnails.',
    useCases: ['Vehicle photo on stock card', 'Customer company logo', 'Product image on catalogue'],
    keyProps: ['src', 'alt', 'aspect_ratio', 'fit'],
    previewTemplate: 'section',
  },

  link: {
    tagline: 'Inline hyperlink to a record or URL',
    description: 'Renders an anchor link — to a related record, an external website, or a navigation target. Can open in the same tab or a new tab.',
    useCases: ['Customer record link', 'Vehicle VIN lookup link', 'Supplier website link'],
    keyProps: ['text', 'href', 'target', 'icon'],
    previewTemplate: 'label',
  },

  pagination: {
    tagline: 'Page navigation for large lists',
    description: 'Provides previous/next and page number controls for navigating through paginated data sets. Pairs with data tables and card grids.',
    useCases: ['Parts list pagination', 'Customer search results', 'Transaction history pages'],
    keyProps: ['page_size', 'show_total', 'position'],
    previewTemplate: 'section',
  },

  phone_input: {
    tagline: 'International phone number with dial code',
    description: 'A text input prefixed with a country flag and dial-code selector — ensures correctly formatted international phone numbers.',
    useCases: ['Customer mobile number', 'Emergency contact', 'Supplier phone field'],
    keyProps: ['label', 'default_country', 'required', 'placeholder'],
    previewTemplate: 'text_input',
  },

  repeater: {
    tagline: 'Repeating rows for multi-value entry',
    description: 'Renders a configurable set of identical input rows — ideal for line items, contact lists, and address entries where users need to add or remove rows.',
    useCases: ['Purchase order line items', 'Multiple contacts on a record', 'Vehicle accessories list'],
    keyProps: ['min_rows', 'max_rows', 'add_label', 'remove_label'],
    previewTemplate: 'section',
  },

  search_bar: {
    tagline: 'Prominent entity search input',
    description: 'A standalone search bar with real-time suggestions — more prominent than an inline text_input search field. Suitable for global lookups within a view.',
    useCases: ['Vehicle VIN lookup', 'Customer quick search', 'Part number search bar'],
    keyProps: ['placeholder', 'entity', 'display_field', 'value_field'],
    previewTemplate: 'text_input',
  },

  slider_range: {
    tagline: 'Numeric range selector with draggable thumb',
    description: 'A horizontal slider that lets users select a numeric value between a minimum and maximum. Useful for discount rates, age filters, and quantity entry.',
    useCases: ['Discount percentage slider', 'Credit limit slider', 'Age range filter'],
    keyProps: ['label', 'min', 'max', 'step', 'default_value'],
    previewTemplate: 'number_input',
  },

  spacer: {
    tagline: 'Vertical whitespace between sections',
    description: 'Adds a configurable amount of empty vertical space between components to improve visual breathing room in a layout.',
    useCases: ['Gap between form sections', 'Spacing before action buttons', 'Visual separator in sidebar'],
    keyProps: ['height'],
    previewTemplate: 'divider',
  },

  stepper: {
    tagline: 'Numbered progress indicator for multi-stage flows',
    description: 'Displays a horizontal or vertical progress bar with numbered steps — showing which stage of a process is current, completed, or upcoming.',
    useCases: ['Sale order stages', 'Service repair progress', 'Onboarding checklist'],
    keyProps: ['steps', 'current_step', 'orientation'],
    previewTemplate: 'wizard_step',
  },

  tab_group: {
    tagline: 'Tab strip for section navigation within a page',
    description: 'Renders clickable tab labels that switch which content section is visible. Unlike tab_container, tab_group does not own the content panels.',
    useCases: ['Details / History / Documents tabs', 'Financial summary tabs', 'Vehicle spec tab navigation'],
    keyProps: ['tabs', 'default_tab', 'variant'],
    previewTemplate: 'tab_container',
  },

  tag_input: {
    tagline: 'Multi-value keyword or label entry',
    description: 'An input that allows users to add multiple free-text tags or select from a list of options. Values are displayed as removable pill chips.',
    useCases: ['Vehicle feature tags', 'Customer interest labels', 'Part keyword tags'],
    keyProps: ['label', 'placeholder', 'max_tags', 'options_source'],
    previewTemplate: 'multi_select',
  },

  tree_view: {
    tagline: 'Hierarchical category or org structure browser',
    description: 'Displays data in a collapsible tree structure — ideal for browsing categories, departments, or nested records with parent-child relationships.',
    useCases: ['Part category hierarchy', 'Dealer branch org chart', 'Document folder tree'],
    keyProps: ['entity', 'label_field', 'parent_field', 'expanded_depth'],
    previewTemplate: 'section',
  },
}
