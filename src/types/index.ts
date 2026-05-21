export type AgentStatus = 'EN_POSTE' | 'EN_MISSION' | 'EN_RAPPEL' | 'EN_CONGE' | 'SUSPENDU';

export type AgentGrade =
  | 'AMBASSADEUR'
  | 'MINISTRE_CONSEILLER'
  | 'CONSEILLER'
  | 'PREMIER_SECRETAIRE'
  | 'DEUXIEME_SECRETAIRE'
  | 'TROISIEME_SECRETAIRE'
  | 'ATTACHE'
  | 'CONSUL_GENERAL'
  | 'CONSUL'
  | 'VICE_CONSUL';

export type MissionType =
  | 'DIPLOMATIQUE'
  | 'ECONOMIQUE'
  | 'CONSULAIRE'
  | 'SECURITAIRE'
  | 'CULTURELLE'
  | 'HUMANITAIRE'
  | 'MULTILATERALE';

export type MissionStatus = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'SUSPENDUE';

export type MissionRole =
  | 'CHEF_DE_MISSION'
  | 'CHEF_DE_DELEGATION'
  | 'EXPERT'
  | 'RAPPORTEUR'
  | 'ATTACHE_DE_PRESSE'
  | 'PROTOCOLE'
  | 'CONSEILLER_TECHNIQUE'
  | 'OBSERVATEUR'
  | 'MEMBRE';

export type DocumentType =
  | 'ORDRE_DE_MISSION'
  | 'RAPPORT_DE_MISSION'
  | 'COMPTE_RENDU'
  | 'NOTE_VERBALE'
  | 'ACCORD'
  | 'AUTRE';

export interface Direction {
  id: string;
  code: string;
  nom: string;
  description?: string | null;
  _count?: { agents: number; missions: number };
}

export interface Agent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  grade: AgentGrade;
  sexe?: string;
  fonction?: string;
  specialite?: string;
  acteDeNomination?: string;
  dateNaissance?: string;
  provinceOrigine?: string;
  etudesFaites?: string;
  telephone?: string;
  email?: string;
  photoUrl?: string;
  status: AgentStatus;
  dateEntree?: string;
  biographie?: string;
  directionId?: string;
  direction?: Direction;
  postesAffecter?: PosteAffectation[];
  participations?: MissionParticipant[];
  _count?: { participations: number };
}

export interface PosteAffectation {
  id: string;
  agentId: string;
  ville: string;
  pays: string;
  codeIso?: string;
  intitule: string;
  dateDebut: string;
  dateFin?: string;
  estActuel: boolean;
}

export interface Mission {
  id: string;
  reference: string;
  objet: string;
  description?: string;
  type: MissionType;
  status: MissionStatus;
  ville: string;
  pays: string;
  codeIso?: string;
  latitude?: number;
  longitude?: number;
  dateDebut: string;
  dateFin: string;
  dureeJours?: number;
  directionId?: string;
  direction?: Direction;
  participants?: MissionParticipant[];
  documents?: MissionDocument[];
  _count?: { participants: number; documents: number };
}

export interface MissionParticipant {
  id: string;
  missionId: string;
  agentId: string;
  role: MissionRole;
  notes?: string;
  confirme: boolean;
  dateRetourEffectif?: string;
  agent?: Pick<Agent, 'id' | 'nom' | 'prenom' | 'grade' | 'photoUrl' | 'matricule' | 'specialite'>;
  mission?: Pick<Mission, 'id' | 'objet' | 'ville' | 'pays' | 'dateFin' | 'type'>;
}

export interface MissionDocument {
  id: string;
  missionId: string;
  type: DocumentType;
  titre: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  deposePar?: string;
  createdAt: string;
}

export interface AgentTrackResult {
  agent: Pick<Agent, 'id' | 'nom' | 'prenom' | 'matricule' | 'grade' | 'status'>;
  localisation:
    | { enMission: true; mission: Pick<Mission, 'id' | 'objet' | 'ville' | 'pays' | 'dateFin' | 'type'>; role: MissionRole; chefDeMission: Pick<Agent, 'nom' | 'prenom' | 'grade'> | null }
    | { enMission: false };
}

