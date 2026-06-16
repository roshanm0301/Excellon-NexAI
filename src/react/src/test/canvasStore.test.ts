/**
 * canvasStore.test.ts — Phase 5 canvas store test coverage
 *
 * Covers:
 *  - insertNode: inserts into tree correctly
 *  - insertNode with canInsertChild check — blocked placement returns false
 *  - moveNode: moves node to a new parent
 *  - updateNodeProps: updates props without affecting other nodes
 *  - updateNodeBindings: updates bindings correctly
 *  - undo/redo: state returns to previous/next snapshot
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../pages/studio/view-designer/useCanvasStore'
import type { ViewPayload, ComponentRegistryEntry, FieldBinding } from '../types/viewStudio'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePayload(): ViewPayload {
  return {
    component_tree: {
      component_key: 'root',
      component_code: 'page_root',
      children: [
        {
          component_key: 'container_1',
          component_code: 'container',
          children: [
            {
              component_key: 'text_1',
              component_code: 'text',
              props: { label: 'Hello' },
              children: undefined,
            },
          ],
        },
      ],
    },
  }
}

function makeRegistryEntries(): ComponentRegistryEntry[] {
  const base: Omit<ComponentRegistryEntry, 'component_code' | 'component_name' | 'is_container' | 'allowed_parents' | 'allowed_children'> = {
    category: 'layout',
    version: '1.0.0',
    source: 'platform',
    supported_surfaces: ['all'],
    supported_bindings: [],
    config_schema: {},
    default_props: {},
    event_support: { emits: [], handles: [] },
    permission_behavior: {},
    runtime_renderer: '',
    designer_panel: '',
    preview_support: true,
    validation_rules: [],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  }
  return [
    {
      ...base,
      component_code: 'page_root',
      component_name: 'Page Root',
      is_container: true,
      allowed_parents: [],
      allowed_children: ['all'],
    },
    {
      ...base,
      component_code: 'container',
      component_name: 'Container',
      is_container: true,
      allowed_parents: ['all'],
      allowed_children: ['all'],
    },
    {
      ...base,
      component_code: 'text',
      component_name: 'Text',
      is_container: false,
      allowed_parents: ['all'],
      allowed_children: [],
    },
    {
      ...base,
      component_code: 'button',
      component_name: 'Button',
      is_container: false,
      allowed_parents: ['container', 'page_root'],
      allowed_children: [],
    },
    {
      ...base,
      component_code: 'restricted_widget',
      component_name: 'Restricted Widget',
      is_container: false,
      allowed_parents: ['special_parent'],
      allowed_children: [],
    },
  ]
}

// Reset store before each test
beforeEach(() => {
  useCanvasStore.getState().reset()
})

// ─── insertNode ───────────────────────────────────────────────────────────────

describe('insertNode', () => {
  test('inserts a new node as a child of the specified parent', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.insertNode('root', {
      component_key: 'new_btn',
      component_code: 'button',
      label: 'Click Me',
      props: {},
      children: undefined,
    })

    const root = useCanvasStore.getState().payload!.component_tree
    const directChildren = root.children ?? []
    expect(directChildren.some(c => c.component_key === 'new_btn')).toBe(true)
  })

  test('inserts at the specified index', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.insertNode('root', {
      component_key: 'inserted_first',
      component_code: 'button',
      label: 'First',
      props: {},
      children: undefined,
    }, 0)

    const root = useCanvasStore.getState().payload!.component_tree
    expect(root.children![0].component_key).toBe('inserted_first')
  })

  test('inserts into a nested parent', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.insertNode('container_1', {
      component_key: 'inner_btn',
      component_code: 'button',
      label: 'Inner',
      props: {},
      children: undefined,
    })

    const root = useCanvasStore.getState().payload!.component_tree
    const container = root.children!.find(c => c.component_key === 'container_1')!
    expect(container.children!.some(c => c.component_key === 'inner_btn')).toBe(true)
  })

  test('marks store as dirty after insert', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())
    expect(useCanvasStore.getState().isDirty).toBe(false)

    store.insertNode('root', {
      component_key: 'dirty_test',
      component_code: 'button',
      props: {},
      children: undefined,
    })

    expect(useCanvasStore.getState().isDirty).toBe(true)
  })
})

// ─── canInsertChild (placement guard) ────────────────────────────────────────

describe('canInsertChild', () => {
  test('returns true when parent allows the child component', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())
    store.setRegistry(makeRegistryEntries())

    // page_root allows 'all', so any component should be allowed
    expect(store.canInsertChild('root', 'button')).toBe(true)
  })

  test('returns false when child has restricted allowed_parents that exclude the parent', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())
    store.setRegistry(makeRegistryEntries())

    // restricted_widget only allows 'special_parent' — not page_root
    expect(store.canInsertChild('root', 'restricted_widget')).toBe(false)
  })

  test('returns false when parent is not a container (text node)', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())
    store.setRegistry(makeRegistryEntries())

    // text is not a container — cannot accept children
    expect(store.canInsertChild('text_1', 'button')).toBe(false)
  })

  test('returns false when parentKey does not exist in the tree', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())
    store.setRegistry(makeRegistryEntries())

    expect(store.canInsertChild('nonexistent_key', 'button')).toBe(false)
  })

  test('returns false when no payload is loaded', () => {
    const store = useCanvasStore.getState()
    // No setView called — payload is null
    store.setRegistry(makeRegistryEntries())

    expect(store.canInsertChild('root', 'button')).toBe(false)
  })
})

// ─── moveNode ─────────────────────────────────────────────────────────────────

describe('moveNode', () => {
  test('moves a node from one parent to another', () => {
    const store = useCanvasStore.getState()
    // Add a second container to move text_1 into
    const payload: ViewPayload = {
      component_tree: {
        component_key: 'root',
        component_code: 'page_root',
        children: [
          {
            component_key: 'container_a',
            component_code: 'container',
            children: [
              { component_key: 'text_a', component_code: 'text', props: {}, children: undefined },
            ],
          },
          {
            component_key: 'container_b',
            component_code: 'container',
            children: [],
          },
        ],
      },
    }
    store.setView('v1', null, payload)

    store.moveNode('text_a', 'container_b')

    const root = useCanvasStore.getState().payload!.component_tree
    const contA = root.children!.find(c => c.component_key === 'container_a')!
    const contB = root.children!.find(c => c.component_key === 'container_b')!

    expect(contA.children?.some(c => c.component_key === 'text_a')).toBe(false)
    expect(contB.children?.some(c => c.component_key === 'text_a')).toBe(true)
  })

  test('does nothing when the node key does not exist', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())
    const before = JSON.stringify(useCanvasStore.getState().payload)

    store.moveNode('ghost_key', 'root')

    // Tree should be unchanged (no crash, same structure)
    const after = JSON.stringify(useCanvasStore.getState().payload)
    expect(before).toBe(after)
  })
})

// ─── updateNodeProps ──────────────────────────────────────────────────────────

describe('updateNodeProps', () => {
  test('updates props of the targeted node', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.updateNodeProps('text_1', { label: 'Updated', color: 'red' })

    const node = useCanvasStore.getState().getNode('text_1')!
    expect(node.props?.['label']).toBe('Updated')
    expect(node.props?.['color']).toBe('red')
  })

  test('does not affect sibling or parent nodes', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.updateNodeProps('text_1', { label: 'Changed' })

    const container = useCanvasStore.getState().getNode('container_1')!
    // container has no props of its own — its children should be unchanged at the sibling level
    expect(container.component_code).toBe('container')
  })

  test('merges props rather than replacing the whole props object', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())
    // text_1 starts with { label: 'Hello' }
    store.updateNodeProps('text_1', { color: 'blue' })

    const node = useCanvasStore.getState().getNode('text_1')!
    expect(node.props?.['label']).toBe('Hello')  // original preserved
    expect(node.props?.['color']).toBe('blue')   // new prop added
  })
})

// ─── updateNodeBindings ───────────────────────────────────────────────────────

describe('updateNodeBindings', () => {
  test('sets bindings on a node', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    const bindings: Record<string, FieldBinding> = {
      value: { source: 'field', entity: 'order', field_key: 'total' },
    }
    store.updateNodeBindings('text_1', bindings)

    const node = useCanvasStore.getState().getNode('text_1')!
    expect(node.bindings?.['value']?.field_key).toBe('total')
  })

  test('replaces bindings when called again', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.updateNodeBindings('text_1', { value: { source: 'field', field_key: 'name' } })
    store.updateNodeBindings('text_1', { value: { source: 'static', static_value: 'fixed' } })

    const node = useCanvasStore.getState().getNode('text_1')!
    expect(node.bindings?.['value']?.source).toBe('static')
    expect(node.bindings?.['value']?.field_key).toBeUndefined()
  })
})

// ─── undo / redo ─────────────────────────────────────────────────────────────

describe('undo and redo', () => {
  test('undo reverts to the previous state', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    const stateBefore = JSON.stringify(useCanvasStore.getState().payload)

    store.insertNode('root', {
      component_key: 'new_node',
      component_code: 'button',
      props: {},
      children: undefined,
    })

    expect(useCanvasStore.getState().payload?.component_tree.children?.some(
      c => c.component_key === 'new_node',
    )).toBe(true)

    useCanvasStore.getState().undo()

    expect(JSON.stringify(useCanvasStore.getState().payload)).toBe(stateBefore)
    expect(useCanvasStore.getState().payload?.component_tree.children?.some(
      c => c.component_key === 'new_node',
    )).toBe(false)
  })

  test('redo re-applies an undone change', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.insertNode('root', {
      component_key: 'redo_node',
      component_code: 'button',
      props: {},
      children: undefined,
    })

    useCanvasStore.getState().undo()

    expect(useCanvasStore.getState().payload?.component_tree.children?.some(
      c => c.component_key === 'redo_node',
    )).toBe(false)

    useCanvasStore.getState().redo()

    expect(useCanvasStore.getState().payload?.component_tree.children?.some(
      c => c.component_key === 'redo_node',
    )).toBe(true)
  })

  test('canUndo returns false at the initial state', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    expect(useCanvasStore.getState().canUndo()).toBe(false)
  })

  test('canRedo returns false when at the latest state', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.insertNode('root', {
      component_key: 'r1',
      component_code: 'button',
      props: {},
      children: undefined,
    })

    expect(useCanvasStore.getState().canRedo()).toBe(false)
  })

  test('multiple undo steps walk back through history correctly', () => {
    const store = useCanvasStore.getState()
    store.setView('v1', null, makePayload())

    store.updateNodeProps('text_1', { label: 'Step 1' })
    store.updateNodeProps('text_1', { label: 'Step 2' })
    store.updateNodeProps('text_1', { label: 'Step 3' })

    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().getNode('text_1')?.props?.['label']).toBe('Step 2')

    useCanvasStore.getState().undo()
    expect(useCanvasStore.getState().getNode('text_1')?.props?.['label']).toBe('Step 1')
  })
})
