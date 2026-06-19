/**
 * EventEditor — Interactive event definition builder
 *
 * Allows users to configure event handlers for a component:
 * - Select event type (from registry emits list, or all types as fallback)
 * - Set active flag, priority, and optional fire condition
 * - Add actions with structured payload editors per action type group
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

// Which action types need structured payload beyond a simple target input
type ActionGroup = 'target_only' | 'set_field' | 'show_toast' | 'navigate' | 'call_api' | 'set_filter'

function getActionGroup(type: ActionType): ActionGroup {
  if (type === 'set_field') return 'set_field'
  if (type === 'show_toast') return 'show_toast'
  if (type === 'navigate') return 'navigate'
  if (type === 'call_api') return 'call_api'
  if (type === 'set_filter') return 'set_filter'
  return 'target_only'
}

const FILTER_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'starts_with']
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const TOAST_VARIANTS = ['info', 'success', 'error', 'warning']

// Simple deterministic ID (avoids Date.now() in test environments)
let _eventCounter = 0
function genEventId() {
  _eventCounter++
  return `evt_${Date.now()}_${_eventCounter.toString(36)}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EventEditor({ registryEntry }: { registryEntry?: ComponentRegistryEntry | null }) {
  const { payload } = useCanvasStore()
  const setEvents = useCanvasStore(s => s.setEvents)
  const { selectedKey } = useCanvasStore()

  const events = (payload?.events ?? []) as EventDefinition[]
  const componentEvents = events.filter((e: EventDefinition) => e.source_field === selectedKey)
  const emits = (registryEntry?.event_support?.emits ?? []) as EventType[]

  // Fall back to all event types when component has no emits list
  const availableEvents: EventType[] = emits.length > 0 ? emits : EVENT_TYPES.map(t => t.value)

  const handleAddEvent = useCallback(() => {
    const newEvent: EventDefinition = {
      event_id: genEventId(),
      event_type: (availableEvents[0] ?? 'on_click') as EventType,
      source_field: selectedKey ?? undefined,
      actions: [],
      priority: 100,
      is_active: true,
    }
    setEvents([...events, newEvent])
  }, [events, availableEvents, selectedKey, setEvents])

  const handleUpdateEvent = useCallback((index: number, updated: EventDefinition) => {
    const compEvents = events.filter((ev: EventDefinition) => ev.source_field === selectedKey)
    const target = compEvents[index]
    const globalIndex = events.indexOf(target)
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
    <div className="pp-section" data-testid="event-editor">
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

      {componentEvents.length === 0 && (
        <p className="pp-empty-msg">
          No event handlers. Add one to respond to user interactions.
        </p>
      )}

      {/* Event definitions */}
      {componentEvents.map((def, idx) => (
        <EventDefinitionRow
          key={def.event_id ?? idx}
          definition={def}
          availableEvents={availableEvents}
          onUpdate={(updated) => handleUpdateEvent(idx, updated)}
          onRemove={() => handleRemoveEvent(idx)}
        />
      ))}

      {/* Add event button — always visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddEvent}
        style={{ marginTop: '0.5rem' }}
        data-testid="ee-add-event-btn"
      >
        <Plus size={12} /> Add Event Handler
      </Button>
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
  availableEvents: EventType[]
  onUpdate: (def: EventDefinition) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  // Derive condition type from stored conditions object
  const conditions = definition.conditions as { type?: string; field?: string; value?: unknown; roles?: string[] } | undefined
  const condType = conditions?.type ?? ''

  const handleConditionTypeChange = (newType: string) => {
    if (!newType) {
      onUpdate({ ...definition, conditions: undefined })
    } else if (newType === 'field_equals') {
      onUpdate({ ...definition, conditions: { type: 'field_equals', field: '', value: '' } })
    } else if (newType === 'role_in') {
      onUpdate({ ...definition, conditions: { type: 'role_in', roles: [] } })
    }
  }

  return (
    <div className="ee-def" data-testid="ee-def-row">
      <div className="ee-def__header">
        <button className="ee-def__toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <select
          className="pp-field__input ee-def__type"
          value={definition.event_type}
          onChange={e => onUpdate({ ...definition, event_type: e.target.value as EventType })}
          data-testid="ee-event-type-select"
        >
          {availableEvents.map(evt => {
            const info = EVENT_TYPES.find(t => t.value === evt)
            return <option key={evt} value={evt}>{info?.label ?? evt}</option>
          })}
          {/* Also show all types for custom wiring when emits list is set */}
          {availableEvents.length < EVENT_TYPES.length && (
            <optgroup label="All Event Types">
              {EVENT_TYPES.filter(t => !availableEvents.includes(t.value)).map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
          )}
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
              id={`ee-active-${definition.event_id ?? definition.event_type}`}
              checked={definition.is_active !== false}
              onChange={e => onUpdate({ ...definition, is_active: e.target.checked })}
            />
            <label
              htmlFor={`ee-active-${definition.event_id ?? definition.event_type}`}
              className="pp-field__label"
              style={{ marginBottom: 0 }}
            >
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

          {/* Condition */}
          <div className="pp-field ee-condition" data-testid="ee-condition-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="pp-field__label" style={{ marginBottom: 0 }}>Fire condition</label>
            </div>
            <select
              className="pp-field__input"
              value={condType}
              onChange={e => handleConditionTypeChange(e.target.value)}
              data-testid="ee-condition-type-select"
            >
              <option value="">Always fires</option>
              <option value="field_equals">Field equals</option>
              <option value="role_in">Role is</option>
            </select>
            {condType === 'field_equals' && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <input
                  type="text"
                  className="pp-field__input"
                  style={{ flex: 1 }}
                  placeholder="Field key"
                  value={(conditions?.field as string) ?? ''}
                  onChange={e => onUpdate({
                    ...definition,
                    conditions: { ...conditions, type: 'field_equals', field: e.target.value },
                  })}
                  data-testid="ee-condition-field"
                />
                <input
                  type="text"
                  className="pp-field__input"
                  style={{ flex: 1 }}
                  placeholder="Value"
                  value={conditions?.value !== undefined ? String(conditions.value) : ''}
                  onChange={e => onUpdate({
                    ...definition,
                    conditions: { ...conditions, type: 'field_equals', value: e.target.value },
                  })}
                  data-testid="ee-condition-value"
                />
              </div>
            )}
            {condType === 'role_in' && (
              <input
                type="text"
                className="pp-field__input"
                style={{ marginTop: 4 }}
                placeholder="Roles (comma-separated, e.g. admin,manager)"
                value={((conditions?.roles as string[]) ?? []).join(',')}
                onChange={e => onUpdate({
                  ...definition,
                  conditions: { type: 'role_in', roles: e.target.value.split(',').map(r => r.trim()).filter(Boolean) },
                })}
                data-testid="ee-condition-roles"
              />
            )}
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
              data-testid="ee-add-action-btn"
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
  const group = getActionGroup(action.action_type)

  return (
    <div className="ee-action" data-testid="ee-action-row">
      {/* Action type selector + delete */}
      <div className="ee-action__row">
        <select
          className="pp-field__input"
          value={action.action_type}
          onChange={e => onUpdate({ action_type: e.target.value as ActionType, target: '', payload: {} })}
          data-testid="ee-action-type-select"
        >
          {ACTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={onRemove} title="Remove action">
          <Trash2 size={10} />
        </Button>
      </div>

      {/* Group 1: target_only — component_key input */}
      {group === 'target_only' && (
        <div className="pp-field">
          <label className="pp-field__label">Target component key</label>
          <input
            type="text"
            className="pp-field__input"
            value={action.target ?? ''}
            onChange={e => onUpdate({ ...action, target: e.target.value || undefined })}
            placeholder="component_key"
            data-testid="ee-action-target"
          />
        </div>
      )}

      {/* Group 2: set_field — field key + value */}
      {group === 'set_field' && (
        <>
          <div className="pp-field">
            <label className="pp-field__label">Field key (target)</label>
            <input
              type="text"
              className="pp-field__input"
              value={action.target ?? ''}
              onChange={e => onUpdate({ ...action, target: e.target.value || undefined })}
              placeholder="e.g., customer_name"
              data-testid="ee-action-target"
            />
          </div>
          <div className="pp-field">
            <label className="pp-field__label">Value to set</label>
            <input
              type="text"
              className="pp-field__input"
              value={action.payload?.value !== undefined ? String(action.payload.value) : ''}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, value: e.target.value } })}
              placeholder="Static value or expression"
              data-testid="ee-action-value"
            />
          </div>
        </>
      )}

      {/* Group 3: show_toast — message + variant */}
      {group === 'show_toast' && (
        <>
          <div className="pp-field">
            <label className="pp-field__label">Message</label>
            <input
              type="text"
              className="pp-field__input"
              value={(action.payload?.message as string) ?? ''}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, message: e.target.value } })}
              placeholder="Toast message text"
              data-testid="ee-action-toast-message"
            />
          </div>
          <div className="pp-field">
            <label className="pp-field__label">Variant</label>
            <select
              className="pp-field__input"
              value={(action.payload?.variant as string) ?? 'info'}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, variant: e.target.value } })}
              data-testid="ee-action-toast-variant"
            >
              {TOAST_VARIANTS.map(v => (
                <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Group 4: navigate — URL + new tab */}
      {group === 'navigate' && (
        <>
          <div className="pp-field">
            <label className="pp-field__label">URL or route</label>
            <input
              type="text"
              className="pp-field__input"
              value={(action.payload?.url as string) ?? ''}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, url: e.target.value } })}
              placeholder="/path/to/page or https://..."
              data-testid="ee-action-nav-url"
            />
          </div>
          <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="ee-action-new-tab"
              checked={(action.payload?.open_in_new_tab as boolean) ?? false}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, open_in_new_tab: e.target.checked } })}
              data-testid="ee-action-nav-new-tab"
            />
            <label htmlFor="ee-action-new-tab" className="pp-field__label" style={{ marginBottom: 0 }}>
              Open in new tab
            </label>
          </div>
        </>
      )}

      {/* Group 5: call_api — method + endpoint */}
      {group === 'call_api' && (
        <>
          <div className="pp-field">
            <label className="pp-field__label">HTTP method</label>
            <select
              className="pp-field__input"
              value={(action.payload?.method as string) ?? 'GET'}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, method: e.target.value } })}
              data-testid="ee-action-api-method"
            >
              {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="pp-field">
            <label className="pp-field__label">Endpoint URL</label>
            <input
              type="text"
              className="pp-field__input"
              value={(action.payload?.endpoint as string) ?? ''}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, endpoint: e.target.value } })}
              placeholder="/api/v1/resource or https://..."
              data-testid="ee-action-api-endpoint"
            />
          </div>
        </>
      )}

      {/* Group 6: set_filter — datasource target + field + operator + value */}
      {group === 'set_filter' && (
        <>
          <div className="pp-field">
            <label className="pp-field__label">Datasource key</label>
            <input
              type="text"
              className="pp-field__input"
              value={action.target ?? ''}
              onChange={e => onUpdate({ ...action, target: e.target.value || undefined })}
              placeholder="datasource_key"
              data-testid="ee-action-filter-ds"
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div className="pp-field" style={{ flex: 1 }}>
              <label className="pp-field__label">Field</label>
              <input
                type="text"
                className="pp-field__input"
                value={(action.payload?.field as string) ?? ''}
                onChange={e => onUpdate({ ...action, payload: { ...action.payload, field: e.target.value } })}
                placeholder="field_key"
                data-testid="ee-action-filter-field"
              />
            </div>
            <div className="pp-field" style={{ flex: 1 }}>
              <label className="pp-field__label">Operator</label>
              <select
                className="pp-field__input"
                value={(action.payload?.operator as string) ?? 'eq'}
                onChange={e => onUpdate({ ...action, payload: { ...action.payload, operator: e.target.value } })}
                data-testid="ee-action-filter-operator"
              >
                {FILTER_OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
          </div>
          <div className="pp-field">
            <label className="pp-field__label">Value</label>
            <input
              type="text"
              className="pp-field__input"
              value={(action.payload?.value as string) ?? ''}
              onChange={e => onUpdate({ ...action, payload: { ...action.payload, value: e.target.value } })}
              placeholder="Filter value"
              data-testid="ee-action-filter-value"
            />
          </div>
        </>
      )}
    </div>
  )
}
