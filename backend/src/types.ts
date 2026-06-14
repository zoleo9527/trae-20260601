export type UserRole = 'manager' | 'appraiser' | 'finance' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export type CarStatus =
  | 'draft'
  | 'manager_pending'
  | 'appraiser_pending'
  | 'finance_pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export const CAR_STATUS_LABEL: Record<CarStatus, string> = {
  draft: '草稿',
  manager_pending: '收车经理待处理',
  appraiser_pending: '评估师待估价',
  finance_pending: '金融专员待审批',
  approved: '审批通过（可收购）',
  rejected: '已驳回',
  cancelled: '已取消'
};

export interface CarSource {
  id: string;
  carNo: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  color?: string;
  plateNumber?: string;
  vin?: string;
  ownerName?: string;
  ownerPhone?: string;
  sourceChannel?: string;
  expectedPrice?: number;
  managerPrice?: number;
  appraiserPrice?: number;
  finalPrice?: number;
  currentStatus: CarStatus;
  currentHandlerId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type OperationType =
  | 'create'
  | 'submit'
  | 'manager_approve'
  | 'manager_reject'
  | 'appraiser_submit'
  | 'appraiser_reject'
  | 'finance_approve'
  | 'finance_reject'
  | 'cancel'
  | 'update_info'
  | 'add_comment';

export type ApprovalStage = 'manager' | 'appraiser' | 'finance' | 'done' | 'terminal';

export const APPROVAL_STAGE_LABEL: Record<ApprovalStage, string> = {
  manager: '收车经理阶段',
  appraiser: '评估师阶段',
  finance: '金融审批阶段',
  done: '已完成',
  terminal: '已终止'
};

export interface OperationLog {
  id: string;
  carId: string;
  operationType: OperationType;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  fromStatus: CarStatus | null;
  toStatus: CarStatus;
  price?: number;
  remark?: string;
  createdAt: string;
}

export interface OperationLogWithContext extends OperationLog {
  carNo?: string;
  currentHandlerName?: string;
  currentHandlerRole?: UserRole;
  latestHandledAt?: string;
  keyRemarksSummary?: string;
  approvalStage?: ApprovalStage;
}

export interface AuthTokenPayload {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
}
