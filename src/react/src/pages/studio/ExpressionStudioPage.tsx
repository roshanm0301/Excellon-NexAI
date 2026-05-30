import { useState } from 'react'
import { PageLayout, Button, Banner, JsonViewer, Textarea } from '../../design-system'
import { ExpressionEditor } from '../../components/expression/ExpressionEditor'
import { evaluateExpression, validateExpression } from '../../config/studioApi'

const DEFAULT_EXPRESSION = 'payload.customer_name & " — " & payload.status'
const DEFAULT_DATA = JSON.stringify({ customer_name: 'Acme Corp', status: 'ACTIVE' }, null, 2)

type ResultState =
  | { kind: 'idle' }
  | { kind: 'valid' }
  | { kind: 'invalid'; message: string }
  | { kind: 'result'; value: unknown }
  | { kind: 'evalError'; message: string }

export default function ExpressionStudioPage() {
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION)
  const [sampleData, setSampleData] = useState(DEFAULT_DATA)
  const [result, setResult] = useState<ResultState>({ kind: 'idle' })
  const [loading, setLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  function parseData(): Record<string, unknown> | null {
    try {
      return JSON.parse(sampleData) as Record<string, unknown>
    } catch {
      setDataError('Sample data is not valid JSON')
      return null
    }
  }

  async function handleValidate() {
    setLoading(true)
    setResult({ kind: 'idle' })
    try {
      const res = await validateExpression(expression)
      if (res.valid) {
        setResult({ kind: 'valid' })
      } else {
        setResult({ kind: 'invalid', message: res.error ?? 'Invalid expression' })
      }
    } catch {
      setResult({ kind: 'invalid', message: 'Validation request failed' })
    } finally {
      setLoading(false)
    }
  }

  async function handleEvaluate() {
    setDataError(null)
    const data = parseData()
    if (!data) return

    setLoading(true)
    setResult({ kind: 'idle' })
    try {
      const res = await evaluateExpression(expression, data)
      if (res.error) {
        setResult({ kind: 'evalError', message: res.error })
      } else {
        setResult({ kind: 'result', value: res.result })
      }
    } catch {
      setResult({ kind: 'evalError', message: 'Evaluation request failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title="Expression Studio">
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Two-panel editor row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 8 }}>
              Expression (JSONata)
            </div>
            <ExpressionEditor
              value={expression}
              onChange={setExpression}
              height={260}
            />
          </div>
          <div>
            <Textarea
              label="Sample Data (JSON)"
              value={sampleData}
              onChange={e => {
                setSampleData(e.target.value)
                setDataError(null)
              }}
              rows={12}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              error={dataError ?? undefined}
            />
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="secondary" onClick={handleValidate} disabled={loading || !expression.trim()} loading={loading}>
            Validate
          </Button>
          <Button variant="primary" onClick={handleEvaluate} disabled={loading || !expression.trim()} loading={loading}>
            Evaluate
          </Button>
        </div>

        {/* Result panel */}
        {result.kind !== 'idle' && (
          <div>
            {result.kind === 'valid' && (
              <Banner variant="success" title="Valid JSONata expression" />
            )}
            {result.kind === 'invalid' && (
              <Banner variant="error" title="Invalid expression" message={result.message} />
            )}
            {result.kind === 'evalError' && (
              <Banner variant="error" title="Evaluation error" message={result.message} />
            )}
            {result.kind === 'result' && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 8 }}>Result</div>
                <JsonViewer data={result.value} />
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
