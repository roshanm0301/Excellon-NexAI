import type { ComponentNode } from '../types/viewStudio'
import { evaluateConditionNode, type ConditionNode } from './viewEventEngine'

// ─── Runtime Context ─────────────────────────────────────────────────────────

export interface RuntimeContext {
  role?: string
  fieldValues?: Record<string, unknown>
  /**
   * When true, nodes are never removed from the tree — they are marked with
   * __is_conditional (visibility) or __is_permission_hidden (permissions) so
   * the designer can still see and select all components.
   */
  designMode?: boolean
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

/**
 * Evaluate a compound condition node (and/or/leaf) from the event engine
 * against a RuntimeContext. Used to extend visibility resolution beyond
 * the simple flat VisibilityRule cases.
 *
 * Pass a ConditionNode stored in node.props.__condition or similar.
 */
export function resolveCompoundCondition(
  condition: ConditionNode,
  ctx: RuntimeContext,
): boolean {
  // Synthesise a dummy ViewEvent so evaluateConditionNode has access to
  // field values via the role/fieldValues parameters.
  const dummyEvent = {
    type: 'on_load' as const,
    source_key: '__runtime__',
    timestamp: 0,
    data: ctx.fieldValues ?? {},
  }
  return evaluateConditionNode(condition, dummyEvent, ctx.role, ctx.fieldValues)
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

  // ── ComponentPermissions format (from PermissionEditor) ──────────────────
  // Shape: { default_access: 'full'|'readonly'|'hidden', rules: [{ role, access, required? }] }
  if ('default_access' in perms && Array.isArray(perms.rules)) {
    const rules = perms.rules as Array<{ role: string; access: string; required?: boolean }>
    const match = rules.find(r => r.role === role)
    const access = match ? match.access : (perms.default_access as string)
    const required = match ? (match.required ?? false) : false
    return {
      hidden: access === 'hidden',
      readOnly: access === 'readonly',
      required,
    }
  }

  // ── Legacy format ─────────────────────────────────────────────────────────
  // Shape: { hidden_rule, read_only_rule, required_rule } (compound condition nodes or role arrays)
  function testRule(rule: unknown): boolean {
    if (!rule || typeof rule !== 'object') return false
    const r = rule as { roles?: string[]; type?: string }

    // Compound condition node (and/or/field_equals/role_in)
    if (r.type === 'and' || r.type === 'or' || r.type === 'field_equals' || r.type === 'role_in') {
      return resolveCompoundCondition(r as ConditionNode, ctx)
    }

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

  if (!visible) {
    if (ctx.designMode) {
      // Designer sees all nodes — mark as conditional but never remove from tree
      const processedChildren = (node.children ?? [])
        .map(c => applyRuntimeContext(c, ctx))
        .filter((c): c is ComponentNode => c !== null)
      return { ...node, props: { ...node.props, __is_conditional: true }, children: processedChildren }
    }
    if (node.visibility?.remove_from_dom === false) {
      // CSS-only hiding: keep node in DOM but flag for display:none
      return { ...node, props: { ...node.props, __visibility_hidden: true }, children: [] }
    }
    // Default: remove from DOM entirely
    return null
  }

  const perms = resolvePermissions(node, ctx)

  if (perms.hidden) {
    if (ctx.designMode) {
      // Mark permission-hidden but keep in tree for designer inspection
      const processedChildren = (node.children ?? [])
        .map(c => applyRuntimeContext(c, ctx))
        .filter((c): c is ComponentNode => c !== null)
      return { ...node, props: { ...node.props, __is_permission_hidden: true }, children: processedChildren }
    }
    return null
  }

  const updatedProps = { ...node.props }

  // Write BOTH prop key variants so all consumers work correctly:
  //   __read_only         — PreviewCanvas CSS class (.prev-node--read-only)
  //   __runtime_readonly  — ComponentRenderMap.runtimeFlags() fieldBoxStyle
  //   __required          — legacy consumers
  //   __runtime_required  — ComponentRenderMap.runtimeFlags() RequiredMark
  if (perms.readOnly) {
    updatedProps.__read_only = true
    updatedProps.__runtime_readonly = true
  } else {
    delete updatedProps.__read_only
    delete updatedProps.__runtime_readonly
  }
  if (perms.required) {
    updatedProps.__required = true
    updatedProps.__runtime_required = true
  } else {
    delete updatedProps.__required
    delete updatedProps.__runtime_required
  }

  const resolvedChildren = (node.children ?? [])
    .map(c => applyRuntimeContext(c, ctx))
    .filter((c): c is ComponentNode => c !== null)

  return { ...node, props: updatedProps, children: resolvedChildren }
}
