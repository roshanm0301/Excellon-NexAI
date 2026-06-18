#!/usr/bin/env node

const API_URL = process.env.API_URL ?? 'http://localhost:9080/api/v1'
const TENANT_ID = process.env.TENANT_ID ?? '00000000-0000-0000-0000-000000000001'
const USER_ID = process.env.USER_ID ?? '00000000-0000-0000-0000-000000000001'

const headers = {
  'content-type': 'application/json',
  'x-tenant-id': TENANT_ID,
  'x-user-id': USER_ID,
  'x-role': 'admin',
}

const enumValues = values => values.map(value => ({ code: value, label: title(value), value }))

function title(value) {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function field(name, type, required = false, extra = {}) {
  const label = extra.label ?? title(name)
  const enumItems = extra.enumValues ? enumValues(extra.enumValues) : undefined
  return {
    key: name,
    name,
    label,
    type,
    required,
    unique: !!extra.unique,
    indexed: !!(extra.indexed ?? extra.unique ?? type === 'reference'),
    storageType: extra.storageType ?? 'physical',
    readOnly: !!extra.readOnly,
    referenceEntity: extra.referenceEntity,
    displayField: extra.displayField ?? (type === 'reference' ? 'display_id' : undefined),
    valueField: extra.valueField ?? (type === 'reference' ? 'id' : undefined),
    enumValues: enumItems,
    options: enumItems?.map(item => ({ value: item.code, label: item.label })),
    piiCategory: extra.piiCategory,
    validation: extra.validation,
  }
}

const str = (name, required = false, extra = {}) => field(name, 'string', required, extra)
const text = (name, required = false, extra = {}) => field(name, 'text', required, extra)
const dec = (name, required = false, extra = {}) => field(name, 'decimal', required, extra)
const int = (name, required = false, extra = {}) => field(name, 'integer', required, extra)
const bool = (name, required = false, extra = {}) => field(name, 'boolean', required, extra)
const date = (name, required = false, extra = {}) => field(name, 'date', required, extra)
const dt = (name, required = false, extra = {}) => field(name, 'datetime', required, extra)
const email = (name, required = false, extra = {}) => field(name, 'email', required, extra)
const phone = (name, required = false, extra = {}) => field(name, 'phone', required, extra)
const en = (name, values, required = false, extra = {}) => field(name, 'enum', required, { ...extra, enumValues: values })
const ref = (name, referenceEntity, required = false, extra = {}) => field(name, 'reference', required, { ...extra, referenceEntity })

function sectionsFor(fields) {
  const names = fields.map(f => f.name)
  const chunks = []
  for (let i = 0; i < names.length; i += 12) chunks.push(names.slice(i, i + 12))
  return chunks.map((fields, index) => ({
    id: `section_${index + 1}`,
    key: `section_${index + 1}`,
    title: index === 0 ? 'Core Details' : `Additional Details ${index}`,
    label: index === 0 ? 'Core Details' : `Additional Details ${index}`,
    fields,
    order: index + 1,
  }))
}

function relationshipsFor(fields, explicit = []) {
  const rels = fields
    .filter(f => f.type === 'reference' && f.referenceEntity)
    .map(f => ({
      id: `${f.name}_${f.referenceEntity}`,
      key: f.name,
      type: 'belongs_to',
      targetEntity: f.referenceEntity,
      target_type: f.referenceEntity,
      foreignKey: f.name,
      foreign_key: f.name,
      label: f.label,
    }))
  return [...rels, ...explicit]
}

function indexesFor(fields, extra = []) {
  const uniqueFields = fields.filter(f => f.unique).map(f => ({
    id: `uk_${f.name}`,
    name: `uk_${f.name}`,
    fields: [f.name],
    columns: [{ field: f.name, sort: 'asc' }],
    unique: true,
  }))
  const indexedFields = fields.filter(f => f.indexed && !f.unique).slice(0, 8).map(f => ({
    id: `idx_${f.name}`,
    name: `idx_${f.name}`,
    fields: [f.name],
    columns: [{ field: f.name, sort: 'asc' }],
    unique: false,
  }))
  return [...uniqueFields, ...indexedFields, ...extra]
}

function entity(key, displayName, storeType, fields, options = {}) {
  const displayPrefix = options.prefix ?? key.split('_').map(p => p[0]).join('').toUpperCase()
  const pluralName = options.pluralName ?? `${displayName}s`
  const payload = {
    entity_type: key,
    displayName,
    pluralName,
    category: storeType,
    icon: options.icon ?? (storeType === 'transaction' ? 'file-text' : 'box'),
    color: options.color ?? (storeType === 'transaction' ? '#2563EB' : '#0F766E'),
    description: options.description ?? `${displayName} schema for Purchase Order DMS configuration.`,
    fields,
    sections: options.sections ?? sectionsFor(fields),
    relationships: relationshipsFor(fields, options.relationships ?? []),
    indexes: indexesFor(fields, options.indexes ?? []),
    idConfig: {
      strategy: 'uuid_v7',
      displayId: { enabled: options.displayId !== false, prefix: displayPrefix, separator: '-', seed: 1, padding: 6 },
    },
    id_config: {
      strategy: 'uuid_v7',
      display_id: { enabled: options.displayId !== false, prefix: displayPrefix, separator: '-', seed: 1, padding: 6 },
    },
    capabilityFlags: {
      dbStoreType: storeType,
      softDelete: true,
      auditTrail: true,
      expressions: storeType === 'transaction',
      nodeScoping: true,
      pii: !!options.pii,
    },
    capabilities: {
      soft_delete: true,
      audit: true,
      expressions: storeType === 'transaction',
      pii: !!options.pii,
    },
    settings: {
      display_name: displayName,
      icon: options.icon ?? (storeType === 'transaction' ? 'file-text' : 'box'),
      description: options.description ?? `${displayName} schema for Purchase Order DMS configuration.`,
      color: options.color ?? (storeType === 'transaction' ? '#2563EB' : '#0F766E'),
    },
    retention: options.retention ?? { retention_days: storeType === 'transaction' ? 3650 : 0, purge_policy: 'archive' },
  }
  return { key, displayName, payload }
}

const schemas = [
  entity('currency', 'Currency', 'master', [
    str('currency_code', true, { unique: true }), str('currency_name', true), str('symbol'),
    int('decimal_places', true), dec('rounding_precision'), bool('is_base_currency'), bool('is_active', true),
  ], { prefix: 'CUR', icon: 'circle-dollar-sign' }),
  entity('organisation', 'Organisation', 'master', [
    str('organisation_code', true, { unique: true }), str('organisation_name', true, { indexed: true }), str('legal_name', true),
    str('pan'), str('gstin'), str('cin'), text('address', true), str('city', true), str('state', true),
    str('country', true), str('pincode', true), phone('phone'), email('email'), ref('base_currency', 'currency', true),
    bool('is_active', true),
  ], { prefix: 'ORG', icon: 'building-2' }),
  entity('branch', 'Branch', 'master', [
    str('branch_code', true, { unique: true }), str('branch_name', true, { indexed: true }), ref('organisation', 'organisation', true),
    en('branch_type', ['showroom', 'workshop', 'parts', 'warehouse', 'head_office']), text('address', true),
    str('city', true), str('state', true), str('country', true), str('pincode', true), str('gstin'), phone('phone'),
    email('email'), ref('warehouse', 'warehouse'), bool('is_active', true),
  ], { prefix: 'BR', icon: 'git-branch' }),
  entity('department', 'Department', 'master', [
    str('department_code', true, { unique: true }), str('department_name', true, { indexed: true }), ref('branch', 'branch'),
    ref('manager', 'employee'), ref('cost_center', 'cost_center'), bool('is_active', true),
  ], { prefix: 'DEPT', icon: 'users' }),
  entity('cost_center', 'Cost Center', 'master', [
    str('cost_center_code', true, { unique: true }), str('cost_center_name', true, { indexed: true }),
    ref('organisation', 'organisation', true), ref('branch', 'branch'), ref('department', 'department'),
    date('effective_from', true), date('effective_to'), bool('is_active', true),
  ], { prefix: 'CC', icon: 'landmark' }),
  entity('project', 'Project', 'master', [
    str('project_code', true, { unique: true }), str('project_name', true, { indexed: true }), ref('organisation', 'organisation', true),
    ref('branch', 'branch'), ref('department', 'department'), date('start_date'), date('end_date'), dec('budget_amount'),
    en('status', ['planned', 'active', 'on_hold', 'completed', 'cancelled'], true), bool('is_active', true),
  ], { prefix: 'PRJ', icon: 'folder-kanban' }),
  entity('employee', 'Employee / Buyer', 'master', [
    str('employee_code', true, { unique: true }), str('first_name', true), str('last_name'), str('display_name', true, { indexed: true }),
    email('email', true, { unique: true, piiCategory: 'direct' }), phone('phone', false, { piiCategory: 'direct' }),
    ref('branch', 'branch', true), ref('department', 'department'), str('designation'),
    en('buyer_role', ['buyer', 'procurement_executive', 'procurement_manager', 'store_user', 'finance_user']),
    dec('approval_limit'), date('joining_date'), bool('is_active', true),
  ], { prefix: 'EMP', icon: 'user', pii: true }),
  entity('payment_term', 'Payment Term', 'master', [
    str('term_code', true, { unique: true }), str('term_name', true), int('credit_days', true),
    int('discount_days'), dec('discount_percent'), text('description'), bool('is_active', true),
  ], { prefix: 'PAY', icon: 'calendar-days' }),
  entity('supplier', 'Supplier', 'master', [
    str('supplier_code', true, { unique: true }), str('supplier_name', true, { indexed: true }),
    en('supplier_type', ['oem', 'parts_distributor', 'service_provider', 'logistics', 'other'], true),
    str('contact_name'), phone('phone', true, { piiCategory: 'direct' }), email('email', false, { piiCategory: 'direct' }),
    str('gstin'), str('pan'), text('address', true), str('city', true), str('state', true), str('country', true),
    str('pincode', true), ref('payment_term', 'payment_term'), ref('currency', 'currency'), dec('credit_limit'),
    int('lead_time_days'), bool('msme_flag'), bool('blacklisted', true), bool('is_active', true),
  ], { prefix: 'SUP', icon: 'factory', pii: true }),
  entity('unit_of_measure', 'Unit of Measure', 'master', [
    str('uom_code', true, { unique: true }), str('uom_name', true),
    en('uom_category', ['quantity', 'weight', 'volume', 'length', 'time', 'service']),
    int('decimal_places', true), dec('rounding_precision'), bool('is_base_uom'), bool('is_active', true),
  ], { prefix: 'UOM', icon: 'ruler' }),
  entity('tax_configuration', 'Tax Configuration', 'master', [
    str('tax_code', true, { unique: true }), str('tax_name', true), en('tax_type', ['gst', 'igst', 'exempt', 'zero_rated'], true),
    str('tax_region'), en('place_of_supply_rule', ['branch_state', 'supplier_state', 'ship_to_state', 'manual']),
    dec('cgst_rate'), dec('sgst_rate'), dec('igst_rate'), dec('cess_rate'), date('effective_from', true),
    date('effective_to'), bool('is_recoverable'), bool('is_active', true),
  ], { prefix: 'TAX', icon: 'percent' }),
  entity('product_item', 'Product / Item', 'master', [
    str('item_code', true, { unique: true }), str('item_name', true, { indexed: true }),
    en('item_type', ['vehicle_part', 'accessory', 'consumable', 'service', 'asset'], true),
    str('category'), str('brand'), str('model_family'), str('part_number', false, { indexed: true }), text('description'),
    str('hsn_sac', true), ref('default_uom', 'unit_of_measure', true), ref('tax_classification', 'product_tax_classification'),
    dec('standard_cost'), dec('last_purchase_rate'), dec('mrp'), dec('reorder_level'), dec('min_order_qty'),
    dec('max_order_qty'), bool('is_stock_item', true), bool('is_service_item', true), bool('is_active', true),
  ], { prefix: 'ITM', icon: 'package' }),
  entity('product_uom_mapping', 'Product UOM Mapping', 'master', [
    ref('product_item', 'product_item', true), ref('uom', 'unit_of_measure', true), dec('conversion_factor', true),
    bool('is_purchase_uom', true), bool('is_default_purchase_uom'), dec('min_qty'), dec('max_qty'), bool('is_active', true),
  ], { prefix: 'PUM', icon: 'scale' }),
  entity('supplier_product_mapping', 'Supplier Product Mapping', 'master', [
    ref('supplier', 'supplier', true), ref('product_item', 'product_item', true), ref('uom', 'unit_of_measure', true),
    str('supplier_part_number'), date('approved_from', true), date('approved_to'), int('lead_time_days'),
    dec('minimum_order_qty'), dec('maximum_order_qty'), dec('last_purchase_rate'), ref('currency', 'currency'),
    bool('is_preferred_supplier'), bool('is_active', true),
  ], { prefix: 'SPM', icon: 'link' }),
  entity('warehouse', 'Warehouse / Delivery Location', 'master', [
    str('warehouse_code', true, { unique: true }), str('warehouse_name', true, { indexed: true }), ref('branch', 'branch', true),
    en('warehouse_type', ['parts_store', 'showroom', 'yard', 'transit', 'scrap']), text('address', true),
    str('city', true), str('state', true), str('pincode', true), str('contact_person'), phone('phone'),
    dec('capacity'), bool('is_active', true),
  ], { prefix: 'WH', icon: 'warehouse' }),
  entity('product_reorder_limit', 'Product Reorder Limit', 'master', [
    ref('product_item', 'product_item', true), ref('branch', 'branch'), ref('warehouse', 'warehouse'), ref('supplier', 'supplier'),
    ref('uom', 'unit_of_measure', true), dec('minimum_reorder_qty', true), dec('maximum_reorder_qty', true),
    dec('reorder_level'), dec('economic_order_qty'), date('effective_from', true), date('effective_to'), bool('is_active', true),
  ], { prefix: 'PRL', icon: 'repeat' }),
  entity('product_tax_classification', 'Product Tax Classification', 'master', [
    ref('product_item', 'product_item', true), str('hsn_sac', true), ref('tax_configuration', 'tax_configuration', true),
    en('taxable_category', ['taxable', 'exempt', 'zero_rated', 'nil_rated'], true), date('effective_from', true),
    date('effective_to'), bool('is_active', true),
  ], { prefix: 'PTC', icon: 'badge-percent' }),
  entity('exchange_rate', 'Exchange Rate', 'master', [
    ref('from_currency', 'currency', true), ref('to_currency', 'currency', true), dec('rate', true),
    date('effective_date', true), str('rate_source'), bool('is_active', true),
  ], { prefix: 'FX', icon: 'refresh-cw' }),
  entity('delivery_term', 'Delivery Term', 'master', [
    str('term_code', true, { unique: true }), str('term_name', true), str('incoterm_code'),
    en('responsibility', ['supplier', 'dealer', 'shared', 'third_party']), text('description'), bool('is_active', true),
  ], { prefix: 'DEL', icon: 'truck' }),
  entity('transporter', 'Transporter', 'master', [
    str('transporter_code', true, { unique: true }), str('transporter_name', true, { indexed: true }),
    str('contact_name'), phone('phone', true, { piiCategory: 'direct' }), email('email'), str('gstin'),
    str('vehicle_type_supported'), text('address'), bool('is_active', true),
  ], { prefix: 'TRN', icon: 'truck', pii: true }),
  entity('insurance_provider', 'Insurance Provider', 'master', [
    str('provider_code', true, { unique: true }), str('provider_name', true, { indexed: true }), str('contact_name'),
    phone('phone'), email('email'), str('license_number'), text('address'), str('city'), str('state'),
    str('pincode'), bool('is_active', true),
  ], { prefix: 'INS', icon: 'shield' }),
  entity('charge_master', 'Charge Master', 'master', [
    str('charge_code', true, { unique: true }), str('charge_name', true),
    en('charge_level', ['header', 'line', 'both'], true), en('charge_type', ['freight', 'packing', 'handling', 'insurance', 'other'], true),
    en('calculation_basis', ['flat', 'percentage', 'quantity', 'value'], true), dec('default_value'),
    bool('taxable_flag'), bool('editable_flag'), int('sequence_no', true), bool('is_active', true),
  ], { prefix: 'CHG', icon: 'receipt' }),
  entity('charge_rule', 'Charge Rule', 'master', [
    ref('charge_master', 'charge_master', true), en('applies_to', ['purchase_order', 'purchase_order_line'], true),
    ref('supplier', 'supplier'), ref('product_item', 'product_item'), ref('branch', 'branch'), ref('currency', 'currency'),
    dec('minimum_amount'), dec('maximum_amount'), dec('calculation_value', true), date('effective_from', true),
    date('effective_to'), bool('is_auto_apply', true), bool('is_active', true),
  ], { prefix: 'CHR', icon: 'settings-2' }),
  entity('financial_year', 'Financial Year', 'master', [
    str('year_code', true, { unique: true }), ref('organisation', 'organisation', true), date('start_date', true),
    date('end_date', true), en('status', ['open', 'closed', 'locked'], true), bool('is_current'), bool('is_active', true),
  ], { prefix: 'FY', icon: 'calendar-range' }),
  entity('financial_period', 'Financial Period', 'master', [
    str('period_code', true, { unique: true }), ref('financial_year', 'financial_year', true), str('period_name', true),
    date('start_date', true), date('end_date', true), en('period_status', ['open', 'closed', 'locked'], true),
    bool('allow_back_date'), bool('allow_future_date'), bool('is_active', true),
  ], { prefix: 'FP', icon: 'calendar' }),
  entity('document_number_template', 'Document Number Template', 'master', [
    en('document_type', ['purchase_order'], true), str('prefix', true), str('separator'), int('current_sequence', true),
    int('padding', true), en('reset_frequency', ['never', 'financial_year', 'calendar_year', 'monthly']),
    ref('branch', 'branch'), ref('financial_year', 'financial_year'), date('effective_from', true), bool('is_active', true),
  ], { prefix: 'DNT', icon: 'hash' }),
  entity('purchase_order_lifecycle_setup', 'Purchase Order Lifecycle Setup', 'master', [
    str('status_code', true, { unique: true }), str('status_name', true),
    en('status_type', ['open', 'expired', 'cancelled', 'closed', 'progress'], true), bool('is_initial'),
    bool('is_terminal'), bool('allow_edit'), bool('allow_cancel'), bool('allow_manual_close'),
    bool('allow_receipt'), bool('allow_invoice'), int('sort_order', true), bool('is_active', true),
  ], { prefix: 'POLS', icon: 'workflow' }),
  entity('picklist_value', 'Picklist Value', 'master', [
    str('picklist_key', true, { indexed: true }), str('value_code', true, { indexed: true }), str('value_label', true),
    int('sort_order'), str('parent_value'), text('description'), bool('is_active', true),
  ], { prefix: 'PL', icon: 'list' }),
  entity('default_data_template', 'Default Data Template', 'master', [
    str('template_code', true, { unique: true }), str('template_name', true), en('document_type', ['purchase_order'], true),
    ref('branch', 'branch'), str('role'), ref('supplier', 'supplier'), ref('default_currency', 'currency'),
    ref('default_payment_term', 'payment_term'), ref('default_delivery_term', 'delivery_term'),
    ref('default_warehouse', 'warehouse'), str('default_priority'), bool('is_active', true),
  ], { prefix: 'DDT', icon: 'file-cog' }),
  entity('purchase_order', 'Purchase Order', 'transaction', [
    str('po_number', true, { unique: true, readOnly: true }), date('document_date', true, { readOnly: true }),
    en('status', ['open', 'expired', 'cancelled', 'closed'], true, { readOnly: true }), ref('organisation', 'organisation', true, { readOnly: true }),
    ref('branch', 'branch', true, { readOnly: true }), ref('buyer', 'employee', true, { readOnly: true }),
    en('creation_mode', ['direct', 'purchase_requisition'], true, { readOnly: true }), ref('supplier', 'supplier', true),
    str('supplier_code', true, { readOnly: true }), str('supplier_name', true, { readOnly: true }), str('supplier_contact_name', false, { readOnly: true }),
    phone('supplier_contact_number', false, { readOnly: true, piiCategory: 'direct' }), email('supplier_email', false, { readOnly: true, piiCategory: 'direct' }),
    str('supplier_gstin', false, { readOnly: true }), text('supplier_address', false, { readOnly: true }), ref('department', 'department'),
    ref('cost_center', 'cost_center'), ref('project', 'project'), str('priority'), ref('currency', 'currency', true),
    dec('exchange_rate'), ref('payment_term', 'payment_term'), str('payment_mode'), str('payment_method'), date('valid_till_date'),
    date('requirement_date'), ref('delivery_location', 'warehouse'), ref('ship_to_branch', 'branch'), date('expected_delivery_date'),
    ref('delivery_term', 'delivery_term'), str('shipping_method'), text('shipping_instruction'), ref('transporter', 'transporter'),
    ref('insurance_provider', 'insurance_provider'), str('insurance_contact_name'), phone('insurance_contact_number'),
    str('insurance_policy_number'), text('insurance_address'), str('quotation_reference_no'), text('source_pr_summary'),
    int('source_count'), str('place_of_supply'), dec('subtotal_amount', true, { readOnly: true }), dec('total_discount', false, { readOnly: true }),
    dec('total_header_charges', false, { readOnly: true }), dec('total_line_charges', false, { readOnly: true }),
    dec('total_charges', false, { readOnly: true }), dec('taxable_amount', true, { readOnly: true }), dec('total_tax', false, { readOnly: true }),
    dec('rounding_adjustment'), dec('grand_total', true, { readOnly: true }), dec('base_currency_amount', false, { readOnly: true }),
    dec('total_ordered_qty', true, { readOnly: true }), dec('total_cancelled_qty', true, { readOnly: true }),
    dec('total_received_qty', true, { readOnly: true }), dec('total_pending_receipt_qty', true, { readOnly: true }),
    dec('total_invoiced_qty', true, { readOnly: true }), dec('total_pending_invoice_qty', true, { readOnly: true }),
    en('receipt_progress_status', ['not_received', 'partially_received', 'fully_received', 'closed_for_receipt'], true, { readOnly: true }),
    en('invoice_progress_status', ['not_invoiced', 'partially_invoiced', 'fully_invoiced', 'closed_for_invoice'], true, { readOnly: true }),
    text('cancel_reason'), text('close_reason'), text('remarks'), int('version_no', true, { readOnly: true }), dt('last_calculated_at', false, { readOnly: true }),
  ], {
    prefix: 'PO',
    icon: 'file-text',
    pii: true,
    relationships: [{ id: 'purchase_order_lines', key: 'purchase_order_lines', type: 'has_many', targetEntity: 'purchase_order_line', target_type: 'purchase_order_line', foreignKey: 'purchase_order', foreign_key: 'purchase_order', label: 'Purchase Order Lines' }],
    indexes: [{ id: 'idx_po_status_date', name: 'idx_po_status_date', fields: ['status', 'document_date'], columns: [{ field: 'status', sort: 'asc' }, { field: 'document_date', sort: 'desc' }], unique: false }],
  }),
  entity('purchase_order_line', 'Purchase Order Line', 'transaction', [
    ref('purchase_order', 'purchase_order', true), int('line_number', true),
    en('line_status', ['open', 'partially_received', 'fully_received', 'partially_invoiced', 'fully_invoiced', 'cancelled', 'closed', 'expired'], true, { readOnly: true }),
    en('line_origin', ['manual', 'purchase_requisition'], true, { readOnly: true }), ref('product_item', 'product_item', true),
    str('product_code', true, { readOnly: true }), str('product_name', true, { readOnly: true }), text('description', false, { readOnly: true }),
    str('hsn_sac', false, { readOnly: true }), ref('uom', 'unit_of_measure', true), str('line_priority'), date('line_requirement_date'),
    str('source_pr_number'), str('source_pr_line_ref'), dec('requested_qty'), dec('available_qty'), dec('order_qty', true),
    dec('purchase_rate', true), dec('gross_amount', true, { readOnly: true }), dec('discount_percent'), dec('discount_amount'),
    dec('taxable_amount', true, { readOnly: true }), str('tax_code'), dec('cgst_rate'), dec('sgst_rate'), dec('igst_rate'), dec('cess_rate'),
    dec('cgst_amount', false, { readOnly: true }), dec('sgst_amount', false, { readOnly: true }), dec('igst_amount', false, { readOnly: true }),
    dec('cess_amount', false, { readOnly: true }), dec('line_charge_amount'), dec('line_amount', true, { readOnly: true }),
    dec('cancel_qty'), str('cancel_reason'), text('cancel_remark'), dec('received_qty', true, { readOnly: true }),
    dec('pending_receipt_qty', true, { readOnly: true }), dec('invoiced_qty', true, { readOnly: true }),
    dec('pending_invoice_qty', true, { readOnly: true }), dec('receipt_supplier_invoice_qty', false, { readOnly: true }),
    dec('receipt_damage_qty', false, { readOnly: true }), dec('receipt_shortage_qty', false, { readOnly: true }),
    dec('receipt_excess_qty', false, { readOnly: true }), dec('inspection_hold_qty', false, { readOnly: true }),
    dec('inspection_rejected_qty', false, { readOnly: true }), dec('inspection_pending_qty', false, { readOnly: true }),
    dec('already_returned_qty', false, { readOnly: true }), ref('line_ship_to_branch', 'branch'), text('line_remarks'),
    int('version_no', true, { readOnly: true }),
  ], {
    prefix: 'POL',
    icon: 'list',
    indexes: [{ id: 'uk_po_line_number', name: 'uk_po_line_number', fields: ['purchase_order', 'line_number'], columns: [{ field: 'purchase_order', sort: 'asc' }, { field: 'line_number', sort: 'asc' }], unique: true }],
  }),
]

async function request(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`)
  }
  return res.json()
}

async function publishSchema(schema) {
  const created = await request('POST', '/artifacts', {
    artifact_name: schema.key,
    artifact_type: 'entity_schema',
    payload: schema.payload,
  })
  const versionId = created.version_id ?? created.id
  await request('POST', `/artifacts/${versionId}/publish`)
  return versionId
}

async function verify() {
  const expected = new Set(schemas.map(s => s.key))
  const response = await request('GET', '/studio/entities')
  const active = new Set((response.items ?? []).map(item => item.entity_type))
  const missing = [...expected].filter(key => !active.has(key))
  if (missing.length > 0) {
    throw new Error(`Missing active compiled schemas: ${missing.join(', ')}`)
  }

  for (const key of ['purchase_order', 'purchase_order_line']) {
    const fields = await request('GET', `/studio/entities/${key}/fields`)
    if (!Array.isArray(fields.items) || fields.items.length === 0) {
      throw new Error(`${key} returned no fields`)
    }
  }
}

async function main() {
  console.log(`Seeding ${schemas.length} Purchase Order DMS entity schemas into ${API_URL}`)
  for (const schema of schemas) {
    const versionId = await publishSchema(schema)
    console.log(`published ${schema.key} (${schema.displayName}) version ${versionId}`)
  }
  await verify()
  console.log(`Verified ${schemas.length} active compiled schemas.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
