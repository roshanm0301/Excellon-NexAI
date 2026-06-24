// Phase 4 §7.2 — NodeRegistry React context (separate file for react-refresh)

import { createContext } from "react"
import type { NodeRegistry } from "./nodeRegistry"

export const NodeRegistryContext = createContext<NodeRegistry | null>(null)