export interface DashboardStats {
  kpis: {
    totalAgents: number;
    agentsEnMission: number;
    agentsEnPoste: number;
    totalMissions: number;
    missionsEnCours: number;
    missionsPlanifiees: number;
    missionsTerminees: number;
    tauxRapportage: number;
    totalDocuments: number;
  };
  repartitionTypes: { type: MissionType; count: number }[];
  carteDonnees: {
    pays: string;
    ville: string;
    codeIso?: string;
    latitude?: number;
    longitude?: number;
    nombreAgents: number;
    nombreMissions: number;
    missions: string[];
  }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================
// MODULE AGENTS EXTÉRIEURS
// ============================================================

export type TypeAgent = 'DIPLOMATE' | 'HORS_CADRE';

export type StatutMutation = 'EN_COURS' | 'COURT_TERME' | 'FIN_TERME' | 'TERMINEE';

export type ProvinceRDC =
  | 'BAS_UELE' | 'EQUATEUR' | 'HAUT_KATANGA' | 'HAUT_LOMAMI' | 'HAUT_UELE'
  | 'ITURI' | 'KASAI' | 'KASAI_CENTRAL' | 'KASAI_ORIENTAL' | 'KINSHASA'
  | 'KONGO_CENTRAL' | 'KWANGO' | 'KWILU' | 'LOMAMI' | 'LUALABA'
  | 'MAI_NDOMBE' | 'MANIEMA' | 'MONGALA' | 'NORD_KIVU' | 'NORD_UBANGI'
  | 'SANKURU' | 'SUD_KIVU' | 'SUD_UBANGI' | 'TANGANYIKA' | 'TSHOPO' | 'TSHUAPA';

export interface Region {
  id: string;
  nom: string;
  code: string;
  description?: string | null;
  pays?: Pays[];
  _count?: { pays: number };
}

export interface Pays {
  id: string;
  nom: string;
  codeIso: string;
  codeIso2?: string | null;
  regionId: string;
  region?: Region;
  postesDiplomatiques?: PosteDiplomatique[];
  _count?: { agentsActuels: number; postesDiplomatiques: number };
}

export interface PosteDiplomatique {
  id: string;
  nom: string;
  type: string;
  ville: string;
  paysId: string;
  pays?: Pays;
  _count?: { mutations: number };
}

export interface AgentExterne {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  typeAgent: TypeAgent;
  grade: AgentGrade;
  sexe?: string | null;
  fonction?: string | null;
  acteDeNomination?: string | null;
  dateNaissance?: string | null;
  provinceOrigine?: ProvinceRDC | null;
  telephone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  status: AgentStatus;
  biographie?: string | null;
  paysActuelId?: string | null;
  paysActuel?: Pays | null;
  mutations?: Mutation[];
  createdAt: string;
  updatedAt: string;
}

export interface Mutation {
  id: string;
  agentId: string;
  posteDiplomatiqueId?: string | null;
  paysId?: string | null;
  dateDebut: string;
  dateFin: string;
  statut: StatutMutation;
  validee: boolean;
  valideeParId?: string | null;
  notes?: string | null;
  posteDiplomatique?: PosteDiplomatique | null;
  pays?: Pays | null;
  valideePar?: { id: string; nom: string; prenom: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatsExternes {
  total: number;
  diplomates: number;
  horsCadres: number;
  finTerme: number;
  courtTerme: number;
  parRegion: { id: string; nom: string; code: string; totalAgents: number; totalPays: number }[];
}

// Labels affichage
export const PROVINCE_LABELS: Record<ProvinceRDC, string> = {
  BAS_UELE:       'Bas-Uélé',
  EQUATEUR:       'Équateur',
  HAUT_KATANGA:   'Haut-Katanga',
  HAUT_LOMAMI:    'Haut-Lomami',
  HAUT_UELE:      'Haut-Uélé',
  ITURI:          'Ituri',
  KASAI:          'Kasaï',
  KASAI_CENTRAL:  'Kasaï Central',
  KASAI_ORIENTAL: 'Kasaï Oriental',
  KINSHASA:       'Kinshasa',
  KONGO_CENTRAL:  'Kongo Central',
  KWANGO:         'Kwango',
  KWILU:          'Kwilu',
  LOMAMI:         'Lomami',
  LUALABA:        'Lualaba',
  MAI_NDOMBE:     'Maï-Ndombe',
  MANIEMA:        'Maniema',
  MONGALA:        'Mongala',
  NORD_KIVU:      'Nord-Kivu',
  NORD_UBANGI:    'Nord-Ubangi',
  SANKURU:        'Sankuru',
  SUD_KIVU:       'Sud-Kivu',
  SUD_UBANGI:     'Sud-Ubangi',
  TANGANYIKA:     'Tanganyika',
  TSHOPO:         'Tshopo',
  TSHUAPA:        'Tshuapa',
};

export const STATUT_MUTATION_LABELS: Record<StatutMutation, string> = {
  EN_COURS:    'En cours',
  COURT_TERME: 'Court terme',
  FIN_TERME:   'Fin de terme',
  TERMINEE:    'Terminée',
};

export const TYPE_AGENT_LABELS: Record<TypeAgent, string> = {
  DIPLOMATE:  'Diplomate',
  HORS_CADRE: 'Hors cadre',
};
