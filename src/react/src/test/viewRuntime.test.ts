/**
 * viewRuntime.ts — Unit tests
 *
 * Covers resolveVisibility(), resolvePermissions(), and applyRuntimeContext().
 * Uses Vitest (same runner as viewEventEngine.test.ts).
 */

import { describe, it, expect } from 'vitest'
import {
  resolveVisibility,
  resolvePermissions,
  applyRuntimeContext,
  type RuntimeContext,
} from '../lib/viewRuntime'
import type { ComponentNode, VisibilityRule } from '../types/viewStudio'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    component_key: 'test_node',
    component_code: 'label',
    ...overrides,
  }
}

function makeCtx(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return { role: '', fieldValues: {}, ...overrides }
}

// ─── resolveVisibility ────────────────────────────────────────────────────────

describe('resolveVisibility', () => {
  it('returns true when no visibility rule set', () => {
    const node = makeNode()
    expect(resolveVisibility(node, makeCtx())).toBe(true)
  })

  it('returns true for condition: always', () => {
    const node = makeNode({ visibility: { condition: 'always' } })
    expect(resolveVisibility(node, makeCtx())).toBe(true)
  })

  it('role_in: returns true when role is in allowed list', () => {
    const node = makeNode({ visibility: { condition: 'role_in', roles: ['admin', 'manager'] } as VisibilityRule })
    expect(resolveVisibility(node, makeCtx({ role: 'admin' }))).toBe(true)
  })

  it('role_in: returns false when role is NOT in allowed list', () => {
    const node = makeNode({ visibility: { condition: 'role_in', roles: ['admin'] } as VisibilityRule })
    expect(resolveVisibility(node, makeCtx({ role: 'viewer' }))).toBe(false)
  })

  it('role_in: returns false when context role is empty and list is non-empty', () => {
    const node = makeNode({ visibility: { condition: 'role_in', roles: ['admin'] } as VisibilityRule })
    expect(resolveVisibility(node, makeCtx({ role: '' }))).toBe(false)
  })

  it('role_in: returns true when roles list is empty (no restriction)', () => {
    const node = makeNode({ visibility: { condition: 'role_in', roles: [] } as VisibilityRule })
    expect(resolveVisibility(node, makeCtx({ role: 'anyone' }))).toBe(true)
  })

  it('field_equals: returns true when field value matches', () => {
    const node = makeNode({
      visibility: { condition: 'field_equals', field_key: 'status', value: 'active' } as VisibilityRule,
    })
    expect(resolveVisibility(node, makeCtx({ fieldValues: { status: 'active' } }))).toBe(true)
  })

  it('field_equals: returns false when field value does not match', () => {
    const node = makeNode({
      visibility: { condition: 'field_equals', field_key: 'status', value: 'active' } as VisibilityRule,
    })
    expect(resolveVisibility(node, makeCtx({ fieldValues: { status: 'inactive' } }))).toBe(false)
  })

  it('field_equals: returns false when field is missing from context', () => {
    const node = makeNode({
      visibility: { condition: 'field_equals', field_key: 'status', value: 'active' } as VisibilityRule,
    })
    expect(resolveVisibility(node, makeCtx({ fieldValues: {} }))).toBe(false)
  })

  it('expression: returns true (not hidden) since JSONata evaluation is deferred', () => {
    const node = makeNode({
      visibility: { condition: 'expression', expression: '$count(items) > 0' } as VisibilityRule,
    })
    expect(resolveVisibility(node, makeCtx())).toBe(true)
  })
})

// ─── resolvePermissions ──────────────────────────────────────────────────────

describe('resolvePermissions — ComponentPermissions format', () => {
  it('returns no restrictions when no __permissions stored', () => {
    const node = makeNode()
    expect(resolvePermissions(node, makeCtx())).toEqual({ hidden: false, readOnly: false, required: false })
  })

  it('default_access readonly → readOnly true, no role match', () => {
    const node = makeNode({
      props: { __permissions: { default_access: 'readonly', rules: [] } },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'viewer' }))).toEqual({
      hidden: false, readOnly: true, required: false,
    })
  })

  it('default_access hidden → hidden true, no role match', () => {
    const node = makeNode({
      props: { __permissions: { default_access: 'hidden', rules: [] } },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'viewer' }))).toEqual({
      hidden: true, readOnly: false, required: false,
    })
  })

  it('role override takes precedence over default_access', () => {
    const node = makeNode({
      props: {
        __permissions: {
          default_access: 'hidden',
          rules: [{ role: 'admin', access: 'full' }],
        },
      },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'admin' }))).toEqual({
      hidden: false, readOnly: false, required: false,
    })
  })

  it('role override with required flag sets required: true', () => {
    const node = makeNode({
      props: {
        __permissions: {
          default_access: 'full',
          rules: [{ role: 'editor', access: 'readonly', required: true }],
        },
      },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'editor' }))).toEqual({
      hidden: false, readOnly: true, required: true,
    })
  })

  it('default_access full → no restrictions for unmatched role', () => {
    const node = makeNode({
      props: { __permissions: { default_access: 'full', rules: [] } },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'anyone' }))).toEqual({
      hidden: false, readOnly: false, required: false,
    })
  })
})

