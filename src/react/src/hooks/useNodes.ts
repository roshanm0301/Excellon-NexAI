import { useQuery } from '@tanstack/react-query'
import { listNodes, getNodeTree } from '../config/studioApi'

export function useNodes() {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: () => listNodes(),
  })
}

export function useNodeTree() {
  return useQuery({
    queryKey: ['node-tree'],
    queryFn: () => getNodeTree(),
  })
}
