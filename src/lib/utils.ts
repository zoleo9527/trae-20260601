import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    '待判断': 'bg-gray-100 text-gray-700 border-gray-200',
    '判断中': 'bg-blue-50 text-blue-700 border-blue-200',
    '待审批': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    '审批通过': 'bg-green-50 text-green-700 border-green-200',
    '审批驳回': 'bg-red-50 text-red-700 border-red-200',
    '已签收': 'bg-purple-50 text-purple-700 border-purple-200',
    '处理完成': 'bg-cyan-50 text-cyan-700 border-cyan-200'
  };
  return colors[status] || colors['待判断'];
}

export function getUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    '普通': 'text-gray-600',
    '紧急': 'text-orange-600',
    '加急': 'text-red-600'
  };
  return colors[urgency] || colors['普通'];
}
