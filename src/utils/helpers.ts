import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    '已完成': 'bg-green-500 text-white',
    '待检测': 'bg-blue-100 text-blue-700 border border-blue-300',
    '检测中': 'bg-blue-500 text-white',
    '待审核': 'bg-yellow-100 text-yellow-700',
    '待发放': 'bg-yellow-100 text-yellow-700',
    '发放中': 'bg-inspector text-white',
    '已发放': 'bg-auditor text-white',
    '待执行': 'bg-blue-100 text-blue-700',
    '进行中': 'bg-blue-500 text-white',
    '已驳回': 'bg-red-500 text-white',
    '已通过': 'bg-green-500 text-white',
    '待回访': 'bg-yellow-100 text-yellow-700',
    '回访中': 'bg-auditor text-white',
    '无法联系': 'bg-gray-500 text-white',
    '发放异常': 'bg-red-500 text-white',
  };
  return statusMap[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    '拖延': '⚠️ 拖延',
    '补录': '📝 补录',
    '驳回': '❌ 驳回',
    '待复核': '⏳ 待复核',
  };
  return labelMap[status] || status;
}
