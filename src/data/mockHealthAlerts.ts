import type { HealthAlert } from '../types';

export const mockHealthAlerts: HealthAlert[] = [
  {
    id: 'alert-1',
    childId: 'child-3',
    type: 'allergy',
    description: '鸡蛋过敏',
    isActive: true,
  },
  {
    id: 'alert-2',
    childId: 'child-5',
    type: 'allergy',
    description: '花生过敏',
    isActive: true,
  },
  {
    id: 'alert-3',
    childId: 'child-8',
    type: 'medication',
    description: '感冒恢复中，需按时服药',
    isActive: true,
  },
];

export const getAlertsByChildId = (childId: string): HealthAlert[] => {
  return mockHealthAlerts.filter(alert => alert.childId === childId && alert.isActive);
};

export const getActiveAlerts = (): HealthAlert[] => {
  return mockHealthAlerts.filter(alert => alert.isActive);
};
