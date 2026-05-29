# FRONTEND-STANDARDS.md — React Application Architecture & Conventions

> **Read before writing any React or TypeScript code.**

---

## Project Setup

```
src/react/src/
├── pages/
│   ├── admin/           # List/management pages (EntityDesignerPage, RuleBuilderPage, etc.)
│   └── studio/          # Editor pages (EntityEditorPage, WorkflowCanvasPage, etc.)
├── components/
│   ├── studio/          # All framework UI components, organised by subsystem
│   │   ├── EntityDesigner/
│   │   ├── NodeTree/
│   │   └── ...
│   └── expression/      # ExpressionEditor (Monaco + JSONata)
├── config/
│   └── studioApi.ts     # THE ONLY FILE THAT CALLS fetch() — all API calls go here
├── design-system/       # Excellon Design System — read before writing any component
└── hooks/               # Custom hooks (TanStack Query wrappers)
```

---

## The studioApi.ts Rule

**`studioApi.ts` is the only file that may call `fetch()` directly.** No exceptions.

Every API function follows this pattern:

```typescript
// studioApi.ts
const DEV_HEADERS = {
    'x-tenant-id': import.meta.env.VITE_TENANT_ID ?? 'default-tenant',
    'x-user-id': import.meta.env.VITE_USER_ID ?? 'dev-user',
    'x-role': import.meta.env.VITE_ROLE ?? 'ADMIN',
};

async function studioFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...DEV_HEADERS,
            ...(init?.headers ?? {}),
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ code: 'unknown', message: res.statusText }));
        throw new ApiError(res.status, err.code, err.message);
    }
    return res.json() as Promise<T>;
}

// Example function — all API functions follow this exact shape
export async function listEntityArtifacts(tenantId: string): Promise<ArtifactHeader[]> {
    return studioFetch<ArtifactHeader[]>(`/v1/artifacts?artifact_type=entity_schema&tenant_id=${tenantId}`);
}

export async function publishArtifactVersion(artifactId: string, versionNo: number): Promise<ArtifactVersion> {
    return studioFetch<ArtifactVersion>(`/v1/artifacts/${artifactId}/versions/${versionNo}/publish`, {
        method: 'POST',
    });
}
```

---

## TanStack Query Pattern

```typescript
// hooks/useEntityArtifacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listEntityArtifacts, deleteArtifact } from '../config/studioApi';

// Query key convention: ['resource-name', ...identifiers]
export function useEntityArtifacts(tenantId: string) {
    return useQuery({
        queryKey: ['entity-artifacts', tenantId],
        queryFn: () => listEntityArtifacts(tenantId),
    });
}

export function useDeleteArtifact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtifact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entity-artifacts'] });
        },
    });
}
```

---

## State Management Rules

| State type | Where it lives | Why |
|-----------|---------------|-----|
| Server/remote data | TanStack Query (`useQuery`) | Handles loading, caching, refetching |
| Editor local state (EntityEditorPage, etc.) | Local `useState` per page | Editor is self-contained; no sharing needed |
| Form state (within a component) | React Hook Form | Consistent validation + dirty tracking |
| Global UI state (e.g. sidebar open/closed) | If truly needed: Zustand — but first ask if it's really needed | Keep as local as possible |

**The EntityEditorPage owns all editor state as `useState` hooks.** This is intentional. The tabs share state through the page component's props. This is the established pattern — follow it.

---

## Page Component Pattern (List Pages)

```tsx
// pages/admin/SomethingPage.tsx
import { VirtualGrid } from '../../design-system/components/VirtualGrid';
import { useSomethingList } from '../../hooks/useSomethingList';

export default function SomethingPage() {
    const { data, isLoading, error } = useSomethingList();

    const columns = [
        { key: 'name', label: 'Name', render: (row) => row.name },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.isActive} /> },
        // ...
    ];

    const actions = [
        { label: 'Edit', onClick: (row) => navigate(`/admin/something/${row.id}/edit`) },
        { label: 'Delete', onClick: (row) => handleDelete(row.id), variant: 'danger' },
    ];

    return (
        <PageLayout title="Something" headerActions={<Button onClick={() => navigate('/admin/something/new')}>New</Button>}>
            <VirtualGrid
                columns={columns}
                data={data ?? []}
                loading={isLoading}
                rowActions={actions}
            />
        </PageLayout>
    );
}
```

---

## Page Component Pattern (Editor Pages)

