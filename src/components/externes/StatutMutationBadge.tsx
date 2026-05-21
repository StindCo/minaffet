import type { StatutMutation } from '../../types';
import { cn } from '../../lib/utils';

const CONFIG: Record<StatutMutation, { label: string; cls: string }> = {
  EN_COURS:    { label: 'En cours',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COURT_TERME: { label: 'Court terme',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  FIN_TERME:   { label: 'Fin de terme',  cls: 'bg-red-50 text-red-700 border-red-200' },
  TERMINEE:    { label: 'Terminée',      cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

interface Props {
  statut: StatutMutation;
  size?: 'sm' | 'md';
}

export function StatutMutationBadge({ statut, size = 'md' }: Props) {
  const { label, cls } = CONFIG[statut];
  return (
    <span className={cn(
      'inline-flex items-center font-semibold border rounded-full',
      size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
      cls
    )}>
      {label}
    </span>
  );
}
