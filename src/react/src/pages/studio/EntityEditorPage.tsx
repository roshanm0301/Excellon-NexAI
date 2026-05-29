import React, { useState, useEffect, useRef, type DragEvent } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import {
  Button,
  Input,
  Textarea,
  Select,
  Toggle,
  Checkbox,
  AccordionRow,
  Spinner,
  TabGroup,
  useToast,
  ConfirmDialog,
  StatusBadge,
} from '../../design-system'
import {
  getArtifact,
  saveArtifact,
  publishArtifact,
  listNodes,
  type Artifact,
  type NodeTreeItem,
} from '../../config/studioApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Field {
  name: string
  type: string
  required?: boolean
  unique?: boolean
  indexed?: boolean
  pii?: boolean
  expression?: string
  validation?: { min?: number; max?: number; pattern?: string }
}

interface Section {
  name: string
  fields: string[]
}

interface Relationship {
  name: string
  type: 'parent' | 'child' | 'lookup'
  targetEntity: string
  foreignKey: string
}

interface IndexRule {
  fields: string[]
  unique: boolean
}

interface Capabilities {
  softDelete?: boolean
  pii?: boolean
  auditTrail?: boolean
  workflow?: boolean
  expressions?: boolean
  nodeScoping?: boolean
}

interface EntityPayload {
  displayName?: string
  icon?: string
  description?: string
  color?: string
  pluralName?: string
  fields: Field[]
  sections: Section[]
  relationships: Relationship[]
  capabilities?: Capabilities
  nodeScope?: string[]
  indexes?: IndexRule[]
  retentionDays?: number
  archiveDays?: number
  purgePolicy?: 'none' | 'archive' | 'delete'
  legalHold?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'fields', label: 'Fields' },
  { id: 'sections', label: 'Sections' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'settings', label: 'Settings' },
  { id: 'node-scoping', label: 'Node Scoping' },
  { id: 'indexes', label: 'Indexes' },
  { id: 'retention', label: 'Retention' },
  { id: 'er-diagram', label: 'ER Diagram' },
]

const FIELD_TYPES = [
  'text', 'number', 'boolean', 'date', 'datetime',
  'email', 'phone', 'url', 'uuid', 'json', 'reference',
].map(v => ({ value: v, label: v }))

const REL_TYPES = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'lookup', label: 'Lookup' },
]

