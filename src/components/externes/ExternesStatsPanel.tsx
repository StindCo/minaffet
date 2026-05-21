import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { AgentExterne } from '../../types';
import { PROVINCE_LABELS } from '../../types';
import { AGENT_GRADE_LABELS } from '../../lib/utils';

const COLORS_PIE = ['#007FFF', '#E60026', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'];
const PROVINCE_SHORT: Record<string, string> = {
  KINSHASA: 'KIN',  BAS_CONGO: 'B-Cgo', KWILU: 'Kwil', MAI_NDOMBE: 'M-Ndo',
  KASAI: 'Kas', KASAI_CENTRAL: 'Kas-C', KASAI_ORIENTAL: 'Kas-O', LOMAMI: 'Lom',
  SANKURU: 'San', MANIEMA: 'Man', SUD_KIVU: 'S-Kivu', NORTH_KIVU: 'N-Kivu',
  ITURI: 'Ituri', HAUT_UELE: 'H-Uelé', TSHOPO: 'Tsho', BAS_UELE: 'B-Uelé',
  NORD_UBANGI: 'N-Uba', SUD_UBANGI: 'S-Uba', MONGALA: 'Mon', EQUATEUR: 'Equ',
  TSHUAPA: 'Tsh', TANGANYIKA: 'Tang', HAUT_LOMAMI: 'H-Lom', LUALABA: 'Lual',
  HAUT_KATANGA: 'H-Kat', KWANGO: 'Kwan',
};

interface Props { agents: AgentExterne[] }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">{title}</p>
      {children}
    </div>
  );
}

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export function ExternesStatsPanel({ agents }: Props) {
  // Genre
  const genderData = useMemo(() => {
    const m = agents.filter((a) => a.sexe === 'M').length;
    const f = agents.filter((a) => a.sexe === 'F').length;
    return [
      { name: 'Masculin', value: m },
      { name: 'Féminin', value: f },
    ].filter((d) => d.value > 0);
  }, [agents]);

  // Type agent
  const typeData = useMemo(() => [
    { name: 'Diplomates', value: agents.filter((a) => a.typeAgent === 'DIPLOMATE').length },
    { name: 'Hors cadres', value: agents.filter((a) => a.typeAgent === 'HORS_CADRE').length },
  ].filter((d) => d.value > 0), [agents]);

  // Provinces
  const provinceData = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of agents) {
      if (!a.provinceOrigine) continue;
      map.set(a.provinceOrigine, (map.get(a.provinceOrigine) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([prov, count]) => ({
        name: PROVINCE_SHORT[prov] ?? PROVINCE_LABELS[prov as keyof typeof PROVINCE_LABELS] ?? prov,
        value: count,
      }));
  }, [agents]);

  // Tranches d'âge
  const ageData = useMemo(() => {
    const buckets: Record<string, number> = { '<30': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
    for (const a of agents) {
      if (!a.dateNaissance) continue;
      const age = Math.floor((Date.now() - new Date(a.dateNaissance).getTime()) / (365.25 * 864e5));
      if (age < 30) buckets['<30']++;
      else if (age < 40) buckets['30-39']++;
      else if (age < 50) buckets['40-49']++;
      else if (age < 60) buckets['50-59']++;
      else buckets['60+']++;
    }
    return Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [agents]);

  // Grades
  const gradeData = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of agents) {
      map.set(a.grade, (map.get(a.grade) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([g, count]) => ({
        name: AGENT_GRADE_LABELS[g as keyof typeof AGENT_GRADE_LABELS] ?? g,
        value: count,
      }));
  }, [agents]);

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-300 text-sm gap-2">
        <span className="text-2xl">📊</span>
        <p>Aucune donnée</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-full px-1 pb-4">

      {/* Genre */}
      <Section title="Genre">
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={genderData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={48}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {genderData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#007FFF' : '#E60026'} />
              ))}
            </Pie>
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Legend
              iconType="circle"
              iconSize={7}
              formatter={(v) => <span className="text-[10px] text-slate-600">{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </Section>

      {/* Type personnel */}
      {typeData.length > 0 && (
        <Section title="Type de personnel">
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={42}
                paddingAngle={3}
                dataKey="value"
                animationBegin={100}
                animationDuration={800}
              >
                <Cell fill="#007FFF" />
                <Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                iconSize={7}
                formatter={(v) => <span className="text-[10px] text-slate-600">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* Provinces */}
      {provinceData.length > 0 && (
        <Section title="Provinces d'origine (top 8)">
          <ResponsiveContainer width="100%" height={provinceData.length * 22 + 16}>
            <BarChart
              data={provinceData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              barSize={10}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={46}
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar
                dataKey="value"
                fill="#007FFF"
                radius={[0, 4, 4, 0]}
                animationBegin={200}
                animationDuration={900}
              >
                {provinceData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${210 + i * 6}, 70%, ${50 - i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* Tranches d'âge */}
      {ageData.length > 0 && (
        <Section title="Tranches d'âge">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={ageData} barSize={18} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar
                dataKey="value"
                fill="#22c55e"
                radius={[3, 3, 0, 0]}
                animationBegin={300}
                animationDuration={900}
              >
                {ageData.map((_, i) => (
                  <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* Grades */}
      {gradeData.length > 0 && (
        <Section title="Grades (top 6)">
          <ResponsiveContainer width="100%" height={gradeData.length * 22 + 16}>
            <BarChart
              data={gradeData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              barSize={10}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={62}
                tick={{ fontSize: 8, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                animationBegin={400}
                animationDuration={900}
              >
                {gradeData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${270 + i * 15}, 60%, ${55 - i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}
    </div>
  );
}
