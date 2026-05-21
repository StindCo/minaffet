import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Direction } from '../types';

export function useDirections() {
  return useQuery<{ success: boolean; data: Direction[] }>({
    queryKey: ['directions'],
    queryFn: () => api.get('/directions').then((r) => r.data),
  });
}

export function useCreateDirection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string; nom: string; description?: string }) =>
      api.post('/directions', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['directions'] }),
  });
}

export function useUpdateDirection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; code?: string; nom?: string; description?: string | null }) =>
      api.put(`/directions/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['directions'] }),
  });
}

export function useDeleteDirection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/directions/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['directions'] }),
  });
}
