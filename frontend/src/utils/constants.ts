import type {
  Role,
  TransferStage,
  UrgencyAction,
  CarSourceStatus,
  InspectionStatus,
  LoanStatus,
} from 'shared';

export const roleMap: Record<Role, { label: string; color: string; icon: string }> = {
  purchaseManager: { label: '收车经理', color: '#1677ff', icon: '🚗' },
  appraiser: { label: '评估师', color: '#52c41a', icon: '🔍' },
  financeSpecialist: { label: '金融专员', color: '#fa8c16', icon: '💰' },
};

export const stageMap: Record<TransferStage, { label: string; color: string; icon: string }> = {
  purchase: { label: '收车建档', color: 'blue', icon: '🚗' },
  appraisal: { label: '检测评估', color: 'green', icon: '🔍' },
  transfer: { label: '成交过户', color: 'geekblue', icon: '📝' },
  loan_review: { label: '贷款审核', color: 'orange', icon: '📋' },
  loan_funding: { label: '贷款放款', color: 'gold', icon: '💰' },
  completed: { label: '交易完成', color: 'success', icon: '✅' },
};

export const urgencyMap: Record<UrgencyAction, { label: string; color: string; icon: string }> = {
  urge: { label: '有人催', color: 'red', icon: '🔔' },
  return: { label: '已退回', color: 'volcano', icon: '↩️' },
  supplement: { label: '补材料', color: 'warning', icon: '📎' },
  none: { label: '正常', color: 'default', icon: '•' },
};

export const carSourceStatusMap: Record<CarSourceStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  normal: { label: '车况正常', color: 'success' },
  accident_missed: { label: '事故信息漏标', color: 'error' },
  prep_over_budget: { label: '整备成本超预算', color: 'warning' },
};

export const inspectionStatusMap: Record<InspectionStatus, { label: string; color: string }> = {
  pending: { label: '待检测', color: 'default' },
  passed: { label: '检测通过', color: 'success' },
  recheck: { label: '需复检', color: 'warning' },
};

export const loanStatusMap: Record<LoanStatus, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'default' },
  approved: { label: '已批准', color: 'success' },
  supplement: { label: '补材料', color: 'warning' },
  rejected: { label: '已拒绝', color: 'error' },
};

export const actionLogMap: Record<string, { label: string; color: string }> = {
  submit: { label: '提交', color: 'blue' },
  pass: { label: '通过', color: 'green' },
  urge: { label: '催办', color: 'red' },
  return: { label: '退回', color: 'volcano' },
  supplement: { label: '补材料', color: 'warning' },
  reject: { label: '拒绝', color: 'error' },
  fund: { label: '放款', color: 'gold' },
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const formatMoney = (amount: number): string => {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 });
};
