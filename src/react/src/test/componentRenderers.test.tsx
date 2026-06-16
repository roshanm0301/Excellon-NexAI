/**
 * componentRenderers.test.tsx — Phase 6 renderer test coverage
 *
 * Covers the new enterprise surface renderers added in Phase 6:
 *  - HeaderLineSectionRenderer: header zone + line zone labels visible
 *  - TotalsPanelRenderer: renders summary label/value pairs
 *  - RelatedListRenderer: renders "Related records" header and sample rows
 *  - ModalContainerRenderer: renders title bar and cancel/confirm buttons
 *  - GridRowRenderer: renders children in a flex row container
 *  - GridColumnRenderer: renders children in a flex column container
 *  - DashboardGridRenderer: renders a 2-column CSS grid
 *  - WizardStepRenderer: renders step badge and title
 *  - SplitPanelRenderer: renders two pane areas
 *  - KanbanBoardRenderer: renders kanban column headers
 *  - TaxChargeRenderer: renders tax/charge label
 *  - DrawerContainerRenderer: renders drawer panel
 *  - SidePanelRenderer: renders side panel title
 */

import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { getRenderer } from '../pages/studio/view-designer/ComponentRenderMap'
import type { ComponentNode } from '../types/viewStudio'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(
  component_code: string,
  props?: Record<string, unknown>,
  bindings?: ComponentNode['bindings'],
): ComponentNode {
  return {
    component_key: `test-${component_code}`,
    component_code,
    props: props ?? {},
    bindings,
    children: undefined,
  }
}

function renderComponent(
  component_code: string,
  props?: Record<string, unknown>,
  children?: React.ReactNode[],
  bindings?: ComponentNode['bindings'],
) {
  const node = makeNode(component_code, props, bindings)
  const Renderer = getRenderer(component_code)
  return render(
    React.createElement(Renderer, {
      node,
      children,
    }),
  )
}

// ─── HeaderLineSectionRenderer ────────────────────────────────────────────────

