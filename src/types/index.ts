export type UserRole = '食堂管理员' | '年级主任' | '财务' | '校长' | '家长';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export type RefundStatus = '待审核' | '审核中' | '已通过' | '已拒绝' | '已退回' | '异常';
export type VisitStatus = '待回访' | '回访中' | '已完成' | '需再次回访';
export type EventType = '创建' | '提交审核' | '审核通过' | '审核拒绝' | '退回' | '处理' | '回访' | '备注' | '异常标记';

export interface TimelineEvent {
  id: string;
  eventType: EventType;
  operator: User;
  timestamp: string;
  description: string;
  remark?: string;
}

export interface RefundApplication {
  id: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  refundAmount: number;
  refundReason: string;
  mealDates: string[];
  status: RefundStatus;
  createdAt: string;
  updatedAt: string;
  currentHandler: User;
  historyHandlers: User[];
  timeline: TimelineEvent[];
  hasAnomaly: boolean;
  anomalyReason?: string;
  relatedVisitId?: string;
}

export interface ParentVisit {
  id: string;
  refundId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  status: VisitStatus;
  visitContent: string;
  visitResult?: string;
  dissatisfaction?: string;
  createdAt: string;
  visitTime?: string;
  operator: User;
  timeline: TimelineEvent[];
  needFollowUp: boolean;
  followUpNote?: string;
}
