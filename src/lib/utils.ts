import { ReportStatus, Role } from './types';

export const statusLabels: Record<ReportStatus, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  MATERIALS_MISSING: '材料缺失',
  MATERIALS_COMPLETE: '材料收齐',
  REVIEW_REJECTED: '复核不通过',
  REVIEW_PASSED: '复核通过',
  SETTLED: '已结算',
  OVERDUE: '超时',
};

export const statusColors: Record<ReportStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  MATERIALS_MISSING: 'bg-amber-100 text-amber-700',
  MATERIALS_COMPLETE: 'bg-cyan-100 text-cyan-700',
  REVIEW_REJECTED: 'bg-red-100 text-red-700',
  REVIEW_PASSED: 'bg-green-100 text-green-700',
  SETTLED: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-200 text-red-800',
};

export const roleLabels: Record<Role, string> = {
  BRAND_MANAGER: '品牌店长',
  OPERATION_SUPERVISOR: '营运督导',
  LEASING_MANAGER: '招商经理',
};

export const materialTypeLabels: Record<string, string> = {
  SALES_SLIP: '销售小票',
  SETTLEMENT_STATEMENT: '结算对账单',
  INVOICE: '增值税发票',
  OTHER: '其他材料',
};

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isAbnormal(status: ReportStatus): boolean {
  return (
    status === ReportStatus.MATERIALS_MISSING ||
    status === ReportStatus.REVIEW_REJECTED ||
    status === ReportStatus.OVERDUE
  );
}
