import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { MISSION_TYPE_LABELS } from '../../lib/utils';
import type { MissionType } from '../../types';

// Couleurs inspirées du drapeau RDC + complémentaires
const COLORS: Record<MissionType, string> = {
  DIPLOMATIQUE:  '#007FFF',
  ECONOMIQUE:    '#F7D618',
  CONSULAIRE:    '#10b981',
  SECURITAIRE:   '#CE1126',
  CULTURELLE:    '#8b5cf6',
  HUMANITAIRE:   '#f97316',
  MULTILATERALE: '#0ea5e9',
};

interface Props {
  data: { type: MissionType; count: number }[];
}

export function MissionTypeChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: MISSION_TYPE_LABELS[d.type],
    value: d.count,
    color: COLORS[d.type],
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="75%"
            startAngle={180}
            endAngle={0}
            innerRadius={65}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, n: string) => [`${v} mission${v > 1 ? 's' : ''}`, n]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Total centré dans le demi-cercle */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-3xl font-extrabold text-slate-900 leading-none">{total}</p>
        <p className="text-xs text-slate-400 mt-0.5">Missions</p>
      </div>

      {/* Légende en bas */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1 px-2">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-slate-600">{d.name}</span>
            <span className="text-[11px] font-bold text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
