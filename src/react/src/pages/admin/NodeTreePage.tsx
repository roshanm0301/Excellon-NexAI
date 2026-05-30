import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import {
  PageLayout,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  Spinner,
  useToast,
} from '../../design-system'
import { createNode, type NodeTreeItem } from '../../config/studioApi'
import { useNodes } from '../../hooks/useNodes'

type BadgeVariant = 'success' | 'warn' | 'error' | 'info' | 'purple' | 'brand' | 'gray'

const NODE_TYPE_OPTIONS = [
  { value: 'platform', label: 'Platform' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'branch', label: 'Branch' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'role', label: 'Role' },
]

const NODE_TYPE_BADGE: Record<string, BadgeVariant> = {
  platform: 'purple',
  vertical: 'brand',
  tenant: 'success',
  branch: 'info',
  warehouse: 'warn',
  role: 'gray',
}

function buildTree(items: NodeTreeItem[]): NodeTreeItem[] {
  const map = new Map<string, NodeTreeItem>()
  const roots: NodeTreeItem[] = []

  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

interface NodeRowProps {
  node: NodeTreeItem
  depth: number
}

function NodeRow({ node, depth }: NodeRowProps) {
  const [expanded, setExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          paddingLeft: 16 + depth * 24,
          borderBottom: '1px solid var(--border-secondary)',
          background: hovered ? 'var(--bg-hover)' : 'var(--bg-primary)',
          minHeight: 44,
          transition: 'background 0.1s',
        }}
      >
        <span
          style={{ width: 20, display: 'flex', alignItems: 'center', cursor: hasChildren ? 'pointer' : 'default', color: 'var(--fg-muted)', flexShrink: 0 }}
          onClick={() => hasChildren && setExpanded(e => !e)}
        >
          {hasChildren
            ? (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)
            : null}
        </span>
        <span style={{ flex: 1, fontWeight: 500, color: 'var(--fg-primary)' }}>{node.name}</span>
        <Badge variant={NODE_TYPE_BADGE[node.node_type] ?? 'gray'}>{node.node_type}</Badge>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)', minWidth: 200, fontFamily: 'var(--font-mono)' }}>
          {String(node.metadata?.tenant_id ?? '')}
        </span>
        <span style={{ display: 'flex', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}>
          <Button size="sm" variant="ghost" aria-label="Edit">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" aria-label="Delete">
            <Trash2 size={14} />
          </Button>
        </span>
      </div>
      {expanded && hasChildren && node.children!.map(child => (
        <NodeRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

export default function NodeTreePage() {
  const { data, isLoading } = useNodes()
  const qc = useQueryClient()
  const { success, error } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [nodeType, setNodeType] = useState('tenant')
  const [parentId, setParentId] = useState('')
  const [tenantId, setTenantId] = useState('')

  const createMut = useMutation({
    mutationFn: () =>
      createNode({
        name,
        node_type: nodeType,
        parent_id: parentId || undefined,
        metadata: tenantId ? { tenant_id: tenantId } : {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nodes'] })
      success('Node created', `${name} added to the organisation tree`)
      setShowModal(false)
      setName('')
      setNodeType('tenant')
      setParentId('')
      setTenantId('')
    },
    onError: () => error('Failed to create node'),
  })

  const flatNodes = data?.items ?? []
  const tree = buildTree(flatNodes)

  const parentOptions = [
    { value: '', label: '— None (root) —' },
    ...flatNodes.map(n => ({ value: n.id, label: `${n.name} (${n.node_type})` })),
  ]

  return (
    <PageLayout
      title="Organisation Nodes"
      headerActions={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          New Node
        </Button>
      }
    >
      {isLoading ? (
        <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}>
          <Spinner size={40} />
        </div>
      ) : (
        <div style={{ margin: 24, border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              paddingLeft: 60,
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-secondary)',
              gap: 8,
            }}
          >
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 100 }}>Type</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 200 }}>Tenant ID</span>
            <span style={{ width: 72 }} />
          </div>
          {tree.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-muted)' }}>
              No nodes yet. Create the first node.
            </div>
          ) : (
            tree.map(node => <NodeRow key={node.id} node={node} depth={0} />)
          )}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Node"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => createMut.mutate()}
              disabled={!name.trim() || createMut.isPending}
            >
              {createMut.isPending ? 'Creating…' : 'Create Node'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mumbai Branch"
          />
          <Select
            label="Node Type"
            value={nodeType}
            onChange={e => setNodeType(e.target.value)}
            options={NODE_TYPE_OPTIONS}
          />
          <Select
            label="Parent Node"
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            options={parentOptions}
          />
          <Input
            label="Tenant ID"
            value={tenantId}
            onChange={e => setTenantId(e.target.value)}
            placeholder="e.g. 00000000-0000-0000-0000-000000000001"
          />
        </div>
      </Modal>
    </PageLayout>
  )
}
