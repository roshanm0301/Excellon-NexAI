-- db/seeds/test_views.sql
-- Automotive Dealer Management System (DMS) — UI view seed data
-- Inserts 14 DMS views into artifact_header + artifact_version.
--
-- Tenant ID:  00000000-0000-0000-0000-000000000001
-- User ID:    00000000-0000-0000-0000-000000000001
--
-- Deterministic artifact_header UUIDs: 00000000-0000-0000-0002-0000000000XX
-- Deterministic artifact_version UUIDs: 00000000-0000-0000-0005-0000000000XX
--
-- NOTE: surface_type 'split_panel' does not exist in the DB constraint.
--       Customer 360 uses 'split_view' (the valid surface type for split layouts).
--       Dashboards require a non-null primary_entity per DB constraint; they use
--       a sentinel value of 'dashboard' since no single entity applies.

BEGIN;

-- ============================================================================
-- 1. artifact_header rows (one per view)
-- ============================================================================

INSERT INTO artifact_header
    (artifact_id, artifact_name, artifact_type, tenant_id, created_by,
     surface_type, primary_entity, view_code, view_label)
VALUES
(
    '00000000-0000-0000-0002-000000000001',
    'ui_view.vehicle.vehicle_master',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'standard_crud', 'vehicle', 'vehicle_master', 'Vehicle Master'
),
(
    '00000000-0000-0000-0002-000000000002',
    'ui_view.customer.customer_master',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'standard_crud', 'customer', 'customer_master', 'Customer Master'
),
(
    '00000000-0000-0000-0002-000000000003',
    'ui_view.supplier.supplier_master',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'standard_crud', 'supplier', 'supplier_master', 'Supplier Master'
),
(
    '00000000-0000-0000-0002-000000000004',
    'ui_view.parts.parts_inventory',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'standard_crud', 'parts', 'parts_inventory', 'Parts Inventory'
),
(
    '00000000-0000-0000-0002-000000000005',
    'ui_view.employee.employee_directory',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'standard_crud', 'employee', 'employee_directory', 'Employee Directory'
),
(
    '00000000-0000-0000-0002-000000000006',
    'ui_view.technician.technician_list',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'standard_crud', 'technician', 'technician_list', 'Technician List'
),
(
    '00000000-0000-0000-0002-000000000007',
    'ui_view.finance_company.finance_company_list',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'standard_crud', 'finance_company', 'finance_company_list', 'Finance Company List'
),
(
    '00000000-0000-0000-0002-000000000008',
    'ui_view.sale_order.sale_order_editor',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'header_line', 'sale_order', 'sale_order_editor', 'Sale Order Editor'
),
(
    '00000000-0000-0000-0002-000000000009',
    'ui_view.service_order.service_order_editor',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'header_line', 'service_order', 'service_order_editor', 'Service Order Editor'
),
(
    '00000000-0000-0000-0002-000000000010',
    'ui_view.purchase_order.purchase_order_editor',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'header_line', 'purchase_order', 'purchase_order_editor', 'Purchase Order Editor'
),
(
    '00000000-0000-0000-0002-000000000011',
    'ui_view.dashboard.sales_dashboard',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'dashboard', 'dashboard', 'sales_dashboard', 'Sales Dashboard'
),
(
    '00000000-0000-0000-0002-000000000012',
    'ui_view.dashboard.service_dashboard',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'dashboard', 'dashboard', 'service_dashboard', 'Service Dashboard'
),
(
    '00000000-0000-0000-0002-000000000013',
    'ui_view.sale_order.new_vehicle_sale_wizard',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'wizard', 'sale_order', 'new_vehicle_sale_wizard', 'New Vehicle Sale Wizard'
),
(
    '00000000-0000-0000-0002-000000000014',
    'ui_view.customer.customer_360',
    'ui_view',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'split_view', 'customer', 'customer_360', 'Customer 360'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. artifact_version rows (one per view, published and active)
-- ============================================================================

INSERT INTO artifact_version
    (version_id, artifact_id, version_no, payload, is_active, is_draft,
     created_by, published_at, published_by)
VALUES

-- --------------------------------------------------------------------------
-- View 1: Vehicle Master (standard_crud)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000001',
    '00000000-0000-0000-0002-000000000001',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "tb1",
                    "component_code": "toolbar",
                    "props": {"position": "top", "align": "space-between"},
                    "children": [
                        {
                            "component_key": "btn_new",
                            "component_code": "button",
                            "props": {"label": "Add Vehicle", "variant": "primary"},
                            "events": [{"event_type": "on_click", "action_type": "navigate", "config": {"target": "/vehicles/new"}}]
                        }
                    ]
                },
                {
                    "component_key": "fp1",
                    "component_code": "filter_panel",
                    "props": {"layout": "inline", "show_apply_button": true},
                    "children": [
                        {"component_key": "f_make",   "component_code": "text_input",     "props": {"label": "Make",   "placeholder": "Filter by make"},  "bindings": {"value": {"field_key": "make",   "entity": "vehicle"}}},
                        {"component_key": "f_model",  "component_code": "text_input",     "props": {"label": "Model",  "placeholder": "Filter by model"}, "bindings": {"value": {"field_key": "model",  "entity": "vehicle"}}},
                        {"component_key": "f_status", "component_code": "dropdown_select","props": {"label": "Status", "options_source": "static", "static_options": ["available","sold","in_service"]}, "bindings": {"value": {"field_key": "status","entity": "vehicle"}}},
                        {"component_key": "f_year",   "component_code": "number_input",   "props": {"label": "Year From", "min": 2000, "max": 2030},       "bindings": {"value": {"field_key": "year",  "entity": "vehicle"}}}
                    ]
                },
                {
                    "component_key": "dt1",
                    "component_code": "data_table",
                    "props": {"columns": ["stock_no","vin","make","model","year","list_price","status"], "sortable": true, "page_size": 25},
                    "bindings": {"data": {"field_key": "*", "entity": "vehicle"}},
                    "events": [{"event_type": "on_row_select", "action_type": "navigate", "config": {"target": "/vehicles/{stock_no}"}}]
                }
            ]
        },
        "data_sources": [{"key": "vehicles", "entity": "vehicle", "type": "list"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 2: Customer Master (standard_crud)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000002',
    '00000000-0000-0000-0002-000000000002',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "tb1",
                    "component_code": "toolbar",
                    "props": {"position": "top", "align": "space-between"},
                    "children": [
                        {
                            "component_key": "btn_new",
                            "component_code": "button",
                            "props": {"label": "Add Customer", "variant": "primary"},
                            "events": [{"event_type": "on_click", "action_type": "navigate", "config": {"target": "/customers/new"}}]
                        }
                    ]
                },
                {
                    "component_key": "fp1",
                    "component_code": "filter_panel",
                    "props": {"layout": "inline", "show_apply_button": true},
                    "children": [
                        {"component_key": "f_code", "component_code": "text_input",     "props": {"label": "Code", "placeholder": "Filter by code"}, "bindings": {"value": {"field_key": "code", "entity": "customer"}}},
                        {"component_key": "f_name", "component_code": "text_input",     "props": {"label": "Name", "placeholder": "Filter by name"}, "bindings": {"value": {"field_key": "name", "entity": "customer"}}},
                        {"component_key": "f_type", "component_code": "dropdown_select","props": {"label": "Type", "options_source": "static", "static_options": ["individual","corporate"]}, "bindings": {"value": {"field_key": "customer_type", "entity": "customer"}}}
                    ]
                },
                {
                    "component_key": "dt1",
                    "component_code": "data_table",
                    "props": {"columns": ["code","name","customer_type","phone","email","credit_limit"], "sortable": true, "page_size": 25},
                    "bindings": {"data": {"field_key": "*", "entity": "customer"}},
                    "events": [{"event_type": "on_row_select", "action_type": "navigate", "config": {"target": "/customers/{code}"}}]
                }
            ]
        },
        "data_sources": [{"key": "customers", "entity": "customer", "type": "list"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 3: Supplier Master (standard_crud)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000003',
    '00000000-0000-0000-0002-000000000003',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "tb1",
                    "component_code": "toolbar",
                    "props": {"position": "top", "align": "space-between"},
                    "children": [
                        {
                            "component_key": "btn_new",
                            "component_code": "button",
                            "props": {"label": "Add Supplier", "variant": "primary"},
                            "events": [{"event_type": "on_click", "action_type": "navigate", "config": {"target": "/suppliers/new"}}]
                        }
                    ]
                },
                {
                    "component_key": "fp1",
                    "component_code": "filter_panel",
                    "props": {"layout": "inline", "show_apply_button": true},
                    "children": [
                        {"component_key": "f_name",          "component_code": "text_input",  "props": {"label": "Name",          "placeholder": "Filter by name"}, "bindings": {"value": {"field_key": "name",          "entity": "supplier"}}},
                        {"component_key": "f_payment_terms", "component_code": "number_input", "props": {"label": "Payment Terms",  "min": 0, "max": 365},           "bindings": {"value": {"field_key": "payment_terms", "entity": "supplier"}}}
                    ]
                },
                {
                    "component_key": "dt1",
                    "component_code": "data_table",
                    "props": {"columns": ["code","name","contact_name","phone","payment_terms"], "sortable": true, "page_size": 25},
                    "bindings": {"data": {"field_key": "*", "entity": "supplier"}},
                    "events": [{"event_type": "on_row_select", "action_type": "navigate", "config": {"target": "/suppliers/{code}"}}]
                }
            ]
        },
        "data_sources": [{"key": "suppliers", "entity": "supplier", "type": "list"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 4: Parts Inventory (standard_crud)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000004',
    '00000000-0000-0000-0002-000000000004',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "tb1",
                    "component_code": "toolbar",
                    "props": {"position": "top", "align": "space-between"},
                    "children": [
                        {
                            "component_key": "btn_new",
                            "component_code": "button",
                            "props": {"label": "Add Part", "variant": "primary"},
                            "events": [{"event_type": "on_click", "action_type": "navigate", "config": {"target": "/parts/new"}}]
                        }
                    ]
                },
                {
                    "component_key": "fp1",
                    "component_code": "filter_panel",
                    "props": {"layout": "inline", "show_apply_button": true},
                    "children": [
                        {"component_key": "f_part_no",      "component_code": "text_input",     "props": {"label": "Part No",     "placeholder": "Filter by part no"},   "bindings": {"value": {"field_key": "part_no",   "entity": "parts"}}},
                        {"component_key": "f_category",     "component_code": "dropdown_select", "props": {"label": "Category",    "options_source": "entity"},            "bindings": {"value": {"field_key": "category",  "entity": "parts"}}},
                        {"component_key": "f_bin_location", "component_code": "text_input",     "props": {"label": "Bin Location","placeholder": "Filter by bin"},       "bindings": {"value": {"field_key": "bin_location","entity": "parts"}}}
                    ]
                },
                {
                    "component_key": "low_stock_badge",
                    "component_code": "badge",
                    "props": {"text": "Low Stock", "variant": "warning"},
                    "visibility": {"condition_type": "expression", "expression": "qty_on_hand <= reorder_level"}
                },
                {
                    "component_key": "dt1",
                    "component_code": "data_table",
                    "props": {"columns": ["part_no","description","qty_on_hand","reorder_level","cost_price","list_price"], "sortable": true, "page_size": 25},
                    "bindings": {"data": {"field_key": "*", "entity": "parts"}},
                    "events": [{"event_type": "on_row_select", "action_type": "navigate", "config": {"target": "/parts/{part_no}"}}]
                }
            ]
        },
        "data_sources": [{"key": "parts", "entity": "parts", "type": "list"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 5: Employee Directory (standard_crud)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000005',
    '00000000-0000-0000-0002-000000000005',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "tb1",
                    "component_code": "toolbar",
                    "props": {"position": "top", "align": "space-between"},
                    "children": [
                        {
                            "component_key": "btn_new",
                            "component_code": "button",
                            "props": {"label": "Add Employee", "variant": "primary"},
                            "events": [{"event_type": "on_click", "action_type": "navigate", "config": {"target": "/employees/new"}}]
                        }
                    ]
                },
                {
                    "component_key": "fp1",
                    "component_code": "filter_panel",
                    "props": {"layout": "inline", "show_apply_button": true},
                    "children": [
                        {"component_key": "f_name",       "component_code": "text_input",     "props": {"label": "Name",       "placeholder": "Filter by name"},                                          "bindings": {"value": {"field_key": "name",       "entity": "employee"}}},
                        {"component_key": "f_department", "component_code": "dropdown_select", "props": {"label": "Department", "options_source": "static", "static_options": ["sales","service","parts","admin"]}, "bindings": {"value": {"field_key": "department", "entity": "employee"}}}
                    ]
                },
                {
                    "component_key": "dt1",
                    "component_code": "data_table",
                    "props": {"columns": ["emp_no","name","department","hire_date","commission_rate"], "sortable": true, "page_size": 25},
                    "bindings": {"data": {"field_key": "*", "entity": "employee"}},
                    "events": [{"event_type": "on_row_select", "action_type": "navigate", "config": {"target": "/employees/{emp_no}"}}]
                }
            ]
        },
        "data_sources": [{"key": "employees", "entity": "employee", "type": "list"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 6: Technician List (standard_crud)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000006',
    '00000000-0000-0000-0002-000000000006',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "tb1",
                    "component_code": "toolbar",
                    "props": {"position": "top", "align": "space-between"},
                    "children": [
                        {
                            "component_key": "btn_new",
                            "component_code": "button",
                            "props": {"label": "Add Technician", "variant": "primary"},
                            "events": [{"event_type": "on_click", "action_type": "navigate", "config": {"target": "/technicians/new"}}]
                        }
                    ]
                },
                {
                    "component_key": "fp1",
                    "component_code": "filter_panel",
                    "props": {"layout": "inline", "show_apply_button": true},
                    "children": [
                        {"component_key": "f_name",           "component_code": "text_input",     "props": {"label": "Name",           "placeholder": "Filter by name"},                                              "bindings": {"value": {"field_key": "name",           "entity": "technician"}}},
                        {"component_key": "f_specialization", "component_code": "dropdown_select", "props": {"label": "Specialization", "options_source": "static", "static_options": ["mechanical","electrical","body"]}, "bindings": {"value": {"field_key": "specialization", "entity": "technician"}}}
                    ]
                },
                {
                    "component_key": "dt1",
                    "component_code": "data_table",
                    "props": {"columns": ["tech_no","name","specialization","hourly_rate","is_active"], "sortable": true, "page_size": 25},
                    "bindings": {"data": {"field_key": "*", "entity": "technician"}},
                    "events": [{"event_type": "on_row_select", "action_type": "navigate", "config": {"target": "/technicians/{tech_no}"}}]
                }
            ]
        },
        "data_sources": [{"key": "technicians", "entity": "technician", "type": "list"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 7: Finance Company List (standard_crud)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000007',
    '00000000-0000-0000-0002-000000000007',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "tb1",
                    "component_code": "toolbar",
                    "props": {"position": "top", "align": "space-between"},
                    "children": [
                        {
                            "component_key": "btn_new",
                            "component_code": "button",
                            "props": {"label": "Add Finance Company", "variant": "primary"},
                            "events": [{"event_type": "on_click", "action_type": "navigate", "config": {"target": "/finance-companies/new"}}]
                        }
                    ]
                },
                {
                    "component_key": "fp1",
                    "component_code": "filter_panel",
                    "props": {"layout": "inline", "show_apply_button": true},
                    "children": [
                        {"component_key": "f_name", "component_code": "text_input", "props": {"label": "Name", "placeholder": "Filter by name"}, "bindings": {"value": {"field_key": "name", "entity": "finance_company"}}}
                    ]
                },
                {
                    "component_key": "dt1",
                    "component_code": "data_table",
                    "props": {"columns": ["company_code","name","base_rate","max_term_months"], "sortable": true, "page_size": 25},
                    "bindings": {"data": {"field_key": "*", "entity": "finance_company"}},
                    "events": [{"event_type": "on_row_select", "action_type": "navigate", "config": {"target": "/finance-companies/{company_code}"}}]
                }
            ]
        },
        "data_sources": [{"key": "finance_companies", "entity": "finance_company", "type": "list"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 8: Sale Order Editor (header_line)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000008',
    '00000000-0000-0000-0002-000000000008',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "hdr_section",
                    "component_code": "header_line_section",
                    "props": {"section_type": "header", "title": "Sale Order Header", "show_toolbar": true},
                    "children": [
                        {
                            "component_key": "hdr_toolbar",
                            "component_code": "toolbar",
                            "props": {"position": "top", "align": "space-between"},
                            "children": [
                                {"component_key": "btn_save",   "component_code": "button", "props": {"label": "Save",    "variant": "primary"},   "events": [{"event_type": "on_click", "action_type": "save_record",   "config": {}}]},
                                {"component_key": "btn_approve","component_code": "button", "props": {"label": "Approve", "variant": "secondary"}, "events": [{"event_type": "on_click", "action_type": "set_field",     "config": {"field_key": "status", "value": "approved"}}]},
                                {"component_key": "btn_cancel", "component_code": "button", "props": {"label": "Cancel",  "variant": "danger"},    "events": [{"event_type": "on_click", "action_type": "set_field",     "config": {"field_key": "status", "value": "cancelled"}}]}
                            ]
                        },
                        {
                            "component_key": "hdr_grid",
                            "component_code": "section",
                            "props": {"columns": 2},
                            "children": [
                                {
                                    "component_key": "hdr_row1",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_order_no",  "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_order_no",  "component_code": "text_input",     "props": {"label": "Order No"},                                                                   "bindings": {"value": {"field_key": "order_no",            "entity": "sale_order"}}}]},
                                        {"component_key": "gc_status",    "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_status",    "component_code": "dropdown_select", "props": {"label": "Status", "options_source": "static", "static_options": ["draft","approved","delivered","cancelled"]}, "bindings": {"value": {"field_key": "status", "entity": "sale_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "hdr_row2",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_customer",  "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_customer",  "component_code": "dropdown_select", "props": {"label": "Customer",        "options_source": "entity"}, "bindings": {"value": {"field_key": "customer_code",       "entity": "sale_order"}}}]},
                                        {"component_key": "gc_vehicle",   "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_vehicle",   "component_code": "text_input",     "props": {"label": "Vehicle VIN"},                              "bindings": {"value": {"field_key": "vehicle_vin",         "entity": "sale_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "hdr_row3",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_salesperson", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_salesperson", "component_code": "dropdown_select", "props": {"label": "Salesperson",    "options_source": "entity"}, "bindings": {"value": {"field_key": "salesperson_no",      "entity": "sale_order"}}}]},
                                        {"component_key": "gc_finance",     "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_finance",     "component_code": "dropdown_select", "props": {"label": "Finance Company","options_source": "entity"}, "bindings": {"value": {"field_key": "finance_company_code","entity": "sale_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "hdr_row4",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_sale_price",   "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_sale_price",   "component_code": "number_input", "props": {"label": "Sale Price",    "decimal_places": 2}, "bindings": {"value": {"field_key": "sale_price",    "entity": "sale_order"}}}]},
                                        {"component_key": "gc_trade_in",     "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_trade_in",     "component_code": "number_input", "props": {"label": "Trade-In Value","decimal_places": 2}, "bindings": {"value": {"field_key": "trade_in_value","entity": "sale_order"}}}]},
                                        {"component_key": "gc_deposit",      "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_deposit",      "component_code": "number_input", "props": {"label": "Deposit",       "decimal_places": 2}, "bindings": {"value": {"field_key": "deposit",       "entity": "sale_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "hdr_row5",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_delivery_date", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_delivery_date", "component_code": "date_picker", "props": {"label": "Delivery Date"}, "bindings": {"value": {"field_key": "delivery_date", "entity": "sale_order"}}}]}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "component_key": "line_section",
                    "component_code": "header_line_section",
                    "props": {"section_type": "line", "title": "Sale Items", "show_toolbar": true},
                    "children": [
                        {
                            "component_key": "line_toolbar",
                            "component_code": "toolbar",
                            "props": {"position": "top", "align": "space-between"},
                            "children": [
                                {"component_key": "btn_add_line", "component_code": "button", "props": {"label": "Add Line", "variant": "secondary"}, "events": [{"event_type": "on_click", "action_type": "add_line", "config": {}}]}
                            ]
                        },
                        {
                            "component_key": "dt_lines",
                            "component_code": "data_table",
                            "props": {"columns": ["description","qty","unit_price","amount"], "sortable": false, "page_size": 50},
                            "bindings": {"data": {"field_key": "lines", "entity": "sale_order"}}
                        },
                        {
                            "component_key": "totals",
                            "component_code": "section",
                            "props": {"columns": 1},
                            "children": [
                                {"component_key": "lbl_subtotal", "component_code": "label", "props": {"text": "Sale Price",    "variant": "strong"}, "bindings": {"value": {"field_key": "sale_price",    "entity": "sale_order"}}},
                                {"component_key": "lbl_trade_in", "component_code": "label", "props": {"text": "Trade-In",     "variant": "muted"},  "bindings": {"value": {"field_key": "trade_in_value","entity": "sale_order"}}},
                                {"component_key": "lbl_deposit",  "component_code": "label", "props": {"text": "Deposit",      "variant": "muted"},  "bindings": {"value": {"field_key": "deposit",       "entity": "sale_order"}}},
                                {"component_key": "lbl_balance",  "component_code": "label", "props": {"text": "Balance Due",  "variant": "strong"}, "bindings": {"value": {"field_key": "balance_due",   "entity": "sale_order"}}}
                            ]
                        }
                    ]
                }
            ]
        },
        "data_sources": [{"key": "sale_order", "entity": "sale_order", "type": "single"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 9: Service Order Editor (header_line)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000009',
    '00000000-0000-0000-0002-000000000009',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "hdr_section",
                    "component_code": "header_line_section",
                    "props": {"section_type": "header", "title": "Service Order Header", "show_toolbar": true},
                    "children": [
                        {
                            "component_key": "hdr_toolbar",
                            "component_code": "toolbar",
                            "props": {"position": "top", "align": "space-between"},
                            "children": [
                                {"component_key": "btn_save",     "component_code": "button", "props": {"label": "Save",     "variant": "primary"},   "events": [{"event_type": "on_click", "action_type": "save_record", "config": {}}]},
                                {"component_key": "btn_complete", "component_code": "button", "props": {"label": "Complete", "variant": "secondary"}, "events": [{"event_type": "on_click", "action_type": "set_field",   "config": {"field_key": "status", "value": "completed"}}]},
                                {"component_key": "btn_invoice",  "component_code": "button", "props": {"label": "Invoice",  "variant": "secondary"}, "events": [{"event_type": "on_click", "action_type": "set_field",   "config": {"field_key": "status", "value": "invoiced"}}]}
                            ]
                        },
                        {
                            "component_key": "hdr_grid",
                            "component_code": "section",
                            "props": {"columns": 2},
                            "children": [
                                {
                                    "component_key": "hdr_row1",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_ro_no",    "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_ro_no",    "component_code": "text_input",     "props": {"label": "RO No", "input_type": "text"},                                                                          "bindings": {"value": {"field_key": "ro_no",          "entity": "service_order"}}}]},
                                        {"component_key": "gc_status",   "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_status",   "component_code": "dropdown_select", "props": {"label": "Status",  "options_source": "static", "static_options": ["open","in_progress","completed","invoiced"]}, "bindings": {"value": {"field_key": "status",         "entity": "service_order"}}}]},
                                        {"component_key": "gc_tech",     "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_tech",     "component_code": "dropdown_select", "props": {"label": "Technician", "options_source": "entity"},                                                             "bindings": {"value": {"field_key": "technician_no",  "entity": "service_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "hdr_row2",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_customer", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_customer", "component_code": "dropdown_select", "props": {"label": "Customer",    "options_source": "entity"}, "bindings": {"value": {"field_key": "customer_code", "entity": "service_order"}}}]},
                                        {"component_key": "gc_vehicle",  "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_vehicle",  "component_code": "text_input",     "props": {"label": "Vehicle VIN"},                              "bindings": {"value": {"field_key": "vehicle_vin",  "entity": "service_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "hdr_row3",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_complaint", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_complaint", "component_code": "textarea", "props": {"label": "Complaint", "rows": 4}, "bindings": {"value": {"field_key": "complaint", "entity": "service_order"}}}]},
                                        {"component_key": "gc_diagnosis", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_diagnosis", "component_code": "textarea", "props": {"label": "Diagnosis", "rows": 4}, "bindings": {"value": {"field_key": "diagnosis", "entity": "service_order"}}}]}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "component_key": "line_section",
                    "component_code": "header_line_section",
                    "props": {"section_type": "line", "title": "Labour & Parts", "show_toolbar": false},
                    "children": [
                        {
                            "component_key": "labour_list",
                            "component_code": "related_list",
                            "props": {"related_entity": "service_labour", "relationship_field": "ro_no", "display_fields": ["description","tech_no","hours","rate","amount"], "allow_add": true, "allow_remove": true},
                            "bindings": {"data": {"field_key": "labour_lines", "entity": "service_order"}}
                        },
                        {
                            "component_key": "parts_list",
                            "component_code": "related_list",
                            "props": {"related_entity": "parts_request", "relationship_field": "service_order_no", "display_fields": ["part_no","description","qty_issued","cost_price","amount"], "allow_add": true, "allow_remove": true},
                            "bindings": {"data": {"field_key": "parts_lines", "entity": "service_order"}}
                        },
                        {
                            "component_key": "totals_sec",
                            "component_code": "section",
                            "props": {"columns": 1},
                            "children": [
                                {"component_key": "lbl_labour", "component_code": "label", "props": {"text": "Total Labour", "variant": "muted"},  "bindings": {"value": {"field_key": "total_labour", "entity": "service_order"}}},
                                {"component_key": "lbl_parts",  "component_code": "label", "props": {"text": "Total Parts",  "variant": "muted"},  "bindings": {"value": {"field_key": "total_parts",  "entity": "service_order"}}},
                                {"component_key": "lbl_total",  "component_code": "label", "props": {"text": "Total Amount", "variant": "strong"}, "bindings": {"value": {"field_key": "total_amount", "entity": "service_order"}}}
                            ]
                        }
                    ]
                }
            ]
        },
        "data_sources": [{"key": "service_order", "entity": "service_order", "type": "single"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 10: Purchase Order Editor (header_line)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000010',
    '00000000-0000-0000-0002-000000000010',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "hdr_section",
                    "component_code": "header_line_section",
                    "props": {"section_type": "header", "title": "Purchase Order Header", "show_toolbar": true},
                    "children": [
                        {
                            "component_key": "hdr_toolbar",
                            "component_code": "toolbar",
                            "props": {"position": "top", "align": "space-between"},
                            "children": [
                                {"component_key": "btn_save",   "component_code": "button", "props": {"label": "Save",   "variant": "primary"},   "events": [{"event_type": "on_click", "action_type": "save_record", "config": {}}]},
                                {"component_key": "btn_submit", "component_code": "button", "props": {"label": "Submit", "variant": "secondary"}, "events": [{"event_type": "on_click", "action_type": "set_field",   "config": {"field_key": "status", "value": "submitted"}}]},
                                {"component_key": "btn_receive","component_code": "button", "props": {"label": "Receive","variant": "secondary"}, "events": [{"event_type": "on_click", "action_type": "set_field",   "config": {"field_key": "status", "value": "received"}}]}
                            ]
                        },
                        {
                            "component_key": "hdr_grid",
                            "component_code": "section",
                            "props": {"columns": 2},
                            "children": [
                                {
                                    "component_key": "hdr_row1",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_po_no",    "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_po_no",    "component_code": "text_input",     "props": {"label": "PO No"},                                                                              "bindings": {"value": {"field_key": "po_no",             "entity": "purchase_order"}}}]},
                                        {"component_key": "gc_supplier", "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_supplier", "component_code": "dropdown_select", "props": {"label": "Supplier", "options_source": "entity"},                                               "bindings": {"value": {"field_key": "supplier_code",     "entity": "purchase_order"}}}]},
                                        {"component_key": "gc_status",   "component_code": "grid_column", "props": {"span": 4}, "children": [{"component_key": "f_status",   "component_code": "badge",           "props": {"text": "Status", "variant": "default"},                                                         "bindings": {"value": {"field_key": "status",            "entity": "purchase_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "hdr_row2",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_po_date",    "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_po_date",    "component_code": "date_picker", "props": {"label": "PO Date"},           "bindings": {"value": {"field_key": "po_date",           "entity": "purchase_order"}}}]},
                                        {"component_key": "gc_exp_del",    "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_exp_del",    "component_code": "date_picker", "props": {"label": "Expected Delivery"}, "bindings": {"value": {"field_key": "expected_delivery", "entity": "purchase_order"}}}]}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "component_key": "line_section",
                    "component_code": "header_line_section",
                    "props": {"section_type": "line", "title": "Parts Ordered", "show_toolbar": true},
                    "children": [
                        {
                            "component_key": "line_toolbar",
                            "component_code": "toolbar",
                            "props": {"position": "top", "align": "space-between"},
                            "children": [
                                {"component_key": "btn_add_line", "component_code": "button", "props": {"label": "Add Part", "variant": "secondary"}, "events": [{"event_type": "on_click", "action_type": "add_line", "config": {}}]}
                            ]
                        },
                        {
                            "component_key": "dt_lines",
                            "component_code": "data_table",
                            "props": {"columns": ["part_no","description","qty","cost_price","total"], "sortable": false, "page_size": 50},
                            "bindings": {"data": {"field_key": "lines", "entity": "purchase_order"}}
                        },
                        {
                            "component_key": "totals_sec",
                            "component_code": "section",
                            "props": {"columns": 1},
                            "children": [
                                {"component_key": "lbl_total", "component_code": "label", "props": {"text": "Total Amount", "variant": "strong"}, "bindings": {"value": {"field_key": "total_amount", "entity": "purchase_order"}}}
                            ]
                        }
                    ]
                }
            ]
        },
        "data_sources": [{"key": "purchase_order", "entity": "purchase_order", "type": "single"}],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 11: Sales Dashboard (dashboard)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000011',
    '00000000-0000-0000-0002-000000000011',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "dash_grid",
                    "component_code": "section",
                    "props": {"columns": 2},
                    "children": [
                        {
                            "component_key": "metrics_row",
                            "component_code": "grid_row",
                            "props": {"gap": "md"},
                            "children": [
                                {
                                    "component_key": "gc_units",
                                    "component_code": "grid_column",
                                    "props": {"span": 4},
                                    "children": [{
                                        "component_key": "metric_units",
                                        "component_code": "metric_comparison",
                                        "props": {"label": "Units Sold", "format": "number", "trend_direction": "up_good"},
                                        "bindings": {"value": {"field_key": "sales_count", "entity": "sale_order"}}
                                    }]
                                },
                                {
                                    "component_key": "gc_revenue",
                                    "component_code": "grid_column",
                                    "props": {"span": 4},
                                    "children": [{
                                        "component_key": "metric_revenue",
                                        "component_code": "metric_comparison",
                                        "props": {"label": "Total Revenue", "format": "currency", "trend_direction": "up_good"},
                                        "bindings": {"value": {"field_key": "total_revenue", "entity": "sale_order"}}
                                    }]
                                },
                                {
                                    "component_key": "gc_avg_price",
                                    "component_code": "grid_column",
                                    "props": {"span": 4},
                                    "children": [{
                                        "component_key": "metric_avg",
                                        "component_code": "metric_comparison",
                                        "props": {"label": "Avg Sale Price", "format": "currency", "trend_direction": "up_good"},
                                        "bindings": {"value": {"field_key": "avg_sale_price", "entity": "sale_order"}}
                                    }]
                                }
                            ]
                        },
                        {
                            "component_key": "recent_orders_row",
                            "component_code": "grid_row",
                            "props": {"gap": "md"},
                            "children": [
                                {
                                    "component_key": "gc_recent_orders",
                                    "component_code": "grid_column",
                                    "props": {"span": 12},
                                    "children": [{
                                        "component_key": "dt_recent_orders",
                                        "component_code": "data_table",
                                        "props": {"columns": ["order_no","customer_code","vehicle_vin","sale_price","status"], "sortable": true, "page_size": 10},
                                        "bindings": {"data": {"field_key": "*", "entity": "sale_order"}}
                                    }]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "data_sources": [
            {"key": "recent_orders", "entity": "sale_order", "type": "list", "sort": [{"field": "delivery_date", "direction": "desc"}], "limit": 10}
        ],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 12: Service Dashboard (dashboard)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000012',
    '00000000-0000-0000-0002-000000000012',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "dash_section",
                    "component_code": "section",
                    "props": {"columns": 2},
                    "children": [
                        {
                            "component_key": "metrics_row",
                            "component_code": "grid_row",
                            "props": {"gap": "md"},
                            "children": [
                                {
                                    "component_key": "gc_open_ros",
                                    "component_code": "grid_column",
                                    "props": {"span": 6},
                                    "children": [{
                                        "component_key": "metric_open_ros",
                                        "component_code": "metric_comparison",
                                        "props": {"label": "Open Orders", "format": "number", "trend_direction": "down_good"},
                                        "bindings": {"value": {"field_key": "open_ro_count", "entity": "service_order"}}
                                    }]
                                },
                                {
                                    "component_key": "gc_revenue_month",
                                    "component_code": "grid_column",
                                    "props": {"span": 6},
                                    "children": [{
                                        "component_key": "metric_revenue_month",
                                        "component_code": "metric_comparison",
                                        "props": {"label": "Revenue This Month", "format": "currency", "trend_direction": "up_good"},
                                        "bindings": {"value": {"field_key": "monthly_revenue", "entity": "service_order"}}
                                    }]
                                }
                            ]
                        },
                        {
                            "component_key": "tables_row",
                            "component_code": "grid_row",
                            "props": {"gap": "md"},
                            "children": [
                                {
                                    "component_key": "gc_open_ro_table",
                                    "component_code": "grid_column",
                                    "props": {"span": 6},
                                    "children": [{
                                        "component_key": "dt_open_ros",
                                        "component_code": "data_table",
                                        "props": {"columns": ["ro_no","customer_code","technician_no","status"], "sortable": true, "page_size": 10},
                                        "bindings": {"data": {"field_key": "*", "entity": "service_order"}}
                                    }]
                                },
                                {
                                    "component_key": "gc_tech_util",
                                    "component_code": "grid_column",
                                    "props": {"span": 6},
                                    "children": [{
                                        "component_key": "dt_tech_util",
                                        "component_code": "data_table",
                                        "props": {"columns": ["tech_no","name","open_ros","completed_today"], "sortable": true, "page_size": 10},
                                        "bindings": {"data": {"field_key": "*", "entity": "technician"}}
                                    }]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "data_sources": [
            {"key": "open_ros",     "entity": "service_order", "type": "list", "filter": {"status": "open"},        "limit": 20},
            {"key": "technicians",  "entity": "technician",    "type": "list", "filter": {"is_active": true},       "limit": 50}
        ],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 13: New Vehicle Sale Wizard (wizard)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000013',
    '00000000-0000-0000-0002-000000000013',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "centered", "padding": "lg"},
            "children": [
                {
                    "component_key": "step1",
                    "component_code": "wizard_step_container",
                    "props": {"step_label": "Select Vehicle", "step_description": "Choose the vehicle to sell", "validation_required": true},
                    "visibility": {"condition_type": "field_equals", "field_key": "active_step", "value": 1},
                    "children": [
                        {
                            "component_key": "step1_filter",
                            "component_code": "filter_panel",
                            "props": {"layout": "inline", "show_apply_button": true},
                            "children": [
                                {"component_key": "s1_make",  "component_code": "text_input",  "props": {"label": "Make",  "placeholder": "Filter by make"},  "bindings": {"value": {"field_key": "make",  "entity": "vehicle"}}},
                                {"component_key": "s1_model", "component_code": "text_input",  "props": {"label": "Model", "placeholder": "Filter by model"}, "bindings": {"value": {"field_key": "model", "entity": "vehicle"}}},
                                {"component_key": "s1_year",  "component_code": "number_input","props": {"label": "Year",  "min": 2000, "max": 2030},          "bindings": {"value": {"field_key": "year",  "entity": "vehicle"}}}
                            ]
                        },
                        {
                            "component_key": "step1_table",
                            "component_code": "data_table",
                            "props": {"columns": ["stock_no","vin","make","model","year","list_price","status"], "sortable": true, "page_size": 15, "selectable": true, "selection_mode": "single"},
                            "bindings": {"data": {"field_key": "*", "entity": "vehicle"}},
                            "events": [{"event_type": "on_row_select", "action_type": "set_field", "config": {"field_key": "vehicle_vin", "source_field": "vin"}}]
                        },
                        {
                            "component_key": "step1_nav",
                            "component_code": "section",
                            "props": {"columns": 1},
                            "children": [
                                {"component_key": "btn_step1_next", "component_code": "button", "props": {"label": "Next: Customer & Finance", "variant": "primary"}, "events": [{"event_type": "on_click", "action_type": "set_field", "config": {"field_key": "active_step", "value": 2}}]}
                            ]
                        }
                    ]
                },
                {
                    "component_key": "step2",
                    "component_code": "wizard_step_container",
                    "props": {"step_label": "Customer & Finance", "step_description": "Enter customer and financing details", "validation_required": true},
                    "visibility": {"condition_type": "field_equals", "field_key": "active_step", "value": 2},
                    "children": [
                        {
                            "component_key": "step2_form",
                            "component_code": "section",
                            "props": {"columns": 1},
                            "children": [
                                {
                                    "component_key": "s2_row1",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_customer",     "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_customer",     "component_code": "text_input",     "props": {"label": "Customer Code"}, "bindings": {"value": {"field_key": "customer_code",        "entity": "sale_order"}}}]},
                                        {"component_key": "gc_finance_co",   "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_finance_co",   "component_code": "dropdown_select", "props": {"label": "Finance Company", "options_source": "entity"}, "bindings": {"value": {"field_key": "finance_company_code","entity": "sale_order"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "s2_row2",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_deposit",  "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_deposit",  "component_code": "number_input", "props": {"label": "Deposit Amount", "min": 0}, "bindings": {"value": {"field_key": "deposit", "entity": "sale_order"}}}]},
                                        {"component_key": "gc_trade_in", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_trade_in", "component_code": "number_input", "props": {"label": "Trade-In Value", "min": 0}, "bindings": {"value": {"field_key": "trade_in_value", "entity": "sale_order"}}}]}
                                    ]
                                }
                            ]
                        },
                        {
                            "component_key": "step2_nav",
                            "component_code": "section",
                            "props": {"columns": 1},
                            "children": [
                                {"component_key": "btn_step2_back", "component_code": "button", "props": {"label": "Back",              "variant": "ghost"},   "events": [{"event_type": "on_click", "action_type": "set_field", "config": {"field_key": "active_step", "value": 1}}]},
                                {"component_key": "btn_step2_next", "component_code": "button", "props": {"label": "Next: Review",      "variant": "primary"}, "events": [{"event_type": "on_click", "action_type": "set_field", "config": {"field_key": "active_step", "value": 3}}]}
                            ]
                        }
                    ]
                },
                {
                    "component_key": "step3",
                    "component_code": "wizard_step_container",
                    "props": {"step_label": "Review & Confirm", "step_description": "Review sale details and confirm", "validation_required": false},
                    "visibility": {"condition_type": "field_equals", "field_key": "active_step", "value": 3},
                    "children": [
                        {
                            "component_key": "step3_summary",
                            "component_code": "section",
                            "props": {"title": "Sale Summary", "columns": 1},
                            "children": [
                                {"component_key": "lbl_vehicle",      "component_code": "label", "props": {"text": "Vehicle VIN",      "variant": "muted"},  "bindings": {"value": {"field_key": "vehicle_vin",         "entity": "sale_order"}}},
                                {"component_key": "lbl_customer",     "component_code": "label", "props": {"text": "Customer",         "variant": "muted"},  "bindings": {"value": {"field_key": "customer_code",       "entity": "sale_order"}}},
                                {"component_key": "lbl_finance_co",   "component_code": "label", "props": {"text": "Finance Company",  "variant": "muted"},  "bindings": {"value": {"field_key": "finance_company_code","entity": "sale_order"}}},
                                {"component_key": "lbl_sale_price",   "component_code": "label", "props": {"text": "Sale Price",       "variant": "strong"}, "bindings": {"value": {"field_key": "sale_price",          "entity": "sale_order"}}},
                                {"component_key": "lbl_deposit_sum",  "component_code": "label", "props": {"text": "Deposit",          "variant": "muted"},  "bindings": {"value": {"field_key": "deposit",             "entity": "sale_order"}}},
                                {"component_key": "lbl_trade_in_sum", "component_code": "label", "props": {"text": "Trade-In Value",   "variant": "muted"},  "bindings": {"value": {"field_key": "trade_in_value",      "entity": "sale_order"}}}
                            ]
                        },
                        {
                            "component_key": "step3_nav",
                            "component_code": "section",
                            "props": {"columns": 1},
                            "children": [
                                {"component_key": "btn_step3_back",    "component_code": "button", "props": {"label": "Back",         "variant": "ghost"},   "events": [{"event_type": "on_click", "action_type": "set_field",   "config": {"field_key": "active_step", "value": 2}}]},
                                {"component_key": "btn_confirm_sale",  "component_code": "button", "props": {"label": "Confirm Sale", "variant": "primary"}, "events": [{"event_type": "on_click", "action_type": "save_record", "config": {"then_navigate": "/sale-orders/{order_no}"}}]}
                            ]
                        }
                    ]
                }
            ]
        },
        "data_sources": [
            {"key": "vehicles",  "entity": "vehicle",    "type": "list",   "filter": {"status": "available"}},
            {"key": "sale_draft","entity": "sale_order",  "type": "single", "mode": "create"}
        ],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
),

-- --------------------------------------------------------------------------
-- View 14: Customer 360 (split_view)
-- --------------------------------------------------------------------------
(
    '00000000-0000-0000-0005-000000000014',
    '00000000-0000-0000-0002-000000000014',
    1,
    '{
        "component_tree": {
            "component_key": "root",
            "component_code": "page_root",
            "props": {"layout": "full", "padding": "md"},
            "children": [
                {
                    "component_key": "split",
                    "component_code": "split_pane",
                    "props": {"orientation": "horizontal", "initial_ratio": 0.4, "resizable": true},
                    "children": [
                        {
                            "component_key": "left_pane",
                            "component_code": "section",
                            "props": {"title": "Customer Details", "columns": 1},
                            "children": [
                                {
                                    "component_key": "cust_row1",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_code", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_code", "component_code": "text_input", "props": {"label": "Code",  "input_type": "text"}, "bindings": {"value": {"field_key": "code", "entity": "customer"}}}]},
                                        {"component_key": "gc_type", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_type", "component_code": "dropdown_select", "props": {"label": "Type", "options_source": "static", "static_options": ["individual","corporate"]}, "bindings": {"value": {"field_key": "customer_type", "entity": "customer"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "cust_row2",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_name", "component_code": "grid_column", "props": {"span": 12}, "children": [{"component_key": "f_name", "component_code": "text_input", "props": {"label": "Name"}, "bindings": {"value": {"field_key": "name", "entity": "customer"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "cust_row3",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_phone", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_phone", "component_code": "text_input", "props": {"label": "Phone"}, "bindings": {"value": {"field_key": "phone", "entity": "customer"}}}]},
                                        {"component_key": "gc_email", "component_code": "grid_column", "props": {"span": 6}, "children": [{"component_key": "f_email", "component_code": "text_input", "props": {"label": "Email", "input_type": "email"}, "bindings": {"value": {"field_key": "email", "entity": "customer"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "cust_row4",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_address", "component_code": "grid_column", "props": {"span": 12}, "children": [{"component_key": "f_address", "component_code": "textarea", "props": {"label": "Address", "rows": 3}, "bindings": {"value": {"field_key": "address", "entity": "customer"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "cust_row5",
                                    "component_code": "grid_row",
                                    "props": {"gap": "md"},
                                    "children": [
                                        {"component_key": "gc_city",         "component_code": "grid_column", "props": {"span": 6},  "children": [{"component_key": "f_city",         "component_code": "text_input",  "props": {"label": "City"},         "bindings": {"value": {"field_key": "city",         "entity": "customer"}}}]},
                                        {"component_key": "gc_credit_limit", "component_code": "grid_column", "props": {"span": 6},  "children": [{"component_key": "f_credit_limit", "component_code": "number_input","props": {"label": "Credit Limit"}, "bindings": {"value": {"field_key": "credit_limit", "entity": "customer"}}}]}
                                    ]
                                },
                                {
                                    "component_key": "cust_actions",
                                    "component_code": "toolbar",
                                    "props": {"position": "bottom", "align": "right"},
                                    "children": [
                                        {"component_key": "btn_save_cust", "component_code": "button", "props": {"label": "Save Customer", "variant": "primary"}, "events": [{"event_type": "on_click", "action_type": "save_record", "config": {}}]}
                                    ]
                                }
                            ]
                        },
                        {
                            "component_key": "right_pane",
                            "component_code": "section",
                            "props": {"title": "Activity", "columns": 1},
                            "children": [
                                {
                                    "component_key": "tx_history_sec",
                                    "component_code": "section",
                                    "props": {"title": "Transaction History", "collapsible": false},
                                    "children": [{
                                        "component_key": "tx_history",
                                        "component_code": "related_list",
                                        "props": {"related_entity": "sale_order", "relationship_field": "customer_code", "display_fields": ["order_no","delivery_date","sale_price","status"], "allow_add": false, "allow_remove": false},
                                        "bindings": {"data": {"field_key": "sale_orders", "entity": "customer"}}
                                    }]
                                },
                                {
                                    "component_key": "svc_history_sec",
                                    "component_code": "section",
                                    "props": {"title": "Service History", "collapsible": true, "collapsed_default": false},
                                    "children": [{
                                        "component_key": "svc_history",
                                        "component_code": "data_table",
                                        "props": {"columns": ["ro_no","vehicle_vin","technician_no","total_amount","status"], "sortable": true, "page_size": 10},
                                        "bindings": {"data": {"field_key": "service_orders", "entity": "customer"}}
                                    }]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "data_sources": [
            {"key": "customer",      "entity": "customer",      "type": "single"},
            {"key": "sale_orders",   "entity": "sale_order",    "type": "list", "filter_by_parent": "customer_code"},
            {"key": "service_orders","entity": "service_order", "type": "list", "filter_by_parent": "customer_code"}
        ],
        "events": []
    }',
    true, false, '00000000-0000-0000-0000-000000000001', NOW(), '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

COMMIT;
