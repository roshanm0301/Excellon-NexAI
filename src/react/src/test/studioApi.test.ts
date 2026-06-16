import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  studioFetch,
  listArtifacts,
  createArtifact,
  publishArtifact,
  listNodes,
  listIndexQueue,
  nlpChat,
  registerPlugin,
  ApiError,
} from '../config/studioApi'

const BASE = '/api/v1'

function mockFetch(status: number, body: unknown) {
  const jsonBody = JSON.stringify(body)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(jsonBody),
    }),
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('listArtifacts', () => {
  test('builds correct URL with params', async () => {
    mockFetch(200, { items: [], total: 0 })
    await listArtifacts({ entity_type: 'entity_schema' })

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe(`${BASE}/artifacts?entity_type=entity_schema`)
  })
})

describe('createArtifact', () => {
  test('sends POST with correct body', async () => {
    const artifact = { id: '1', entity_type: 'entity_schema', payload: {} }
    mockFetch(200, artifact)

    await createArtifact({ artifact_name: 'entity_schema', artifact_type: 'entity_schema', payload: { foo: 'bar' } })

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ artifact_name: 'entity_schema', artifact_type: 'entity_schema', payload: { foo: 'bar' } })
  })
})

describe('publishArtifact', () => {
  test('sends POST to correct endpoint', async () => {
    mockFetch(200, { id: 'abc' })

    await publishArtifact('abc')

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe(`${BASE}/artifacts/abc/publish`)
    expect(init.method).toBe('POST')
  })
})

describe('studioFetch', () => {
  test('does not send dev identity headers unless local auth mode is explicit', async () => {
    mockFetch(200, { ok: true })

    await studioFetch('/artifacts')

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.headers).not.toHaveProperty('x-tenant-id')
    expect(init.headers).not.toHaveProperty('x-user-id')
    expect(init.headers).not.toHaveProperty('x-role')
  })

  test('throws ApiError on non-ok response', async () => {
    mockFetch(422, { code: 'VALIDATION_ERROR', message: 'invalid payload' })

    await expect(studioFetch('/artifacts/bad')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
    })
  })

  test('ApiError has correct status and is instanceof ApiError', async () => {
    mockFetch(422, { code: 'VALIDATION_ERROR' })

    try {
      await studioFetch('/artifacts/bad')
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(422)
    }
  })
})

describe('Phase 1 route contract', () => {
  test('listNodes uses the mounted admin node route', async () => {
    mockFetch(200, { items: [] })

    await listNodes()

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe(`${BASE}/admin/nodes`)
  })

  test('listIndexQueue uses the mounted admin index route', async () => {
    mockFetch(200, [])

    await listIndexQueue('customer')

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe(`${BASE}/admin/indexes?entity_key=customer`)
  })

  test('AI calls are feature-flagged off by default', async () => {
    await expect(nlpChat('hello', {})).rejects.toMatchObject({
      status: 404,
      body: { error: { code: 'FEATURE_DISABLED' } },
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  test('plugin registration is feature-flagged off by default', async () => {
    await expect(registerPlugin({ plugin_name: 'unsafe', version: '1.0.0' })).rejects.toMatchObject({
      status: 404,
      body: { error: { code: 'FEATURE_DISABLED' } },
    })
    expect(fetch).not.toHaveBeenCalled()
  })
})
