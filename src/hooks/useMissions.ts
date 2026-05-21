import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Mission, MissionStatus, PaginatedResponse, MissionRole } from '../types';

interface MissionFilters {
  search?: string;
  status?: MissionStatus;
  type?: string;
  pays?: string;
  directionId?: string;
  page?: number;
  limit?: number;
}

interface MissionsResponse extends PaginatedResponse<Mission> {
  stats: Record<MissionStatus, number>;
}

export function useMissions(filters: MissionFilters = {}) {
  return useQuery<MissionsResponse>({
    queryKey: ['missions', filters],
    queryFn: () => api.get('/missions', { params: filters }).then((r) => r.data),
  });
}

export function useMission(id: string) {
  return useQuery<{ success: boolean; data: Mission }>({
    queryKey: ['missions', id],
    queryFn: () => api.get(`/missions/${id}`).then((r) => r.data),
    enabled: !!id && id !== 'new',
  });
}

export function useMissionsCalendar(from: string, to: string, filters?: { pays?: string }) {
  return useQuery({
    queryKey: ['missions', 'calendar', from, to, filters],
    queryFn: () => api.get('/missions/calendar', { params: { from, to, ...filters } }).then((r) => r.data),
    enabled: !!from && !!to,
  });
}

export function useGenerateReference() {
  return useQuery<{ success: boolean; data: { reference: string } }>({
    queryKey: ['missions', 'generate-ref'],
    queryFn: () => api.get('/missions/generate-ref').then((r) => r.data),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Mission>) => api.post('/missions', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions'] }),
  });
}

export function useUpdateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Mission> & { id: string }) =>
      api.put(`/missions/${id}`, data).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['missions', vars.id] });
      qc.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}

export function useUpdateMissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MissionStatus }) =>
      api.patch(`/missions/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeleteMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/missions/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions'] }),
  });
}

export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, agentId, role, notes }: { missionId: string; agentId: string; role: MissionRole; notes?: string }) =>
      api.post(`/missions/${missionId}/participants`, { agentId, role, notes }).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['missions', vars.missionId] });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useRemoveParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, agentId }: { missionId: string; agentId: string }) =>
      api.delete(`/missions/${missionId}/participants/${agentId}`).then((r) => r.data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['missions', vars.missionId] }),
  });
}
