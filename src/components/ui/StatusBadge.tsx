import { cn } from '../../lib/utils';
import {
  AGENT_STATUS_COLORS,
  AGENT_STATUS_LABELS,
  MISSION_STATUS_COLORS,
  MISSION_STATUS_LABELS,
  MISSION_TYPE_COLORS,
  MISSION_TYPE_LABELS,
} from '../../lib/utils';
import type { AgentStatus, MissionStatus, MissionType } from '../../types';

export function AgentStatusBadge({ status, className }: { status: AgentStatus; className?: string }) {
  return (
    <span className={cn('badge-rdc', AGENT_STATUS_COLORS[status], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {AGENT_STATUS_LABELS[status]}
    </span>
  );
}

export function MissionStatusBadge({ status, className }: { status: MissionStatus; className?: string }) {
  return (
    <span className={cn('badge-rdc', MISSION_STATUS_COLORS[status], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {MISSION_STATUS_LABELS[status]}
    </span>
  );
}

export function MissionTypeBadge({ type, className }: { type: MissionType; className?: string }) {
  return (
    <span className={cn('badge-rdc', MISSION_TYPE_COLORS[type], className)}>
      {MISSION_TYPE_LABELS[type]}
    </span>
  );
}
