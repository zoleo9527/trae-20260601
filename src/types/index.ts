export type Role = 'manager' | 'consultant' | 'controller';

export type VisitStatus = 'pending' | 'following' | 'subscribed' | 'lost';
export type SubscriptionStatus = 'draft' | 'confirmed' | 'modified' | 'cancelled';
export type SigningStatus = 'pending' | 'reminded' | 'confirmed' | 'delayed' | 'completed';
export type MaterialStatus = 'incomplete' | 'submitted' | 'verified' | 'returned';
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

export type HandoverStage = 'visit' | 'followup' | 'subscription' | 'material' | 'signing';
export type HandoverStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
export type TodoPriority = 'high' | 'medium' | 'low';
export type TodoType = 'followup' | 'material_submit' | 'material_verify' | 'signing_reminder' | 'subscription_review' | 'handover';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  source: string;
  firstVisitDate: string;
  status: VisitStatus;
  consultantId: string;
  consultantName: string;
}

export interface VisitRecord {
  id: string;
  customerId: string;
  customerName: string;
  visitDate: string;
  purpose: string;
  intentionLevel: 'high' | 'medium' | 'low';
  consultantId: string;
  consultantName: string;
  remark: string;
  createdAt: string;
}

export interface FollowUpRecord {
  id: string;
  customerId: string;
  customerName: string;
  followDate: string;
  followType: string;
  content: string;
  nextFollowDate: string;
  consultantId: string;
  consultantName: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface Subscription {
  id: string;
  subscriptionNo: string;
  customerId: string;
  customerName: string;
  phone: string;
  unitNo: string;
  area: number;
  price: number;
  deposit: number;
  consultantId: string;
  consultantName: string;
  controllerId: string;
  controllerName: string;
  status: SubscriptionStatus;
  materialStatus: MaterialStatus;
  urgency: UrgencyLevel;
  signDeadline: string;
  createdAt: string;
  updatedAt: string;
  modifiedCount: number;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

export interface SubscriptionMaterial {
  id: string;
  subscriptionId: string;
  name: string;
  type: string;
  status: 'pending' | 'submitted' | 'verified' | 'returned';
  remark: string;
  submittedAt?: string;
  verifiedAt?: string;
  returnedReason?: string;
}

export interface SigningReminder {
  id: string;
  subscriptionId: string;
  subscriptionNo: string;
  customerName: string;
  phone: string;
  unitNo: string;
  signDeadline: string;
  status: SigningStatus;
  reminderCount: number;
  lastReminderAt?: string;
  lastReminderBy: string;
  delayReason?: string;
  delayDays?: number;
  materialReady: boolean;
  materialModified: boolean;
  lastMaterialChangeAt?: string;
  assignedTo: string;
  assignedRole: Role;
  urgency: UrgencyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  type: string;
  targetId: string;
  targetType: string;
  action: string;
  operatorId: string;
  operatorName: string;
  operatorRole: Role;
  detail: string;
  timestamp: string;
}

export interface FilterOptions {
  keyword?: string;
  status?: string;
  consultantId?: string;
  dateFrom?: string;
  dateTo?: string;
  urgency?: string;
  materialStatus?: string;
  assignedRole?: string;
}

export interface HandoverRecord {
  id: string;
  fromStage: HandoverStage;
  toStage: HandoverStage;
  targetId: string;
  targetType: string;
  targetName: string;
  fromRole: Role;
  toRole: Role;
  fromPerson: string;
  toPerson: string;
  status: HandoverStatus;
  remark: string;
  deadline?: string;
  handedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  type: TodoType;
  title: string;
  description: string;
  priority: TodoPriority;
  role: Role;
  assigneeId: string;
  assigneeName: string;
  targetId: string;
  targetType: string;
  status: 'pending' | 'processing' | 'completed';
  dueAt?: string;
  createdAt: string;
  completedAt?: string;
}

export interface StatusTransition {
  id: string;
  targetId: string;
  targetType: string;
  fromStatus: string;
  toStatus: string;
  operatorId: string;
  operatorName: string;
  operatorRole: Role;
  reason?: string;
  timestamp: string;
}

export interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionText?: string;
  actionTarget?: string;
  count?: number;
}

export interface RoleWorkload {
  role: Role;
  roleName: string;
  pendingCount: number;
  overdueCount: number;
  todayCompleted: number;
  avgHandleTime?: number;
}
