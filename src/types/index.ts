export type OrderStatus = 'reserved' | 'transporting' | 'serving' | 'pending' | 'settling' | 'completed' | 'dispute';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  addressFrom: string;
  addressTo: string;
  scheduledTime: string;
  status: OrderStatus;
  vehicleId?: string;
  driverName?: string;
  baseFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface Addon {
  id: string;
  orderId: string;
  type: string;
  quantity: number;
  unitPrice: number;
  description?: string;
  operatorId: string;
  createdAt: string;
}

export interface Damage {
  id: string;
  orderId: string;
  description: string;
  value: number;
  responsibility: string;
  photos: string[];
  createdAt: string;
}

export interface Expense {
  id: string;
  orderId: string;
  baseFee: number;
  addonFee: number;
  damageFee: number;
  totalFee: number;
  status: ExpenseStatus;
  confirmedAt?: string;
}

export interface OperationLog {
  id: string;
  orderId: string;
  action: string;
  operator: string;
  timestamp: string;
  details?: string;
}

export interface Exception {
  id: string;
  orderId: string;
  type: 'late' | 'damage' | 'dispute' | 'unconfirmed';
  message: string;
  severity: 'warning' | 'error' | 'critical';
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export type UserRole = 'dispatcher' | 'teamLead' | 'customerService';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface CreateOrderRequest {
  customerName: string;
  phone: string;
  addressFrom: string;
  addressTo: string;
  scheduledTime: string;
  baseFee: number;
}

export interface AddAddonRequest {
  type: string;
  quantity: number;
  unitPrice: number;
  description?: string;
  operatorId: string;
}

export interface ReportExceptionRequest {
  type: 'late' | 'damage' | 'dispute';
  message: string;
  photos?: string[];
}
