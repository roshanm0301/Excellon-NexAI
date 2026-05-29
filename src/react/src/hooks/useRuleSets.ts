import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listRuleSets, deleteRuleSet, saveRuleSet, createRuleSet, RuleSet } from '../config/studioApi'

export function useRuleSets(entityType?: string) {
  return useQuery({
    queryKey: ['rule-sets', entityType],
    queryFn: () => listRuleSets(entityType),
  })
}

export function useDeleteRuleSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteRuleSet,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rule-sets'] }),
  })
}

export function useSaveRuleSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<RuleSet> }) => saveRuleSet(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rule-sets'] }),
  })
}

export function useCreateRuleSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { entity_type: string; name: string }) => createRuleSet(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rule-sets'] }),
  })
}
