import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ArraySettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'map', label: 'Map (transform each item)' },
  { value: 'filter', label: 'Filter (keep matching items)' },
  { value: 'sort', label: 'Sort' },
  { value: 'groupBy', label: 'Group by' },
  { value: 'flatten', label: 'Flatten' },
  { value: 'distinct', label: 'Distinct (remove duplicates)' },
  { value: 'merge', label: 'Merge arrays' },
]

const SORT_ORDERS = [
  { value: 'ASC', label: 'ASC' },
  { value: 'DESC', label: 'DESC' },
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

export function ArraySettings({ step, onChange }: ArraySettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'map')

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
      <div>
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS}
        />
      </div>

      <div>
        <label style={labelStyle}>Source array</label>
        <Input
          value={String(settings.sourceArray ?? '')}
          onChange={e => update({ sourceArray: e.target.value })}
          placeholder="{$.queryResult.data}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>

      {operation === 'map' && (
        <div>
          <label style={labelStyle}>Transform expression</label>
          <Textarea
            value={String(settings.transformExpr ?? '')}
            onChange={e => update({ transformExpr: e.target.value })}
            placeholder={"{ 'id': $.id, 'name': $.firstName & ' ' & $.lastName }"}
            rows={3}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
        </div>
      )}

      {operation === 'filter' && (
        <div>
          <label style={labelStyle}>Condition expression</label>
          <Input
            value={String(settings.filterExpr ?? '')}
            onChange={e => update({ filterExpr: e.target.value })}
            placeholder="$.status = 'ACTIVE'"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
        </div>
      )}

      {operation === 'sort' && (
        <>
          <div>
            <label style={labelStyle}>Sort by</label>
            <Input
              value={String(settings.sortBy ?? '')}
              onChange={e => update({ sortBy: e.target.value })}
              placeholder="name"
            />
          </div>
          <div>
            <label style={labelStyle}>Order</label>
            <Select
              value={String(settings.sortOrder ?? 'ASC')}
              onChange={e => update({ sortOrder: e.target.value })}
              options={SORT_ORDERS}
            />
          </div>
        </>
      )}

      {operation === 'groupBy' && (
        <div>
          <label style={labelStyle}>Field</label>
          <Input
            value={String(settings.groupByField ?? '')}
            onChange={e => update({ groupByField: e.target.value })}
            placeholder="status"
          />
        </div>
      )}

      {operation === 'distinct' && (
        <div>
          <label style={labelStyle}>Key field (optional)</label>
          <Input
            value={String(settings.distinctKey ?? '')}
            onChange={e => update({ distinctKey: e.target.value })}
            placeholder="id"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>Leave empty to compare whole items.</div>
        </div>
      )}

      {operation === 'merge' && (
        <div>
          <label style={labelStyle}>Second array</label>
          <Input
            value={String(settings.secondArray ?? '')}
            onChange={e => update({ secondArray: e.target.value })}
            placeholder="{$.otherStep.data}"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="result"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>
    </div>
  )
}
