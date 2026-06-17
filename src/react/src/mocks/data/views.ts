const TS = '2026-06-03T00:00:00.000Z'
const TENANT = '00000000-0000-0000-0000-000000000001'

export interface ViewSeed {
  artifact_id: string
  artifact_name: string
  artifact_type: string
  tenant_id: string
  surface_type: string
  primary_entity: string
  view_code?: string
  view_label: string
  view_category?: string
  created_at: string
  updated_at: string
  created_by: string
  revision: number
  latest_version_id?: string
  latest_version_no?: number
  is_draft: boolean
  is_active: boolean
  _draft_payload?: Record<string, unknown>
  _versions?: Array<{
    version_id: string
    artifact_id: string
    version_no: number
    payload: Record<string, unknown>
    is_active: boolean
    is_draft: boolean
    created_at: string
    created_by: string
    revision: number
    published_at?: string
    published_by?: string
  }>
}

// ── payload builder helpers ────────────────────────────────────────────────────

function fld(entity: string, field_key: string) {
  return { source: 'field' as const, entity, field_key }
}
function sta(static_value: unknown) {
  return { source: 'static' as const, static_value }
}
function inp(key: string, code: string, entity: string, fieldKey: string, label: string, extra: Record<string, unknown> = {}) {
  return { component_key: key, component_code: code, props: { label, ...extra }, bindings: { value: fld(entity, fieldKey) } }
}
function vrow(key: string, children: unknown[]) {
  return { component_key: key, component_code: 'grid_row', children }
}
function vcol(key: string, children: unknown[]) {
  return { component_key: key, component_code: 'grid_column', children }
}
function vsec(key: string, title: string, children: unknown[]) {
  return { component_key: key, component_code: 'section', props: { title }, children }
}

// Simple standard-CRUD list: toolbar + optional filter panel + data table
function mkListPayload(
  entity: string,
  newLabel: string,
  filters: Array<{ field: string; operator?: string; label: string; type: string }>,
  columns: Array<{ key: string; label: string; sortable?: boolean; width?: number; type?: string; align?: string; readOnly?: boolean }>,
): Record<string, unknown> {
  return {
    meta: { description: `${entity} list`, default_mode: 'view' },
    datasources: [{ source_key: `${entity}_list`, base_entity: entity, pagination: { page_size: 25 }, sort: [{ field: columns[0]?.key ?? 'id', direction: 'asc' }] }],
    component_tree: {
      component_key: 'root', component_code: 'page_root',
      children: [
        { component_key: 'tb', component_code: 'toolbar', children: [
          { component_key: 'btn-new', component_code: 'button', props: { variant: 'primary' }, bindings: { label: sta(newLabel) } },
        ]},
        { component_key: 'fp', component_code: 'filter_panel', bindings: { filters: sta(filters) } },
        { component_key: 'dt', component_code: 'data_table',
          props: { columns },
          bindings: { data: fld(entity, '_list'), loading: fld(entity, '_loading') },
        },
      ],
    },
  }
}

// ── detailed payloads ──────────────────────────────────────────────────────────

const saleOrdersPayload: Record<string, unknown> = {
  meta: { description: 'Sale Order list with search, filters, and actions', default_mode: 'view' },
  datasources: [{ source_key: 'so_list', base_entity: 'sale_order', pagination: { page_size: 25 }, sort: [{ field: 'documentDate', direction: 'desc' }] }],
  component_tree: {
    component_key: 'root', component_code: 'page_root',
    children: [
      { component_key: 'tb', component_code: 'toolbar', children: [
        { component_key: 'btn-new-so', component_code: 'button', props: { variant: 'primary' }, bindings: { label: sta('New Sale Order') } },
      ]},
      { component_key: 'fp-so', component_code: 'filter_panel', bindings: { filters: sta([
        { field: 'documentDate', operator: 'gte', label: 'From Date', type: 'date' },
        { field: 'documentDate', operator: 'lte', label: 'To Date', type: 'date' },
        { field: 'status', label: 'Status', type: 'enum' },
        { field: 'customer', operator: 'contains', label: 'Customer', type: 'text' },
        { field: 'branch', label: 'Branch', type: 'text' },
        { field: 'paymentMode', label: 'Payment Mode', type: 'enum' },
      ]) }},
      { component_key: 'dt-so', component_code: 'data_table',
        props: { columns: [
          { key: 'documentNumber', label: 'SO Number', sortable: true, width: 140 },
          { key: 'documentDate',   label: 'Date', sortable: true, width: 110, type: 'date' },
          { key: 'customer',       label: 'Customer', sortable: true },
          { key: 'branch',         label: 'Branch', sortable: true, width: 130 },
          { key: 'salesExecutive', label: 'Sales Exec', width: 140 },
          { key: 'paymentMode',    label: 'Payment', width: 100 },
          { key: 'netAmount',      label: 'Net Amount', sortable: true, width: 120, type: 'currency', align: 'right' },
          { key: 'status',         label: 'Status', width: 110, type: 'status' },
        ]},
        bindings: { data: fld('sale_order', '_list'), loading: fld('sale_order', '_loading') },
      },
    ],
  },
}

