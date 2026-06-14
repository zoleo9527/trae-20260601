import { ExamTrackStatus, UserRole, OperationType } from '../types';

const validTransitions: Record<ExamTrackStatus, ExamTrackStatus[]> = {
  [ExamTrackStatus.DRAFT]: [
    ExamTrackStatus.SUBMITTED_BY_TEACHER
  ],
  [ExamTrackStatus.SUBMITTED_BY_TEACHER]: [
    ExamTrackStatus.REVIEWING_BY_ADMIN,
    ExamTrackStatus.APPROVED,
    ExamTrackStatus.REJECTED
  ],
  [ExamTrackStatus.REVIEWING_BY_ADMIN]: [
    ExamTrackStatus.APPROVED,
    ExamTrackStatus.REJECTED
  ],
  [ExamTrackStatus.APPROVED]: [
    ExamTrackStatus.IN_PRACTICE
  ],
  [ExamTrackStatus.REJECTED]: [
    ExamTrackStatus.SUPPLEMENTED
  ],
  [ExamTrackStatus.SUPPLEMENTED]: [
    ExamTrackStatus.SUBMITTED_BY_TEACHER,
    ExamTrackStatus.IN_PRACTICE
  ],
  [ExamTrackStatus.IN_PRACTICE]: [
    ExamTrackStatus.COMPLETED
  ],
  [ExamTrackStatus.COMPLETED]: [
    ExamTrackStatus.EXAM_PASSED,
    ExamTrackStatus.EXAM_FAILED
  ],
  [ExamTrackStatus.EXAM_PASSED]: [],
  [ExamTrackStatus.EXAM_FAILED]: [
    ExamTrackStatus.IN_PRACTICE
  ]
};

const rolePermissions: Record<UserRole, OperationType[]> = {
  [UserRole.ADMIN]: [
    OperationType.APPROVE,
    OperationType.REJECT,
    OperationType.CONFIRM_EXAM_RESULT
  ],
  [UserRole.TEACHER]: [
    OperationType.CREATE,
    OperationType.SUBMIT,
    OperationType.UPDATE_PLAN,
    OperationType.UPDATE_PROGRESS,
    OperationType.SUPPLEMENT,
    OperationType.COMPLETE
  ],
  [UserRole.CONSULTANT]: []
};

const operationToStatus: Record<OperationType, ExamTrackStatus> = {
  [OperationType.CREATE]: ExamTrackStatus.DRAFT,
  [OperationType.SUBMIT]: ExamTrackStatus.SUBMITTED_BY_TEACHER,
  [OperationType.REVIEW]: ExamTrackStatus.REVIEWING_BY_ADMIN,
  [OperationType.APPROVE]: ExamTrackStatus.APPROVED,
  [OperationType.REJECT]: ExamTrackStatus.REJECTED,
  [OperationType.SUPPLEMENT]: ExamTrackStatus.SUPPLEMENTED,
  [OperationType.UPDATE_PLAN]: ExamTrackStatus.DRAFT,
  [OperationType.UPDATE_PROGRESS]: ExamTrackStatus.IN_PRACTICE,
  [OperationType.COMPLETE]: ExamTrackStatus.COMPLETED,
  [OperationType.CONFIRM_EXAM_RESULT]: ExamTrackStatus.EXAM_PASSED
};

export const stateMachine = {
  isValidTransition: (currentStatus: ExamTrackStatus, newStatus: ExamTrackStatus): boolean => {
    return validTransitions[currentStatus].includes(newStatus);
  },

  canPerformOperation: (role: UserRole, operationType: OperationType): boolean => {
    return rolePermissions[role].includes(operationType);
  },

  getStatusFromOperation: (operationType: OperationType): ExamTrackStatus => {
    return operationToStatus[operationType];
  },

  getNextStatus: (currentStatus: ExamTrackStatus, operationType: OperationType): ExamTrackStatus | null => {
    const targetStatus = operationToStatus[operationType];
    if (stateMachine.isValidTransition(currentStatus, targetStatus)) {
      return targetStatus;
    }
    return null;
  },

  getStatusLabel: (status: ExamTrackStatus): string => {
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
  },

  getOperationLabel: (operationType: OperationType): string => {
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
    return labels[operationType];
  },

  getRoleLabel: (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: '教务老师',
      [UserRole.TEACHER]: '任课老师',
      [UserRole.CONSULTANT]: '家长顾问'
    };
    return labels[role];
  },

  getStatusColor: (status: ExamTrackStatus): string => {
    const colors: Record<ExamTrackStatus, string> = {
      [ExamTrackStatus.DRAFT]: 'gray',
      [ExamTrackStatus.SUBMITTED_BY_TEACHER]: 'blue',
      [ExamTrackStatus.REVIEWING_BY_ADMIN]: 'orange',
      [ExamTrackStatus.APPROVED]: 'green',
      [ExamTrackStatus.REJECTED]: 'red',
      [ExamTrackStatus.SUPPLEMENTED]: 'purple',
      [ExamTrackStatus.IN_PRACTICE]: 'cyan',
      [ExamTrackStatus.COMPLETED]: 'teal',
      [ExamTrackStatus.EXAM_PASSED]: 'gold',
      [ExamTrackStatus.EXAM_FAILED]: 'darkred'
    };
    return colors[status];
  },

  getTodoStatusesForRole: (role: UserRole): ExamTrackStatus[] => {
    switch (role) {
      case UserRole.ADMIN:
        return [
          ExamTrackStatus.SUBMITTED_BY_TEACHER,
          ExamTrackStatus.REVIEWING_BY_ADMIN,
          ExamTrackStatus.COMPLETED
        ];
      case UserRole.TEACHER:
        return [
          ExamTrackStatus.DRAFT,
          ExamTrackStatus.REJECTED,
          ExamTrackStatus.IN_PRACTICE
        ];
      case UserRole.CONSULTANT:
        return [
          ExamTrackStatus.IN_PRACTICE,
          ExamTrackStatus.COMPLETED
        ];
      default:
        return [];
    }
  }
};
