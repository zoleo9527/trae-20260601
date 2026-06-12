export type UserRole = 'project_specialist' | 'review_secretary' | 'finance';

export type ProjectStatus =
  | 'draft'
  | 'arrangement_pending'
  | 'arrangement_reviewing'
  | 'arrangement_approved'
  | 'arrangement_rejected'
  | 'bidding_pending'
  | 'bidding_in_progress'
  | 'bidding_completed'
  | 'expert_signin_pending'
  | 'expert_signin_in_progress'
  | 'expert_signin_completed'
  | 'evaluation_in_progress'
  | 'evaluation_completed'
  | 'archived';

export type ArrangementStatus =
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'modified';

export type SigninStatus =
  | 'pending'
  | 'confirmed'
  | 'absent'
  | 'leave'
  | 'substituted';

export type ExpertStatus =
  | 'available'
  | 'busy'
  | 'leave'
  | 'suspended';

export type ExceptionType =
  | 'arrangement_timeout'
  | 'expert_absent'
  | 'expert_late'
  | 'signin_incomplete'
  | 'room_conflict'
  | 'document_missing'
  | 'financial_issue'
  | 'other';

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ExceptionStatus = 'open' | 'processing' | 'resolved' | 'closed';

export type NotificationType = 'reminder' | 'warning' | 'alert' | 'info';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  department: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface Project {
  id: string;
  projectNo: string;
  name: string;
  clientName: string;
  clientContact: string;
  clientPhone: string;
  projectType: 'construction' | 'goods' | 'service';
  budgetAmount: number;
  biddingMethod: 'open' | 'invited' | 'competitive_negotiation';
  status: ProjectStatus;
  currentHandlerId: string;
  currentHandlerName: string;
  currentHandlerRole: UserRole;
  projectSpecialistId: string;
  projectSpecialistName: string;
  reviewSecretaryId: string | null;
  reviewSecretaryName: string | null;
  financeId: string | null;
  financeName: string | null;
  estimatedBiddingDate: string | null;
  actualBiddingDate: string | null;
  biddingLocation: string | null;
  roomNumber: string | null;
  description: string | null;
  remarks: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectArrangement {
  id: string;
  projectId: string;
  projectNo: string;
  projectName: string;
  status: ArrangementStatus;
  biddingDate: string;
  biddingStartTime: string;
  biddingEndTime: string;
  biddingLocation: string;
  roomNumber: string;
  expertCount: number;
  expertIds: string[];
  supervisionExpertId: string | null;
  supervisionExpertName: string | null;
  documentPreparation: boolean;
  venueReservation: boolean;
  equipmentCheck: boolean;
  materialPrinting: boolean;
  financeConfirmed: boolean;
  depositReceived: boolean;
  feeCalculated: boolean;
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewComment: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  rejectedAt: string | null;
  lastModifiedAt: string | null;
  modificationCount: number;
  blockReason: string | null;
  blockAt: string | null;
  blockHandlerId: string | null;
  blockHandlerName: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Expert {
  id: string;
  expertNo: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  idCard: string;
  expertise: string[];
  title: string;
  organization: string;
  status: ExpertStatus;
  totalSigninCount: number;
  absentCount: number;
  lateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertSigninRecord {
  id: string;
  projectId: string;
  projectNo: string;
  projectName: string;
  arrangementId: string;
  expertId: string;
  expertName: string;
  expertise: string;
  status: SigninStatus;
  scheduledArrivalTime: string;
  actualArrivalTime: string | null;
  signinTime: string | null;
  signinMethod: 'manual' | 'card' | 'face' | 'qr' | null;
  seatNumber: string | null;
  isSupervision: boolean;
  leaveReason: string | null;
  substituteExpertId: string | null;
  substituteExpertName: string | null;
  signinCompleteReason: string | null;
  handlerId: string | null;
  handlerName: string | null;
  handlerRole: UserRole | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  entityType: 'project' | 'arrangement' | 'signin' | 'expert' | 'exception' | 'notification';
  entityId: string;
  action: string;
  description: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  oldStatus?: string;
  newStatus?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  category: 'document' | 'evidence' | 'notice' | 'other';
}

export interface ExceptionRecord {
  id: string;
  projectId: string;
  projectNo: string;
  projectName: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  description: string;
  triggeredAt: string;
  triggeredBy: string;
  triggerSource: 'system' | 'manual';
  handlerId: string | null;
  handlerName: string | null;
  handlerRole: UserRole | null;
  handledAt: string | null;
  resolution: string | null;
  autoTrigger: boolean;
  triggerCondition: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: NotificationType;
  title: string;
  content: string;
  relatedEntityType: 'project' | 'arrangement' | 'signin' | 'exception';
  relatedEntityId: string;
  isRead: boolean;
  readAt: string | null;
  actionRequired: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'status_change' | 'action' | 'exception' | 'notification' | 'attachment';
  title: string;
  content: string;
  operatorId: string | null;
  operatorName: string | null;
  operatorRole: UserRole | null;
  attachments: Attachment[];
  metadata?: Record<string, unknown>;
}

export interface StatusTransition {
  from: ProjectStatus | null;
  to: ProjectStatus;
  action: string;
  allowedRoles: UserRole[];
  requiredHandlerRole: UserRole;
  description: string;
  autoTriggerException?: ExceptionType;
}

export interface ArrangementTransition {
  from: ArrangementStatus | null;
  to: ArrangementStatus;
  action: string;
  allowedRoles: UserRole[];
  description: string;
}

export interface BlockAnalysis {
  isBlocked: boolean;
  blockReason: string | null;
  blockAt: string | null;
  blockHandlerId: string | null;
  blockHandlerName: string | null;
  blockHandlerRole: UserRole | null;
  blockedDuration: number;
  pendingActions: string[];
  nextHandler: {
    role: UserRole;
    roleName: string;
    userId: string | null;
    userName: string | null;
  } | null;
}

export interface SigninAnalysis {
  arrangementId?: string;
  totalExperts: number;
  confirmedCount: number;
  absentCount: number;
  leaveCount: number;
  pendingCount: number;
  signinRate: number;
  isComplete: boolean;
  incompleteReason: string | null;
  pendingExperts: {
    recordId: string;
    expertId: string;
    expertName: string;
    status: SigninStatus;
    scheduledTime: string;
    remark: string | null;
  }[];
}

export interface ResponsibilityMatrix {
  projectSpecialist: {
    userId: string;
    userName: string;
    responsibilities: string[];
    pendingTasks: number;
    completedTasks: number;
  };
  reviewSecretary: {
    userId: string | null;
    userName: string | null;
    responsibilities: string[];
    pendingTasks: number;
    completedTasks: number;
  };
  finance: {
    userId: string | null;
    userName: string | null;
    responsibilities: string[];
    pendingTasks: number;
    completedTasks: number;
  };
}

export const roleNames: Record<UserRole, string> = {
  project_specialist: '项目专员',
  review_secretary: '评审秘书',
  finance: '财务',
};

export const exceptionTypeNames: Record<ExceptionType, string> = {
  arrangement_timeout: '安排超时',
  expert_absent: '专家缺席',
  expert_late: '专家迟到',
  signin_incomplete: '签到未完成',
  room_conflict: '会议室冲突',
  document_missing: '文件缺失',
  financial_issue: '财务问题',
  other: '其他问题',
};

export const statusDisplay: Record<ProjectStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#8c8c8c' },
  arrangement_pending: { label: '待安排', color: '#faad14' },
  arrangement_reviewing: { label: '安排审核中', color: '#1890ff' },
  arrangement_approved: { label: '安排已通过', color: '#52c41a' },
  arrangement_rejected: { label: '安排已退回', color: '#f5222d' },
  bidding_pending: { label: '待开标', color: '#faad14' },
  bidding_in_progress: { label: '开标中', color: '#1890ff' },
  bidding_completed: { label: '开标完成', color: '#13c2c2' },
  expert_signin_pending: { label: '待专家签到', color: '#faad14' },
  expert_signin_in_progress: { label: '签到进行中', color: '#1890ff' },
  expert_signin_completed: { label: '签到完成', color: '#52c41a' },
  evaluation_in_progress: { label: '评标中', color: '#722ed1' },
  evaluation_completed: { label: '评标完成', color: '#52c41a' },
  archived: { label: '已归档', color: '#8c8c8c' },
};

export const arrangementStatusDisplay: Record<ArrangementStatus, { label: string; color: string }> = {
  pending: { label: '待提交', color: '#8c8c8c' },
  reviewing: { label: '审核中', color: '#1890ff' },
  approved: { label: '已通过', color: '#52c41a' },
  rejected: { label: '已退回', color: '#f5222d' },
  modified: { label: '已修改', color: '#faad14' },
};

export const signinStatusDisplay: Record<SigninStatus, { label: string; color: string }> = {
  pending: { label: '待签到', color: '#faad14' },
  confirmed: { label: '已签到', color: '#52c41a' },
  absent: { label: '缺席', color: '#f5222d' },
  leave: { label: '请假', color: '#fa8c16' },
  substituted: { label: '已更换', color: '#722ed1' },
};
