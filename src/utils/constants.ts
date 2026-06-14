import type { BusinessStatus, DocumentIssue, ComplaintType, AuthorizationResult } from '@prisma/client';

export const STATUS_LABELS: Record<BusinessStatus, string> = {
  QUEUED: '排队中',
  ACCEPTED: '已受理',
  DOCUMENT_CHECKING: '资料检查中',
  DUE_DILIGENCE: '尽调审查中',
  PROCESSING: '柜面处理中',
  PENDING_AUTHORIZATION: '待授权',
  AUTHORIZATION_REVIEW: '授权复核中',
  AUTHORIZED: '已授权',
  REJECTED: '已拒绝',
  RETURNED: '已退回',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  TIMEOUT: '已超时',
};

export const STATUS_COLORS: Record<BusinessStatus, string> = {
  QUEUED: 'bg-slate-100 text-slate-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  DOCUMENT_CHECKING: 'bg-purple-100 text-purple-700',
  DUE_DILIGENCE: 'bg-indigo-100 text-indigo-700',
  PROCESSING: 'bg-cyan-100 text-cyan-700',
  PENDING_AUTHORIZATION: 'bg-amber-100 text-amber-700',
  AUTHORIZATION_REVIEW: 'bg-orange-100 text-orange-700',
  AUTHORIZED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-rose-100 text-rose-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  TIMEOUT: 'bg-red-100 text-red-700',
};

export const STATUS_DOT_COLORS: Record<BusinessStatus, string> = {
  QUEUED: 'bg-slate-400',
  ACCEPTED: 'bg-blue-500',
  DOCUMENT_CHECKING: 'bg-purple-500',
  DUE_DILIGENCE: 'bg-indigo-500',
  PROCESSING: 'bg-cyan-500',
  PENDING_AUTHORIZATION: 'bg-amber-500',
  AUTHORIZATION_REVIEW: 'bg-orange-500',
  AUTHORIZED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  RETURNED: 'bg-rose-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-300',
  TIMEOUT: 'bg-red-500',
};

export const DOCUMENT_ISSUE_LABELS: Record<DocumentIssue, string> = {
  MISSING_COPY: '资料复印缺页',
  INCOMPLETE_DUE_DILIGENCE: '尽调补件',
  EXPIRED_DOCUMENT: '证件过期',
  SIGNATURE_MISMATCH: '签字不符',
  MISSING_SIGNATURE: '缺少签字',
  OTHER: '其他问题',
};

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  PROCESS_TIMEOUT: '业务超时投诉',
  SERVICE_ATTITUDE: '服务态度',
  DOCUMENT_REQUIREMENT: '资料要求',
  OTHER: '其他投诉',
};

export const AUTHORIZATION_RESULT_LABELS: Record<AuthorizationResult, string> = {
  APPROVED: '通过',
  REJECTED: '拒绝',
  RETURNED: '退回',
  ESCALATED: '升级',
};

export const AUTHORIZATION_RESULT_COLORS: Record<AuthorizationResult, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-amber-100 text-amber-700',
  ESCALATED: 'bg-orange-100 text-orange-700',
};

export const STATUS_FLOW: BusinessStatus[] = [
  'QUEUED',
  'ACCEPTED',
  'DOCUMENT_CHECKING',
  'DUE_DILIGENCE',
  'PROCESSING',
  'PENDING_AUTHORIZATION',
  'AUTHORIZATION_REVIEW',
  'AUTHORIZED',
  'COMPLETED',
];

export function getNextStatus(current: BusinessStatus): BusinessStatus | null {
  const index = STATUS_FLOW.indexOf(current);
  if (index === -1 || index >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
}

export function getPreviousStatus(current: BusinessStatus): BusinessStatus | null {
  const index = STATUS_FLOW.indexOf(current);
  if (index <= 0) return null;
  return STATUS_FLOW[index - 1];
}
