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
  return { component_key: key, component_code: 'Row', children }
}
function vcol(key: string, children: unknown[]) {
  return { component_key: key, component_code: 'Column', children }
}
function vsec(key: string, title: string, children: unknown[]) {
  return { component_key: key, component_code: 'Section', props: { title }, children }
}

// ── view payloads ──────────────────────────────────────────────────────────────

const saleOrdersPayload: Record<string, unknown> = {
  meta: { description: 'Sale Order list with search, filters, and actions', default_mode: 'view' },
  datasources: [{ source_key: 'so_list', base_entity: 'sale_order', pagination: { page_size: 25 }, sort: [{ field: 'documentDate', direction: 'desc' }] }],
  component_tree: {
    component_key: 'root', component_code: 'PageRoot',
    children: [
      { component_key: 'tb', component_code: 'Toolbar', children: [
        { component_key: 'btn-new-so', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('New Sale Order') } },
      ]},
      { component_key: 'fp-so', component_code: 'FilterPanel', bindings: { filters: sta([
        { field: 'documentDate', operator: 'gte', label: 'From Date', type: 'date' },
        { field: 'documentDate', operator: 'lte', label: 'To Date', type: 'date' },
        { field: 'status', label: 'Status', type: 'enum' },
        { field: 'customer', operator: 'contains', label: 'Customer', type: 'text' },
        { field: 'branch', label: 'Branch', type: 'text' },
        { field: 'paymentMode', label: 'Payment Mode', type: 'enum' },
      ]) }},
      { component_key: 'dt-so', component_code: 'DataTable',
        props: { columns: [
          { key: 'documentNumber', label: 'SO Number', sortable: true, width: 140 },
          { key: 'documentDate', label: 'Date', sortable: true, width: 110, type: 'date' },
          { key: 'customer', label: 'Customer', sortable: true },
          { key: 'branch', label: 'Branch', sortable: true, width: 130 },
          { key: 'salesExecutive', label: 'Sales Exec', width: 140 },
          { key: 'paymentMode', label: 'Payment', width: 100 },
          { key: 'netAmount', label: 'Net Amount', sortable: true, width: 120, type: 'currency', align: 'right' },
          { key: 'status', label: 'Status', width: 110, type: 'status' },
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
    component_key: 'root', component_code: 'PageRoot',
    children: [
      { component_key: 'tb-so', component_code: 'Toolbar', children: [
        { component_key: 'btn-save', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('Save Draft') } },
        { component_key: 'btn-submit', component_code: 'Button', props: { variant: 'secondary' }, bindings: { label: sta('Submit Order') } },
        { component_key: 'sb-status', component_code: 'StatusBadge', bindings: { status: fld('sale_order', 'status') } },
      ]},
      vsec('sec-doc', 'Document Information', [
        vrow('r-doc-1', [
          vcol('c-doc-1', [inp('f-docno',   'TextInput',  'sale_order', 'documentNumber',  'Document Number',   { readOnly: true })]),
          vcol('c-doc-2', [inp('f-docdate',  'DatePicker', 'sale_order', 'documentDate',    'Document Date')]),
          vcol('c-doc-3', [inp('f-status',   'Label',      'sale_order', 'status',           'Status')]),
          vcol('c-doc-4', [inp('f-createdby','Label',      'sale_order', 'createdBy',        'Created By')]),
        ]),
        vrow('r-doc-2', [
          vcol('c-doc-5', [inp('f-org',   'ReferenceSelect', 'sale_order', 'organisation', 'Organisation', { entity: 'organisation' })]),
          vcol('c-doc-6', [inp('f-branch','ReferenceSelect', 'sale_order', 'branch',        'Branch',       { entity: 'branch' })]),
          vcol('c-doc-7', [inp('f-dept',  'ReferenceSelect', 'sale_order', 'department',    'Department',   { entity: 'department' })]),
        ]),
      ]),
      vsec('sec-cust', 'Customer Details', [
        vrow('r-cust-1', [
          vcol('c-cust-1', [inp('f-customer', 'ReferenceSelect', 'sale_order', 'customer',       'Customer *',        { entity: 'customer', required: true })]),
          vcol('c-cust-2', [inp('f-gstin',    'TextInput',       'sale_order', 'gstin',           'Customer GSTIN')]),
          vcol('c-cust-3', [inp('f-exec',     'ReferenceSelect', 'sale_order', 'salesExecutive', 'Sales Executive *', { entity: 'employee', required: true })]),
          vcol('c-cust-4', [inp('f-source',   'Dropdown',        'sale_order', 'orderSource',    'Order Source',      { options: ['WalkIn','Online','Referral','Exhibition','Campaign'] })]),
        ]),
        vrow('r-cust-2', [
          vcol('c-cust-5', [inp('f-priority', 'Dropdown',  'sale_order', 'priority',              'Priority',               { options: ['High','Medium','Low'] })]),
          vcol('c-cust-6', [inp('f-deldate',  'DatePicker','sale_order', 'requestedDeliveryDate', 'Requested Delivery Date')]),
          vcol('c-cust-7', [inp('f-validtill','DatePicker','sale_order', 'validTillDate',          'Valid Till Date')]),
          vcol('c-cust-8', [inp('f-pos',      'Dropdown',  'sale_order', 'placeOfSupply',         'Place of Supply',        { options: ['Maharashtra','Karnataka','TamilNadu','Delhi','Gujarat','Telangana','AndhraPradesh','WestBengal','Rajasthan','UttarPradesh'] })]),
        ]),
      ]),
      vsec('sec-del', 'Delivery', [
        vrow('r-del-1', [
          vcol('c-del-1', [inp('f-delterm', 'ReferenceSelect', 'sale_order', 'deliveryTerm', 'Delivery Term', { entity: 'delivery_term' })]),
          vcol('c-del-2', [inp('f-deltype', 'ReferenceSelect', 'sale_order', 'deliveryType', 'Delivery Type', { entity: 'delivery_type' })]),
          vcol('c-del-3', [inp('f-delslot', 'ReferenceSelect', 'sale_order', 'deliverySlot', 'Delivery Slot', { entity: 'delivery_slot' })]),
        ]),
        vrow('r-del-2', [
          vcol('c-del-4', [inp('f-deladdr', 'Textarea', 'sale_order', 'deliveryAddress', 'Delivery Address', { rows: 3 })]),
        ]),
      ]),
      vsec('sec-pay', 'Payment Details', [
        vrow('r-pay-1', [
          vcol('c-pay-1', [inp('f-paymode',   'Dropdown',    'sale_order', 'paymentMode',   'Payment Mode *',   { options: ['Cash','Finance','Exchange'], required: true })]),
          vcol('c-pay-2', [inp('f-paymethod', 'Dropdown',    'sale_order', 'paymentMethod', 'Payment Method',   { options: ['Cheque','DD','NEFT','RTGS','UPI','Cash'] })]),
          vcol('c-pay-3', [inp('f-advance',   'NumberInput', 'sale_order', 'advancePayment','Advance Payment (₹)')]),
        ]),
      ]),
      vsec('sec-fin', 'Finance', [
        vrow('r-fin-1', [
          vcol('c-fin-1', [inp('f-financier', 'ReferenceSelect', 'sale_order', 'financier',     'Financier',       { entity: 'financier' })]),
          vcol('c-fin-2', [inp('f-downpay',   'NumberInput',     'sale_order', 'downPayment',   'Down Payment (₹)')]),
          vcol('c-fin-3', [inp('f-finamount', 'NumberInput',     'sale_order', 'financeAmount', 'Finance Amount (₹)')]),
        ]),
        vrow('r-fin-2', [
          vcol('c-fin-4', [inp('f-tenure',  'Dropdown',    'sale_order', 'tenure',         'Tenure (Months)', { options: ['12','24','36','48','60','72'] })]),
          vcol('c-fin-5', [inp('f-emirate', 'NumberInput', 'sale_order', 'emiInterestRate','EMI Interest Rate (%)')]),
        ]),
      ]),
      vsec('sec-ins', 'Insurance', [
        vrow('r-ins-1', [
          vcol('c-ins-1', [inp('f-insprov',    'ReferenceSelect', 'sale_order', 'insuranceProvider',    'Insurance Provider', { entity: 'insurance_provider' })]),
          vcol('c-ins-2', [inp('f-inspolicy',  'TextInput',       'sale_order', 'insurancePolicyNumber','Policy Number')]),
          vcol('c-ins-3', [inp('f-insdate',    'DatePicker',      'sale_order', 'insurancePolicyDate',  'Policy Date')]),
        ]),
      ]),
      vsec('sec-totals', 'Order Totals', [
        vrow('r-tot-1', [
          vcol('c-tot-1', [inp('f-totalqty',  'Label', 'sale_order', 'totalQuantity',   'Total Quantity')]),
          vcol('c-tot-2', [inp('f-totalbase', 'Label', 'sale_order', 'totalBaseAmount', 'Total Base Amount (₹)')]),
          vcol('c-tot-3', [inp('f-totaltax',  'Label', 'sale_order', 'totalTaxAmount',  'Total Tax Amount (₹)')]),
          vcol('c-tot-4', [inp('f-netamt',    'Label', 'sale_order', 'netAmount',       'Net Amount (₹)')]),
        ]),
      ]),
      vsec('sec-int', 'Internal Notes', [
        vrow('r-int-1', [
          vcol('c-int-1', [inp('f-remarks',    'Textarea', 'sale_order', 'remarks',            'Remarks',             { rows: 3 })]),
          vcol('c-int-2', [inp('f-cancelrsn',  'Textarea', 'sale_order', 'cancellationReason', 'Cancellation Reason', { rows: 3 })]),
        ]),
      ]),
      vsec('sec-lines', 'Order Lines', [
        { component_key: 'dt-lines', component_code: 'DataTable',
          props: {
            addRowEnabled: true, deleteRowEnabled: true,
            columns: [
              { key: 'lineNumber',     label: '#',            width: 50,  type: 'number',   align: 'right', readOnly: true },
              { key: 'lineStatus',     label: 'Status',       width: 90,  type: 'status' },
              { key: 'productCode',    label: 'Vehicle',      sortable: true },
              { key: 'uom',            label: 'UOM',          width: 80 },
              { key: 'orderQuantity',  label: 'Qty',          width: 80,  type: 'number',   align: 'right' },
              { key: 'rate',           label: 'Rate (₹)',     width: 110, type: 'currency', align: 'right' },
              { key: 'baseAmount',     label: 'Base Amt',     width: 120, type: 'currency', align: 'right', readOnly: true },
              { key: 'discountPercent',label: 'Disc %',       width: 80,  type: 'number',   align: 'right' },
              { key: 'discountAmount', label: 'Disc Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
              { key: 'taxableAmount',  label: 'Taxable',      width: 120, type: 'currency', align: 'right', readOnly: true },
              { key: 'cgstRate',       label: 'CGST%',        width: 75,  type: 'number',   align: 'right' },
              { key: 'sgstRate',       label: 'SGST%',        width: 75,  type: 'number',   align: 'right' },
              { key: 'igstRate',       label: 'IGST%',        width: 75,  type: 'number',   align: 'right' },
              { key: 'cgstAmount',     label: 'CGST Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
              { key: 'sgstAmount',     label: 'SGST Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
              { key: 'igstAmount',     label: 'IGST Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
              { key: 'lineAmount',     label: 'Line Total',   width: 130, type: 'currency', align: 'right', readOnly: true },
              { key: 'cancelledQty',   label: 'Cancelled',    width: 90,  type: 'number',   align: 'right' },
              { key: 'lineRemark',     label: 'Remark' },
            ],
          },
          bindings: {
            data: fld('sale_order_line', '_list'),
            loading: fld('sale_order_line', '_loading'),
          },
        },
      ]),
    ],
  },
}

const customerMasterPayload: Record<string, unknown> = {
  meta: { description: 'Customer master list with full field exposure' },
  datasources: [{ source_key: 'cust_list', base_entity: 'customer', pagination: { page_size: 25 }, sort: [{ field: 'customerCode', direction: 'asc' }] }],
  component_tree: {
    component_key: 'root', component_code: 'PageRoot',
    children: [
      { component_key: 'tb-cust', component_code: 'Toolbar', children: [
        { component_key: 'btn-new-cust', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('New Customer') } },
      ]},
      { component_key: 'fp-cust', component_code: 'FilterPanel', bindings: { filters: sta([
        { field: 'customerCode',  operator: 'contains', label: 'Customer Code', type: 'text' },
        { field: 'firstName',     operator: 'contains', label: 'Name',          type: 'text' },
        { field: 'customerType',  label: 'Type',        type: 'enum' },
        { field: 'primaryPhone',  operator: 'contains', label: 'Phone',         type: 'text' },
        { field: 'billingCity',   operator: 'contains', label: 'City',          type: 'text' },
        { field: 'isActive',      label: 'Active',      type: 'boolean' },
      ]) }},
      { component_key: 'dt-cust', component_code: 'DataTable',
        props: { columns: [
          { key: 'customerCode',  label: 'Code',         sortable: true, width: 120 },
          { key: 'customerType',  label: 'Type',         width: 100,  type: 'enum' },
          { key: 'firstName',     label: 'First Name',   sortable: true },
          { key: 'lastName',      label: 'Last Name',    sortable: true },
          { key: 'companyName',   label: 'Company',      sortable: true },
          { key: 'email',         label: 'Email' },
          { key: 'primaryPhone',  label: 'Phone',        width: 130 },
          { key: 'gstin',         label: 'GSTIN',        width: 160 },
          { key: 'billingCity',   label: 'City',         width: 110 },
          { key: 'billingState',  label: 'State',        width: 100, type: 'enum' },
          { key: 'creditLimit',   label: 'Credit Limit', width: 120, type: 'currency', align: 'right' },
          { key: 'paymentTerm',   label: 'Pay Term',     width: 100 },
          { key: 'customerSource',label: 'Source',       width: 100, type: 'enum' },
          { key: 'isActive',      label: 'Active',       width: 80,  type: 'boolean' },
          { key: 'blacklisted',   label: 'Blacklisted',  width: 95,  type: 'boolean' },
        ]},
        bindings: {
          data: fld('customer', '_list'),
          loading: fld('customer', '_loading'),
        },
      },
    ],
  },
}

const vehicleCatalogPayload: Record<string, unknown> = {
  meta: { description: 'Vehicle / Product master catalog' },
  datasources: [{ source_key: 'veh_list', base_entity: 'vehicle', pagination: { page_size: 25 }, sort: [{ field: 'modelName', direction: 'asc' }] }],
  component_tree: {
    component_key: 'root', component_code: 'PageRoot',
    children: [
      { component_key: 'tb-veh', component_code: 'Toolbar', children: [
        { component_key: 'btn-new-veh', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('New Vehicle') } },
      ]},
      { component_key: 'fp-veh', component_code: 'FilterPanel', bindings: { filters: sta([
        { field: 'manufacturer', operator: 'contains', label: 'Manufacturer', type: 'text' },
        { field: 'modelName',    operator: 'contains', label: 'Model',        type: 'text' },
        { field: 'fuelType',     label: 'Fuel Type',   type: 'enum' },
        { field: 'bodyStyle',    label: 'Body Style',  type: 'enum' },
        { field: 'color',        label: 'Color',       type: 'enum' },
        { field: 'isActive',     label: 'Active',      type: 'boolean' },
      ]) }},
      { component_key: 'dt-veh', component_code: 'DataTable',
        props: { columns: [
          { key: 'vehicleCode',       label: 'Code',         sortable: true, width: 120 },
          { key: 'manufacturer',      label: 'Manufacturer', sortable: true, width: 130 },
          { key: 'modelName',         label: 'Model',        sortable: true },
          { key: 'variant',           label: 'Variant',      sortable: true },
          { key: 'fuelType',          label: 'Fuel',         width: 90,  type: 'enum' },
          { key: 'transmissionType',  label: 'Trans.',       width: 90,  type: 'enum' },
          { key: 'bodyStyle',         label: 'Body',         width: 90,  type: 'enum' },
          { key: 'color',             label: 'Color',        width: 90,  type: 'enum' },
          { key: 'basePrice',         label: 'Base Price',   sortable: true, width: 120, type: 'currency', align: 'right' },
          { key: 'mrp',               label: 'MRP',          width: 110, type: 'currency', align: 'right' },
          { key: 'hsnCode',           label: 'HSN',          width: 100 },
          { key: 'taxCategory',       label: 'Tax Category', width: 120 },
          { key: 'stockQty',          label: 'Stock',        width: 80,  type: 'number',  align: 'right' },
          { key: 'isActive',          label: 'Active',       width: 80,  type: 'boolean' },
        ]},
        bindings: {
          data: fld('vehicle', '_list'),
          loading: fld('vehicle', '_loading'),
        },
      },
    ],
  },
}

const salesDashboardPayload: Record<string, unknown> = {
  meta: { description: 'India Automobile — Sales Overview Dashboard' },
  datasources: [
    { source_key: 'so_recent', base_entity: 'sale_order',  pagination: { page_size: 10 }, sort: [{ field: 'documentDate', direction: 'desc' }] },
    { source_key: 'veh_lowstock', base_entity: 'vehicle',  pagination: { page_size: 8  }, sort: [{ field: 'stockQty', direction: 'asc' }] },
  ],
  component_tree: {
    component_key: 'root', component_code: 'PageRoot',
    children: [
      vrow('r-kpi', [
        vcol('c-kpi-1', [{ component_key: 'm-orders',  component_code: 'MetricComparison', props: { label: "Today's Orders" },         bindings: { value: fld('sale_order', '_count_today'),          comparison: sta('vs yesterday') } }]),
        vcol('c-kpi-2', [{ component_key: 'm-revenue', component_code: 'MetricComparison', props: { label: 'Month Revenue (₹)' },       bindings: { value: fld('sale_order', '_sum_netAmount_month'),  comparison: sta('vs last month') } }]),
        vcol('c-kpi-3', [{ component_key: 'm-open',    component_code: 'MetricComparison', props: { label: 'Open Orders' },             bindings: { value: fld('sale_order', '_count_open'),           trend: sta('neutral') } }]),
        vcol('c-kpi-4', [{ component_key: 'm-cust',    component_code: 'MetricComparison', props: { label: 'Active Customers' },        bindings: { value: fld('customer',   '_count_active'),         trend: sta('up') } }]),
      ]),
      vrow('r-data', [
        vcol('c-data-1', [
          { component_key: 'dt-recent-so', component_code: 'DataTable',
            props: { title: 'Recent Sale Orders', columns: [
              { key: 'documentNumber', label: 'SO#',     width: 130 },
              { key: 'documentDate',   label: 'Date',    width: 100, type: 'date' },
              { key: 'customer',       label: 'Customer' },
              { key: 'salesExecutive', label: 'Sales Exec', width: 140 },
              { key: 'paymentMode',    label: 'Payment',    width: 100 },
              { key: 'netAmount',      label: 'Amount',     width: 120, type: 'currency', align: 'right' },
              { key: 'status',         label: 'Status',     width: 110, type: 'status' },
            ]},
            bindings: { data: fld('sale_order', '_list'), loading: fld('sale_order', '_loading') },
          },
        ]),
        vcol('c-data-2', [
          { component_key: 'dg-lowstock', component_code: 'DataCardGrid',
            props: { title: 'Low Stock Alert', cardFields: [
              { key: 'modelName',    label: 'Model' },
              { key: 'fuelType',     label: 'Fuel' },
              { key: 'color',        label: 'Color' },
              { key: 'stockQty',     label: 'Stock', type: 'number' },
            ]},
            bindings: { data: fld('vehicle', '_list'), loading: fld('vehicle', '_loading') },
          },
        ]),
      ]),
    ],
  },
}

// ── seed views ─────────────────────────────────────────────────────────────────

function makeView(
  id: string,
  label: string,
  surfaceType: string,
  primaryEntity: string,
  payload: Record<string, unknown>,
): ViewSeed {
  const versionId = id.replace('0002', '0004') // deterministic version ID
  return {
    artifact_id: id,
    artifact_name: label,
    artifact_type: 'view',
    tenant_id: TENANT,
    surface_type: surfaceType,
    primary_entity: primaryEntity,
    view_label: label,
    created_at: TS,
    updated_at: TS,
    created_by: TENANT,
    latest_version_id: versionId,
    latest_version_no: 1,
    is_draft: false,
    is_active: true,
    _draft_payload: payload,
    _versions: [
      {
        version_id: versionId,
        artifact_id: id,
        version_no: 1,
        payload,
        is_active: true,
        is_draft: false,
        created_at: TS,
        created_by: TENANT,
        published_at: TS,
        published_by: TENANT,
      },
    ],
  }
}

export const seedViews: ViewSeed[] = [
  makeView('00000000-0000-0000-0002-000000000001', 'Sale Orders',       'standard_crud', 'sale_order', saleOrdersPayload),
  makeView('00000000-0000-0000-0002-000000000002', 'Sale Order Editor', 'header_line',   'sale_order', saleOrderEditorPayload),
  makeView('00000000-0000-0000-0002-000000000003', 'Customer Master',   'standard_crud', 'customer',   customerMasterPayload),
  makeView('00000000-0000-0000-0002-000000000004', 'Vehicle Catalog',   'standard_crud', 'vehicle',    vehicleCatalogPayload),
  makeView('00000000-0000-0000-0002-000000000005', 'Sales Dashboard',   'dashboard',     '',           salesDashboardPayload),
]
