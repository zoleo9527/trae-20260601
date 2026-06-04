export type Role = 'BREW_MASTER' | 'PACKAGING_SUPERVISOR' | 'SALES_BACKOFFICE';
export type FillingStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_PRODUCTION' | 'COMPLETED' | 'REJECTED';
export type PackagingStatus = 'PENDING' | 'APPROVED' | 'ISSUED' | 'COMPLETED' | 'REJECTED';

export interface User {
  id: number;
  name: string;
  role: Role;
  avatar?: string;
}

export interface FillingScheduleHistory {
  id: number;
  scheduleId: number;
  action: string;
  oldStatus?: FillingStatus;
  newStatus?: FillingStatus;
  remark: string;
  changes?: Record<string, any>;
  createdById: number;
  createdBy: User;
  createdAt: string;
}

export interface FillingSchedule {
  id: number;
  batchNo: string;
  productName: string;
  beerType: string;
  volume: number;
  fillingDate: string;
  targetBottles: number;
  status: FillingStatus;
  currentHandler: Role;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  createdBy: User;
  history: FillingScheduleHistory[];
  packagingRequisitions: PackagingRequisition[];
}

export interface PackagingRequisitionHistory {
  id: number;
  requisitionId: number;
  action: string;
  oldStatus?: PackagingStatus;
  newStatus?: PackagingStatus;
  remark: string;
  changes?: Record<string, any>;
  scheduleChangeNotified: boolean;
  changeHandled: boolean;
  changeAffected?: boolean;
  createdById: number;
  createdBy: User;
  createdAt: string;
}

export interface PackagingRequisition {
  id: number;
  requisitionNo: string;
  scheduleId: number;
  schedule: FillingSchedule;
  bottleType: string;
  bottleCount: number;
  labelType: string;
  cartonType: string;
  requiredDate: string;
  status: PackagingStatus;
  currentHandler: Role;
  createdAt: string;
  updatedAt: string;
  scheduleVersion: number;
  createdById: number;
  createdBy: User;
  history: PackagingRequisitionHistory[];
  pendingChangeCount: number;
  hasPendingChange: boolean;
  hasConfirmedChange: boolean;
  pendingChanges?: PackagingRequisitionHistory[];
  confirmedChanges?: PackagingRequisitionHistory[];
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedType: string;
  relatedId: number;
  read: boolean;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  BREW_MASTER: '酿酒师',
  PACKAGING_SUPERVISOR: '包装主管',
  SALES_BACKOFFICE: '销售内勤'
};

export const FILLING_STATUS_LABELS: Record<FillingStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '待复核',
  APPROVED: '已通过',
  IN_PRODUCTION: '生产中',
  COMPLETED: '已完成',
  REJECTED: '已驳回'
};

export const PACKAGING_STATUS_LABELS: Record<PackagingStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  ISSUED: '已发放',
  COMPLETED: '已完成',
  REJECTED: '已退回'
};

export const FILLING_STATUS_COLORS: Record<FillingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  IN_PRODUCTION: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-beer-100 text-beer-800',
  REJECTED: 'bg-red-100 text-red-800'
};

export const PACKAGING_STATUS_COLORS: Record<PackagingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-beer-100 text-beer-800',
  REJECTED: 'bg-red-100 text-red-800'
};