describe('HeaderLineSectionRenderer', () => {
  test('renders Header zone label', () => {
    renderComponent('header_line_section')
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  test('renders Line Grid zone label', () => {
    renderComponent('header_line_section')
    expect(screen.getByText('Line Grid')).toBeInTheDocument()
  })

  test('renders drop placeholder when no children', () => {
    renderComponent('header_line_section')
    expect(screen.getByText('Drop header fields here')).toBeInTheDocument()
    expect(screen.getByText('Drop line columns here')).toBeInTheDocument()
  })

  test('renders optional title when provided', () => {
    renderComponent('header_line_section', { title: 'Purchase Order' })
    expect(screen.getByText('Purchase Order')).toBeInTheDocument()
  })

  test('splits children into header and line zones', () => {
    const children = [
      React.createElement('span', { key: 'a', 'data-testid': 'child-a' }, 'ChildA'),
      React.createElement('span', { key: 'b', 'data-testid': 'child-b' }, 'ChildB'),
    ]
    renderComponent('header_line_section', {}, children)
    expect(screen.getByTestId('child-a')).toBeInTheDocument()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()
  })
})

// ─── TotalsPanelRenderer ─────────────────────────────────────────────────────

describe('TotalsPanelRenderer', () => {
  test('renders "Summary" heading', () => {
    renderComponent('totals_panel')
    expect(screen.getByText('Summary')).toBeInTheDocument()
  })

  test('renders default subtotal/tax/total rows when no line_items prop', () => {
    renderComponent('totals_panel')
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('Tax (10%)')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  test('renders custom line_items from props', () => {
    renderComponent('totals_panel', {
      line_items: [
        { label: 'Gross', value: '500.00' },
        { label: 'Discount', value: '-50.00' },
        { label: 'Net Total', value: '450.00', highlight: true },
      ],
    })
    expect(screen.getByText('Gross')).toBeInTheDocument()
    expect(screen.getByText('Discount')).toBeInTheDocument()
    expect(screen.getByText('Net Total')).toBeInTheDocument()
  })
})

// ─── RelatedListRenderer ──────────────────────────────────────────────────────

describe('RelatedListRenderer', () => {
  test('renders "Related records" title when no title prop', () => {
    renderComponent('related_list')
    expect(screen.getByText('Related records')).toBeInTheDocument()
  })

  test('renders custom title from props', () => {
    renderComponent('related_list', { title: 'Order Lines' })
    expect(screen.getByText('Order Lines')).toBeInTheDocument()
  })

  test('renders default column headers (Name, Status, Date)', () => {
    renderComponent('related_list')
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
  })

  test('renders custom columns from props', () => {
    renderComponent('related_list', {
      columns: [
        { key: 'product', label: 'Product' },
        { key: 'qty', label: 'Qty' },
        { key: 'price', label: 'Price' },
      ],
    })
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Qty')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
  })

  test('renders 3 sample rows', () => {
    renderComponent('related_list')
    expect(screen.getByText('Record 1')).toBeInTheDocument()
    expect(screen.getByText('Record 2')).toBeInTheDocument()
    expect(screen.getByText('Record 3')).toBeInTheDocument()
  })

  test('renders entity label when entity prop is set', () => {
    renderComponent('related_list', { entity: 'order_line' })
    expect(screen.getByText('entity: order_line')).toBeInTheDocument()
  })
})

// ─── ModalContainerRenderer ───────────────────────────────────────────────────

describe('ModalContainerRenderer', () => {
  test('renders default title "Modal" when no title prop', () => {
    renderComponent('modal_container')
    expect(screen.getByText('Modal')).toBeInTheDocument()
  })

  test('renders custom title from props', () => {
    renderComponent('modal_container', { title: 'Confirm Delete' })
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
  })

  test('renders Cancel and Confirm buttons', () => {
    renderComponent('modal_container')
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  test('renders children inside the modal body', () => {
    const children = [
      React.createElement('span', { key: 'c', 'data-testid': 'modal-child' }, 'Modal Content'),
    ]
    renderComponent('modal_container', {}, children)
    expect(screen.getByTestId('modal-child')).toBeInTheDocument()
  })
})

// ─── GridRowRenderer ──────────────────────────────────────────────────────────

describe('GridRowRenderer', () => {
  test('renders children in a flex container', () => {
    const children = [
      React.createElement('span', { key: '1', 'data-testid': 'row-child-1' }, 'Cell 1'),
      React.createElement('span', { key: '2', 'data-testid': 'row-child-2' }, 'Cell 2'),
    ]
    renderComponent('grid_row', {}, children)
    expect(screen.getByTestId('row-child-1')).toBeInTheDocument()
    expect(screen.getByTestId('row-child-2')).toBeInTheDocument()
  })
})

// ─── GridColumnRenderer ───────────────────────────────────────────────────────

describe('GridColumnRenderer', () => {
  test('renders children in a column container', () => {
    const children = [
      React.createElement('span', { key: '1', 'data-testid': 'col-child-1' }, 'Item 1'),
      React.createElement('span', { key: '2', 'data-testid': 'col-child-2' }, 'Item 2'),
    ]
    renderComponent('grid_column', {}, children)
    expect(screen.getByTestId('col-child-1')).toBeInTheDocument()
    expect(screen.getByTestId('col-child-2')).toBeInTheDocument()
  })
})

// ─── DashboardGridRenderer ────────────────────────────────────────────────────

describe('DashboardGridRenderer', () => {
  test('renders children inside the grid', () => {
    const children = [
      React.createElement('span', { key: '1', 'data-testid': 'dash-child-1' }, 'Widget 1'),
      React.createElement('span', { key: '2', 'data-testid': 'dash-child-2' }, 'Widget 2'),
    ]
    renderComponent('dashboard_grid', {}, children)
    expect(screen.getByTestId('dash-child-1')).toBeInTheDocument()
    expect(screen.getByTestId('dash-child-2')).toBeInTheDocument()
  })
})

// ─── WizardStepRenderer ───────────────────────────────────────────────────────

describe('WizardStepRenderer', () => {
  test('renders default step number 1', () => {
    renderComponent('wizard_step')
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  test('renders custom step number from props', () => {
    renderComponent('wizard_step', { step: 3, title: 'Review Order' })
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  test('renders step title from props', () => {
    renderComponent('wizard_step', { title: 'Shipping Details' })
    expect(screen.getByText('Shipping Details')).toBeInTheDocument()
  })

  test('renders default "Wizard Step" when no title', () => {
    renderComponent('wizard_step')
    expect(screen.getByText('Wizard Step')).toBeInTheDocument()
  })
})

// ─── SplitPanelRenderer ───────────────────────────────────────────────────────

describe('SplitPanelRenderer', () => {
  test('renders left pane placeholder when no children', () => {
    renderComponent('split_panel')
    expect(screen.getByText('Left pane')).toBeInTheDocument()
    expect(screen.getByText('Right pane')).toBeInTheDocument()
  })

  test('renders children into left and right panes', () => {
    const children = [
      React.createElement('span', { key: 'l', 'data-testid': 'left-content' }, 'Left Content'),
      React.createElement('span', { key: 'r', 'data-testid': 'right-content' }, 'Right Content'),
    ]
    renderComponent('split_panel', {}, children)
    expect(screen.getByTestId('left-content')).toBeInTheDocument()
    expect(screen.getByTestId('right-content')).toBeInTheDocument()
  })
})

// ─── KanbanBoardRenderer ──────────────────────────────────────────────────────

describe('KanbanBoardRenderer', () => {
  test('renders default columns: To Do, In Progress, Done', () => {
    renderComponent('kanban_board')
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  test('renders custom columns from props', () => {
    renderComponent('kanban_board', { columns: ['Backlog', 'Active', 'Shipped'] })
    expect(screen.getByText('Backlog')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Shipped')).toBeInTheDocument()
  })

  test('renders drop placeholder in each empty column', () => {
    renderComponent('kanban_board')
    const placeholders = screen.getAllByText('Drop cards here')
    expect(placeholders.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── TaxChargeRenderer ────────────────────────────────────────────────────────

describe('TaxChargeRenderer', () => {
  test('renders default "Tax / Charge" label when no label prop', () => {
    renderComponent('tax_charge_column')
    expect(screen.getByText('Tax / Charge')).toBeInTheDocument()
  })

  test('renders custom label from props', () => {
    renderComponent('tax_charge_column', { label: 'GST (10%)' })
    expect(screen.getByText('GST (10%)')).toBeInTheDocument()
  })

  test('renders charge type badge', () => {
    renderComponent('tax_charge_column', { charge_type: 'fixed' })
    expect(screen.getByText('fixed')).toBeInTheDocument()
  })

  test('renders field binding when rate binding is set', () => {
    renderComponent('tax_charge_column', {}, undefined, {
      rate: { source: 'field', field_key: 'tax_rate' },
    })
    expect(screen.getByText('⟨tax_rate⟩')).toBeInTheDocument()
  })
})

// ─── DrawerContainerRenderer ──────────────────────────────────────────────────

describe('DrawerContainerRenderer', () => {
  test('renders default "Drawer" title', () => {
    renderComponent('drawer_container')
    expect(screen.getByText('Drawer')).toBeInTheDocument()
  })

  test('renders custom title from props', () => {
    renderComponent('drawer_container', { title: 'Edit Record' })
    expect(screen.getByText('Edit Record')).toBeInTheDocument()
  })

  test('renders position label', () => {
    renderComponent('drawer_container', { position: 'left' })
    expect(screen.getByText('left panel')).toBeInTheDocument()
  })

  test('renders children inside drawer', () => {
    const children = [
      React.createElement('span', { key: 'dc', 'data-testid': 'drawer-child' }, 'Drawer Content'),
    ]
    renderComponent('drawer_container', {}, children)
    expect(screen.getByTestId('drawer-child')).toBeInTheDocument()
  })
})

// ─── SidePanelRenderer ───────────────────────────────────────────────────────

describe('SidePanelRenderer', () => {
  test('renders default "Side Panel" title', () => {
    renderComponent('side_panel')
    expect(screen.getByText('Side Panel')).toBeInTheDocument()
  })

  test('renders custom title from props', () => {
    renderComponent('side_panel', { title: 'Filters' })
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  test('renders children inside side panel', () => {
    const children = [
      React.createElement('span', { key: 'sp', 'data-testid': 'side-child' }, 'Side Content'),
    ]
    renderComponent('side_panel', {}, children)
    expect(screen.getByTestId('side-child')).toBeInTheDocument()
  })
})
