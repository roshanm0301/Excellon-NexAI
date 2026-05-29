import { useRef, useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { Button, Badge, Banner } from '../../design-system'
import { validateExpression } from '../../config/studioApi'

export interface ExpressionEditorProps {
  value: string
  onChange: (expr: string) => void
  availableFields?: string[]
  readOnly?: boolean
}

export function ExpressionEditor({ value, onChange, availableFields = [], readOnly = false }: ExpressionEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const [validating, setValidating] = useState(false)
  const [validResult, setValidResult] = useState<{ valid: boolean; error?: string } | null>(null)

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const insertField = (fieldName: string) => {
    const editor = editorRef.current
    if (!editor) return
    const selection = editor.getSelection()
    if (!selection) return
    editor.executeEdits('insert-field', [{
      range: selection,
      text: fieldName,
      forceMoveMarkers: true,
    }])
    editor.focus()
  }

  const handleValidate = async () => {
    setValidating(true)
    setValidResult(null)
    try {
      const result = await validateExpression(value)
      setValidResult(result)
    } catch {
      setValidResult({ valid: false, error: 'Validation request failed' })
    } finally {
      setValidating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Monaco editor */}
      <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <Editor
          height={200}
          language="javascript"
          value={value}
          onChange={v => onChange(v ?? '')}
          onMount={handleMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            lineNumbers: 'off',
            folding: false,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: 'hidden', alwaysConsumeMouseWheel: false },
          }}
          theme="vs-light"
        />
      </div>

      {/* Field chips */}
      {availableFields.length > 0 && !readOnly && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', alignSelf: 'center', marginRight: 4 }}>
            Insert field:
          </span>
          {availableFields.map(fieldName => (
            <button
              key={fieldName}
              onClick={() => insertField(fieldName)}
              style={{
                padding: '2px 8px',
                background: 'var(--brand-50)',
                border: '1px solid var(--brand-200)',
                borderRadius: '9999px',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--brand-700)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {fieldName}
            </button>
          ))}
        </div>
      )}

      {/* Validate */}
      {!readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleValidate}
            loading={validating}
          >
            Validate
          </Button>
          {validResult && validResult.valid && (
            <Badge variant="success">Expression is valid</Badge>
          )}
        </div>
      )}

      {/* Error banner */}
      {validResult && !validResult.valid && validResult.error && (
        <Banner variant="error" title="Expression Error" message={validResult.error} />
      )}
    </div>
  )
}