describe('resolvePermissions — legacy format', () => {
  it('hidden_rule with matching roles → hidden true', () => {
    const node = makeNode({
      props: { __permissions: { hidden_rule: { roles: ['viewer'] } } },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'viewer' }))).toEqual({
      hidden: true, readOnly: false, required: false,
    })
  })

  it('read_only_rule with matching roles → readOnly true', () => {
    const node = makeNode({
      props: { __permissions: { read_only_rule: { roles: ['reader'] } } },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'reader' }))).toEqual({
      hidden: false, readOnly: true, required: false,
    })
  })

  it('non-matching role in legacy format → no restrictions', () => {
    const node = makeNode({
      props: { __permissions: { hidden_rule: { roles: ['admin'] } } },
    })
    expect(resolvePermissions(node, makeCtx({ role: 'viewer' }))).toEqual({
      hidden: false, readOnly: false, required: false,
    })
  })
})

// ─── applyRuntimeContext ──────────────────────────────────────────────────────

describe('applyRuntimeContext', () => {
  it('returns node unchanged when no visibility/permissions configured', () => {
    const node = makeNode()
    const result = applyRuntimeContext(node, makeCtx())
    expect(result).not.toBeNull()
    expect(result?.component_key).toBe('test_node')
  })

  it('returns null when role_in visibility hides the node (production mode)', () => {
    const node = makeNode({
      visibility: { condition: 'role_in', roles: ['admin'] } as VisibilityRule,
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'viewer' }))
    expect(result).toBeNull()
  })

  it('returns node with __is_conditional when role_in hides in designMode', () => {
    const node = makeNode({
      visibility: { condition: 'role_in', roles: ['admin'] } as VisibilityRule,
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'viewer', designMode: true }))
    expect(result).not.toBeNull()
    expect(result?.props?.__is_conditional).toBe(true)
  })

  it('returns node with __visibility_hidden when remove_from_dom: false', () => {
    const node = makeNode({
      visibility: {
        condition: 'role_in',
        roles: ['admin'],
        remove_from_dom: false,
      } as VisibilityRule,
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'viewer' }))
    expect(result).not.toBeNull()
    expect(result?.props?.__visibility_hidden).toBe(true)
    expect(result?.children).toHaveLength(0)
  })

  it('returns null when permission hidden (production mode)', () => {
    const node = makeNode({
      props: { __permissions: { default_access: 'hidden', rules: [] } },
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'any' }))
    expect(result).toBeNull()
  })

  it('marks __is_permission_hidden in designMode when permission hides', () => {
    const node = makeNode({
      props: { __permissions: { default_access: 'hidden', rules: [] } },
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'any', designMode: true }))
    expect(result).not.toBeNull()
    expect(result?.props?.__is_permission_hidden).toBe(true)
  })

  it('sets BOTH __read_only AND __runtime_readonly when readOnly permission applies', () => {
    const node = makeNode({
      props: { __permissions: { default_access: 'readonly', rules: [] } },
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'any' }))
    expect(result?.props?.__read_only).toBe(true)
    expect(result?.props?.__runtime_readonly).toBe(true)
  })

  it('sets BOTH __required AND __runtime_required when required permission applies', () => {
    const node = makeNode({
      props: {
        __permissions: {
          default_access: 'full',
          rules: [{ role: 'editor', access: 'full', required: true }],
        },
      },
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'editor' }))
    expect(result?.props?.__required).toBe(true)
    expect(result?.props?.__runtime_required).toBe(true)
  })

  it('clears permission flags when role has full access (no restrictions)', () => {
    const node = makeNode({
      props: {
        __read_only: true,
        __runtime_readonly: true,
        __permissions: { default_access: 'full', rules: [] },
      },
    })
    const result = applyRuntimeContext(node, makeCtx({ role: 'any' }))
    expect(result?.props?.__read_only).toBeUndefined()
    expect(result?.props?.__runtime_readonly).toBeUndefined()
  })

  it('recursively processes children and filters out hidden ones', () => {
    const child1 = makeNode({
      component_key: 'child1',
      visibility: { condition: 'role_in', roles: ['admin'] } as VisibilityRule,
    })
    const child2 = makeNode({ component_key: 'child2' })
    const parent = makeNode({ component_key: 'parent', children: [child1, child2] })

    const result = applyRuntimeContext(parent, makeCtx({ role: 'viewer' }))
    expect(result).not.toBeNull()
    expect(result?.children).toHaveLength(1)
    expect(result?.children?.[0].component_key).toBe('child2')
  })

  it('designMode preserves all children (hidden children are marked, not removed)', () => {
    const child1 = makeNode({
      component_key: 'child1',
      visibility: { condition: 'role_in', roles: ['admin'] } as VisibilityRule,
    })
    const child2 = makeNode({ component_key: 'child2' })
    const parent = makeNode({ component_key: 'parent', children: [child1, child2] })

    const result = applyRuntimeContext(parent, makeCtx({ role: 'viewer', designMode: true }))
    expect(result?.children).toHaveLength(2)
    expect(result?.children?.[0].props?.__is_conditional).toBe(true)
    expect(result?.children?.[1].props?.__is_conditional).toBeUndefined()
  })
})
