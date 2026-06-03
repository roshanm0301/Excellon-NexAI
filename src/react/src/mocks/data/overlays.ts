const TS = '2026-06-03T00:00:00.000Z'

export interface OverlaySeed {
  id: string
  layer: string
  artifact_type: string
  artifact_key: string
  scope_key: string
  delta: Record<string, unknown>
  created_at: string
  created_by: string
}

export const seedOverlays: OverlaySeed[] = [
  {
    id: '00000000-0000-0000-0003-000000000001',
    layer: 'platform',
    artifact_type: 'entity_schema',
    artifact_key: 'sale_order',
    scope_key: 'global',
    delta: {
      settings: {
        auditRetentionDays: 2555,
        softDelete: true,
      },
    },
    created_at: TS,
    created_by: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '00000000-0000-0000-0003-000000000002',
    layer: 'vertical',
    artifact_type: 'entity_schema',
    artifact_key: 'sale_order',
    scope_key: 'india-automobile',
    delta: {
      fields: {
        gstin: { required: true, label: 'Customer GSTIN (India GST)' },
        placeOfSupply: { required: true, label: 'Place of Supply (State)' },
      },
      settings: {
        currencyCode: 'INR',
        taxSystem: 'GST',
        verticalLabel: 'India Automobile',
      },
    },
    created_at: TS,
    created_by: '00000000-0000-0000-0000-000000000001',
  },
]
