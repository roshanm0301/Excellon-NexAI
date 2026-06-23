import { describe, it, expect } from "vitest"
import { services } from "@/services"

describe("PreviewService (MSW)", () => {
  it("resolve runs resolveCascade for automotive scope", async () => {
    const model = await services.preview.resolve({
      env: "dev",
      appId: "app.dms",
      pageId: "page.salesOrder",
      previewScopeId: "automotive",
    })

    expect(model.pageId).toBe("page.salesOrder")
    expect(model.scopeId).toBe("automotive")
    expect(model.nodes.length).toBeGreaterThan(0)

    const appNode = model.nodes.find((n) => n.logicalKey === "app.dms")
    expect(appNode).toBeDefined()
    expect(appNode!.kind).toBe("application")
  })

  it("preview-as-Toyota suppresses discountField", async () => {
    const model = await services.preview.resolve({
      env: "dev",
      appId: "app.dms",
      pageId: "page.salesOrder",
      previewScopeId: "toyota",
    })

    const discount = model.nodes.find((n) => n.logicalKey === "cmp.discountField")
    expect(discount).toBeUndefined()
  })

  it("preview-as-dealer-x includes dealer notes component", async () => {
    const model = await services.preview.resolve({
      env: "dev",
      appId: "app.dms",
      pageId: "page.salesOrder",
      previewScopeId: "dealer-x",
    })

    const dealerNotes = model.nodes.find((n) => n.logicalKey === "cmp.dealerNotes")
    expect(dealerNotes).toBeDefined()
    expect(dealerNotes!.kind).toBe("component")
  })
})
