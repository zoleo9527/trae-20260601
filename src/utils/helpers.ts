import { OrderStatus, FabricStatus, PatternStatus } from '../types';

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    measured: 'bg-blue-100 text-blue-700',
    fabric_reserved: 'bg-green-100 text-green-700',
    pattern_in_progress: 'bg-yellow-100 text-yellow-700',
    fitting: 'bg-purple-100 text-purple-700',
    completed: 'bg-teal-100 text-teal-700',
    reserved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    supplement: 'bg-orange-100 text-orange-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const getStatusBgColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-gray-50',
    measured: 'bg-blue-50',
    fabric_reserved: 'bg-green-50',
    pattern_in_progress: 'bg-yellow-50',
    fitting: 'bg-purple-50',
    completed: 'bg-teal-50',
    reserved: 'bg-green-50',
    rejected: 'bg-red-50',
    supplement: 'bg-orange-50',
    in_progress: 'bg-yellow-50',
  };
  return colors[status] || 'bg-gray-50';
};