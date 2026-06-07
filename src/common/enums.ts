export enum StaffRole {
  STATION_CLERK = 'station_clerk',
  DELIVERY_STAFF = 'delivery_staff',
  CUSTOMER_SERVICE = 'customer_service',
}

export enum MilkChangeStatus {
  PENDING_CLERK = 'pending_clerk',
  CLERK_PROCESSING = 'clerk_processing',
  PENDING_DELIVERY = 'pending_delivery',
  DELIVERY_IN_PROGRESS = 'delivery_in_progress',
  PENDING_CUSTOMER_SERVICE = 'pending_customer_service',
  CUSTOMER_SERVICE_PROCESSING = 'customer_service_processing',
  RETURNED = 'returned',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum MilkChangeType {
  ADD_PRODUCT = 'add_product',
  REMOVE_PRODUCT = 'remove_product',
  CHANGE_QUANTITY = 'change_quantity',
  CHANGE_ADDRESS = 'change_address',
  CHANGE_DELIVERY_TIME = 'change_delivery_time',
  PAUSE_DELIVERY = 'pause_delivery',
  RESUME_DELIVERY = 'resume_delivery',
  OTHER = 'other',
}

export enum ReturnReason {
  CUSTOMER_CANCELLED = 'customer_cancelled',
  PRODUCT_UNAVAILABLE = 'product_unavailable',
  ROUTE_CONFLICT = 'route_conflict',
  INSUFFICIENT_INFO = 'insufficient_info',
  NEED_CLERK_CONFIRM = 'need_clerk_confirm',
  NEED_DELIVERY_CONFIRM = 'need_delivery_confirm',
  OTHER = 'other',
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  APPROVE = 'approve',
  REJECT = 'reject',
  RETURN = 'return',
  COMPLETE = 'complete',
  TRANSFER = 'transfer',
  COMMENT = 'comment',
  ROUTE_ADJUST = 'route_adjust',
}

export const StaffRoleLabel: Record<StaffRole, string> = {
  [StaffRole.STATION_CLERK]: '站点文员',
  [StaffRole.DELIVERY_STAFF]: '配送员',
  [StaffRole.CUSTOMER_SERVICE]: '客服',
};

export const MilkChangeStatusLabel: Record<MilkChangeStatus, string> = {
  [MilkChangeStatus.PENDING_CLERK]: '待文员处理',
  [MilkChangeStatus.CLERK_PROCESSING]: '文员处理中',
  [MilkChangeStatus.PENDING_DELIVERY]: '待配送员确认',
  [MilkChangeStatus.DELIVERY_IN_PROGRESS]: '配送员执行中',
  [MilkChangeStatus.PENDING_CUSTOMER_SERVICE]: '待客服处理',
  [MilkChangeStatus.CUSTOMER_SERVICE_PROCESSING]: '客服处理中',
  [MilkChangeStatus.RETURNED]: '已退回',
  [MilkChangeStatus.COMPLETED]: '已完成',
  [MilkChangeStatus.OVERDUE]: '已逾期',
  [MilkChangeStatus.CANCELLED]: '已取消',
};

export const MilkChangeTypeLabel: Record<MilkChangeType, string> = {
  [MilkChangeType.ADD_PRODUCT]: '增加产品',
  [MilkChangeType.REMOVE_PRODUCT]: '减少产品',
  [MilkChangeType.CHANGE_QUANTITY]: '变更数量',
  [MilkChangeType.CHANGE_ADDRESS]: '变更地址',
  [MilkChangeType.CHANGE_DELIVERY_TIME]: '变更配送时间',
  [MilkChangeType.PAUSE_DELIVERY]: '暂停配送',
  [MilkChangeType.RESUME_DELIVERY]: '恢复配送',
  [MilkChangeType.OTHER]: '其他',
};

export const ReturnReasonLabel: Record<ReturnReason, string> = {
  [ReturnReason.CUSTOMER_CANCELLED]: '客户取消',
  [ReturnReason.PRODUCT_UNAVAILABLE]: '产品不可用',
  [ReturnReason.ROUTE_CONFLICT]: '路线冲突',
  [ReturnReason.INSUFFICIENT_INFO]: '信息不全',
  [ReturnReason.NEED_CLERK_CONFIRM]: '需文员确认',
  [ReturnReason.NEED_DELIVERY_CONFIRM]: '需配送员确认',
  [ReturnReason.OTHER]: '其他',
};
