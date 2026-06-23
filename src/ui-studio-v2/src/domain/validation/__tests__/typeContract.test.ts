import { validateTypeContracts } from "@/domain/validation/typeContract"
import { makeComponent } from "@/domain/__tests__/fixtures"
import type { SemanticContract } from "@/domain/types/contracts"
import { SEMANTIC_CONTRACTS } from "@/domain/types/contracts"

const contracts = SEMANTIC_CONTRACTS as Record<string, SemanticContract>

describe("validateTypeContracts", () => {
  it("returns empty issues for valid component props", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.btn",
      semanticType: "Button",
      props: { label: "Click me" },
    })
    const issues = validateTypeContracts([cmp], contracts)
    expect(issues).toHaveLength(0)
  })

  it("detects missing required prop", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.btn",
      semanticType: "Button",
      props: { variant: "primary" },
    })
    const issues = validateTypeContracts([cmp], contracts)
    const labelIssue = issues.find((i) => i.path === "props.label")
    expect(labelIssue).toBeDefined()
    expect(labelIssue!.type).toBe("contract-violation")
    expect(labelIssue!.severity).toBe("error")
    expect(labelIssue!.message).toContain("label")
    expect(labelIssue!.message).toContain("missing")
  })

  it("detects wrong prop type", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.btn",
      semanticType: "Button",
      props: { label: 42 as never },
    })
    const issues = validateTypeContracts([cmp], contracts)
    const labelIssue = issues.find((i) => i.path === "props.label")
    expect(labelIssue).toBeDefined()
    expect(labelIssue!.message).toContain("string")
    expect(labelIssue!.message).toContain("number")
  })

  it("detects unknown semantic type", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.bad",
      semanticType: "NonExistentWidget" as never,
      props: { label: "test" },
    })
    const issues = validateTypeContracts([cmp], contracts)
    expect(issues).toHaveLength(1)
    expect(issues[0].type).toBe("contract-violation")
    expect(issues[0].path).toBe("semanticType")
    expect(issues[0].message).toContain("NonExistentWidget")
  })

  it("allows extra props not in contract (no error)", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.btn",
      semanticType: "Button",
      props: { label: "OK", customProp: "extra" as never },
    })
    const issues = validateTypeContracts([cmp], contracts)
    expect(issues).toHaveLength(0)
  })

  it("validates multiple components with mixed valid/invalid", () => {
    const valid = makeComponent({
      logicalKey: "cmp.valid",
      semanticType: "Button",
      props: { label: "Valid" },
    })
    const missingRequired = makeComponent({
      logicalKey: "cmp.bad1",
      semanticType: "FormField",
      props: {},
    })
    const unknownType = makeComponent({
      logicalKey: "cmp.bad2",
      semanticType: "FakeWidget" as never,
    })
    const issues = validateTypeContracts([valid, missingRequired, unknownType], contracts)
    expect(issues.length).toBeGreaterThanOrEqual(3)
    expect(issues.some((i) => i.nodeId === "cmp.valid")).toBe(false)
    expect(issues.some((i) => i.nodeId === "cmp.bad1")).toBe(true)
    expect(issues.some((i) => i.nodeId === "cmp.bad2")).toBe(true)
  })

  it("accepts binding values as valid for any prop type", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.bound",
      semanticType: "Button",
      props: {
        label: { bind: { kind: "dataSource", ref: "ds.test" } } as never,
      },
    })
    const issues = validateTypeContracts([cmp], contracts)
    expect(issues).toHaveLength(0)
  })

  it("validates boolean props correctly", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.toggle",
      semanticType: "Toggle",
      props: { label: "Switch", defaultChecked: "not-a-boolean" as never },
    })
    const issues = validateTypeContracts([cmp], contracts)
    const boolIssue = issues.find((i) => i.path === "props.defaultChecked")
    expect(boolIssue).toBeDefined()
    expect(boolIssue!.message).toContain("boolean")
  })

  it("validates number props correctly", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.num",
      semanticType: "NumberField",
      props: { label: "Amount", min: "not-a-number" as never },
    })
    const issues = validateTypeContracts([cmp], contracts)
    const numIssue = issues.find((i) => i.path === "props.min")
    expect(numIssue).toBeDefined()
    expect(numIssue!.message).toContain("number")
  })

  it("validates string[] props correctly", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.upload",
      semanticType: "FileUpload",
      props: { label: "Files", accept: "not-an-array" as never },
    })
    const issues = validateTypeContracts([cmp], contracts)
    const arrIssue = issues.find((i) => i.path === "props.accept")
    expect(arrIssue).toBeDefined()
    expect(arrIssue!.message).toContain("string[]")
  })

  it("validates record props correctly", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.dt",
      semanticType: "DataTable",
      props: { columns: "not-a-record" as never },
    })
    const issues = validateTypeContracts([cmp], contracts)
    const recIssue = issues.find((i) => i.path === "props.columns")
    expect(recIssue).toBeDefined()
    expect(recIssue!.message).toContain("record")
  })

  it("handles component with undefined props", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.noProps",
      semanticType: "Container",
    })
    delete (cmp as Record<string, unknown>).props
    const issues = validateTypeContracts([cmp], contracts)
    expect(issues).toHaveLength(0)
  })

  it("returns empty issues for empty components array", () => {
    const issues = validateTypeContracts([], contracts)
    expect(issues).toHaveLength(0)
  })

  it("validates number[] props correctly", () => {
    const cmp = makeComponent({
      logicalKey: "cmp.split",
      semanticType: "Splitter",
      props: { sizes: ["not", "numbers"] as never },
    })
    const issues = validateTypeContracts([cmp], contracts)
    const arrIssue = issues.find((i) => i.path === "props.sizes")
    expect(arrIssue).toBeDefined()
    expect(arrIssue!.message).toContain("number[]")
  })
})
