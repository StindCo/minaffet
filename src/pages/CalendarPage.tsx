import { MissionCalendar } from '../components/calendar/MissionCalendar';

export function CalendarPage() {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Calendrier des missions</h2>
        <p className="text-sm text-slate-500 mt-1">
          Vue globale planning de toutes les missions diplomatiques.
        </p>
      </div>
      <MissionCalendar />
    </div>
  );
}
