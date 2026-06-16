/**
 * viewEventEngine.test.ts — Phase 4 event engine test coverage
 *
 * Covers:
 *  - Condition evaluation: field_equals match/no-match, role_in match/no-match,
 *    and/or compound conditions
 *  - Action sequencing: two actions run in order; error in first doesn't block second
 *  - Async behaviour: handlers returning promises are awaited before next action
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  ViewEventEngine,
  EventEngineError,
  evaluateConditionNode,
  evaluateConditions,
  createEventEngine,
} from '../lib/viewEventEngine'
import type { EventDefinition, EventType } from '../types/viewStudio'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  type: EventType = 'on_click',
  data?: Record<string, unknown>,
) {
  return {
    type,
    source_key: 'test_source',
    data,
    timestamp: Date.now(),
  }
}

// ─── Condition Evaluation ─────────────────────────────────────────────────────

describe('evaluateConditionNode — leaf conditions', () => {
  test('field_equals: matches when event data has the field with expected value', () => {
    const event = makeEvent('on_change', { status: 'active' })
    const result = evaluateConditionNode(
      { type: 'field_equals', field: 'status', value: 'active' },
      event,
    )
    expect(result).toBe(true)
  })

  test('field_equals: no match when value differs', () => {
    const event = makeEvent('on_change', { status: 'inactive' })
    const result = evaluateConditionNode(
      { type: 'field_equals', field: 'status', value: 'active' },
      event,
    )
    expect(result).toBe(false)
  })

  test('field_equals: checks fieldValues when field is absent from event data', () => {
    const event = makeEvent('on_change', {})
    const result = evaluateConditionNode(
      { type: 'field_equals', field: 'country', value: 'IN' },
      event,
      undefined,
      { country: 'IN' },
    )
    expect(result).toBe(true)
  })

  test('role_in: matches when role is in the allowed list', () => {
    const event = makeEvent('on_load')
    const result = evaluateConditionNode(
      { type: 'role_in', roles: ['admin', 'editor'] },
      event,
      'admin',
    )
    expect(result).toBe(true)
  })

  test('role_in: no match when role is absent from list', () => {
    const event = makeEvent('on_load')
    const result = evaluateConditionNode(
      { type: 'role_in', roles: ['admin', 'editor'] },
      event,
      'viewer',
    )
    expect(result).toBe(false)
  })

  test('role_in: empty roles list always returns true', () => {
    const event = makeEvent('on_load')
    const result = evaluateConditionNode(
      { type: 'role_in', roles: [] },
      event,
      'anyone',
    )
    expect(result).toBe(true)
  })
})

describe('evaluateConditionNode — compound conditions', () => {
  test('and: true when all leaf conditions match', () => {
    const event = makeEvent('on_change', { status: 'active', region: 'apac' })
    const result = evaluateConditionNode(
      {
        type: 'and',
        conditions: [
          { type: 'field_equals', field: 'status', value: 'active' },
          { type: 'field_equals', field: 'region', value: 'apac' },
        ],
      },
      event,
    )
    expect(result).toBe(true)
  })

  test('and: false when any leaf condition fails', () => {
    const event = makeEvent('on_change', { status: 'active', region: 'emea' })
    const result = evaluateConditionNode(
      {
        type: 'and',
        conditions: [
          { type: 'field_equals', field: 'status', value: 'active' },
          { type: 'field_equals', field: 'region', value: 'apac' },
        ],
      },
      event,
    )
    expect(result).toBe(false)
  })

  test('or: true when any leaf condition matches', () => {
    const event = makeEvent('on_change', { status: 'draft' })
    const result = evaluateConditionNode(
      {
        type: 'or',
        conditions: [
          { type: 'field_equals', field: 'status', value: 'active' },
          { type: 'field_equals', field: 'status', value: 'draft' },
        ],
      },
      event,
    )
    expect(result).toBe(true)
  })

  test('or: false when no leaf condition matches', () => {
    const event = makeEvent('on_change', { status: 'archived' })
    const result = evaluateConditionNode(
      {
        type: 'or',
        conditions: [
          { type: 'field_equals', field: 'status', value: 'active' },
          { type: 'field_equals', field: 'status', value: 'draft' },
        ],
      },
      event,
    )
    expect(result).toBe(false)
  })

  test('nested and inside or', () => {
    // (role_in admin) OR (status=active AND region=apac)
    const event = makeEvent('on_change', { status: 'active', region: 'apac' })
    const result = evaluateConditionNode(
      {
        type: 'or',
        conditions: [
          { type: 'role_in', roles: ['admin'] },
          {
            type: 'and',
            conditions: [
              { type: 'field_equals', field: 'status', value: 'active' },
              { type: 'field_equals', field: 'region', value: 'apac' },
            ],
          },
        ],
      },
      event,
      'viewer',
    )
    expect(result).toBe(true)
  })
})

describe('evaluateConditions — legacy flat record and structured nodes', () => {
  test('empty conditions object always passes', () => {
    const event = makeEvent('on_load')
    expect(evaluateConditions({}, event)).toBe(true)
  })

  test('undefined conditions always passes', () => {
    const event = makeEvent('on_load')
    expect(evaluateConditions(undefined, event)).toBe(true)
  })

  test('legacy flat record: all keys must match event.data', () => {
    const event = makeEvent('on_change', { a: 1, b: 2 })
    expect(evaluateConditions({ a: 1, b: 2 }, event)).toBe(true)
    expect(evaluateConditions({ a: 1, b: 99 }, event)).toBe(false)
  })

  test('structured compound node dispatches to evaluateConditionNode', () => {
    const event = makeEvent('on_change', { x: 'y' })
    expect(evaluateConditions(
      { type: 'field_equals', field: 'x', value: 'y' } as Record<string, unknown>,
      event,
    )).toBe(true)
    expect(evaluateConditions(
      { type: 'field_equals', field: 'x', value: 'z' } as Record<string, unknown>,
      event,
    )).toBe(false)
  })
})

// ─── Action Sequencing ────────────────────────────────────────────────────────

describe('ViewEventEngine — action sequencing', () => {
  let engine: ViewEventEngine

  beforeEach(() => {
    engine = createEventEngine()
  })

  test('two actions execute in definition order and both mutate tree_state', async () => {
    const order: number[] = []

    engine.registerHandler('set_field', (ctx) => {
      order.push(Number(ctx.action.payload?.seq))
      ctx.tree_state[ctx.action.target ?? ''] = ctx.action.payload?.value
    })

    const def: EventDefinition = {
      event_type: 'on_click',
      actions: [
        { action_type: 'set_field', target: 'field_a', payload: { value: 'A', seq: 1 } },
        { action_type: 'set_field', target: 'field_b', payload: { value: 'B', seq: 2 } },
      ],
    }

    engine.setDefinitions([def])
    await engine.emit({ type: 'on_click', source_key: 'btn_1' })

    expect(order).toEqual([1, 2])
    expect(engine.getTreeState()['field_a']).toBe('A')
    expect(engine.getTreeState()['field_b']).toBe('B')
  })

  test('error in first action does NOT block second action', async () => {
    const errors: EventEngineError[] = []
    engine.onError((err) => errors.push(err))

    let secondRan = false

    engine.registerHandler('show_field', () => {
      throw new Error('deliberate failure')
    })
    engine.registerHandler('hide_field', () => {
      secondRan = true
    })

    const def: EventDefinition = {
      event_type: 'on_click',
      actions: [
        { action_type: 'show_field', target: 'f1' },
        { action_type: 'hide_field', target: 'f2' },
      ],
    }

    engine.setDefinitions([def])
    await engine.emit({ type: 'on_click', source_key: 'btn_1' })

    expect(secondRan).toBe(true)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toBeInstanceOf(EventEngineError)
    expect(errors[0].action_type).toBe('show_field')
  })
})

// ─── Async Behaviour ──────────────────────────────────────────────────────────

describe('ViewEventEngine — async handler awaiting', () => {
  test('async handler is awaited before subsequent action runs', async () => {
    const engine = createEventEngine()
    const log: string[] = []

    engine.registerHandler('set_field', async (ctx) => {
      // Simulate async work
      await new Promise<void>(resolve => setTimeout(resolve, 10))
      log.push(`set:${String(ctx.action.payload?.value)}`)
    })
    engine.registerHandler('show_field', (ctx) => {
      log.push(`show:${ctx.action.target}`)
    })

    const def: EventDefinition = {
      event_type: 'on_submit',
      actions: [
        { action_type: 'set_field', target: 'status', payload: { value: 'saving' } },
        { action_type: 'show_field', target: 'spinner' },
      ],
    }

    engine.setDefinitions([def])
    await engine.emit({ type: 'on_submit', source_key: 'form_1' })

    // show_field must come after set_field resolves
    expect(log).toEqual(['set:saving', 'show:spinner'])
  })

  test('promise-returning vi.fn handler is awaited', async () => {
    const engine = createEventEngine()
    const asyncHandler = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 5)))

    engine.registerHandler('refresh_datasource', asyncHandler)

    const def: EventDefinition = {
      event_type: 'on_save_success',
      actions: [{ action_type: 'refresh_datasource', target: 'orders_table' }],
    }

    engine.setDefinitions([def])
    await engine.emit({ type: 'on_save_success', source_key: 'form_1' })

    expect(asyncHandler).toHaveBeenCalledTimes(1)
    // After await completes, the handler has fully resolved
    expect(asyncHandler.mock.results[0].type).toBe('return')
  })
})

// ─── EventEngineError ─────────────────────────────────────────────────────────

describe('EventEngineError', () => {
  test('has correct name and action_type', () => {
    const err = new EventEngineError('set_field', new Error('boom'))
    expect(err.name).toBe('EventEngineError')
    expect(err.action_type).toBe('set_field')
    expect(err.cause_message).toBe('boom')
    expect(err.message).toContain('set_field')
    expect(err.message).toContain('boom')
  })

  test('handles non-Error causes', () => {
    const err = new EventEngineError('navigate', 'string cause')
    expect(err.cause_message).toBe('string cause')
  })
})

// ─── All ActionTypes registered ───────────────────────────────────────────────

describe('ViewEventEngine — all ActionTypes have default handlers', () => {
  const allActionTypes = [
    'set_field', 'show_field', 'hide_field', 'enable_field', 'disable_field',
    'set_required', 'clear_required', 'navigate', 'open_modal', 'close_modal',
    'refresh_datasource', 'show_toast', 'trigger_validation', 'call_api',
    'set_filter', 'reset_form',
  ] as const

  test.each(allActionTypes)('validate() sees no missing handler for action_type=%s', (actionType) => {
    const engine = createEventEngine([
      {
        event_type: 'on_click',
        actions: [{ action_type: actionType }],
      },
    ])
    const { issues } = engine.validate()
    const missing = issues.filter(i => i.includes(`Unknown action_type: ${actionType}`))
    expect(missing).toHaveLength(0)
  })
})
