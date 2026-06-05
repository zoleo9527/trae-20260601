import { useStore } from '@/store';
import type { ScheduleRecord, UserRole } from '@/types';

function calculateTodoCount(records: ScheduleRecord[], currentRole: UserRole): number {
  return records.filter((r) => {
    if (r.status === 'completed') return false;
    if (currentRole === 'coach') return r.status === 'pending_coach_confirm';
    if (currentRole === 'reception') return r.status === 'pending_reception_handle';
    if (currentRole === 'manager') return r.status === 'pending_manager_audit' || r.status === 'disputed';
    return false;
  }).length;
}

function calculateAlerts(records: ScheduleRecord[]): ScheduleRecord[] {
  return records.filter((r) => r.isOverdue || r.hasResponsibilityRisk || r.status === 'pending_manager_audit');
}

export function usePressureIndicator() {
  const records = useStore((state) => state.records);
  const currentRole = useStore((state) => state.currentRole);
  
  const todoCount = calculateTodoCount(records, currentRole);
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
