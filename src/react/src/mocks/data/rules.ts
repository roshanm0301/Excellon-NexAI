import type { RuleSet } from '../../config/studioApi'

export const seedRules: RuleSet[] = [
  {
    id: '00000000-0000-0000-0000-000000000301',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    entity_type: 'Customer',
    name: 'Require email for gold-tier customers',
    enabled: true,
    created_at: '2025-03-01T09:00:00Z',
    updated_at: '2025-05-10T12:00:00Z',
    definition: {
      conditions: {
        type: 'AND',
        conditions: [
          {
            type: 'FIELD',
            field: 'tier',
            operator: 'eq',
            value: 'gold',
          },
          {
            type: 'FIELD',
            field: 'email',
            operator: 'isNull',
          },
        ],
      },
      actions: [
        {
          type: 'BLOCK',
          message: 'Gold-tier customers must have a verified email address.',
        },
      ],
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000302',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    entity_type: 'SalesOrder',
    name: 'Warn on large orders without credit check',
    enabled: true,
    created_at: '2025-04-15T10:30:00Z',
    updated_at: '2025-05-20T16:45:00Z',
    definition: {
      conditions: {
        type: 'AND',
        conditions: [
          {
            type: 'FIELD',
            field: 'totalAmount',
            operator: 'gt',
            value: 50000,
          },
        ],
      },
      actions: [
        {
          type: 'WARN',
          message: 'Orders over $50,000 should be reviewed against the customer credit limit.',
        },
        {
          type: 'SET_FIELD',
          field: 'requiresCreditReview',
          value: true,
        },
      ],
    },
  },
]
