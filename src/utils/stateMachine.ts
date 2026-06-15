import type {
  UserRole,
  PrintScheduleStatus,
  CustomerDraftStatus,
  MaterialPickupStatus,
  InstallationStatus,
  AuditAction,
} from '@/types';

export interface StateTransition {
  from: string;
  to: string;
  allowedRoles: UserRole[];
  action: AuditAction;
  label: string;
}

export const customerDraftTransitions: StateTransition[] = [
  {
    from: 'pending_review',
    to: 'approved',
    allowedRoles: ['manager'],
    action: 'draft_review',
    label: '审核通过',
  },
  {
    from: 'pending_review',
    to: 'rejected',
    allowedRoles: ['manager'],
    action: 'draft_reject',
    label: '审核拒绝',
  },
  {
    from: 'pending_review',
    to: 'size_issue',
    allowedRoles: ['processor', 'manager'],
    action: 'draft_size_issue',
    label: '尺寸有问题',
  },
  {
    from: 'pending_review',
    to: 'color_issue',
    allowedRoles: ['processor', 'manager'],
    action: 'draft_color_issue',
    label: '颜色有问题',
  },
  {
    from: 'size_issue',
    to: 'pending_review',
    allowedRoles: ['reception', 'manager'],
    action: 'draft_create',
    label: '重新提交审核',
  },
  {
    from: 'color_issue',
    to: 'pending_review',
    allowedRoles: ['reception', 'manager'],
    action: 'draft_create',
    label: '重新提交审核',
  },
];

export const printScheduleTransitions: StateTransition[] = [
  {
    from: 'draft',
    to: 'submitted',
    allowedRoles: ['reception', 'manager'],
    action: 'schedule_submit',
    label: '提交排产',
  },
  {
    from: 'submitted',
    to: 'material_confirmed',
    allowedRoles: ['processor', 'manager'],
    action: 'schedule_material_confirm',
    label: '确认材料领用',
  },
  {
    from: 'material_confirmed',
    to: 'printing',
    allowedRoles: ['processor', 'manager'],
    action: 'schedule_start_print',
    label: '开始喷绘',
  },
  {
    from: 'printing',
    to: 'printed',
    allowedRoles: ['processor', 'manager'],
    action: 'schedule_complete_print',
    label: '喷绘完成',
  },
  {
    from: 'printed',
    to: 'installing',
    allowedRoles: ['processor', 'manager'],
    action: 'schedule_start_install',
    label: '开始安装',
  },
  {
    from: 'installing',
    to: 'completed',
    allowedRoles: ['processor', 'manager'],
    action: 'schedule_complete',
    label: '订单完成',
  },
  {
    from: 'draft',
    to: 'cancelled',
    allowedRoles: ['manager'],
    action: 'schedule_cancel',
    label: '取消订单',
  },
  {
    from: 'submitted',
    to: 'cancelled',
    allowedRoles: ['manager'],
    action: 'schedule_cancel',
    label: '取消订单',
  },
];

export const materialPickupTransitions: StateTransition[] = [
  {
    from: 'pending',
    to: 'confirmed',
    allowedRoles: ['processor', 'manager'],
    action: 'material_confirm',
    label: '确认领用',
  },
  {
    from: 'confirmed',
    to: 'returned',
    allowedRoles: ['processor', 'manager'],
    action: 'material_return',
    label: '退回材料',
  },
];

export const installationTransitions: StateTransition[] = [
  {
    from: 'scheduled',
    to: 'time_changed',
    allowedRoles: ['reception', 'manager'],
    action: 'install_time_change',
    label: '变更安装时间',
  },
  {
    from: 'scheduled',
    to: 'in_progress',
    allowedRoles: ['processor', 'manager'],
    action: 'install_start',
    label: '开始安装',
  },
  {
    from: 'time_changed',
    to: 'in_progress',
    allowedRoles: ['processor', 'manager'],
    action: 'install_start',
    label: '开始安装',
  },
  {
    from: 'in_progress',
    to: 'completed',
    allowedRoles: ['processor', 'manager'],
    action: 'install_complete',
    label: '安装完成',
  },
  {
    from: 'in_progress',
    to: 'failed',
    allowedRoles: ['processor', 'manager'],
    action: 'install_fail',
    label: '安装失败',
  },
  {
    from: 'failed',
    to: 'in_progress',
    allowedRoles: ['processor', 'manager'],
    action: 'install_start',
    label: '重新安装',
  },
];