```tsx
// pages/studio/SomethingEditorPage.tsx
// Editor pages use local useState — no global store
export default function SomethingEditorPage() {
    const { id } = useParams();
    const isNew = !id;

    // All editor state lives here
    const [fields, setFields] = useState<FieldDef[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Load on edit
    const { data: artifact } = useQuery({
        queryKey: ['artifact', id],
        queryFn: () => getArtifactLatest(id!),
        enabled: !isNew,
    });

    useEffect(() => {
        if (artifact?.payload) {
            setFields(artifact.payload.fields ?? []);
        }
    }, [artifact]);

    // Dirty state guard
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirty) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const handleSaveDraft = async () => { /* ... */ };
    const handlePublish = async () => { /* ... */ };

    return (
        <EditorLayout
            title={isNew ? 'New Entity' : artifact?.artifactName ?? ''}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            isDirty={isDirty}
        >
            <TabGroup>
                <Tab label="Schema"><FieldBuilder fields={fields} onChange={(f) => { setFields(f); setIsDirty(true); }} /></Tab>
                {/* ... */}
            </TabGroup>
        </EditorLayout>
    );
}
```

---

## TypeScript Rules

```typescript
// ✅ Strict types always
interface ArtifactHeader {
    artifactId: string;
    artifactName: string;
    artifactType: string;
    tenantId: string;
    isActive: boolean;
    updatedAt: string;
}

// ✅ Discriminated unions for variants
type StorageType = 'physical' | 'computed';
type PiiCategory = 'none' | 'indirect' | 'direct' | 'special_category' | 'biometric';

// ❌ Never use 'any'
// ❌ Never use 'as unknown as X'
// ❌ Never use non-null assertion (!) unless genuinely guaranteed by context

// ✅ Type guard pattern for narrowing
function isComputedField(field: FieldDef): field is ComputedFieldDef {
    return field.storageType === 'computed';
}
```

---

## Design System Usage

```tsx
// ✅ Always import from design system
import { Button, Input, Badge, Modal, TabGroup, Tab } from '../../design-system';

// ❌ Never raw HTML elements with inline styles
// <div style={{ padding: '16px', color: '#333' }}>...</div>

// ❌ Never third-party component libraries
// import { Button } from '@mui/material'; // WRONG
// import { Input } from 'antd'; // WRONG

// ✅ Design tokens for any custom styling needed
import { tokens } from '../../design-system/tokens';
const style = { padding: tokens.spacing[4], color: tokens.color.text.primary };
```

The Excellon Design System is provided via Claude Design. Read it at the start of every session before writing any component. All components, tokens, and usage patterns are defined there.

---

## Routing Convention

```tsx
// routes.tsx — all routes declared here
const routes = [
    // Admin (list/management)
    { path: '/admin/entities', element: <EntityDesignerPage /> },
    { path: '/admin/rules', element: <RuleBuilderPage /> },
    { path: '/admin/nodes', element: <NodeTreePage /> },
    { path: '/admin/overlays', element: <OverlayStudioPage /> },
    { path: '/admin/expressions', element: <ExpressionStudioPage /> },

    // Studio (editors)
    { path: '/admin/entities/new', element: <EntityEditorPage /> },
    { path: '/admin/entities/:id/edit', element: <EntityEditorPage /> },
    { path: '/admin/entities/map', element: <EntityMapPage /> },
    { path: '/admin/rules/new', element: <RuleEditor /> },
    { path: '/admin/rules/:id/edit', element: <RuleEditor /> },
    { path: '/admin/workflows/:id/edit', element: <WorkflowCanvasPage /> },
];

// Lazy loading — always lazy load routes (code splitting)
const EntityDesignerPage = lazy(() => import('./pages/admin/EntityDesignerPage'));
```

---

## Error Handling in Components

```tsx
// Error boundary at route level — not per component
// For query errors, use the error state from useQuery:

const { data, isLoading, error } = useEntityArtifacts(tenantId);

if (error) {
    return <ErrorState message={error instanceof ApiError ? error.message : 'Something went wrong'} />;
}

// For mutations, show toast notifications:
const mutation = useMutation({
    mutationFn: createArtifact,
    onSuccess: () => toast.success('Entity created'),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create entity'),
});
```

---

## Key Design System Components (from Excellon Design System)

The full catalogue is in Claude Design. Key components used across the framework:

- `VirtualGrid` — virtual-scroll table for all list pages
- `Button` — primary, secondary, ghost, danger variants
- `Input`, `Textarea` — text inputs
- `Select`, `MultiSelect` — dropdown selectors
- `Toggle` — boolean toggle switch
- `Badge`, `StatusBadge` — status indicators
- `Modal` — confirmations and forms
- `Drawer` / `Panel` — slide-in editors
- `TabGroup`, `Tab` — tabbed content
- `Accordion`, `AccordionRow` — collapsible rows (used in FieldBuilder)
- `PageLayout`, `EditorLayout` — page shells
- `Toast` — notifications
- `ConfirmDialog` — destructive action confirmations
- `Skeleton` — loading placeholders
- `EmptyState`, `ErrorState` — empty/error feedback

Do not replicate these. Import from the design system.
