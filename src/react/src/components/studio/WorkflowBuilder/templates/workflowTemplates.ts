import type { WorkflowDefinition, WorkflowStep } from '../../../../types/workflowBuilder'

export type TemplateCategory = 'Data CRUD' | 'Approvals' | 'Integration' | 'Analytics'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  tags: string[]
  definition: WorkflowDefinition
}

// ── Helper: build a step ──────────────────────────────────────────────────────

function step(
  id: string,
  name: string,
  type: WorkflowStep['type'],
  componentType: string,
  taskSettings: Record<string, unknown>,
  x: number,
  y: number,
  extra?: Partial<WorkflowStep>,
): WorkflowStep {
  return {
    id,
    name,
    type,
    componentType,
    position: { x, y },
    properties: { taskSettings },
    ...extra,
  } as WorkflowStep & { position: { x: number; y: number } }
}

// ── Template 1: Get Entity By ID ──────────────────────────────────────────────

const getEntityById: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('findRecord', 'Find Record', 'Document', 'task', {
      entity: '<EntityName>',
      operation: 'FindOne',
      filter: '{ "_id": $.request.params.id }',
    }, 200, 190),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 200,
      message: 'Record retrieved successfully',
      data: '$.findRecord.data',
    }, 200, 330),
    step('end', 'End', 'end', 'task', {}, 200, 470),
  ],
  properties: {
    description: 'Fetch a single entity record by its ID. Replace <EntityName> with your entity.',
    tags: ['GET', 'CRUD', 'read'],
    inputSchema: '{ "params": { "id": "<uuid>" } }',
  },
}

// ── Template 2: Create Entity ─────────────────────────────────────────────────

const createEntity: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('validateInput', 'Validate Input', 'Validator', 'task', {
      columns: [
        { name: 'name', value: '$.request.body.name', operator: 'isNotEmpty', dataType: 'string' },
      ],
    }, 200, 190),
    step('createRecord', 'Create Record', 'Document', 'task', {
      entity: '<EntityName>',
      operation: 'Create',
      body: '$.request.body',
    }, 200, 330),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 201,
      message: 'Record created successfully',
      data: '$.createRecord.data',
    }, 200, 470),
    step('end', 'End', 'end', 'task', {}, 200, 610),
  ],
  properties: {
    description: 'Validate and create a new entity record. Replace <EntityName> with your entity.',
    tags: ['POST', 'CRUD', 'create'],
  },
}

// ── Template 3: Paginated List ────────────────────────────────────────────────

const paginatedList: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('listRecords', 'List Records', 'Query', 'task', {
      entity: '<EntityName>',
      operation: 'FindPaging',
      filter: '{}',
      limit: 20,
      skip: '$.request.query.skip ?? 0',
      sort: { createdAt: -1 },
    }, 200, 190),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 200,
      message: 'Records retrieved',
      data: '$.listRecords.data',
    }, 200, 330),
    step('end', 'End', 'end', 'task', {}, 200, 470),
  ],
  properties: {
    description: 'Retrieve a paginated list of entity records. Replace <EntityName> with your entity.',
    tags: ['GET', 'CRUD', 'list', 'pagination'],
  },
}

// ── Template 4: Conditional Upsert ───────────────────────────────────────────

const conditionalUpsert: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('lookupExisting', 'Lookup Existing', 'Query', 'task', {
      entity: '<EntityName>',
      operation: 'FindOne',
      filter: '{ "externalId": $.request.body.externalId }',
    }, 200, 190),
    step('checkExists', 'Record Exists?', 'Condition', 'switch', {
      columns: [
        { name: 'existing', value: '$.lookupExisting.data', operator: 'isNotNull', dataType: 'any' },
      ],
    }, 200, 330, {
      branches: {
        onSuccess: [
          step('updateRecord', 'Update Record', 'Document', 'task', {
            entity: '<EntityName>',
            operation: 'Update',
            filter: '{ "_id": $.lookupExisting.data._id }',
            body: '$.request.body',
          }, 400, 470),
        ],
        onFailure: [
          step('createRecord', 'Create Record', 'Document', 'task', {
            entity: '<EntityName>',
            operation: 'Create',
            body: '$.request.body',
          }, 0, 470),
        ],
      },
    }),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 200,
      message: 'Upsert complete',
      data: '$.updateRecord.data ?? $.createRecord.data',
    }, 200, 610),
    step('end', 'End', 'end', 'task', {}, 200, 750),
  ],
  properties: {
    description: 'Find an existing record and update it; create it if it does not exist.',
    tags: ['POST', 'CRUD', 'upsert', 'condition'],
  },
}

