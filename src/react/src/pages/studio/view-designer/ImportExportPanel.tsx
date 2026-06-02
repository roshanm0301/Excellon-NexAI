/**
 * ImportExportPanel — JSON export, import, clone, and template operations
 *
 * Provides:
 * - Export current view as JSON file
 * - Import view from JSON file
 * - Clone current view
 * - Save as template / Load from template
 */

import { useState, useCallback, useRef } from 'react'
import { Download, Upload, Copy, FileJson, FolderOpen } from 'lucide-react'
import { Button, useToast } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import { useCreateView } from '../../../hooks/useViewStudio'
import type { ViewPayload, CreateViewRequest } from '../../../types/viewStudio'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ViewExport {
  version: '1.0'
  exported_at: string
  view_meta: {
    view_label: string
    surface_type: string
    primary_entity: string
    view_code?: string
  }
  payload: ViewPayload
}

interface ViewTemplate {
  template_name: string
  description?: string
  surface_type: string
  payload: ViewPayload
  created_at: string
}

const TEMPLATE_STORAGE_KEY = 'excellon_view_templates'

// ─── Component ───────────────────────────────────────────────────────────────

export function ImportExportPanel({
  viewLabel,
  surfaceType,
  primaryEntity,
  viewCode,
}: {
  viewLabel: string
  surfaceType: string
  primaryEntity: string
  viewCode?: string
}) {
  const { payload } = useCanvasStore()
  const { success, error } = useToast()
  const createMut = useCreateView()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // ─── Export ────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (!payload) {
      error('Export failed', 'No payload to export')
      return
    }

    const exportData: ViewExport = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      view_meta: {
        view_label: viewLabel,
        surface_type: surfaceType,
        primary_entity: primaryEntity,
        view_code: viewCode,
      },
      payload,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `view-${viewCode || 'export'}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    success('Exported', 'View exported as JSON')
  }, [payload, viewLabel, surfaceType, primaryEntity, viewCode, success, error])

  // ─── Import ────────────────────────────────────────────────────────────

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ViewExport
        if (!data.payload?.component_tree) {
          error('Import failed', 'Invalid view file: missing component_tree')
          return
        }

        // Create a new view from the imported data
        const req: CreateViewRequest = {
          view_label: `${data.view_meta.view_label} (Imported)`,
          surface_type: data.view_meta.surface_type as CreateViewRequest['surface_type'],
          primary_entity: data.view_meta.primary_entity,
          payload: data.payload,
        }

        createMut.mutate(req, {
          onSuccess: () => success('Imported', 'View created from import'),
          onError: () => error('Import failed', 'Could not create view from import'),
        })
      } catch {
        error('Import failed', 'Could not parse JSON file')
      }
    }
    reader.readAsText(file)

    // Reset input
    e.target.value = ''
  }, [createMut, success, error])

  // ─── Clone ─────────────────────────────────────────────────────────────

  const handleClone = useCallback(() => {
    if (!payload) return

    const req: CreateViewRequest = {
      view_label: `${viewLabel} (Clone)`,
      surface_type: surfaceType as CreateViewRequest['surface_type'],
      primary_entity: primaryEntity,
      payload,
    }

    createMut.mutate(req, {
      onSuccess: () => success('Cloned', 'View cloned successfully'),
      onError: () => error('Clone failed', 'Could not clone view'),
    })
  }, [payload, viewLabel, surfaceType, primaryEntity, createMut, success, error])

  // ─── Templates ─────────────────────────────────────────────────────────

  const handleSaveTemplate = useCallback(() => {
    if (!payload) return

    const name = prompt('Template name:')
    if (!name) return

    const template: ViewTemplate = {
      template_name: name,
      surface_type: surfaceType,
      payload,
      created_at: new Date().toISOString(),
    }

    const templates = getTemplates()
    templates.push(template)
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
    success('Saved', `Template "${name}" saved`)
  }, [payload, surfaceType, success])

  return (
    <div className="ie-panel">
      <div className="pp-section__title">
        <FileJson size={14} style={{ marginRight: 4 }} />
        Import / Export
      </div>

      <div className="ie-actions">
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={!payload}>
          <Download size={12} /> Export JSON
        </Button>
        <Button variant="secondary" size="sm" onClick={handleImportClick}>
          <Upload size={12} /> Import JSON
        </Button>
        <Button variant="secondary" size="sm" onClick={handleClone} disabled={!payload || createMut.isPending}>
          <Copy size={12} /> Clone View
        </Button>
        <Button variant="secondary" size="sm" onClick={handleSaveTemplate} disabled={!payload}>
          <Download size={12} /> Save as Template
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
          <FolderOpen size={12} /> Templates
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Template list */}
      {showTemplates && (
        <TemplateList
          surfaceType={surfaceType}
          primaryEntity={primaryEntity}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
}

// ─── Template List ───────────────────────────────────────────────────────────

function TemplateList({
  surfaceType,
  primaryEntity,
  onClose,
}: {
  surfaceType: string
  primaryEntity: string
  onClose: () => void
}) {
  const createMut = useCreateView()
  const { success, error } = useToast()
  const templates = getTemplates()

  const handleUseTemplate = (template: ViewTemplate) => {
    const req: CreateViewRequest = {
      view_label: `${template.template_name} (from template)`,
      surface_type: (template.surface_type || surfaceType) as CreateViewRequest['surface_type'],
      primary_entity: primaryEntity,
      payload: template.payload,
    }

    createMut.mutate(req, {
      onSuccess: () => { success('Created', 'View created from template'); onClose() },
      onError: () => error('Failed', 'Could not create view from template'),
    })
  }

  const handleDelete = (idx: number) => {
    const t = [...templates]
    t.splice(idx, 1)
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(t))
    onClose()
  }

  return (
    <div className="ie-templates">
      <div className="ie-templates__header">
        <span>Templates ({templates.length})</span>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
      {templates.length === 0 && <p className="pp-empty-msg">No saved templates.</p>}
      {templates.map((t, idx) => (
        <div key={idx} className="ie-template-item">
          <div className="ie-template-item__info">
            <span className="ie-template-item__name">{t.template_name}</span>
            <span className="ie-template-item__meta">{t.surface_type} · {formatDate(t.created_at)}</span>
          </div>
          <div className="ie-template-item__actions">
            <Button variant="ghost" size="sm" onClick={() => handleUseTemplate(t)}>Use</Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(idx)}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTemplates(): ViewTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}
