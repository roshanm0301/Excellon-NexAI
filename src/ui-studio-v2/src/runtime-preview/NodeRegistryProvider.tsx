// Phase 4 §7.2 / Phase 5 T8.1.2 — React provider for NodeRegistry

import { useRef, useEffect } from "react"
import { NodeRegistry } from "./nodeRegistry"
import { NodeRegistryContext } from "./NodeRegistryContext"

interface NodeRegistryProviderProps {
  children: React.ReactNode
}

export function NodeRegistryProvider({ children }: NodeRegistryProviderProps) {
  const registryRef = useRef<NodeRegistry | null>(null)
  if (registryRef.current === null) {
    registryRef.current = new NodeRegistry()
  }
  const registry = registryRef.current

  useEffect(() => {
    return () => { registry.destroy() }
  }, [registry])

  return (
    <NodeRegistryContext.Provider value={registry}>
      {children}
    </NodeRegistryContext.Provider>
  )
}
