/**
 * GlobalWorkflowSearch — command-palette style modal for searching steps
 * across all open workflow tabs.
 *
 * NOTE: Currently searches only the open tabs (available in the store).
 * To extend to backend search, call `listWorkflowArtifacts()` from studioApi.ts
 * and parse each artifact's `definition.sequence`.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { Badge } from '../../../../design-system'
import { useWorkflowBuilderStore } from '../../../../pages/studio/workflow-builder/useWorkflowBuilderStore'
import type { WorkflowStep } from '../../../../types/workflowBuilder'

interface SearchResult {
  tabId: string
  tabName: string
  step: WorkflowStep
}

interface GlobalWorkflowSearchProps {
  onClose: () => void
}

function collectSteps(steps: WorkflowStep[]): WorkflowStep[] {
  const result: WorkflowStep[] = []
  for (const s of steps) {
    result.push(s)
    if (s.branches) {
      for (const branch of Object.values(s.branches)) {
        result.push(...collectSteps(branch))
      }
    }
  }
  return result
}

export function GlobalWorkflowSearch({ onClose }: GlobalWorkflowSearchProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const tabs = useWorkflowBuilderStore(s => s.tabs)
  const selectNode = useWorkflowBuilderStore(s => s.selectNode)
  const setActiveTab = useWorkflowBuilderStore(s => s.setActiveTab)

  // Auto-focus input on open
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [])

  // Build search results — memoized so they only recompute when query or tabs change
  const results: SearchResult[] = useMemo(() => {
    if (query.trim() === '') return []
    const q = query.toLowerCase()
    const out: SearchResult[] = []
    for (const tab of tabs) {
      const allSteps = collectSteps(tab.definition.sequence)
      for (const step of allSteps) {
        if (step.type === 'start' || step.type === 'end') continue
        if (
          step.name.toLowerCase().includes(q) ||
          step.type.toLowerCase().includes(q) ||
          step.id.toLowerCase().includes(q)
        ) {
          out.push({ tabId: tab.id, tabName: tab.name, step })
        }
      }
    }
    return out
  }, [query, tabs])

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  function handleSelect(result: SearchResult) {
    setActiveTab(result.tabId)
    selectNode(result.tabId, result.step.id)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      handleSelect(results[highlightedIndex])
    }
  }

  // Group results by tab — memoized on results
  const grouped = useMemo(() => {
    const map: Map<string, { tabName: string; results: SearchResult[]; offset: number }> = new Map()
    let offset = 0
    for (const r of results) {
      if (!map.has(r.tabId)) {
        map.set(r.tabId, { tabName: r.tabName, results: [], offset })
      }
      map.get(r.tabId)!.results.push(r)
    }
    // Pre-compute per-tab global index offsets
    for (const group of map.values()) {
      group.offset = offset
      offset += group.results.length
    }
    return map
  }, [results])

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        style={{
          width: 560,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--color-surface, #1a1a2e)',
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 160px)',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Global workflow search"
        aria-modal="true"
      >
        {/* Search input */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            aria-label="Search steps across all open workflows"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search steps across all open workflows…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.9375rem',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
                padding: 4,
                display: 'flex',
                fontFamily: 'inherit',
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
          {query.trim() === '' ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.8125rem',
              }}
            >
              Type to search steps across all open workflow tabs
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.8125rem',
              }}
            >
              No matching steps found in open workflows
            </div>
          ) : (
            Array.from(grouped.entries()).map(([tabId, group]) => {
              const globalIdx = group.offset
              return (
                <div key={tabId}>
                  {/* Tab group heading */}
                  <div
                    style={{
                      padding: '8px 16px 4px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {group.tabName}
                  </div>

                  {group.results.map((result, localIdx) => {
                    const idx = globalIdx + localIdx
                    const isHighlighted = idx === highlightedIndex
                    return (
                      <button
                        key={`${result.tabId}-${result.step.id}`}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 16px',
                          background: isHighlighted ? 'rgba(255,255,255,0.08)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'background 0.1s',
                        }}
                      >
                        {/* Step name */}
                        <span
                          style={{
                            flex: 1,
                            fontSize: '0.875rem',
                            color: 'rgba(255,255,255,0.88)',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {result.step.name}
                        </span>

                        {/* Type badge */}
                        <Badge variant="neutral" dot={false}>
                          {result.step.type}
                        </Badge>

                        {/* Workflow label (dimmed) */}
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'rgba(255,255,255,0.3)',
                            whiteSpace: 'nowrap',
                            maxWidth: 100,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {group.tabName}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 16,
              fontSize: '0.6875rem',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
            <span style={{ marginLeft: 'auto' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}
