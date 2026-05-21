import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DashboardStats } from '../types';

export function useDashboardStats() {
  return useQuery<{ success: boolean; data: DashboardStats }>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
