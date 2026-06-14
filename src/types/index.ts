export type OrderStatus = 'pending' | 'dispatched' | 'in_progress' | 'completed' | 'suspended' | 'cancelled';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type TechnicianStatus = 'available' | 'busy' | 'offline' | 'break';
export type DispatchStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type DispatchResult = 'success' | 'partial' | 'failed';
export type ExceptionType = 'wrong_model' | 'warranty_dispute' | 'inventory_issue' | 'other';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionStatus = 'open' | 'analyzing' | 'handling' | 'resolved' | 'escalated' | 'closed';

export interface Vehicle {
  plateNo: string;
  brand: string;
  model: string;
  year: string;
  vin: string;
  mileage: number;
}

export interface Tire {
  brand: string;
  model: string;
  spec: string;
  pattern: string;
  quantity: number;
  price: number;
}

export interface Installation {
  technicianId: string;
  startTime?: Date;
  endTime?: Date;
  position: string[];
  result?: string;
}

export interface OperationLog {
  id: string;
  entityType: 'work_order' | 'dispatch' | 'exception';
  entityId: string;
  operator: {
    id: string;
    name: string;
    role: string;
  };
  action: string;
  timestamp: Date;
  changes?: {
    field: string;
    before: any;
    after: any;
  }[];
  metadata?: Record<string, any>;
}

export interface Exception {
  id: string;
  workOrderId: string;
  type: ExceptionType;
  description: string;
  severity: Severity;
  discoveredAt: Date;
  discoveredBy: string;
  details: {
    expected?: string;
    actual?: string;
    evidence?: string[];
  };
  analysis?: {
    reason: string;
    measures: string;
    handledBy?: string;
    handledAt?: Date;
    result?: string;
  };
  status: ExceptionStatus;
  escalation?: {
    escalatedTo?: string;
    escalatedAt?: Date;
    reason?: string;
  };
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  status: OrderStatus;
  priority: Priority;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle: Vehicle;
  tires: Tire[];
  installation: Installation;
  dispatchId?: string;
  exceptions: Exception[];
  logs: OperationLog[];
}

export interface Dispatch {
  id: string;
  dispatchNo: string;
  workOrderId: string;
  technicianId: string;
  dispatchType: 'auto' | 'manual';
  dispatcherId?: string;
  dispatchedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  status: DispatchStatus;
  result?: DispatchResult;
  notes?: string;
}

export interface Technician {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  role: 'technician' | 'senior_technician' | 'foreman';
  status: TechnicianStatus;
  specialties: string[];
  stats: {
    todayOrders: number;
    weekOrders: number;
    avgCompletionTime: number;
  };
  currentOrderId?: string;
}
