// Phase 4 §7.2 — React hooks for NodeRegistry (split for react-refresh)

import {
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react"
import type { CascadeLevel, OriginState } from "@/domain/types"
import type { NodeRegistry } from "./nodeRegistry"
import type { NodeRegistryEntry } from "./types"
import { NodeRegistryContext } from "./NodeRegistryContext"

export function useNodeRegistry(): NodeRegistry {
  const registry = useContext(NodeRegistryContext)
  if (!registry) {
    throw new Error("useNodeRegistry must be used within NodeRegistryProvider")
  }
  return registry
}

export function useNodeRef(
  logicalKey: string,
  level: CascadeLevel,
  origin: OriginState,
): (el: HTMLElement | null) => void {
  const registry = useNodeRegistry()
  const prevElRef = useRef<HTMLElement | null>(null)

  const refCallback = useCallback(
    (el: HTMLElement | null) => {
      if (prevElRef.current && prevElRef.current !== el) {
        registry.unregister(logicalKey)
      }
      prevElRef.current = el
      if (el) {
        registry.register(logicalKey, el, level, origin)
      }
    },
    [registry, logicalKey, level, origin],
  )

  useEffect(() => {
    return () => {
      if (prevElRef.current) {
        registry.unregister(logicalKey)
        prevElRef.current = null
      }
    }
  }, [registry, logicalKey])

  return refCallback
}

export function useRegistrySnapshot(): ReadonlyMap<string, NodeRegistryEntry> {
  const registry = useNodeRegistry()

  const subscribe = useMemo(
    () => (cb: () => void) => registry.subscribe(cb),
    [registry],
  )

  const getSnapshot = useMemo(
    () => () => registry.getSnapshot(),
    [registry],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useContainerRef(): (el: HTMLElement | null) => void {
  const registry = useNodeRegistry()

  return useCallback(
    (el: HTMLElement | null) => { registry.setContainer(el) },
    [registry],
  )
}