const PURGE_POLICIES = [
  { value: 'none', label: 'None' },
  { value: 'archive', label: 'Archive' },
  { value: 'delete', label: 'Delete' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyPayload(): EntityPayload {
  return {
    fields: [],
    sections: [],
    relationships: [],
    capabilities: {},
    nodeScope: [],
    indexes: [],
    purgePolicy: 'none',
  }
}

function payloadFromArtifact(artifact: Artifact): EntityPayload {
  const p = artifact.payload as Partial<EntityPayload>
  return {
    ...emptyPayload(),
    ...p,
    fields: p.fields ?? [],
    sections: p.sections ?? [],
    relationships: p.relationships ?? [],
    capabilities: p.capabilities ?? {},
    nodeScope: p.nodeScope ?? [],
    indexes: p.indexes ?? [],
  }
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
      <label className="label" style={{ paddingTop: 10, fontWeight: 500 }}>{label}</label>
      <div>{children}</div>
    </div>
  )
}

// ─── Tab: Fields ──────────────────────────────────────────────────────────────

function FieldsTab({ fields, onChange }: { fields: Field[]; onChange: (fields: Field[]) => void }) {
  const dragIdx = useRef<number | null>(null)

  function updateField(idx: number, patch: Partial<Field>) {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  function updateValidation(idx: number, patch: Partial<NonNullable<Field['validation']>>) {
    updateField(idx, { validation: { ...fields[idx].validation, ...patch } })
  }

  function addField() {
    onChange([...fields, { name: `field_${fields.length + 1}`, type: 'text' }])
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx))
  }

  function onDragStart(_e: DragEvent<HTMLDivElement>, idx: number) {
    dragIdx.current = idx
  }

  function onDrop(_e: DragEvent<HTMLDivElement>, toIdx: number) {
    if (dragIdx.current === null || dragIdx.current === toIdx) return
    const next = [...fields]
    const [item] = next.splice(dragIdx.current, 1)
    next.splice(toIdx, 0, item)
    dragIdx.current = null
    onChange(next)
  }

  return (
    <div>
      {fields.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
          No fields defined. Click "Add field" to get started.
        </div>
      )}
      {fields.map((field, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={e => onDragStart(e, idx)}
          onDragOver={e => e.preventDefault()}
          onDrop={e => onDrop(e, idx)}
        >
          <AccordionRow
            dragHandle
            title={
              <span>
                <span style={{ fontWeight: 600 }}>{field.name || '(unnamed)'}</span>
                {' '}
                <span style={{
                  fontSize: 'var(--text-xs)', background: 'var(--brand-50)', color: 'var(--brand-700)',
                  borderRadius: 'var(--radius-full)', padding: '1px 8px', marginLeft: 4,
                }}>
                  {field.type}
                </span>
                {field.required && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)', marginLeft: 6 }}>required</span>}
                {field.pii && (
                  <span style={{ fontSize: 'var(--text-xs)', background: 'var(--warning-100)', color: 'var(--warning-700)', borderRadius: 'var(--radius-full)', padding: '1px 6px', marginLeft: 4 }}>PII</span>
                )}
              </span>
            }
            right={
              <button
                onClick={e => { e.stopPropagation(); removeField(idx) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={14} />
              </button>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Input label="Field name" value={field.name} onChange={e => updateField(idx, { name: e.target.value })} placeholder="field_name" />
              <Select label="Type" value={field.type} onChange={e => updateField(idx, { type: e.target.value })} options={FIELD_TYPES} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Input
                label="Expression (JSONata)"
                value={field.expression ?? ''}
                onChange={e => updateField(idx, { expression: e.target.value })}
                placeholder="e.g. $uppercase(name)"
              />
              <Input
                label="Validation pattern"
                value={field.validation?.pattern ?? ''}
                onChange={e => updateValidation(idx, { pattern: e.target.value })}
                placeholder="RegEx pattern"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Input
                label="Min"
                type="number"
                value={field.validation?.min ?? ''}
                onChange={e => updateValidation(idx, { min: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                label="Max"
                type="number"
                value={field.validation?.max ?? ''}
                onChange={e => updateValidation(idx, { max: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Checkbox checked={!!field.required} onChange={v => updateField(idx, { required: v })} label="Required" />
              <Checkbox checked={!!field.unique} onChange={v => updateField(idx, { unique: v })} label="Unique" />
              <Checkbox checked={!!field.indexed} onChange={v => updateField(idx, { indexed: v })} label="Indexed" />
              <Checkbox checked={!!field.pii} onChange={v => updateField(idx, { pii: v })} label="PII" />
            </div>
          </AccordionRow>
        </div>
      ))}
      <Button variant="ghost" icon={<Plus size={14} />} onClick={addField} style={{ marginTop: 8 }}>
        Add field
      </Button>
    </div>
  )
}

// ─── Tab: Sections ────────────────────────────────────────────────────────────

function SectionsTab({ sections, fieldNames, onChange }: { sections: Section[]; fieldNames: string[]; onChange: (s: Section[]) => void }) {
  function update(idx: number, patch: Partial<Section>) {
    onChange(sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }
  function remove(idx: number) { onChange(sections.filter((_, i) => i !== idx)) }
  function add() { onChange([...sections, { name: `Section ${sections.length + 1}`, fields: [] }]) }
  function toggleField(idx: number, fn: string, checked: boolean) {
    const cur = sections[idx].fields
    update(idx, { fields: checked ? [...cur, fn] : cur.filter(f => f !== fn) })
  }

  return (
    <div>
      {sections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
          No sections defined. Sections group fields on the UI form.
        </div>
      )}
      {sections.map((section, idx) => (
        <div key={idx} style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 12, background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Input label="Section name" value={section.name} onChange={e => update(idx, { name: e.target.value })} />
            </div>
            <button onClick={() => remove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, marginBottom: 2 }}>
              <Trash2 size={16} />
            </button>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Fields in this section</div>
            {fieldNames.length === 0 ? (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>No fields defined yet.</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {fieldNames.map(fn => (
                  <Checkbox key={fn} checked={section.fields.includes(fn)} onChange={checked => toggleField(idx, fn, checked)} label={fn} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <Button variant="ghost" icon={<Plus size={14} />} onClick={add} style={{ marginTop: 8 }}>Add section</Button>
    </div>
  )
}

// ─── Tab: Relationships ───────────────────────────────────────────────────────

function RelationshipsTab({ relationships, onChange }: { relationships: Relationship[]; onChange: (r: Relationship[]) => void }) {
  function update(idx: number, patch: Partial<Relationship>) {
    onChange(relationships.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }
  function remove(idx: number) { onChange(relationships.filter((_, i) => i !== idx)) }
  function add() {
    onChange([...relationships, { name: `rel_${relationships.length + 1}`, type: 'lookup', targetEntity: '', foreignKey: '' }])
  }

  return (
    <div>
      {relationships.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>No relationships defined.</div>
      )}
      {relationships.map((rel, idx) => (
        <AccordionRow
          key={idx}
          title={
            <span>
              <strong>{rel.name || '(unnamed)'}</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginLeft: 8 }}>{rel.type} → {rel.targetEntity || '?'}</span>
            </span>
          }
          right={
            <button onClick={e => { e.stopPropagation(); remove(idx) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, borderRadius: 4 }}>
              <Trash2 size={14} />
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input label="Relationship name" value={rel.name} onChange={e => update(idx, { name: e.target.value })} />
            <Select label="Type" value={rel.type} onChange={e => update(idx, { type: e.target.value as Relationship['type'] })} options={REL_TYPES} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Target entity" value={rel.targetEntity} onChange={e => update(idx, { targetEntity: e.target.value })} placeholder="e.g. customer" />
            <Input label="Foreign key field" value={rel.foreignKey} onChange={e => update(idx, { foreignKey: e.target.value })} placeholder="e.g. customer_id" />
          </div>
        </AccordionRow>
      ))}
      <Button variant="ghost" icon={<Plus size={14} />} onClick={add} style={{ marginTop: 8 }}>Add relationship</Button>
    </div>
  )
}

// ─── Tab: Capabilities ────────────────────────────────────────────────────────

const CAPABILITY_DEFS: { key: keyof Capabilities; label: string; description: string }[] = [
  { key: 'softDelete', label: 'Soft delete', description: 'Retain deleted records in a recycle bin' },
  { key: 'pii', label: 'Contains PII fields', description: 'Enable AES-256-GCM encryption and masking for PII fields' },
  { key: 'auditTrail', label: 'Full audit trail', description: 'Log all creates, updates, and deletes immutably' },
  { key: 'workflow', label: 'Workflow / status machine', description: 'Enable status transitions and SLA tracking' },
  { key: 'expressions', label: 'Computed fields (expressions)', description: 'Evaluate JSONata expressions to derive field values' },
  { key: 'nodeScoping', label: 'Node / branch scoping', description: 'Restrict entity records to specific org nodes' },
]

function CapabilitiesTab({ capabilities, onChange }: { capabilities: Capabilities; onChange: (c: Capabilities) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {CAPABILITY_DEFS.map(({ key, label, description }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-secondary)' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>{label}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{description}</div>
          </div>
          <Toggle checked={!!capabilities[key]} onChange={v => onChange({ ...capabilities, [key]: v })} />
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────

function SettingsTab({ payload, onChange }: { payload: EntityPayload; onChange: (patch: Partial<EntityPayload>) => void }) {
  return (
    <div style={{ maxWidth: 600 }}>
      <FormRow label="Display name">
        <Input value={payload.displayName ?? ''} onChange={e => onChange({ displayName: e.target.value })} placeholder="e.g. Job Card" />
      </FormRow>
      <FormRow label="Plural name">
        <Input value={payload.pluralName ?? ''} onChange={e => onChange({ pluralName: e.target.value })} placeholder="e.g. Job Cards" />
      </FormRow>
      <FormRow label="Icon">
        <Input value={payload.icon ?? ''} onChange={e => onChange({ icon: e.target.value })} placeholder="Lucide icon name, e.g. briefcase" />
      </FormRow>
      <FormRow label="Color">
        <input
          type="color"
          value={payload.color ?? '#000000'}
          onChange={e => onChange({ color: e.target.value })}
          style={{ height: 40, width: 80, padding: 4, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}
        />
      </FormRow>
      <FormRow label="Description">
        <Textarea value={payload.description ?? ''} onChange={e => onChange({ description: e.target.value })} rows={4} placeholder="Brief description of this entity" />
      </FormRow>
    </div>
  )
}

// ─── Tab: Node Scoping ────────────────────────────────────────────────────────

function NodeScopingTab({ nodeScope, nodes, onChange }: { nodeScope: string[]; nodes: NodeTreeItem[]; onChange: (ns: string[]) => void }) {
  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...nodeScope, id] : nodeScope.filter(n => n !== id))
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: 16 }}>
        Select which org nodes this entity is visible to. Leave empty for all nodes.
      </p>
      {nodes.length === 0 ? (
        <div style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>No nodes found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nodes.map(node => (
            <Checkbox key={node.id} checked={nodeScope.includes(node.id)} onChange={checked => toggle(node.id, checked)} label={`${node.name} (${node.node_type})`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Indexes ─────────────────────────────────────────────────────────────

function IndexesTab({ indexes, fieldNames, onChange }: { indexes: IndexRule[]; fieldNames: string[]; onChange: (idx: IndexRule[]) => void }) {
  function update(i: number, patch: Partial<IndexRule>) {
    onChange(indexes.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  }
  function toggleIndexField(i: number, fn: string, checked: boolean) {
    const cur = indexes[i].fields
    update(i, { fields: checked ? [...cur, fn] : cur.filter(f => f !== fn) })
  }
  function remove(i: number) { onChange(indexes.filter((_, j) => j !== i)) }
  function add() { onChange([...indexes, { fields: [], unique: false }]) }

  return (
    <div>
      {indexes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
          No indexes defined. All indexes use CREATE INDEX CONCURRENTLY — no table locks.
        </div>
      )}
      {indexes.map((rule, i) => (
        <AccordionRow
          key={i}
          title={<span>Index {i + 1}: [{rule.fields.join(', ') || 'no fields'}]{rule.unique ? ' UNIQUE' : ''}</span>}
          right={
            <button onClick={e => { e.stopPropagation(); remove(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, borderRadius: 4 }}>
              <Trash2 size={14} />
            </button>
          }
        >
          <div style={{ marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>Fields in index</div>
            {fieldNames.length === 0 ? (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>No fields defined yet.</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {fieldNames.map(fn => (
                  <Checkbox key={fn} checked={rule.fields.includes(fn)} onChange={checked => toggleIndexField(i, fn, checked)} label={fn} />
                ))}
              </div>
            )}
          </div>
          <Checkbox checked={rule.unique} onChange={v => update(i, { unique: v })} label="Unique index" />
        </AccordionRow>
      ))}
      <Button variant="ghost" icon={<Plus size={14} />} onClick={add} style={{ marginTop: 8 }}>Add index</Button>
    </div>
  )
}

// ─── Tab: Retention ───────────────────────────────────────────────────────────

function RetentionTab({ payload, onChange }: { payload: EntityPayload; onChange: (patch: Partial<EntityPayload>) => void }) {
  return (
    <div style={{ maxWidth: 480 }}>
      <FormRow label="Retention days">
        <Input type="number" value={payload.retentionDays ?? ''} onChange={e => onChange({ retentionDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="Days to retain records" />
      </FormRow>
      <FormRow label="Archive after (days)">
        <Input type="number" value={payload.archiveDays ?? ''} onChange={e => onChange({ archiveDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="Days before archiving" />
      </FormRow>
      <FormRow label="Purge policy">
        <Select value={payload.purgePolicy ?? 'none'} onChange={e => onChange({ purgePolicy: e.target.value as EntityPayload['purgePolicy'] })} options={PURGE_POLICIES} />
      </FormRow>
      <FormRow label="Legal hold">
        <Checkbox checked={!!payload.legalHold} onChange={v => onChange({ legalHold: v })} label="Enable legal hold (prevents purge)" />
      </FormRow>
    </div>
  )
}

// ─── Tab: ER Diagram ──────────────────────────────────────────────────────────

function ERDiagramTab({ entityType, relationships }: { entityType: string; relationships: Relationship[] }) {
  const nodes: Node[] = [
    {
      id: '__current__',
      position: { x: 0, y: 0 },
      data: { label: entityType },
      style: { background: 'var(--brand-600)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, padding: '10px 20px' },
    },
    ...relationships.map((rel, i) => {
      const angle = (2 * Math.PI * i) / Math.max(relationships.length, 1)
      const radius = 260
      return {
        id: `rel-${i}`,
        position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
        data: { label: rel.targetEntity || '(unknown)' },
        style: { background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 8, padding: '8px 16px', fontSize: 13 },
      }
    }),
  ]

  const edges: Edge[] = relationships.map((rel, i) => ({
    id: `e-${i}`,
    source: '__current__',
    target: `rel-${i}`,
    label: rel.type,
    labelStyle: { fontSize: 11 },
  }))

  return (
    <div style={{ height: 520, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-secondary)' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EntityEditorPage() {
  const { entityType } = useParams<{ entityType: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const qc = useQueryClient()

  // Prefer ?id= param (set by EntityDesignerPage), fall back to entityType slug
  const artifactId = searchParams.get('id') ?? entityType ?? ''

  const [activeTab, setActiveTab] = useState('fields')
  const [draft, setDraft] = useState<EntityPayload | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: artifact, isLoading } = useQuery({
    queryKey: ['artifact', artifactId],
    queryFn: () => getArtifact(artifactId),
    enabled: !!artifactId,
  })

  const { data: nodesData } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => listNodes().catch(() => ({ items: [] })),
  })
  const nodes = nodesData?.items ?? []

  // Initialise draft once artifact loads
  useEffect(() => {
    if (artifact && draft === null) {
      setDraft(payloadFromArtifact(artifact))
    }
  }, [artifact, draft])

  const dirty =
    draft !== null &&
    artifact !== undefined &&
    JSON.stringify(draft) !== JSON.stringify(artifact.payload)

  const saveMut = useMutation({
    mutationFn: (p: EntityPayload) => saveArtifact(artifactId, p as unknown as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artifact', artifactId] })
      success('Saved', 'Changes saved successfully')
    },
    onError: () => toastError('Save failed', 'Could not save changes'),
  })

  // Debounced auto-save
  useEffect(() => {
    if (!dirty || !draft) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveMut.mutate(draft)
    }, 2000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty])

  // Navigate-away guard
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function patchDraft(patch: Partial<EntityPayload>) {
    setDraft(prev => prev ? { ...prev, ...patch } : prev)
  }

  async function handlePublish() {
    try {
      setPublishing(true)
      if (dirty && draft) await saveMut.mutateAsync(draft)
      await publishArtifact(artifactId)
      qc.invalidateQueries({ queryKey: ['artifact', artifactId] })
      success('Published', 'Entity schema compiled and published')
    } catch {
      toastError('Publish failed', 'Check the entity definition for errors')
    } finally {
      setPublishing(false)
      setConfirmPublish(false)
    }
  }

  function handleManualSave() {
    if (!draft) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    saveMut.mutate(draft)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <Spinner size={32} />
      </div>
    )
  }

  if (!artifact || !draft) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)' }}>
        Entity not found.{' '}
        <button onClick={() => navigate('/entities')} style={{ background: 'none', border: 'none', color: 'var(--brand-600)', cursor: 'pointer' }}>
          Back to entities
        </button>
      </div>
    )
  }

  const fieldNames = draft.fields.map(f => f.name).filter(Boolean)

  return (
    <div>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-secondary)' }}>
        <div className="ex-page-header" style={{ paddingBottom: 0 }}>
          <div className="ex-page-head-row">
            <div>
              {/* Breadcrumb */}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 4 }}>
                <button onClick={() => navigate('/entities')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', padding: 0 }}>
                  Entities
                </button>
                {' / '}
                <span style={{ color: 'var(--fg-secondary)' }}>{entityType}</span>
              </div>
              {/* Entity name + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  value={draft.displayName ?? artifact.entity_type}
                  onChange={e => patchDraft({ displayName: e.target.value })}
                  style={{
                    fontSize: 'var(--text-xl)', fontWeight: 700, border: 'none',
                    background: 'transparent', outline: 'none',
                    color: 'var(--fg-primary)', fontFamily: 'var(--font-sans)', padding: 0,
                  }}
                />
                <StatusBadge status={artifact.status} />
                {dirty && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning-600)', background: 'var(--warning-50)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
            <div className="ex-page-actions">
              <Button variant="secondary" onClick={handleManualSave} disabled={!dirty} loading={saveMut.isPending}>
                Save
              </Button>
              <Button variant="primary" onClick={() => setConfirmPublish(true)} loading={publishing}>
                Publish
              </Button>
            </div>
          </div>
          <TabGroup tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '24px 0' }}>
        {activeTab === 'fields' && <FieldsTab fields={draft.fields} onChange={fields => patchDraft({ fields })} />}
        {activeTab === 'sections' && <SectionsTab sections={draft.sections} fieldNames={fieldNames} onChange={sections => patchDraft({ sections })} />}
        {activeTab === 'relationships' && <RelationshipsTab relationships={draft.relationships} onChange={relationships => patchDraft({ relationships })} />}
        {activeTab === 'capabilities' && <CapabilitiesTab capabilities={draft.capabilities ?? {}} onChange={capabilities => patchDraft({ capabilities })} />}
        {activeTab === 'settings' && <SettingsTab payload={draft} onChange={patchDraft} />}
        {activeTab === 'node-scoping' && <NodeScopingTab nodeScope={draft.nodeScope ?? []} nodes={nodes} onChange={nodeScope => patchDraft({ nodeScope })} />}
        {activeTab === 'indexes' && <IndexesTab indexes={draft.indexes ?? []} fieldNames={fieldNames} onChange={indexes => patchDraft({ indexes })} />}
        {activeTab === 'retention' && <RetentionTab payload={draft} onChange={patchDraft} />}
        {activeTab === 'er-diagram' && <ERDiagramTab entityType={entityType ?? ''} relationships={draft.relationships} />}
      </div>

      <ConfirmDialog
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={handlePublish}
        title="Publish entity schema"
        message="This will compile the entity schema and make it available at runtime. Any unsaved changes will be saved first."
        confirmLabel="Publish"
        loading={publishing}
      />
    </div>
  )
}
export default EntityEditorPage
