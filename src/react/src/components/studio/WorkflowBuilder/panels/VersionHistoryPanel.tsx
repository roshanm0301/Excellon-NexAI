import { useQuery } from '@tanstack/react-query'
import { History, RotateCcw } from 'lucide-react'
import { Drawer, Spinner } from '../../../../design-system'
import { getWorkflowVersions } from '../../../../config/studioApi'

interface VersionHistoryPanelProps {
  open: boolean
  onClose: () => void
  artifactId: string
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function VersionHistoryPanel({ open, onClose, artifactId }: VersionHistoryPanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['workflow-versions', artifactId],
    queryFn: () => getWorkflowVersions(artifactId),
    enabled: open && !!artifactId,
  })

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border)',
  }

  return (
    <Drawer open={open} onClose={onClose} title="Version History" width={400}>
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spinner />
        </div>
      )}

      {isError && (
        <div style={{ padding: 20, color: 'var(--error-600, #dc2626)', fontSize: '0.875rem' }}>
          Failed to load version history.
        </div>
      )}

      {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '40px 20px',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          <History size={28} color="var(--color-text-muted)" />
          <span style={{ fontSize: '0.875rem' }}>No published versions yet.</span>
          <span style={{ fontSize: '0.8125rem' }}>Publish your workflow to create the first version.</span>
        </div>
      )}

      {!isLoading && !isError && data?.items && data.items.length > 0 && (
        <div style={{ padding: '0 4px' }}>
          {data.items.map((item, i) => (
            <div key={`v${item.version}-${i}`} style={rowStyle}>
              {/* Version badge */}
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--brand-50, #eff6ff)',
                  border: '1px solid var(--brand-200, #bfdbfe)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--brand-600, #2563eb)',
                }}
              >
                v{item.version}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Version {item.version}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {formatDate(item.publishedAt)}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  by {item.publishedBy}
                </div>
              </div>

              {/* Restore button */}
              <button
                onClick={() => alert('Coming soon')}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                }}
                title="Restore this version (coming soon)"
              >
                <RotateCcw size={12} />
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  )
}
