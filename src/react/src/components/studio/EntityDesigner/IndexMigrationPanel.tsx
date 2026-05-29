import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listIndexQueue, applyIndex, discardIndex, type IndexQueueItem } from '../../../config/studioApi'
import { Badge, Button, CodeBlock, EmptyState } from '../../../design-system'

interface IndexMigrationPanelProps {
  entityKey: string
}

const STATUS_BADGE_MAP: Record<IndexQueueItem['status'], 'brand' | 'success' | 'error' | 'gray'> = {
  pending: 'brand',
  applied: 'success',
  failed: 'error',
  discarded: 'gray',
}

export function IndexMigrationPanel({ entityKey }: IndexMigrationPanelProps) {
  const queryClient = useQueryClient()
  const queryKey = ['index-queue', entityKey]

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => listIndexQueue(entityKey),
    refetchInterval: 5000,
  })

  const applyMutation = useMutation({
    mutationFn: applyIndex,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const discardMutation = useMutation({
    mutationFn: discardIndex,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  if (isLoading) {
    return (
      <div style={{ padding: 16, color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
        Loading index queue…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: 'var(--error-500)', fontSize: 'var(--text-sm)' }}>
        Failed to load index queue.
      </div>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return <EmptyState title="No index migrations" description="No index migrations pending for this entity." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(item => (
        <div
          key={item.id}
          style={{
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            background: 'var(--bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)', flex: 1 }}>
              {item.index_name}
            </span>
            <Badge variant={STATUS_BADGE_MAP[item.status]}>{item.status}</Badge>
          </div>

          <div style={{ marginBottom: 12 }}>
            <CodeBlock language="sql" code={item.ddl} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
              Created: {new Date(item.created_at).toLocaleString()}
              {item.applied_at && (
                <span style={{ marginLeft: 12 }}>
                  Applied: {new Date(item.applied_at).toLocaleString()}
                </span>
              )}
            </div>
            {item.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => applyMutation.mutate(item.id)}
                  loading={applyMutation.isPending && applyMutation.variables === item.id}
                >
                  Apply
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => discardMutation.mutate(item.id)}
                  loading={discardMutation.isPending && discardMutation.variables === item.id}
                >
                  Discard
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
