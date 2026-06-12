import { PropertyStatus, UserRole, StatusTransition } from '../types';

export const propertyStatusTransitions: StatusTransition[] = [
  {
    from: 'vacant',
    to: 'viewing_scheduled',
    action: 'schedule_viewing',
    allowedRoles: ['rental_consultant'],
    description: '预约看房',
  },
  {
    from: 'viewing_scheduled',
    to: 'viewing_completed',
    action: 'complete_viewing',
    allowedRoles: ['rental_consultant'],
    description: '看房完成',
  },
  {
    from: 'viewing_completed',
    to: 'quotation_pending',
    action: 'prepare_quotation',
    allowedRoles: ['rental_consultant'],
    description: '准备报价',
  },
  {
    from: 'quotation_pending',
    to: 'quotation_submitted',
    action: 'submit_quotation',
    allowedRoles: ['rental_consultant'],
    description: '提交报价',
  },
  {
    from: 'quotation_submitted',
    to: 'quotation_approved',
    action: 'approve_quotation',
    allowedRoles: ['operation_manager'],
    description: '确认报价',
  },
  {
    from: 'quotation_submitted',
    to: 'quotation_pending',
    action: 'reject_quotation',
    allowedRoles: ['operation_manager'],
    description: '报价退回修改',
  },
  {
    from: 'quotation_approved',
    to: 'contract_drafting',
    action: 'draft_contract',
    allowedRoles: ['rental_consultant'],
    description: '起草合同',
  },
  {
    from: 'contract_drafting',
    to: 'contract_reviewing',
    action: 'submit_contract_review',
    allowedRoles: ['rental_consultant'],
    description: '提交合同审核',
  },
  {
    from: 'contract_reviewing',
    to: 'contract_signed',
    action: 'approve_contract',
    allowedRoles: ['operation_manager'],
    description: '合同审核通过并签署',
  },
  {
    from: 'contract_reviewing',
    to: 'contract_drafting',
    action: 'reject_contract',
    allowedRoles: ['operation_manager'],
    description: '合同退回修改',
  },
  {
    from: 'contract_signed',
    to: 'handover_pending',
    action: 'prepare_handover',
    allowedRoles: ['rental_consultant'],
    description: '准备物业交接',
  },
  {
    from: 'handover_pending',
    to: 'handover_completed',
    action: 'complete_handover',
    allowedRoles: ['operation_manager'],
    description: '物业交接完成',
  },
  {
    from: 'handover_completed',
    to: 'occupied',
    action: 'confirm_occupied',
    allowedRoles: ['rental_consultant', 'operation_manager'],
    description: '确认入住',
  },
  {
    from: 'occupied',
    to: 'checkout_pending',
    action: 'request_checkout',
    allowedRoles: ['rental_consultant', 'operation_manager'],
    description: '申请退租',
  },
  {
    from: 'checkout_pending',
    to: 'handover_pending',
    action: 'prepare_checkout_handover',
    allowedRoles: ['rental_consultant'],
    description: '准备退租交接',
  },
  {
    from: 'handover_completed',
    to: 'checkout_completed',
    action: 'complete_checkout',
    allowedRoles: ['operation_manager'],
    description: '退租完成',
  },
  {
    from: 'checkout_completed',
    to: 'vacant',
    action: 'reset_vacant',
    allowedRoles: ['operation_manager'],
    description: '重置为空置',
  },
];

export const getAvailableTransitions = (
  currentStatus: PropertyStatus,
  userRole: UserRole
): StatusTransition[] => {
  return propertyStatusTransitions.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
};

export const canTransition = (
  from: PropertyStatus,
  to: PropertyStatus,
  userRole: UserRole
): boolean => {
  return propertyStatusTransitions.some(
    (t) => t.from === from && t.to === to && t.allowedRoles.includes(userRole)
  );
};

export const getTransitionAction = (
  from: PropertyStatus,
  to: PropertyStatus
): StatusTransition | undefined => {
  return propertyStatusTransitions.find((t) => t.from === from && t.to === to);
};

export const getStatusDisplay = (status: PropertyStatus): { label: string; color: string } => {
  const statusMap: Record<PropertyStatus, { label: string; color: string }> = {
    vacant: { label: '空置', color: '#52c41a' },
    viewing_scheduled: { label: '预约看房', color: '#1890ff' },
    viewing_completed: { label: '看房完成', color: '#13c2c2' },
    quotation_pending: { label: '待报价', color: '#faad14' },
    quotation_submitted: { label: '已报价待确认', color: '#fa8c16' },
    quotation_approved: { label: '报价已确认', color: '#722ed1' },
    contract_drafting: { label: '合同起草中', color: '#1890ff' },
    contract_reviewing: { label: '合同审核中', color: '#722ed1' },
    contract_signed: { label: '合同已签署', color: '#52c41a' },
    handover_pending: { label: '待交接', color: '#faad14' },
    handover_completed: { label: '交接完成', color: '#52c41a' },
    occupied: { label: '已入住', color: '#52c41a' },
    checkout_pending: { label: '待退租', color: '#fa8c16' },
    checkout_completed: { label: '已退租', color: '#8c8c8c' },
  };
  return statusMap[status] || { label: status, color: '#d9d9d9' };
};

export const getQuotationStatusDisplay = (status: string): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: '#8c8c8c' },
    submitted: { label: '已提交', color: '#1890ff' },
    approved: { label: '已确认', color: '#52c41a' },
    rejected: { label: '已拒绝', color: '#f5222d' },
    expired: { label: '已过期', color: '#d9d9d9' },
  };
  return map[status] || { label: status, color: '#d9d9d9' };
};

export const getContractStatusDisplay = (status: string): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: '#8c8c8c' },
    under_review: { label: '审核中', color: '#1890ff' },
    approved: { label: '已批准', color: '#722ed1' },
    signed: { label: '已签署', color: '#52c41a' },
    rejected: { label: '已拒绝', color: '#f5222d' },
    terminated: { label: '已终止', color: '#d9d9d9' },
  };
  return map[status] || { label: status, color: '#d9d9d9' };
};

export const getHandoverStatusDisplay = (status: string): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: '待交接', color: '#faad14' },
    in_progress: { label: '交接中', color: '#1890ff' },
    completed: { label: '已完成', color: '#52c41a' },
    disputed: { label: '有争议', color: '#f5222d' },
  };
  return map[status] || { label: status, color: '#d9d9d9' };
};

export const getDepositStatusDisplay = (status: string): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    unpaid: { label: '未支付', color: '#fa8c16' },
    paid: { label: '已支付', color: '#52c41a' },
    refunding: { label: '退款中', color: '#1890ff' },
    refunded: { label: '已退还', color: '#52c41a' },
    deducted: { label: '已扣除', color: '#f5222d' },
    disputed: { label: '有争议', color: '#f5222d' },
  };
  return map[status] || { label: status, color: '#d9d9d9' };
};
