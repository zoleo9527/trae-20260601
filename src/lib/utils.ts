import type { UserRole, ConsultationStatus, DocumentStatus } from '../types';

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    consultant: '税务顾问',
    project_manager: '项目经理',
    client_finance: '客户财务',
  };
  return labels[role] || role;
};

export const getNextStatusOptions = (
  currentStatus: ConsultationStatus,
  userRole: UserRole
): { status: ConsultationStatus; handlerRole: UserRole; label: string }[] => {
  const transitions: Record<
    ConsultationStatus,
    { status: ConsultationStatus; handlerRole: UserRole; label: string; allowedRoles: UserRole[] }[]
  > = {
    '待受理': [
      {
        status: '已受理',
        handlerRole: 'consultant',
        label: '受理并分配给税务顾问',
        allowedRoles: ['consultant', 'project_manager'],
      },
    ],
    '已受理': [
      {
        status: '待补录',
        handlerRole: 'client_finance',
        label: '发起补录，转客户财务',
        allowedRoles: ['consultant'],
      },
      {
        status: '待复核',
        handlerRole: 'project_manager',
        label: '提交项目经理复核',
        allowedRoles: ['consultant'],
      },
      {
        status: '已退回',
        handlerRole: 'consultant',
        label: '退回处理',
        allowedRoles: ['project_manager'],
      },
    ],
    '待补录': [
      {
        status: '补录中',
        handlerRole: 'client_finance',
        label: '客户财务开始补录',
        allowedRoles: ['client_finance'],
      },
      {
        status: '已退回',
        handlerRole: 'consultant',
        label: '退回给顾问',
        allowedRoles: ['client_finance'],
      },
    ],
    '补录中': [
      {
        status: '待复核',
        handlerRole: 'project_manager',
        label: '补录完成，提交复核',
        allowedRoles: ['client_finance'],
      },
      {
        status: '已退回',
        handlerRole: 'consultant',
        label: '退回给顾问',
        allowedRoles: ['client_finance'],
      },
    ],
    '待复核': [
      {
        status: '复核通过',
        handlerRole: 'consultant',
        label: '复核通过，转顾问跟进资料',
        allowedRoles: ['project_manager'],
      },
      {
        status: '已退回',
        handlerRole: 'consultant',
        label: '退回补录',
        allowedRoles: ['project_manager'],
      },
    ],
    '复核通过': [
      {
        status: '资料清单完成',
        handlerRole: 'consultant',
        label: '资料清单确认完成',
        allowedRoles: ['consultant', 'project_manager'],
      },
      {
        status: '待补录',
        handlerRole: 'client_finance',
        label: '需要补充资料',
        allowedRoles: ['consultant'],
      },
    ],
    '已退回': [
      {
        status: '已受理',
        handlerRole: 'consultant',
        label: '重新受理',
        allowedRoles: ['consultant'],
      },
      {
        status: '待补录',
        handlerRole: 'client_finance',
        label: '再次发起补录',
        allowedRoles: ['consultant'],
      },
    ],
    '资料清单完成': [],
  };

  return (transitions[currentStatus] || []).filter((t) =>
    t.allowedRoles.includes(userRole)
  );
};

export const getStatusBadgeClass = (status: ConsultationStatus): string => {
  const classes: Record<ConsultationStatus, string> = {
    '待受理': 'bg-gray-100 text-gray-700 border-gray-200',
    '已受理': 'bg-blue-100 text-blue-700 border-blue-200',
    '待补录': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '补录中': 'bg-orange-100 text-orange-700 border-orange-200',
    '待复核': 'bg-purple-100 text-purple-700 border-purple-200',
    '复核通过': 'bg-green-100 text-green-700 border-green-200',
    '已退回': 'bg-red-100 text-red-700 border-red-200',
    '资料清单完成': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return classes[status];
};

export const getPriorityBadgeClass = (priority: number): string => {
  const classes: Record<number, string> = {
    3: 'bg-red-500 text-white',
    2: 'bg-yellow-500 text-white',
    1: 'bg-gray-400 text-white',
  };
  return classes[priority] || classes[1];
};

export const getStatusDescription = (status: ConsultationStatus): string => {
  const descriptions: Record<ConsultationStatus, string> = {
    '待受理': '咨询已登记，等待税务顾问受理',
    '已受理': '税务顾问已受理，正在处理中',
    '待补录': '需要客户财务补充资料',
    '补录中': '客户财务正在补充资料',
    '待复核': '资料已提交，等待项目经理复核',
    '复核通过': '项目经理复核通过',
    '已退回': '资料不完整或有问题，已退回处理',
    '资料清单完成': '所有资料已收齐，流程完成',
  };
  return descriptions[status];
};

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getDocumentStatusBadgeClass = (status: DocumentStatus): string => {
  const classes: Record<DocumentStatus, string> = {
    '待发起': 'bg-gray-100 text-gray-600 border-gray-200',
    '已要求提供': 'bg-blue-100 text-blue-600 border-blue-200',
    '客户已提供': 'bg-yellow-100 text-yellow-600 border-yellow-200',
    '已收到': 'bg-green-100 text-green-600 border-green-200',
    '已豁免': 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return classes[status] || 'bg-gray-100 text-gray-600 border-gray-200';
};

export const getNextDocumentStatusOptions = (
  currentStatus: DocumentStatus
): { value: DocumentStatus; label: string; recommended?: boolean }[] => {
  const transitions: Record<
    DocumentStatus,
    { value: DocumentStatus; label: string; recommended?: boolean }[]
  > = {
    '待发起': [
      { value: '已要求提供', label: '→ 已要求提供', recommended: true },
      { value: '已豁免', label: '→ 已豁免' },
      { value: '待发起', label: '（保持待发起）' },
    ],
    '已要求提供': [
      { value: '客户已提供', label: '→ 客户已提供', recommended: true },
      { value: '已豁免', label: '→ 已豁免' },
      { value: '待发起', label: '← 退回待发起' },
    ],
    '客户已提供': [
      { value: '已收到', label: '→ 已收到（确认）', recommended: true },
      { value: '已要求提供', label: '← 退回重发' },
      { value: '已豁免', label: '→ 已豁免' },
    ],
    '已收到': [
      { value: '已豁免', label: '→ 改为已豁免' },
      { value: '客户已提供', label: '← 退回已提供' },
      { value: '已要求提供', label: '← 重新要求提供' },
      { value: '已收到', label: '（保持已收到）' },
    ],
    '已豁免': [
      { value: '已要求提供', label: '→ 重新要求提供', recommended: true },
      { value: '已收到', label: '→ 改为已收到' },
      { value: '已豁免', label: '（保持已豁免）' },
    ],
  };

  return transitions[currentStatus] || [];
};