const saleOrderEditorPayload: Record<string, unknown> = {
  meta: { description: 'Sale Order create/edit — all fields across collapsible sections', default_mode: 'edit' },
  datasources: [
    { source_key: 'so_record', base_entity: 'sale_order', pagination: { page_size: 1 } },
    { source_key: 'sol_list', base_entity: 'sale_order_line', pagination: { page_size: 50 } },
  ],
  component_tree: {
    component_key: 'root', component_code: 'page_root',
    children: [
      { component_key: 'tb-so', component_code: 'toolbar', children: [
        { component_key: 'btn-save',   component_code: 'button', props: { variant: 'primary' },   bindings: { label: sta('Save Draft') } },
        { component_key: 'btn-submit', component_code: 'button', props: { variant: 'secondary' }, bindings: { label: sta('Submit Order') } },
        { component_key: 'sb-status', component_code: 'status_badge', bindings: { status: fld('sale_order', 'status') } },
      ]},
      vsec('sec-doc', 'Document Information', [
        vrow('r-doc-1', [
          vcol('c-doc-1', [inp('f-docno',    'text_input',  'sale_order', 'documentNumber', 'Document Number', { readOnly: true })]),
          vcol('c-doc-2', [inp('f-docdate',  'date_picker', 'sale_order', 'documentDate',   'Document Date')]),
          vcol('c-doc-3', [inp('f-status',   'label',       'sale_order', 'status',          'Status')]),
          vcol('c-doc-4', [inp('f-createdby','label',       'sale_order', 'createdBy',       'Created By')]),
        ]),
        vrow('r-doc-2', [
          vcol('c-doc-5', [inp('f-org',    'reference_select', 'sale_order', 'organisation', 'Organisation', { entity: 'organisation' })]),
          vcol('c-doc-6', [inp('f-branch', 'reference_select', 'sale_order', 'branch',       'Branch',       { entity: 'branch' })]),
          vcol('c-doc-7', [inp('f-dept',   'reference_select', 'sale_order', 'department',   'Department',   { entity: 'department' })]),
        ]),
      ]),
      vsec('sec-cust', 'Customer Details', [
        vrow('r-cust-1', [
          vcol('c-cust-1', [inp('f-customer', 'reference_select', 'sale_order', 'customer',        'Customer *',        { entity: 'customer', required: true })]),
          vcol('c-cust-2', [inp('f-gstin',    'text_input',       'sale_order', 'gstin',            'Customer GSTIN')]),
          vcol('c-cust-3', [inp('f-exec',     'reference_select', 'sale_order', 'salesExecutive',  'Sales Executive *', { entity: 'employee', required: true })]),
          vcol('c-cust-4', [inp('f-source',   'dropdown_select',  'sale_order', 'orderSource',     'Order Source',      { options: ['WalkIn','Online','Referral','Exhibition','Campaign'] })]),
        ]),
        vrow('r-cust-2', [
          vcol('c-cust-5', [inp('f-priority', 'dropdown_select', 'sale_order', 'priority',              'Priority',               { options: ['High','Medium','Low'] })]),
          vcol('c-cust-6', [inp('f-deldate',  'date_picker',     'sale_order', 'requestedDeliveryDate', 'Requested Delivery Date')]),
          vcol('c-cust-7', [inp('f-validtill','date_picker',     'sale_order', 'validTillDate',          'Valid Till Date')]),
          vcol('c-cust-8', [inp('f-pos',      'dropdown_select', 'sale_order', 'placeOfSupply',         'Place of Supply',        { options: ['Maharashtra','Karnataka','TamilNadu','Delhi','Gujarat','Telangana','AndhraPradesh','WestBengal','Rajasthan','UttarPradesh'] })]),
        ]),
      ]),
      vsec('sec-pay', 'Payment Details', [
        vrow('r-pay-1', [
          vcol('c-pay-1', [inp('f-paymode',   'dropdown_select', 'sale_order', 'paymentMode',   'Payment Mode *',   { options: ['Cash','Finance','Exchange'], required: true })]),
          vcol('c-pay-2', [inp('f-paymethod', 'dropdown_select', 'sale_order', 'paymentMethod', 'Payment Method',   { options: ['Cheque','DD','NEFT','RTGS','UPI','Cash'] })]),
          vcol('c-pay-3', [inp('f-advance',   'number_input',    'sale_order', 'advancePayment','Advance Payment (₹)')]),
        ]),
      ]),
      vsec('sec-fin', 'Finance', [
        vrow('r-fin-1', [
          vcol('c-fin-1', [inp('f-financier', 'reference_select', 'sale_order', 'financier',     'Financier',         { entity: 'finance_company' })]),
          vcol('c-fin-2', [inp('f-downpay',   'number_input',     'sale_order', 'downPayment',   'Down Payment (₹)')]),
          vcol('c-fin-3', [inp('f-finamount', 'number_input',     'sale_order', 'financeAmount', 'Finance Amount (₹)')]),
        ]),
        vrow('r-fin-2', [
          vcol('c-fin-4', [inp('f-tenure',  'dropdown_select', 'sale_order', 'tenure',         'Tenure (Months)', { options: ['12','24','36','48','60','72'] })]),
          vcol('c-fin-5', [inp('f-emirate', 'number_input',    'sale_order', 'emiInterestRate','EMI Interest Rate (%)')]),
        ]),
      ]),
      vsec('sec-totals', 'Order Totals', [
        vrow('r-tot-1', [
          vcol('c-tot-1', [inp('f-totalqty',  'label', 'sale_order', 'totalQuantity',   'Total Quantity')]),
          vcol('c-tot-2', [inp('f-totalbase', 'label', 'sale_order', 'totalBaseAmount', 'Total Base Amount (₹)')]),
          vcol('c-tot-3', [inp('f-totaltax',  'label', 'sale_order', 'totalTaxAmount',  'Total Tax Amount (₹)')]),
          vcol('c-tot-4', [inp('f-netamt',    'label', 'sale_order', 'netAmount',       'Net Amount (₹)')]),
        ]),
      ]),
      vsec('sec-lines', 'Order Lines', [
        { component_key: 'dt-lines', component_code: 'data_table',
          props: {
            addRowEnabled: true, deleteRowEnabled: true,
            columns: [
              { key: 'lineNumber',      label: '#',          width: 50,  type: 'number',   align: 'right', readOnly: true },
              { key: 'productCode',     label: 'Vehicle',    sortable: true },
              { key: 'uom',             label: 'UOM',        width: 80 },
              { key: 'orderQuantity',   label: 'Qty',        width: 80,  type: 'number',   align: 'right' },
              { key: 'rate',            label: 'Rate (₹)',   width: 110, type: 'currency', align: 'right' },
              { key: 'discountPercent', label: 'Disc %',     width: 80,  type: 'number',   align: 'right' },
              { key: 'taxableAmount',   label: 'Taxable',    width: 120, type: 'currency', align: 'right', readOnly: true },
              { key: 'cgstRate',        label: 'CGST%',      width: 75,  type: 'number',   align: 'right' },
              { key: 'sgstRate',        label: 'SGST%',      width: 75,  type: 'number',   align: 'right' },
              { key: 'lineAmount',      label: 'Line Total', width: 130, type: 'currency', align: 'right', readOnly: true },
            ],
          },
          bindings: { data: fld('sale_order_line', '_list'), loading: fld('sale_order_line', '_loading') },
        },
      ]),
    ],
  },
}

