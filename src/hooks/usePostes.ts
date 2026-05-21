import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PosteDiplomatique } from '../types';

export function usePostes(paysId?: string) {
  return useQuery<{ success: boolean; data: PosteDiplomatique[] }>({
    queryKey: ['postes', { paysId }],
    queryFn: () => api.get('/postes-diplomatiques', { params: paysId ? { paysId } : {} }).then((r) => r.data),
  });
}

export function usePoste(id: string) {
  return useQuery<{ success: boolean; data: PosteDiplomatique }>({
    queryKey: ['postes', id],
    queryFn: () => api.get(`/postes-diplomatiques/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePoste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nom: string; type: string; ville: string; paysId: string }) =>
      api.post('/postes-diplomatiques', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['postes'] }),
  });
}

export function useUpdatePoste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; nom?: string; type?: string; ville?: string; paysId?: string }) =>
      api.put(`/postes-diplomatiques/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['postes'] }),
  });
}

export function useDeletePoste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/postes-diplomatiques/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['postes'] }),
  });
}
