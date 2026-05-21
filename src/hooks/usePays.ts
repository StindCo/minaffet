import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Pays } from '../types';

export function usePays(regionId?: string) {
  return useQuery<{ success: boolean; data: Pays[] }>({
    queryKey: ['pays', { regionId }],
    queryFn: () => api.get('/pays', { params: regionId ? { regionId } : {} }).then((r) => r.data),
  });
}

export function usePaysById(id: string) {
  return useQuery<{ success: boolean; data: Pays }>({
    queryKey: ['pays', id],
    queryFn: () => api.get(`/pays/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nom: string; codeIso: string; codeIso2?: string; regionId: string }) =>
      api.post('/pays', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pays'] });
      qc.invalidateQueries({ queryKey: ['regions'] });
    },
  });
}

export function useUpdatePays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; nom?: string; codeIso?: string; codeIso2?: string; regionId?: string }) =>
      api.put(`/pays/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pays'] }),
  });
}

export function useDeletePays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/pays/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pays'] }),
  });
}
