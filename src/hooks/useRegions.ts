import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Region } from '../types';

export function useRegions() {
  return useQuery<{ success: boolean; data: Region[] }>({
    queryKey: ['regions'],
    queryFn: () => api.get('/regions').then((r) => r.data),
  });
}

export function useRegion(id: string) {
  return useQuery<{ success: boolean; data: Region }>({
    queryKey: ['regions', id],
    queryFn: () => api.get(`/regions/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nom: string; code: string; description?: string }) =>
      api.post('/regions', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
  });
}

export function useUpdateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; nom?: string; code?: string; description?: string }) =>
      api.put(`/regions/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
  });
}

export function useDeleteRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/regions/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
  });
}
