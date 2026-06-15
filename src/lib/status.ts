import { RepairStatus, AppointmentStatus, PartRequestStatus, Role } from '@/lib/enums';

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  [RepairStatus.PENDING]: '待受理',
  [RepairStatus.ACCEPTED]: '已受理',
  [RepairStatus.ASSIGNED]: '已分配',
  [RepairStatus.APPOINTMENT_SCHEDULED]: '已预约',
  [RepairStatus.ENGINEER_DISPATCHED]: '工程师已出发',
  [RepairStatus.DIAGNOSIS_DONE]: '检测完成',
  [RepairStatus.PARTS_REQUESTED]: '待配件',
  [RepairStatus.PARTS_DELIVERED]: '配件已送达',
  [RepairStatus.REPAIR_IN_PROGRESS]: '维修中',
  [RepairStatus.REPAIR_COMPLETED]: '维修完成',
  [RepairStatus.CUSTOMER_CONFIRMED]: '客户已确认',
  [RepairStatus.CLOSED]: '已关闭',
  [RepairStatus.CANCELLED]: '已取消',
};

export const REPAIR_STATUS_COLORS: Record<RepairStatus, string> = {
  [RepairStatus.PENDING]: 'bg-gray-100 text-gray-700',
  [RepairStatus.ACCEPTED]: 'bg-blue-100 text-blue-700',
  [RepairStatus.ASSIGNED]: 'bg-yellow-100 text-yellow-700',
  [RepairStatus.APPOINTMENT_SCHEDULED]: 'bg-purple-100 text-purple-700',
  [RepairStatus.ENGINEER_DISPATCHED]: 'bg-cyan-100 text-cyan-700',
  [RepairStatus.DIAGNOSIS_DONE]: 'bg-indigo-100 text-indigo-700',
  [RepairStatus.PARTS_REQUESTED]: 'bg-orange-100 text-orange-700',
  [RepairStatus.PARTS_DELIVERED]: 'bg-teal-100 text-teal-700',
  [RepairStatus.REPAIR_IN_PROGRESS]: 'bg-pink-100 text-pink-700',
  [RepairStatus.REPAIR_COMPLETED]: 'bg-green-100 text-green-700',
  [RepairStatus.CUSTOMER_CONFIRMED]: 'bg-emerald-100 text-emerald-700',
  [RepairStatus.CLOSED]: 'bg-slate-100 text-slate-600',
  [RepairStatus.CANCELLED]: 'bg-red-100 text-red-700',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: '已预约',
  [AppointmentStatus.CONFIRMED]: '已确认',
  [AppointmentStatus.IN_PROGRESS]: '进行中',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.RESCHEDULED]: '已改期',
  [AppointmentStatus.CANCELLED]: '已取消',
};

export const PART_REQUEST_STATUS_LABELS: Record<PartRequestStatus, string> = {
  [PartRequestStatus.PENDING]: '待审批',
  [PartRequestStatus.APPROVED]: '已批准',
  [PartRequestStatus.REJECTED]: '已拒绝',
  [PartRequestStatus.DELIVERED]: '已出库',
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.CUSTOMER_SERVICE]: '客服',
  [Role.ENGINEER]: '维修工程师',
  [Role.PARTS_ADMIN]: '配件管理员',
};

export const PRIORITY_LABELS: Record<string, string> = {
  URGENT: '紧急',
  HIGH: '高',
  NORMAL: '普通',
  LOW: '低',
};

export const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  NORMAL: 'bg-blue-500 text-white',
  LOW: 'bg-gray-400 text-white',
};

export function formatDate(date: Date) {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateOrderNo() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 900) + 100);
  return `WX${date}${random}`;
}
