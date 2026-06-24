// Phase 5 T8.1.1 — integration test: Renderer produces correct MUI output
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Renderer } from "@/runtime-preview/Renderer"
import { NodeRegistryProvider } from "@/runtime-preview/NodeRegistryProvider"
import type { ResolvedModel, ResolvedNode } from "@/services/interfaces"

function makeNode(
  logicalKey: string,
  kind: ResolvedNode["kind"],
  data: Record<string, unknown> = {},
): ResolvedNode {
  return {
    logicalKey,
    kind,
    cascadeLevel: "vertical",
    originState: "own",
    data: { logicalKey, kind, ...data },
  }
}

function renderWithProviders(model: ResolvedModel) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <NodeRegistryProvider>
        <Renderer model={model} />
      </NodeRegistryProvider>
    </QueryClientProvider>,
  )
}

describe("Renderer", () => {
  it("renders a page with component nodes", () => {
    const model: ResolvedModel = {
      pageId: "page.test",
      scopeId: "test",
      nodes: [
        makeNode("page.test", "page", {
          views: ["view.main"],
          layoutRef: "layout.page",
        }),
        makeNode("view.main", "view", {
          sections: ["section.info"],
          layoutRef: "layout.view",
        }),
        makeNode("section.info", "section", {
          label: "Info",
          components: ["cmp.name", "cmp.status"],
        }),
        makeNode("cmp.name", "component", {
          semanticType: "FormField",
          props: { label: "Customer Name", fieldType: "text" },
        }),
        makeNode("cmp.status", "component", {
          semanticType: "StatusChip",
          props: { label: "Active" },
        }),
        makeNode("layout.page", "layout", {
          layoutType: "stack",
          direction: "column",
        }),
        makeNode("layout.view", "layout", {
          layoutType: "form-grid",
          gap: "12px",
        }),
      ],
    }

    renderWithProviders(model)

    // FormField renders a TextField with the label
    expect(screen.getByLabelText("Customer Name")).toBeInTheDocument()

    // StatusChip renders a Chip
    expect(screen.getByText("Active")).toBeInTheDocument()

    // Section label renders
    expect(screen.getByText("Info")).toBeInTheDocument()
  })

  it("adds data-node-key attributes to rendered node wrappers", () => {
    const model: ResolvedModel = {
      pageId: "page.test",
      scopeId: "test",
      nodes: [
        makeNode("page.test", "page", { views: ["view.a"] }),
        makeNode("view.a", "view", { sections: [] }),
      ],
    }

    const { container } = renderWithProviders(model)

    const pageEl = container.querySelector('[data-node-key="page.test"]')
    const viewEl = container.querySelector('[data-node-key="view.a"]')

    expect(pageEl).toBeInTheDocument()
    expect(viewEl).toBeInTheDocument()
  })

  it("renders nothing when model has no nodes", () => {
    const model: ResolvedModel = {
      pageId: "page.test",
      scopeId: "test",
      nodes: [],
    }

    const { container } = renderWithProviders(model)
    expect(container.firstChild).toBeNull()
  })

  it("shows binding placeholder text for bound props", () => {
    const model: ResolvedModel = {
      pageId: "page.test",
      scopeId: "test",
      nodes: [
        makeNode("page.test", "page", { views: ["view.a"] }),
        makeNode("view.a", "view", {
          sections: ["section.a"],
        }),
        makeNode("section.a", "section", {
          components: ["cmp.header"],
        }),
        makeNode("cmp.header", "component", {
          semanticType: "ObjectHeader",
          props: {
            title: { bind: { kind: "dataSource", ref: "ds.order", path: "orderNumber" } },
            subtitle: "Sales Order",
          },
        }),
      ],
    }

    renderWithProviders(model)

    // Bound title should show binding path placeholder
    expect(screen.getByText("{{ ds.order.orderNumber }}")).toBeInTheDocument()
    // Literal subtitle renders as-is
    expect(screen.getByText("Sales Order")).toBeInTheDocument()
  })

  it("renders fallback placeholder for unknown semantic types", () => {
    const model: ResolvedModel = {
      pageId: "page.test",
      scopeId: "test",
      nodes: [
        makeNode("page.test", "page", { views: ["view.a"] }),
        makeNode("view.a", "view", { sections: ["section.a"] }),
        makeNode("section.a", "section", { components: ["cmp.x"] }),
        makeNode("cmp.x", "component", {
          semanticType: "UnknownWidget",
        }),
      ],
    }

    renderWithProviders(model)
    expect(screen.getByText("[UnknownWidget]")).toBeInTheDocument()
  })

  it("uses flow layout (no absolute positioning in rendered content)", () => {
    const model: ResolvedModel = {
      pageId: "page.test",
      scopeId: "test",
      nodes: [
        makeNode("page.test", "page", {
          views: ["view.a"],
          layoutRef: "layout.stack",
        }),
        makeNode("view.a", "view", { sections: [] }),
        makeNode("layout.stack", "layout", {
          layoutType: "stack",
          direction: "column",
          gap: "8px",
        }),
      ],
    }

    const { container } = renderWithProviders(model)

    const allElements = container.querySelectorAll("*")
    for (const el of allElements) {
      const style = window.getComputedStyle(el)
      // [L34] — no absolute/fixed positioning in authored layout
      expect(style.position).not.toBe("absolute")
      expect(style.position).not.toBe("fixed")
    }
  })
})
