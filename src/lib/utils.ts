import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AgentStatus, MissionStatus, MissionType, MissionRole, AgentGrade, DocumentType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ?? 'http://localhost:3001';

/** Transforme un chemin relatif `/uploads/photos/...` en URL absolue. */
export function getPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('blob:')) return photoUrl;
  return `${API_ORIGIN}${photoUrl}`;
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: fr });
}

export function formatDateRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { locale: fr, addSuffix: true });
}

export function isMissionActive(dateDebut: string, dateFin: string): boolean {
  const now = new Date();
  return isAfter(now, parseISO(dateDebut)) && isBefore(now, parseISO(dateFin));
}

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  EN_POSTE: 'En poste',
  EN_MISSION: 'En mission',
  EN_RAPPEL: 'En rappel',
  EN_CONGE: 'En congé',
  SUSPENDU: 'Suspendu',
};

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  EN_POSTE:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  EN_MISSION: 'bg-rdc-blue/10 text-rdc-blue border-rdc-blue/25',
  EN_RAPPEL:  'bg-rdc-yellow/20 text-amber-700 border-rdc-yellow/40',
  EN_CONGE:   'bg-slate-100 text-slate-500 border-slate-200',
  SUSPENDU:   'bg-rdc-red/10 text-rdc-red border-rdc-red/20',
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
  SUSPENDUE: 'Suspendue',
};

/** Texte pour filtres / aide : quand le statut s’applique */
export const MISSION_STATUS_HELP: Record<MissionStatus, string> = {
  PLANIFIEE: 'Avant le jour de début, ou en attente de démarrage',
  EN_COURS: 'Pendant la période (du jour de début au jour de fin inclus)',
  TERMINEE: 'Après la date de fin, ou clôturée manuellement',
  ANNULEE: 'Mission annulée',
  SUSPENDUE: 'Mission mise en pause',
};

export const MISSION_STATUS_COLORS: Record<MissionStatus, string> = {
  PLANIFIEE: 'bg-rdc-yellow/20 text-amber-700 border-rdc-yellow/40',
  EN_COURS:  'bg-rdc-blue/10 text-rdc-blue border-rdc-blue/25',
  TERMINEE:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  ANNULEE:   'bg-rdc-red/10 text-rdc-red border-rdc-red/20',
  SUSPENDUE: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  DIPLOMATIQUE: 'Diplomatique',
  ECONOMIQUE: 'Économique',
  CONSULAIRE: 'Consulaire',
  SECURITAIRE: 'Sécuritaire',
  CULTURELLE: 'Culturelle',
  HUMANITAIRE: 'Humanitaire',
  MULTILATERALE: 'Multilatérale',
};

/** Sous-titre pour filtres type */
export const MISSION_TYPE_HELP: Record<MissionType, string> = {
  DIPLOMATIQUE: 'Sommets, négociations, représentation politique',
  ECONOMIQUE: 'Commerce, investissements, coopération économique',
  CONSULAIRE: 'Services aux nationaux, visas, état civil',
  SECURITAIRE: 'Coopération sécuritaire, crises',
  CULTURELLE: 'Échanges culturels, francophonie',
  HUMANITAIRE: 'Aide humanitaire, urgences',
  MULTILATERALE: 'ONU, UA, organisations régionales',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ORDRE_DE_MISSION: 'Ordre de mission',
  RAPPORT_DE_MISSION: 'Rapport de mission',
  COMPTE_RENDU: 'Compte-rendu',
  NOTE_VERBALE: 'Note verbale',
  ACCORD: 'Accord / protocole',
  AUTRE: 'Autre',
};

export const MISSION_TYPE_COLORS: Record<MissionType, string> = {
  DIPLOMATIQUE:  'bg-rdc-blue/10 text-rdc-blue border-rdc-blue/20',
  ECONOMIQUE:    'bg-teal-50 text-teal-700 border-teal-200',
  CONSULAIRE:    'bg-sky-50 text-sky-700 border-sky-200',
  SECURITAIRE:   'bg-rdc-red/10 text-rdc-red border-rdc-red/20',
  CULTURELLE:    'bg-pink-50 text-pink-700 border-pink-200',
  HUMANITAIRE:   'bg-orange-50 text-orange-700 border-orange-200',
  MULTILATERALE: 'bg-violet-50 text-violet-700 border-violet-200',
};

export const MISSION_ROLE_LABELS: Record<any, string> = {
  CHEF_DE_MISSION: 'Chef de Mission',
  CHEF_DE_DELEGATION: 'Chef de Délégation',
  EXPERT: 'Expert',
  RAPPORTEUR: 'Rapporteur',
  ATTACHE_DE_PRESSE: 'Attaché de Presse',
  PROTOCOLE: 'Protocole',
  CONSEILLER_TECHNIQUE: 'Conseiller Technique',
  OBSERVATEUR: 'Observateur',
  MEMBRE: 'Membre',
};

export const AGENT_GRADE_LABELS: Record<AgentGrade, string> = {
  AMBASSADEUR: 'Ambassadeur',
  MINISTRE_CONSEILLER: 'Ministre Conseiller',
  CONSEILLER: 'Conseiller',
  PREMIER_SECRETAIRE: '1er Secrétaire',
  DEUXIEME_SECRETAIRE: '2ème Secrétaire',
  TROISIEME_SECRETAIRE: '3ème Secrétaire',
  ATTACHE: 'Attaché',
  CONSUL_GENERAL: 'Consul Général',
  CONSUL: 'Consul',
  VICE_CONSUL: 'Vice-Consul',
};

export function isChefDeMission(role: MissionRole): boolean {
  return role === 'CHEF_DE_MISSION' || role === 'CHEF_DE_DELEGATION';
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
