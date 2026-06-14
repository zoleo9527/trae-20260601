import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
};

export const formatDateShort = (date: Date): string => {
  return format(date, 'yyyy-MM-dd', { locale: zhCN });
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm:ss', { locale: zhCN });
};

export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { locale: zhCN, addSuffix: true });
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待检测',
    inspected: '已检测',
    preparing: '整备中',
    completed: '已完成',
    cancelled: '已取消',
    pass: '通过',
    fail: '不通过',
    not_applicable: '不适用',
    in_progress: '进行中',
    overdue: '已逾期',
  };
  return labels[status] || status;
};

export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    manager: '收车经理',
    assessor: '评估师',
    finance: '金融专员',
  };
  return labels[role] || role;
};

export const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    status_change: '📋',
    inspection: '🔍',
    task: '✅',
    note: '📝',
    finance: '💰',
  };
  return icons[type] || '📌';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    inspected: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    pass: 'bg-green-100 text-green-800',
    fail: 'bg-red-100 text-red-800',
    not_applicable: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
    missing: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getAccidentSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    minor: '轻微',
    moderate: '中等',
    severe: '严重',
  };
  return labels[severity] || severity;
};

export const getAccidentSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    minor: 'bg-yellow-100 text-yellow-800',
    moderate: 'bg-orange-100 text-orange-800',
    severe: 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
};

export const formatCostPercentage = (actual: number, estimated: number): string => {
  if (estimated === 0) return '0%';
  const percentage = (actual / estimated) * 100;
  return `${percentage.toFixed(1)}%`;
};

export const getCostStatus = (actual: number, estimated: number): { status: 'normal' | 'warning' | 'overrun'; message: string } => {
  if (estimated === 0) return { status: 'normal', message: '暂无预算' };
  const percentage = (actual / estimated) * 100;
  if (percentage >= 100) return { status: 'overrun', message: `超预算 ${(percentage - 100).toFixed(1)}%` };
  if (percentage >= 80) return { status: 'warning', message: `已达预算 ${percentage.toFixed(1)}%` };
  return { status: 'normal', message: `预算使用 ${percentage.toFixed(1)}%` };
};

export const getDocumentReminderStatus = (reminder: { status: string; dueDate: Date }): { label: string; color: string; isOverdue: boolean } => {
  const now = new Date();
  const isOverdue = reminder.status === 'pending' && new Date(reminder.dueDate) < now;
  if (isOverdue) {
    return { label: '已逾期', color: 'bg-red-100 text-red-800', isOverdue: true };
  }
  if (reminder.status === 'completed') {
    return { label: '已完成', color: 'bg-green-100 text-green-800', isOverdue: false };
  }
  if (reminder.status === 'sent') {
    return { label: '已提醒', color: 'bg-blue-100 text-blue-800', isOverdue: false };
  }
  return { label: '待处理', color: 'bg-yellow-100 text-yellow-800', isOverdue: false };
};

export const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    loan_application: '贷款申请',
    document: '资料文件',
    approval: '审批',
    rejection: '驳回',
  };
  return labels[type] || type;
};

export const getFinancDocumentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待提交',
    completed: '已完成',
    missing: '缺失',
    overdue: '已逾期',
  };
  return labels[status] || status;
};

export const formatDaysRemaining = (dueDate: Date): string => {
  const now = new Date();
  const diff = new Date(dueDate).getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  return `还剩 ${days} 天`;
};

export const getTaskStatusProgress = (tasks: Array<{ status: string }>): { total: number; completed: number; inProgress: number; pending: number; percentage: number } => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, inProgress, pending, percentage };
};
