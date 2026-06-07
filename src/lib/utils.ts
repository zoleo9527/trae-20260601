import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd HH:mm') {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: zhCN });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getBottleReturnStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending_collection: '待回收',
    collected: '已回收',
    returned_to_station: '已运回站点',
    verified: '已核验',
    disputed: '有争议',
    stuck: '已卡住',
    rejected: '已退回',
  };
  return statusMap[status] || status;
}

export function getDepositStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待核对',
    matched: '核对一致',
    mismatched: '核对不一致',
    pending_verification: '待核验',
    verified: '已核验',
    disputed: '有争议',
    stuck: '已卡住',
  };
  return statusMap[status] || status;
}

export function getBottleReturnStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending_collection: 'bg-yellow-100 text-yellow-800',
    collected: 'bg-blue-100 text-blue-800',
    returned_to_station: 'bg-purple-100 text-purple-800',
    verified: 'bg-green-100 text-green-800',
    disputed: 'bg-red-100 text-red-800',
    stuck: 'bg-orange-100 text-orange-800',
    rejected: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

export function getDepositStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    matched: 'bg-green-100 text-green-800',
    mismatched: 'bg-red-100 text-red-800',
    pending_verification: 'bg-blue-100 text-blue-800',
    verified: 'bg-emerald-100 text-emerald-800',
    disputed: 'bg-rose-100 text-rose-800',
    stuck: 'bg-orange-100 text-orange-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

export function getAlertTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    stuck_bottle: '空瓶回收卡住',
    stuck_deposit: '押金核对卡住',
    mismatched_deposit: '押金核对不一致',
    disputed: '存在争议',
  };
  return typeMap[type] || type;
}

export function getAlertPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };
  return colorMap[priority] || 'bg-gray-500';
}

export function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    station_clerk: '站点文员',
    delivery_person: '配送员',
    customer_service: '客服',
  };
  return roleMap[role] || role;
}

export function getOperationTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    bottle_collect: '回收空瓶',
    bottle_return_station: '运回站点',
    bottle_verify: '核验空瓶',
    bottle_dispute: '发起争议',
    bottle_reject: '退回回收',
    bottle_stick: '标记卡住',
    bottle_unstick: '解除卡住',
    deposit_init: '发起核对',
    deposit_match: '核对一致',
    deposit_mismatch: '核对不一致',
    deposit_verify: '核验押金',
    deposit_dispute: '发起争议',
    deposit_stick: '标记卡住',
    deposit_unstick: '解除卡住',
    acknowledge_alert: '确认提醒',
    resolve_alert: '解决提醒',
  };
  return typeMap[type] || type;
}