// ── Template 5: Multi-step Approval ──────────────────────────────────────────

const multiStepApproval: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('fetchRecord', 'Fetch Record', 'Document', 'task', {
      entity: '<EntityName>',
      operation: 'FindOne',
      filter: '{ "_id": $.request.params.id }',
    }, 200, 190),
    step('requestApproval', 'Request Approval', 'Approval', 'task', {
      approvers: ['<role:manager>'],
      timeout: 86400,
      message: 'Please review and approve or reject this record.',
    }, 200, 330),
    step('approvalBranch', 'Approval Decision', 'Condition', 'switch', {
      columns: [
        { name: 'approved', value: '$.requestApproval.data.approved', operator: 'isTrue', dataType: 'boolean' },
      ],
    }, 200, 470, {
      branches: {
        onSuccess: [
          step('approveRecord', 'Set APPROVED', 'Document', 'task', {
            entity: '<EntityName>',
            operation: 'Update',
            filter: '{ "_id": $.request.params.id }',
            body: '{ "status": "APPROVED", "approvedBy": $.requestApproval.data.reviewedBy }',
          }, 400, 610),
        ],
        onFailure: [
          step('rejectRecord', 'Set REJECTED', 'Document', 'task', {
            entity: '<EntityName>',
            operation: 'Update',
            filter: '{ "_id": $.request.params.id }',
            body: '{ "status": "REJECTED", "rejectedBy": $.requestApproval.data.reviewedBy, "rejectionReason": $.requestApproval.data.comment }',
          }, 0, 610),
        ],
      },
    }),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 200,
      message: 'Approval workflow complete',
      data: '$.approveRecord.data ?? $.rejectRecord.data',
    }, 200, 750),
    step('end', 'End', 'end', 'task', {}, 200, 890),
  ],
  properties: {
    description: 'Route a record through a human approval step, then update its status based on the decision.',
    tags: ['approval', 'workflow', 'status'],
  },
}

// ── Template 6: Bulk Export CSV ───────────────────────────────────────────────

const bulkExportCsv: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('fetchAll', 'Fetch All Records', 'Query', 'task', {
      entity: '<EntityName>',
      operation: 'FindMany',
      filter: '$.request.query.filter ?? {}',
      sort: { createdAt: -1 },
      limit: 10000,
    }, 200, 190),
    step('exportData', 'Export to CSV', 'Export', 'task', {
      format: 'CSV',
      data: '$.fetchAll.data',
      filename: '<EntityName>_export',
      columns: ['<field1>', '<field2>', '<field3>'],
    }, 200, 330),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 200,
      message: 'Export generated',
      data: '$.exportData.data',
    }, 200, 470),
    step('end', 'End', 'end', 'task', {}, 200, 610),
  ],
  properties: {
    description: 'Fetch all matching records and export them as a CSV file.',
    tags: ['export', 'CSV', 'analytics', 'bulk'],
  },
}

// ── Template 7: Webhook Receiver ─────────────────────────────────────────────

