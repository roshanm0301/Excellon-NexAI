import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listOverlays, createOverlayDelta, deleteOverlayDelta, OverlayDelta } from '../config/studioApi'

export function useOverlays(artifactType: string, artifactKey: string) {
  return useQuery({
    queryKey: ['overlays', artifactType, artifactKey],
    queryFn: () => listOverlays(artifactType, artifactKey),
    enabled: !!artifactType && !!artifactKey,
  })
}

export function useCreateOverlayDelta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (delta: Partial<OverlayDelta>) => createOverlayDelta(delta),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlays'] }),
  })
}

export function useDeleteOverlayDelta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteOverlayDelta,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overlays'] }),
  })
}
