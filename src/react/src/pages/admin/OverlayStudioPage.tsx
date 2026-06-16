import { useState } from 'react'
import {
  PageLayout,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  Textarea,
  ConfirmDialog,
  VirtualGrid,
  SearchInput,
  Banner,
  useToast,
  type VirtualGridColumn,
  type RowAction,
} from '../../design-system'
import { useOverlays, useCreateOverlay, useDeleteOverlay } from '../../hooks/useOverlays'
import type { OverlayDefinition } from '../../config/studioApi'

type BadgeVariant = 'success' | 'warn' | 'error' | 'info' | 'purple' | 'brand' | 'gray'

const ARTIFACT_TYPE_OPTIONS = [
  { value: 'entity_schema', label: 'entity_schema' },
  { value: 'rule_set', label: 'rule_set' },
]

const LAYER_OPTIONS = [
  { value: 'platform', label: 'Platform' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'node', label: 'Node' },
  { value: 'role', label: 'Role' },
]

const LAYER_BADGE: Record<string, BadgeVariant> = {
  platform: 'purple',
  vertical: 'brand',
  tenant: 'success',
  node: 'warn',
  role: 'error',
}

type Layer = 'platform' | 'vertical' | 'tenant' | 'node' | 'role'

interface FormState {
  entity_type: string
  layer: Layer
  scope_key: string   // scope ref (e.g. tenant_id, vertical_id, role_code)
  delta: string
}

const EMPTY_FORM: FormState = {
  entity_type: '',
  layer: 'tenant',
  scope_key: '',
  delta: '{}',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OverlayStudioPage() {
  const { success, error } = useToast()

  const [artifactTypeFilter, setArtifactTypeFilter] = useState('')
  const [keySearch, setKeySearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<OverlayDefinition | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OverlayDefinition | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deltaError, setDeltaError] = useState<string | null>(null)

  const { data, isLoading } = useOverlays(artifactTypeFilter || undefined)
  const createMut = useCreateOverlay()
  const deleteMut = useDeleteOverlay()

  const filtered = (data?.items ?? []).filter(o =>
    !keySearch || o.entity_type.toLowerCase().includes(keySearch.toLowerCase())
  )

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setDeltaError(null)
    setShowModal(true)
  }

  function openEdit(row: OverlayDefinition) {
    setEditTarget(row)
    setForm({
      entity_type: row.entity_type,
      layer: row.layer,
      scope_key: row.scope_key,
      delta: JSON.stringify(row.delta, null, 2),
    })
    setDeltaError(null)
    setShowModal(true)
  }

  function handleDeltaBlur() {
    try {
      JSON.parse(form.delta)
      setDeltaError(null)
    } catch {
      setDeltaError('Invalid JSON — fix before saving')
    }
  }

  function handleSave() {
    try {
      const parsed = JSON.parse(form.delta) as Record<string, unknown>
      createMut.mutate(
        {
          entity_type: form.entity_type,
          layer: form.layer,
          scope_key: form.scope_key,
          delta: parsed,
        },
        {
          onSuccess: () => {
            success('Delta saved', `Overlay delta for ${form.entity_type} saved`)
            setShowModal(false)
          },
          onError: () => error('Failed to save delta'),
        }
      )
    } catch {
      setDeltaError('Invalid JSON — fix before saving')
    }
  }

  const columns: VirtualGridColumn<OverlayDefinition>[] = [
    {
      key: 'entity_type',
      label: 'Artifact Type',
      width: 160,
      render: row => <Badge variant="brand">{row.entity_type}</Badge>,
    },
    {
      key: 'entity_type_key',
      label: 'Artifact Key',
      width: 260,
      render: row => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-primary)' }}>
          {row.entity_type}
        </span>
      ),
    },
    {
      key: 'layer',
      label: 'Layer',
      width: 110,
      render: row => (
        <Badge variant={LAYER_BADGE[row.layer] ?? 'gray'}>{row.layer}</Badge>
      ),
    },
    {
      key: 'scope_key',
      label: 'Scope Ref',
      width: 200,
      render: row => (
        <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
          {row.scope_key}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created At',
      width: 130,
      render: row => (
        <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{formatDate(row.created_at)}</span>
      ),
    },
  ]

  const rowActions: RowAction<OverlayDefinition>[] = [
    { label: 'Edit', onClick: openEdit },
    { label: 'Delete', onClick: row => setDeleteTarget(row), variant: 'danger' },
  ]

  return (
    <PageLayout
      title="Overlay Studio"
      headerActions={
        <Button variant="primary" onClick={openCreate}>New Delta</Button>
      }
    >
      <div style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--border-secondary)' }}>
        <Select
          value={artifactTypeFilter}
          onChange={e => setArtifactTypeFilter(e.target.value)}
          options={[{ value: '', label: 'All artifact types' }, ...ARTIFACT_TYPE_OPTIONS]}
          style={{ width: 220 }}
        />
        <SearchInput
          value={keySearch}
          onChange={e => setKeySearch(e.target.value)}
          placeholder="Search artifact key…"
        />
      </div>

      <div style={{ padding: 24 }}>
        <VirtualGrid
          columns={columns}
          data={filtered}
          loading={isLoading}
          rowActions={rowActions}
          getRowId={row => row.id}
          emptyMessage="No overlay deltas found. Create one to start customising schemas per layer."
        />
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Delta' : 'New Overlay Delta'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!form.entity_type || !form.scope_key || !!deltaError || createMut.isPending}
            >
              {createMut.isPending ? 'Saving…' : 'Save Delta'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select
            label="Artifact Type"
            value={form.entity_type}
            onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))}
            options={[{ value: '', label: 'Select artifact type…' }, ...ARTIFACT_TYPE_OPTIONS]}
          />
          <Select
            label="Layer"
            value={form.layer}
            onChange={e => setForm(f => ({ ...f, layer: e.target.value as Layer }))}
            options={LAYER_OPTIONS}
          />
          <Input
            label="Scope Ref"
            value={form.scope_key}
            onChange={e => setForm(f => ({ ...f, scope_key: e.target.value }))}
            placeholder="e.g. automotive, t-001, n-123, AGENT"
          />
          <div>
            <Textarea
              label="Delta JSON"
              value={form.delta}
              onChange={e => setForm(f => ({ ...f, delta: e.target.value }))}
              onBlur={handleDeltaBlur}
              rows={10}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
            {deltaError && (
              <div style={{ marginTop: 6 }}>
                <Banner variant="error" title={deltaError} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMut.mutate(deleteTarget.id, {
            onSuccess: () => success('Delta deleted'),
            onError: () => error('Failed to delete delta'),
          })
          setDeleteTarget(null)
        }}
        title="Delete Overlay Delta"
        message={`Delete the "${deleteTarget?.layer}" layer delta for ${deleteTarget?.entity_type}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </PageLayout>
  )
}
