// Phase 4 §7 — runtime-preview public barrel
export { Renderer } from "./Renderer"
export { buildRenderTree } from "./buildRenderTree"
export { componentMap, getComponentForType } from "./componentMap"
export { NodeRegistry } from "./nodeRegistry"
export { NodeRegistryProvider } from "./NodeRegistryProvider"
export {
  useNodeRegistry,
  useNodeRef,
  useRegistrySnapshot,
  useContainerRef,
} from "./useNodeRegistryHooks"
export { toCanvasSpace } from "./types"
export type {
  RuntimeComponentProps,
  RenderTreeNode,
  LayoutProps,
  NodeRegistryEntry,
} from "./types"
