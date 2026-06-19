import { useState } from 'react'
import { Drawer, Button, MultiSelect, Spinner } from '../../../design-system'
import type { ComponentNode } from '../../../types/viewStudio'
import { useDistinctFieldValues } from '../../../hooks/useEntityRecords'

interface FilterFieldConfig {
  componentKey: string
  label: string
  fieldKey: string
  entityType: string
}

interface RuntimeFilterDrawerProps {
  open: boolean
  onClose: () => void
  entityType: string
  drawerNode: ComponentNode
  filters: Record<string, string[]>
  onApply: (filters: Record<string, string[]>) => void
}

function FilterField({
  config,
  value,
  onChange,
}: {
  config: FilterFieldConfig
  value: string[]
  onChange: (vals: string[]) => void
}) {
  const { data, isLoading } = useDistinctFieldValues(config.entityType, config.fieldKey)
  const options = (data?.values ?? []).map(v => ({ value: v, label: v }))

  if (isLoading) {
    return (
      <div className="rv-filter-section">
        <h4>{config.label}</h4>
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="rv-filter-section">
      <MultiSelect
        label={config.label}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={`Select ${config.label.toLowerCase()}…`}
      />
    </div>
  )
}

export function RuntimeFilterDrawer({
  open, onClose, entityType, drawerNode, filters, onApply,
}: RuntimeFilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(() => ({ ...filters }))

  const filterFields: FilterFieldConfig[] = (drawerNode.children ?? [])
    .filter(child => child.props?.options_source === 'distinct' && child.props?.field_key)
    .map(child => ({
      componentKey: child.component_key,
      label: String(child.props?.label ?? child.props?.field_key ?? ''),
      fieldKey: String(child.props?.field_key ?? ''),
      entityType: String(child.props?.entity ?? entityType),
    }))

  const handleApply = () => {
    onApply(localFilters)
  }

  const handleClear = () => {
    const cleared: Record<string, string[]> = {}
    filterFields.forEach(f => { cleared[f.fieldKey] = [] })
    setLocalFilters(cleared)
    onApply(cleared)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filter Products"
      width={400}
      footer={
        <div className="rv-filter-drawer-footer">
          <Button variant="secondary" size="sm" onClick={handleClear} data-testid="rv-filter-clear">
            Clear All
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply} data-testid="rv-filter-apply">
            Apply Filters
          </Button>
        </div>
      }
    >
      {filterFields.map(field => (
        <FilterField
          key={field.componentKey}
          config={field}
          value={localFilters[field.fieldKey] ?? []}
          onChange={vals => setLocalFilters(prev => ({ ...prev, [field.fieldKey]: vals }))}
        />
      ))}
    </Drawer>
  )
}
