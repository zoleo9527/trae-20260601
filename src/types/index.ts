export type OrderStatus = 'pending' | 'locked' | 'allocated' | 'picked' | 'loaded' | 'in_transit' | 'delivered' | 'signed' | 'completed' | 'cancelled';

export type LockStatus = 'pending' | 'locked' | 'released' | 'partial';

export type LocationStatus = 'empty' | 'occupied' | 'reserved' | 'locked';

export type DeliveryStatus = 'pending' | 'loaded' | 'in_transit' | 'delivered' | 'signed';

export type Role = 'warehouse_manager' | 'driver' | 'customer_service';

export type OperationType = 'lock' | 'unlock' | 'allocate' | 'deallocate' | 'pick' | 'load' | 'deliver' | 'sign' | 'complete';

export interface User {
  id: string;
  name: string;
  role: Role;
  phone: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  spec: string;
  unit: string;
  quantity: number;
  lockedQuantity: number;
  allocatedQuantity: number;
  pickedQuantity: number;
  loadedQuantity: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  lockStatus: LockStatus;
  createdAt: string;
  updatedAt: string;
  lockedBy?: string;
  lockedAt?: string;
  allocatedBy?: string;
  allocatedAt?: string;
  pickedBy?: string;
  pickedAt?: string;
  driverId?: string;
  loadedBy?: string;
  loadedAt?: string;
  deliveredAt?: string;
  signedBy?: string;
  signedAt?: string;
  notes?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  riskReason?: string;
}

export interface Location {
  id: string;
  code: string;
  zone: string;
  row: string;
  shelf: string;
  level: string;
  status: LocationStatus;
  capacity: number;
  currentQty: number;
  productId?: string;
  orderId?: string;
  updatedAt: string;
  allocatedBy?: string;
  allocatedAt?: string;
}

export interface AllocationRecord {
  id: string;
  orderId: string;
  orderNo: string;
  locationId: string;
  locationCode: string;
  productId: string;
  productName: string;
  quantity: number;
  allocatedBy: string;
  allocatedAt: string;
  releasedAt?: string;
  releasedBy?: string;
}

export interface DeliveryNote {
  id: string;
  orderId: string;
  orderNo: string;
  driverId: string;
  driverName: string;
  vehicleNo: string;
  status: DeliveryStatus;
  loadedAt?: string;
  departedAt?: string;
  deliveredAt?: string;
  signedBy?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  signatureImage?: string;
}

export interface OperationLog {
  id: string;
  orderId: string;
  orderNo: string;
  operationType: OperationType;
  operatorId: string;
  operatorName: string;
  operatorRole: Role;
  description: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface LockRequest {
  orderId: string;
  items: { itemId: string; quantity: number }[];
  operatorId: string;
  notes?: string;
}

export interface AllocationRequest {
  orderId: string;
  items: { itemId: string; locationId: string; quantity: number }[];
  operatorId: string;
}

export interface PickRequest {
  orderId: string;
  items: { itemId: string; quantity: number }[];
  operatorId: string;
}

export interface LoadRequest {
  orderId: string;
  driverId: string;
  vehicleNo: string;
}

export interface DeliveryRequest {
  deliveryNoteId: string;
  deliveredAt: string;
  signatureImage?: string;
}

export interface IdempotencyKey {
  key: string;
  requestBody: string;
  responseBody: string;
  createdAt: string;
  expiresAt: string;
}

export interface TaskAssignment {
  orderId: string;
  orderNo: string;
  assigneeId: string;
  assigneeName: string;
  assigneeRole: Role;
  taskType: 'lock' | 'allocate' | 'pick' | 'deliver' | 'sign';
  status: 'pending' | 'in_progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  pending: '待处理',
  locked: '已锁货',
  allocated: '已分配库位',
  picked: '已拣货',
  loaded: '已装车',
  in_transit: '运输中',
  delivered: '已送达',
  signed: '已签收',
  completed: '已完成',
  cancelled: '已取消',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'orange',
  locked: 'blue',
  allocated: 'purple',
  picked: 'cyan',
  loaded: 'gold',
  in_transit: 'lime',
  delivered: 'green',
  signed: 'success',
  completed: 'gray',
  cancelled: 'red',
};

export const LOCK_STATUS_MAP: Record<LockStatus, string> = {
  pending: '待锁货',
  locked: '已锁货',
  released: '已释放',
  partial: '部分锁货',
};

export const LOCK_STATUS_COLORS: Record<LockStatus, string> = {
  pending: 'default',
  locked: 'success',
  released: 'default',
  partial: 'warning',
};

export const LOCATION_STATUS_MAP: Record<LocationStatus, string> = {
  empty: '空',
  occupied: '占用',
  reserved: '预留',
  locked: '锁定',
};

export const LOCATION_STATUS_COLORS: Record<LocationStatus, string> = {
  empty: 'default',
  occupied: 'blue',
  reserved: 'orange',
  locked: 'red',
};

export const DELIVERY_STATUS_MAP: Record<DeliveryStatus, string> = {
  pending: '待装车',
  loaded: '已装车',
  in_transit: '运输中',
  delivered: '已送达',
  signed: '已签收',
};

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  pending: 'orange',
  loaded: 'blue',
  in_transit: 'green',
  delivered: 'cyan',
  signed: 'success',
};

