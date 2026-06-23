import { describe, it, expect } from "vitest"
import {
  editorAppSearchSchema,
  editorPageSearchSchema,
  homeSearchSchema,
} from "@/routes/search-schemas"

describe("editorAppSearchSchema", () => {
  it("provides defaults for bare URL (no params)", () => {
    const result = editorAppSearchSchema.parse({})
    expect(result).toEqual({
      env: "dev",
      editingLevel: "platform",
      scopeId: "",
      previewScopeId: "",
    })
  })

  it("deep link restores full context", () => {
    const result = editorAppSearchSchema.parse({
      env: "staging",
      editingLevel: "tenant",
      scopeId: "toyota",
      previewScopeId: "dealer-x",
    })
    expect(result.env).toBe("staging")
    expect(result.editingLevel).toBe("tenant")
    expect(result.scopeId).toBe("toyota")
    expect(result.previewScopeId).toBe("dealer-x")
  })

  it("round-trip: parse then re-parse is stable", () => {
    const first = editorAppSearchSchema.parse({
      env: "prod",
      editingLevel: "org",
      scopeId: "dealer-x",
    })
    const second = editorAppSearchSchema.parse(first)
    expect(first).toEqual(second)
  })

  it("rejects invalid env", () => {
    expect(() =>
      editorAppSearchSchema.parse({ env: "invalid" }),
    ).toThrow()
  })

  it("rejects invalid editingLevel", () => {
    expect(() =>
      editorAppSearchSchema.parse({ editingLevel: "superadmin" }),
    ).toThrow()
  })
})

describe("editorPageSearchSchema", () => {
  it("extends app schema with selection default", () => {
    const result = editorPageSearchSchema.parse({})
    expect(result.selection).toEqual([])
    expect(result.env).toBe("dev")
  })

  it("preserves selection array", () => {
    const result = editorPageSearchSchema.parse({
      selection: ["cmp.orderNumber", "cmp.orderDate"],
    })
    expect(result.selection).toEqual(["cmp.orderNumber", "cmp.orderDate"])
  })
})

describe("homeSearchSchema", () => {
  it("defaults env to dev", () => {
    const result = homeSearchSchema.parse({})
    expect(result.env).toBe("dev")
  })

  it("accepts valid env", () => {
    const result = homeSearchSchema.parse({ env: "prod" })
    expect(result.env).toBe("prod")
  })
})
