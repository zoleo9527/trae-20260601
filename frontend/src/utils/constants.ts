import { Role } from 'shared';

export const registrationStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  completed: { label: '资料完成', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  supplement: { label: '补录中', color: 'warning' },
  delayed: { label: '拖延', color: 'warning' },
};

export const physicalStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待体检', color: 'default' },
  passed: { label: '体检通过', color: 'success' },
  failed: { label: '体检未过', color: 'error' },
  review: { label: '待复核', color: 'warning' },
  recheck: { label: '需重检', color: 'warning' },
};

export const responsibilityMap: Record<string, { label: string; color: string }> = {
  none: { label: '无争议', color: 'default' },
  registrar_issue: { label: '报名员责任', color: 'processing' },
  coach_issue: { label: '教练责任', color: 'success' },
  borderline: { label: '边界不清', color: 'warning' },
};

export const exceptionLevelMap: Record<string, { label: string; color: string }> = {
  info: { label: '提示', color: 'default' },
  warning: { label: '警告', color: 'warning' },
  error: { label: '严重', color: 'error' },
};

export const roleMap: Record<Role, { label: string; color: string; icon: string }> = {
  registrar: { label: '报名员', color: '#1677ff', icon: '📝' },
  fieldCoach: { label: '场地教练', color: '#52c41a', icon: '🏍️' },
  safetyOfficer: { label: '安全员', color: '#fa8c16', icon: '🛡️' },
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

export const subjectMap: Record<string, string> = {
  subject1: '科目一（理论）',
  subject2: '科目二（场地）',
  subject3: '科目三（路考）',
  subject4: '科目四（安全文明）',
};
