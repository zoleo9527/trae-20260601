import type { SurgeryStatus, ExceptionLevel, ExceptionStatus } from '@/types';

export const statusLabels: Record<SurgeryStatus, string> = {
  scheduled: '已排班',
  applying: '申领中',
  lens_pending: '待确认晶体',
  lens_confirmed: '晶体已确认',
  in_progress: '手术中',
  verifying: '待核销复核',
  completed: '已完成',
  exception: '异常',
};

export const statusColors: Record<SurgeryStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-700 border-gray-200',
  applying: 'bg-blue-50 text-blue-700 border-blue-200',
  lens_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  lens_confirmed: 'bg-green-50 text-green-700 border-green-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  verifying: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  exception: 'bg-red-50 text-red-700 border-red-200',
};

export const statusDotColors: Record<SurgeryStatus, string> = {
  scheduled: 'bg-gray-400',
  applying: 'bg-blue-500',
  lens_pending: 'bg-amber-500',
  lens_confirmed: 'bg-green-500',
  in_progress: 'bg-indigo-500',
  verifying: 'bg-orange-500',
  completed: 'bg-emerald-500',
  exception: 'bg-red-500',
};

export const exceptionLevelLabels: Record<ExceptionLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

export const exceptionLevelColors: Record<ExceptionLevel, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
};

export const exceptionStatusLabels: Record<ExceptionStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

export const exceptionStatusColors: Record<ExceptionStatus, string> = {
  pending: 'bg-red-100 text-red-700',
  processing: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
};

export const roleLabels: Record<string, string> = {
  nurse: '手术护士',
  doctor: '主刀医生',
  followup: '随访专员',
  admin: '管理员',
};

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};
