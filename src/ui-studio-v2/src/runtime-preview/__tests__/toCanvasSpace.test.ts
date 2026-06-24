// Phase 4 §7.2 — unit test for toCanvasSpace zoom correction
import { describe, it, expect } from "vitest"
import { toCanvasSpace } from "@/runtime-preview/types"

describe("toCanvasSpace", () => {
  it("returns the same rect at zoom 1", () => {
    const rect = new DOMRect(10, 20, 100, 50)
    const result = toCanvasSpace(rect, 1)
    expect(result).toBe(rect)
  })

  it("divides by zoom at 150%", () => {
    const rect = new DOMRect(15, 30, 150, 75)
    const result = toCanvasSpace(rect, 1.5)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it("divides by zoom at 50%", () => {
    const rect = new DOMRect(5, 10, 50, 25)
    const result = toCanvasSpace(rect, 0.5)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it("divides by zoom at 200%", () => {
    const rect = new DOMRect(20, 40, 200, 100)
    const result = toCanvasSpace(rect, 2)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })
})
