import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface AgentBref {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  typeAgent: 'DIPLOMATE' | 'HORS_CADRE';
  grade: string;
  sexe: string | null;
  status: string;
  statut: string | null;
}

export interface StatsPaysData {
  total: number;
  diplomates: number;
  horsCadres: number;
  hommes: number;
  femmes: number;
  enCours: number;
  courtTerme: number;
  finTerme: number;
  provinces: Record<string, number>;
  ageGroups: Record<string, number>;
  agents: AgentBref[];
}

export function useStatsPays(paysId: string | null) {
  return useQuery({
    queryKey: ['stats-pays', paysId],
    queryFn: async () => {
      const { data } = await api.get(`/agents-externes/pays/${paysId}/stats`);
      return data as { success: boolean; data: StatsPaysData };
    },
    enabled: !!paysId,
    staleTime: 30_000,
  });
}

export function useRappelerAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agentId: string) => {
      const { data } = await api.patch(`/agents-externes/${agentId}/rappeler`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents-externes'] });
      qc.invalidateQueries({ queryKey: ['stats-pays'] });
    },
  });
}
