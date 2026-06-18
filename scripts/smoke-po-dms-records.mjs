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

async function post(entityType, payload) {
  const res = await fetch(`${API_URL}/entities/${entityType}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ payload, status: 'ACTIVE' }),
  })
  if (!res.ok) throw new Error(`POST ${entityType} failed: ${res.status} ${await res.text()}`)
  const record = await res.json()
  console.log(`created ${entityType} ${record.id}`)
  return record
}

async function main() {
  const currency = await post('currency', {
    currency_code: 'INR', currency_name: 'Indian Rupee', symbol: '₹', decimal_places: 2,
    rounding_precision: 0.01, is_base_currency: true, is_active: true,
  })
  const organisation = await post('organisation', {
    organisation_code: 'EXDMS', organisation_name: 'Excellon Auto DMS', legal_name: 'Excellon Auto DMS Pvt Ltd',
    address: 'Corporate Office', city: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411001',
    base_currency: currency.id, is_active: true,
  })
  const branch = await post('branch', {
    branch_code: 'PUN-PARTS', branch_name: 'Pune Parts Branch', organisation: organisation.id,
    address: 'Parts Division', city: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411001',
    is_active: true,
  })
  const employee = await post('employee', {
    employee_code: 'BUY001', first_name: 'Procurement', display_name: 'Procurement Buyer',
    email: 'buyer@example.com', branch: branch.id, buyer_role: 'buyer', is_active: true,
  })
  const paymentTerm = await post('payment_term', {
    term_code: 'NET30', term_name: 'Net 30', credit_days: 30, is_active: true,
  })
  const supplier = await post('supplier', {
    supplier_code: 'SUP001', supplier_name: 'OEM Parts Supplier', supplier_type: 'parts_distributor',
    phone: '9999999999', address: 'Supplier Industrial Area', city: 'Pune', state: 'Maharashtra',
    country: 'India', pincode: '411001', payment_term: paymentTerm.id, currency: currency.id,
    blacklisted: false, is_active: true,
  })
  const uom = await post('unit_of_measure', {
    uom_code: 'PCS', uom_name: 'Pieces', uom_category: 'quantity', decimal_places: 0,
    is_base_uom: true, is_active: true,
  })
  const tax = await post('tax_configuration', {
    tax_code: 'GST18', tax_name: 'GST 18%', tax_type: 'gst', cgst_rate: 9, sgst_rate: 9,
    effective_from: '2026-04-01', is_recoverable: true, is_active: true,
  })
  const product = await post('product_item', {
    item_code: 'BRK-PAD-001', item_name: 'Brake Pad Set', item_type: 'vehicle_part',
    category: 'Brake', brand: 'OEM', part_number: 'BP001', hsn_sac: '87083000',
    default_uom: uom.id, standard_cost: 1200, is_stock_item: true, is_service_item: false, is_active: true,
  })
  await post('supplier_product_mapping', {
    supplier: supplier.id, product_item: product.id, uom: uom.id, approved_from: '2026-04-01',
    lead_time_days: 5, minimum_order_qty: 1, maximum_order_qty: 100, last_purchase_rate: 1200,
    currency: currency.id, is_preferred_supplier: true, is_active: true,
  })
  const po = await post('purchase_order', {
    po_number: 'PO-SMOKE-000001', document_date: '2026-06-18', status: 'open',
    organisation: organisation.id, branch: branch.id, buyer: employee.id, creation_mode: 'direct',
    supplier: supplier.id, supplier_code: 'SUP001', supplier_name: 'OEM Parts Supplier',
    currency: currency.id, exchange_rate: 1, payment_term: paymentTerm.id,
    subtotal_amount: 12000, taxable_amount: 12000, total_tax: 2160, grand_total: 14160,
    total_ordered_qty: 10, total_cancelled_qty: 0, total_received_qty: 0, total_pending_receipt_qty: 10,
    total_invoiced_qty: 0, total_pending_invoice_qty: 10, receipt_progress_status: 'not_received',
    invoice_progress_status: 'not_invoiced', version_no: 1,
  })
  await post('purchase_order_line', {
    purchase_order: po.id, line_number: 1, line_status: 'open', line_origin: 'manual',
    product_item: product.id, product_code: 'BRK-PAD-001', product_name: 'Brake Pad Set',
    hsn_sac: '87083000', uom: uom.id, order_qty: 10, purchase_rate: 1200, gross_amount: 12000,
    taxable_amount: 12000, tax_code: tax.id, cgst_rate: 9, sgst_rate: 9, cgst_amount: 1080,
    sgst_amount: 1080, line_amount: 14160, received_qty: 0, pending_receipt_qty: 10,
    invoiced_qty: 0, pending_invoice_qty: 10, version_no: 1,
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
