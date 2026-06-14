import type { ReminderStatus, UserRole, PaymentStatus, RiskLevel, RiskCategory } from '../../shared/types';

export const statusMap: Record<
  ReminderStatus,
  { label: string; className: string; dotClass: string }
> = {
  pending_schedule: {
    label: '待安排',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500',
  },
  pending_execute: {
    label: '待执行',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    dotClass: 'bg-blue-500',
  },
  pending_confirm: {
    label: '待确认',
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
    dotClass: 'bg-purple-500',
  },
  completed: {
    label: '已完成',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  disputed: {
    label: '有争议',
    className: 'bg-red-50 text-red-700 border border-red-200',
    dotClass: 'bg-red-500',
  },
};

export const roleMap: Record<UserRole, { label: string; short: string; className: string }> = {
  enroller: {
    label: '报名员',
    short: '报',
    className: 'bg-navy-100 text-navy-700',
  },
  coach: {
    label: '场地教练',
    short: '教',
    className: 'bg-accent/10 text-accent-dark',
  },
  safety_officer: {
    label: '安全员',
    short: '安',
    className: 'bg-slate-200 text-slate-700',
  },
};

export const paymentMap: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: '未缴费', className: 'text-red-600' },
  pending: { label: '待确认', className: 'text-amber-600' },
  paid: { label: '已缴费', className: 'text-emerald-600' },
};

export function formatDateTime(iso: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return iso;
  }
}

export function maskIdCard(id: string): string {
  if (!id || id.length < 10) return id || '-';
  return id.slice(0, 6) + '********' + id.slice(-4);
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || '-';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function getInitial(name: string): string {
  if (!name) return '?';
  return name.charAt(0);
}

export const riskLevelMap: Record<
  RiskLevel,
  { label: string; className: string; dotClass: string; badgeClass: string }
> = {
  none: {
    label: '无风险',
    className: 'text-slate-400',
    dotClass: 'bg-slate-300',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  low: {
    label: '低风险',
    className: 'text-teal-600',
    dotClass: 'bg-teal-500',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  medium: {
    label: '中风险',
    className: 'text-amber-600',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  high: {
    label: '高风险',
    className: 'text-orange-600',
    dotClass: 'bg-orange-500',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  critical: {
    label: '严重风险',
    className: 'text-red-600',
    dotClass: 'bg-red-500',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
};

export const riskCategoryMap: Record<RiskCategory, { label: string; description: string }> = {
  schedule_delay: {
    label: '安排延误',
    description: '补训安排不及时，可能影响学员考试进度',
  },
  fee_discrepancy: {
    label: '费用争议',
    description: '学员对费用金额或收费标准有异议',
  },
  missing_record: {
    label: '记录缺失',
    description: '补训流程记录不完整，缺少签到、照片等凭证',
  },
  coach_overload: {
    label: '教练超负荷',
    description: '教练同时带教学员过多，可能影响补训质量',
  },
  student_complaint: {
    label: '学员投诉',
    description: '学员对服务态度、教学质量等有投诉',
  },
  process_irregularity: {
    label: '流程违规',
    description: '操作流程不符合规范要求，存在合规风险',
  },
  safety_concern: {
    label: '安全隐患',
    description: '训练过程中存在安全操作隐患',
  },
  other: {
    label: '其他风险',
    description: '其他需要关注的责任风险',
  },
};
