# Pattern: TanStack Query (React Query v5)

> Canonical reference for GitHub Copilot. Read this before writing any new data-fetching hook.

## What This Pattern Is

All server state in the React app is managed through TanStack Query v5. The rules are:

- `useQuery` for reads (GET)
- `useMutation` + `invalidateQueries` for writes (POST/PUT/DELETE)
- Error feedback via `useToast` from the design system
- Custom hooks live in `src/react/src/hooks/`

## File Location

```
src/react/src/hooks/use{ResourceName}.ts    ← custom hooks
src/react/src/config/studioApi.ts           ← API functions (imported by hooks)
```

## Query Key Convention

Query keys are arrays. The first element is always the resource name (kebab-case string), followed by any identifiers needed to make the key unique:

```ts
// Collection
queryKey: ['artifacts']
queryKey: ['rule-sets']
queryKey: ['widgets']

// Single record
queryKey: ['artifact', artifactId]
queryKey: ['rule-set', ruleSetId]
queryKey: ['widget', widgetId]

// Filtered collection
queryKey: ['artifacts', { entity_type: entityType }]
```

Invalidating a collection also invalidates individual records within it when they share the same root key:

```ts
// Invalidates all ['artifact', ...] queries
qc.invalidateQueries({ queryKey: ['artifact'] })
```

## useQuery — Reads

```ts
import { useQuery } from '@tanstack/react-query'
import { getArtifact } from '../config/studioApi'

const { data, isLoading, error } = useQuery({
  queryKey: ['artifact', artifactId],
  queryFn: () => getArtifact(artifactId),
  enabled: !!artifactId,   // skip query when ID is absent
})
```

## useMutation — Writes with cache invalidation

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteArtifact } from '../config/studioApi'
import { useToast } from '../design-system'

const qc = useQueryClient()
const { success, error } = useToast()

const deleteMut = useMutation({
  mutationFn: deleteArtifact,
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['artifacts'] })
    success('Deleted')
  },
  onError: () => error('Delete failed'),
})

// Call: deleteMut.mutate(id)
// Or, when you need to await it: await deleteMut.mutateAsync(id)
```

## Canonical Hook Example

The `useEntityArtifacts` pattern (used in `EntityDesignerPage`) shows how queries and mutations are co-located in a hook when complexity warrants it:

```ts
// src/react/src/hooks/useEntityArtifacts.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../design-system'
import {
  listArtifacts,
  createArtifact,
  publishArtifact,
  deleteArtifact,
  type Artifact,
} from '../config/studioApi'

export function useEntityArtifacts() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const query = useQuery({
    queryKey: ['artifacts'],
    queryFn: () => listArtifacts(),
  })

  const createMut = useMutation({
    mutationFn: (entityType: string) =>
      createArtifact({ entity_type: entityType, payload: { fields: [], sections: [], relationships: [] } }),
    onSuccess: (artifact) => {
      qc.invalidateQueries({ queryKey: ['artifacts'] })
      success('Entity created', `${artifact.entity_type} draft created`)
      navigate(`/entities/${artifact.entity_type}?id=${artifact.id}`)
    },
    onError: () => error('Failed to create entity'),
  })

  const publishMut = useMutation({
    mutationFn: publishArtifact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artifacts'] })
      success('Published', 'Entity schema compiled successfully')
    },
    onError: () => error('Publish failed', 'Check the entity definition for errors'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteArtifact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artifacts'] })
      success('Deleted')
    },
    onError: () => error('Delete failed'),
  })

  return {
    artifacts: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    createMut,
    publishMut,
    deleteMut,
  }
}
```

## Error Handling via Toast

```ts
onError: (err) => {
  // Simple message
  error('Delete failed')

  // With detail — cast to ApiError to access status
  if (err instanceof ApiError && err.status === 409) {
    error('Conflict', 'A record with this name already exists')
  } else {
    error('Failed', 'An unexpected error occurred')
  }
}
```

Import `ApiError` from `studioApi`:

```ts
import { ApiError } from '../config/studioApi'
```

## When to Extract a Custom Hook

Extract queries and mutations to a custom hook in `src/react/src/hooks/` when:

- The same data is used in more than one component
- A page component would otherwise have more than 3 mutations

For single-page use, inline `useQuery` / `useMutation` directly in the component (as in `EntityEditorPage`).

## What Copilot CAN Replicate

- Additional `useQuery` calls following the `queryKey` convention
- Additional `useMutation` + `invalidateQueries` pairs following the toast pattern
- New custom hooks in `src/react/src/hooks/` for new resource types
- `enabled: !!someId` guard pattern to skip queries when IDs are absent

## What Copilot Must NOT Do

- Do NOT call `fetch()` or any HTTP client directly inside hooks — use `studioApi.ts` functions
- Do NOT use `useEffect` to trigger fetches — use `useQuery`
- Do NOT manage server state in `useState` — that is what `useQuery` is for
- Do NOT forget `invalidateQueries` after mutations — stale data is a bug
- Do NOT introduce a global state store (Zustand/Redux) — TanStack Query cache is the server state store
- Do NOT use `any` in TypeScript hook return types