const webhookReceiver: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('validatePayload', 'Validate Payload', 'Validator', 'task', {
      columns: [
        { name: 'event', value: '$.request.body.event', operator: 'isNotEmpty', dataType: 'string' },
        { name: 'data', value: '$.request.body.data', operator: 'isNotNull', dataType: 'any' },
      ],
    }, 200, 190),
    step('applyRule', 'Apply Business Rule', 'Rule', 'task', {
      columns: [
        { name: 'eventType', value: '$.request.body.event', operator: 'in', dataType: 'string' },
      ],
    }, 200, 330),
    step('callExternal', 'Forward to External API', 'HTTP', 'task', {
      method: 'POST',
      url: 'https://<external-service>/webhook',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' },
      body: '$.request.body',
    }, 200, 470),
    step('sendResponse', 'Acknowledge', 'Response', 'task', {
      status: 200,
      message: 'Webhook received',
      data: '{ "ok": true }',
    }, 200, 610),
    step('end', 'End', 'end', 'task', {}, 200, 750),
  ],
  properties: {
    description: 'Receive an inbound webhook, validate it, apply a rule, then forward it to an external system.',
    tags: ['webhook', 'integration', 'HTTP', 'inbound'],
  },
}

// ── Template 8: AI Data Enrichment ───────────────────────────────────────────

const aiDataEnrichment: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('fetchRecord', 'Fetch Record', 'Document', 'task', {
      entity: '<EntityName>',
      operation: 'FindOne',
      filter: '{ "_id": $.request.params.id }',
    }, 200, 190),
    step('enrichWithAI', 'AI Enrichment', 'AI', 'task', {
      prompt: 'Given the following record, suggest improvements and return a JSON object with "summary" and "tags" fields:\n\n{$.fetchRecord.data}',
      model: 'gpt-4o-mini',
      output: 'aiEnrichment',
    }, 200, 330),
    step('saveEnrichment', 'Save Enrichment', 'Document', 'task', {
      entity: '<EntityName>',
      operation: 'Update',
      filter: '{ "_id": $.request.params.id }',
      body: '{ "aiSummary": $.enrichWithAI.data.summary, "aiTags": $.enrichWithAI.data.tags, "enrichedAt": $now() }',
    }, 200, 470),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 200,
      message: 'Record enriched with AI',
      data: '$.saveEnrichment.data',
    }, 200, 610),
    step('end', 'End', 'end', 'task', {}, 200, 750),
  ],
  properties: {
    description: 'Use AI to enrich a record with a summary and tags, then persist the enrichment back to the entity.',
    tags: ['AI', 'enrichment', 'automation'],
  },
}

// ── Template 9: Cross-entity Join ────────────────────────────────────────────

const crossEntityJoin: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('fetchParent', 'Fetch Parent Record', 'Document', 'task', {
      entity: '<ParentEntity>',
      operation: 'FindOne',
      filter: '{ "_id": $.request.params.id }',
    }, 200, 190),
    step('fetchChildren', 'Fetch Related Records', 'Query', 'task', {
      entity: '<ChildEntity>',
      operation: 'FindMany',
      filter: '{ "parentId": $.fetchParent.data._id }',
      sort: { createdAt: 1 },
    }, 200, 330),
    step('joinData', 'Join Results', 'Resolver', 'task', {
      expression: '{ "parent": $.fetchParent.data, "children": $.fetchChildren.data, "childCount": $count($.fetchChildren.data) }',
      output: 'joinedResult',
    }, 200, 470),
    step('sendResponse', 'Send Response', 'Response', 'task', {
      status: 200,
      message: 'Records joined successfully',
      data: '$.joinData.data',
    }, 200, 610),
    step('end', 'End', 'end', 'task', {}, 200, 750),
  ],
  properties: {
    description: 'Fetch a parent record, look up its related child records, and join them into a single response.',
    tags: ['join', 'cross-entity', 'relationship', 'GET'],
  },
}

// ── Template 10: Scheduled Report Email ──────────────────────────────────────

