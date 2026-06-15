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
  orderNo?: string;
  customerName?: string;
  serviceAddress?: string;
  staffName?: string;
  staffRole?: string;
}

export interface Checkin {
  id: number;
  schedulingId: number;
  staffId: number;
  checkinTime: string;
  status: string;
  remark: string;
  orderId?: number;
  scheduleDate?: string;
  scheduleTime?: string;
  staffName?: string;
  staffRole?: string;
}

export interface OperationLog {
  id: number;
  orderId: number;
  operatorId: number;
  operatorName: string;
  action: string;
  detail: string;
  createdAt: string;
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
