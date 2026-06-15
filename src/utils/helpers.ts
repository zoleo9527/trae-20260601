import type { MachineStatus, TestItemStatus, ApprovalStatus, ExceptionRecord } from '@/types';

export const statusLabels: Record<MachineStatus, string> = {
  pending: '待测试',
  testing: '测试中',
  test_passed: '测试通过',
  test_failed: '测试失败',
  pending_approval: '待验收',
  approved: '验收通过',
  rejected: '验收驳回',
  completed: '已交付',
};

export const statusColors: Record<MachineStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  testing: 'bg-blue-100 text-blue-700',
  test_passed: 'bg-green-100 text-green-700',
  test_failed: 'bg-red-100 text-red-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-orange-100 text-orange-700',
  completed: 'bg-purple-100 text-purple-700',
};

export const testItemStatusLabels: Record<TestItemStatus, string> = {
  pending: '待测试',
  passed: '通过',
  failed: '失败',
  skipped: '跳过',
};

export const testItemStatusColors: Record<TestItemStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-500',
};

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};

export const approvalStatusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const exceptionTypeLabels: Record<ExceptionRecord['type'], string> = {
  hardware: '硬件问题',
  software: '软件问题',
  configuration: '配置问题',
  other: '其他问题',
};

export const exceptionSeverityLabels: Record<ExceptionRecord['severity'], string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export const exceptionSeverityColors: Record<ExceptionRecord['severity'], string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const communicationTypeLabels: Record<string, string> = {
  call: '电话',
  wechat: '微信',
  note: '备注',
  other: '其他',
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
};

export const getStatusFlow = (status: MachineStatus): string => {
  const flow: Record<MachineStatus, string> = {
    pending: '下单 → 待测试',
    testing: '下单 → 测试中',
    test_passed: '下单 → 测试通过',
    test_failed: '下单 → 测试失败',
    pending_approval: '下单 → 测试通过 → 待验收',
    approved: '下单 → 测试通过 → 验收通过',
    rejected: '下单 → 测试通过 → 验收驳回',
    completed: '下单 → 测试通过 → 验收通过 → 已交付',
  };
  return flow[status];
};
