export type RoleType = 'lobby' | 'manager' | 'supervisor';

export const ROLE_LABEL: Record<RoleType, string> = {
  lobby: '大堂经理',
  manager: '客户经理',
  supervisor: '运营主管',
};

export type ComplaintStatus =
  | 'registered'
  | 'assigned'
  | 'investigating'
  | 'pending_verification'
  | 'resolved'
  | 'rejected'
  | 'escalated';

export const COMPLAINT_STATUS_LABEL: Record<ComplaintStatus, string> = {
  registered: '已登记',
  assigned: '已分派',
  investigating: '调查中',
  pending_verification: '待回访核实',
  resolved: '已结案',
  rejected: '已退回',
  escalated: '已升级',
};

export type ComplaintCategory =
  | 'service'
  | 'queuing'
  | 'product'
  | 'system'
  | 'fee'
  | 'other';

export const COMPLAINT_CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  service: '服务态度',
  queuing: '排队叫号',
  product: '产品问题',
  system: '系统故障',
  fee: '收费争议',
  other: '其他',
};

export type VisitStatus = 'pending' | 'in_progress' | 'verified' | 'unverified' | 'returned';

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  pending: '待回访',
  in_progress: '回访中',
  verified: '已核实',
  unverified: '无法联系',
  returned: '客户不满意退回',
};

export type VisitResult = 'satisfied' | 'partially_satisfied' | 'unsatisfied' | 'no_answer';

export const VISIT_RESULT_LABEL: Record<VisitResult, string> = {
  satisfied: '满意',
  partially_satisfied: '基本满意',
  unsatisfied: '不满意',
  no_answer: '无法联系',
};

export type TimelineEventType =
  | 'register'
  | 'assign'
  | 'update'
  | 'escalate'
  | 'verify'
  | 'reject'
  | 'resolve'
  | 'visit_start'
  | 'visit_result'
  | 'return'
  | 'reminder';

export interface User {
  id: string;
  name: string;
  role: RoleType;
  phone?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  idCardNo?: string;
  accountNo?: string;
  level?: 'normal' | 'vip';
}

export interface TimelineEvent {
  id: string;
  complaintId: string;
  type: TimelineEventType;
  createdAt: string;
  operatorId: string;
  operatorName: string;
  operatorRole: RoleType;
  content: string;
  detail?: Record<string, unknown>;
}

export interface Complaint {
  id: string;
  code: string;
  category: ComplaintCategory;
  title: string;
  content: string;
  customer: Customer;
  status: ComplaintStatus;
  registeredBy: string;
  registeredByName: string;
  registeredAt: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: RoleType;
  assignedAt?: string;
  handlerId?: string;
  handlerName?: string;
  handlerRole?: RoleType;
  resolvedAt?: string;
  resolution?: string;
  queueNo?: string;
  branch?: string;
  counterNo?: string;
  isAbnormal?: boolean;
  abnormalReason?: string;
  currentVisitId?: string;
  visits: string[];
  timeline: TimelineEvent[];
}

export interface VisitRecord {
  id: string;
  complaintId: string;
  complaintCode: string;
  complaintTitle: string;
  customer: Customer;
  status: VisitStatus;
  assigneeId: string;
  assigneeName: string;
  assigneeRole: RoleType;
  assignedAt: string;
  startedAt?: string;
  finishedAt?: string;
  visitMethod?: 'phone' | 'onsite' | 'online';
  result?: VisitResult;
  customerFeedback?: string;
  internalNote?: string;
  needReturn?: boolean;
  returnReason?: string;
  timeline: TimelineEvent[];
}

export interface AppState {
  currentUser: User;
  users: User[];
  complaints: Complaint[];
  visits: VisitRecord[];
  notifications: NotificationItem[];
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  linkTo?: string;
}
