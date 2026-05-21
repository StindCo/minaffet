import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { compressImage } from '../lib/imageUtils';
import type { AgentExterne, PaginatedResponse, StatsExternes, AgentStatus, TypeAgent, ProvinceRDC } from '../types';

export interface AgentExterneFilters {
  search?: string;
  typeAgent?: TypeAgent;
  grade?: string;
  sexe?: string;
  status?: AgentStatus;
  regionId?: string;
  paysId?: string;
  provinceOrigine?: ProvinceRDC;
  page?: number;
  limit?: number;
}

export function useAgentsExternes(filters: AgentExterneFilters = {}) {
  return useQuery<PaginatedResponse<AgentExterne>>({
    queryKey: ['agents-externes', filters],
    queryFn: () => api.get('/agents-externes', { params: filters }).then((r) => r.data),
  });
}

export function useAgentExterne(id: string) {
  return useQuery<{ success: boolean; data: AgentExterne }>({
    queryKey: ['agents-externes', id],
    queryFn: () => api.get(`/agents-externes/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useStatsExternes() {
  return useQuery<{ success: boolean; data: StatsExternes }>({
    queryKey: ['agents-externes', 'stats'],
    queryFn: () => api.get('/agents-externes/stats').then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useExportAgentsExternes() {
  return useMutation({
    mutationFn: (params: { typeAgent?: TypeAgent; regionId?: string; paysId?: string }) =>
      api.get('/agents-externes/export', { params }).then((r) => r.data),
  });
}

export function useCreateAgentExterne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AgentExterne>) =>
      api.post('/agents-externes', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents-externes'] });
    },
  });
}

export function useUpdateAgentExterne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<AgentExterne> & { id: string }) =>
      api.put(`/agents-externes/${id}`, data).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['agents-externes', vars.id] });
      qc.invalidateQueries({ queryKey: ['agents-externes'] });
    },
  });
}

export function useDeleteAgentExterne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agents-externes/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents-externes'] }),
  });
}

export interface StatsPays {
  total: number; diplomates: number; horsCadres: number;
  hommes: number; femmes: number;
  enCours: number; courtTerme: number; finTerme: number;
  provinces: Record<string, number>;
  ageGroups: Record<string, number>;
  agents: { id: string; nom: string; prenom: string; matricule: string; typeAgent: string; grade: string; sexe?: string | null; status: string; statut: string | null }[];
}

export function useStatsPays(paysId: string | null) {
  return useQuery<{ success: boolean; data: StatsPays }>({
    queryKey: ['agents-externes', 'stats-pays', paysId],
    queryFn: () => api.get(`/agents-externes/pays/${paysId}/stats`).then((r) => r.data),
    enabled: !!paysId,
    staleTime: 30_000,
  });
}

export function useRappelerAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/agents-externes/${id}/rappeler`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents-externes'] });
    },
  });
}

export function useUploadAgentExternePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append('photo', compressed);
      return api.post(`/agents-externes/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['agents-externes', vars.id] });
      qc.invalidateQueries({ queryKey: ['agents-externes'] });
    },
  });
}
