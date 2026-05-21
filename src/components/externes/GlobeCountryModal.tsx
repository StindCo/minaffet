import { useNavigate } from 'react-router-dom';
import { X, Users, Globe2, AlertTriangle, Clock, CheckCircle2, ArrowRightCircle, MapPin } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { useStatsPays, useRappelerAgent } from '../../hooks/useGlobeStats';
import { PROVINCE_LABELS } from '../../types';
import { AGENT_GRADE_LABELS, cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const TOOLTIP_STYLE = {
  backgroundColor: 'white', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

function countryFlag(codeIso2?: string | null): string {
  if (!codeIso2 || codeIso2.length !== 2) return '🌐';
  const pts = [...codeIso2.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...pts);
}

function StatutBadge({ statut }: { statut: string | null }) {
  if (!statut) return <span className="text-slate-300 text-xs">—</span>;
  const map: Record<string, string> = {
    EN_COURS: 'bg-emerald-100 text-emerald-700',
    COURT_TERME: 'bg-amber-100 text-amber-700',
    FIN_TERME: 'bg-red-100 text-red-700',
    TERMINEE: 'bg-slate-100 text-slate-500',
  };
  const labels: Record<string, string> = {
    EN_COURS: 'En cours', COURT_TERME: 'Court terme',
    FIN_TERME: 'Fin terme', TERMINEE: 'Terminée',
  };
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', map[statut] ?? 'bg-slate-100 text-slate-500')}>
      {labels[statut] ?? statut}
    </span>
  );
}

interface Props {
  paysId: string;
  paysNom: string;
  codeIso2?: string | null;
  regionNom?: string;
  onClose: () => void;
}

export function GlobeCountryModal({ paysId, paysNom, codeIso2, regionNom, onClose }: Props) {
  const navigate = useNavigate();
  const { canWrite } = useAuthStore();
  const { data, isLoading, refetch } = useStatsPays(paysId);
  const stats = data?.data;
  const rappelerMutation = useRappelerAgent();

  async function handleRappeler(agentId: string, nom: string, prenom: string) {
    if (!window.confirm(`Rappeler ${prenom} ${nom} à Kinshasa ?\nSon statut passera à "En rappel" et sa mutation sera clôturée.`)) return;
    try {
      await rappelerMutation.mutateAsync(agentId);
      refetch();
    } catch {
      alert('Erreur lors du rappel');
    }
  }

  const genderData = stats ? [
    { name: 'Hommes', value: stats.hommes },
    { name: 'Femmes', value: stats.femmes },
  ].filter((d) => d.value > 0) : [];

  const typeData = stats ? [
    { name: 'Diplomates', value: stats.diplomates },
    { name: 'Hors cadres', value: stats.horsCadres },
  ].filter((d) => d.value > 0) : [];

  const provinceData = stats
    ? Object.entries(stats.provinces)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([p, v]) => ({
          name: PROVINCE_LABELS[p as keyof typeof PROVINCE_LABELS]?.slice(0, 10) ?? p.slice(0, 10),
          value: v,
        }))
    : [];

  const ageData = stats
    ? Object.entries(stats.ageGroups)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-rdc-navy to-rdc-blue-dark px-6 py-5 shrink-0">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'white\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}
          />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl drop-shadow-lg">{countryFlag(codeIso2)}</span>
              <div>
                <h2 className="text-white font-extrabold text-xl leading-tight">{paysNom}</h2>
                {regionNom && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-white/40" />
                    <p className="text-white/50 text-xs">{regionNom}</p>
                  </div>
                )}
                {/* KPI rapide */}
                {stats && (
                  <div className="flex items-center gap-3 mt-3">
                    <KpiChip icon={<Users size={11} />} label="Personnel" value={stats.total} color="bg-white/20 text-white" />
                    <KpiChip icon={<Globe2 size={11} />} label="Diplo." value={stats.diplomates} color="bg-rdc-blue/40 text-white" />
                    {stats.courtTerme > 0 && (
                      <KpiChip icon={<Clock size={11} />} label="Court terme" value={stats.courtTerme} color="bg-amber-500/40 text-amber-200" />
                    )}
                    {stats.finTerme > 0 && (
                      <KpiChip icon={<AlertTriangle size={11} />} label="Fin terme" value={stats.finTerme} color="bg-red-500/40 text-red-200" />
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Corps ──────────────────────────────────── */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <div className="animate-spin w-6 h-6 border-2 border-rdc-blue border-t-transparent rounded-full mr-3" />
              Chargement des statistiques…
            </div>
          ) : !stats || stats.total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Globe2 size={48} className="mb-3 opacity-20" />
              <p className="font-semibold text-slate-400">Aucun personnel en poste</p>
              <p className="text-sm mt-1">Ce pays n'a pas de personnel extérieur actuellement.</p>
            </div>
          ) : (
            <div className="p-5 space-y-6">

              {/* ── Graphes ─────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">

                {/* Genre */}
                {genderData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Genre</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={genderData} cx="50%" cy="50%" innerRadius={28} outerRadius={48}
                          paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={700}>
                          <Cell fill="#007FFF" />
                          <Cell fill="#E60026" />
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-1">
                      {genderData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: i === 0 ? '#007FFF' : '#E60026' }} />
                          <span className="text-[11px] text-slate-500">{d.name} ({d.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type agent */}
                {typeData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Type de personnel</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={typeData} cx="50%" cy="50%" innerRadius={28} outerRadius={48}
                          paddingAngle={3} dataKey="value" animationBegin={100} animationDuration={700}>
                          <Cell fill="#007FFF" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-1">
                      {typeData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: i === 0 ? '#007FFF' : '#8b5cf6' }} />
                          <span className="text-[11px] text-slate-500">{d.name} ({d.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Provinces */}
                {provinceData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Provinces d'origine</p>
                    <ResponsiveContainer width="100%" height={provinceData.length * 22 + 8}>
                      <BarChart data={provinceData} layout="vertical" barSize={8}
                        margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="value" fill="#007FFF" radius={[0, 4, 4, 0]} animationBegin={200} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Tranches d'âge */}
                {ageData.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Tranches d'âge</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={ageData} barSize={16} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="value" fill="#22c55e" radius={[3, 3, 0, 0]} animationBegin={300} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* ── Statuts mutations résumé ─────────── */}
              <div className="grid grid-cols-3 gap-3">
                <StatusCard icon={<CheckCircle2 size={16} className="text-emerald-600" />}
                  label="En cours" value={stats.enCours} color="bg-emerald-50 border-emerald-200" />
                <StatusCard icon={<Clock size={16} className="text-amber-600" />}
                  label="Court terme" value={stats.courtTerme} color="bg-amber-50 border-amber-200" />
                <StatusCard icon={<AlertTriangle size={16} className="text-red-600" />}
                  label="Fin de terme" value={stats.finTerme} color="bg-red-50 border-red-200" />
              </div>

              {/* ── Liste agents ─────────────────────── */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Personnel en poste ({stats.agents.length})
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {stats.agents.map((agent) => (
                    <div key={agent.id}
                      className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl px-4 py-3">
                      {/* Initiales */}
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0',
                        agent.typeAgent === 'DIPLOMATE' ? 'bg-rdc-blue' : 'bg-violet-500'
                      )}>
                        {agent.prenom[0]}{agent.nom[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {agent.prenom} {agent.nom}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {AGENT_GRADE_LABELS[agent.grade as keyof typeof AGENT_GRADE_LABELS] ?? agent.grade}
                          {agent.matricule && <span className="ml-2 opacity-60">· {agent.matricule}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatutBadge statut={agent.statut} />

                        {/* Voir fiche */}
                        <button
                          onClick={() => { navigate(`/externes/agents/${agent.id}`); onClose(); }}
                          title="Voir la fiche"
                          className="p-1.5 text-slate-400 hover:text-rdc-blue hover:bg-rdc-blue/10 rounded-lg transition-colors"
                        >
                          <ArrowRightCircle size={15} />
                        </button>

                        {/* Rappeler à Kinshasa */}
                        {canWrite() && agent.status !== 'EN_RAPPEL' && (
                          <button
                            onClick={() => handleRappeler(agent.id, agent.nom, agent.prenom)}
                            disabled={rappelerMutation.isPending}
                            title="Rappeler à Kinshasa"
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-rdc-red/10 text-rdc-red border border-rdc-red/20 rounded-lg hover:bg-rdc-red/20 transition-colors disabled:opacity-50"
                          >
                            🇨🇩 Rappel KIN
                          </button>
                        )}

                        {agent.status === 'EN_RAPPEL' && (
                          <span className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-lg">
                            Rappelé
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            Données en temps réel · MINAFFET 🇨🇩
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg', color)}>
      {icon}
      <span className="font-bold">{value}</span>
      <span className="opacity-70 text-[10px]">{label}</span>
    </div>
  );
}

function StatusCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl border', color)}>
      {icon}
      <div>
        <p className="font-bold text-slate-700">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
