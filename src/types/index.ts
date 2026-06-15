export type WorkOrderStatus = 
  | 'pending' 
  | 'assigned' 
  | 'diagnosing' 
  | 'waiting_parts' 
  | 'repairing' 
  | 'signoff_pending' 
  | 'completed' 
  | 'cancelled';

export type Priority = 'high' | 'medium' | 'low';

export type SignOffStatus = 'pending' | 'approved' | 'rejected';

export interface WorkOrderPart {
  id: string;
  partId: string;
  partNo: string;
  name: string;
  specification: string;
  quantity: number;
  status: 'applied' | 'issued' | 'used';
}

export interface MaintenanceRecord {
  id: string;
  type: string;
  date: string;
  technician: string;
  content: string;
}

export interface SignOff {
  id: string;
  workorderId: string;
  technician: string;
  technicianName: string;
  content: string;
  partsUsed: string[];
  workingHours: number;
  applyTime: string;
  status: SignOffStatus;
  approver?: string;
  approverName?: string;
  approveTime?: string;
  remark?: string;
  attachments: string[];
}

export interface WorkOrder {
  id: string;
  equipmentId: string;
  equipmentNo: string;
  customerName: string;
  model: string;
  faultDescription: string;
  status: WorkOrderStatus;
  priority: Priority;
  assignee: string;
  assigneeName: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletionTime: string;
  parts: WorkOrderPart[];
  signOff?: SignOff;
  maintenanceRecords: MaintenanceRecord[];
}

export interface Equipment {
  id: string;
  equipmentNo: string;
  model: string;
  customerName: string;
  purchaseDate: string;
  lastMaintenanceDate: string;
  status: 'active' | 'inactive';
  maintenancePlans: MaintenancePlan[];
}

export interface MaintenancePlan {
  id: string;
  equipmentId: string;
  type: string;
  nextDueDate: string;
  status: 'pending' | 'overdue' | 'completed';
}

export interface Part {
  id: string;
  partNo: string;
  name: string;
  specification: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface User {
  id: string;
  name: string;
  role: 'manager' | 'technician' | 'warehouse';
  email: string;
}

export interface PartRequest {
  partId: string;
  quantity: number;
}

export interface SignOffData {
  content: string;
  partsUsed: string[];
  workingHours: number;
  attachments: string[];
}

export const STATUS_MAP: Record<WorkOrderStatus, string> = {
  pending: '待处理',
  assigned: '已分配',
  diagnosing: '诊断中',
  waiting_parts: '等待配件',
  repairing: '维修中',
  signoff_pending: '待签认',
  completed: '已完成',
  cancelled: '已取消',
};

export const PRIORITY_MAP: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const SIGN_OFF_STATUS_MAP: Record<SignOffStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};

export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  diagnosing: 'bg-purple-100 text-purple-800 border-purple-300',
  waiting_parts: 'bg-pink-100 text-pink-800 border-pink-300',
  repairing: 'bg-orange-100 text-orange-800 border-orange-300',
  signoff_pending: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-300',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'bg-red-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-gray-500 text-white',
};