const customerMasterPayload: Record<string, unknown> = mkListPayload(
  'customer',
  'New Customer',
  [
    { field: 'customerCode',  operator: 'contains', label: 'Customer Code', type: 'text' },
    { field: 'firstName',     operator: 'contains', label: 'Name',          type: 'text' },
    { field: 'customerType',  label: 'Type',        type: 'enum' },
    { field: 'primaryPhone',  operator: 'contains', label: 'Phone',         type: 'text' },
    { field: 'billingCity',   operator: 'contains', label: 'City',          type: 'text' },
    { field: 'isActive',      label: 'Active',      type: 'boolean' },
  ],
  [
    { key: 'customerCode',   label: 'Code',         sortable: true, width: 120 },
    { key: 'customerType',   label: 'Type',         width: 100, type: 'enum' },
    { key: 'firstName',      label: 'First Name',   sortable: true },
    { key: 'lastName',       label: 'Last Name',    sortable: true },
    { key: 'companyName',    label: 'Company',      sortable: true },
    { key: 'email',          label: 'Email' },
    { key: 'primaryPhone',   label: 'Phone',        width: 130 },
    { key: 'gstin',          label: 'GSTIN',        width: 160 },
    { key: 'billingCity',    label: 'City',         width: 110 },
    { key: 'billingState',   label: 'State',        width: 100, type: 'enum' },
    { key: 'creditLimit',    label: 'Credit Limit', width: 120, type: 'currency', align: 'right' },
    { key: 'isActive',       label: 'Active',       width: 80,  type: 'boolean' },
  ],
)

const vehicleMasterPayload: Record<string, unknown> = mkListPayload(
  'vehicle',
  'New Vehicle',
  [
    { field: 'manufacturer', operator: 'contains', label: 'Manufacturer', type: 'text' },
    { field: 'modelName',    operator: 'contains', label: 'Model',        type: 'text' },
    { field: 'fuelType',     label: 'Fuel Type',   type: 'enum' },
    { field: 'bodyStyle',    label: 'Body Style',  type: 'enum' },
    { field: 'isActive',     label: 'Active',      type: 'boolean' },
  ],
  [
    { key: 'vehicleCode',      label: 'Code',         sortable: true, width: 120 },
    { key: 'manufacturer',     label: 'Manufacturer', sortable: true, width: 130 },
    { key: 'modelName',        label: 'Model',        sortable: true },
    { key: 'variant',          label: 'Variant',      sortable: true },
    { key: 'fuelType',         label: 'Fuel',         width: 90,  type: 'enum' },
    { key: 'transmissionType', label: 'Trans.',       width: 90,  type: 'enum' },
    { key: 'bodyStyle',        label: 'Body',         width: 90,  type: 'enum' },
    { key: 'color',            label: 'Color',        width: 90,  type: 'enum' },
    { key: 'basePrice',        label: 'Base Price',   sortable: true, width: 120, type: 'currency', align: 'right' },
    { key: 'stockQty',         label: 'Stock',        width: 80,  type: 'number', align: 'right' },
    { key: 'isActive',         label: 'Active',       width: 80,  type: 'boolean' },
  ],
)

