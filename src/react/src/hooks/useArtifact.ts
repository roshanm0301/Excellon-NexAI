import { useQuery } from '@tanstack/react-query'
import { getArtifact } from '../config/studioApi'

export function useArtifact(id: string | undefined) {
  return useQuery({
    queryKey: ['artifact', id],
    queryFn: () => getArtifact(id!),
    enabled: !!id,
  })
}
