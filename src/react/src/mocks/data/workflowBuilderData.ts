import type { WorkflowArtifact } from '../../types/workflowBuilder'

const TS = '2026-06-03T00:00:00.000Z'
const TENANT = '00000000-0000-0000-0000-000000000001'

function wf(id: string, name: string, artifact: WorkflowArtifact['payload']): WorkflowArtifact {
  return {
    version_id: id,
    artifact_id: id,
    version_no: 1,
    artifact_name: name,
    artifact_type: 'workflow_builder',
    tenant_id: TENANT,
    payload: artifact,
    is_active: true,
    is_draft: false,
    created_by: TENANT,
    created_at: TS,
    id,
    entity_type: name,
  }
}

// ── 1. getProviderById — start → document(FindOne) → response ────────────────

const getProviderById = wf('00000000-0000-0000-0005-000000000001', 'getProviderById', {
  sequence: [
    {
      id: 'start',
      name: 'Start',
      type: 'Request',
      componentType: 'task',
      properties: {
        type: 'GET',
        taskSettings: {
          method: 'GET',
        },
      },
    },
    {
      id: 'readProvider',
      name: 'Read Provider',
      type: 'Document',
      componentType: 'task',
      properties: {
        type: 'FindOne',
        taskSettings: {
          method: 'FindOne',
          entity: 'insurance_provider',
          operation: 'FindOne',
          filter: '{ "id": {$.start.params.id} }',
        },
      },
    },
    {
      id: 'sendResponse',
      name: 'Send Response',
      type: 'Response',
      componentType: 'task',
      properties: {
        type: 'Response',
        taskSettings: {
          method: 'Response',
          status: 200,
          message: 'OK',
          data: '{$.readProvider.data}',
        },
      },
    },
  ],
  properties: {
    description: 'Fetch a single insurance provider record by ID.',
    tags: ['provider', 'read'],
  },
})

// ── 2. createRole — start → validator → condition → [create | error] → success

const createRole = wf('00000000-0000-0000-0005-000000000002', 'createRole', {
  sequence: [
    {
      id: 'start',
      name: 'Start',
      type: 'Request',
      componentType: 'task',
      properties: {
        type: 'POST',
        taskSettings: {
          method: 'POST',
        },
      },
    },
    {
      id: 'validatePayload',
      name: 'Validate Payload',
      type: 'Validator',
      componentType: 'task',
      properties: {
        type: 'Validator',
        taskSettings: {
          method: 'Validator',
          columns: [
            { name: 'roleName', value: '{$.start.body.roleName}', operator: 'required' },
            { name: 'roleCode', value: '{$.start.body.roleCode}', operator: 'required' },
          ],
        },
      },
    },
    {
      id: 'checkValid',
      name: 'Check Valid',
      type: 'Condition',
      componentType: 'switch',
      properties: {
        type: 'Condition',
        taskSettings: {
          method: 'Condition',
          columns: [
            { name: 'isValid', value: '{$.validatePayload.data.valid}', operator: '==', dataType: 'boolean' },
          ],
        },
      },
      branches: {
        onSuccess: [
          {
            id: 'createRoleDoc',
            name: 'Create Role Document',
            type: 'Document',
            componentType: 'task',
            properties: {
              type: 'Create',
              taskSettings: {
                method: 'Create',
                entity: 'role',
                operation: 'Create',
                body: '{$.start.body}',
              },
            },
          },
          {
            id: 'successResponse',
            name: 'Success Response',
            type: 'Response',
            componentType: 'task',
            properties: {
              type: 'Response',
              taskSettings: {
                method: 'Response',
                status: 201,
                message: 'Role created',
                data: '{$.createRoleDoc.data}',
              },
            },
          },
        ],
        onFailure: [
          {
            id: 'errorResponse',
            name: 'Validation Error',
            type: 'Response',
            componentType: 'task',
            properties: {
              type: 'Response',
              taskSettings: {
                method: 'Response',
                status: 400,
                message: 'Validation failed',
                data: '{$.validatePayload.data.errors}',
              },
            },
          },
        ],
      },
    },
  ],
  properties: {
    description: 'Create a new role after validating the incoming payload.',
    tags: ['role', 'create', 'validation'],
  },
})

// ── 3. listPaginated — start → query(FindPaging) → resolver → response ────────

const listPaginated = wf('00000000-0000-0000-0005-000000000003', 'listPaginated', {
  sequence: [
    {
      id: 'start',
      name: 'Start',
      type: 'Request',
      componentType: 'task',
      properties: {
        type: 'GET',
        taskSettings: {
          method: 'GET',
        },
      },
    },
    {
      id: 'fetchPage',
      name: 'Fetch Page',
      type: 'Query',
      componentType: 'task',
      properties: {
        type: 'FindPaging',
        taskSettings: {
          method: 'FindPaging',
          entity: 'customer',
          operation: 'FindPaging',
          filter: '{}',
          limit: 20,
          skip: 0,
          sort: { created_at: -1 },
        },
      },
    },
    {
      id: 'buildResult',
      name: 'Build Result',
      type: 'Resolver',
      componentType: 'task',
      properties: {
        type: 'Resolver',
        taskSettings: {
          method: 'Resolver',
          expression: '{ "items": {$.fetchPage.data.items}, "total": {$.fetchPage.data.total} }',
          output: 'result',
        },
      },
    },
    {
      id: 'sendResponse',
      name: 'Send Response',
      type: 'Response',
      componentType: 'task',
      properties: {
        type: 'Response',
        taskSettings: {
          method: 'Response',
          status: 200,
          message: 'OK',
          data: '{$.buildResult.data}',
        },
      },
    },
  ],
  properties: {
    description: 'Return a paginated list of customer records.',
    tags: ['customer', 'list', 'pagination'],
  },
})

export const seedWorkflows: WorkflowArtifact[] = [
  getProviderById,
  createRole,
  listPaginated,
]