const supplierMasterPayload: Record<string, unknown> = mkListPayload(
  'supplier',
  'New Supplier',
  [
    { field: 'supplierCode', operator: 'contains', label: 'Code',  type: 'text' },
    { field: 'supplierName', operator: 'contains', label: 'Name',  type: 'text' },
    { field: 'city',         operator: 'contains', label: 'City',  type: 'text' },
    { field: 'isActive',     label: 'Active',       type: 'boolean' },
  ],
  [
    { key: 'supplierCode', label: 'Code',         sortable: true, width: 120 },
    { key: 'supplierName', label: 'Supplier Name',sortable: true },
    { key: 'contactPerson',label: 'Contact',      width: 140 },
    { key: 'phone',        label: 'Phone',        width: 130 },
    { key: 'email',        label: 'Email' },
    { key: 'gstin',        label: 'GSTIN',        width: 160 },
    { key: 'city',         label: 'City',         width: 110 },
    { key: 'state',        label: 'State',        width: 100, type: 'enum' },
    { key: 'paymentTerms', label: 'Pay Terms',    width: 110 },
    { key: 'isActive',     label: 'Active',       width: 80,  type: 'boolean' },
  ],
)

const partsInventoryPayload: Record<string, unknown> = mkListPayload(
  'parts',
  'New Part',
  [
    { field: 'partCode',    operator: 'contains', label: 'Part Code',   type: 'text' },
    { field: 'partName',    operator: 'contains', label: 'Part Name',   type: 'text' },
    { field: 'category',    label: 'Category',    type: 'enum' },
    { field: 'isActive',    label: 'Active',      type: 'boolean' },
  ],
  [
    { key: 'partCode',     label: 'Part Code',  sortable: true, width: 130 },
    { key: 'partName',     label: 'Part Name',  sortable: true },
    { key: 'category',     label: 'Category',   width: 130, type: 'enum' },
    { key: 'uom',          label: 'UOM',        width: 80 },
    { key: 'hsnCode',      label: 'HSN',        width: 100 },
    { key: 'mrp',          label: 'MRP (₹)',    width: 110, type: 'currency', align: 'right' },
    { key: 'purchaseRate', label: 'Buy Rate',   width: 110, type: 'currency', align: 'right' },
    { key: 'stockQty',     label: 'Stock',      width: 80,  type: 'number',   align: 'right' },
    { key: 'reorderLevel', label: 'Reorder',    width: 85,  type: 'number',   align: 'right' },
    { key: 'isActive',     label: 'Active',     width: 80,  type: 'boolean' },
  ],
)

const employeeDirectoryPayload: Record<string, unknown> = mkListPayload(
  'employee',
  'New Employee',
  [
    { field: 'employeeCode', operator: 'contains', label: 'Code',       type: 'text' },
    { field: 'fullName',     operator: 'contains', label: 'Name',       type: 'text' },
    { field: 'department',   label: 'Department',  type: 'enum' },
    { field: 'designation',  label: 'Designation', type: 'enum' },
    { field: 'isActive',     label: 'Active',      type: 'boolean' },
  ],
  [
    { key: 'employeeCode', label: 'Code',        sortable: true, width: 110 },
    { key: 'fullName',     label: 'Name',        sortable: true },
    { key: 'designation',  label: 'Designation', width: 140 },
    { key: 'department',   label: 'Department',  width: 130, type: 'enum' },
    { key: 'branch',       label: 'Branch',      width: 120 },
    { key: 'phone',        label: 'Phone',       width: 130 },
    { key: 'email',        label: 'Email' },
    { key: 'joiningDate',  label: 'Joined',      width: 110, type: 'date' },
    { key: 'isActive',     label: 'Active',      width: 80,  type: 'boolean' },
  ],
)

const technicianListPayload: Record<string, unknown> = mkListPayload(
  'technician',
  'New Technician',
  [
    { field: 'techCode',    operator: 'contains', label: 'Code',        type: 'text' },
    { field: 'name',        operator: 'contains', label: 'Name',        type: 'text' },
    { field: 'speciality',  label: 'Speciality',  type: 'enum' },
    { field: 'isAvailable', label: 'Available',   type: 'boolean' },
  ],
  [
    { key: 'techCode',      label: 'Code',       sortable: true, width: 110 },
    { key: 'name',          label: 'Name',       sortable: true },
    { key: 'speciality',    label: 'Speciality', width: 130, type: 'enum' },
    { key: 'certifications',label: 'Certs',      width: 120 },
    { key: 'branch',        label: 'Branch',     width: 120 },
    { key: 'phone',         label: 'Phone',      width: 130 },
    { key: 'activeJobs',    label: 'Active Jobs',width: 100, type: 'number', align: 'right' },
    { key: 'isAvailable',   label: 'Available',  width: 90,  type: 'boolean' },
  ],
)

const financeCompanyListPayload: Record<string, unknown> = mkListPayload(
  'finance_company',
  'New Finance Company',
  [
    { field: 'companyCode', operator: 'contains', label: 'Code',    type: 'text' },
    { field: 'companyName', operator: 'contains', label: 'Name',    type: 'text' },
    { field: 'isActive',    label: 'Active',      type: 'boolean' },
  ],
  [
    { key: 'companyCode',  label: 'Code',          sortable: true, width: 120 },
    { key: 'companyName',  label: 'Company Name',  sortable: true },
    { key: 'contactPerson',label: 'Contact',       width: 140 },
    { key: 'phone',        label: 'Phone',         width: 130 },
    { key: 'email',        label: 'Email' },
    { key: 'maxLoanPct',   label: 'Max Loan %',    width: 110, type: 'number', align: 'right' },
    { key: 'minDownPct',   label: 'Min Down %',    width: 110, type: 'number', align: 'right' },
    { key: 'processingFee',label: 'Processing Fee',width: 130, type: 'currency', align: 'right' },
    { key: 'isActive',     label: 'Active',        width: 80,  type: 'boolean' },
  ],
)

