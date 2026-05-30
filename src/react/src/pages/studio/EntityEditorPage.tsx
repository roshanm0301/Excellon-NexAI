import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'

import {
  Input,
  Textarea,
  Spinner,
  TabGroup,
  useToast,
  ConfirmDialog,
  StatusBadge,
  EditorLayout,
  IconButton,
} from '../../design-system'
import {
  saveArtifact,
  createArtifact,
  publishArtifact,
  type NLPImportedField,
} from '../../config/studioApi'
import { useArtifact } from '../../hooks/useArtifact'

import { FieldBuilder, type FieldDef } from '../../components/studio/EntityDesigner/FieldBuilder'
import { SectionBuilder, type Section } from '../../components/studio/EntityDesigner/SectionBuilder'
import { RelationshipBuilder, type Relationship } from '../../components/studio/EntityDesigner/RelationshipBuilder'
import { StatusFlowEditor, type StatusDef, type Transition } from '../../components/studio/EntityDesigner/StatusFlowEditor'
import { CapabilityFlagsPanel, type CapabilityFlags } from '../../components/studio/EntityDesigner/CapabilityFlagsPanel'
import { CompositeIndexPanel, type IndexDef } from '../../components/studio/EntityDesigner/CompositeIndexPanel'
import { IndexMigrationPanel } from '../../components/studio/EntityDesigner/IndexMigrationPanel'
import { RetentionPanel, type RetentionConfig } from '../../components/studio/EntityDesigner/RetentionPanel'
import { type IDConfig } from '../../components/studio/EntityDesigner/IDConfigPanel'
import { NLPAssistantPanel } from '../../components/studio/EntityDesigner/NLPAssistantPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsPayload {
  displayName?: string
  pluralName?: string
  icon?: string
  color?: string
  description?: string
  category?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'schema', label: 'Schema' },
  { id: 'layout', label: 'Layout' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'virtual-entity', label: 'Virtual Entity' },
  { id: 'settings', label: 'Settings' },
  { id: 'node-scope', label: 'Node Scope' },
  { id: 'indexes', label: 'Indexes' },
  { id: 'data-retention', label: 'Data Retention' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
      <label className="label" style={{ paddingTop: 10, fontWeight: 500 }}>{label}</label>
      <div>{children}</div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EntityEditorPage() {
  const { id: routeId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const qc = useQueryClient()

  const id = searchParams.get('id') ?? routeId
  const isNew = !id

  // ── State ──────────────────────────────────────────────────────────────────

  const [fields, setFields] = useState<FieldDef[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [statuses, setStatuses] = useState<StatusDef[]>([])
  const [transitions, setTransitions] = useState<Transition[]>([])
  const [indexes, setIndexes] = useState<IndexDef[]>([])
  const [capabilityFlags, setCapabilityFlags] = useState<CapabilityFlags>({})
  const [idConfig, setIdConfig] = useState<IDConfig>({ strategy: 'uuid_v4' })
  const [retention, setRetention] = useState<RetentionConfig>({})
  const [isDirty, setIsDirty] = useState(false)

  const [settings, setSettings] = useState<SettingsPayload>({})
  const [activeTab, setActiveTab] = useState('schema')
  const [publishing, setPublishing] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [nlpOpen, setNlpOpen] = useState(false)

  // ── Data Loading ───────────────────────────────────────────────────────────

  const { data: artifact, isLoading } = useArtifact(id ?? undefined)

  useEffect(() => {
    if (!artifact) return
    const p = artifact.payload as Record<string, unknown>
    setFields((p.fields as FieldDef[] | undefined) ?? [])
    setSections((p.sections as Section[] | undefined) ?? [])
    setRelationships((p.relationships as Relationship[] | undefined) ?? [])
    setStatuses((p.statuses as StatusDef[] | undefined) ?? [])
    setTransitions((p.transitions as Transition[] | undefined) ?? [])
    setIndexes((p.indexes as IndexDef[] | undefined) ?? [])
    setCapabilityFlags((p.capabilityFlags as CapabilityFlags | undefined) ?? {})
    setIdConfig((p.idConfig as IDConfig | undefined) ?? { strategy: 'uuid_v4' })
    setRetention((p.retention as RetentionConfig | undefined) ?? {})
    setSettings({
      displayName: p.displayName as string | undefined,
      pluralName: p.pluralName as string | undefined,
      icon: p.icon as string | undefined,
      color: p.color as string | undefined,
      description: p.description as string | undefined,
      category: p.category as string | undefined,
    })
    setIsDirty(false)
  }, [artifact])

  // Navigate-away guard
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      saveArtifact(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artifact', id] })
      success('Saved', 'Changes saved successfully')
      setIsDirty(false)
    },
    onError: () => toastError('Save failed', 'Could not save changes'),
  })

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createArtifact({
        entity_type: (settings.displayName ?? 'new-entity')
          .toLowerCase()
          .replace(/\s+/g, '_'),
        payload,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['artifacts'] })
      success('Saved', 'Entity created successfully')
      setIsDirty(false)
      navigate(`/admin/entities/${result.id}/edit`)
    },
    onError: () => toastError('Save failed', 'Could not create entity'),
  })

  function buildPayload(): Record<string, unknown> {
    return {
      ...settings,
      fields,
      sections,
      relationships,
      statuses,
      transitions,
      indexes,
      capabilityFlags,
      idConfig,
      retention,
    }
  }

  function handleSaveDraft() {
    if (isNew) {
      createMut.mutate(buildPayload())
    } else {
      saveMut.mutate(buildPayload())
    }
  }

  async function handlePublish() {
    if (!id) return
    try {
      setPublishing(true)
      if (isDirty) await saveMut.mutateAsync(buildPayload())
      await publishArtifact(id)
      qc.invalidateQueries({ queryKey: ['artifact', id] })
      success('Published', 'Entity schema compiled and published')
    } catch {
      toastError('Publish failed', 'Check the entity definition for errors')
    } finally {
      setPublishing(false)
      setConfirmPublish(false)
    }
  }

  // ── Loading / Not Found states ─────────────────────────────────────────────

  if (!isNew && isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <Spinner size={32} />
      </div>
    )
  }

  if (!isNew && !artifact) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)' }}>
        Entity not found.{' '}
        <button
          onClick={() => navigate('/entities')}
          style={{ background: 'none', border: 'none', color: 'var(--brand-600)', cursor: 'pointer' }}
        >
          Back to entities
        </button>
      </div>
    )
  }

  const fieldNames = fields.map(f => f.name).filter(Boolean)

  // Compute warnings for context bar
  const warnings = fields.filter(f => !f.name || !f.type || (f.storageType === 'computed' && !f.computeExpression)).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <EditorLayout
      title={isNew ? 'New Entity' : (settings.displayName || artifact?.entity_type || 'Entity')}
      statusBadge={!isNew && artifact ? <StatusBadge status={artifact.status} /> : undefined}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      saving={saveMut.isPending || createMut.isPending}
      onPublish={() => setConfirmPublish(true)}
      publishing={publishing}
      extraActions={
        <IconButton
          onClick={() => setNlpOpen(true)}
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <Sparkles size={16} />
        </IconButton>
      }
    >
      {/* Context bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '0 24px',
        height: 36,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-secondary)',
        fontSize: 12,
        color: 'var(--fg-tertiary)',
        flexShrink: 0,
      }}>
        <ContextBarItem label="Layer" value={settings.category ?? 'Tenant'} />
        <ContextBarSep />
        <ContextBarItem label="Fields" value={String(fields.length)} />
        <ContextBarSep />
        <ContextBarItem label="Sections" value={String(sections.length)} />
        {warnings > 0 && (
          <>
            <ContextBarSep />
            <span style={{ color: 'var(--warning-700)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              ⚠ {warnings} warning{warnings !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      <div style={{ padding: '0 24px' }}>
        <TabGroup tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div style={{ padding: '24px' }}>
        {/* Tab 1: Schema */}
        {activeTab === 'schema' && (
          <FieldBuilder
            fields={fields}
            onChange={(f) => { setFields(f); setIsDirty(true) }}
            idConfig={idConfig}
            onIdConfigChange={(c) => { setIdConfig(c); setIsDirty(true) }}
          />
        )}

        {/* Tab 2: Layout */}
        {activeTab === 'layout' && (
          <SectionBuilder
            sections={sections}
            availableFields={fieldNames}
            onChange={(s) => { setSections(s); setIsDirty(true) }}
          />
        )}

        {/* Tab 3: Relationships */}
        {activeTab === 'relationships' && (
          <RelationshipBuilder
            relationships={relationships}
            onChange={(r) => { setRelationships(r); setIsDirty(true) }}
          />
        )}

        {/* Tab 4: Virtual Entity (Capability Flags) */}
        {activeTab === 'virtual-entity' && (
          <CapabilityFlagsPanel
            value={capabilityFlags}
            onChange={(f) => { setCapabilityFlags(f); setIsDirty(true) }}
          />
        )}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: 600 }}>
            <FormRow label="Display name">
              <Input
                value={settings.displayName ?? ''}
                onChange={e => { setSettings(s => ({ ...s, displayName: e.target.value })); setIsDirty(true) }}
                placeholder="e.g. Job Card"
              />
            </FormRow>
            <FormRow label="Plural name">
              <Input
                value={settings.pluralName ?? ''}
                onChange={e => { setSettings(s => ({ ...s, pluralName: e.target.value })); setIsDirty(true) }}
                placeholder="e.g. Job Cards"
              />
            </FormRow>
            <FormRow label="Category">
              <Input
                value={settings.category ?? ''}
                onChange={e => { setSettings(s => ({ ...s, category: e.target.value })); setIsDirty(true) }}
                placeholder="e.g. Operations"
              />
            </FormRow>
            <FormRow label="Icon">
              <Input
                value={settings.icon ?? ''}
                onChange={e => { setSettings(s => ({ ...s, icon: e.target.value })); setIsDirty(true) }}
                placeholder="Lucide icon name, e.g. briefcase"
              />
            </FormRow>
            <FormRow label="Color">
              <input
                type="color"
                value={settings.color ?? '#000000'}
                onChange={e => { setSettings(s => ({ ...s, color: e.target.value })); setIsDirty(true) }}
                style={{ height: 40, width: 80, padding: 4, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}
              />
            </FormRow>
            <FormRow label="Description">
              <Textarea
                value={settings.description ?? ''}
                onChange={e => { setSettings(s => ({ ...s, description: e.target.value })); setIsDirty(true) }}
                rows={4}
                placeholder="Brief description of this entity"
              />
            </FormRow>
            {!isNew && artifact && (
              <div style={{ marginTop: 24 }}>
                <StatusFlowEditor
                  statuses={statuses}
                  transitions={transitions}
                  onStatusesChange={(s) => { setStatuses(s); setIsDirty(true) }}
                  onTransitionsChange={(t) => { setTransitions(t); setIsDirty(true) }}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Node Scope */}
        {activeTab === 'node-scope' && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
            Node scope configuration will be available once the NodeScopePicker component is integrated.
          </div>
        )}

        {/* Tab 7: Indexes */}
        {activeTab === 'indexes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <CompositeIndexPanel
              indexes={indexes}
              availableFields={fieldNames}
              entityKey={id ?? ''}
              onChange={(ix) => { setIndexes(ix); setIsDirty(true) }}
            />
            {id && <IndexMigrationPanel entityKey={id} />}
          </div>
        )}

        {/* Tab 8: Data Retention */}
        {activeTab === 'data-retention' && (
          <RetentionPanel
            value={retention}
            onChange={(r) => { setRetention(r); setIsDirty(true) }}
          />
        )}
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
      <NLPAssistantPanel
        open={nlpOpen}
        onClose={() => setNlpOpen(false)}
        schemaContext={{ fields, relationships }}
        onImportFields={(imported: NLPImportedField[]) => {
          const newFields: FieldDef[] = imported.map(f => ({
            name: f.name,
            label: f.name,
            type: f.type,
            required: f.required ?? false,
            unique: false,
            indexed: false,
            storageType: 'physical' as const,
          }))
          setFields(prev => [...prev, ...newFields])
          setIsDirty(true)
          setNlpOpen(false)
        }}
      />
    </EditorLayout>
  )
}

function ContextBarItem({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: 'var(--fg-quaternary)' }}>{label}:</span>
      <span style={{ fontWeight: 600, color: 'var(--fg-secondary)' }}>{value}</span>
    </span>
  )
}

function ContextBarSep() {
  return <span style={{ margin: '0 10px', color: 'var(--border-primary)' }}>|</span>
}

export default EntityEditorPage
