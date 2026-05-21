import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export function KpiCard({ label, value, icon: Icon, iconBg = 'bg-slate-100', iconColor = 'text-slate-500', className }: KpiCardProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow', className)}>
      <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}
