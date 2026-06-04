import { describe, expect, it } from 'vitest'

import {
  applyRuleStateToComponentTree,
  getBoundFieldKey,
  resolveRuleBehavior,
  validateRequiredRuntimeFields,
} from '../lib/ruleRuntime'
import type { ComponentNode } from '../types/viewStudio'

function fieldNode(field: string): ComponentNode {
  return {
    component_key: `field_${field}`,
    component_code: 'TextInput',
    props: { label: field },
    bindings: {
      value: { source: 'field', field_key: field },
    },
  }
}

describe('ruleRuntime', () => {
  it('resolves bound field keys from value bindings', () => {
    expect(getBoundFieldKey(fieldNode('amount'))).toBe('amount')
  })

  it('applies the most restrictive field behavior', () => {
    const resolved = resolveRuleBehavior(fieldNode('discount'), {
      field_behaviors: [
        { field: 'discount', behavior: 'editable' },
        { field: 'discount', behavior: 'hidden', reason: 'Not eligible' },
      ],
    })

    expect(resolved.hidden).toBe(true)
    expect(resolved.readonly).toBe(false)
    expect(resolved.messages).toEqual(['Not eligible'])
  })

  it('marks mandatory behavior as required in the component tree', () => {
    const node = applyRuleStateToComponentTree(fieldNode('tax_code'), {
      field_behaviors: [{ field: 'tax_code', behavior: 'mandatory' }],
    })

    expect(node.props?.required).toBe(true)
    expect(node.props?.__runtime_required).toBe(true)
  })

  it('validates missing runtime-required fields', () => {
    const tree: ComponentNode = {
      component_key: 'root',
      component_code: 'PageRoot',
      children: [fieldNode('customer_id'), fieldNode('remarks')],
    }

    const missing = validateRequiredRuntimeFields(tree, { remarks: 'ok' }, {
      required_fields: ['customer_id'],
    })

    expect(missing).toEqual(['customer_id'])
  })
})
