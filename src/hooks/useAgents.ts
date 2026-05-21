import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { compressImage } from '../lib/imageUtils';
import type { Agent, AgentStatus, PaginatedResponse, AgentTrackResult } from '../types';

interface AgentFilters {
  search?: string;
  status?: AgentStatus;
  grade?: string;
  directionId?: string;
  page?: number;
  limit?: number;
}

export function useAgents(filters: AgentFilters = {}) {
  return useQuery<PaginatedResponse<Agent>>({
    queryKey: ['agents', filters],
    queryFn: () => api.get('/agents', { params: filters }).then((r) => r.data),
  });
}

export function useAgent(id: string) {
  return useQuery<{ success: boolean; data: Agent }>({
    queryKey: ['agents', id],
    queryFn: () => api.get(`/agents/${id}`).then((r) => r.data),
    enabled: !!id && id !== 'new',
  });
}

export function useTrackAgent(id: string) {
  return useQuery<{ success: boolean; data: AgentTrackResult }>({
    queryKey: ['agents', id, 'track'],
    queryFn: () => api.get(`/agents/${id}/track`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Agent>) => api.post('/agents', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Agent> & { id: string }) =>
      api.put(`/agents/${id}`, data).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['agents', vars.id] });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgentStatus }) =>
      api.patch(`/agents/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agents/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

export function useUploadAgentPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      // Compression automatique avant envoi (max 800×800, JPEG ~200 Ko)
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append('photo', compressed);
      return api.post(`/agents/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['agents', vars.id] });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
