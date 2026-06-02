/**
 * EventEditor — Interactive event definition builder
 *
 * Allows users to configure event handlers for a component:
 * - Select event type (from registry emits list)
 * - Add conditions (simple field matching)
 * - Configure actions (set_field, show/hide, navigate, etc.)
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import type {
  EventDefinition,
  EventAction,
  EventType,
  ActionType,
  ComponentRegistryEntry,
} from '../../../types/viewStudio'

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'on_load', label: 'On Load' },
  { value: 'on_change', label: 'On Change' },
  { value: 'on_click', label: 'On Click' },
  { value: 'on_submit', label: 'On Submit' },
  { value: 'on_focus', label: 'On Focus' },
  { value: 'on_blur', label: 'On Blur' },
  { value: 'on_validate', label: 'On Validate' },
  { value: 'on_row_select', label: 'On Row Select' },
  { value: 'on_status_change', label: 'On Status Change' },
  { value: 'on_field_change', label: 'On Field Change' },
  { value: 'on_save_success', label: 'On Save Success' },
  { value: 'on_save_error', label: 'On Save Error' },
  { value: 'on_delete', label: 'On Delete' },
  { value: 'on_modal_open', label: 'On Modal Open' },
  { value: 'on_modal_close', label: 'On Modal Close' },
]

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'set_field', label: 'Set Field Value' },
  { value: 'show_field', label: 'Show Component' },
  { value: 'hide_field', label: 'Hide Component' },
  { value: 'enable_field', label: 'Enable Component' },
  { value: 'disable_field', label: 'Disable Component' },
  { value: 'set_required', label: 'Set Required' },
  { value: 'clear_required', label: 'Clear Required' },
  { value: 'navigate', label: 'Navigate' },
  { value: 'open_modal', label: 'Open Modal' },
  { value: 'close_modal', label: 'Close Modal' },
  { value: 'refresh_datasource', label: 'Refresh Data Source' },
  { value: 'show_toast', label: 'Show Toast' },
  { value: 'trigger_validation', label: 'Trigger Validation' },
  { value: 'call_api', label: 'Call API' },
  { value: 'set_filter', label: 'Set Filter' },
  { value: 'reset_form', label: 'Reset Form' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function EventEditor({ registryEntry }: { registryEntry?: ComponentRegistryEntry | null }) {
  const { payload } = useCanvasStore()
  const setEvents = useCanvasStore(s => s.setEvents)
  const { selectedKey } = useCanvasStore()

  const events = payload?.events ?? []
  const componentEvents = events.filter(e => e.source_field === selectedKey)
  const emits = registryEntry?.event_support?.emits ?? []

  const handleAddEvent = useCallback(() => {
    const newEvent: EventDefinition = {
      event_type: emits[0] ?? 'on_click',
      source_field: selectedKey ?? undefined,
      actions: [],
      priority: 100,
      is_active: true,
    }
    setEvents([...events, newEvent])
  }, [events, emits, selectedKey, setEvents])

  const handleUpdateEvent = useCallback((index: number, updated: EventDefinition) => {
    const globalIndex = events.findIndex((e, i) => {
      // Match by checking it's one of the component's events
      const compEvents = events.filter(ev => ev.source_field === selectedKey)
      return e === compEvents[index] || i === events.indexOf(compEvents[index])
    })
    if (globalIndex === -1) return
    const newEvents = [...events]
    newEvents[globalIndex] = updated
    setEvents(newEvents)
  }, [events, selectedKey, setEvents])

  const handleRemoveEvent = useCallback((index: number) => {
    const compEvents = events.filter(e => e.source_field === selectedKey)
    const target = compEvents[index]
    setEvents(events.filter(e => e !== target))
  }, [events, selectedKey, setEvents])

  return (
    <div className="pp-section">
      <div className="pp-section__title">
        <Zap size={14} style={{ marginRight: 4 }} />
        Event Handlers
      </div>

      {/* Available events info */}
      {emits.length > 0 && (
        <div className="ee-emits">
          <span className="ee-emits__label">This component emits:</span>
          <div className="ee-emits__list">
            {emits.map(evt => (
              <span key={evt} className="ee-emit-badge">{evt}</span>
            ))}
          </div>
        </div>
      )}

      {emits.length === 0 && componentEvents.length === 0 && (
        <p className="pp-empty-msg">This component does not emit any events.</p>
      )}

      {/* Event definitions */}
      {componentEvents.map((def, idx) => (
        <EventDefinitionRow
          key={idx}
          definition={def}
          availableEvents={emits}
          onUpdate={(updated) => handleUpdateEvent(idx, updated)}
          onRemove={() => handleRemoveEvent(idx)}
        />
      ))}

      {/* Add event button */}
      {emits.length > 0 && (
        <Button variant="ghost" size="sm" onClick={handleAddEvent} style={{ marginTop: '0.5rem' }}>
          <Plus size={12} /> Add Event Handler
        </Button>
      )}
    </div>
  )
}

