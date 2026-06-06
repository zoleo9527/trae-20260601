export type UserRole = 'schedule_manager' | 'ticket_manager' | 'duty_manager';

export const roleLabels: Record<UserRole, string> = {
  schedule_manager: '排片经理',
  ticket_manager: '票务主管',
  duty_manager: '值班经理',
};

export interface OperationLog {
  id: string;
  entityType: 'schedule' | 'hall' | 'ticket' | 'fault';
  entityId: string;
  action: string;
  operator: UserRole;
  operatorName: string;
  remark?: string;
  createdAt: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
}

export type ScheduleStatus = 'draft' | 'pending' | 'active' | 'adjusting' | 'cancelled' | 'completed' | 'closed';

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  active: '生效中',
  adjusting: '调整中',
  cancelled: '已取消',
  completed: '已完成',
  closed: '已关闭',
};

export const scheduleStatusColors: Record<ScheduleStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  adjusting: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-600',
};

export type HallStatus = 'idle' | 'screening' | 'fault' | 'maintenance';

export const hallStatusLabels: Record<HallStatus, string> = {
  idle: '空闲',
  screening: '放映中',
  fault: '故障',
  maintenance: '维护中',
};

export const hallStatusColors: Record<HallStatus, string> = {
  idle: 'bg-green-100 text-green-800',
  screening: 'bg-blue-100 text-blue-800',
  fault: 'bg-red-100 text-red-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
};

export type FaultStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export const faultStatusLabels: Record<FaultStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const faultStatusColors: Record<FaultStatus, string> = {
  pending: 'bg-red-100 text-red-800',
  processing: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

export type TicketStatus = 'unused' | 'checked' | 'refunding' | 'refunded';

export const ticketStatusLabels: Record<TicketStatus, string> = {
  unused: '未使用',
  checked: '已核销',
  refunding: '退票中',
  refunded: '已退票',
};

export const ticketStatusColors: Record<TicketStatus, string> = {
  unused: 'bg-gray-100 text-gray-800',
  checked: 'bg-green-100 text-green-800',
  refunding: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-red-100 text-red-800',
};
