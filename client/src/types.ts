export type Role = 'WAREHOUSE' | 'QUALITY' | 'MANAGER';

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PRODUCING'
  | 'READY'
  | 'LOADING'
  | 'LOADED'
  | 'DELIVERED'
  | 'EXCEPTION';

export type ExceptionType = 
  | 'FORMULA_DEVIATION'
  | 'BATCH_LABEL_ERROR'
  | 'WEIGHT_GAIN_COMPLAINT'
  | 'OTHER';

export type ExceptionStatus = 
  | 'REPORTED'
  | 'PROCESSING'
  | 'RESOLVED'
  | 'CLOSED';

export interface Customer {
  customerId: string;
  customerName: string;
  contact: string;
  phone: string;
  address: string;
  type: 'FARM' | 'DEALER' | 'DIRECT';
  scale: string;
  breedingType: string;
  createdAt: string;
}

export interface FormulaIngredient {
  ingredientId: string;
  ingredientName: string;
  ratio: number;
  unit: string;
}

export interface Formula {
  formulaId: string;
  formulaName: string;
  targetAnimal: string;
  stage: string;
  ingredients: FormulaIngredient[];
  totalRatio: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedBatch {
  batchId: string;
  formulaId: string;
  formulaName: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expiryDate: string;
  status: 'PRODUCED' | 'STORED' | 'USED';
}

export interface FeedingRecord {
  recordId: string;
  orderId: string;
  batchId: string;
  formulaId: string;
  actualIngredients: {
    ingredientId: string;
    ingredientName: string;
    plannedAmount: number;
    actualAmount: number;
    deviation: number;
    unit: string;
  }[];
  operator: string;
  operatedAt: string;
  remarks: string;
}

export interface OrderItem {
  itemId: string;
  formulaId: string;
  formulaName: string;
  quantity: number;
  unit: string;
  price: number;
  totalAmount: number;
  batches: FeedBatch[];
}

export interface CustomerOrder {
  orderId: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  confirmedAt?: string;
  loadingAt?: string;
  deliveredAt?: string;
  createdBy: string;
  confirmedBy?: string;
  loadedBy?: string;
  deliveryAddress: string;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  remarks: string;
}

export interface LoadingRecord {
  loadingId: string;
  orderId: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  items: {
    itemId: string;
    formulaName: string;
    batchId: string;
    batchNo: string;
    quantity: number;
    unit: string;
    checked: boolean;
    discrepancy?: string;
  }[];
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  loadingTime: string;
  checker: string;
  status: 'CHECKING' | 'PASSED' | 'REJECTED';
  remarks: string;
  discrepancies: string[];
}

export interface ExceptionRecord {
  exceptionId: string;
  orderId?: string;
  batchId?: string;
  customerId?: string;
  type: ExceptionType;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ExceptionStatus;
  reportedBy: string;
  reportedAt: string;
  handledBy?: string;
  handledAt?: string;
  resolution?: string;
  relatedOrders: string[];
  relatedBatches: string[];
}

export interface StatsSummary {
  totalOrders: number;
  pendingOrders: number;
  readyOrders: number;
  loadedOrders: number;
  deliveredOrders: number;
  totalExceptions: number;
  pendingExceptions: number;
  resolvedExceptions: number;
}

export const RoleNames: Record<Role, string> = {
  WAREHOUSE: '仓库管理员',
  QUALITY: '质检员',
  MANAGER: '管理人员'
};

export const OrderStatusNames: Record<OrderStatus, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  PRODUCING: '生产中',
  READY: '待装车',
  LOADING: '装车中',
  LOADED: '已装车',
  DELIVERED: '已交付',
  EXCEPTION: '异常'
};

export const OrderStatusColors: Record<OrderStatus, string> = {
  PENDING: 'default',
  CONFIRMED: 'processing',
  PRODUCING: 'processing',
  READY: 'warning',
  LOADING: 'processing',
  LOADED: 'success',
  DELIVERED: 'success',
  EXCEPTION: 'error'
};

export const ExceptionTypeNames: Record<ExceptionType, string> = {
  FORMULA_DEVIATION: '投料偏差',
  BATCH_LABEL_ERROR: '批次标签错误',
  WEIGHT_GAIN_COMPLAINT: '增重慢投诉',
  OTHER: '其他异常'
};

export const ExceptionStatusNames: Record<ExceptionStatus, string> = {
  REPORTED: '已上报',
  PROCESSING: '处理中',
  RESOLVED: '已解决',
  CLOSED: '已关闭'
};

export const SeverityNames: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '严重'
};

export const SeverityColors: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red'
};