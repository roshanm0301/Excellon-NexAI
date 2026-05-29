import { useQuery } from '@tanstack/react-query'
import { listNodes } from '../config/studioApi'

export function useNodes() {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: () => listNodes(),
  })
}