const serviceOrdersPayload: Record<string, unknown> = mkListPayload(
  'service_order',
  'New Service Order',
  [
    { field: 'soNumber',    operator: 'contains', label: 'SO Number',  type: 'text' },
    { field: 'customer',    operator: 'contains', label: 'Customer',   type: 'text' },
    { field: 'status',      label: 'Status',      type: 'enum' },
    { field: 'serviceType', label: 'Service Type',type: 'enum' },
    { field: 'soDate',      operator: 'gte',      label: 'From Date',  type: 'date' },
  ],
  [
    { key: 'soNumber',     label: 'SO Number',   sortable: true, width: 140 },
    { key: 'soDate',       label: 'Date',        sortable: true, width: 110, type: 'date' },
    { key: 'customer',     label: 'Customer',    sortable: true },
    { key: 'vehicleReg',   label: 'Vehicle Reg', width: 130 },
    { key: 'serviceType',  label: 'Type',        width: 120, type: 'enum' },
    { key: 'technician',   label: 'Technician',  width: 140 },
    { key: 'estimatedAmt', label: 'Estimate',    width: 110, type: 'currency', align: 'right' },
    { key: 'status',       label: 'Status',      width: 110, type: 'status' },
  ],
)

const partCategoryPayload: Record<string, unknown> = mkListPayload(
  'part_category',
  'New Category',
  [
    { field: 'categoryCode', operator: 'contains', label: 'Code', type: 'text' },
    { field: 'categoryName', operator: 'contains', label: 'Name', type: 'text' },
    { field: 'isActive',     label: 'Active',       type: 'boolean' },
  ],
  [
    { key: 'categoryCode', label: 'Code',        sortable: true, width: 130 },
    { key: 'categoryName', label: 'Category',    sortable: true },
    { key: 'parentCategory',label: 'Parent',     width: 160 },
    { key: 'description',  label: 'Description' },
    { key: 'partsCount',   label: 'Parts',       width: 80, type: 'number', align: 'right' },
    { key: 'isActive',     label: 'Active',      width: 80, type: 'boolean' },
  ],
)

const partsRequestPayload: Record<string, unknown> = mkListPayload(
  'parts_request',
  'New Parts Request',
  [
    { field: 'requestNo',   operator: 'contains', label: 'Request No', type: 'text' },
    { field: 'status',      label: 'Status',       type: 'enum' },
    { field: 'requestDate', operator: 'gte',       label: 'From Date',  type: 'date' },
  ],
  [
    { key: 'requestNo',    label: 'Request No',  sortable: true, width: 140 },
    { key: 'requestDate',  label: 'Date',        sortable: true, width: 110, type: 'date' },
    { key: 'serviceOrder', label: 'Service Order', width: 140 },
    { key: 'requestedBy',  label: 'Requested By', width: 140 },
    { key: 'partsCount',   label: 'Parts',        width: 80, type: 'number', align: 'right' },
    { key: 'totalValue',   label: 'Value (₹)',    width: 110, type: 'currency', align: 'right' },
    { key: 'status',       label: 'Status',       width: 110, type: 'status' },
  ],
)

const purchaseOrderPayload: Record<string, unknown> = {
  meta: { description: 'Purchase Order — header + line items', default_mode: 'edit' },
  datasources: [
    { source_key: 'po_record', base_entity: 'purchase_order', pagination: { page_size: 1 } },
    { source_key: 'pol_list',  base_entity: 'purchase_order_line', pagination: { page_size: 50 } },
  ],
  component_tree: {
    component_key: 'root', component_code: 'page_root',
    children: [
      { component_key: 'tb-po', component_code: 'toolbar', children: [
        { component_key: 'btn-save',   component_code: 'button', props: { variant: 'primary' },   bindings: { label: sta('Save Draft') } },
        { component_key: 'btn-submit', component_code: 'button', props: { variant: 'secondary' }, bindings: { label: sta('Submit PO') } },
        { component_key: 'sb-status', component_code: 'status_badge', bindings: { status: fld('purchase_order', 'status') } },
      ]},
      vsec('sec-po-hdr', 'PO Details', [
        vrow('r-po-1', [
          vcol('c-po-1', [inp('f-pono',     'text_input',       'purchase_order', 'poNumber',    'PO Number',   { readOnly: true })]),
          vcol('c-po-2', [inp('f-podate',   'date_picker',      'purchase_order', 'poDate',      'PO Date')]),
          vcol('c-po-3', [inp('f-supplier', 'reference_select', 'purchase_order', 'supplier',    'Supplier *',  { entity: 'supplier', required: true })]),
          vcol('c-po-4', [inp('f-delivdt',  'date_picker',      'purchase_order', 'deliveryDate','Expected Delivery')]),
        ]),
        vrow('r-po-2', [
          vcol('c-po-5', [inp('f-branch',  'reference_select', 'purchase_order', 'branch',   'Branch',   { entity: 'branch' })]),
          vcol('c-po-6', [inp('f-remarks', 'textarea',         'purchase_order', 'remarks',  'Remarks',  { rows: 2 })]),
        ]),
      ]),
      vsec('sec-po-lines', 'Order Lines', [
        { component_key: 'dt-pol', component_code: 'data_table',
          props: {
            addRowEnabled: true, deleteRowEnabled: true,
            columns: [
              { key: 'lineNumber',    label: '#',          width: 50,  type: 'number',   align: 'right', readOnly: true },
              { key: 'partCode',      label: 'Part',       sortable: true },
              { key: 'uom',           label: 'UOM',        width: 80 },
              { key: 'orderedQty',    label: 'Qty',        width: 80,  type: 'number',   align: 'right' },
              { key: 'unitRate',      label: 'Rate (₹)',   width: 110, type: 'currency', align: 'right' },
              { key: 'taxableAmount', label: 'Taxable',    width: 120, type: 'currency', align: 'right', readOnly: true },
              { key: 'cgstRate',      label: 'CGST%',      width: 75,  type: 'number',   align: 'right' },
              { key: 'sgstRate',      label: 'SGST%',      width: 75,  type: 'number',   align: 'right' },
              { key: 'lineTotal',     label: 'Line Total', width: 120, type: 'currency', align: 'right', readOnly: true },
            ],
          },
          bindings: { data: fld('purchase_order_line', '_list'), loading: fld('purchase_order_line', '_loading') },
        },
      ]),
    ],
  },
}

