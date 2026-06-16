# Pattern: React List Page

> Canonical reference for GitHub Copilot. Read this before writing any new list/index page.

## What This Pattern Is

Every admin list page in this codebase follows the same structure:

- Route: `/admin/{resource}` or `/{resource}` depending on nav context
- `useQuery` to load list data
- `DataTable` component from the design system with typed `Column<T>[]`
- `useMutation` for inline row actions (publish, delete, etc.)
- `ConfirmDialog` gating destructive mutations
- `useToast` for success/error feedback
- Navigate to editor via `useNavigate`

## Canonical Example

Source: `src/react/src/pages/admin/EntityDesignerPage.tsx`

### Imports

```tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Button, StatusBadge, SearchInput, DataTable,
  ConfirmDialog, useToast, type Column,
} from '../../design-system'
import { listArtifacts, createArtifact, deleteArtifact, type Artifact } from '../../config/studioApi'
```

### Component skeleton

```tsx
export function EntityDesignerPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const qc = useQueryClient()

  // Local UI state â€” no global store
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Artifact | null>(null)

  // Data loading
  const { data, isLoading } = useQuery({
    queryKey: ['artifacts'],
    queryFn: () => listArtifacts(),
  })

  // Mutations
  const deleteMut = useMutation({
    mutationFn: deleteArtifact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artifacts'] })
      setDeleteTarget(null)
      success('Deleted')
    },
    onError: () => error('Delete failed'),
  })

  // Client-side filter
  const filtered = (data?.items ?? []).filter(a =>
    a.entity_type.toLowerCase().includes(search.toLowerCase())
  )

  // Column definitions
  const columns: Column<Artifact>[] = [
    {
      key: 'entity_type',
      label: 'Entity Type',
      sortable: true,
      render: row => (
        <button
          className="ex-link"
          onClick={() => navigate(`/entities/${row.entity_type}?id=${row.id}`)}
        >
          {row.entity_type}
        </button>
      ),
    },
    { key: 'status', label: 'Status', width: 120, render: row => <StatusBadge status={row.status} /> },
    { key: 'updated_at', label: 'Last Updated', width: 160, render: row => new Date(row.updated_at).toLocaleDateString() },
    {
      key: 'actions',
      label: '',
      width: 120,
      render: row => (
        <Button variant="ghost" onClick={e => { e.stopPropagation(); setDeleteTarget(row) }}>
          Delete
        </Button>
      ),
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="ex-page-header">
        <div className="ex-page-head-row">
          <div>
            <h1 className="ex-h1">Entity Designer</h1>
            <p className="ex-page-sub">Define entity schemas, fields, and lifecycle rules</p>
          </div>
          <div className="ex-page-actions">
            <Button variant="primary" onClick={() => { /* open create modal */ }}>
              New Entity
            </Button>
          </div>
        </div>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{ maxWidth: 320 }}
        />
      </div>

      {/* Data table */}
      <DataTable<Artifact & Record<string, unknown>>
        columns={columns as Column<Artifact & Record<string, unknown>>[]}
        rows={filtered as (Artifact & Record<string, unknown>)[]}
        loading={isLoading}
        emptyTitle="No entities yet"
        emptyDescription='Click "New Entity" to get started.'
        keyField="id"
      />

      {/* Destructive action guard */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete entity"
        message={`Permanently delete "${deleteTarget?.entity_type}"?`}
        confirmLabel="Delete"
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}
```

## Navigate to Editor Pattern

```tsx
// From list row â€” always pass ?id= for unambiguous lookup
navigate(`/entities/${row.entity_type}?id=${row.id}`)

// From Create mutation onSuccess
onSuccess: (artifact) => {
  qc.invalidateQueries({ queryKey: ['artifacts'] })
  navigate(`/entities/${artifact.entity_type}?id=${artifact.id}`)
}
```

## Row Actions Shape

Row actions are a `Column` entry with an empty `label` and a fixed `width`:

```tsx
{
  key: 'actions',
  label: '',
  width: 180,
  render: row => (
    <div style={{ display: 'flex', gap: 4 }}>
      <Button variant="ghost" onClick={e => { e.stopPropagation(); handlePrimary(row) }}>
        Primary Action
      </Button>
      <Button variant="ghost" onClick={e => { e.stopPropagation(); setDeleteTarget(row) }}
        style={{ color: 'var(--error-600)' }}>
        Delete
      </Button>
    </div>
  ),
}
```

## Import Path Conventions

| What | Import from |
|------|------------|
| Design system components | `../../design-system` |
| API functions and types | `../../config/studioApi` |
| TanStack Query | `@tanstack/react-query` |
| Router | `react-router-dom` |
| Icons | `lucide-react` |

## What Copilot CAN Replicate

- Following this exact component skeleton and import structure
- Additional `useMutation` entries for other row actions (publish, archive, duplicate)
- Additional `Column` entries in the column definition array

## What Copilot Must NOT Do

- Do NOT call `fetch()` directly â€” all API calls must go through `studioApi.ts`
- Do NOT use third-party component libraries (no MUI, Ant Design, Chakra)
- Do NOT introduce a global state store (Zustand/Redux) â€” use `useState` for local UI state
- Do NOT write class components
- Do NOT use `any` in TypeScript â€” type all column generics and API responses
- Do NOT duplicate `studioApi.ts` functions â€” add new API functions to the existing file