const scheduledReportEmail: WorkflowDefinition = {
  sequence: [
    step('start', 'Start', 'start', 'task', {}, 200, 50),
    step('fetchReportData', 'Fetch Report Data', 'Query', 'task', {
      entity: '<EntityName>',
      operation: 'FindMany',
      filter: '{ "createdAt": { "$gte": $dateAdd($now(), -7, "days") } }',
      sort: { createdAt: -1 },
      limit: 1000,
    }, 200, 190),
    step('exportXlsx', 'Export to XLSX', 'Export', 'task', {
      format: 'XLSX',
      data: '$.fetchReportData.data',
      filename: 'weekly_report',
      sheetName: 'Report',
    }, 200, 330),
    step('sendEmail', 'Send Report Email', 'SMTP', 'task', {
      smtp: {
        to: ['<recipient@example.com>'],
        subject: 'Weekly Report — {$formatDate($now(), "YYYY-MM-DD")}',
        body: 'Please find the attached weekly report.',
        attachments: ['$.exportXlsx.data'],
      },
    }, 200, 470),
    step('sendResponse', 'Acknowledge', 'Response', 'task', {
      status: 200,
      message: 'Report sent successfully',
      data: '{ "sentAt": $now() }',
    }, 200, 610),
    step('end', 'End', 'end', 'task', {}, 200, 750),
  ],
  properties: {
    description: 'Fetch recent records, export them as an XLSX report, and email it to the configured recipients.',
    tags: ['report', 'email', 'SMTP', 'XLSX', 'scheduled'],
  },
}

// ── WORKFLOW_TEMPLATES array ──────────────────────────────────────────────────

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'get-entity-by-id',
    name: 'Get Entity By ID',
    description: 'Retrieve a single record by its ID and return it in the response.',
    category: 'Data CRUD',
    tags: ['GET', 'CRUD', 'read'],
    definition: getEntityById,
  },
  {
    id: 'create-entity',
    name: 'Create Entity',
    description: 'Validate request body and create a new entity record.',
    category: 'Data CRUD',
    tags: ['POST', 'CRUD', 'create', 'validator'],
    definition: createEntity,
  },
  {
    id: 'paginated-list',
    name: 'Paginated List',
    description: 'Return a paginated list of entity records with sorting.',
    category: 'Data CRUD',
    tags: ['GET', 'CRUD', 'list', 'pagination'],
    definition: paginatedList,
  },
  {
    id: 'conditional-upsert',
    name: 'Conditional Upsert',
    description: 'Look up an existing record and update it, or create it if not found.',
    category: 'Data CRUD',
    tags: ['POST', 'CRUD', 'upsert', 'condition'],
    definition: conditionalUpsert,
  },
  {
    id: 'multi-step-approval',
    name: 'Multi-step Approval',
    description: 'Route a record through a human approval step and update its status.',
    category: 'Approvals',
    tags: ['approval', 'workflow', 'status', 'human-in-loop'],
    definition: multiStepApproval,
  },
  {
    id: 'bulk-export-csv',
    name: 'Bulk Export CSV',
    description: 'Fetch all matching records and export them as a downloadable CSV file.',
    category: 'Analytics',
    tags: ['export', 'CSV', 'bulk', 'analytics'],
    definition: bulkExportCsv,
  },
  {
    id: 'webhook-receiver',
    name: 'Webhook Receiver',
    description: 'Receive an inbound webhook, validate it, apply rules, and forward to an external API.',
    category: 'Integration',
    tags: ['webhook', 'HTTP', 'integration', 'inbound'],
    definition: webhookReceiver,
  },
  {
    id: 'ai-data-enrichment',
    name: 'AI Data Enrichment',
    description: 'Use AI to generate a summary and tags for a record, then persist the result.',
    category: 'Integration',
    tags: ['AI', 'enrichment', 'automation', 'NLP'],
    definition: aiDataEnrichment,
  },
  {
    id: 'cross-entity-join',
    name: 'Cross-entity Join',
    description: 'Fetch a parent record and its related child records, then join them in the response.',
    category: 'Data CRUD',
    tags: ['join', 'cross-entity', 'relationship', 'GET'],
    definition: crossEntityJoin,
  },
  {
    id: 'scheduled-report-email',
    name: 'Scheduled Report Email',
    description: 'Fetch recent records, export as XLSX, and email the report to configured recipients.',
    category: 'Analytics',
    tags: ['report', 'email', 'SMTP', 'XLSX', 'scheduled'],
    definition: scheduledReportEmail,
  },
]
