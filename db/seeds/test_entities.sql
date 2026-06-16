-- db/seeds/test_entities.sql
-- Automotive Dealer Management System (DMS) — entity seed data
-- Inserts 12 DMS entity schemas into artifact_header, artifact_version, and compiled_artifact.
--
-- Tenant ID:  00000000-0000-0000-0000-000000000001
-- User ID:    00000000-0000-0000-0000-000000000001
--
-- Deterministic artifact_header UUIDs: 00000000-0000-0000-0003-0000000000XX
-- Deterministic artifact_version UUIDs: 00000000-0000-0000-0006-0000000000XX

BEGIN;

-- ============================================================================
-- 1. artifact_header rows (one per entity)
-- ============================================================================

INSERT INTO artifact_header
    (artifact_id, artifact_name, artifact_type, tenant_id, created_by, revision)
VALUES
    ('00000000-0000-0000-0003-000000000001', 'entity_schema.vehicle',         'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000002', 'entity_schema.customer',        'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000003', 'entity_schema.supplier',        'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000004', 'entity_schema.parts',           'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000005', 'entity_schema.employee',        'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000006', 'entity_schema.technician',      'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000007', 'entity_schema.finance_company', 'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000008', 'entity_schema.part_category',   'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000009', 'entity_schema.sale_order',      'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000010', 'entity_schema.service_order',   'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000011', 'entity_schema.purchase_order',  'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
    ('00000000-0000-0000-0003-000000000012', 'entity_schema.parts_request',   'entity_schema', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. artifact_version rows (one per entity, published and active)
-- ============================================================================

INSERT INTO artifact_version
    (version_id, artifact_id, version_no, payload, is_active, is_draft, created_by, published_at, published_by, revision)
VALUES
-- vehicle
(
    '00000000-0000-0000-0006-000000000001',
    '00000000-0000-0000-0003-000000000001',
    1,
    '{
        "entity_key": "vehicle",
        "entity_label": "Vehicle",
        "fields": [
            {"key": "stock_no",   "label": "Stock No",    "type": "string",  "required": true},
            {"key": "vin",        "label": "VIN",         "type": "string",  "required": true},
            {"key": "make",       "label": "Make",        "type": "string",  "required": false},
            {"key": "model",      "label": "Model",       "type": "string",  "required": false},
            {"key": "year",       "label": "Year",        "type": "integer", "required": false},
            {"key": "colour",     "label": "Colour",      "type": "string",  "required": false},
            {"key": "status",     "label": "Status",      "type": "enum",    "required": false, "options": ["available","sold","in_service"]},
            {"key": "list_price", "label": "List Price",  "type": "decimal", "required": false},
            {"key": "cost",       "label": "Cost",        "type": "decimal", "required": false},
            {"key": "mileage",    "label": "Mileage",     "type": "integer", "required": false},
            {"key": "fuel_type",  "label": "Fuel Type",   "type": "enum",    "required": false, "options": ["petrol","diesel","electric","hybrid"]}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- customer
(
    '00000000-0000-0000-0006-000000000002',
    '00000000-0000-0000-0003-000000000002',
    1,
    '{
        "entity_key": "customer",
        "entity_label": "Customer",
        "fields": [
            {"key": "code",          "label": "Code",          "type": "string",  "required": true},
            {"key": "name",          "label": "Name",          "type": "string",  "required": true},
            {"key": "customer_type", "label": "Customer Type", "type": "enum",    "required": false, "options": ["individual","corporate"]},
            {"key": "phone",         "label": "Phone",         "type": "string",  "required": false},
            {"key": "email",         "label": "Email",         "type": "string",  "required": false},
            {"key": "address",       "label": "Address",       "type": "string",  "required": false},
            {"key": "city",          "label": "City",          "type": "string",  "required": false},
            {"key": "credit_limit",  "label": "Credit Limit",  "type": "decimal", "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- supplier
(
    '00000000-0000-0000-0006-000000000003',
    '00000000-0000-0000-0003-000000000003',
    1,
    '{
        "entity_key": "supplier",
        "entity_label": "Supplier",
        "fields": [
            {"key": "code",          "label": "Code",          "type": "string",  "required": true},
            {"key": "name",          "label": "Name",          "type": "string",  "required": true},
            {"key": "contact_name",  "label": "Contact Name",  "type": "string",  "required": false},
            {"key": "phone",         "label": "Phone",         "type": "string",  "required": false},
            {"key": "email",         "label": "Email",         "type": "string",  "required": false},
            {"key": "payment_terms", "label": "Payment Terms", "type": "integer", "required": false},
            {"key": "lead_days",     "label": "Lead Days",     "type": "integer", "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- parts
(
    '00000000-0000-0000-0006-000000000004',
    '00000000-0000-0000-0003-000000000004',
    1,
    '{
        "entity_key": "parts",
        "entity_label": "Parts",
        "fields": [
            {"key": "part_no",       "label": "Part No",       "type": "string",  "required": true},
            {"key": "description",   "label": "Description",   "type": "string",  "required": true},
            {"key": "category",      "label": "Category",      "type": "string",  "required": false},
            {"key": "qty_on_hand",   "label": "Qty on Hand",   "type": "integer", "required": false},
            {"key": "reorder_level", "label": "Reorder Level", "type": "integer", "required": false},
            {"key": "cost_price",    "label": "Cost Price",    "type": "decimal", "required": false},
            {"key": "list_price",    "label": "List Price",    "type": "decimal", "required": false},
            {"key": "bin_location",  "label": "Bin Location",  "type": "string",  "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- employee
(
    '00000000-0000-0000-0006-000000000005',
    '00000000-0000-0000-0003-000000000005',
    1,
    '{
        "entity_key": "employee",
        "entity_label": "Employee",
        "fields": [
            {"key": "emp_no",          "label": "Emp No",          "type": "string",  "required": true},
            {"key": "name",            "label": "Name",            "type": "string",  "required": true},
            {"key": "department",      "label": "Department",      "type": "enum",    "required": false, "options": ["sales","service","parts","admin"]},
            {"key": "hire_date",       "label": "Hire Date",       "type": "date",    "required": false},
            {"key": "commission_rate", "label": "Commission Rate", "type": "decimal", "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- technician
(
    '00000000-0000-0000-0006-000000000006',
    '00000000-0000-0000-0003-000000000006',
    1,
    '{
        "entity_key": "technician",
        "entity_label": "Technician",
        "fields": [
            {"key": "tech_no",        "label": "Tech No",       "type": "string",  "required": true},
            {"key": "name",           "label": "Name",          "type": "string",  "required": true},
            {"key": "specialization", "label": "Specialization","type": "enum",    "required": false, "options": ["mechanical","electrical","body"]},
            {"key": "hourly_rate",    "label": "Hourly Rate",   "type": "decimal", "required": false},
            {"key": "is_active",      "label": "Is Active",     "type": "boolean", "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- finance_company
(
    '00000000-0000-0000-0006-000000000007',
    '00000000-0000-0000-0003-000000000007',
    1,
    '{
        "entity_key": "finance_company",
        "entity_label": "Finance Company",
        "fields": [
            {"key": "company_code",    "label": "Company Code",    "type": "string",  "required": true},
            {"key": "name",            "label": "Name",            "type": "string",  "required": true},
            {"key": "base_rate",       "label": "Base Rate",       "type": "decimal", "required": false},
            {"key": "max_term_months", "label": "Max Term (Months)","type": "integer","required": false},
            {"key": "contact",         "label": "Contact",         "type": "string",  "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- part_category
(
    '00000000-0000-0000-0006-000000000008',
    '00000000-0000-0000-0003-000000000008',
    1,
    '{
        "entity_key": "part_category",
        "entity_label": "Part Category",
        "fields": [
            {"key": "code",        "label": "Code",        "type": "string", "required": true},
            {"key": "name",        "label": "Name",        "type": "string", "required": true},
            {"key": "parent_code", "label": "Parent Code", "type": "string", "required": false},
            {"key": "description", "label": "Description", "type": "string", "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- sale_order
(
    '00000000-0000-0000-0006-000000000009',
    '00000000-0000-0000-0003-000000000009',
    1,
    '{
        "entity_key": "sale_order",
        "entity_label": "Sale Order",
        "fields": [
            {"key": "order_no",            "label": "Order No",           "type": "string",  "required": true},
            {"key": "customer_code",       "label": "Customer Code",      "type": "string",  "required": true},
            {"key": "vehicle_vin",         "label": "Vehicle VIN",        "type": "string",  "required": true},
            {"key": "salesperson_no",      "label": "Salesperson No",     "type": "string",  "required": false},
            {"key": "sale_price",          "label": "Sale Price",         "type": "decimal", "required": false},
            {"key": "trade_in_value",      "label": "Trade-In Value",     "type": "decimal", "required": false},
            {"key": "finance_company_code","label": "Finance Company",    "type": "string",  "required": false},
            {"key": "deposit",             "label": "Deposit",            "type": "decimal", "required": false},
            {"key": "status",              "label": "Status",             "type": "enum",    "required": false, "options": ["draft","approved","delivered","cancelled"]},
            {"key": "delivery_date",       "label": "Delivery Date",      "type": "date",    "required": false}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- service_order
(
    '00000000-0000-0000-0006-000000000010',
    '00000000-0000-0000-0003-000000000010',
    1,
    '{
        "entity_key": "service_order",
        "entity_label": "Service Order",
        "fields": [
            {"key": "ro_no",          "label": "RO No",          "type": "string",  "required": true},
            {"key": "customer_code",  "label": "Customer Code",  "type": "string",  "required": true},
            {"key": "vehicle_vin",    "label": "Vehicle VIN",    "type": "string",  "required": true},
            {"key": "technician_no",  "label": "Technician No",  "type": "string",  "required": false},
            {"key": "complaint",      "label": "Complaint",      "type": "string",  "required": false},
            {"key": "diagnosis",      "label": "Diagnosis",      "type": "string",  "required": false},
            {"key": "total_labour",   "label": "Total Labour",   "type": "decimal", "required": false},
            {"key": "total_parts",    "label": "Total Parts",    "type": "decimal", "required": false},
            {"key": "total_amount",   "label": "Total Amount",   "type": "decimal", "required": false},
            {"key": "status",         "label": "Status",         "type": "enum",    "required": false, "options": ["open","in_progress","completed","invoiced"]}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- purchase_order
(
    '00000000-0000-0000-0006-000000000011',
    '00000000-0000-0000-0003-000000000011',
    1,
    '{
        "entity_key": "purchase_order",
        "entity_label": "Purchase Order",
        "fields": [
            {"key": "po_no",             "label": "PO No",            "type": "string",  "required": true},
            {"key": "supplier_code",     "label": "Supplier Code",    "type": "string",  "required": true},
            {"key": "po_date",           "label": "PO Date",          "type": "date",    "required": false},
            {"key": "expected_delivery", "label": "Expected Delivery","type": "date",    "required": false},
            {"key": "total_amount",      "label": "Total Amount",     "type": "decimal", "required": false},
            {"key": "status",            "label": "Status",           "type": "enum",    "required": false, "options": ["draft","submitted","received","cancelled"]}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
),
-- parts_request
(
    '00000000-0000-0000-0006-000000000012',
    '00000000-0000-0000-0003-000000000012',
    1,
    '{
        "entity_key": "parts_request",
        "entity_label": "Parts Request",
        "fields": [
            {"key": "pr_no",            "label": "PR No",           "type": "string",  "required": true},
            {"key": "service_order_no", "label": "Service Order No","type": "string",  "required": true},
            {"key": "part_no",          "label": "Part No",         "type": "string",  "required": true},
            {"key": "qty_requested",    "label": "Qty Requested",   "type": "integer", "required": false},
            {"key": "qty_issued",       "label": "Qty Issued",      "type": "integer", "required": false},
            {"key": "status",           "label": "Status",          "type": "enum",    "required": false, "options": ["pending","partial","fulfilled"]}
        ],
        "relationships": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001', 1
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. compiled_artifact rows (one per entity)
-- ============================================================================

INSERT INTO compiled_artifact
    (artifact_key, artifact_type, tenant_id, payload, status, content_hash)
VALUES
-- vehicle
(
    'vehicle', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "stock_no",   "label": "Stock No",    "compiled_type": "string",  "required": true},
            {"key": "vin",        "label": "VIN",         "compiled_type": "string",  "required": true},
            {"key": "make",       "label": "Make",        "compiled_type": "string",  "required": false},
            {"key": "model",      "label": "Model",       "compiled_type": "string",  "required": false},
            {"key": "year",       "label": "Year",        "compiled_type": "integer", "required": false},
            {"key": "colour",     "label": "Colour",      "compiled_type": "string",  "required": false},
            {"key": "status",     "label": "Status",      "compiled_type": "enum",    "required": false, "options": ["available","sold","in_service"]},
            {"key": "list_price", "label": "List Price",  "compiled_type": "decimal", "required": false},
            {"key": "cost",       "label": "Cost",        "compiled_type": "decimal", "required": false},
            {"key": "mileage",    "label": "Mileage",     "compiled_type": "integer", "required": false},
            {"key": "fuel_type",  "label": "Fuel Type",   "compiled_type": "enum",    "required": false, "options": ["petrol","diesel","electric","hybrid"]}
        ],
        "relationships": []
    }',
    'active', md5('vehicle:entity_schema:v1')
),
-- customer
(
    'customer', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "code",          "label": "Code",          "compiled_type": "string",  "required": true},
            {"key": "name",          "label": "Name",          "compiled_type": "string",  "required": true},
            {"key": "customer_type", "label": "Customer Type", "compiled_type": "enum",    "required": false, "options": ["individual","corporate"]},
            {"key": "phone",         "label": "Phone",         "compiled_type": "string",  "required": false},
            {"key": "email",         "label": "Email",         "compiled_type": "string",  "required": false},
            {"key": "address",       "label": "Address",       "compiled_type": "string",  "required": false},
            {"key": "city",          "label": "City",          "compiled_type": "string",  "required": false},
            {"key": "credit_limit",  "label": "Credit Limit",  "compiled_type": "decimal", "required": false}
        ],
        "relationships": []
    }',
    'active', md5('customer:entity_schema:v1')
),
-- supplier
(
    'supplier', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "code",          "label": "Code",          "compiled_type": "string",  "required": true},
            {"key": "name",          "label": "Name",          "compiled_type": "string",  "required": true},
            {"key": "contact_name",  "label": "Contact Name",  "compiled_type": "string",  "required": false},
            {"key": "phone",         "label": "Phone",         "compiled_type": "string",  "required": false},
            {"key": "email",         "label": "Email",         "compiled_type": "string",  "required": false},
            {"key": "payment_terms", "label": "Payment Terms", "compiled_type": "integer", "required": false},
            {"key": "lead_days",     "label": "Lead Days",     "compiled_type": "integer", "required": false}
        ],
        "relationships": []
    }',
    'active', md5('supplier:entity_schema:v1')
),
-- parts
(
    'parts', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "part_no",       "label": "Part No",       "compiled_type": "string",  "required": true},
            {"key": "description",   "label": "Description",   "compiled_type": "string",  "required": true},
            {"key": "category",      "label": "Category",      "compiled_type": "string",  "required": false},
            {"key": "qty_on_hand",   "label": "Qty on Hand",   "compiled_type": "integer", "required": false},
            {"key": "reorder_level", "label": "Reorder Level", "compiled_type": "integer", "required": false},
            {"key": "cost_price",    "label": "Cost Price",    "compiled_type": "decimal", "required": false},
            {"key": "list_price",    "label": "List Price",    "compiled_type": "decimal", "required": false},
            {"key": "bin_location",  "label": "Bin Location",  "compiled_type": "string",  "required": false}
        ],
        "relationships": []
    }',
    'active', md5('parts:entity_schema:v1')
),
-- employee
(
    'employee', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "emp_no",          "label": "Emp No",          "compiled_type": "string",  "required": true},
            {"key": "name",            "label": "Name",            "compiled_type": "string",  "required": true},
            {"key": "department",      "label": "Department",      "compiled_type": "enum",    "required": false, "options": ["sales","service","parts","admin"]},
            {"key": "hire_date",       "label": "Hire Date",       "compiled_type": "date",    "required": false},
            {"key": "commission_rate", "label": "Commission Rate", "compiled_type": "decimal", "required": false}
        ],
        "relationships": []
    }',
    'active', md5('employee:entity_schema:v1')
),
-- technician
(
    'technician', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "tech_no",        "label": "Tech No",        "compiled_type": "string",  "required": true},
            {"key": "name",           "label": "Name",           "compiled_type": "string",  "required": true},
            {"key": "specialization", "label": "Specialization", "compiled_type": "enum",    "required": false, "options": ["mechanical","electrical","body"]},
            {"key": "hourly_rate",    "label": "Hourly Rate",    "compiled_type": "decimal", "required": false},
            {"key": "is_active",      "label": "Is Active",      "compiled_type": "boolean", "required": false}
        ],
        "relationships": []
    }',
    'active', md5('technician:entity_schema:v1')
),
-- finance_company
(
    'finance_company', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "company_code",    "label": "Company Code",     "compiled_type": "string",  "required": true},
            {"key": "name",            "label": "Name",             "compiled_type": "string",  "required": true},
            {"key": "base_rate",       "label": "Base Rate",        "compiled_type": "decimal", "required": false},
            {"key": "max_term_months", "label": "Max Term (Months)","compiled_type": "integer", "required": false},
            {"key": "contact",         "label": "Contact",          "compiled_type": "string",  "required": false}
        ],
        "relationships": []
    }',
    'active', md5('finance_company:entity_schema:v1')
),
-- part_category
(
    'part_category', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "code",        "label": "Code",        "compiled_type": "string", "required": true},
            {"key": "name",        "label": "Name",        "compiled_type": "string", "required": true},
            {"key": "parent_code", "label": "Parent Code", "compiled_type": "string", "required": false},
            {"key": "description", "label": "Description", "compiled_type": "string", "required": false}
        ],
        "relationships": []
    }',
    'active', md5('part_category:entity_schema:v1')
),
-- sale_order
(
    'sale_order', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "order_no",            "label": "Order No",           "compiled_type": "string",  "required": true},
            {"key": "customer_code",       "label": "Customer Code",      "compiled_type": "string",  "required": true},
            {"key": "vehicle_vin",         "label": "Vehicle VIN",        "compiled_type": "string",  "required": true},
            {"key": "salesperson_no",      "label": "Salesperson No",     "compiled_type": "string",  "required": false},
            {"key": "sale_price",          "label": "Sale Price",         "compiled_type": "decimal", "required": false},
            {"key": "trade_in_value",      "label": "Trade-In Value",     "compiled_type": "decimal", "required": false},
            {"key": "finance_company_code","label": "Finance Company",    "compiled_type": "string",  "required": false},
            {"key": "deposit",             "label": "Deposit",            "compiled_type": "decimal", "required": false},
            {"key": "status",              "label": "Status",             "compiled_type": "enum",    "required": false, "options": ["draft","approved","delivered","cancelled"]},
            {"key": "delivery_date",       "label": "Delivery Date",      "compiled_type": "date",    "required": false}
        ],
        "relationships": []
    }',
    'active', md5('sale_order:entity_schema:v1')
),
-- service_order
(
    'service_order', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "ro_no",         "label": "RO No",         "compiled_type": "string",  "required": true},
            {"key": "customer_code", "label": "Customer Code", "compiled_type": "string",  "required": true},
            {"key": "vehicle_vin",   "label": "Vehicle VIN",   "compiled_type": "string",  "required": true},
            {"key": "technician_no", "label": "Technician No", "compiled_type": "string",  "required": false},
            {"key": "complaint",     "label": "Complaint",     "compiled_type": "string",  "required": false},
            {"key": "diagnosis",     "label": "Diagnosis",     "compiled_type": "string",  "required": false},
            {"key": "total_labour",  "label": "Total Labour",  "compiled_type": "decimal", "required": false},
            {"key": "total_parts",   "label": "Total Parts",   "compiled_type": "decimal", "required": false},
            {"key": "total_amount",  "label": "Total Amount",  "compiled_type": "decimal", "required": false},
            {"key": "status",        "label": "Status",        "compiled_type": "enum",    "required": false, "options": ["open","in_progress","completed","invoiced"]}
        ],
        "relationships": []
    }',
    'active', md5('service_order:entity_schema:v1')
),
-- purchase_order
(
    'purchase_order', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "po_no",             "label": "PO No",            "compiled_type": "string",  "required": true},
            {"key": "supplier_code",     "label": "Supplier Code",    "compiled_type": "string",  "required": true},
            {"key": "po_date",           "label": "PO Date",          "compiled_type": "date",    "required": false},
            {"key": "expected_delivery", "label": "Expected Delivery","compiled_type": "date",    "required": false},
            {"key": "total_amount",      "label": "Total Amount",     "compiled_type": "decimal", "required": false},
            {"key": "status",            "label": "Status",           "compiled_type": "enum",    "required": false, "options": ["draft","submitted","received","cancelled"]}
        ],
        "relationships": []
    }',
    'active', md5('purchase_order:entity_schema:v1')
),
-- parts_request
(
    'parts_request', 'entity_schema', '00000000-0000-0000-0000-000000000001',
    '{
        "fields": [
            {"key": "pr_no",            "label": "PR No",           "compiled_type": "string",  "required": true},
            {"key": "service_order_no", "label": "Service Order No","compiled_type": "string",  "required": true},
            {"key": "part_no",          "label": "Part No",         "compiled_type": "string",  "required": true},
            {"key": "qty_requested",    "label": "Qty Requested",   "compiled_type": "integer", "required": false},
            {"key": "qty_issued",       "label": "Qty Issued",      "compiled_type": "integer", "required": false},
            {"key": "status",           "label": "Status",          "compiled_type": "enum",    "required": false, "options": ["pending","partial","fulfilled"]}
        ],
        "relationships": []
    }',
    'active', md5('parts_request:entity_schema:v1')
)
ON CONFLICT DO NOTHING;

COMMIT;
