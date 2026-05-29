import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listArtifacts, deleteArtifact, publishArtifact } from '../config/studioApi'

export function useEntityArtifacts() {
  return useQuery({
    queryKey: ['entity-artifacts'],
    queryFn: () => listArtifacts({ artifact_type: 'entity_schema' }),
  })
}

export function useDeleteArtifact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteArtifact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entity-artifacts'] }),
  })
}

export function usePublishArtifact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => publishArtifact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entity-artifacts'] }),
  })
}
