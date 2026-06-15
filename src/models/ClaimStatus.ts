export enum ClaimStatus {
  PENDING = 'PENDING',
  TECHNICIAN_REVIEW = 'TECHNICIAN_REVIEW',
  TECHNICIAN_APPROVED = 'TECHNICIAN_APPROVED',
  MANAGER_REVIEW = 'MANAGER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPENSATION_PROCESSING = 'COMPENSATION_PROCESSING',
  COMPLETED = 'COMPLETED'
}

export const ClaimStatusDescription: Record<ClaimStatus, string> = {
  [ClaimStatus.PENDING]: '待处理',
  [ClaimStatus.TECHNICIAN_REVIEW]: '技师审核中',
  [ClaimStatus.TECHNICIAN_APPROVED]: '技师已通过',
  [ClaimStatus.MANAGER_REVIEW]: '店长审核中',
  [ClaimStatus.APPROVED]: '已批准',
  [ClaimStatus.REJECTED]: '已拒绝',
  [ClaimStatus.COMPENSATION_PROCESSING]: '补偿处理中',
  [ClaimStatus.COMPLETED]: '已完成'
};

export const ClaimStatusTransitions: Record<ClaimStatus, ClaimStatus[]> = {
  [ClaimStatus.PENDING]: [ClaimStatus.TECHNICIAN_REVIEW, ClaimStatus.REJECTED],
  [ClaimStatus.TECHNICIAN_REVIEW]: [ClaimStatus.TECHNICIAN_APPROVED, ClaimStatus.REJECTED],
  [ClaimStatus.TECHNICIAN_APPROVED]: [ClaimStatus.MANAGER_REVIEW, ClaimStatus.REJECTED],
  [ClaimStatus.MANAGER_REVIEW]: [ClaimStatus.APPROVED, ClaimStatus.REJECTED],
  [ClaimStatus.APPROVED]: [ClaimStatus.COMPENSATION_PROCESSING],
  [ClaimStatus.REJECTED]: [ClaimStatus.PENDING],
  [ClaimStatus.COMPENSATION_PROCESSING]: [ClaimStatus.COMPLETED, ClaimStatus.APPROVED],
  [ClaimStatus.COMPLETED]: []
};

export default ClaimStatus;