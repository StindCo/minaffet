import { MapPin, Users } from 'lucide-react';

interface HotspotData {
  pays: string;
  ville: string;
  codeIso?: string;
  nombreAgents: number;
  nombreMissions: number;
  missions: string[];
}

function getFlagEmoji(codeIso: string): string {
  return [...codeIso.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}

export function WorldHotspots({ data }: { data: HotspotData[] }) {
  const sorted = [...data].sort((a, b) => b.nombreAgents - a.nombreAgents);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-rdc-red" />
          <h3 className="text-sm font-semibold text-slate-800">Points chauds</h3>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {data.length} pays
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <MapPin size={18} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">Aucun agent en mission actuellement</p>
          </div>
        ) : (
          sorted.map((spot, i) => (
            <div key={spot.pays} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
              {/* Rang */}
              <span className="text-xs font-bold text-slate-300 w-4 shrink-0">{i + 1}</span>

              {/* Drapeau */}
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shrink-0">
                {spot.codeIso ? getFlagEmoji(spot.codeIso) : '🌍'}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{spot.pays}</p>
                <p className="text-xs text-slate-400 truncate">
                  {spot.missions.slice(0, 1).join('')}
                  {spot.missions.length > 1 && ` +${spot.missions.length - 1}`}
                </p>
              </div>

              {/* Compteur agents */}
              <div className="flex items-center gap-1 shrink-0 bg-rdc-blue/10 text-rdc-blue px-2 py-0.5 rounded-full">
                <Users size={10} />
                <span className="text-xs font-bold">{spot.nombreAgents}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
