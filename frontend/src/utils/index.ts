import { ExamTrackStatus, UserRole, OperationType } from '../types';

export const getStatusLabel = (status: ExamTrackStatus): string => {
  const labels: Record<ExamTrackStatus, string> = {
    [ExamTrackStatus.DRAFT]: '草稿',
    [ExamTrackStatus.SUBMITTED_BY_TEACHER]: '已提交',
    [ExamTrackStatus.REVIEWING_BY_ADMIN]: '审核中',
    [ExamTrackStatus.APPROVED]: '已通过',
    [ExamTrackStatus.REJECTED]: '已退回',
    [ExamTrackStatus.SUPPLEMENTED]: '已补充',
    [ExamTrackStatus.IN_PRACTICE]: '练习中',
    [ExamTrackStatus.COMPLETED]: '已完成',
    [ExamTrackStatus.EXAM_PASSED]: '考级通过',
    [ExamTrackStatus.EXAM_FAILED]: '考级未通过'
  };
  return labels[status];
};

export const getStatusColor = (status: ExamTrackStatus): string => {
  const colors: Record<ExamTrackStatus, string> = {
    [ExamTrackStatus.DRAFT]: 'bg-gray-100 text-gray-600',
    [ExamTrackStatus.SUBMITTED_BY_TEACHER]: 'bg-blue-100 text-blue-600',
    [ExamTrackStatus.REVIEWING_BY_ADMIN]: 'bg-orange-100 text-orange-600',
    [ExamTrackStatus.APPROVED]: 'bg-green-100 text-green-600',
    [ExamTrackStatus.REJECTED]: 'bg-red-100 text-red-600',
    [ExamTrackStatus.SUPPLEMENTED]: 'bg-purple-100 text-purple-600',
    [ExamTrackStatus.IN_PRACTICE]: 'bg-cyan-100 text-cyan-600',
    [ExamTrackStatus.COMPLETED]: 'bg-teal-100 text-teal-600',
    [ExamTrackStatus.EXAM_PASSED]: 'bg-yellow-100 text-yellow-600',
    [ExamTrackStatus.EXAM_FAILED]: 'bg-red-100 text-red-600'
  };
  return colors[status];
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    [UserRole.ADMIN]: '教务老师',
    [UserRole.TEACHER]: '任课老师',
    [UserRole.CONSULTANT]: '家长顾问'
  };
  return labels[role];
};

export const getOperationLabel = (operation: OperationType): string => {
  const labels: Record<OperationType, string> = {
    [OperationType.CREATE]: '创建',
    [OperationType.SUBMIT]: '提交审核',
    [OperationType.REVIEW]: '进入审核',
    [OperationType.APPROVE]: '审核通过',
    [OperationType.REJECT]: '退回修改',
    [OperationType.SUPPLEMENT]: '补充修改',
    [OperationType.UPDATE_PLAN]: '更新计划',
    [OperationType.UPDATE_PROGRESS]: '更新进度',
    [OperationType.COMPLETE]: '标记完成',
    [OperationType.CONFIRM_EXAM_RESULT]: '确认考级结果'
  };
  return labels[operation];
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateOnly = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const getDayOfWeekLabel = (day: number): string => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[day - 1] || '';
};

export const getTrackTypeLabel = (type: 'required' | 'optional'): string => {
  return type === 'required' ? '必考' : '选考';
};