const serviceDashboardPayload: Record<string, unknown> = {
  meta: { description: 'Service operations dashboard — open SOs, technician load, parts alerts' },
  datasources: [
    { source_key: 'so_open',   base_entity: 'service_order', pagination: { page_size: 10 }, sort: [{ field: 'soDate', direction: 'desc' }] },
    { source_key: 'tech_load', base_entity: 'technician',    pagination: { page_size: 8  }, sort: [{ field: 'activeJobs', direction: 'desc' }] },
  ],
  component_tree: {
    component_key: 'root', component_code: 'page_root',
    children: [
      vrow('r-kpi', [
        vcol('c-kpi-1', [{ component_key: 'm-open',  component_code: 'metric_comparison', props: { label: "Open Service Orders" }, bindings: { value: fld('service_order', '_count_open'),  comparison: sta('vs yesterday') } }]),
        vcol('c-kpi-2', [{ component_key: 'm-today', component_code: 'metric_comparison', props: { label: "Today's Deliveries" },  bindings: { value: fld('service_order', '_count_today'), trend: sta('neutral') } }]),
        vcol('c-kpi-3', [{ component_key: 'm-tech',  component_code: 'metric_comparison', props: { label: "Technicians Available"}, bindings: { value: fld('technician',    '_count_available'), trend: sta('up') } }]),
        vcol('c-kpi-4', [{ component_key: 'm-parts', component_code: 'metric_comparison', props: { label: "Low Stock Parts" },     bindings: { value: fld('parts',         '_count_low_stock'), trend: sta('down') } }]),
      ]),
      vrow('r-data', [
        vcol('c-data-1', [
          { component_key: 'dt-so', component_code: 'data_table',
            props: { title: 'Open Service Orders', columns: [
              { key: 'soNumber',    label: 'SO#',      width: 130 },
              { key: 'soDate',      label: 'Date',     width: 100, type: 'date' },
              { key: 'customer',    label: 'Customer' },
              { key: 'vehicleReg',  label: 'Vehicle',  width: 120 },
              { key: 'technician',  label: 'Technician', width: 140 },
              { key: 'status',      label: 'Status',   width: 110, type: 'status' },
            ]},
            bindings: { data: fld('service_order', '_list'), loading: fld('service_order', '_loading') },
          },
        ]),
        vcol('c-data-2', [
          { component_key: 'dg-tech', component_code: 'data_card_grid',
            props: { title: 'Technician Workload', cardFields: [
              { key: 'name',       label: 'Name' },
              { key: 'speciality', label: 'Speciality' },
              { key: 'activeJobs', label: 'Active Jobs', type: 'number' },
            ]},
            bindings: { data: fld('technician', '_list'), loading: fld('technician', '_loading') },
          },
        ]),
      ]),
    ],
  },
}

