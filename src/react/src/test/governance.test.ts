/**
 * Governance feature tests (Phase 7 — M7.7)
 *
 * Tests:
 *  - useSyncStatus returns mocked data
 *  - Import/export API functions call the correct endpoints
 *  - publishView with dryRun:true calls the validate route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  publishView,
  exportViewAsPackage,
  importViewFromPackage,
  getSyncStatus,
  listViewVariants,
  listViewEvents,
  listViewDatasources,
  diffViewVersions,
} from '../config/studioApi'
import type { ViewExportPackage } from '../config/studioApi'

// ─── Mock studioFetch ─────────────────────────────────────────────────────────

// We stub the global fetch so studioFetch (which wraps fetch) captures calls.
// Each test sets up its own mock via vi.stubGlobal.

function makeFetchMock(responseBody: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(responseBody),
    text: () => Promise.resolve(JSON.stringify(responseBody)),
  })
}

beforeEach(() => {
  // Ensure import.meta.env values used by studioApi are stable
  vi.stubEnv('VITE_API_URL', '/api/v1')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

// ─── publishView dry-run ──────────────────────────────────────────────────────

describe('publishView dryRun', () => {
  it('calls /validate route when dryRun=true', async () => {
    const mockFetch = makeFetchMock({ errors: [], warnings: [] })
    vi.stubGlobal('fetch', mockFetch)

    await publishView('view-123', {}, true)

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/view-123/validate')
    expect((mockFetch.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('calls /publish route when dryRun=false (default)', async () => {
    const mockFetch = makeFetchMock({ version_id: 'v1', is_active: true })
    vi.stubGlobal('fetch', mockFetch)

    await publishView('view-456', { changelog: 'test' })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/view-456/publish')
    expect((mockFetch.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })
})

// ─── Export API ───────────────────────────────────────────────────────────────

describe('exportViewAsPackage', () => {
  it('calls the correct export endpoint', async () => {
    const mockPackage: ViewExportPackage = {
      version: '1.0',
      exported_at: '2026-06-16T00:00:00Z',
      view_meta: {
        view_label: 'Test View',
        surface_type: 'standard_crud',
        primary_entity: 'customer',
      },
      payload: {
        component_tree: {
          component_key: 'root',
          component_code: 'page_root',
        },
      },
    }
    const mockFetch = makeFetchMock(mockPackage)
    vi.stubGlobal('fetch', mockFetch)

    const result = await exportViewAsPackage('my-view')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/my-view/export')
    expect(result.version).toBe('1.0')
    expect(result.view_meta.view_label).toBe('Test View')
  })
})

// ─── Import API ───────────────────────────────────────────────────────────────

describe('importViewFromPackage', () => {
  it('calls the correct import endpoint with POST', async () => {
    const mockView = {
      artifact_id: 'new-id',
      view_label: 'Imported View',
      is_draft: true,
      is_active: false,
    }
    const mockFetch = makeFetchMock(mockView, 201)
    vi.stubGlobal('fetch', mockFetch)

    const pkg: ViewExportPackage = {
      version: '1.0',
      exported_at: '2026-06-16T00:00:00Z',
      view_meta: {
        view_label: 'My View',
        surface_type: 'dashboard',
        primary_entity: 'order',
      },
      payload: {
        component_tree: {
          component_key: 'root',
          component_code: 'page_root',
        },
      },
    }

    await importViewFromPackage(pkg)

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/import')
    expect((opts as RequestInit).method).toBe('POST')

    // Verify the body contains the package
    const body = JSON.parse((opts as RequestInit).body as string) as ViewExportPackage
    expect(body.view_meta.view_label).toBe('My View')
  })
})

// ─── getSyncStatus ────────────────────────────────────────────────────────────

describe('getSyncStatus', () => {
  it('calls the correct sync-status endpoint and returns response', async () => {
    const mockStatus = {
      status: 'up_to_date',
      schema_version: '1.0.0',
      last_checked: '2026-06-16T00:00:00Z',
      broken_bindings: [],
    }
    const mockFetch = makeFetchMock(mockStatus)
    vi.stubGlobal('fetch', mockFetch)

    const result = await getSyncStatus('my-view')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/my-view/sync-status')
    expect(result.status).toBe('up_to_date')
    expect(result.schema_version).toBe('1.0.0')
    expect(result.broken_bindings).toHaveLength(0)
  })
})

// ─── listViewVariants ─────────────────────────────────────────────────────────

describe('listViewVariants', () => {
  it('calls the correct variants endpoint', async () => {
    const mockFetch = makeFetchMock({ items: [] })
    vi.stubGlobal('fetch', mockFetch)

    await listViewVariants('view-abc')

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/view-abc/variants')
  })
})

// ─── listViewEvents ───────────────────────────────────────────────────────────

describe('listViewEvents', () => {
  it('calls the correct events endpoint', async () => {
    const mockFetch = makeFetchMock({ items: [] })
    vi.stubGlobal('fetch', mockFetch)

    await listViewEvents('view-abc')

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/view-abc/events')
  })
})

// ─── listViewDatasources ──────────────────────────────────────────────────────

describe('listViewDatasources', () => {
  it('calls the correct datasources endpoint', async () => {
    const mockFetch = makeFetchMock({ items: [] })
    vi.stubGlobal('fetch', mockFetch)

    await listViewDatasources('view-abc')

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/view-abc/datasources')
  })
})

// ─── diffViewVersions ─────────────────────────────────────────────────────────

describe('diffViewVersions', () => {
  it('calls the diff endpoint without query params when no versions specified', async () => {
    const mockFetch = makeFetchMock({ changes: [] })
    vi.stubGlobal('fetch', mockFetch)

    const result = await diffViewVersions('view-abc')

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/studio/views/view-abc/diff')
    expect(result.changes).toHaveLength(0)
  })

  it('appends from/to query params when specified', async () => {
    const mockFetch = makeFetchMock({ changes: [{ path: 'label', from: 'A', to: 'B' }] })
    vi.stubGlobal('fetch', mockFetch)

    await diffViewVersions('view-abc', 'v1-id', 'v2-id')

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('from=v1-id')
    expect(url).toContain('to=v2-id')
  })
})
