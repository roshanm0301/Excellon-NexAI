import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listOverlays, createOverlay, deleteOverlay, OverlayDefinition } from '../config/studioApi'

export function useOverlays(artifactType?: string) {
  return useQuery({
    queryKey: ['overlays', artifactType],
    queryFn: () => listOverlays(artifactType ? { entity_type: artifactType } : undefined),
  })
}

export function useCreateOverlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (delta: Omit<OverlayDefinition, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => createOverlay(delta),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlays'] }),
  })
}

export function useDeleteOverlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteOverlay,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlays'] }),
  })
}
