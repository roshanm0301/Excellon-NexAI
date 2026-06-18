import type { SurfaceType } from '../../../types/viewStudio'

export interface DMSExample {
  category: 'Master Data' | 'Transaction' | 'Dashboard' | 'Process' | 'Report'
  name: string
  description: string
}

export interface SurfaceGuideEntry {
  surfaceType: SurfaceType
  label: string
  icon: string
  color: string
  tagline: string
  overview: string
  whenToUse: string[]
  whatYouCanBuild: string[]
  whatYouCannot: string[]
  recommendations: string[]
  dos: string[]
  donts: string[]
  dmsExamples: DMSExample[]
}

export const SURFACE_GUIDE: Record<SurfaceType, SurfaceGuideEntry> = {

  standard_crud: {
    surfaceType: 'standard_crud',
    label: 'List View',
    icon: 'List',
    color: '#3b82f6',
    tagline: 'Browse, search, and manage a list of records',
    overview:
      'A List View shows all records of one type in a searchable, filterable table. Users scroll through many items, narrow them down using filters, and click a row to open the full record. It is the starting point for almost every master data screen in a dealership system.',
    whenToUse: [
      'You need to show a large number of records that users search and filter',
      'Users need to scan, sort, and find records quickly',
      'The primary action is opening or managing individual records',
      'You want to support bulk actions like export, status change, or archive',
    ],
    whatYouCanBuild: [
      'Search box with live filtering across key fields',
      'Column filters (by status, date range, category, branch)',
      'Sortable and resizable columns',
      'Row click to open full record detail',
      'Inline action buttons (Edit, Archive, Duplicate)',
      'Bulk select with mass actions',
      'Status badges and colour-coded rows',
      'Export to Excel / PDF',
      'Pagination or infinite scroll',
    ],
    whatYouCannot: [
      'Edit cell values directly in the grid (use Editable Grid instead)',
      'Show a document with header + repeating line items (use Header + Lines)',
      'Display KPI metrics or chart widgets (use Dashboard)',
      'Guide users through a multi-step process (use Wizard)',
    ],
    recommendations: [
      'Show only the 4–6 most important columns by default; let users customise further',
      'Always include a Status column — it is the most common filter in DMS',
      'Add a "Created Date" or "Last Updated" column for audit and sorting',
      'Group filters into logical sections (e.g., Date Range, Status, Branch)',
    ],
    dos: [
      'Add a branch or showroom filter — dealerships always need this',
      'Show the record count ("45 results") so users know the filter is working',
      'Pre-sort the most recent records at the top by default',
      'Highlight overdue or critical records with a colour or icon',
    ],
    donts: [
      'Don\'t put more than 8 columns — it becomes too wide to read',
      'Don\'t use List View for documents that have child line items',
      'Don\'t show heavy calculations in every row — it slows the page',
      'Don\'t skip a Status filter — users always need to filter by Active/Inactive',
    ],
    dmsExamples: [
      { category: 'Master Data', name: 'Customer Master', description: 'Browse all customers with search by name, mobile, or customer code. Filter by type (Individual/Corporate), status, and creation date. Click to open the full customer profile.' },
      { category: 'Master Data', name: 'Vehicle Master', description: 'Browse the stock of all vehicles — new, used, and demo. Filter by model, variant, colour, and availability status. Export filtered lists for sales team allocation.' },
      { category: 'Master Data', name: 'Parts Catalog', description: 'Search parts by part number, description, or category. Filter by bin location, reorder alert, or supplier. Used by parts counter staff for quick lookup.' },
      { category: 'Master Data', name: 'Technician Directory', description: 'List all service technicians with their skill level, bay assignment, and current job load. Used by service advisors to check availability before booking.' },
      { category: 'Master Data', name: 'Finance Company List', description: 'Manage all financing partners (banks and NBFCs) with their scheme codes and validity. Used when processing vehicle loans and hire-purchase agreements.' },
      { category: 'Transaction', name: 'Sale Orders List', description: 'View all vehicle sale orders across stages — Enquiry, Booked, Finance Applied, Delivered. Service advisors and sales managers track pipeline from this screen.' },
    ],
  },

  detail_page: {
    surfaceType: 'detail_page',
    label: 'Form View',
    icon: 'FileEdit',
    color: '#8b5cf6',
    tagline: 'View or edit one record in full detail',
    overview:
      'A Form View fills the entire screen with a single record\'s fields, organised into labelled sections. Think of it as a detailed profile page. Users open this to read, update, or verify all information about one customer, vehicle, or part at a time.',
    whenToUse: [
      'Users need to see or edit all fields of a single record at once',
      'The record has many fields that won\'t fit in a list row',
      'You want to group fields into logical sections (e.g., Personal, Contact, Financial)',
      'The record has related sub-records shown as tabs or embedded lists',
    ],
    whatYouCanBuild: [
      'Multi-section form (e.g., Basic Info, Address, Documents)',
      'Tabbed layout for complex records (e.g., Customer → Overview, Vehicles, Transactions)',
      'Read-only display fields for computed or locked values',
      'Attachment / document upload fields',
      'Related lists embedded at the bottom (e.g., a customer\'s past service orders)',
      'Status banner or approval ribbon at the top',
      'Action buttons in the header (Save, Approve, Print)',
    ],
    whatYouCannot: [
      'Browse or filter multiple records at once (use List View)',
      'Show repeating line items in a document format (use Header + Lines)',
      'Display KPI metrics or aggregate numbers (use Dashboard)',
      'Guide through a sequential process with validations between steps (use Wizard)',
    ],
    recommendations: [
      'Organise fields into 3–5 sections maximum — more becomes confusing',
      'Put the most important identifying fields (name, code, status) at the very top',
      'Use "Read-only" fields for system-calculated values so users don\'t accidentally edit them',
      'Add a Document / Attachment section at the bottom for uploaded files',
    ],
    dos: [
      'Put the record\'s name or code prominently at the top as a page title',
      'Show audit info (Created by, Modified on) in a footer or side panel',
      'Use tabs when the record has many different areas (saves scrolling)',
      'Lock critical fields after the record is approved or completed',
    ],
    donts: [
      'Don\'t put transaction history (e.g., all sale orders for this customer) inside the form fields — use a Related List component instead',
      'Don\'t mix input fields and display/read-only fields without clear visual difference',
      'Don\'t make the form too long — consider tabs if you have more than 20 fields',
      'Don\'t open this view with an unsaved draft already loaded — always start with a saved or new record',
    ],
    dmsExamples: [
      { category: 'Master Data', name: 'Customer Profile', description: 'Full customer record with sections for Personal Details, Contact Information, KYC Documents, and Vehicle History. Service desk staff open this to verify a customer\'s details before creating a service booking.' },
      { category: 'Master Data', name: 'Vehicle Registration Detail', description: 'Complete vehicle record including chassis, engine, registration, insurance, and warranty dates. Used by the RTO team and service to verify vehicle eligibility before work begins.' },
      { category: 'Master Data', name: 'Employee Record', description: 'Full employee profile with personal, employment, payroll, and skill sections. HR staff maintain this for each technician, salesperson, and back-office employee.' },
      { category: 'Master Data', name: 'Part Detail Sheet', description: 'Detailed view of a single part with pricing, bin location, supplier, alternate parts, and reorder rules. Parts managers update this when pricing changes.' },
      { category: 'Master Data', name: 'Supplier Profile', description: 'Vendor record with payment terms, contact persons, bank details, and GST information. Accounts payable uses this when processing supplier invoices.' },
    ],
  },

  header_line: {
    surfaceType: 'header_line',
    label: 'Header + Lines',
    icon: 'FileText',
    color: '#f59e0b',
    tagline: 'A business document with header fields and child line items',
    overview:
      'The Header + Lines surface models every classic business document — a job card, sale order, or purchase order. The top (header) captures the "who, what, when" fields. The middle section contains a repeating grid of line items (services, parts, labour). A totals panel summarises the amounts at the bottom. A toolbar along the top holds action buttons like Submit, Approve, and Print.',
    whenToUse: [
      'Your screen represents a business document (order, invoice, job card)',
      'The document has a fixed header and a variable number of repeating rows',
      'Users need action buttons (Print, Approve, Submit, Cancel) at the top',
      'The document has totals, taxes, and charges that calculate from the line items',
    ],
    whatYouCanBuild: [
      'Header section with customer, vehicle, date, and status fields',
      'Editable line-item grid (Labour, Parts, Accessories, Charges)',
      'Quantity, rate, discount, and amount columns with auto-calculation',
      'Totals panel showing subtotal, tax, and grand total',
      'Tax and charge rows (GST, handling, delivery)',
      'Action toolbar with workflow buttons (Save, Submit, Approve, Print, Cancel)',
      'Tabs within the header for different sections (e.g., Job Card → Overview, Complaints, Labour, Parts)',
    ],
    whatYouCannot: [
      'Browse a list of multiple documents (use List View for that)',
      'Show management dashboards or KPI cards (use Dashboard)',
      'Run a multi-step guided workflow (use Wizard for a new booking process)',
      'Show two independent unrelated grids side by side',
    ],
    recommendations: [
      'Keep the header compact — 6–8 fields maximum before the line items grid',
      'Show Document Number and Status prominently in the header',
      'Use the toolbar for workflow actions, not for navigation',
      'Separate Labour lines from Parts lines into different tabs if both exist',
    ],
    dos: [
      'Show the customer name, vehicle, and service type clearly at the top of the header',
      'Auto-populate rate and GST from the master when a part/labour code is selected',
      'Lock the document (make fields read-only) once it is submitted or invoiced',
      'Add a "Print" button in the toolbar for the customer-facing document copy',
    ],
    donts: [
      'Don\'t put more than 10 columns in the line-items grid — it becomes difficult to fill on screen',
      'Don\'t use this surface for a simple form with no repeating rows (use Form View)',
      'Don\'t allow users to change the customer or vehicle after the order is confirmed',
      'Don\'t skip a status field — every business document needs a lifecycle (Draft → Submitted → Approved → Closed)',
    ],
    dmsExamples: [
      { category: 'Transaction', name: 'Sale Order (Vehicle Booking)', description: 'Header captures customer, salesperson, vehicle, payment mode, and booking amount. Line items list accessories and value-added packages. Footer shows total order value and discount. Toolbar has Submit, Approve, and Generate Proforma actions.' },
      { category: 'Transaction', name: 'Service Order (Job Card)', description: 'Header captures customer, vehicle, odometer reading, and service advisor. Line items have Labour (with flat rates) and Parts tabs. Footer shows total job value. Toolbar has Assign Technician, Submit for Billing, and Print Job Card.' },
      { category: 'Transaction', name: 'Purchase Order', description: 'Header captures supplier, purchase type, and delivery date. Line items list parts with quantity and rate. Footer shows total value, GST, and freight. Toolbar has Send to Supplier and Receive GRN actions.' },
      { category: 'Transaction', name: 'Parts Request (Internal Transfer)', description: 'Header shows requesting department and date. Line items list each part requested with quantity and unit of issue. Used for internal parts movement between workshop and parts store.' },
      { category: 'Transaction', name: 'PDI Checklist', description: 'Header captures vehicle, inspector, and PDI date. Line items represent each inspection point (Engine, Tyres, Interior, Exterior) with Pass/Fail status and remarks. Completion triggers vehicle readiness for delivery.' },
    ],
  },

  advanced_crud: {
    surfaceType: 'advanced_crud',
    label: 'Editable Grid',
    icon: 'TableProperties',
    color: '#06b6d4',
    tagline: 'Filter records on the left, edit them directly in the grid',
    overview:
      'An Editable Grid is a power-user screen divided into two halves. The left panel has filters to narrow down a set of records. The right panel shows those records in a grid where cells can be edited directly — no need to open each record individually. Changes are saved row by row. Best when the same fields need updating across many records at once.',
    whenToUse: [
      'You need to bulk-update the same fields across many records',
      'Users need to filter first, then edit the matching subset',
      'The editing task is repetitive (e.g., updating all prices by a percentage)',
      'Opening each record individually would be too slow',
    ],
    whatYouCanBuild: [
      'Left filter panel with category, date range, and status filters',
      'Editable grid with inline cell editing',
      'Bulk select + bulk update actions',
      'Row-level save or auto-save on blur',
      'Highlight changed cells before saving',
      'Export current grid to Excel',
    ],
    whatYouCannot: [
      'Show complex multi-section forms (use Form View)',
      'Build document-style header + line items (use Header + Lines)',
      'Display KPIs and charts (use Dashboard)',
      'Guide through a sequential process (use Wizard)',
    ],
    recommendations: [
      'Limit editable columns to only those that need batch updates',
      'Show a "N rows selected" counter so users know what will be affected',
      'Require confirmation before saving bulk changes that affect many records',
      'Highlight unsaved changes in yellow so users don\'t accidentally navigate away',
    ],
    dos: [
      'Add a prominent "Save All" button when there are unsaved changes',
      'Allow keyboard navigation (Tab key to move between cells) — power users rely on this',
      'Show validation errors inline in the cell, not as popups',
      'Let users undo the last change in case of mistakes',
    ],
    donts: [
      'Don\'t make all columns editable — limit to 3–5 editable fields',
      'Don\'t use this for records with complex interdependencies (changing one field that recalculates many others)',
      'Don\'t save automatically without user confirmation for critical fields like price',
      'Don\'t skip row-level validation — an invalid rate should be caught before saving',
    ],
    dmsExamples: [
      { category: 'Master Data', name: 'Labour Rate Card Update', description: 'Filter by vehicle model and service type. Edit the flat rate directly in the grid for each labour operation. Used by the service manager quarterly when rates are revised.' },
      { category: 'Master Data', name: 'Parts Price List Revision', description: 'Filter parts by category or supplier. Edit MRP, selling price, and discount slab directly. Saves hours compared to opening each part individually.' },
      { category: 'Master Data', name: 'Technician Target Setting', description: 'Filter technicians by month and skill level. Set monthly revenue, efficiency, and job count targets directly in the grid. Used by the workshop manager at the start of each month.' },
      { category: 'Transaction', name: 'Fleet Vehicle Status Update', description: 'Filter all fleet vehicles by assignment status. Edit assigned driver, location, and maintenance due date directly in the grid. Used by the fleet coordinator daily.' },
    ],
  },

  split_view: {
    surfaceType: 'split_view',
    label: 'Split View',
    icon: 'Columns2',
    color: '#10b981',
    tagline: 'List on the left, full detail on the right — no page switching',
    overview:
      'Split View puts a scrollable list of records on the left and a full detail panel on the right. Clicking any row instantly loads that record\'s detail on the right without leaving the page. It is faster than navigating back and forth and is ideal for power users who need to work through many records in sequence.',
    whenToUse: [
      'Users need to work through many records one by one quickly',
      'The record detail is complex and benefits from a dedicated right panel',
      'Users compare details across records by switching between rows',
      'The screen combines browsing and detailed viewing in one place',
    ],
    whatYouCanBuild: [
      'Scrollable, searchable list on the left',
      'Full form or tabbed detail view on the right',
      'Related lists embedded in the right panel (e.g., transaction history)',
      'Action buttons in the right panel header',
      'Left panel filters to narrow the list',
    ],
    whatYouCannot: [
      'Show document-style transactions with line items (use Header + Lines)',
      'Bulk-edit many records at once (use Editable Grid)',
      'Display dashboards and KPI charts (use Dashboard)',
      'Guide users through a process (use Wizard)',
    ],
    recommendations: [
      'Show only 2–3 key identifiers in the left list row — customer name, vehicle reg, status',
      'Pre-select the first row when the screen loads so the right panel isn\'t empty',
      'Put the most-used action buttons (Edit, Call, Schedule) in the right panel header',
      'Consider saving the last-selected record so users can return to where they were',
    ],
    dos: [
      'Highlight the selected row clearly in the left list',
      'Show a loading indicator in the right panel while the detail loads',
      'Make the left panel resizable so users can give more space to the detail',
      'Include a quick search at the top of the left list',
    ],
    donts: [
      'Don\'t use Split View for documents that have line items — it wastes the right panel space',
      'Don\'t show too many columns in the left list — it\'s a navigation list, not a data table',
      'Don\'t load the full record in the left list — keep it lightweight for fast scrolling',
      'Don\'t navigate away from the page when the user clicks a related record — open it in the same right panel',
    ],
    dmsExamples: [
      { category: 'Master Data', name: 'Customer 360', description: 'Left panel lists all customers with search. Right panel shows full customer profile — contact details, owned vehicles, open service jobs, and transaction history. Used by customer relationship team for personalised service.' },
      { category: 'Master Data', name: 'Vehicle History Browser', description: 'Left panel lists vehicles (filtered by model and year). Right panel shows the full service history, ownership chain, insurance, and open recalls. Used by pre-owned vehicle assessors.' },
      { category: 'Master Data', name: 'Open Service Jobs Tracker', description: 'Left panel lists all open job cards with status indicators. Right panel shows job details, assigned technician, parts consumed, and estimated completion. Used by the service supervisor on the workshop floor.' },
      { category: 'Master Data', name: 'Parts Catalogue with Specs', description: 'Left panel lists parts by category with stock status. Right panel shows full part details — description, supplier, pricing, alternate part numbers, and bin location. Used by parts counter staff.' },
    ],
  },

  wizard: {
    surfaceType: 'wizard',
    label: 'Wizard',
    icon: 'GitMerge',
    color: '#f97316',
    tagline: 'Guide users through a complex process, one step at a time',
    overview:
      'A Wizard breaks a long, complex process into a numbered sequence of steps. The user completes each step and the system validates it before allowing them to move forward. This prevents mistakes, ensures all required information is captured in the right order, and reduces the chance of users skipping important fields.',
    whenToUse: [
      'The task has a clear, fixed sequence that should not be skipped',
      'Validation is required at each stage before moving forward',
      'The process involves decisions that affect later steps (conditional branching)',
      'New or occasional users are likely to make mistakes without guidance',
      'The process involves collecting data across 3 or more distinct areas',
    ],
    whatYouCanBuild: [
      'Numbered step progress indicator at the top',
      'Validation rules that run when "Next" is clicked',
      'Conditional steps that appear or are skipped based on earlier answers',
      'Summary / Review step before final submission',
      'Back navigation with data preserved',
      'Step labels and descriptions to orient the user',
      'A completion action (Submit, Create Record, Send Notification)',
    ],
    whatYouCannot: [
      'Browse or search existing records (use List View for that)',
      'Edit an existing record\'s fields without going through all steps',
      'Show real-time dashboards or KPIs within steps',
      'Display document-style line items (use Header + Lines for the output document)',
    ],
    recommendations: [
      'Keep each step focused on one clear decision or section — aim for 3–5 fields per step',
      'Always include a Review step at the end so users can check before submitting',
      'Name each step clearly — "1. Customer", "2. Vehicle", "3. Finance", "4. Review"',
      'Show a progress bar or step count (Step 2 of 5) so users know how far they are',
    ],
    dos: [
      'Validate each step when "Next" is clicked, not just at the end',
      'Allow the user to go back to a previous step without losing their data',
      'Pre-fill fields where data is already known (e.g., if a customer is selected, fill in their phone number)',
      'Disable the "Submit" button until the final review step is reached',
    ],
    donts: [
      'Don\'t use more than 7 steps — it becomes exhausting',
      'Don\'t use a Wizard for a simple 2-field form — a regular Form View is better',
      'Don\'t reset all fields if the user goes back and changes an earlier answer — preserve as much as possible',
      'Don\'t hide error messages — show them clearly on the step where the problem is',
    ],
    dmsExamples: [
      { category: 'Process', name: 'New Vehicle Sale Booking', description: 'Step 1: Select or create customer. Step 2: Choose vehicle (model, variant, colour). Step 3: Configure finance (cash/loan/lease, bank, scheme). Step 4: Add accessories and packages. Step 5: Review and confirm booking. Generates a Booking Order on completion.' },
      { category: 'Process', name: 'Test Drive Scheduling', description: 'Step 1: Identify customer (walk-in or existing). Step 2: Select vehicle for test drive (from available demo fleet). Step 3: Choose date and time slot. Step 4: Capture driving licence and consent. Step 5: Confirm and generate test drive slip.' },
      { category: 'Process', name: 'Exchange / Trade-in Appraisal', description: 'Step 1: Capture exchange vehicle details (reg, year, model). Step 2: Record inspection findings (body, tyres, engine, interior). Step 3: Enter market value estimate. Step 4: Customer agrees exchange value. Step 5: Generate appraisal certificate.' },
      { category: 'Process', name: 'Pre-Delivery Inspection (PDI)', description: 'Step 1: Confirm vehicle details. Step 2: Engine and underbody inspection. Step 3: Exterior and bodywork check. Step 4: Interior and accessories check. Step 5: Road test results. Step 6: Sign off and clear vehicle for delivery.' },
      { category: 'Process', name: 'New Employee Onboarding', description: 'Step 1: Personal and contact details. Step 2: Employment and role information. Step 3: Document upload (ID, qualification, driving licence). Step 4: IT access and tools setup. Step 5: Training plan assignment. Generates HR record and induction checklist.' },
    ],
  },

  dashboard: {
    surfaceType: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    color: '#6366f1',
    tagline: 'KPI cards, charts, and summary widgets at a glance',
    overview:
      'A Dashboard shows the health of your business in one view — no navigating, no clicking, no waiting. It displays key numbers (sales this month, open service jobs, parts stock alerts), trends, and exception alerts. It is a read-only screen updated automatically. Managers use it to monitor performance and spot problems early.',
    whenToUse: [
      'The purpose of the screen is to monitor, not to create or edit records',
      'Multiple different metrics and summaries need to be visible at the same time',
      'Different user roles need different views of the same data',
      'You need to show trends over time (daily, weekly, monthly comparisons)',
    ],
    whatYouCanBuild: [
      'KPI metric cards with current value, target, and trend (up/down)',
      'Summary data tables (e.g., Top 5 salespersons, Ageing analysis)',
      'Date range and branch filter controls at the top',
      'Alert lists (e.g., Vehicles pending PDI, Parts below reorder level)',
      'Auto-refresh on a set interval (e.g., every 5 minutes)',
      'Multiple widget sizes (small KPI card, wide table, full-width chart area)',
    ],
    whatYouCannot: [
      'Create, edit, or delete records from the dashboard (it is read-only)',
      'Show full-page forms or individual record details',
      'Manage business documents with line items',
      'Run sequential workflow processes',
    ],
    recommendations: [
      'Limit to 5–8 KPI metrics — more than that and nothing stands out',
      'Put the most critical numbers at the top left (users read top-to-bottom, left-to-right)',
      'Use red/amber/green colour coding for targets (red = below target, green = on track)',
      'Always add a Date Range and Branch filter so managers can slice data',
    ],
    dos: [
      'Show the "as of" timestamp so users know when the data was last refreshed',
      'Group related widgets together (e.g., all sales widgets in one section)',
      'Use trend arrows (↑ ↓) next to KPIs to show direction vs previous period',
      'Highlight exceptions in red (e.g., a part with stock below reorder level)',
    ],
    donts: [
      'Don\'t duplicate the same number in multiple widgets — it wastes space and confuses users',
      'Don\'t include data that is more than 24 hours old without a clear label',
      'Don\'t use dashboards for operational tasks like updating records',
      'Don\'t show more than 3 levels of hierarchy in a dashboard table — it becomes unreadable',
    ],
    dmsExamples: [
      { category: 'Dashboard', name: 'Daily Sales Dashboard', description: 'Shows today\'s retail vs target (vehicles, revenue, finance penetration), top salesperson of the day, pending deliveries, and overdue follow-up alerts. Refreshes every 10 minutes. Used by the sales manager at their desk.' },
      { category: 'Dashboard', name: 'Service Workshop Overview', description: 'Shows open job cards by bay, technician efficiency today, vehicles pending QC, and customer complaints raised this week. Used by the workshop controller to manage floor throughput.' },
      { category: 'Dashboard', name: 'Parts Inventory Alerts', description: 'Shows parts below reorder level, slow-moving parts (no sale in 90 days), ageing stock (>180 days), and supplier POs pending receipt. Used by the parts manager for daily procurement decisions.' },
      { category: 'Dashboard', name: 'Finance & Collection Status', description: 'Shows loan applications pending disbursement, EMI overdue cases, finance penetration this month vs target, and bank-wise approval rate. Used by the finance manager.' },
      { category: 'Dashboard', name: 'Leads & Enquiry Pipeline', description: 'Shows enquiries by stage (New → Follow-up → Test Drive → Booked → Delivered), conversion rate, and enquiries aging more than 3 days with no activity. Used by the sales head.' },
    ],
  },

  calendar: {
    surfaceType: 'calendar',
    label: 'Calendar',
    icon: 'CalendarDays',
    color: '#ec4899',
    tagline: 'See and manage scheduled records on a time grid',
    overview:
      'A Calendar shows records that have a date or time as events on a day, week, or month grid. Users see everything scheduled at a glance, drag events to reschedule, and click to open or create a booking. It replaces manual appointment registers and prevents double-booking of resources like bays, vehicles, or technicians.',
    whenToUse: [
      'Your records have a scheduled date and time that users need to see visually',
      'You need to prevent double-booking of a resource (bay, technician, demo vehicle)',
      'Users plan their day/week ahead and need a calendar view',
      'The number of appointments changes throughout the day and needs live monitoring',
    ],
    whatYouCanBuild: [
      'Day, week, and month calendar views',
      'Colour-coded event types (e.g., Test Drive = blue, Service = green)',
      'Drag-and-drop rescheduling of events',
      'Click on a time slot to create a new appointment',
      'Click on an event to open the full record',
      'Resource view (e.g., see all bays side by side in a day view)',
      'Conflict detection (overlapping events shown in red)',
    ],
    whatYouCannot: [
      'Show records that have no date or time field',
      'Build master data browsing screens (use List View)',
      'Create business documents with header and line items (use Header + Lines)',
      'Show management KPI summaries (use Dashboard)',
    ],
    recommendations: [
      'Always include a colour legend so users know what each event type means',
      'Default to the Week View for operational staff — it balances detail and overview',
      'Show the resource name (technician or bay) on each event in the calendar',
      'Add a "Today" button so users can quickly jump back to the current day',
    ],
    dos: [
      'Use distinct colours for each appointment type — avoid using red unless it means urgent/overdue',
      'Show customer name and vehicle on the calendar event tile (truncated if needed)',
      'Warn users before saving if they are creating a booking that conflicts with an existing one',
      'Allow filtering by resource (e.g., show only Bay 3) to reduce clutter',
    ],
    donts: [
      'Don\'t use Calendar for data that doesn\'t have a time dimension',
      'Don\'t show more than 6–8 events per cell in Month view — it overflows',
      'Don\'t allow drag-and-drop on completed or invoiced appointments',
      'Don\'t skip conflict checking — double-booking a bay is a common operational problem',
    ],
    dmsExamples: [
      { category: 'Process', name: 'Test Drive Appointment Scheduler', description: 'Shows all test drive slots for each demo vehicle. Colour-coded by vehicle model. Click an empty slot to create a new test drive booking. Used by showroom receptionist and sales team.' },
      { category: 'Process', name: 'Service Bay Booking Calendar', description: 'Week view showing all bays as columns and hours as rows. Each cell shows the job card assigned to that bay at that time. Used by the service advisor when scheduling vehicle drop-off times.' },
      { category: 'Process', name: 'Vehicle Delivery Schedule', description: 'Shows vehicles scheduled for delivery by date and time. Displays customer name and vehicle registration. Used by the delivery team to prepare vehicles, process documentation, and manage the delivery bay.' },
      { category: 'Process', name: 'Technician Roster', description: 'Month view showing each technician\'s presence, shift, and leave. Colour-coded by technician status (present/leave/training). Used by the workshop manager for manpower planning.' },
      { category: 'Process', name: 'Showroom Events Calendar', description: 'Shows upcoming events, promotional campaigns, test drive camps, and customer events scheduled at the showroom. Used by the marketing team and showroom manager.' },
    ],
  },

  custom_page: {
    surfaceType: 'custom_page',
    label: 'Custom Page',
    icon: 'Layout',
    color: '#64748b',
    tagline: 'Build any screen exactly as you need — no fixed layout',
    overview:
      'Custom Page is a freeform canvas with no predefined zones or structure. You place and arrange components exactly where you want them. Use this only when none of the other surface types fit — it gives maximum flexibility but requires more design thinking. It is best for unique, one-of-a-kind screens like calculators, home screens, or hybrid reports.',
    whenToUse: [
      'No other surface type fits your requirement',
      'You need to mix multiple types of content on one screen (e.g., calculator + summary table + instructions)',
      'You are building a home or landing screen for a user role',
      'You need a hybrid screen that combines a form and a real-time summary',
    ],
    whatYouCanBuild: [
      'Any combination of input fields, data tables, charts, and labels',
      'Custom calculators (e.g., EMI, trade-in value, commission)',
      'Landing/welcome screens with quick-link tiles',
      'Mixed reports with narrative text and data widgets',
      'One-off screens that combine multiple data sources on the same page',
    ],
    whatYouCannot: [
      'Automatically get structured navigation or zone behaviour from the platform',
      'Use built-in document header/line item logic (use Header + Lines)',
      'Get automatic list browsing or filtering behaviour (use List View)',
      'Use step-by-step progression logic (use Wizard)',
    ],
    recommendations: [
      'Sketch the layout on paper before building — Custom Page requires upfront design',
      'Use a Grid Row / Grid Column layout to keep things aligned',
      'Check all other surface types first — Custom Page should be the last resort',
      'Document what this screen does, because its purpose won\'t be obvious from the surface type alone',
    ],
    dos: [
      'Use a clear visual hierarchy — bigger elements for more important information',
      'Group related components in labelled sections (Section component)',
      'Test on both laptop and large monitor — custom layouts can look very different at different screen sizes',
      'Keep the number of input fields minimal — if there are many, use a Form View instead',
    ],
    donts: [
      'Don\'t use Custom Page as your default choice — always start with the most appropriate surface type',
      'Don\'t place fields randomly without a grid structure — it looks unprofessional',
      'Don\'t try to build a full CRUD screen as a Custom Page — List View and Form View already handle that',
      'Don\'t overload it with more than 3 distinct sections — the screen becomes confusing',
    ],
    dmsExamples: [
      { category: 'Utility', name: 'EMI / Finance Calculator', description: 'A screen where staff enter vehicle price, down payment, interest rate, and tenure. The screen calculates and displays the EMI, total interest, and full repayment schedule. Used by sales consultants to present finance options to customers.' },
      { category: 'Report', name: 'Trade-in Value Estimator', description: 'Combines an inspection form (condition grading) with a lookup table of market values and a live calculation of the estimated exchange offer. Sales managers use this during the appraisal discussion with the customer.' },
      { category: 'Utility', name: 'Dealership Home Screen', description: 'A welcome screen for a specific role (e.g., Service Advisor) showing: today\'s appointments summary, pending job cards, alerts for vehicles ready for delivery, and quick-launch buttons for the most-used screens.' },
      { category: 'Report', name: 'MIS Executive Summary', description: 'A hybrid screen combining a date-range filter, a key metrics row (vehicles sold, service revenue, parts turnover), and a narrative section with branch manager comments. Used for monthly management review meetings.' },
    ],
  },

  kanban: {
    surfaceType: 'kanban',
    label: 'Kanban',
    icon: 'Kanban',
    color: '#94a3b8',
    tagline: 'Cards organised in workflow columns — coming soon',
    overview:
      'Kanban will show records as cards organised in columns that represent workflow stages. Users drag cards from one column to the next to advance a record through its lifecycle. It gives a visual, at-a-glance view of how work is progressing across the pipeline.',
    whenToUse: [
      'You need to visualise workflow stages (e.g., New → Contacted → Quoted → Closed)',
      'Records move through defined stages and the count per stage matters',
      'Teams need to see the entire pipeline without scrolling through a list',
    ],
    whatYouCanBuild: [
      'Workflow stage columns (configurable names and order)',
      'Cards showing key fields (customer name, vehicle, date)',
      'Drag-and-drop to move cards between stages',
      'Card count per column for quick pipeline assessment',
    ],
    whatYouCannot: [
      'This surface type is not yet available in this version',
    ],
    recommendations: [
      'This surface is planned for a future release — use List View with a Status filter for now',
    ],
    dos: [
      'Plan your workflow stages before this feature is available',
    ],
    donts: [
      'Don\'t select Kanban for current projects — it is not yet active',
    ],
    dmsExamples: [
      { category: 'Process', name: 'Sales Pipeline (Coming Soon)', description: 'Enquiry → Follow-up → Test Drive → Booked → Finance → Delivered columns. Salespersons drag their leads through stages.' },
      { category: 'Process', name: 'Service Job Pipeline (Coming Soon)', description: 'Received → Bay Allotted → In Progress → QC → Ready for Delivery → Delivered. Workshop controller moves jobs across stages.' },
    ],
  },
}

export const SURFACE_GUIDE_ORDER: SurfaceType[] = [
  'standard_crud',
  'detail_page',
  'header_line',
  'advanced_crud',
  'split_view',
  'wizard',
  'dashboard',
  'calendar',
  'custom_page',
]
