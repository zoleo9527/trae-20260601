export type Role = 'manager' | 'dispatcher' | 'repairer';

export type AnomalyType = 'material_missing' | 'overdue' | 'fuel_dispute' | 'liability_dispute' | 'review_failed';

export type AnomalyStatus = 'pending' | 'processing' | 'resolved';

export interface Equipment {
  id: string;
  name: string;
  model: string;
  plateNumber: string;
  dailyRate: number;
  status: 'available' | 'in_use' | 'repairing';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  company: string;
}

export interface Reservation {
  id: string;
  equipmentId: string;
  customerId: string;
  reservationNo: string;
  startDate: string;
  expectedEndDate: string;
  purpose: string;
  status: 'pending' | 'material_verified' | 'dispatched' | 'delivered' | 'completed' | 'cancelled';
  materials: string[];
  materialVerified: boolean;
  missingMaterials: string[];
  currentHandler: Role;
}

export interface Contract {
  id: string;
  reservationId: string;
  contractNo: string;
  actualStartDate: string;
  actualEndDate: string | null;
  initialFuel: number;
  returnFuel: number | null;
  totalAmount: number | null;
  status: 'active' | 'returned' | 'fuel_verified' | 'completed' | 'overdue';
  fuelDispute: boolean;
  fuelDisputeReason: string;
  overdueDays: number;
  overdueFee: number;
}

export interface Repair {
  id: string;
  contractId: string;
  repairNo: string;
  reportDate: string;
  faultDescription: string;
  repairContent: string;
  partsReplaced: string[];
  repairCost: number;
  liability: 'customer' | 'owner' | 'natural' | null;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewComment: string;
  repairer: string;
  photos: string[];
}

export interface Anomaly {
  id: string;
  sourceType: 'reservation' | 'contract' | 'repair';
  sourceId: string;
  type: AnomalyType;
  description: string;
  status: AnomalyStatus;
  createdAt: string;
  currentHandler: Role;
  stuckHours: number;
  comments: string;
}

export interface TimelineLog {
  id: string;
  sourceType: 'reservation' | 'contract' | 'repair';
  sourceId: string;
  action: string;
  operator: string;
  role: Role;
  timestamp: string;
  remark: string;
}

export interface AppState {
  currentRole: Role;
  reservations: Reservation[];
  contracts: Contract[];
  repairs: Repair[];
  anomalies: Anomaly[];
  equipments: Equipment[];
  customers: Customer[];
  timelineLogs: TimelineLog[];
}

export interface FilterOptions {
  type?: AnomalyType | 'all';
  handler?: Role | 'all';
  dateRange?: [string, string];
  search?: string;
}

export interface OverdueInfo {
  isOverdue: boolean;
  overdueDays: number;
  daysLeft: number;
  overdueFee: number;
  expectedEndDate: string;
  today: string;
}

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  material_missing: '缺材料',
  overdue: '超时未还',
  fuel_dispute: '油耗争议',
  liability_dispute: '维修责任',
  review_failed: '复核不通过',
};

export const ANOMALY_TYPE_COLORS: Record<AnomalyType, string> = {
  material_missing: 'bg-yellow-500',
  overdue: 'bg-orange-500',
  fuel_dispute: 'bg-purple-500',
  liability_dispute: 'bg-red-500',
  review_failed: 'bg-rose-600',
};

export const ROLE_LABELS: Record<Role, string> = {
  manager: '租赁经理',
  dispatcher: '调度',
  repairer: '维修师傅',
};

export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};
