import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getView } from '../../../config/studioApi'
import { Spinner, ErrorState } from '../../../design-system'
import { RuntimeListView } from './RuntimeListView'
import './runtime.css'

export default function RuntimeViewPage() {
  const { viewId } = useParams<{ viewId: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['runtime-view', viewId],
    queryFn: () => getView(viewId!),
    enabled: !!viewId,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spinner />
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState title="View not found" description="This view could not be loaded." />
  }

  const surface = data.surface_type ?? 'standard_crud'
  const entity = data.primary_entity ?? ''

  if (surface === 'standard_crud' || surface === 'advanced_crud') {
    return <RuntimeListView view={data} entityType={entity} />
  }

  return (
    <div className="rv-page">
      <div className="rv-header">
        <h1 className="rv-header__title">{data.view_label ?? data.view_code}</h1>
        <span className="rv-header__entity">{entity}</span>
      </div>
      <div style={{ padding: 40, color: 'var(--fg-tertiary)', textAlign: 'center' }}>
        Runtime renderer for <strong>{surface}</strong> views coming soon.
      </div>
    </div>
  )
}
