import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useEntityArtifacts } from '../../hooks/useEntityArtifacts'

vi.mock('../../config/studioApi', () => ({
  listArtifacts: vi.fn(),
  deleteArtifact: vi.fn(),
  publishArtifact: vi.fn(),
}))

import { listArtifacts } from '../../config/studioApi'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useEntityArtifacts', () => {
  test('returns artifact list on success', async () => {
    const mockData = {
      items: [
        { id: '1', entity_type: 'entity_schema', status: 'draft' as const, version: 1, payload: {}, created_by: 'user1', created_at: '', updated_at: '', tenant_id: 't1' },
      ],
      total: 1,
    }
    vi.mocked(listArtifacts).mockResolvedValue(mockData)

    const { result } = renderHook(() => useEntityArtifacts(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })

  test('returns error state on failure', async () => {
    vi.mocked(listArtifacts).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEntityArtifacts(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
