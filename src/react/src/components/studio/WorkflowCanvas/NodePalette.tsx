import { type DragEvent } from 'react'
import {
  Play, Square, UserCheck, Server, Code2, Clock,
  Workflow, AlertTriangle, GitBranch, GitMerge,
} from 'lucide-react'
import type { StepType } from '../../../config/studioApi'

interface PaletteItem {
  type: 'start' | 'end' | 'task' | 'gateway'
  stepType?: StepType
  gatewayType?: 'parallel' | 'exclusive' | 'inclusive'
  isJoin?: boolean
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'start', label: 'Start', icon: <Play size={16} />, color: 'var(--success-500)', description: 'Workflow entry point' },
  { type: 'end', label: 'End', icon: <Square size={16} />, color: 'var(--error-500)', description: 'Workflow termination' },
  { type: 'task', stepType: 'approval', label: 'Approval', icon: <UserCheck size={16} />, color: 'var(--warning-500)', description: 'Human approval step' },
  { type: 'task', stepType: 'service_call', label: 'Service Call', icon: <Server size={16} />, color: 'var(--brand-500)', description: 'Invoke external service' },
  { type: 'task', stepType: 'script', label: 'Script', icon: <Code2 size={16} />, color: 'var(--neutral-600)', description: 'JSONata expression' },
  { type: 'task', stepType: 'wait', label: 'Wait / Timer', icon: <Clock size={16} />, color: 'var(--neutral-400)', description: 'Pause execution' },
  { type: 'task', stepType: 'sub_workflow', label: 'Sub-Workflow', icon: <Workflow size={16} />, color: 'var(--success-500)', description: 'Nested workflow' },
  { type: 'task', stepType: 'rule_evaluation', label: 'Rule Eval', icon: <AlertTriangle size={16} />, color: 'var(--error-400)', description: 'Evaluate rule set' },
  { type: 'gateway', gatewayType: 'parallel', label: 'Parallel Split', icon: <GitBranch size={16} />, color: 'var(--brand-600)', description: 'All branches execute' },
  { type: 'gateway', gatewayType: 'exclusive', label: 'Exclusive Split', icon: <GitBranch size={16} />, color: 'var(--warning-600)', description: 'First matching branch' },
  { type: 'gateway', gatewayType: 'inclusive', label: 'Inclusive Split', icon: <GitBranch size={16} />, color: 'var(--success-600)', description: 'All matching branches' },
  { type: 'gateway', gatewayType: 'parallel', isJoin: true, label: 'Join (All)', icon: <GitMerge size={16} />, color: 'var(--brand-600)', description: 'Wait for all branches' },
  { type: 'gateway', gatewayType: 'inclusive', isJoin: true, label: 'Join (Any)', icon: <GitMerge size={16} />, color: 'var(--success-600)', description: 'Wait for any branch' },
]

interface NodePaletteProps {
  collapsed?: boolean
}

export function NodePalette({ collapsed }: NodePaletteProps) {
  const onDragStart = (event: DragEvent, item: PaletteItem) => {
    const payload = JSON.stringify({
      type: item.type,
      stepType: item.stepType,
      gatewayType: item.gatewayType,
      isJoin: item.isJoin,
      label: item.label,
    })
    event.dataTransfer.setData('application/workflow-node', payload)
    event.dataTransfer.effectAllowed = 'move'
  }

  if (collapsed) return null

  return (
    <div style={{
      width: 220, borderRight: '1px solid var(--border-primary)',
      background: 'var(--bg-secondary)', overflow: 'auto',
      display: 'flex', flexDirection: 'column', gap: 0, padding: '12px 0',
    }}>
      <div style={{
        padding: '0 16px 10px', fontSize: 'var(--text-xs)',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--fg-tertiary)',
      }}>
        Node Palette
      </div>

      <SectionLabel label="Control" />
      {PALETTE_ITEMS.filter(i => i.type === 'start' || i.type === 'end').map(item => (
        <PaletteCard key={item.label} item={item} onDragStart={onDragStart} />
      ))}

      <SectionLabel label="Steps" />
      {PALETTE_ITEMS.filter(i => i.type === 'task').map(item => (
        <PaletteCard key={item.label + item.stepType} item={item} onDragStart={onDragStart} />
      ))}

      <SectionLabel label="Gateways" />
      {PALETTE_ITEMS.filter(i => i.type === 'gateway').map(item => (
        <PaletteCard key={item.label + item.gatewayType + String(item.isJoin)} item={item} onDragStart={onDragStart} />
      ))}
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '10px 16px 4px', fontSize: 10,
      fontWeight: 600, textTransform: 'uppercase',
      color: 'var(--fg-tertiary)', letterSpacing: '0.04em',
    }}>
      {label}
    </div>
  )
}

function PaletteCard({ item, onDragStart }: { item: PaletteItem; onDragStart: (e: DragEvent, item: PaletteItem) => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', cursor: 'grab',
        borderBottom: '1px solid var(--border-secondary)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 'var(--radius-md)',
        background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', flexShrink: 0,
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
          {item.label}
        </div>
        <div style={{ fontSize: 9, color: 'var(--fg-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.description}
        </div>
      </div>
    </div>
  )
}
