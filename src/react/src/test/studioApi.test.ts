import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { studioFetch, listArtifacts, createArtifact, publishArtifact, ApiError } from '../config/studioApi'

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

    await createArtifact({ entity_type: 'entity_schema', payload: { foo: 'bar' } })

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ entity_type: 'entity_schema', payload: { foo: 'bar' } })
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
