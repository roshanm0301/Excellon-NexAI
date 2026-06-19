import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Undo2, Redo2, Eye, Upload, ChevronLeft, AlertTriangle, CheckCircle2, Settings, BookOpen, HelpCircle } from 'lucide-react'
import { Button, Spinner, useToast } from '../../../design-system'
import { useView, useSaveDraft, usePublishView, useComponentRegistry } from '../../../hooks/useViewStudio'
import { useCanvasStore } from './useCanvasStore'
import { LeftRail } from './LeftRail'
import { ZoneCanvas } from './ZoneCanvas'
import { PropertyPanel } from './PropertyPanel'
import { useAutoSave } from './useAutoSave'
import { PreviewCanvas } from './PreviewCanvas'
import { ViewSettingsDrawer, DrawerTab } from './ViewSettingsDrawer'
import { SurfaceGuidePanel } from './SurfaceGuidePanel'
import { validateTree, getValidationSummary } from '../../../lib/viewTreeValidator'
import type { ViewPayload, SurfaceType } from '../../../types/viewStudio'
import { SURFACE_TYPE_META } from '../../../types/viewStudio'
import './ViewDesignerPage.css'
import './PreviewCanvas.css'

export function ViewDesignerPage() {
  const { viewId } = useParams<{ viewId: string }>()
  const navigate = useNavigate()
  const { success, error, addToast } = useToast()

  const { data: viewData, isLoading } = useView(viewId)
  const saveMut = useSaveDraft(viewId ?? '')
  const publishMut = usePublishView(viewId ?? '')

  const {
    setView, reset, isDirty, payload, previewMode,
    togglePreview, undo, redo, canUndo, canRedo,
    paletteOpen, selectedKey, setRegistry,
    select, getNode, removeNode, duplicateNode, moveNodeUp, moveNodeDown,
  } = useCanvasStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('datasources')
  const [guideOpen, setGuideOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [validationPanelOpen, setValidationPanelOpen] = useState(false)

  // Load view into canvas store when data arrives
  useEffect(() => {
    if (viewData) {
      const p = viewData.latest_payload as ViewPayload
      setView(viewData.artifact_id, viewData.view_code ?? null, p, viewData.primary_entity ?? null, viewData.revision ?? 0, (viewData.surface_type ?? null) as SurfaceType | null)
    }
    return () => { reset() }
  }, [viewData, setView, reset])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      // Ignore shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
      // Tree editing shortcuts — only when not typing in a form field
      if (!inInput && selectedKey) {
        // Delete / Backspace → delete selected component
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const node = getNode(selectedKey)
          if (node && node.component_code !== 'page_root') {
            e.preventDefault()
            removeNode(selectedKey)
          }
        }
        // Escape → deselect
        if (e.key === 'Escape') {
          e.preventDefault()
          select(null)
        }
        // Ctrl+D / Cmd+D → duplicate selected component
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          const node = getNode(selectedKey)
          if (node && node.component_code !== 'page_root') {
            e.preventDefault()
            duplicateNode(selectedKey)
          }
        }
        // Alt+ArrowUp → move selected component up among siblings
        if (e.altKey && e.key === 'ArrowUp') {
          const node = getNode(selectedKey)
          if (node && node.component_code !== 'page_root') {
            e.preventDefault()
            moveNodeUp(selectedKey)
          }
        }
        // Alt+ArrowDown → move selected component down among siblings
        if (e.altKey && e.key === 'ArrowDown') {
          const node = getNode(selectedKey)
          if (node && node.component_code !== 'page_root') {
            e.preventDefault()
            moveNodeDown(selectedKey)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [undo, redo, selectedKey, getNode, removeNode, select, duplicateNode, moveNodeUp, moveNodeDown])

  // Auto-save removed — user saves manually via the Save button
  const conflictDetected = false
  void useAutoSave // keep import used

  // Tree validation + registry cache for placement guards — declared BEFORE handleSave to avoid TDZ
  const { data: registry } = useComponentRegistry()

  useEffect(() => {
    if (registry) {
      setRegistry(registry)
    }
  }, [registry, setRegistry])

  const validation = useMemo(() => {
    if (!payload?.component_tree || !registry) return null
    const surfaceType = (viewData?.surface_type ?? 'standard_crud') as SurfaceType
    return validateTree(payload.component_tree, registry, surfaceType)
  }, [payload?.component_tree, registry, viewData?.surface_type])

  const validationSummary = useMemo(() => {
    if (!validation) return null
    return getValidationSummary(validation)
  }, [validation])

  const handleSave = useCallback(() => {
    if (!payload || !viewId) return
    // Warn (but don't block) if the tree has validation errors
    if (validationSummary && !validationSummary.isValid) {
      addToast({
        type: 'warning',
        message: `Draft saved with ${validationSummary.errorCount} error(s). Fix errors before publishing.`,
      })
    }
    saveMut.mutate({ payload }, {
      onSuccess: () => {
        if (!validationSummary || validationSummary.isValid) {
          success('Saved', 'Draft saved successfully')
        }
      },
      onError: () => error('Save failed', 'Could not save draft'),
    })
  }, [payload, viewId, saveMut, validationSummary, addToast, success, error])

  const handlePublish = useCallback(() => {
    if (!viewId) return
    publishMut.mutate({}, {
      onSuccess: () => success('Published', 'View is now live'),
      onError: (e) => error('Publish failed', e.message),
    })
  }, [viewId, publishMut, success, error])

  if (isLoading) {
    return (
      <div className="vd-loading">
        <Spinner />
      </div>
    )
  }

  if (!viewData) {
    return (
      <div className="vd-loading">
        <p>View not found</p>
        <Button variant="secondary" onClick={() => navigate('/studio/views')}>
          Back to Views
        </Button>
      </div>
    )
  }

  return (
    <div className="vd-page">
      {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
      <header className="vd-toolbar" data-testid="vd-toolbar">
        <div className="vd-toolbar__left">
          <Button variant="ghost" size="sm" onClick={() => navigate('/studio/views')}>
            <ChevronLeft size={16} />
          </Button>
          <div className="vd-toolbar__title">
            <div className="vd-toolbar__title-row">
              <span className="vd-toolbar__label">{viewData.view_label || viewData.artifact_name}</span>
              {viewData.view_code && (
                <span className="vd-toolbar__viewcode">{viewData.view_code}</span>
              )}
              {isDirty && <span className="vd-toolbar__dirty">● unsaved</span>}
            </div>
            <span className="vd-toolbar__meta">
              {viewData.surface_type ? (SURFACE_TYPE_META[viewData.surface_type as SurfaceType]?.label ?? viewData.surface_type) : ''}
              <button
                className="vd-surface-guide-btn"
                onClick={() => setGuideOpen(true)}
                title="Open Surface Type Guide"
                aria-label="Surface type guide"
              >
                <BookOpen size={12} />
              </button>
              {viewData.primary_entity ? `· ${viewData.primary_entity}` : ''}
            </span>
          </div>
        </div>
        <div className="vd-toolbar__right">
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
            <Undo2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Y)">
            <Redo2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={togglePreview} title="Toggle Preview" data-testid="vd-preview-btn">
            <Eye size={16} />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saveMut.isPending}
            data-testid="vd-save-btn"
          >
            <Save size={14} />
            {saveMut.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishMut.isPending || (validationSummary ? !validationSummary.isValid : false)}
            title={validationSummary && !validationSummary.isValid ? `${validationSummary.errorCount} error(s) must be fixed before publishing` : undefined}
            data-testid="vd-publish-btn"
          >
            <Upload size={14} />
            {publishMut.isPending ? 'Publishing...' : 'Publish'}
          </Button>
          {/* Validation indicator — click to toggle error detail panel */}
          {validationSummary && (
            <button
              className={`vd-toolbar__validation ${validationSummary.isValid ? 'vd-toolbar__validation--ok' : 'vd-toolbar__validation--error'}`}
              onClick={() => setValidationPanelOpen(v => !v)}
              title={
                validationSummary.isValid
                  ? 'Tree is valid — click to view details'
                  : `${validationSummary.errorCount} error(s), ${validationSummary.warningCount} warning(s) — click to view`
              }
              aria-label="View validation details"
              data-testid="vd-validation-indicator"
            >
              {validationSummary.isValid
                ? <CheckCircle2 size={14} />
                : <AlertTriangle size={14} />
              }
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDrawerTab('datasources'); setDrawerOpen(true) }}
            title="View Settings"
          >
            <Settings size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsOpen(s => !s)}
            title="Keyboard Shortcuts"
            aria-label="Keyboard shortcuts"
            data-testid="vd-shortcuts-btn"
          >
            <HelpCircle size={16} />
          </Button>
        </div>
      </header>

      {/* ─── Keyboard shortcuts popover ─────────────────────────────────── */}
      {shortcutsOpen && (
        <div
          className="vd-shortcuts-popover"
          role="dialog"
          aria-label="Keyboard shortcuts"
          onClick={() => setShortcutsOpen(false)}
        >
          <div className="vd-shortcuts-panel" onClick={e => e.stopPropagation()}>
            <div className="vd-shortcuts-panel__header">
              <span>Keyboard Shortcuts</span>
              <button onClick={() => setShortcutsOpen(false)} aria-label="Close">✕</button>
            </div>
            <table className="vd-shortcuts-table">
              <tbody>
                <tr><td><kbd>Ctrl+S</kbd></td><td>Save draft</td></tr>
                <tr><td><kbd>Ctrl+Z</kbd></td><td>Undo</td></tr>
                <tr><td><kbd>Ctrl+Y</kbd> / <kbd>Ctrl+Shift+Z</kbd></td><td>Redo</td></tr>
                <tr><td className="vd-shortcuts-divider" colSpan={2}>Component Tree</td></tr>
                <tr><td><kbd>Delete</kbd> / <kbd>Backspace</kbd></td><td>Delete selected component</td></tr>
                <tr><td><kbd>Escape</kbd></td><td>Deselect component</td></tr>
                <tr><td><kbd>Ctrl+D</kbd></td><td>Duplicate selected component</td></tr>
                <tr><td><kbd>Alt+↑</kbd></td><td>Move component up</td></tr>
                <tr><td><kbd>Alt+↓</kbd></td><td>Move component down</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Validation error detail panel ──────────────────────────────── */}
      {validationPanelOpen && validation && (
        <div className="vd-validation-panel" role="region" aria-label="Validation details" data-testid="vd-validation-panel">
          <div className="vd-validation-panel__header">
            <span>Validation Details</span>
            <button className="vd-validation-panel__close" onClick={() => setValidationPanelOpen(false)} aria-label="Close">✕</button>
          </div>
          {validation.errors.length === 0 && validation.warnings.length === 0 && (
            <div className="vd-validation-panel__empty">Tree is valid — no issues found.</div>
          )}
          {validation.errors.map((e, i) => (
            <div key={`err-${i}`} className="vd-validation-panel__row vd-validation-panel__row--error">
              <AlertTriangle size={12} />
              <span className="vd-validation-panel__code">{e.code}</span>
              <span className="vd-validation-panel__msg">{e.message}</span>
            </div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={`warn-${i}`} className="vd-validation-panel__row vd-validation-panel__row--warning">
              <AlertTriangle size={12} />
              <span className="vd-validation-panel__code">{w.code}</span>
              <span className="vd-validation-panel__msg">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Revision conflict banner (M5.2) ────────────────────────────── */}
      {conflictDetected && (
        <div className="autosave-conflict" role="alert">
          <span>Another editor changed this view. Reload to see latest.</span>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}

      {/* ─── Main Canvas Area ────────────────────────────────────────────── */}
      <div className="vd-body">
        {/* Left: Component Palette */}
        {paletteOpen && !previewMode && (
          <aside className="vd-sidebar vd-sidebar--left">
            <LeftRail />
          </aside>
        )}

        {/* Center: Canvas / Tree / Preview */}
        <main className="vd-canvas">
          {previewMode
            ? <PreviewCanvas />
            : <ZoneCanvas />
          }
        </main>

        {/* Right: Property Panel */}
        {!previewMode && (
          <aside className="vd-sidebar vd-sidebar--right">
            <PropertyPanel />
          </aside>
        )}
      </div>

      {/* ─── Settings Drawer ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <ViewSettingsDrawer
          viewId={viewId ?? ''}
          viewLabel={viewData.view_label || viewData.artifact_name || ''}
          surfaceType={viewData.surface_type ?? 'standard_crud'}
          primaryEntity={viewData.primary_entity ?? ''}
          viewCode={viewData.view_code}
          onClose={() => setDrawerOpen(false)}
          initialTab={drawerTab}
        />
      )}

      {guideOpen && (
        <SurfaceGuidePanel
          initialSurface={(viewData.surface_type ?? 'standard_crud') as SurfaceType}
          onClose={() => setGuideOpen(false)}
        />
      )}
    </div>
  )
}

export default ViewDesignerPage
