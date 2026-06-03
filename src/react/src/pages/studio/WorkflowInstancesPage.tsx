import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Play, XCircle, Eye, RefreshCw } from 'lucide-react'
import {
  Button, Badge, Spinner, Banner, DataTable, useToast, ConfirmDialog,
  type Column,
} from '../../design-system'
import {
  listWorkflowInstances, abortWorkflowInstance,
  type ProcessInstanceV2, type WorkflowInstanceStatus,
} from '../../config/studioApi'
import { ExecutionViewer } from '../../components/studio/WorkflowCanvas'

export default function WorkflowInstancesPage() {
  const { id: definitionId, instanceId } = useParams<{ id: string; instanceId?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [abortTarget, setAbortTarget] = useState<string | null>(null)

  // If we have an instanceId, show the execution viewer
  if (instanceId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate(`/workflow/${definitionId}/instances`)} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>Instance Detail</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ExecutionViewer instanceId={instanceId} />
        </div>
      </div>
    )
  }

  // Instance list
  const { data, isLoading } = useQuery({
    queryKey: ['workflow-instances', definitionId],
    queryFn: () => listWorkflowInstances(definitionId),
    refetchInterval: 5000,
  })

  const abortMut = useMutation({
    mutationFn: (instId: string) => abortWorkflowInstance(instId, 'Manually aborted from UI'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow-instances'] })
      toast({ title: 'Instance aborted', variant: 'success' })
      setAbortTarget(null)
    },
    onError: () => toast({ title: 'Abort failed', variant: 'error' }),
  })

  const statusColor = (s: WorkflowInstanceStatus): 'success' | 'error' | 'warning' | 'info' | 'neutral' => {
    switch (s) {
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'running': return 'info'
      case 'waiting': return 'warning'
      case 'aborted': return 'neutral'
    }
  }

  const columns: Column<ProcessInstanceV2>[] = [
    {
      key: 'id',
      label: 'Instance ID',
      render: (row) => (
        <button
          style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-600)', padding: 0 }}
          onClick={(e) => { e.stopPropagation(); navigate(`/workflow/${definitionId}/instances/${row.id}`) }}
        >
          {row.id.slice(0, 12)}…
        </button>
      ),
    },
    {
      key: 'entityId',
      label: 'Entity',
      width: 130,
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{row.entityId?.slice(0, 10)}…</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      sortable: true,
      render: (row) => <Badge variant={statusColor(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'startedAt',
      label: 'Started',
      width: 160,
      sortable: true,
      render: (row) => row.startedAt ? new Date(row.startedAt).toLocaleString() : '—',
    },
    {
      key: 'completedAt',
      label: 'Completed',
      width: 160,
      render: (row) => row.completedAt ? new Date(row.completedAt).toLocaleString() : '—',
    },
    {
      key: 'actions',
      label: '',
      width: 120,
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); navigate(`/workflow/${definitionId}/instances/${row.id}`) }} />
          {(row.status === 'running' || row.status === 'waiting') && (
            <Button variant="ghost" size="sm" icon={<XCircle size={14} />} onClick={(e) => { e.stopPropagation(); setAbortTarget(row.id) }} style={{ color: 'var(--error-600)' }} />
          )}
        </div>
      ),
    },
  ]

  const items = data?.items ?? []

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate(`/workflow/${definitionId}/edit`)} />
        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-primary)', margin: 0, flex: 1 }}>
          Workflow Instances
        </h1>
        <Badge variant="neutral">{items.length} total</Badge>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        emptyMessage="No instances running for this workflow."
        onRowClick={(row) => navigate(`/workflow/${definitionId}/instances/${row.id}`)}
      />

      {abortTarget && (
        <ConfirmDialog
          open
          title="Abort Instance"
          description="Are you sure you want to abort this workflow instance? This cannot be undone."
          confirmLabel="Abort"
          variant="danger"
          onConfirm={() => abortMut.mutate(abortTarget)}
          onCancel={() => setAbortTarget(null)}
        />
      )}
    </div>
  )
}
