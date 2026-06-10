import { useCallback } from 'react';
import type { RecentVisit, RecentVisitType } from '../data/types';
import { useLocalStorage } from './useLocalStorage';

const MAX_RECENT = 5;
const STORAGE_KEY = 'parking_recent_visits';

export function useRecent() {
  const [recentVisits, setRecentVisits] = useLocalStorage<RecentVisit[]>(STORAGE_KEY, []);

  const addRecentVisit = useCallback((item: Omit<RecentVisit, 'id' | 'timestamp'>) => {
    const newVisit: RecentVisit = {
      ...item,
      id: `recent-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setRecentVisits(prev => {
      const filtered = prev.filter(v => v.path !== item.path);
      return [newVisit, ...filtered].slice(0, MAX_RECENT);
    });
  }, [setRecentVisits]);

  const removeRecentVisit = useCallback((id: string) => {
    setRecentVisits(prev => prev.filter(v => v.id !== id));
  }, [setRecentVisits]);

  const clearRecentVisits = useCallback(() => {
    setRecentVisits([]);
  }, [setRecentVisits]);

  const getTypeIcon = (type: RecentVisitType) => {
    const icons: Record<RecentVisitType, string> = {
      audit: 'FileCheck',
      dispatch: 'Radio',
      exception: 'AlertTriangle',
    };
    return icons[type];
  };

  return {
    recentVisits,
    addRecentVisit,
    removeRecentVisit,
    clearRecentVisits,
    getTypeIcon,
  };
}
