/**
 * DashboardLayoutEditor — Dashboard-specific widget grid configuration
 *
 * For views with surface_type 'dashboard', provides:
 * - Widget grid positioning (row, col, width, height)
 * - Responsive breakpoint configuration
 * - Widget refresh intervals
 */

import { useCallback } from 'react'
import { LayoutDashboard, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import type { ComponentNode } from '../../../types/viewStudio'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WidgetLayout {
  row: number
  col: number
  width: number
  height: number
  min_width?: number
  min_height?: number
}

export interface DashboardConfig {
  columns: number
  row_height: number
  gap: number
  widgets: WidgetSlot[]
}

export interface WidgetSlot {
  component_key: string
  layout: WidgetLayout
  refresh_interval?: number
  title?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardLayoutEditor() {
  const { payload, updateNodeProps } = useCanvasStore()
  const tree = payload?.component_tree

  if (!tree) return null

  const config: DashboardConfig = (tree.props?.__dashboard_config as DashboardConfig) ?? {
    columns: 12,
    row_height: 80,
    gap: 16,
    widgets: [],
  }

  const handleUpdateConfig = useCallback((updated: DashboardConfig) => {
    updateNodeProps(tree.component_key, { __dashboard_config: updated })
  }, [tree.component_key, updateNodeProps])

  const childKeys = (tree.children ?? []).map(c => c.component_key)

  const handleAddWidget = useCallback((childKey: string) => {
    const existing = config.widgets.find(w => w.component_key === childKey)
    if (existing) return

    const newWidget: WidgetSlot = {
      component_key: childKey,
      layout: {
        row: Math.floor(config.widgets.length / 2) * 2,
        col: (config.widgets.length % 2) * 6,
        width: 6,
        height: 2,
      },
    }
    handleUpdateConfig({ ...config, widgets: [...config.widgets, newWidget] })
  }, [config, handleUpdateConfig])

  const handleUpdateWidget = useCallback((idx: number, updated: WidgetSlot) => {
    const widgets = [...config.widgets]
    widgets[idx] = updated
    handleUpdateConfig({ ...config, widgets })
  }, [config, handleUpdateConfig])

  const handleRemoveWidget = useCallback((idx: number) => {
    handleUpdateConfig({ ...config, widgets: config.widgets.filter((_, i) => i !== idx) })
  }, [config, handleUpdateConfig])

  const unmappedChildren = childKeys.filter(k => !config.widgets.some(w => w.component_key === k))

  return (
    <div className="pp-section">
      <div className="pp-section__title">
        <LayoutDashboard size={14} style={{ marginRight: 4 }} />
        Dashboard Grid
      </div>

      {/* Grid config */}
      <div className="ds-filter-row">
        <div className="pp-field" style={{ flex: 1 }}>
          <label className="pp-field__label">Columns</label>
          <input
            type="number"
            className="pp-field__input"
            value={config.columns}
            min={1}
            max={24}
            onChange={e => handleUpdateConfig({ ...config, columns: Number(e.target.value) || 12 })}
          />
        </div>
        <div className="pp-field" style={{ flex: 1 }}>
          <label className="pp-field__label">Row Height</label>
          <input
            type="number"
            className="pp-field__input"
            value={config.row_height}
            min={20}
            onChange={e => handleUpdateConfig({ ...config, row_height: Number(e.target.value) || 80 })}
          />
        </div>
        <div className="pp-field" style={{ flex: 1 }}>
          <label className="pp-field__label">Gap</label>
          <input
            type="number"
            className="pp-field__input"
            value={config.gap}
            min={0}
            onChange={e => handleUpdateConfig({ ...config, gap: Number(e.target.value) || 16 })}
          />
        </div>
      </div>

      {/* Widget slots */}
      <div className="dash-widgets">
        {config.widgets.map((widget, idx) => (
          <WidgetSlotEditor
            key={widget.component_key}
            widget={widget}
            columns={config.columns}
            onUpdate={(w) => handleUpdateWidget(idx, w)}
            onRemove={() => handleRemoveWidget(idx)}
          />
        ))}
      </div>

      {/* Unmapped children */}
      {unmappedChildren.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="pp-field__label">Unmapped Components</div>
          {unmappedChildren.map(key => (
            <div key={key} className="dash-unmapped">
              <span className="dash-unmapped__key">{key}</span>
              <Button variant="ghost" size="sm" onClick={() => handleAddWidget(key)}>
                <Plus size={10} /> Add to Grid
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Widget Slot Editor ──────────────────────────────────────────────────────

function WidgetSlotEditor({
  widget,
  columns,
  onUpdate,
  onRemove,
}: {
  widget: WidgetSlot
  columns: number
  onUpdate: (w: WidgetSlot) => void
  onRemove: () => void
}) {
  return (
    <div className="dash-widget">
      <div className="dash-widget__header">
        <span className="dash-widget__key">{widget.component_key}</span>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 size={10} />
        </Button>
      </div>
      <div className="dash-widget__grid">
        <div className="pp-field">
          <label className="pp-field__label">Col</label>
          <input
            type="number"
            className="pp-field__input"
            value={widget.layout.col}
            min={0}
            max={columns - 1}
            onChange={e => onUpdate({ ...widget, layout: { ...widget.layout, col: Number(e.target.value) } })}
          />
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Row</label>
          <input
            type="number"
            className="pp-field__input"
            value={widget.layout.row}
            min={0}
            onChange={e => onUpdate({ ...widget, layout: { ...widget.layout, row: Number(e.target.value) } })}
          />
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Width</label>
          <input
            type="number"
            className="pp-field__input"
            value={widget.layout.width}
            min={1}
            max={columns}
            onChange={e => onUpdate({ ...widget, layout: { ...widget.layout, width: Number(e.target.value) } })}
          />
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Height</label>
          <input
            type="number"
            className="pp-field__input"
            value={widget.layout.height}
            min={1}
            onChange={e => onUpdate({ ...widget, layout: { ...widget.layout, height: Number(e.target.value) } })}
          />
        </div>
      </div>
      <div className="pp-field">
        <label className="pp-field__label">Refresh Interval (seconds)</label>
        <input
          type="number"
          className="pp-field__input"
          value={widget.refresh_interval ?? ''}
          min={0}
          onChange={e => onUpdate({ ...widget, refresh_interval: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="0 = no auto-refresh"
        />
      </div>
    </div>
  )
}
