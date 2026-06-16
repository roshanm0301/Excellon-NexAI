import type { ComponentNode } from '../types/viewStudio'

// ─── Runtime Context ─────────────────────────────────────────────────────────

export interface RuntimeContext {
  role?: string
  fieldValues?: Record<string, unknown>
}

// ─── Visibility ──────────────────────────────────────────────────────────────

export function resolveVisibility(node: ComponentNode, ctx: RuntimeContext): boolean {
  const rule = node.visibility
  if (!rule) return true

  const condition = rule.condition
  if (!condition) return true

  if (condition === 'role_in') {
    const allowed = rule.roles ?? []
    if (allowed.length === 0) return true
    return allowed.includes(ctx.role ?? '')
  }

  if (condition === 'field_equals') {
    const fieldVal = ctx.fieldValues?.[rule.field_key ?? '']
    return fieldVal === rule.value
  }

  if (condition === 'expression') {
    // Expression evaluation requires the JSONata engine — in preview we show
    // the node with a visual cue but never hide it unconditionally.
    return true
  }

  return true
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export interface ResolvedPermissions {
  hidden: boolean
  readOnly: boolean
  required: boolean
}

export function resolvePermissions(node: ComponentNode, ctx: RuntimeContext): ResolvedPermissions {
  const perms = node.props?.__permissions as Record<string, unknown> | undefined
  if (!perms) return { hidden: false, readOnly: false, required: false }

  const role = ctx.role ?? ''

  function testRule(rule: unknown): boolean {
    if (!rule || typeof rule !== 'object') return false
    const r = rule as { roles?: string[]; condition?: string }
    if (r.roles && r.roles.length > 0) {
      return r.roles.includes(role)
    }
    return true
  }

  const hidden = testRule(perms.hidden_rule)
  const readOnly = testRule(perms.read_only_rule)
  const required = testRule(perms.required_rule)

  return { hidden, readOnly, required }
}

// ─── Tree Application ────────────────────────────────────────────────────────

export function applyRuntimeContext(node: ComponentNode, ctx: RuntimeContext): ComponentNode | null {
  const visible = resolveVisibility(node, ctx)
  if (!visible) return null

  const perms = resolvePermissions(node, ctx)
  if (perms.hidden) return null

  const updatedProps = { ...node.props }
  if (perms.readOnly) updatedProps.__read_only = true
  if (perms.required) updatedProps.__required = true

  const resolvedChildren: ComponentNode[] = []
  for (const child of node.children ?? []) {
    const resolved = applyRuntimeContext(child, ctx)
    if (resolved) resolvedChildren.push(resolved)
  }

  return { ...node, props: updatedProps, children: resolvedChildren }
}
