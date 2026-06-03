import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, Filter, Table2, GitBranch } from 'lucide-react'
import {
  Button, Toggle, Modal, ConfirmDialog,
  DataTable, Badge, useToast, type Column,
} from '../../design-system'
import {
  listRuleSetsV2, createRuleSetV2, saveRuleSetV2, deleteRuleSet,
  type RuleSetV2, type RuleClassification, type ContentType,
} from '../../config/studioApi'

const CLASSIFICATION_OPTIONS: { value: RuleClassification; label: string; color: string }[] = [
  { value: 'VALIDATION', label: 'Validation', color: 'error' },
  { value: 'DERIVATION', label: 'Derivation', color: 'info' },
  { value: 'APPROVAL', label: 'Approval', color: 'warn' },
  { value: 'FIELD_CONTROL', label: 'Field Control', color: 'success' },
  { value: 'ELIGIBILITY', label: 'Eligibility', color: 'gray' },
  { value: 'EXTENSION', label: 'Extension', color: 'gray' },
]

export function RuleBuilderPageV2() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [filter, setFilter] = useState<RuleClassification | ''>('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEntityType, setNewEntityType] = useState('')
  const [newContentType, setNewContentType] = useState<ContentType>('condition_tree')
  const [deleteTarget, setDeleteTarget] = useState<RuleSetV2 | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ruleSetsV2', filter],
    queryFn: () => listRuleSetsV2(undefined, filter || undefined),
  })

  const createMut = useMutation({
    mutationFn: () => createRuleSetV2({
      entity_type: newEntityType.trim(),
      name: newName.trim(),
      content_type: newContentType,
      classifications: [],
    }),
    onSuccess: (rs) => {
      qc.invalidateQueries({ queryKey: ['ruleSetsV2'] })
      toast('success', 'Rule set created')
      setCreating(false)
      setNewName('')
      setNewEntityType('')
      navigate(`/rules/v2/${rs.id}`)
    },
    onError: () => toast('error', 'Failed to create rule set'),
  })

  const toggleMut = useMutation({
    mutationFn: (rs: RuleSetV2) => saveRuleSetV2(rs.id, { enabled: !rs.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ruleSetsV2'] }),
    onError: () => toast('error', 'Failed to update rule set'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteRuleSet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ruleSetsV2'] })
      setDeleteTarget(null)
      toast('success', 'Rule set deleted')
    },
    onError: () => toast('error', 'Delete failed'),
  })

  const columns: Column<RuleSetV2>[] = [
    {
      key: 'entity_type',
      label: 'Entity Type',
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--brand-600)', fontWeight: 600 }}>
          {row.entity_type}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <button
          style={{ fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-primary)', padding: 0, textAlign: 'left' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/rules/v2/${row.id}`) }}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'content_type',
      label: 'Type',
      width: 140,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {row.content_type === 'decision_table'
            ? <><Table2 size={13} style={{ color: 'var(--brand-500)' }} /> <span style={{ fontSize: 'var(--text-xs)' }}>Decision Table</span></>
            : <><GitBranch size={13} style={{ color: 'var(--success-500)' }} /> <span style={{ fontSize: 'var(--text-xs)' }}>Condition Tree</span></>
          }
        </div>
      ),
    },
    {
      key: 'classifications',
      label: 'Classifications',
      width: 220,
      render: (row) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(row.classifications ?? []).map(cls => {
            const opt = CLASSIFICATION_OPTIONS.find(o => o.value === cls)
            return <Badge key={cls} variant={opt?.color as 'error' | 'info' | 'warn' | 'success' | 'gray' ?? 'gray'}>{opt?.label ?? cls}</Badge>
          })}
          {(!row.classifications || row.classifications.length === 0) && (
            <span style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-xs)' }}>—</span>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 80,
      sortable: true,
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{row.priority}</span>,
    },
    {
      key: 'enabled',
      label: 'Enabled',
      width: 80,
      render: (row) => (
        <Toggle checked={row.enabled} onChange={() => toggleMut.mutate(row)} />
      ),
    },
    {
      key: 'updated_at',
      label: 'Updated',
      width: 130,
      sortable: true,
      render: (row) => new Date(row.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions',
      label: '',
      width: 130,
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/rules/v2/${row.id}`) }} icon={<Edit2 size={14} />}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }} icon={<Trash2 size={14} />} style={{ color: 'var(--error-600)' }} />
        </div>
      ),
    },
  ]

  const items = data?.items ?? []

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--fg-primary)', margin: 0, flex: 1 }}>
          Rule Builder
        </h1>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
          New Rule Set
        </Button>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Filter size={14} style={{ color: 'var(--fg-tertiary)' }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>Classification:</span>
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            border: filter === '' ? '1px solid var(--brand-400)' : '1px solid var(--border-secondary)',
            background: filter === '' ? 'var(--brand-50)' : 'transparent',
            color: filter === '' ? 'var(--brand-700)' : 'var(--fg-tertiary)',
            fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: filter === '' ? 600 : 400,
          }}
        >
          All
        </button>
        {CLASSIFICATION_OPTIONS.map(cls => (
          <button
            key={cls.value}
            onClick={() => setFilter(cls.value)}
            style={{
              padding: '3px 10px', borderRadius: 'var(--radius-full)',
              border: filter === cls.value ? '1px solid var(--brand-400)' : '1px solid var(--border-secondary)',
              background: filter === cls.value ? 'var(--brand-50)' : 'transparent',
              color: filter === cls.value ? 'var(--brand-700)' : 'var(--fg-tertiary)',
              fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: filter === cls.value ? 600 : 400,
            }}
          >
            {cls.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        rows={items as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyTitle="No rule sets found. Create one to get started."
        onRowClick={(row) => navigate(`/rules/v2/${(row as unknown as RuleSetV2).id}`)}
      />

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Create Rule Set">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 4, display: 'block' }}>Name</label>
            <input
              style={{
                width: '100%', height: 36, padding: '0 12px',
                border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-primary)', color: 'var(--fg-primary)',
                fontSize: 'var(--text-sm)', boxSizing: 'border-box',
              }}
              placeholder="e.g. High-Value Order Validation"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 4, display: 'block' }}>Entity Type</label>
            <input
              style={{
                width: '100%', height: 36, padding: '0 12px',
                border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-primary)', color: 'var(--fg-primary)',
                fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
              }}
              placeholder="e.g. order, invoice, employee"
              value={newEntityType}
              onChange={(e) => setNewEntityType(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 4, display: 'block' }}>Content Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setNewContentType('condition_tree')}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-lg)',
                  border: newContentType === 'condition_tree' ? '2px solid var(--brand-400)' : '1px solid var(--border-secondary)',
                  background: newContentType === 'condition_tree' ? 'var(--brand-50)' : 'var(--bg-primary)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  <GitBranch size={14} /> Condition Tree
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
                  Visual AND/OR/NOT condition groups
                </div>
              </button>
              <button
                onClick={() => setNewContentType('decision_table')}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-lg)',
                  border: newContentType === 'decision_table' ? '2px solid var(--brand-400)' : '1px solid var(--border-secondary)',
                  background: newContentType === 'decision_table' ? 'var(--brand-50)' : 'var(--bg-primary)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  <Table2 size={14} /> Decision Table
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
                  Spreadsheet-like DMN table with hit policies
                </div>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => createMut.mutate()} disabled={!newName.trim() || !newEntityType.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete Rule Set"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default RuleBuilderPageV2
