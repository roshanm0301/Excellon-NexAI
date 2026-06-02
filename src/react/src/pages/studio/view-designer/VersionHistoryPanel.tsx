/**
 * VersionHistoryPanel — View version timeline with diff and rollback
 *
 * Shows the history of published versions for the current view,
 * displays a visual diff between versions, and supports rollback.
 */

import { useState, useCallback } from 'react'
import { History, RotateCcw, ChevronDown, ChevronRight, Clock, User } from 'lucide-react'
import { Button, Spinner } from '../../../design-system'
import { useViewVersions, useRollbackView } from '../../../hooks/useViewStudio'
import type { ViewVersion, ComponentNode } from '../../../types/viewStudio'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiffEntry {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VersionHistoryPanel({ viewId }: { viewId: string }) {
  const { data: versions, isLoading } = useViewVersions(viewId)
  const rollbackMut = useRollbackView(viewId)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [compareVersion, setCompareVersion] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  const sortedVersions = (versions?.items ?? []).slice().sort(
    (a, b) => b.version_no - a.version_no,
  )

  const handleRollback = useCallback(() => {
    if (!selectedVersion) return
    rollbackMut.mutate({})
  }, [selectedVersion, rollbackMut])

  const selectedVersionData = sortedVersions.find(v => v.version_id === selectedVersion)
  const compareVersionData = sortedVersions.find(v => v.version_id === compareVersion)

  const diff = showDiff && selectedVersionData && compareVersionData
    ? computeDiff(compareVersionData, selectedVersionData)
    : null

  if (isLoading) {
    return (
      <div className="vh-panel">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="vh-panel">
      <div className="pp-section__title">
        <History size={14} style={{ marginRight: 4 }} />
        Version History
      </div>

      {sortedVersions.length === 0 && (
        <p className="pp-empty-msg">No published versions yet.</p>
      )}

      {/* Version timeline */}
      <div className="vh-timeline">
        {sortedVersions.map((version) => (
          <VersionEntry
            key={version.version_id}
            version={version}
            isSelected={version.version_id === selectedVersion}
            isCompare={version.version_id === compareVersion}
            onSelect={() => setSelectedVersion(version.version_id)}
            onCompare={() => {
              setCompareVersion(version.version_id)
              setShowDiff(true)
            }}
          />
        ))}
      </div>

      {/* Actions */}
      {selectedVersion && (
        <div className="vh-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRollback}
            disabled={rollbackMut.isPending}
          >
            <RotateCcw size={12} />
            {rollbackMut.isPending ? 'Rolling back...' : 'Rollback to this version'}
          </Button>
        </div>
      )}

      {/* Diff view */}
      {diff && (
        <DiffView diff={diff} onClose={() => setShowDiff(false)} />
      )}
    </div>
  )
}

// ─── Version Entry ───────────────────────────────────────────────────────────

function VersionEntry({
  version,
  isSelected,
  isCompare,
  onSelect,
  onCompare,
}: {
  version: ViewVersion
  isSelected: boolean
  isCompare: boolean
  onSelect: () => void
  onCompare: () => void
}) {
  return (
    <div
      className={`vh-entry ${isSelected ? 'vh-entry--selected' : ''} ${isCompare ? 'vh-entry--compare' : ''}`}
      onClick={onSelect}
    >
      <div className="vh-entry__dot" />
      <div className="vh-entry__content">
        <div className="vh-entry__header">
          <span className="vh-entry__version">v{version.version_no}</span>
          {version.is_draft && <span className="vh-entry__badge">Draft</span>}
          {version.is_active && <span className="vh-entry__badge vh-entry__badge--active">Active</span>}
        </div>
        <div className="vh-entry__meta">
          <span><Clock size={10} /> {formatDate(version.published_at || version.created_at)}</span>
          <span><User size={10} /> {version.published_by || version.created_by}</span>
        </div>
        {isSelected && (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCompare() }} style={{ marginTop: 4 }}>
            Compare with previous
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Diff View ───────────────────────────────────────────────────────────────

function DiffView({ diff, onClose }: { diff: DiffEntry[]; onClose: () => void }) {
  return (
    <div className="vh-diff">
      <div className="vh-diff__header">
        <span className="vh-diff__title">Changes ({diff.length})</span>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
      <div className="vh-diff__body">
        {diff.length === 0 && <p className="pp-empty-msg">No differences found.</p>}
        {diff.map((entry, idx) => (
          <div key={idx} className={`vh-diff__entry vh-diff__entry--${entry.type}`}>
            <span className="vh-diff__path">{entry.path}</span>
            <span className="vh-diff__type">{entry.type}</span>
            {entry.oldValue && (
              <div className="vh-diff__old">- {truncate(entry.oldValue, 80)}</div>
            )}
            {entry.newValue && (
              <div className="vh-diff__new">+ {truncate(entry.newValue, 80)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Diff Computation ────────────────────────────────────────────────────────

function computeDiff(older: ViewVersion, newer: ViewVersion): DiffEntry[] {
  const entries: DiffEntry[] = []

  const oldTree = older.payload?.component_tree
  const newTree = newer.payload?.component_tree

  if (oldTree && newTree) {
    diffNodes(oldTree, newTree, 'root', entries)
  }

  // Compare events
  const oldEvents = older.payload?.events ?? []
  const newEvents = newer.payload?.events ?? []
  if (JSON.stringify(oldEvents) !== JSON.stringify(newEvents)) {
    entries.push({
      path: 'events',
      type: 'changed',
      oldValue: `${oldEvents.length} events`,
      newValue: `${newEvents.length} events`,
    })
  }

  // Compare datasources
  const oldDs = older.payload?.datasources ?? []
  const newDs = newer.payload?.datasources ?? []
  if (JSON.stringify(oldDs) !== JSON.stringify(newDs)) {
    entries.push({
      path: 'datasources',
      type: 'changed',
      oldValue: `${oldDs.length} sources`,
      newValue: `${newDs.length} sources`,
    })
  }

  return entries
}

function diffNodes(oldNode: ComponentNode, newNode: ComponentNode, path: string, entries: DiffEntry[]): void {
  // Check props
  if (JSON.stringify(oldNode.props) !== JSON.stringify(newNode.props)) {
    entries.push({
      path: `${path}.props`,
      type: 'changed',
      oldValue: JSON.stringify(oldNode.props),
      newValue: JSON.stringify(newNode.props),
    })
  }

  // Check bindings
  if (JSON.stringify(oldNode.bindings) !== JSON.stringify(newNode.bindings)) {
    entries.push({
      path: `${path}.bindings`,
      type: 'changed',
      oldValue: JSON.stringify(oldNode.bindings),
      newValue: JSON.stringify(newNode.bindings),
    })
  }

  // Check children
  const oldChildren = oldNode.children ?? []
  const newChildren = newNode.children ?? []

  const maxLen = Math.max(oldChildren.length, newChildren.length)
  for (let i = 0; i < maxLen; i++) {
    const oldChild = oldChildren[i]
    const newChild = newChildren[i]

    if (!oldChild && newChild) {
      entries.push({
        path: `${path}/${newChild.component_key}`,
        type: 'added',
        newValue: newChild.component_code,
      })
    } else if (oldChild && !newChild) {
      entries.push({
        path: `${path}/${oldChild.component_key}`,
        type: 'removed',
        oldValue: oldChild.component_code,
      })
    } else if (oldChild && newChild) {
      if (oldChild.component_key === newChild.component_key) {
        diffNodes(oldChild, newChild, `${path}/${oldChild.component_key}`, entries)
      } else {
        entries.push({
          path: `${path}[${i}]`,
          type: 'removed',
          oldValue: oldChild.component_code,
        })
        entries.push({
          path: `${path}[${i}]`,
          type: 'added',
          newValue: newChild.component_code,
        })
      }
    }
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}
