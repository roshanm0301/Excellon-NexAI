import Editor from '@monaco-editor/react'

interface ExpressionEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number | string
  readOnly?: boolean
}

export function ExpressionEditor({ value, onChange, height = 200, readOnly = false }: ExpressionEditorProps) {
  return (
    <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <Editor
        height={height}
        language="javascript"
        value={value}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          automaticLayout: true,
        }}
        onChange={v => onChange(v ?? '')}
      />
    </div>
  )
}
