export enum CompensationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export const CompensationStatusDescription: Record<CompensationStatus, string> = {
  [CompensationStatus.PENDING]: '待审核',
  [CompensationStatus.PROCESSING]: '处理中',
  [CompensationStatus.APPROVED]: '已批准',
  [CompensationStatus.PAID]: '已支付',
  [CompensationStatus.COMPLETED]: '已完成',
  [CompensationStatus.CANCELLED]: '已取消'
};

export const CompensationStatusTransitions: Record<CompensationStatus, CompensationStatus[]> = {
  [CompensationStatus.PENDING]: [CompensationStatus.PROCESSING, CompensationStatus.CANCELLED],
  [CompensationStatus.PROCESSING]: [CompensationStatus.APPROVED, CompensationStatus.CANCELLED],
  [CompensationStatus.APPROVED]: [CompensationStatus.PAID],
  [CompensationStatus.PAID]: [CompensationStatus.COMPLETED],
  [CompensationStatus.COMPLETED]: [],
  [CompensationStatus.CANCELLED]: [CompensationStatus.PENDING]
};

export default CompensationStatus;