import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listWorkflowArtifacts,
  createWorkflowArtifact,
  getWorkflowArtifact,
  saveWorkflowDraft,
  publishWorkflowArtifact,
  deleteWorkflowArtifact,
} from '../config/studioApi'
import type { CreateWorkflowRequest, WorkflowDefinition } from '../types/workflowBuilder'

// ─── Workflow Queries ─────────────────────────────────────────────────────────

export function useWorkflowArtifacts(params?: { status?: string; entity?: string }) {
  return useQuery({
    queryKey: ['workflows', params],
    queryFn: () => listWorkflowArtifacts(params),
  })
}

export function useWorkflowArtifact(id: string | undefined) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => getWorkflowArtifact(id!),
    enabled: !!id,
  })
}

// ─── Workflow Mutations ───────────────────────────────────────────────────────

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateWorkflowRequest) => createWorkflowArtifact(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useSaveWorkflowDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, definition }: { id: string; definition: WorkflowDefinition }) =>
      saveWorkflowDraft(id, definition),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['workflow', id] })
    },
  })
}

export function usePublishWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishWorkflowArtifact(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      qc.invalidateQueries({ queryKey: ['workflow', id] })
    },
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWorkflowArtifact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}