const saleWizardPayload: Record<string, unknown> = {
  meta: { description: 'New Vehicle Sale — guided wizard', default_mode: 'edit' },
  datasources: [{ source_key: 'so_new', base_entity: 'sale_order', pagination: { page_size: 1 } }],
  component_tree: {
    component_key: 'root', component_code: 'page_root',
    children: [
      { component_key: 'wiz', component_code: 'wizard_step', props: { step: 1, title: 'Customer Selection' }, children: [
        vrow('r-w1', [
          vcol('c-w1-1', [inp('f-customer', 'reference_select', 'sale_order', 'customer', 'Customer *', { entity: 'customer', required: true })]),
          vcol('c-w1-2', [inp('f-exec',     'reference_select', 'sale_order', 'salesExecutive', 'Sales Executive *', { entity: 'employee', required: true })]),
        ]),
        vrow('r-w1b', [
          vcol('c-w1-3', [inp('f-source', 'dropdown_select', 'sale_order', 'orderSource', 'Order Source', { options: ['WalkIn','Online','Referral','Exhibition','Campaign'] })]),
          vcol('c-w1-4', [inp('f-priority','dropdown_select', 'sale_order', 'priority',    'Priority',    { options: ['High','Medium','Low'] })]),
        ]),
      ]},
      { component_key: 'wiz2', component_code: 'wizard_step', props: { step: 2, title: 'Vehicle Selection' }, children: [
        { component_key: 'dt-veh', component_code: 'data_table',
          props: { selectable: true, columns: [
            { key: 'vehicleCode',  label: 'Code',         width: 120 },
            { key: 'modelName',    label: 'Model',        sortable: true },
            { key: 'variant',      label: 'Variant' },
            { key: 'fuelType',     label: 'Fuel',         width: 90,  type: 'enum' },
            { key: 'color',        label: 'Color',        width: 90,  type: 'enum' },
            { key: 'basePrice',    label: 'Base Price',   width: 120, type: 'currency', align: 'right' },
            { key: 'stockQty',     label: 'Stock',        width: 80,  type: 'number',  align: 'right' },
          ]},
          bindings: { data: fld('vehicle', '_list'), loading: fld('vehicle', '_loading') },
        },
      ]},
      { component_key: 'wiz3', component_code: 'wizard_step', props: { step: 3, title: 'Payment & Finance' }, children: [
        vrow('r-w3', [
          vcol('c-w3-1', [inp('f-paymode', 'dropdown_select', 'sale_order', 'paymentMode',   'Payment Mode *',  { options: ['Cash','Finance','Exchange'], required: true })]),
          vcol('c-w3-2', [inp('f-advance', 'number_input',    'sale_order', 'advancePayment','Advance (₹)')]),
        ]),
        vrow('r-w3b', [
          vcol('c-w3-3', [inp('f-fin',    'reference_select', 'sale_order', 'financier',   'Finance Company', { entity: 'finance_company' })]),
          vcol('c-w3-4', [inp('f-tenure', 'dropdown_select',  'sale_order', 'tenure',      'Tenure (Months)', { options: ['12','24','36','48','60','72'] })]),
        ]),
      ]},
      { component_key: 'wiz4', component_code: 'wizard_step', props: { step: 4, title: 'Review & Confirm' }, children: [
        vrow('r-w4', [
          vcol('c-w4-1', [inp('f-netamt', 'label', 'sale_order', 'netAmount', 'Net Amount (₹)')]),
          vcol('c-w4-2', [inp('f-status', 'label', 'sale_order', 'status',    'Status')]),
        ]),
      ]},
    ],
  },
}

const customer360Payload: Record<string, unknown> = {
  meta: { description: 'Customer 360 — split view: list left, full profile right', default_mode: 'view' },
  datasources: [
    { source_key: 'cust_list',   base_entity: 'customer',    pagination: { page_size: 30 } },
    { source_key: 'so_history',  base_entity: 'sale_order',  pagination: { page_size: 10 }, sort: [{ field: 'documentDate', direction: 'desc' }] },
    { source_key: 'svc_history', base_entity: 'service_order', pagination: { page_size: 10 }, sort: [{ field: 'soDate', direction: 'desc' }] },
  ],
  component_tree: {
    component_key: 'root', component_code: 'page_root',
    children: [
      { component_key: 'sp', component_code: 'split_panel', children: [
        // Left — customer list
        { component_key: 'sp-left', component_code: 'section', props: { title: 'Customers' }, children: [
          { component_key: 'dt-cust-list', component_code: 'data_table',
            props: { selectable: true, columns: [
              { key: 'customerCode', label: 'Code',  width: 100 },
              { key: 'firstName',    label: 'Name',  sortable: true },
              { key: 'primaryPhone', label: 'Phone', width: 120 },
            ]},
            bindings: { data: fld('customer', '_list'), loading: fld('customer', '_loading') },
          },
        ]},
        // Right — full profile
        { component_key: 'sp-right', component_code: 'section', props: { title: 'Customer Profile' }, children: [
          vsec('sec-cust-info', 'Personal Information', [
            vrow('r-ci-1', [
              vcol('c-ci-1', [inp('f-fname',  'text_input', 'customer', 'firstName',   'First Name')]),
              vcol('c-ci-2', [inp('f-lname',  'text_input', 'customer', 'lastName',    'Last Name')]),
              vcol('c-ci-3', [inp('f-company','text_input', 'customer', 'companyName', 'Company')]),
            ]),
            vrow('r-ci-2', [
              vcol('c-ci-4', [inp('f-phone', 'text_input', 'customer', 'primaryPhone', 'Phone')]),
              vcol('c-ci-5', [inp('f-email', 'text_input', 'customer', 'email',        'Email')]),
              vcol('c-ci-6', [inp('f-gstin', 'text_input', 'customer', 'gstin',        'GSTIN')]),
            ]),
          ]),
          vsec('sec-so-hist', 'Sale Order History', [
            { component_key: 'dt-so-hist', component_code: 'data_table',
              props: { columns: [
                { key: 'documentNumber', label: 'SO#',    width: 130 },
                { key: 'documentDate',   label: 'Date',   width: 100, type: 'date' },
                { key: 'netAmount',      label: 'Amount', width: 110, type: 'currency', align: 'right' },
                { key: 'status',         label: 'Status', width: 100, type: 'status' },
              ]},
              bindings: { data: fld('sale_order', '_list'), loading: fld('sale_order', '_loading') },
            },
          ]),
          vsec('sec-svc-hist', 'Service History', [
            { component_key: 'dt-svc-hist', component_code: 'data_table',
              props: { columns: [
                { key: 'soNumber',    label: 'SO#',      width: 130 },
                { key: 'soDate',      label: 'Date',     width: 100, type: 'date' },
                { key: 'serviceType', label: 'Type',     width: 130, type: 'enum' },
                { key: 'status',      label: 'Status',   width: 100, type: 'status' },
              ]},
              bindings: { data: fld('service_order', '_list'), loading: fld('service_order', '_loading') },
            },
          ]),
        ]},
      ]},
    ],
  },
}

