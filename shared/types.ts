export interface Order {
  id: string;
  orderNo: string;
  customer: string;
  flowerType: string;
  spec: string;
  quantity: number;
  unit: string;
  deliveryDate: string;
  status: 'pending' | 'scheduled' | 'packaging' | 'inspected' | 'loading' | 'completed';
  statusText: string;
  bloomForecast: string;
  bloomActual?: string;
  greenhouse: string;
  grower: string;
  createdAt: string;
  updatedAt: string;
  specChanged?: boolean;
  lastSpecChange?: string;
}

export interface PackagingBatch {
  id: string;
  batchNo: string;
  orderId: string;
  orderNo: string;
  customer: string;
  flowerType: string;
  spec: string;
  planQuantity: number;
  actualQuantity?: number;
  status: 'pending' | 'inspecting' | 'inspected' | 'rework';
  statusText: string;
  inspector?: string;
  inspectedAt?: string;
  inspectionResult?: InspectionResult;
  inspectionChanged?: boolean;
  lastInspectionChange?: string;
  greenhouse: string;
  createdAt: string;
}

export interface InspectionResult {
  id: string;
  batchId: string;
  qualifiedQty: number;
  damagedQty: number;
  damageReasons: string[];
  remark?: string;
  inspector: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface LoadingBatch {
  id: string;
  batchId: string;
  batchNo: string;
  orderId: string;
  orderNo: string;
  customer: string;
  flowerType: string;
  spec: string;
  quantity: number;
  qualifiedQty: number;
  damagedQty: number;
  inspectionStatus: 'qualified' | 'damaged' | 'rework';
  inspectionStatusText: string;
  inspectionChanged: boolean;
  lastInspectionChange?: string;
  inspectionRemark?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  statusText: string;
  confirmedAt?: string;
  confirmer?: string;
  deliveryDate: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  operator: string;
  operatorRole: string;
  operatorRoleText: string;
  action: string;
  actionText: string;
  targetType: string;
  targetId: string;
  targetName: string;
  description: string;
  changes?: {
    field: string;
    fieldText: string;
    oldValue: string;
    newValue: string;
  }[];
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  priorityText: string;
  type: string;
  typeText: string;
  targetId: string;
  dueTime?: string;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: 'high' | 'medium' | 'low';
  levelText: string;
  type: string;
  typeText: string;
  targetId: string;
  targetName: string;
  detectedAt: string;
}

export interface DashboardData {
  stats: {
    totalOrders: number;
    pendingInspection: number;
    pendingLoading: number;
    damageRate: number;
  };
  tasks: TaskItem[];
  risks: RiskItem[];
  recentChanges: OperationLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type UserRole = 'grower' | 'sales' | 'packaging';

export interface RoleInfo {
  id: UserRole;
  name: string;
  description: string;
}
