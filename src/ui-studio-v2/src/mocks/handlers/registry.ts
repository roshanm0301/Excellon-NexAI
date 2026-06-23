// Phase 4 §6 — MSW handler: Registry (search + shape)
import { http, HttpResponse } from "msw"
import { API_BASE_URL } from "@/shared/config"
import { registryHits, typeShapes } from "@/mocks/fixtures/registry"
import { applyLatency, shouldError } from "@/mocks/store"

export const registryHandlers = [
  http.get(`${API_BASE_URL}/registry/search`, async ({ request }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const url = new URL(request.url)
    const query = (url.searchParams.get("q") ?? "").toLowerCase()

    if (!query) {
      return HttpResponse.json(registryHits)
    }

    const filtered = registryHits.filter(
      (hit) =>
        hit.ref.toLowerCase().includes(query) ||
        hit.name.toLowerCase().includes(query) ||
        (hit.description?.toLowerCase().includes(query) ?? false),
    )
    return HttpResponse.json(filtered)
  }),

  http.get(`${API_BASE_URL}/registry/shape/:ref`, async ({ params }) => {
    await applyLatency()
    if (shouldError()) {
      return HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }

    const ref = params.ref as string
    const shape = typeShapes.get(ref)
    if (!shape) {
      return HttpResponse.json({ message: `Shape not found: ${ref}` }, { status: 404 })
    }
    return HttpResponse.json(shape)
  }),
]
