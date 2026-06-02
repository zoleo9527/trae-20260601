export const EmployeeRole = {
  WAREHOUSE_SUPERVISOR: 'WAREHOUSE_SUPERVISOR',
  PICKER: 'PICKER',
  REVIEWER: 'REVIEWER',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
} as const;

export type EmployeeRoleType = typeof EmployeeRole[keyof typeof EmployeeRole];

export const OrderStatus = {
  PENDING: 'PENDING',
  WAVE_ASSIGNED: 'WAVE_ASSIGNED',
  PICKING: 'PICKING',
  PICKED: 'PICKED',
  REVIEWING: 'REVIEWING',
  REVIEWED: 'REVIEWED',
  SHIPPED: 'SHIPPED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

export const WaveStatus = {
  CREATED: 'CREATED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type WaveStatusType = typeof WaveStatus[keyof typeof WaveStatus];

export const PickTaskStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  PICKING: 'PICKING',
  PICKED: 'PICKED',
  CANCELLED: 'CANCELLED',
} as const;

export type PickTaskStatusType = typeof PickTaskStatus[keyof typeof PickTaskStatus];

export const PackageStatus = {
  CREATED: 'CREATED',
  REVIEWING: 'REVIEWING',
  REVIEWED: 'REVIEWED',
  SHIPPED: 'SHIPPED',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
} as const;

export type PackageStatusType = typeof PackageStatus[keyof typeof PackageStatus];

export const ReviewStatus = {
  PASSED: 'PASSED',
  REJECTED: 'REJECTED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
} as const;

export type ReviewStatusType = typeof ReviewStatus[keyof typeof ReviewStatus];

export const FeedbackType = {
  MISSING_ITEM: 'MISSING_ITEM',
  WRONG_SKU: 'WRONG_SKU',
  DAMAGED: 'DAMAGED',
  WRONG_ADDRESS: 'WRONG_ADDRESS',
  OTHER: 'OTHER',
} as const;

export type FeedbackTypeType = typeof FeedbackType[keyof typeof FeedbackType];

export const FeedbackStatus = {
  SUBMITTED: 'SUBMITTED',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type FeedbackStatusType = typeof FeedbackStatus[keyof typeof FeedbackStatus];

export interface CreateWaveRequest {
  name?: string;
  orderIds: string[];
  createdById: string;
}

export interface AssignPickTaskRequest {
  taskId: string;
  pickerId: string;
}

export interface CompletePickTaskRequest {
  taskId: string;
  pickerId: string;
  pickedQuantity: number;
}

export interface CreatePackageRequest {
  orderId: string;
  items: Array<{
    productId: string;
    expectedProductId?: string;
    quantity: number;
  }>;
  weight?: number;
}

export interface ReviewPackageRequest {
  packageId: string;
  reviewerId: string;
  items: Array<{
    productId: string;
    expectedProductId?: string;
    expectedQty: number;
    actualQty: number;
  }>;
  notes?: string;
}

export interface CreateFeedbackRequest {
  packageId: string;
  type: FeedbackTypeType;
  description: string;
  reportedByCustomer: string;
  customerPhone: string;
}

export interface TraceFeedbackRequest {
  feedbackId: string;
  handledById: string;
  rootCauseWaveId?: string;
  rootCausePickTaskId?: string;
  resolution: string;
}
