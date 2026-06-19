import { useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getView, getRuntimeView } from '../../config/studioApi'
import { Spinner, ErrorState } from '../../design-system'
import { RuntimePreviewCanvas } from '../../components/studio/RuntimePreviewCanvas'
import './ScreenViewPage.css'

export default function ScreenViewPage() {
  const { viewId } = useParams<{ viewId: string }>()
  const location = useLocation()
  // Label/entity passed from the sidebar nav click for instant display
  const navState = (location.state as { label?: string; entity?: string } | null)

  // Fetch display metadata (label, entity, surface) — getView returns latest version header
  const { data: viewMeta, isLoading: metaLoading } = useQuery({
    queryKey: ['view-meta', viewId],
    queryFn: () => getView(viewId!),
    enabled: !!viewId,
  })

  // Fetch the PUBLISHED payload — getRuntimeView only returns is_active=true versions.
  // This ensures edits saved as drafts never appear in SCREENS until re-published.
  const { data: runtimeView, isLoading: payloadLoading, error: payloadError } = useQuery({
    queryKey: ['runtime-view', viewId],
    queryFn: () => getRuntimeView(viewId!),
    enabled: !!viewId,
  })

  if (metaLoading || payloadLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner />
      </div>
    )
  }

  // No published version exists for this view
  if (payloadError || !runtimeView) {
    return (
      <ErrorState
        title="Not published yet"
        description="This screen has no published version. Open it in UI Studio, make your changes, and click Publish."
      />
    )
  }

  const label = viewMeta?.view_label ?? navState?.label ?? viewMeta?.view_code ?? 'Screen'
  const entity = viewMeta?.primary_entity ?? navState?.entity ?? ''
  const surface = (viewMeta?.surface_type ?? 'standard_crud').replace(/_/g, ' ')

  // Always use the PUBLISHED payload — never the draft
  const payload = runtimeView.payload

  if (!payload?.component_tree) {
    return (
      <ErrorState
        title="No published content"
        description="This view was published but has no component tree. Re-publish from UI Studio."
      />
    )
  }

  return (
    <div className="screen-view-page" data-testid="screen-view-page">
      {/* Clean header — no designer chrome */}
      <div className="screen-view-page__header">
        <div className="screen-view-page__title">{label}</div>
        <div className="screen-view-page__meta">
          {entity && (
            <span className="screen-view-page__badge" title={`Primary entity: ${entity}`}>
              {entity}
            </span>
          )}
          <span className="screen-view-page__surface">{surface}</span>
        </div>
      </div>

      {/* Runtime renderer — always uses the published payload, never a draft */}
      <div className="screen-view-page__body">
        <RuntimePreviewCanvas
          payload={payload}
          primaryEntity={entity}
          viewLabel={label}
          role={import.meta.env.VITE_ROLE ?? 'admin'}
        />
      </div>
    </div>
  )
}
