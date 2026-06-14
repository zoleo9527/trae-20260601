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

export interface AuthTokenPayload {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
}

export const CAR_STATUS_LABEL: Record<CarStatus, string> = {
  draft: '草稿',
  manager_pending: '收车经理待处理',
  appraiser_pending: '评估师待估价',
  finance_pending: '金融专员待审批',
  approved: '审批通过（可收购）',
  rejected: '已驳回',
  cancelled: '已取消'
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: '管理员',
  manager: '收车经理',
  appraiser: '评估师',
  finance: '金融专员'
};

export const OPERATION_LABEL: Record<OperationType, string> = {
  create: '创建车源',
  submit: '提交审批',
  manager_approve: '收车经理通过',
  manager_reject: '收车经理驳回',
  appraiser_submit: '评估师完成估价',
  appraiser_reject: '评估师驳回',
  finance_approve: '金融审批通过',
  finance_reject: '金融审批驳回',
  cancel: '取消车源',
  update_info: '更新信息',
  add_comment: '添加备注'
};
