import { Anomaly, FilterOptions, AnomalyType } from '@/types';

export function filterAnomalies(
  anomalies: Anomaly[],
  filters: FilterOptions
): Anomaly[] {
  return anomalies.filter((anomaly) => {
    if (filters.type && filters.type !== 'all' && anomaly.type !== filters.type) {
      return false;
    }
    if (filters.handler && filters.handler !== 'all' && anomaly.currentHandler !== filters.handler) {
      return false;
    }
    if (filters.dateRange) {
      const anomalyDate = new Date(anomaly.createdAt);
      const startDate = new Date(filters.dateRange[0]);
      const endDate = new Date(filters.dateRange[1]);
      if (anomalyDate < startDate || anomalyDate > endDate) {
        return false;
      }
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        anomaly.description.toLowerCase().includes(searchLower) ||
        anomaly.comments.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
}

export function countAnomaliesByType(
  anomalies: Anomaly[],
  type: AnomalyType
): number {
  return anomalies.filter((a) => a.type === type && a.status !== 'resolved').length;
}

export function countPendingAnomalies(anomalies: Anomaly[]): number {
  return anomalies.filter((a) => a.status === 'pending').length;
}

export function sortAnomaliesByStuckTime(anomalies: Anomaly[]): Anomaly[] {
  return [...anomalies].sort((a, b) => b.stuckHours - a.stuckHours);
}
