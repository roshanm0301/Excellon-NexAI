// Phase 4 §6 — seeded external engine references for the DMS app
// Entities, rules, workflows, connectors with full TypeShape definitions.

import type { RegistryHit, TypeShape } from "@/services/interfaces"

// ── Registry Hits (search results) ─────────────────────────────────────────

export const registryHits: RegistryHit[] = [
  // Entities
  {
    ref: "entity.SalesOrder",
    kind: "entity",
    name: "Sales Order",
    description: "Top-level dealership sales order",
  },
  {
    ref: "entity.OrderLine",
    kind: "entity",
    name: "Order Line",
    description: "Line item on a sales order",
  },
  {
    ref: "entity.Customer",
    kind: "entity",
    name: "Customer",
    description: "Dealership customer",
  },

  // Rules
  {
    ref: "rule.orderHasLines",
    kind: "rule",
    name: "Order Has Lines",
    description: "Validates that an order has at least one line item",
  },
  {
    ref: "rule.maxDiscount",
    kind: "rule",
    name: "Max Discount",
    description: "Enforces maximum discount percentage per role",
  },

  // Workflows
  {
    ref: "wf.orderApproval",
    kind: "workflow",
    name: "Order Approval",
    description: "Draft → Submitted → Approved / Rejected",
  },

  // Connectors
  {
    ref: "connector.erp",
    kind: "connector",
    name: "ERP Connector",
    description: "Outbound integration to enterprise ERP system",
  },
]

// ── Type Shapes (field-level detail per ref) ────────────────────────────────

export const typeShapes: Map<string, TypeShape> = new Map([
  [
    "entity.SalesOrder",
    {
      ref: "entity.SalesOrder",
      fields: [
        { name: "orderNumber", type: "string", required: true, description: "Unique order number" },
        { name: "customerId", type: "string", required: true, description: "FK to Customer" },
        { name: "orderDate", type: "date", required: true, description: "Date the order was placed" },
        { name: "status", type: "string", required: true, description: "Current order status" },
        { name: "discount", type: "number", required: false, description: "Discount percentage" },
        { name: "totalAmount", type: "number", required: false, description: "Computed total" },
      ],
    },
  ],
  [
    "entity.OrderLine",
    {
      ref: "entity.OrderLine",
      fields: [
        { name: "lineNumber", type: "number", required: true, description: "Sequential line number" },
        { name: "orderId", type: "string", required: true, description: "FK to SalesOrder" },
        { name: "partNumber", type: "string", required: true, description: "Part/SKU reference" },
        { name: "quantity", type: "number", required: true, description: "Quantity ordered" },
        { name: "unitPrice", type: "number", required: true, description: "Price per unit" },
      ],
    },
  ],
  [
    "entity.Customer",
    {
      ref: "entity.Customer",
      fields: [
        { name: "name", type: "string", required: true, description: "Customer display name" },
        { name: "email", type: "string", required: false, description: "Contact email" },
        { name: "phone", type: "string", required: false, description: "Contact phone" },
      ],
    },
  ],
  [
    "wf.orderApproval",
    {
      ref: "wf.orderApproval",
      fields: [
        { name: "currentState", type: "string", required: true, description: "Current workflow state" },
        { name: "transitions", type: "string[]", required: true, description: "Available transition names" },
        { name: "history", type: "record", required: false, description: "State change history" },
      ],
    },
  ],
  [
    "rule.orderHasLines",
    {
      ref: "rule.orderHasLines",
      fields: [
        { name: "result", type: "boolean", required: true, description: "Rule evaluation result" },
        { name: "message", type: "string", required: false, description: "Failure message" },
      ],
    },
  ],
  [
    "rule.maxDiscount",
    {
      ref: "rule.maxDiscount",
      fields: [
        { name: "maxAllowed", type: "number", required: true, description: "Max discount % for role" },
        { name: "result", type: "boolean", required: true, description: "Rule evaluation result" },
      ],
    },
  ],
  [
    "connector.erp",
    {
      ref: "connector.erp",
      fields: [
        { name: "endpoint", type: "string", required: true, description: "ERP API endpoint" },
        { name: "authMethod", type: "string", required: true, description: "Authentication method" },
      ],
    },
  ],
])

// Set of all valid registry refs — used by validation to check broken bindings
export const allRegistryKeys: ReadonlySet<string> = new Set(registryHits.map((h) => h.ref))
