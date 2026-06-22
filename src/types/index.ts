export type UserRole = 'inspector' | 'electrician' | 'dispatcher' | 'supervisor';

export type WorkOrderStatus =
  | 'pending_dispatch'
  | 'dispatched'
  | 'on_site'
  | 'in_progress'
  | 'returned'
  | 'completed';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type RemarkType = 'dispatch' | 'onsite' | 'return' | 'complete' | 'supplement';

export interface User {
  id: string;
  employeeNo: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  workload?: number;
}

export interface LampPost {
  id: string;
  lampNo: string;
  location: string;
  model: string;
  installDate: string;
  lastMaintenanceDate?: string;
  historyRecords: string[];
}

export interface NightPatrolRecord {
  id: string;
  workOrderId: string;
  inspectorId: string;
  inspectorName: string;
  reportTime: string;
  faultType: string;
  description: string;
  photos?: string[];
}

export interface Remark {
  id: string;
  workOrderId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  type: RemarkType;
  timestamp: string;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  lampPostId: string;
  lampPost: LampPost;
  status: WorkOrderStatus;
  priority: Priority;
  faultType: string;
  patrolRecord: NightPatrolRecord;
  electricianId?: string;
  electricianName?: string;
  dispatchTime?: string;
  dispatchRemark?: string;
  onSiteTime?: string;
  onSiteRemark?: string;
  returnReason?: string;
  returnTime?: string;
  completeTime?: string;
  completeRemark?: string;
  remarks: Remark[];
  createdAt: string;
}

export interface TimelineNode {
  id: string;
  type: 'report' | 'dispatch' | 'onsite' | 'return' | 'complete';
  title: string;
  operator: string;
  operatorRole: UserRole;
  time: string;
  remark?: string;
  expanded: boolean;
}

export const roleLabels: Record<UserRole, string> = {
  inspector: '巡检员',
  electrician: '电工',
  dispatcher: '调度员',
  supervisor: '主管',
};

export const statusLabels: Record<WorkOrderStatus, string> = {
  pending_dispatch: '待派工',
  dispatched: '已派工',
  on_site: '已到场',
  in_progress: '处理中',
  returned: '已退回',
  completed: '已完成',
};

export const priorityLabels: Record<Priority, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export const remarkTypeLabels: Record<RemarkType, string> = {
  dispatch: '派工备注',
  onsite: '到场反馈',
  return: '退回原因',
  complete: '完成记录',
  supplement: '补充备注',
};
