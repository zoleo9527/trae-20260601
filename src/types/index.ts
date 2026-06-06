export type DetentionStatus = 'pending' | 'confirmed' | 'appealed' | 'adjusted' | 'closed';

export type AppealStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'closed';

export type UserRole = 'dispatcher' | 'forklift_foreman' | 'warehouse_clerk';

export type TodoType = 'detention_confirm' | 'loading_record' | 'appeal_process' | 'fee_adjust' | 'detention_review';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}

export interface StatusLog {
  id: string;
  recordId: string;
  fromStatus?: string;
  toStatus: string;
  operator: string;
  operatorRole: UserRole;
  operateTime: string;
  remark?: string;
}

export interface DetentionRecord {
  id: string;
  orderNo: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  platformNo: string;
  arrivalTime: string;
  startLoadingTime: string;
  endLoadingTime: string;
  expectedDurationMin: number;
  actualDurationMin: number;
  detentionHours: number;
  feeAmount: number;
  originalFee: number;
  status: DetentionStatus;
  createdBy: string;
  createdByRole: UserRole;
  confirmedBy?: string;
  createdAt: string;
  updatedAt: string;
  remark?: string;
  statusLogs: StatusLog[];
}

export interface AppealRecord {
  id: string;
  detentionId: string;
  driverName: string;
  driverPhone: string;
  appealReason: string;
  requestedAdjustment: number;
  status: AppealStatus;
  submittedBy: string;
  submittedAt: string;
  processedBy?: string;
  processedAt?: string;
  processResult?: string;
  processRemark?: string;
  detention?: DetentionRecord;
  statusLogs: StatusLog[];
  feeUpdatedAt?: string;
  hasFeeUpdate?: boolean;
}

export interface FilterOptions {
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  operator?: string;
  keyword?: string;
}

export interface DashboardStats {
  todayDetentionCount: number;
  pendingAppealCount: number;
  totalFeeAmount: number;
  pendingConfirmationCount: number;
}

export interface TodoItem {
  id: string;
  type: TodoType;
  title: string;
  description: string;
  status: string;
  createTime: string;
  relatedId: string;
}
