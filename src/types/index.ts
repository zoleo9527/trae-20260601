export interface Order {
  id: number;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  serviceAddress: string;
  serviceDate: string;
  serviceTime: string;
  status: string;
  createdAt: string;
  blockReason?: string;
  assignedStaffId?: number;
  currentHandler?: {
    name: string;
    role: string;
    status: string;
  } | null;
  nextAction?: string;
}

export interface Staff {
  id: number;
  staffNo: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

export interface Scheduling {
  id: number;
  orderId: number;
  staffId: number;
  scheduleDate: string;
  scheduleTime: string;
  status: string;
  createdAt: string;
  remark?: string;
  orderNo?: string;
  customerName?: string;
  serviceAddress?: string;
  staffName?: string;
  staffNo?: string;
  staffPhone?: string;
  staffRole?: string;
  staffStatus?: string;
}

export interface Checkin {
  id: number;
  schedulingId: number;
  staffId: number;
  checkinTime: string;
  status: string;
  remark: string;
  notArrivedReason?: string;
  orderId?: number;
  scheduleDate?: string;
  scheduleTime?: string;
  staffName?: string;
  staffRole?: string;
  staffStatus?: string;
}

export interface OperationLog {
  id: number;
  orderId: number;
  operatorId: number;
  operatorName: string;
  operatorRole?: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface Handler {
  id: number;
  name: string;
  role: string;
  status: string;
  currentAction: string;
}

export interface OrderDetail {
  order: Order;
  schedule: Scheduling | null;
  checkin: Checkin | null;
  logs: OperationLog[];
  handlers: {
    customerService: Handler | null;
    housekeeper: Handler | null;
    qcSupervisor: Handler | null;
  };
}

export type StatusType = '待排班' | '已排班' | '待确认' | '已到岗' | '服务中' | '已完成';

export const STATUS_COLORS: Record<string, string> = {
  '待排班': 'bg-gray-100 text-gray-600',
  '已排班': 'bg-blue-100 text-blue-600',
  '待确认': 'bg-yellow-100 text-yellow-600',
  '已到岗': 'bg-green-100 text-green-600',
  '服务中': 'bg-purple-100 text-purple-600',
  '已完成': 'bg-gray-100 text-gray-600',
};

export const STATUS_BADGE_COLORS: Record<string, string> = {
  '待排班': 'bg-gray-500',
  '已排班': 'bg-blue-500',
  '待确认': 'bg-yellow-500',
  '已到岗': 'bg-green-500',
  '服务中': 'bg-purple-500',
  '已完成': 'bg-gray-400',
};

export const ROLE_COLORS: Record<string, string> = {
  '客服': 'bg-blue-100 text-blue-600',
  '家政员': 'bg-green-100 text-green-600',
  '质检主管': 'bg-purple-100 text-purple-600',
};