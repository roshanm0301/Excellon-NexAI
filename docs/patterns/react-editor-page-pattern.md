# Pattern: React Editor Page

> Canonical reference for GitHub Copilot. Read this before writing any new editor/detail page.

## What This Pattern Is

Every studio editor page follows the same structure:

- `useParams` + `useSearchParams` to resolve the artifact/record ID
- `useQuery` to load the record on mount; draft state initialised from it via `useEffect`
- Local `draft` state â€” never a global store
- `dirty` flag: `JSON.stringify(draft) !== JSON.stringify(original)`
- `beforeunload` guard when dirty
- Debounced auto-save (2 s) via `useRef` timer
- Manual Save button (disabled when not dirty)
- Publish button behind a `ConfirmDialog`
- Multi-tab layout via `TabGroup` from the design system

## Canonical Example

Source: `src/react/src/pages/studio/EntityEditorPage.tsx`

### State variables

```tsx
const { entityType } = useParams<{ entityType: string }>()
const [searchParams] = useSearchParams()
const navigate = useNavigate()
const { success, error: toastError } = useToast()
const qc = useQueryClient()

const artifactId = searchParams.get('id') ?? entityType ?? ''

const [activeTab, setActiveTab] = useState('fields')
const [draft, setDraft] = useState<EntityPayload | null>(null)
const [publishing, setPublishing] = useState(false)
const [confirmPublish, setConfirmPublish] = useState(false)

const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
```

### Data loading

```tsx
const { data: artifact, isLoading } = useQuery({
  queryKey: ['artifact', artifactId],
  queryFn: () => getArtifact(artifactId),
  enabled: !!artifactId,
})

// Initialise draft once â€” never on every render
useEffect(() => {
  if (artifact && draft === null) {
    setDraft(payloadFromArtifact(artifact))
  }
}, [artifact, draft])
```

### isDirty tracking

```tsx
const dirty =
  draft !== null &&
  artifact !== undefined &&
  JSON.stringify(draft) !== JSON.stringify(artifact.payload)
```

### beforeunload guard

```tsx
useEffect(() => {
  if (!dirty) return
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = ''
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [dirty])
```

### Debounced auto-save

```tsx
useEffect(() => {
  if (!dirty || !draft) return
  if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
  autoSaveTimer.current = setTimeout(() => {
    saveMut.mutate(draft)
  }, 2000)
  return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [draft, dirty])
```

### Save mutation

```tsx
const saveMut = useMutation({
  mutationFn: (p: EntityPayload) =>
    saveArtifact(artifactId, p as unknown as Record<string, unknown>),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['artifact', artifactId] })
    success('Saved', 'Changes saved successfully')
  },
  onError: () => toastError('Save failed', 'Could not save changes'),
})

function handleManualSave() {
  if (!draft) return
  if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
  saveMut.mutate(draft)
}
```

### Publish handler

```tsx
async function handlePublish() {
  try {
    setPublishing(true)
    if (dirty && draft) await saveMut.mutateAsync(draft)  // flush unsaved changes first
    await publishArtifact(artifactId)
    qc.invalidateQueries({ queryKey: ['artifact', artifactId] })
    success('Published', 'Schema compiled and published')
  } catch {
    toastError('Publish failed', 'Check the definition for errors')
  } finally {
    setPublishing(false)
    setConfirmPublish(false)
  }
}
```

### Tab definitions and layout

```tsx
const TABS = [
  { id: 'fields',        label: 'Fields' },
  { id: 'sections',      label: 'Sections' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'capabilities',  label: 'Capabilities' },
  { id: 'settings',      label: 'Settings' },
  { id: 'node-scoping',  label: 'Node Scoping' },
  { id: 'indexes',       label: 'Indexes' },
  { id: 'retention',     label: 'Retention' },
  { id: 'er-diagram',    label: 'ER Diagram' },
]

// In JSX:
<TabGroup tabs={TABS} active={activeTab} onChange={setActiveTab} />

{/* Tab content â€” one conditional block per tab */}
<div style={{ padding: '24px 0' }}>
  {activeTab === 'fields'     && <FieldsTab ... />}
  {activeTab === 'settings'   && <SettingsTab ... />}
  {/* ... */}
</div>
```

### Sticky header with dirty indicator

```tsx
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
          <span>{entityType}</span>
        </div>
        {/* Title + status + dirty indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="ex-h1">{draft?.displayName ?? artifact?.entity_type}</h1>
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
```

## How to Add a New Tab

1. Add an entry to the `TABS` array: `{ id: 'my-tab', label: 'My Tab' }`
2. Create a sub-component `function MyTab({ ... }: MyTabProps)` in the same file
3. Add a conditional block in the tab content area: `{activeTab === 'my-tab' && <MyTab ... />}`
4. Pass the relevant slice of `draft` as props and call `patchDraft({ myField: value })` on change

Never render all tabs at once â€” only the active one. This keeps DOM size manageable for large editors.

## What Copilot CAN Replicate

- Following the same state variable names and lifecycle hook sequence
- Additional tab entries and sub-tab components inside an existing editor
- The `patchDraft` helper pattern for shallow-merging draft updates

## What Copilot Must NOT Do

- Do NOT use a global state store (Zustand/Redux) for editor state â€” `useState` is correct
- Do NOT call `fetch()` directly â€” use functions from `studioApi.ts`
- Do NOT omit the `beforeunload` guard when `dirty` tracking is present
- Do NOT skip the `ConfirmDialog` for the Publish action
- Do NOT mutate `draft` in place â€” always produce a new object
- Do NOT read `artifact_version.payload` for runtime display â€” that is for the editor only; runtime pages read `compiled_artifact`
