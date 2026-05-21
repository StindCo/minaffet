import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Mutation } from '../types';

export function useMutations(agentId: string) {
  return useQuery<{ success: boolean; data: Mutation[] }>({
    queryKey: ['mutations', agentId],
    queryFn: () => api.get(`/agents-externes/${agentId}/mutations`).then((r) => r.data),
    enabled: !!agentId,
  });
}

export function useCreateMutation(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { posteDiplomatiqueId?: string; paysId?: string; dateDebut: string; notes?: string }) =>
      api.post(`/agents-externes/${agentId}/mutations`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mutations', agentId] });
      qc.invalidateQueries({ queryKey: ['agents-externes', agentId] });
      qc.invalidateQueries({ queryKey: ['agents-externes', 'stats'] });
    },
  });
}

export function useValiderMutation(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mutId: string) =>
      api.patch(`/agents-externes/${agentId}/mutations/${mutId}/valider`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mutations', agentId] });
      qc.invalidateQueries({ queryKey: ['agents-externes', agentId] });
      qc.invalidateQueries({ queryKey: ['agents-externes'] });
      qc.invalidateQueries({ queryKey: ['agents-externes', 'stats'] });
    },
  });
}

export function useTerminerMutation(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mutId: string) =>
      api.patch(`/agents-externes/${agentId}/mutations/${mutId}/terminer`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mutations', agentId] });
      qc.invalidateQueries({ queryKey: ['agents-externes', agentId] });
    },
  });
}
