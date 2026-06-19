import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getView, getRuntimeView } from '../../../config/studioApi'
import { Spinner, ErrorState } from '../../../design-system'
import { RuntimePreviewCanvas } from '../../../components/studio/RuntimePreviewCanvas'

/**
 * Runtime view page — renders any published view using RuntimePreviewCanvas.
 * The component tree (populated from the surface template at creation time)
 * drives the layout; component renderers handle live data fetching via
 * ViewRuntimeContext (DataTableRenderer, SearchBarRenderer, ButtonRenderer).
 */
export default function RuntimeViewPage() {
  const { viewId } = useParams<{ viewId: string }>()

  // Fetch the published payload (active version only)
  const { data: runtimeView, isLoading: payloadLoading, error: payloadError } = useQuery({
    queryKey: ['runtime-view', viewId],
    queryFn: () => getRuntimeView(viewId!),
    enabled: !!viewId,
  })

  // Fetch view header metadata (label, entity, surface)
  const { data: viewMeta, isLoading: metaLoading } = useQuery({
    queryKey: ['view-meta', viewId],
    queryFn: () => getView(viewId!),
    enabled: !!viewId,
  })

  if (payloadLoading || metaLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spinner />
      </div>
    )
  }

  if (payloadError || !runtimeView) {
    return (
      <ErrorState
        title="View not found"
        description="This view could not be loaded. It may not be published yet."
      />
    )
  }

  const primaryEntity = viewMeta?.primary_entity ?? ''
  const viewLabel = viewMeta?.view_label ?? viewMeta?.view_code ?? primaryEntity

  return (
    <RuntimePreviewCanvas
      payload={runtimeView.payload}
      primaryEntity={primaryEntity}
      viewLabel={viewLabel}
      role={import.meta.env.VITE_ROLE ?? 'admin'}
    />
  )
}
