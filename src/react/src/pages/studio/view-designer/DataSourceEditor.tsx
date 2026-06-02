/**
 * DataSourceEditor — Interactive data source configuration panel
 *
 * Manages the view's data sources: base entity, filters, sorting, joins, and pagination.
 * Each view can have multiple data sources (e.g., main entity + related lists).
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, Database, ChevronDown, ChevronRight, Filter, ArrowUpDown, Link, Layers } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import type { DataSourceConfig, FilterConfig, SortConfig, JoinConfig, PaginationConfig } from '../../../types/viewStudio'

// ─── Constants ───────────────────────────────────────────────────────────────

const FILTER_OPERATORS: { value: FilterConfig['operator']; label: string }[] = [
  { value: 'eq', label: '= equals' },
  { value: 'neq', label: '≠ not equals' },
  { value: 'gt', label: '> greater than' },
  { value: 'gte', label: '≥ greater or equal' },
  { value: 'lt', label: '< less than' },
  { value: 'lte', label: '≤ less or equal' },
  { value: 'in', label: '∈ in list' },
  { value: 'not_in', label: '∉ not in list' },
  { value: 'contains', label: '~ contains' },
  { value: 'starts_with', label: '^= starts with' },
]

const JOIN_TYPES: { value: JoinConfig['type']; label: string }[] = [
  { value: 'inner', label: 'Inner Join' },
  { value: 'left', label: 'Left Join' },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export function DataSourceEditor() {
  const { payload } = useCanvasStore()
  const setDataSources = useCanvasStore(s => s.setDataSources)
  const datasources = payload?.datasources ?? []

  const handleAdd = useCallback(() => {
    const newDs: DataSourceConfig = {
      source_key: `ds_${Date.now().toString(36)}`,
      base_entity: '',
      filters: [],
      sort: [],
      joins: [],
      pagination: { page_size: 25 },
    }
    setDataSources([...datasources, newDs])
  }, [datasources, setDataSources])

  const handleUpdate = useCallback((index: number, updated: DataSourceConfig) => {
    const newList = [...datasources]
    newList[index] = updated
    setDataSources(newList)
  }, [datasources, setDataSources])

  const handleRemove = useCallback((index: number) => {
    setDataSources(datasources.filter((_, i) => i !== index))
  }, [datasources, setDataSources])

  return (
    <div className="ds-editor">
      <div className="ds-editor__header">
        <div className="pp-section__title">
          <Database size={14} style={{ marginRight: 4 }} />
          Data Sources
        </div>
        <Button variant="ghost" size="sm" onClick={handleAdd}>
          <Plus size={12} /> Add
        </Button>
      </div>

      {datasources.length === 0 && (
        <p className="pp-empty-msg">
          No data sources configured. Add one to connect this view to entity data.
        </p>
      )}

      {datasources.map((ds, idx) => (
        <DataSourceCard
          key={ds.source_key}
          datasource={ds}
          onUpdate={(updated) => handleUpdate(idx, updated)}
          onRemove={() => handleRemove(idx)}
        />
      ))}
    </div>
  )
}

// ─── DataSource Card ─────────────────────────────────────────────────────────

function DataSourceCard({
  datasource,
  onUpdate,
  onRemove,
}: {
  datasource: DataSourceConfig
  onUpdate: (ds: DataSourceConfig) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [activeSection, setActiveSection] = useState<'filters' | 'sort' | 'joins' | 'pagination'>('filters')

  return (
    <div className="ds-card">
      <div className="ds-card__header">
        <button className="ds-card__toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <span className="ds-card__key">{datasource.source_key}</span>
        <Button variant="ghost" size="sm" onClick={onRemove} title="Remove data source">
          <Trash2 size={12} />
        </Button>
      </div>

      {expanded && (
        <div className="ds-card__body">
          {/* Base entity */}
          <div className="pp-field">
            <label className="pp-field__label">Source Key</label>
            <input
              type="text"
              className="pp-field__input"
              value={datasource.source_key}
              onChange={e => onUpdate({ ...datasource, source_key: e.target.value })}
            />
          </div>
          <div className="pp-field">
            <label className="pp-field__label">Base Entity</label>
            <input
              type="text"
              className="pp-field__input"
              value={datasource.base_entity}
              onChange={e => onUpdate({ ...datasource, base_entity: e.target.value })}
              placeholder="e.g., customer, order"
            />
          </div>

          {/* Section tabs */}
          <div className="ds-sections">
            <button
              className={`ds-section-tab ${activeSection === 'filters' ? 'ds-section-tab--active' : ''}`}
              onClick={() => setActiveSection('filters')}
            >
              <Filter size={11} /> Filters ({datasource.filters?.length ?? 0})
            </button>
            <button
              className={`ds-section-tab ${activeSection === 'sort' ? 'ds-section-tab--active' : ''}`}
              onClick={() => setActiveSection('sort')}
            >
              <ArrowUpDown size={11} /> Sort ({datasource.sort?.length ?? 0})
            </button>
            <button
              className={`ds-section-tab ${activeSection === 'joins' ? 'ds-section-tab--active' : ''}`}
              onClick={() => setActiveSection('joins')}
            >
              <Link size={11} /> Joins ({datasource.joins?.length ?? 0})
            </button>
            <button
              className={`ds-section-tab ${activeSection === 'pagination' ? 'ds-section-tab--active' : ''}`}
              onClick={() => setActiveSection('pagination')}
            >
              <Layers size={11} /> Page
            </button>
          </div>

          {/* Section content */}
          {activeSection === 'filters' && (
            <FiltersSection
              filters={datasource.filters ?? []}
              onChange={(filters) => onUpdate({ ...datasource, filters })}
            />
          )}
          {activeSection === 'sort' && (
            <SortSection
              sort={datasource.sort ?? []}
              onChange={(sort) => onUpdate({ ...datasource, sort })}
            />
          )}
          {activeSection === 'joins' && (
            <JoinsSection
              joins={datasource.joins ?? []}
              onChange={(joins) => onUpdate({ ...datasource, joins })}
            />
          )}
          {activeSection === 'pagination' && (
            <PaginationSection
              pagination={datasource.pagination ?? { page_size: 25 }}
              onChange={(pagination) => onUpdate({ ...datasource, pagination })}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Filters Section ─────────────────────────────────────────────────────────

function FiltersSection({
  filters,
  onChange,
}: {
  filters: FilterConfig[]
  onChange: (f: FilterConfig[]) => void
}) {
  const addFilter = () => {
    onChange([...filters, { field: '', operator: 'eq', value: '' }])
  }

  const updateFilter = (idx: number, updated: FilterConfig) => {
    const newFilters = [...filters]
    newFilters[idx] = updated
    onChange(newFilters)
  }

  const removeFilter = (idx: number) => {
    onChange(filters.filter((_, i) => i !== idx))
  }

  return (
    <div className="ds-section-content">
      {filters.map((f, idx) => (
        <div key={idx} className="ds-filter-row">
          <input
            type="text"
            className="pp-field__input"
            value={f.field}
            onChange={e => updateFilter(idx, { ...f, field: e.target.value })}
            placeholder="field"
            style={{ flex: 2 }}
          />
          <select
            className="pp-field__input"
            value={f.operator}
            onChange={e => updateFilter(idx, { ...f, operator: e.target.value as FilterConfig['operator'] })}
            style={{ flex: 2 }}
          >
            {FILTER_OPERATORS.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
          <input
            type="text"
            className="pp-field__input"
            value={String(f.value ?? '')}
            onChange={e => updateFilter(idx, { ...f, value: e.target.value })}
            placeholder="value"
            style={{ flex: 2 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem' }}>
            <input
              type="checkbox"
              checked={f.is_dynamic ?? false}
              onChange={e => updateFilter(idx, { ...f, is_dynamic: e.target.checked })}
            />
            Dyn
          </label>
          <Button variant="ghost" size="sm" onClick={() => removeFilter(idx)}>
            <Trash2 size={10} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addFilter}>
        <Plus size={10} /> Add Filter
      </Button>
    </div>
  )
}

// ─── Sort Section ────────────────────────────────────────────────────────────

function SortSection({
  sort,
  onChange,
}: {
  sort: SortConfig[]
  onChange: (s: SortConfig[]) => void
}) {
  const addSort = () => {
    onChange([...sort, { field: '', direction: 'asc' }])
  }

  return (
    <div className="ds-section-content">
      {sort.map((s, idx) => (
        <div key={idx} className="ds-filter-row">
          <input
            type="text"
            className="pp-field__input"
            value={s.field}
            onChange={e => {
              const ns = [...sort]
              ns[idx] = { ...s, field: e.target.value }
              onChange(ns)
            }}
            placeholder="field"
            style={{ flex: 3 }}
          />
          <select
            className="pp-field__input"
            value={s.direction}
            onChange={e => {
              const ns = [...sort]
              ns[idx] = { ...s, direction: e.target.value as 'asc' | 'desc' }
              onChange(ns)
            }}
            style={{ flex: 2 }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => onChange(sort.filter((_, i) => i !== idx))}>
            <Trash2 size={10} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addSort}>
        <Plus size={10} /> Add Sort
      </Button>
    </div>
  )
}

// ─── Joins Section ───────────────────────────────────────────────────────────

function JoinsSection({
  joins,
  onChange,
}: {
  joins: JoinConfig[]
  onChange: (j: JoinConfig[]) => void
}) {
  const addJoin = () => {
    onChange([...joins, { entity: '', local_field: '', foreign_field: '', type: 'left' }])
  }

  const updateJoin = (idx: number, updated: JoinConfig) => {
    const newJoins = [...joins]
    newJoins[idx] = updated
    onChange(newJoins)
  }

  return (
    <div className="ds-section-content">
      {joins.map((j, idx) => (
        <div key={idx} className="ds-join-row">
          <div className="ds-join-row__fields">
            <select
              className="pp-field__input"
              value={j.type}
              onChange={e => updateJoin(idx, { ...j, type: e.target.value as JoinConfig['type'] })}
            >
              {JOIN_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              className="pp-field__input"
              value={j.entity}
              onChange={e => updateJoin(idx, { ...j, entity: e.target.value })}
              placeholder="entity"
            />
            <input
              type="text"
              className="pp-field__input"
              value={j.local_field}
              onChange={e => updateJoin(idx, { ...j, local_field: e.target.value })}
              placeholder="local field"
            />
            <input
              type="text"
              className="pp-field__input"
              value={j.foreign_field}
              onChange={e => updateJoin(idx, { ...j, foreign_field: e.target.value })}
              placeholder="foreign field"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange(joins.filter((_, i) => i !== idx))}>
            <Trash2 size={10} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addJoin}>
        <Plus size={10} /> Add Join
      </Button>
    </div>
  )
}

// ─── Pagination Section ──────────────────────────────────────────────────────

function PaginationSection({
  pagination,
  onChange,
}: {
  pagination: PaginationConfig
  onChange: (p: PaginationConfig) => void
}) {
  return (
    <div className="ds-section-content">
      <div className="pp-field">
        <label className="pp-field__label">Page Size</label>
        <input
          type="number"
          className="pp-field__input"
          value={pagination.page_size}
          min={1}
          max={500}
          onChange={e => onChange({ ...pagination, page_size: Number(e.target.value) || 25 })}
        />
      </div>
      <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="ds-infinite"
          checked={pagination.infinite_scroll ?? false}
          onChange={e => onChange({ ...pagination, infinite_scroll: e.target.checked })}
        />
        <label htmlFor="ds-infinite" className="pp-field__label" style={{ marginBottom: 0 }}>
          Infinite Scroll
        </label>
      </div>
    </div>
  )
}
