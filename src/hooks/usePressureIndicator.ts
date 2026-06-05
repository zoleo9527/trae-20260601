import { useStore, isRecordVisible } from '@/store';
import type { ScheduleRecord } from '@/types';

function calculateAlerts(records: ScheduleRecord[]): ScheduleRecord[] {
  return records.filter((r) => r.isOverdue || r.hasResponsibilityRisk || r.status === 'pending_manager_audit');
}

export function usePressureIndicator() {
  const records = useStore((state) => state.records);
  const currentRole = useStore((state) => state.currentRole);
  
  const todoCount = records.filter((r) => isRecordVisible(r, currentRole, 'all')).length;
  const alerts = calculateAlerts(records);
  
  let pressureLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (todoCount >= 8 || alerts.length >= 4) {
    pressureLevel = 'critical';
  } else if (todoCount >= 5 || alerts.length >= 2) {
    pressureLevel = 'high';
  } else if (todoCount >= 3) {
    pressureLevel = 'medium';
  }
  
  const pressurePercent = Math.min(100, (todoCount / 10) * 100 + alerts.length * 5);
  
  return {
    todoCount,
    alertCount: alerts.length,
    pressureLevel,
    pressurePercent,
    isHighPressure: pressureLevel === 'high' || pressureLevel === 'critical',
    alerts
  };
}
