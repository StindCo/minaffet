import { AgentTracker } from '../components/agents/AgentTracker';

export function TrackerPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Agent Tracker</h2>
        <p className="text-sm text-slate-500 mt-1">
          Retrouvez en temps réel la localisation et le statut de tout agent diplomatique.
        </p>
      </div>
      <AgentTracker />
    </div>
  );
}
