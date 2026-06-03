import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import {
  Button, Input, Toggle, Modal, ConfirmDialog,
  DataTable, useToast, type Column,
} from '../../design-system'
import {
  listRuleSets, createRuleSet, saveRuleSet, deleteRuleSet,
  type RuleSet,
} from '../../config/studioApi'

export function RuleBuilderPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const qc = useQueryClient()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEntityType, setNewEntityType] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RuleSet | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ruleSets'],
    queryFn: () => listRuleSets(),
  })

  const createMut = useMutation({
    mutationFn: () => createRuleSet({ entity_type: newEntityType.trim(), name: newName.trim() }),
    onSuccess: (rs) => {
      qc.invalidateQueries({ queryKey: ['ruleSets'] })
      success('Rule set created', rs.name)
      setCreating(false)
      setNewName('')
      setNewEntityType('')
      navigate(`/admin/rules/${rs.id}/edit`)
    },
    onError: () => error('Failed to create rule set'),
  })

  const toggleMut = useMutation({
    mutationFn: (rs: RuleSet) => saveRuleSet(rs.id, { enabled: !rs.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ruleSets'] }),
    onError: () => error('Failed to update rule set'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteRuleSet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ruleSets'] })
      setDeleteTarget(null)
      success('Rule set deleted')
    },
    onError: () => error('Delete failed'),
  })

  const columns: Column<RuleSet>[] = [
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
          className="ex-link"
          style={{ fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-primary)', padding: 0, textAlign: 'left' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/rules/${row.id}/edit`) }}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'enabled',
      label: 'Enabled',
      width: 100,
      render: (row) => (
        <Toggle
          checked={row.enabled}
          onChange={() => toggleMut.mutate(row)}
        />
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      width: 160,
      sortable: true,
      render: (row) => new Date(row.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions',
      label: '',
      width: 150,
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/rules/${row.id}/edit`) }} icon={<Edit2 size={14} />}>
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
            icon={<Trash2 size={14} />}
            style={{ color: 'var(--error-600)' }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="ex-page-header">
        <div className="ex-page-head-row">
          <div>
            <h1 className="ex-h1">Rule Builder</h1>
            <p className="ex-page-sub">Define validation rules, field guards, and workflow conditions</p>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
            New rule set
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <DataTable<RuleSet & Record<string, unknown>>
          columns={columns}
          rows={(data?.items ?? []) as (RuleSet & Record<string, unknown>)[]}
          loading={isLoading}
          emptyTitle="No rule sets yet"
          emptyDescription="Create your first rule set to start defining entity validation rules."
          onRowClick={(row) => navigate(`/admin/rules/${row.id}/edit`)}
        />
      </div>

      <Modal
        open={creating}
        onClose={() => { setCreating(false); setNewName(''); setNewEntityType('') }}
        title="New rule set"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreating(false); setNewName(''); setNewEntityType('') }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => createMut.mutate()}
              disabled={!newName.trim() || !newEntityType.trim() || createMut.isPending}
            >
              {createMut.isPending ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Entity type"
            placeholder="e.g. Customer, Invoice"
            value={newEntityType}
            onChange={(e) => setNewEntityType(e.target.value)}
            autoFocus
          />
          <Input
            label="Rule set name"
            placeholder="e.g. Customer validation rules"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim() && newEntityType.trim()) createMut.mutate()
            }}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete rule set"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}
export default RuleBuilderPage
