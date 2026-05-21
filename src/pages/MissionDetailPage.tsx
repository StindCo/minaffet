import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MissionView } from '../components/missions/MissionView';

export function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <div className="text-red-400">ID de mission manquant.</div>;

  return (
    <div>
      <Link
        to="/missions"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
      >
        <ChevronLeft size={16} />
        Retour aux missions
      </Link>
      <MissionView missionId={id} />
    </div>
  );
}
