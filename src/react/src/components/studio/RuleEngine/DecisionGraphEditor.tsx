import { DecisionGraph, type DecisionGraphType } from '@gorules/jdm-editor'
import '@gorules/jdm-editor/dist/style.css'
import type { GoRulesDecisionGraph } from '../../../config/studioApi'

interface DecisionGraphEditorProps {
  graph: GoRulesDecisionGraph
  onChange: (graph: GoRulesDecisionGraph) => void
}

export function DecisionGraphEditor({ graph, onChange }: DecisionGraphEditorProps) {
  const value = {
    nodes: graph.nodes ?? [],
    edges: graph.edges ?? [],
  } as unknown as DecisionGraphType

  return (
    <div style={{
      height: 'calc(100vh - 280px)',
      minHeight: 520,
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      <DecisionGraph
        value={value}
        onChange={(nextValue: DecisionGraphType) => onChange({
          contentType: 'application/vnd.gorules.decision',
          nodes: (nextValue.nodes ?? []) as unknown as Array<Record<string, unknown>>,
          edges: (nextValue.edges ?? []) as unknown as Array<Record<string, unknown>>,
        })}
        reactFlowProOptions={{ hideAttribution: true }}
      />
    </div>
  )
}

export function createBlankDecisionGraph(): GoRulesDecisionGraph {
  return {
    contentType: 'application/vnd.gorules.decision',
    nodes: [],
    edges: [],
  }
}
