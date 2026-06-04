export type PrescriptionStatus =
  | 'PENDING_REVIEW'
  | 'REVIEWED'
  | 'PENDING_DECOCTION'
  | 'DECOCTED'
  | 'PENDING_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'COMPLETED';

export type Role = 'PHARMACIST' | 'DECOCTION_STAFF' | 'DELIVERY_STAFF';

export type SignResult = 'NORMAL' | 'RETURNED';

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientName: string;
  patientAge: number;
  patientGender: '男' | '女';
  diagnosis: string;
  prescriptionContent: string;
  dosage: string;
  currentStatus: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryInfo {
  id: string;
  prescriptionId: string;
  courierCompany: string;
  trackingNo: string;
  deliveryRemark: string;
  signedAt?: string;
  signResult?: SignResult;
  returnReason?: string;
  returnType?: string;
  supplementaryRemark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusLog {
  id: string;
  prescriptionId: string;
  fromStatus: PrescriptionStatus | null;
  toStatus: PrescriptionStatus;
  operatorRole: Role;
  operatorName: string;
  remark: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  prescriptionId: string;
  operationType: string;
  operatorRole: Role;
  operatorName: string;
  content: string;
  createdAt: string;
}

export interface PrescriptionDeliverySummary {
  courierCompany: string;
  trackingNo: string;
  deliveryRemark?: string;
  signResult?: SignResult;
  signedAt?: string;
  returnType?: string;
  returnReason?: string;
  supplementaryRemark?: string;
}

export interface PrescriptionWithDeliverySummary extends Prescription {
  deliverySummary?: PrescriptionDeliverySummary;
}

export interface PrescriptionDetail extends Prescription {
  deliveryInfo?: DeliveryInfo;
  statusLogs: StatusLog[];
  operationLogs: OperationLog[];
}

export interface CreatePrescriptionRequest {
  patientName: string;
  patientAge: number;
  patientGender: '男' | '女';
  diagnosis: string;
  prescriptionContent: string;
  dosage: string;
}

export interface ReviewRequest {
  operatorName: string;
  remark: string;
}

export interface DecoctRequest {
  operatorName: string;
  remark: string;
}

export interface DeliveryRequest {
  operatorName: string;
  courierCompany: string;
  trackingNo: string;
  deliveryRemark: string;
}

export interface SignRequest {
  operatorName: string;
  signResult: SignResult;
  returnType?: string;
  returnReason?: string;
  supplementaryRemark?: string;
}

export interface RoleTodoCount {
  PENDING_REVIEW: number;
  PENDING_DECOCTION: number;
  PENDING_DELIVERY: number;
  OUT_FOR_DELIVERY: number;
  RETURNED: number;
  TOTAL: number;
}

export const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  PENDING_REVIEW: '待审核',
  REVIEWED: '已审核',
  PENDING_DECOCTION: '待煎药',
  DECOCTED: '已煎药',
  PENDING_DELIVERY: '待配送',
  OUT_FOR_DELIVERY: '配送中',
  DELIVERED: '已签收',
  RETURNED: '已退回',
  COMPLETED: '已完成',
};

export const STATUS_COLORS: Record<PrescriptionStatus, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  REVIEWED: 'bg-sky-100 text-sky-800 border-sky-200',
  PENDING_DECOCTION: 'bg-orange-100 text-orange-800 border-orange-200',
  DECOCTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING_DELIVERY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  OUT_FOR_DELIVERY: 'bg-teal-100 text-teal-800 border-teal-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  RETURNED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const ROLE_LABELS: Record<Role, string> = {
  PHARMACIST: '审方药师',
  DECOCTION_STAFF: '煎药员',
  DELIVERY_STAFF: '配送客服',
};

export const ROLE_TODO_STATUSES: Record<Role, PrescriptionStatus[]> = {
  PHARMACIST: ['PENDING_REVIEW'],
  DECOCTION_STAFF: ['PENDING_DECOCTION'],
  DELIVERY_STAFF: ['PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'RETURNED'],
};

export const ROLE_HISTORY_STATUSES: Record<Role, PrescriptionStatus[]> = {
  PHARMACIST: ['REVIEWED', 'PENDING_DECOCTION', 'DECOCTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'COMPLETED'],
  DECOCTION_STAFF: ['PENDING_REVIEW', 'REVIEWED', 'DECOCTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'COMPLETED'],
  DELIVERY_STAFF: ['PENDING_REVIEW', 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTED', 'DELIVERED', 'COMPLETED'],
};