export function canTransition(
  transitions: StateTransition[],
  from: string,
  to: string,
  role: UserRole
): boolean {
  const transition = transitions.find(
    (t) => t.from === from && t.to === to
  );
  if (!transition) return false;
  return transition.allowedRoles.includes(role);
}

export function getAvailableActions(
  transitions: StateTransition[],
  currentState: string,
  role: UserRole
): StateTransition[] {
  return transitions.filter(
    (t) => t.from === currentState && t.allowedRoles.includes(role)
  );
}

export function validateScheduleStatusFlow(
  currentStatus: PrintScheduleStatus,
  targetStatus: PrintScheduleStatus,
  role: UserRole
): boolean {
  return canTransition(printScheduleTransitions, currentStatus, targetStatus, role);
}

export function validateDraftStatusFlow(
  currentStatus: CustomerDraftStatus,
  targetStatus: CustomerDraftStatus,
  role: UserRole
): boolean {
  return canTransition(customerDraftTransitions, currentStatus, targetStatus, role);
}

export function validateMaterialPickupFlow(
  currentStatus: MaterialPickupStatus,
  targetStatus: MaterialPickupStatus,
  role: UserRole
): boolean {
  return canTransition(materialPickupTransitions, currentStatus, targetStatus, role);
}

export function validateInstallationFlow(
  currentStatus: InstallationStatus,
  targetStatus: InstallationStatus,
  role: UserRole
): boolean {
  return canTransition(installationTransitions, currentStatus, targetStatus, role);
}

export const statusDisplayMap: Record<string, { text: string; color: string }> = {
  pending_review: { text: '待审核', color: 'gold' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' },
  size_issue: { text: '尺寸问题', color: 'orange' },
  color_issue: { text: '颜色问题', color: 'orange' },
  draft: { text: '草稿', color: 'default' },
  submitted: { text: '已提交', color: 'blue' },
  material_confirmed: { text: '材料已确认', color: 'cyan' },
  printing: { text: '喷绘中', color: 'purple' },
  printed: { text: '喷绘完成', color: 'geekblue' },
  installing: { text: '安装中', color: 'magenta' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
  pending: { text: '待确认', color: 'gold' },
  confirmed: { text: '已确认', color: 'green' },
  returned: { text: '已退回', color: 'orange' },
  scheduled: { text: '已排期', color: 'blue' },
  time_changed: { text: '时间已变更', color: 'orange' },
  in_progress: { text: '进行中', color: 'purple' },
  failed: { text: '失败', color: 'red' },
};

export const roleDisplayMap: Record<UserRole, string> = {
  reception: '前台',
  processor: '处理人员',
  manager: '店长',
};

export const actionDisplayMap: Record<AuditAction, string> = {
  draft_create: '创建客户稿件',
  draft_review: '审核通过稿件',
  draft_reject: '审核拒绝稿件',
  draft_size_issue: '标记尺寸问题',
  draft_color_issue: '标记颜色问题',
  schedule_create: '创建喷绘排产',
  schedule_submit: '提交喷绘排产',
  schedule_material_confirm: '确认材料领用',
  schedule_start_print: '开始喷绘',
  schedule_complete_print: '完成喷绘',
  schedule_start_install: '开始安装',
  schedule_complete: '完成订单',
  schedule_cancel: '取消订单',
  material_pickup: '登记材料领用',
  material_confirm: '确认材料领用',
  material_return: '退回材料',
  install_schedule: '安排安装',
  install_time_change: '变更安装时间',
  install_start: '开始安装',
  install_complete: '完成安装',
  install_fail: '安装失败',
  archive: '归档',
};

export const exceptionTypeDisplayMap: Record<string, string> = {
  size_error: '尺寸错误',
  color_complaint: '色差投诉',
  install_time_change: '安装时间变更',
  other: '其他问题',
};
