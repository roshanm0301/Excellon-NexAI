/**
 * WizardStepEditor — Wizard surface step configuration
 *
 * For views with surface_type 'wizard', provides:
 * - Step ordering and labels
 * - Step validation rules
 * - Conditional step skip logic
 * - Step completion criteria
 */

import { useCallback } from 'react'
import { Plus, Trash2, GripVertical, Wand2 } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WizardStep {
  step_key: string
  label: string
  description?: string
  component_key: string
  is_optional?: boolean
  skip_condition?: string
  validation_expression?: string
}

export interface WizardConfig {
  steps: WizardStep[]
  allow_back_navigation: boolean
  show_step_numbers: boolean
  complete_action?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WizardStepEditor() {
  const { payload, updateNodeProps } = useCanvasStore()
  const tree = payload?.component_tree

  if (!tree) return null

  const config: WizardConfig = (tree.props?.__wizard_config as WizardConfig) ?? {
    steps: [],
    allow_back_navigation: true,
    show_step_numbers: true,
  }

  const handleUpdateConfig = useCallback((updated: WizardConfig) => {
    updateNodeProps(tree.component_key, { __wizard_config: updated })
  }, [tree.component_key, updateNodeProps])

  const childKeys = (tree.children ?? []).map(c => ({
    key: c.component_key,
    label: c.label || c.component_code,
  }))

  const handleAddStep = useCallback(() => {
    const unmapped = childKeys.find(c => !config.steps.some(s => s.component_key === c.key))
    const newStep: WizardStep = {
      step_key: `step_${config.steps.length + 1}`,
      label: `Step ${config.steps.length + 1}`,
      component_key: unmapped?.key ?? '',
    }
    handleUpdateConfig({ ...config, steps: [...config.steps, newStep] })
  }, [config, childKeys, handleUpdateConfig])

  const handleUpdateStep = useCallback((idx: number, step: WizardStep) => {
    const steps = [...config.steps]
    steps[idx] = step
    handleUpdateConfig({ ...config, steps })
  }, [config, handleUpdateConfig])

  const handleRemoveStep = useCallback((idx: number) => {
    handleUpdateConfig({ ...config, steps: config.steps.filter((_, i) => i !== idx) })
  }, [config, handleUpdateConfig])

  const handleMoveStep = useCallback((idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= config.steps.length) return
    const steps = [...config.steps]
    ;[steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]]
    handleUpdateConfig({ ...config, steps })
  }, [config, handleUpdateConfig])

  return (
    <div className="pp-section">
      <div className="pp-section__title">
        <Wand2 size={14} style={{ marginRight: 4 }} />
        Wizard Steps
      </div>

      {/* Global wizard config */}
      <div className="wiz-config">
        <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="wiz-back-nav"
            checked={config.allow_back_navigation}
            onChange={e => handleUpdateConfig({ ...config, allow_back_navigation: e.target.checked })}
          />
          <label htmlFor="wiz-back-nav" className="pp-field__label" style={{ marginBottom: 0 }}>
            Allow back navigation
          </label>
        </div>
        <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="wiz-step-nums"
            checked={config.show_step_numbers}
            onChange={e => handleUpdateConfig({ ...config, show_step_numbers: e.target.checked })}
          />
          <label htmlFor="wiz-step-nums" className="pp-field__label" style={{ marginBottom: 0 }}>
            Show step numbers
          </label>
        </div>
        <div className="pp-field">
          <label className="pp-field__label">Complete Action</label>
          <input
            type="text"
            className="pp-field__input"
            value={config.complete_action ?? ''}
            onChange={e => handleUpdateConfig({ ...config, complete_action: e.target.value || undefined })}
            placeholder="e.g., submit_form, navigate:/success"
          />
        </div>
      </div>

      {/* Step list */}
      <div className="wiz-steps">
        {config.steps.map((step, idx) => (
          <WizardStepRow
            key={step.step_key}
            step={step}
            index={idx}
            total={config.steps.length}
            childKeys={childKeys}
            onUpdate={(s) => handleUpdateStep(idx, s)}
            onRemove={() => handleRemoveStep(idx)}
            onMove={(dir) => handleMoveStep(idx, dir)}
          />
        ))}
      </div>

      <Button variant="ghost" size="sm" onClick={handleAddStep} style={{ marginTop: '0.5rem' }}>
        <Plus size={12} /> Add Step
      </Button>
    </div>
  )
}

// ─── Step Row ────────────────────────────────────────────────────────────────

function WizardStepRow({
  step,
  index,
  total,
  childKeys,
  onUpdate,
  onRemove,
  onMove,
}: {
  step: WizardStep
  index: number
  total: number
  childKeys: { key: string; label: string }[]
  onUpdate: (s: WizardStep) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  return (
    <div className="wiz-step">
      <div className="wiz-step__header">
        <GripVertical size={12} className="wiz-step__grip" />
        <span className="wiz-step__num">{index + 1}</span>
        <input
          type="text"
          className="pp-field__input"
          value={step.label}
          onChange={e => onUpdate({ ...step, label: e.target.value })}
          style={{ flex: 1 }}
        />
        <button
          className="wiz-step__move"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          title="Move up"
        >
          ↑
        </button>
        <button
          className="wiz-step__move"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          title="Move down"
        >
          ↓
        </button>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 size={10} />
        </Button>
      </div>

      <div className="wiz-step__body">
        <div className="pp-field">
          <label className="pp-field__label">Component</label>
          <select
            className="pp-field__input"
            value={step.component_key}
            onChange={e => onUpdate({ ...step, component_key: e.target.value })}
          >
            <option value="">Select component…</option>
            {childKeys.map(c => (
              <option key={c.key} value={c.key}>{c.label} ({c.key})</option>
            ))}
          </select>
        </div>

        <div className="pp-field">
          <label className="pp-field__label">Description</label>
          <input
            type="text"
            className="pp-field__input"
            value={step.description ?? ''}
            onChange={e => onUpdate({ ...step, description: e.target.value || undefined })}
            placeholder="Step description (optional)"
          />
        </div>

        <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={step.is_optional ?? false}
            onChange={e => onUpdate({ ...step, is_optional: e.target.checked })}
          />
          <label className="pp-field__label" style={{ marginBottom: 0 }}>Optional step</label>
        </div>

        <div className="pp-field">
          <label className="pp-field__label">Skip Condition</label>
          <input
            type="text"
            className="pp-field__input"
            value={step.skip_condition ?? ''}
            onChange={e => onUpdate({ ...step, skip_condition: e.target.value || undefined })}
            placeholder="JSONata expression to skip this step"
            style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
          />
        </div>

        <div className="pp-field">
          <label className="pp-field__label">Validation Expression</label>
          <input
            type="text"
            className="pp-field__input"
            value={step.validation_expression ?? ''}
            onChange={e => onUpdate({ ...step, validation_expression: e.target.value || undefined })}
            placeholder="Must be truthy to proceed to next step"
            style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
          />
        </div>
      </div>
    </div>
  )
}
