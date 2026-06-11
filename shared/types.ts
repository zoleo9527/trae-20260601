export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum InspectionStatus {
  PENDING_REVIEW = 'pending_review',
  DISPATCHED = 'dispatched',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PENDING_REVIEW_AFTER = 'pending_review_after',
  PASSED = 'passed',
  REJECTED = 'rejected'
}

export enum UserRole {
  ENGINEER = 'engineer',
  SUPERVISOR = 'supervisor',
  PROPERTY = 'property'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  department: string;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  description?: string;
  uploadTime: string;
  uploaderId: string;
}

export interface StatusLog {
  id: string;
  inspectionId: string;
  fromStatus: InspectionStatus | null;
  toStatus: InspectionStatus;
  operatorId: string;
  operatorName: string;
  remark?: string;
  timestamp: string;
}

export interface Dispatch {
  id: string;
  inspectionId: string;
  dispatcherId: string;
  dispatcherName: string;
  receiverId: string;
  receiverName: string;
  dispatchTime: string;
  expectedCompletionTime?: string;
  actualCompletionTime?: string;
  dispatchRemark: string;
  rectificationRemark?: string;
}

export interface Inspection {
  id: string;
  facilityType: string;
  facilityName: string;
  location: string;
  riskLevel: RiskLevel;
  description: string;
  status: InspectionStatus;
  discovererId: string;
  discovererName: string;
  discoveryTime: string;
  photos: Photo[];
  statusLogs: StatusLog[];
  dispatches: Dispatch[];
  reviewResult?: 'pass' | 'fail';
  reviewRemark?: string;
  reviewTime?: string;
  reviewerId?: string;
  reviewerName?: string;
}

export interface RectificationStats {
  total: number;
  pending: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
  overdue: number;
}

export interface CreateInspectionRequest {
  facilityType: string;
  facilityName: string;
  location: string;
  riskLevel: RiskLevel;
  description: string;
  photos: Omit<Photo, 'id' | 'uploadTime' | 'uploaderId'>[];
}

export interface CreateDispatchRequest {
  inspectionId: string;
  receiverId: string;
  dispatchRemark: string;
  expectedCompletionTime?: string;
}

export interface UpdateDispatchRequest {
  expectedCompletionTime?: string;
  rectificationRemark?: string;
  isCompleted?: boolean;
}

export interface ReviewRequest {
  inspectionId: string;
  result: 'pass' | 'fail';
  remark: string;
  photos: Omit<Photo, 'id' | 'uploadTime' | 'uploaderId'>[];
}

export const RiskLevelLabel: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '紧急'
};

export const InspectionStatusLabel: Record<InspectionStatus, string> = {
  [InspectionStatus.PENDING_REVIEW]: '待审核',
  [InspectionStatus.DISPATCHED]: '已派发',
  [InspectionStatus.IN_PROGRESS]: '整改中',
  [InspectionStatus.COMPLETED]: '整改完成',
  [InspectionStatus.PENDING_REVIEW_AFTER]: '待复查',
  [InspectionStatus.PASSED]: '复查通过',
  [InspectionStatus.REJECTED]: '复查不通过'
};

export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.ENGINEER]: '巡检工程师',
  [UserRole.SUPERVISOR]: '维保主管',
  [UserRole.PROPERTY]: '物业联系人'
};
