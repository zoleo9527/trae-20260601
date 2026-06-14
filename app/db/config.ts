import type { Prisma } from '@prisma/client';

export const statusTransitionConfigs: Prisma.StatusTransitionConfigCreateInput[] = [
  {
    id: 'stc1',
    fromStatus: 'pending',
    toStatus: 'inspected',
    requiredRole: 'assessor',
    allowedRoles: ['assessor'],
    requiredFields: ['inspectionReport'],
    autoNotifyRoles: ['manager', 'finance'],
    timeoutHours: 48,
    description: '评估师完成检测后，车辆可进入整备阶段'
  },
  {
    id: 'stc2',
    fromStatus: 'inspected',
    toStatus: 'preparing',
    requiredRole: 'manager',
    allowedRoles: ['manager', 'assessor'],
    requiredFields: ['budgetApproval'],
    autoNotifyRoles: ['assessor', 'finance'],
    timeoutHours: 24,
    description: '经理确认预算后，车辆进入整备阶段'
  },
  {
    id: 'stc3',
    fromStatus: 'preparing',
    toStatus: 'completed',
    requiredRole: 'manager',
    allowedRoles: ['manager', 'assessor'],
    requiredFields: ['allTasksCompleted', 'costVerified'],
    autoNotifyRoles: ['finance'],
    timeoutHours: 72,
    description: '所有整备任务完成且成本确认后，车辆可完成'
  },
  {
    id: 'stc4',
    fromStatus: 'pending',
    toStatus: 'cancelled',
    requiredRole: 'manager',
    allowedRoles: ['manager'],
    requiredFields: ['cancellationReason'],
    autoNotifyRoles: ['assessor', 'finance'],
    timeoutHours: 0,
    description: '经理可取消车辆收购'
  }
];