// ─── Event Definition Row ────────────────────────────────────────────────────

function EventDefinitionRow({
  definition,
  availableEvents,
  onUpdate,
  onRemove,
}: {
  definition: EventDefinition
  availableEvents: string[]
  onUpdate: (def: EventDefinition) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="ee-def">
      <div className="ee-def__header">
        <button className="ee-def__toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <select
          className="pp-field__input ee-def__type"
          value={definition.event_type}
          onChange={e => onUpdate({ ...definition, event_type: e.target.value as EventType })}
        >
          {availableEvents.map(evt => {
            const info = EVENT_TYPES.find(t => t.value === evt)
            return <option key={evt} value={evt}>{info?.label ?? evt}</option>
          })}
          {/* Also show all types for custom wiring */}
          <optgroup label="All Event Types">
            {EVENT_TYPES.filter(t => !availableEvents.includes(t.value)).map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </optgroup>
        </select>
        <Button variant="ghost" size="sm" onClick={onRemove} title="Remove event">
          <Trash2 size={12} />
        </Button>
      </div>

      {expanded && (
        <div className="ee-def__body">
          {/* Active toggle */}
          <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id={`ee-active-${definition.event_type}`}
              checked={definition.is_active !== false}
              onChange={e => onUpdate({ ...definition, is_active: e.target.checked })}
            />
            <label htmlFor={`ee-active-${definition.event_type}`} className="pp-field__label" style={{ marginBottom: 0 }}>
              Active
            </label>
          </div>

          {/* Priority */}
          <div className="pp-field">
            <label className="pp-field__label">Priority</label>
            <input
              type="number"
              className="pp-field__input"
              value={definition.priority ?? 100}
              min={0}
              max={999}
              onChange={e => onUpdate({ ...definition, priority: Number(e.target.value) })}
            />
          </div>

          {/* Actions */}
          <div className="ee-actions">
            <div className="ee-actions__title">Actions</div>
            {(definition.actions ?? []).map((action, idx) => (
              <ActionRow
                key={idx}
                action={action}
                onUpdate={(a) => {
                  const newActions = [...(definition.actions ?? [])]
                  newActions[idx] = a
                  onUpdate({ ...definition, actions: newActions })
                }}
                onRemove={() => {
                  const newActions = (definition.actions ?? []).filter((_, i) => i !== idx)
                  onUpdate({ ...definition, actions: newActions })
                }}
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newAction: EventAction = { action_type: 'set_field', target: '' }
                onUpdate({ ...definition, actions: [...(definition.actions ?? []), newAction] })
              }}
            >
              <Plus size={10} /> Add Action
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Action Row ──────────────────────────────────────────────────────────────

function ActionRow({
  action,
  onUpdate,
  onRemove,
}: {
  action: EventAction
  onUpdate: (a: EventAction) => void
  onRemove: () => void
}) {
  return (
    <div className="ee-action">
      <div className="ee-action__row">
        <select
          className="pp-field__input"
          value={action.action_type}
          onChange={e => onUpdate({ ...action, action_type: e.target.value as ActionType })}
        >
          {ACTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={onRemove} title="Remove action">
          <Trash2 size={10} />
        </Button>
      </div>

      {/* Target */}
      <div className="pp-field">
        <label className="pp-field__label">Target</label>
        <input
          type="text"
          className="pp-field__input"
          value={action.target ?? ''}
          onChange={e => onUpdate({ ...action, target: e.target.value || undefined })}
          placeholder="component_key or field_key"
        />
      </div>

      {/* Payload for set_field and show_toast */}
      {(action.action_type === 'set_field' || action.action_type === 'show_toast' || action.action_type === 'navigate') && (
        <div className="pp-field">
          <label className="pp-field__label">
            {action.action_type === 'set_field' ? 'Value' : action.action_type === 'navigate' ? 'Path' : 'Message'}
          </label>
          <input
            type="text"
            className="pp-field__input"
            value={action.payload?.value !== undefined ? String(action.payload.value) : ''}
            onChange={e => onUpdate({ ...action, payload: { ...action.payload, value: e.target.value } })}
            placeholder={action.action_type === 'navigate' ? '/path/to/page' : 'value'}
          />
        </div>
      )}
    </div>
  )
}
