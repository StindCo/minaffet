import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useMissionsCalendar } from '../../hooks/useMissions';
import { MISSION_TYPE_LABELS } from '../../lib/utils';
import type { MissionType, MissionStatus } from '../../types';
import { format } from 'date-fns';

const TYPE_CALENDAR_COLORS: Record<MissionType, string> = {
  DIPLOMATIQUE: '#7c3aed',
  ECONOMIQUE: '#0d9488',
  CONSULAIRE: '#0284c7',
  SECURITAIRE: '#dc2626',
  CULTURELLE: '#db2777',
  HUMANITAIRE: '#ea580c',
  MULTILATERALE: '#4f46e5',
};

const STATUS_OPACITY: Record<MissionStatus, number> = {
  PLANIFIEE: 0.6,
  EN_COURS: 1,
  TERMINEE: 0.4,
  ANNULEE: 0.2,
  SUSPENDUE: 0.3,
};

interface CalendarMission {
  id: string;
  reference: string;
  objet: string;
  type: MissionType;
  status: MissionStatus;
  ville: string;
  pays: string;
  dateDebut: string;
  dateFin: string;
  _count: { participants: number };
}

export function MissionCalendar() {
  const [currentRange, setCurrentRange] = useState({
    from: format(new Date(), 'yyyy-MM-01'),
    to: format(new Date(new Date().setMonth(new Date().getMonth() + 2)), 'yyyy-MM-dd'),
  });
  const [filterType, setFilterType] = useState<MissionType | ''>('');
  const [filterPays, setFilterPays] = useState('');

  const { data } = useMissionsCalendar(currentRange.from, currentRange.to, {
    pays: filterPays || undefined,
  });

  const missions: CalendarMission[] = data?.data ?? [];

  const events = missions
    .filter((m) => !filterType || m.type === filterType)
    .map((m) => ({
      id: m.id,
      title: `${m.objet} — ${m.ville}`,
      start: m.dateDebut,
      end: m.dateFin,
      backgroundColor: TYPE_CALENDAR_COLORS[m.type],
      borderColor: TYPE_CALENDAR_COLORS[m.type],
      opacity: STATUS_OPACITY[m.status],
      extendedProps: m,
    }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Filtres */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as MissionType | '')}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les types</option>
          {(Object.keys(MISSION_TYPE_LABELS) as MissionType[]).map((t) => (
            <option key={t} value={t}>{MISSION_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <input
          type="text"
          value={filterPays}
          onChange={(e) => setFilterPays(e.target.value)}
          placeholder="Filtrer par pays..."
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
        />

        {/* Légende */}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {(Object.entries(TYPE_CALENDAR_COLORS) as [MissionType, string][]).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-500">{MISSION_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendrier FullCalendar */}
      <div className="p-4 calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={frLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek',
          }}
          events={events}
          height="auto"
          datesSet={(info) => {
            setCurrentRange({
              from: format(info.start, 'yyyy-MM-dd'),
              to: format(info.end, 'yyyy-MM-dd'),
            });
          }}
          eventContent={(info) => {
            const m: CalendarMission = info.event.extendedProps as CalendarMission;
            return (
              <div className="px-1.5 py-0.5 truncate text-xs font-medium text-white">
                <span className="mr-1">📍</span>
                {m.ville} · {m.objet}
                <span className="ml-1 opacity-70">({m._count.participants})</span>
              </div>
            );
          }}
          eventClick={(info) => {
            const m: CalendarMission = info.event.extendedProps as CalendarMission;
            window.location.href = `/missions/${m.id}`;
          }}
        />
      </div>
    </div>
  );
}
