import { DetentionStatus, AppealStatus, UserRole } from '@/types';

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  }
  return `${mins}分钟`;
};

export const detentionStatusMap: Record<DetentionStatus, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  appealed: { label: '已申诉', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  adjusted: { label: '已调整', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const appealStatusMap: Record<AppealStatus, { label: string; color: string }> = {
  pending: { label: '待受理', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  approved: { label: '申诉通过', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: '申诉驳回', color: 'bg-red-100 text-red-700 border-red-200' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const userRoleMap: Record<UserRole, string> = {
  dispatcher: '调度员',
  forklift_foreman: '叉车班长',
  warehouse_clerk: '仓库文员',
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const calculateDetentionFee = (detentionHours: number, ratePerHour: number = 100): number => {
  return Math.round(detentionHours * ratePerHour * 100) / 100;
};
