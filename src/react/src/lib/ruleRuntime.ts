import type { ComponentNode } from '../types/viewStudio'

export type RuntimeFieldBehaviorType = 'hidden' | 'readonly' | 'mandatory' | 'editable'

export interface RuntimeFieldBehavior {
  field: string
  behavior: RuntimeFieldBehaviorType
  rule_key?: string
  reason?: string
}

export interface RuntimeRuleState {
  blocked?: boolean
  block_message?: string
  warnings?: string[]
  required_fields?: string[]
  field_behaviors?: RuntimeFieldBehavior[]
}

export interface ResolvedRuleBehavior {
  field?: string
  hidden: boolean
  readonly: boolean
  required: boolean
  messages: string[]
}

const BEHAVIOR_PRECEDENCE: Record<RuntimeFieldBehaviorType, number> = {
  editable: 0,
  mandatory: 1,
  readonly: 2,
  hidden: 3,
}

export function getBoundFieldKey(node: ComponentNode): string | undefined {
  const bindings = node.bindings ?? {}
  const bindingKeys = ['value', 'checked', 'status', 'field', 'data']
  for (const key of bindingKeys) {
    const binding = bindings[key]
    if (binding?.source === 'field' && binding.field_key) return binding.field_key
  }

  const propField = node.props?.field ?? node.props?.field_key ?? node.props?.name
  return typeof propField === 'string' && propField.trim() ? propField : undefined
}

export function resolveRuleBehavior(node: ComponentNode, state?: RuntimeRuleState): ResolvedRuleBehavior {
  const field = getBoundFieldKey(node)
  const props = node.props ?? {}
  const requiredFields = new Set(state?.required_fields ?? [])
  const fieldBehaviors = (state?.field_behaviors ?? []).filter(item => item.field === field)

  const winningBehavior = fieldBehaviors.reduce<RuntimeFieldBehavior | undefined>((winner, item) => {
    if (!winner) return item
    return BEHAVIOR_PRECEDENCE[item.behavior] >= BEHAVIOR_PRECEDENCE[winner.behavior] ? item : winner
  }, undefined)

  const behavior = winningBehavior?.behavior
  const hidden = behavior === 'hidden' || props.__runtime_hidden === true
  const readonly = behavior === 'readonly' || props.__runtime_readonly === true || props.readOnly === true || props.disabled === true
  const required = behavior === 'mandatory' || requiredFields.has(field ?? '') || props.__runtime_required === true || props.required === true
  const messages = fieldBehaviors
    .map(item => item.reason)
    .filter((message): message is string => Boolean(message))

  return { field, hidden, readonly, required, messages }
}

export function applyRuleStateToComponentTree(node: ComponentNode, state?: RuntimeRuleState): ComponentNode {
  const resolved = resolveRuleBehavior(node, state)
  const props = {
    ...(node.props ?? {}),
    required: resolved.required,
    disabled: resolved.readonly,
    readOnly: resolved.readonly,
    __runtime_hidden: resolved.hidden,
    __runtime_readonly: resolved.readonly,
    __runtime_required: resolved.required,
    __runtime_messages: resolved.messages,
    __runtime_field: resolved.field,
  }

  return {
    ...node,
    props,
    children: node.children?.map(child => applyRuleStateToComponentTree(child, state)),
  }
}

export function validateRequiredRuntimeFields(tree: ComponentNode, payload: Record<string, unknown>, state?: RuntimeRuleState): string[] {
  const missing: string[] = []

  function visit(node: ComponentNode) {
    const resolved = resolveRuleBehavior(node, state)
    if (resolved.required && resolved.field) {
      const value = payload[resolved.field]
      if (value == null || (typeof value === 'string' && value.trim() === '')) {
        missing.push(resolved.field)
      }
    }
    node.children?.forEach(visit)
  }

  visit(tree)
  return Array.from(new Set(missing))
}
