export const CLAIM_STATUS_CONFIG = {
  pending: {
    label: '待处理',
    color: 'bg-yellow-100 text-yellow-800',
    allowedTransitions: ['processing', 'exception'],
  },
  processing: {
    label: '处理中',
    color: 'bg-blue-100 text-blue-800',
    allowedTransitions: ['review', 'exception'],
  },
  review: {
    label: '审核中',
    color: 'bg-purple-100 text-purple-800',
    allowedTransitions: ['approved', 'exception'],
  },
  approved: {
    label: '已批准',
    color: 'bg-indigo-100 text-indigo-800',
    allowedTransitions: ['paid'],
  },
  paid: {
    label: '已赔付',
    color: 'bg-green-100 text-green-800',
    allowedTransitions: ['archived'],
  },
  archived: {
    label: '已归档',
    color: 'bg-gray-100 text-gray-600',
    allowedTransitions: [],
  },
  exception: {
    label: '异常',
    color: 'bg-red-100 text-red-800',
    allowedTransitions: ['processing'],
  },
} as const;

export type ClaimStatus = keyof typeof CLAIM_STATUS_CONFIG;

export const getStatusLabel = (status: string): string => {
  return CLAIM_STATUS_CONFIG[status as ClaimStatus]?.label || status;
};

export const getStatusColor = (status: string): string => {
  return CLAIM_STATUS_CONFIG[status as ClaimStatus]?.color || 'bg-gray-100 text-gray-600';
};

export const RESPONSIBILITY_CONFIG = {
  company: { label: '我方责任', color: 'text-red-600 bg-red-50' },
  customer: { label: '客户责任', color: 'text-gray-600 bg-gray-50' },
  third_party: { label: '第三方责任', color: 'text-blue-600 bg-blue-50' },
  undetermined: { label: '责任待定', color: 'text-yellow-600 bg-yellow-50' },
} as const;

export type Responsibility = keyof typeof RESPONSIBILITY_CONFIG;
