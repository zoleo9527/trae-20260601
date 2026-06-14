export enum AssessmentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum DamageType {
  SCRATCH = 'scratch',
  DENT = 'dent',
  BREAK = 'break',
  DEFORM = 'deform'
}

export enum DamageLevel {
  SLIGHT = 'slight',
  MEDIUM = 'medium',
  SEVERE = 'severe'
}

export enum RepairMethod {
  REPAIR = 'repair',
  REPLACE = 'replace',
  PAINT = 'paint'
}

export interface DamageAssessment {
  assessmentId: string;
  taskId: string;
  assessmentNo: string;
  assessorId: string;
  assessorName: string;
  assessmentTime: string;
  partsFee: number;
  laborFee: number;
  materialFee: number;
  totalAmount: number;
  repairMethod: string;
  repairPlan?: string;
  status: AssessmentStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewTime?: string;
  reviewComment?: string;
  createdBy: string;
  createdByName: string;
  createdTime: string;
  updatedTime: string;
}

export interface DamageDetail {
  detailId: string;
  assessmentId: string;
  partName: string;
  damageType: DamageType;
  damageLevel: DamageLevel;
  repairMethod: RepairMethod;
  partFee: number;
  laborFee: number;
  remark?: string;
  createdTime: string;
}

export interface CreateAssessmentParams {
  taskId: string;
  partsFee: number;
  laborFee: number;
  materialFee?: number;
  repairMethod: string;
  repairPlan?: string;
  details: Array<{
    partName: string;
    damageType: DamageType;
    damageLevel: DamageLevel;
    repairMethod: RepairMethod;
    partFee: number;
    laborFee: number;
    remark?: string;
  }>;
  remark?: string;
}

export interface AssessmentFilter {
  taskId?: string;
  status?: AssessmentStatus;
  assessorId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  [AssessmentStatus.DRAFT]: '草稿',
  [AssessmentStatus.PENDING_REVIEW]: '待审核',
  [AssessmentStatus.APPROVED]: '已确认',
  [AssessmentStatus.REJECTED]: '已拒绝'
};

export const ASSESSMENT_STATUS_COLORS: Record<AssessmentStatus, string> = {
  [AssessmentStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [AssessmentStatus.PENDING_REVIEW]: 'bg-purple-100 text-purple-700',
  [AssessmentStatus.APPROVED]: 'bg-green-100 text-green-700',
  [AssessmentStatus.REJECTED]: 'bg-red-100 text-red-700'
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  [DamageType.SCRATCH]: '刮擦',
  [DamageType.DENT]: '凹陷',
  [DamageType.BREAK]: '破裂',
  [DamageType.DEFORM]: '变形'
};

export const DAMAGE_LEVEL_LABELS: Record<DamageLevel, string> = {
  [DamageLevel.SLIGHT]: '轻微',
  [DamageLevel.MEDIUM]: '中等',
  [DamageLevel.SEVERE]: '严重'
};

export const REPAIR_METHOD_LABELS: Record<RepairMethod, string> = {
  [RepairMethod.REPAIR]: '维修',
  [RepairMethod.REPLACE]: '更换',
  [RepairMethod.PAINT]: '喷漆'
};
