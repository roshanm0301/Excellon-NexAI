// Phase 4 §7.2 / Phase 5 T8.1.2 — rect tracking engine (OI-P4-1 spike)
// Single shared ResizeObserver + IntersectionObserver per registry instance.
// Rects batched via requestAnimationFrame to avoid layout thrashing.

import type { CascadeLevel, OriginState } from "@/domain/types"
import type { NodeRegistryEntry } from "./types"

interface TrackedNode {
  element: HTMLElement
  level: CascadeLevel
  origin: OriginState
}

export class NodeRegistry {
  private entries = new Map<string, NodeRegistryEntry>()
  private snapshot: ReadonlyMap<string, NodeRegistryEntry> = new Map()
  private tracked = new Map<string, TrackedNode>()
  private listeners = new Set<() => void>()
  private resizeObserver: ResizeObserver
  private intersectionObserver: IntersectionObserver | null = null
  private pendingUpdate = false
  private containerEl: HTMLElement | null = null

  constructor() {
    this.resizeObserver = new ResizeObserver(this.handleResize)
  }

  setContainer(el: HTMLElement | null): void {
    if (this.containerEl === el) return
    this.containerEl = el

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }

    if (el) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection,
        { root: el, threshold: [0, 0.01, 1] },
      )
      for (const [, tracked] of this.tracked) {
        this.intersectionObserver.observe(tracked.element)
      }
    }
  }

  register(
    logicalKey: string,
    element: HTMLElement,
    level: CascadeLevel,
    origin: OriginState,
  ): void {
    const existing = this.tracked.get(logicalKey)
    if (existing) {
      this.resizeObserver.unobserve(existing.element)
      this.intersectionObserver?.unobserve(existing.element)
    }

    this.tracked.set(logicalKey, { element, level, origin })
    this.resizeObserver.observe(element)
    this.intersectionObserver?.observe(element)

    this.updateRect(logicalKey, element, level, origin, true)
  }

  unregister(logicalKey: string): void {
    const tracked = this.tracked.get(logicalKey)
    if (!tracked) return

    this.resizeObserver.unobserve(tracked.element)
    this.intersectionObserver?.unobserve(tracked.element)
    this.tracked.delete(logicalKey)
    this.entries.delete(logicalKey)
    this.notify()
  }

  getRect(logicalKey: string): DOMRectReadOnly | null {
    return this.entries.get(logicalKey)?.rect ?? null
  }

  getEntry(logicalKey: string): NodeRegistryEntry | null {
    return this.entries.get(logicalKey) ?? null
  }

  getAll(): ReadonlyMap<string, NodeRegistryEntry> {
    return this.entries
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  // useSyncExternalStore compares by reference — return a fresh Map after mutations
  getSnapshot(): ReadonlyMap<string, NodeRegistryEntry> {
    return this.snapshot
  }

  destroy(): void {
    this.resizeObserver.disconnect()
    this.intersectionObserver?.disconnect()
    this.tracked.clear()
    this.entries.clear()
    this.listeners.clear()
  }

  recalculateAll(): void {
    for (const [key, tracked] of this.tracked) {
      this.updateRect(key, tracked.element, tracked.level, tracked.origin, true)
    }
  }

  private updateRect(
    logicalKey: string,
    element: HTMLElement,
    level: CascadeLevel,
    origin: OriginState,
    visible: boolean,
  ): void {
    const rect = element.getBoundingClientRect()
    const existing = this.entries.get(logicalKey)

    if (existing && rectsEqual(existing.rect, rect) && existing.visible === visible) {
      return
    }

    this.entries.set(logicalKey, { rect, level, origin, visible })
    this.scheduleNotify()
  }

  private scheduleNotify(): void {
    if (this.pendingUpdate) return
    this.pendingUpdate = true
    requestAnimationFrame(() => {
      this.pendingUpdate = false
      this.notify()
    })
  }

  private notify(): void {
    this.snapshot = new Map(this.entries)
    for (const listener of this.listeners) {
      listener()
    }
  }

  private handleResize = (entries: ResizeObserverEntry[]): void => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement
      for (const [key, tracked] of this.tracked) {
        if (tracked.element === el) {
          const existing = this.entries.get(key)
          this.updateRect(key, el, tracked.level, tracked.origin, existing?.visible ?? true)
          break
        }
      }
    }
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement
      for (const [key, tracked] of this.tracked) {
        if (tracked.element === el) {
          this.updateRect(key, el, tracked.level, tracked.origin, entry.isIntersecting)
          break
        }
      }
    }
  }
}

function rectsEqual(a: DOMRectReadOnly, b: DOMRectReadOnly): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  )
}