export const ROLE_MAP: Record<Role, string> = {
  warehouse_manager: '仓库主管',
  driver: '司机',
  customer_service: '客服',
};

export const OPERATION_TYPE_MAP: Record<OperationType, string> = {
  lock: '锁货',
  unlock: '解锁',
  allocate: '分配库位',
  deallocate: '取消分配',
  pick: '拣货',
  load: '装车',
  deliver: '送达',
  sign: '签收',
  complete: '完成',
};

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['locked', 'cancelled'],
  locked: ['allocated', 'pending', 'cancelled'],
  allocated: ['picked', 'locked', 'cancelled'],
  picked: ['loaded', 'allocated'],
  loaded: ['in_transit', 'picked'],
  in_transit: ['delivered', 'loaded'],
  delivered: ['signed', 'in_transit'],
  signed: ['completed', 'delivered'],
  completed: [],
  cancelled: [],
};

export const ROLE_PERMISSIONS: Record<Role, OperationType[]> = {
  warehouse_manager: ['lock', 'unlock', 'allocate', 'deallocate', 'pick'],
  driver: ['load', 'deliver'],
  customer_service: ['sign', 'complete'],
};

export const MODEL_RELATIONS = {
  Order: {
    hasMany: ['OrderItem', 'OperationLog'],
    hasOne: ['DeliveryNote'],
    belongsTo: [{ model: 'User', as: 'lockedBy' }, { model: 'User', as: 'allocatedBy' }, { model: 'User', as: 'driver' }],
  },
  Location: {
    hasMany: ['AllocationRecord'],
    belongsTo: [{ model: 'Order' }, { model: 'Product' }],
  },
  DeliveryNote: {
    belongsTo: [{ model: 'Order' }, { model: 'User', as: 'driver' }],
  },
  OperationLog: {
    belongsTo: [{ model: 'Order' }, { model: 'User', as: 'operator' }],
  },
};

export const VALIDATION_RULES = {
  order: {
    maxItems: 100,
    maxItemQuantity: 10000,
    minItemQuantity: 1,
  },
  location: {
    maxCapacity: 1000,
    minCapacity: 1,
  },
  lock: {
    mustBePending: true,
    cannotExceedAvailableStock: true,
  },
  allocate: {
    mustBeLocked: true,
    cannotExceedLockedQuantity: true,
    locationMustBeEmptyOrReserved: true,
  },
  pick: {
    mustBeAllocated: true,
    cannotExceedAllocatedQuantity: true,
  },
  load: {
    mustBePicked: true,
    mustHaveDriver: true,
  },
  deliver: {
    mustBeInTransit: true,
  },
  sign: {
    mustBeDelivered: true,
  },
};
