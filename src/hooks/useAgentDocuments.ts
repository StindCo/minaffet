import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// URL racine pour les fichiers statiques (sans /api)
const STATIC_ROOT = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/api$/, '');

export interface AgentDocument {
  id: string;
  agentId: string;
  type: 'ORDRE_MUTATION' | 'PASSEPORT' | 'ACTE_NOMINATION' | 'RAPPORT' | 'AUTRE';
  nom: string;
  fileUrl: string;
  taille?: number;
  uploadedBy?: { nom: string; prenom: string } | null;
  createdAt: string;
}

export const TYPE_DOC_LABELS: Record<AgentDocument['type'], string> = {
  ORDRE_MUTATION: 'Ordre de mutation',
  PASSEPORT: 'Passeport diplomatique',
  ACTE_NOMINATION: 'Acte de nomination',
  RAPPORT: 'Rapport',
  AUTRE: 'Autre document',
};

export const TYPE_DOC_ICONS: Record<AgentDocument['type'], string> = {
  ORDRE_MUTATION: '📋',
  PASSEPORT: '🛂',
  ACTE_NOMINATION: '📜',
  RAPPORT: '📄',
  AUTRE: '📎',
};

export function getDocUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${STATIC_ROOT}${fileUrl}`;
}

// ── Liste documents ───────────────────────────────────────
export function useAgentDocuments(agentId: string) {
  return useQuery({
    queryKey: ['agent-documents', agentId],
    queryFn: async () => {
      const { data } = await api.get(`/agents-externes/${agentId}/documents`);
      return data as { success: boolean; data: AgentDocument[] };
    },
    enabled: !!agentId,
  });
}

// ── Upload document ───────────────────────────────────────
export function useUploadDocument(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { fichier: File; nom: string; type: AgentDocument['type'] }) => {
      const fd = new FormData();
      fd.append('fichier', payload.fichier);
      fd.append('nom', payload.nom);
      fd.append('type', payload.type);
      const { data } = await api.post(`/agents-externes/${agentId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-documents', agentId] }),
  });
}

// ── Suppression document ──────────────────────────────────
export function useDeleteDocument(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      const { data } = await api.delete(`/agents-externes/documents/${docId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-documents', agentId] }),
  });
}

// Taille lisible
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
