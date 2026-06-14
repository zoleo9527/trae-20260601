import type { ReminderStatus, UserRole, PaymentStatus, RiskLevel, RiskCategory, Reminder } from '../../shared/types';

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

export interface HandoverInfo {
  currentRole: UserRole;
  currentName: string;
  nextRole: UserRole | null;
  nextLabel: string;
  deadline: string;
  deadlineHours: number;
  isOverdue: boolean;
  isGapRisk: boolean;
  gapLevel: 'normal' | 'warning' | 'danger';
  followUpNote: string;
  timeRemaining: string;
}

export const handoverConfig: Record<ReminderStatus, {
  ownerRole: UserRole;
  nextRole: UserRole | null;
  nextLabel: string;
  deadlineHours: number;
  isGapRisk: boolean;
  followUpNotes: Record<UserRole, string>;
}> = {
  pending_schedule: {
    ownerRole: 'enroller',
    nextRole: 'coach',
    nextLabel: '教练执行',
    deadlineHours: 24,
    isGapRisk: false,
    followUpNotes: {
      enroller: '请在24小时内完成补训时间安排，避免学员等待',
      coach: '待报名员安排时间后，准备接棒执行补训',
      safety_officer: '关注安排时效，超时可能引发学员投诉',
    },
  },
  pending_execute: {
    ownerRole: 'coach',
    nextRole: 'enroller',
    nextLabel: '费用确认',
    deadlineHours: 72,
    isGapRisk: false,
    followUpNotes: {
      enroller: '待教练完成补训后，及时进行费用确认',
      coach: '请按约定时间完成补训执行，带教后及时提交记录',
      safety_officer: '关注教练带教质量和安全操作规范',
    },
  },
  pending_confirm: {
    ownerRole: 'enroller',
    nextRole: null,
    nextLabel: '流程完结',
    deadlineHours: 48,
    isGapRisk: true,
    followUpNotes: {
      enroller: '⚠️ 补训已完成，请在48小时内完成费用确认，避免责任空档',
      coach: '执行已完成，请配合报名员核实费用和记录',
      safety_officer: '重点关注：费用确认超时易引发费用争议风险',
    },
  },
  disputed: {
    ownerRole: 'safety_officer',
    nextRole: 'enroller',
    nextLabel: '后续处理',
    deadlineHours: 24,
    isGapRisk: true,
    followUpNotes: {
      enroller: '争议已提交，请配合安全员核实情况',
      coach: '争议处理中，请提供相关带教记录和说明',
      safety_officer: '⚠️ 请在24小时内介入争议处理，避免升级为投诉',
    },
  },
  completed: {
    ownerRole: 'enroller',
    nextRole: null,
    nextLabel: '已完结',
    deadlineHours: 0,
    isGapRisk: false,
    followUpNotes: {
      enroller: '补训已完成，费用已确认归档',
      coach: '补训执行已完成，费用已确认',
      safety_officer: '流程已合规完结，无待处理事项',
    },
  },
};

export function getHandoverInfo(reminder: Reminder): HandoverInfo {
  const config = handoverConfig[reminder.status];

  let referenceTime = reminder.createdAt;
  if (reminder.status === 'pending_execute' && reminder.scheduledAt) {
    referenceTime = reminder.scheduledAt;
  } else if (reminder.status === 'pending_confirm' && reminder.executedAt) {
    referenceTime = reminder.executedAt;
  } else if (reminder.status === 'disputed' && reminder.history.length > 0) {
    const disputedRecord = reminder.history.find((h) => h.status === 'disputed');
    if (disputedRecord) {
      referenceTime = disputedRecord.createdAt;
    }
  }

  const now = new Date().getTime();
  const refTime = new Date(referenceTime).getTime();
  const deadlineMs = refTime + config.deadlineHours * 60 * 60 * 1000;
  const remainingMs = deadlineMs - now;
  const isOverdue = remainingMs < 0;

  let gapLevel: 'normal' | 'warning' | 'danger' = 'normal';
  if (config.isGapRisk) {
    if (isOverdue) {
      gapLevel = 'danger';
    } else if (remainingMs < 24 * 60 * 60 * 1000) {
      gapLevel = 'warning';
    } else {
      gapLevel = 'normal';
    }
  }

  const absRemainingMs = Math.abs(remainingMs);
  const hours = Math.floor(absRemainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((absRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  let timeRemaining = '';
  if (isOverdue) {
    if (hours > 0) {
      timeRemaining = `已逾期 ${hours} 小时 ${minutes} 分`;
    } else {
      timeRemaining = `已逾期 ${minutes} 分钟`;
    }
  } else {
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainHours = hours % 24;
      timeRemaining = `剩 ${days} 天 ${remainHours} 小时`;
    } else if (hours > 0) {
      timeRemaining = `剩 ${hours} 小时 ${minutes} 分`;
    } else {
      timeRemaining = `剩 ${minutes} 分钟`;
    }
  }

  const deadline = new Date(deadlineMs).toISOString();

  return {
    currentRole: reminder.currentOwnerRole,
    currentName: reminder.currentOwnerName,
    nextRole: config.nextRole,
    nextLabel: config.nextLabel,
    deadline,
    deadlineHours: config.deadlineHours,
    isOverdue,
    isGapRisk: config.isGapRisk,
    gapLevel,
    followUpNote: config.followUpNotes[reminder.currentOwnerRole] || '',
    timeRemaining,
  };
}

export function getFollowUpNote(reminder: Reminder, role: UserRole): string {
  const config = handoverConfig[reminder.status];
  return config.followUpNotes[role] || '';
}