// ── seed factories ─────────────────────────────────────────────────────────────

function makeView(
  id: string,
  label: string,
  surfaceType: string,
  primaryEntity: string,
  payload: Record<string, unknown>,
  viewCode?: string,
): ViewSeed {
  const versionId = `ver-${id}`
  return {
    artifact_id: id,
    artifact_name: label,
    artifact_type: 'view',
    tenant_id: TENANT,
    surface_type: surfaceType,
    primary_entity: primaryEntity,
    view_code: viewCode,
    view_label: label,
    created_at: TS,
    updated_at: TS,
    created_by: TENANT,
    revision: 1,
    latest_version_id: versionId,
    latest_version_no: 1,
    is_draft: false,
    is_active: true,
    _draft_payload: payload,
    _versions: [{
      version_id: versionId,
      artifact_id: id,
      version_no: 1,
      payload,
      is_active: true,
      is_draft: false,
      created_at: TS,
      created_by: TENANT,
      revision: 1,
      published_at: TS,
      published_by: TENANT,
    }],
  }
}

function makeDraftView(
  id: string,
  label: string,
  surfaceType: string,
  primaryEntity: string,
  payload: Record<string, unknown>,
  viewCode?: string,
): ViewSeed {
  return {
    ...makeView(id, label, surfaceType, primaryEntity, payload, viewCode),
    is_draft: true,
    is_active: false,
    _versions: [],
  }
}

// ── seed views — 16 views, 13 published + 3 draft, all 12 entity types covered ──

export const seedViews: ViewSeed[] = [
  // ─── split_view ────────────────────────────────────────────────────────────
  makeView('00000000-0000-0000-0002-000000000001', 'Customer 360',            'split_view',   'customer',        customer360Payload,         'customer_360'),

  // ─── dashboard ─────────────────────────────────────────────────────────────
  makeView('00000000-0000-0000-0002-000000000002', 'Service Dashboard',       'dashboard',    'service_order',   serviceDashboardPayload,    'service_dashboard'),

  // ─── wizard ────────────────────────────────────────────────────────────────
  makeView('00000000-0000-0000-0002-000000000003', 'New Vehicle Sale Wizard', 'wizard',       'sale_order',      saleWizardPayload,          'new_vehicle_sale_wizard'),

  // ─── standard_crud (published) ─────────────────────────────────────────────
  makeView('00000000-0000-0000-0002-000000000004', 'Customer Master',         'standard_crud','customer',        customerMasterPayload,      'customer_master'),
  makeView('00000000-0000-0000-0002-000000000005', 'Supplier Master',         'standard_crud','supplier',        supplierMasterPayload,      'supplier_master'),
  makeView('00000000-0000-0000-0002-000000000006', 'Parts Inventory',         'standard_crud','parts',           partsInventoryPayload,      'parts_inventory'),
  makeView('00000000-0000-0000-0002-000000000007', 'Employee Directory',      'standard_crud','employee',        employeeDirectoryPayload,   'employee_directory'),
  makeView('00000000-0000-0000-0002-000000000008', 'Technician List',         'standard_crud','technician',      technicianListPayload,      'technician_list'),
  makeView('00000000-0000-0000-0002-000000000009', 'Finance Company List',    'standard_crud','finance_company', financeCompanyListPayload,  'finance_company_list'),
  makeView('00000000-0000-0000-0002-000000000010', 'Sale Orders',             'standard_crud','sale_order',      saleOrdersPayload,          'sale_orders'),
  makeView('00000000-0000-0000-0002-000000000011', 'Service Orders',          'standard_crud','service_order',   serviceOrdersPayload,       'service_orders'),
  makeView('00000000-0000-0000-0002-000000000012', 'Part Category Master',    'standard_crud','part_category',   partCategoryPayload,        'part_category_master'),

  // ─── header_line (published) ───────────────────────────────────────────────
  makeView('00000000-0000-0000-0002-000000000013', 'Sale Order Editor',       'header_line',  'sale_order',      saleOrderEditorPayload,     'sale_order_editor'),

  // ─── drafts (3) ────────────────────────────────────────────────────────────
  makeDraftView('00000000-0000-0000-0002-000000000014', 'Vehicle Master',       'standard_crud','vehicle',         vehicleMasterPayload,       'vehicle_master'),
  makeDraftView('00000000-0000-0000-0002-000000000015', 'Purchase Order Form',  'header_line',  'purchase_order',  purchaseOrderPayload,       'purchase_order_form'),
  makeDraftView('00000000-0000-0000-0002-000000000016', 'Parts Request',        'standard_crud','parts_request',   partsRequestPayload,        'parts_request'),
]
