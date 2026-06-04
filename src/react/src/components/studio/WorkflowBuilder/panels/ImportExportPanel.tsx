import { useState, useRef } from 'react'
import { Drawer, Button, Textarea, Banner } from '../../../../design-system'
import type { WorkflowDefinition } from '../../../../types/workflowBuilder'
import { exportWorkflowAsJson, parseImportText } from '../utils/workflowIO'
import { useWorkflowBuilderStore } from '../../../../pages/studio/workflow-builder/useWorkflowBuilderStore'

interface ImportExportPanelProps {
  isOpen: boolean
  onClose: () => void
  tabId: string
  definition: WorkflowDefinition
  onImport: (def: WorkflowDefinition) => void
}

export function ImportExportPanel({ isOpen, onClose, tabId, definition, onImport }: ImportExportPanelProps) {
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tab = useWorkflowBuilderStore(s => s.tabs.find(t => t.id === tabId))
  const workflowName = tab?.name ?? 'workflow'

  function handleExport() {
    exportWorkflowAsJson(workflowName, definition)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        setImportText(text)
        setImportError(null)
        setImportSuccess(false)
      }
    }
    reader.readAsText(file)
    // Reset file input so the same file can be re-selected
    e.target.value = ''
  }

  function handleImport() {
    setImportError(null)
    setImportSuccess(false)
    try {
      const def = parseImportText(importText)
      onImport(def)
      setImportSuccess(true)
      setImportText('')
      setTimeout(onClose, 800)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unknown error importing workflow.')
    }
  }

  function handleClose() {
    setImportText('')
    setImportError(null)
    setImportSuccess(false)
    onClose()
  }

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 700,
    color: 'var(--fg-primary)',
    marginBottom: 8,
  }

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '16px 0',
    borderBottom: '1px solid var(--border-secondary)',
  }

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Import / Export"
      width={360}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Export section */}
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>Export</div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
            Download the current workflow as a JSON file. You can re-import it later or share it with your team.
          </p>
          <Button variant="secondary" onClick={handleExport}>
            Download workflow as JSON
          </Button>
        </div>

        {/* Import section */}
        <div style={{ ...sectionStyle, borderBottom: 'none' }}>
          <div style={sectionHeadingStyle}>Import</div>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
            Upload a JSON file or paste the JSON below. This will replace the current workflow definition.
          </p>

          {/* File picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-label="Select workflow JSON file"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose JSON file…
            </Button>
          </div>

          {/* Paste area */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--fg-secondary)',
                marginBottom: 6,
              }}
            >
              Or paste JSON here
            </label>
            <Textarea
              value={importText}
              onChange={e => {
                setImportText(e.target.value)
                setImportError(null)
                setImportSuccess(false)
              }}
              placeholder={'{\n  "definition": { ... }\n}'}
              rows={8}
              style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}
            />
          </div>

          {importError && (
            <Banner
              variant="error"
              title="Invalid workflow JSON"
              message={importError}
              onClose={() => setImportError(null)}
            />
          )}

          {importSuccess && (
            <Banner
              variant="success"
              title="Workflow imported"
              message="The workflow definition has been applied."
            />
          )}

          <Button
            variant="primary"
            onClick={handleImport}
            disabled={importText.trim() === ''}
          >
            Import
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
