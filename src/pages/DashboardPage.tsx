import {
  Users, Briefcase, FileCheck, TrendingUp,
  Plane, MapPin, FileText, BarChart3,
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboard';
import { KpiCard } from '../components/dashboard/KpiCard';
import { MissionTypeChart } from '../components/dashboard/MissionTypeChart';
import { WorldHotspots } from '../components/dashboard/WorldHotspots';

export function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 w-72 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 h-20" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.data;
  if (!stats) return null;
  const { kpis, repartitionTypes, carteDonnees } = stats;

  return (
    <div className="space-y-5">

      {/* ── En-tête section ─────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4">
        <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-3">
          Informations générales
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Total agents"
            value={kpis.totalAgents}
            icon={Users}
            iconBg="bg-rdc-blue/10"
            iconColor="text-rdc-blue"
          />
          <KpiCard
            label="En mission"
            value={kpis.agentsEnMission}
            icon={Plane}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <KpiCard
            label="Missions en cours"
            value={kpis.missionsEnCours}
            icon={Briefcase}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <KpiCard
            label="Taux de rapportage"
            value={`${kpis.tauxRapportage}%`}
            icon={FileCheck}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>
      </div>

      {/* ── Ligne 2 KPIs ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Missions planifiées"
          value={kpis.missionsPlanifiees}
          icon={TrendingUp}
          iconBg="bg-rdc-yellow/20"
          iconColor="text-amber-600"
        />
        <KpiCard
          label="Missions terminées"
          value={kpis.missionsTerminees}
          icon={FileCheck}
          iconBg="bg-slate-100"
          iconColor="text-slate-500"
        />
        <KpiCard
          label="Documents déposés"
          value={kpis.totalDocuments}
          icon={FileText}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
        <KpiCard
          label="Pays couverts"
          value={carteDonnees.length}
          icon={MapPin}
          iconBg="bg-rdc-red/10"
          iconColor="text-rdc-red"
        />
      </div>

      {/* ── Graphiques ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Semi-donut types de mission */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
            <BarChart3 size={14} className="text-rdc-blue" />
            <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
              Résumé des missions
            </h3>
          </div>
          <div className="px-4 pb-4 pt-2">
            {repartitionTypes.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <MissionTypeChart data={repartitionTypes} />
            )}
          </div>
        </div>

        {/* Points chauds */}
        <WorldHotspots data={carteDonnees} />
      </div>

    </div>
  );
}
