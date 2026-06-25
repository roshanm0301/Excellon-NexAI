import { describe, it, expect, beforeEach } from "vitest"
import { usePanelsStore } from "@/stores/panels.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useSelectionStore } from "@/stores/selection.store"

describe("panels store", () => {
  beforeEach(() => {
    usePanelsStore.setState({
      explorerVisible: true,
      inspectorVisible: true,
      bottomDockVisible: false,
      breakpoint: "desktop",
      activeMode: "explorer",
      zoomScale: 1,
    })
  })

  it("sets panel sizes", () => {
    usePanelsStore.getState().setExplorerWidth(300)
    usePanelsStore.getState().setInspectorWidth(360)
    usePanelsStore.getState().setBottomDockHeight(250)
    const s = usePanelsStore.getState()
    expect(s.explorerWidth).toBe(300)
    expect(s.inspectorWidth).toBe(360)
    expect(s.bottomDockHeight).toBe(250)
  })

  it("toggles panel visibility", () => {
    usePanelsStore.getState().toggleExplorer()
    usePanelsStore.getState().toggleInspector()
    usePanelsStore.getState().toggleBottomDock()
    const s = usePanelsStore.getState()
    expect(s.explorerVisible).toBe(false)
    expect(s.inspectorVisible).toBe(false)
    expect(s.bottomDockVisible).toBe(true)
  })

  it("sets breakpoint, mode, and zoom", () => {
    usePanelsStore.getState().setBreakpoint("mobile")
    usePanelsStore.getState().setActiveMode("preview")
    usePanelsStore.getState().setZoomScale(1.5)
    const s = usePanelsStore.getState()
    expect(s.breakpoint).toBe("mobile")
    expect(s.activeMode).toBe("preview")
    expect(s.zoomScale).toBe(1.5)
  })
})

describe("workspace store", () => {
  it("sets env, editing level, preview scope, and app", () => {
    const s = useWorkspaceStore.getState()
    s.setEnv("staging")
    s.setEditingLevel("tenant", "toyota")
    s.setPreviewScope("dealer-x", "manager")
    s.setApp("app.dms", "page.salesOrder")
    const next = useWorkspaceStore.getState()
    expect(next.env).toBe("staging")
    expect(next.editingLevel).toBe("tenant")
    expect(next.editingScopeId).toBe("toyota")
    expect(next.previewScopeId).toBe("dealer-x")
    expect(next.previewRole).toBe("manager")
    expect(next.appId).toBe("app.dms")
    expect(next.pageId).toBe("page.salesOrder")
  })
})

describe("selection store", () => {
  it("sets, hovers, and clears selection", () => {
    const s = useSelectionStore.getState()
    s.setSelected(["a", "b"])
    expect(useSelectionStore.getState().selectedKeys).toEqual(["a", "b"])
    s.setHover("a")
    expect(useSelectionStore.getState().hoverKey).toBe("a")
    s.clearSelection()
    expect(useSelectionStore.getState().selectedKeys).toEqual([])
    expect(useSelectionStore.getState().hoverKey).toBeNull()
  })
})
