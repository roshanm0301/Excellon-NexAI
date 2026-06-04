import { useQuery } from '@tanstack/react-query'
import { Input, Select } from '../../../../../design-system'
import { listArtifacts } from '../../../../../config/studioApi'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface QuerySettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const QUERY_TYPES = [
  { value: 'FindOne', label: 'FindOne' },
  { value: 'FindMany', label: 'FindMany' },
  { value: 'FindPaging', label: 'FindPaging' },
  { value: 'Count', label: 'Count' },
]

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 4,
}

const helpStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--color-text-muted)',
  marginTop: 2,
  marginBottom: 10,
}

export function QuerySettings({ step, onChange }: QuerySettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const queryType = String(settings.queryType ?? 'FindOne')
  const showLimitSkip = queryType === 'FindMany' || queryType === 'FindPaging'
  const showPageSize = queryType === 'FindPaging'

  const { data } = useQuery({
    queryKey: ['artifacts', 'entity_schema', 'active'],
    queryFn: () => listArtifacts({ entity_type: 'entity_schema', status: 'active' }),
  })
  const entities = (data?.items ?? []).map(a => ({ value: a.artifact_name, label: a.artifact_name }))

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Entity */}
      <div>
        <label style={labelStyle}>What entity?</label>
        <Select
          value={String(settings.entityType ?? '')}
          onChange={e => update({ entityType: e.target.value })}
          options={[{ value: '', label: 'Select entity…' }, ...entities]}
        />
        <div style={helpStyle}>The data entity to query.</div>
      </div>

      {/* Query type */}
      <div>
        <label style={labelStyle}>Query type</label>
        <Select
          value={queryType}
          onChange={e => update({ queryType: e.target.value })}
          options={QUERY_TYPES}
        />
        <div style={helpStyle}>
          FindOne = single record · FindMany = array · FindPaging = paginated · Count = number
        </div>
      </div>

      {/* Filter expression */}
      <div>
        <label style={labelStyle}>Filter expression</label>
        <Input
          value={String(settings.filter ?? '')}
          onChange={e => update({ filter: e.target.value })}
          placeholder="{$.body.id}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          JSONata filter expression — e.g. id = {'{$.body.id}'}
        </div>
      </div>

      {/* Sort by */}
      <div>
        <label style={labelStyle}>Sort by</label>
        <Input
          value={String(settings.sortBy ?? '')}
          onChange={e => update({ sortBy: e.target.value })}
          placeholder="createdAt desc"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Field name followed by asc or desc. Example: createdAt desc
        </div>
      </div>

      {/* Limit — FindMany / FindPaging only */}
      {showLimitSkip && (
        <div>
          <label style={labelStyle}>Limit</label>
          <Input
            type="number"
            value={String(settings.limit ?? '')}
            onChange={e => update({ limit: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="20"
            min="1"
            style={{ fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>Maximum number of records to return.</div>
        </div>
      )}

      {/* Skip / Offset — FindMany / FindPaging only */}
      {showLimitSkip && (
        <div>
          <label style={labelStyle}>Skip / Offset</label>
          <Input
            type="number"
            value={String(settings.skip ?? '')}
            onChange={e => update({ skip: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="0"
            min="0"
            style={{ fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>Number of records to skip before returning results.</div>
        </div>
      )}

      {/* Page size — FindPaging only */}
      {showPageSize && (
        <div>
          <label style={labelStyle}>Page size</label>
          <Input
            type="number"
            value={String(settings.pageSize ?? '')}
            onChange={e => update({ pageSize: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="20"
            min="1"
            style={{ fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>
            How many records appear on each page. Used with FindPaging to build cursor-based responses.
          </div>
        </div>
      )}
    </div>
  )
}
