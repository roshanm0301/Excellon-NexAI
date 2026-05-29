interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div style={{
      background: 'var(--neutral-900)', borderRadius: 'var(--radius-lg)',
      padding: '16px 20px', overflow: 'auto',
    }}>
      {language && (
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--neutral-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {language}
        </div>
      )}
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--neutral-100)', lineHeight: 'var(--lh-md)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {code}
      </pre>
    </div>
  )
}

export function JsonViewer({ data }: { data: unknown }) {
  return <CodeBlock code={JSON.stringify(data, null, 2)} language="json" />
}
