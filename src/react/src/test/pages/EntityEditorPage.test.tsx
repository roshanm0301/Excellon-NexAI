import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock Monaco Editor to avoid JSDOM issues
vi.mock('@monaco-editor/react', () => ({ default: () => createElement('div', { 'data-testid': 'monaco-editor' }) }))

// Mock xyflow to avoid canvas/resize issues
vi.mock('@xyflow/react', () => ({
  ReactFlow: () => createElement('div', { 'data-testid': 'react-flow' }),
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  addEdge: vi.fn(),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
}))

// Mock studioApi
vi.mock('../../config/studioApi', () => ({
  studioFetch: vi.fn(),
  listArtifacts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getArtifact: vi.fn().mockResolvedValue(null),
  createArtifact: vi.fn(),
  saveArtifact: vi.fn(),
  publishArtifact: vi.fn(),
  deleteArtifact: vi.fn(),
  listIndexQueue: vi.fn().mockResolvedValue({ items: [] }),
  applyIndex: vi.fn(),
  discardIndex: vi.fn(),
  nlpChat: vi.fn(),
  nlpImport: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
      this.name = 'ApiError'
    }
  },
}))

// Mock useToast to avoid context issues
vi.mock('../../design-system', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../design-system')>()
  return {
    ...actual,
    useToast: () => ({ success: vi.fn(), error: vi.fn() }),
  }
})

import { EntityEditorPage } from '../../pages/studio/EntityEditorPage'

const TABS = ['Schema', 'Layout', 'Relationships', 'Virtual Entity', 'Settings', 'Node Scope', 'Indexes', 'Data Retention']

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      MemoryRouter,
      { initialEntries: ['/studio/entity/new'] },
      createElement(QueryClientProvider, { client: qc }, children),
    )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EntityEditorPage', () => {
  test('renders 8 tabs', () => {
    render(createElement(EntityEditorPage), { wrapper: makeWrapper() })
    TABS.forEach(label => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    })
  })

  test('Save Draft button is disabled when not dirty', () => {
    render(createElement(EntityEditorPage), { wrapper: makeWrapper() })
    const saveBtn = screen.getByRole('button', { name: /Save Draft/i })
    expect(saveBtn).toBeDisabled()
  })

  test('shows dirty indicator when fields change', async () => {
    const user = userEvent.setup()
    render(createElement(EntityEditorPage), { wrapper: makeWrapper() })

    // Click "Add Field" to add a field and make the form dirty
    const addFieldBtn = screen.getByRole('button', { name: /Add Field/i })
    await user.click(addFieldBtn)

    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument()
  })
})
