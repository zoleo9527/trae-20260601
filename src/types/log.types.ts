export enum OperationType {
  CREATE_TASK = 'create_task',
  ASSIGN_TASK = 'assign_task',
  ACCEPT_TASK = 'accept_task',
  START_SURVEY = 'start_survey',
  COMPLETE_SURVEY = 'complete_survey',
  CANCEL_TASK = 'cancel_task',
  UPDATE_TASK_STATUS = 'update_task_status',
  CREATE_ASSESSMENT = 'create_assessment',
  UPDATE_ASSESSMENT = 'update_assessment',
  SUBMIT_ASSESSMENT = 'submit_assessment',
  REVIEW_ASSESSMENT = 'review_assessment',
  APPROVE_ASSESSMENT = 'approve_assessment',
  REJECT_ASSESSMENT = 'reject_assessment'
}

export interface OperationLog {
  logId: string;
  taskId?: string;
  assessmentId?: string;
  operationType: OperationType;
  operationDesc: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  beforeStatus?: string;
  afterStatus?: string;
  remark?: string;
  evidence?: Record<string, unknown>;
  createdTime: string;
}

export interface TimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  operator: string;
  role: string;
  icon: string;
  color: string;
}

export interface LogFilter {
  taskId?: string;
  assessmentId?: string;
  operatorId?: string;
  operationType?: OperationType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  [OperationType.CREATE_TASK]: '创建任务',
  [OperationType.ASSIGN_TASK]: '分配任务',
  [OperationType.ACCEPT_TASK]: '接单',
  [OperationType.START_SURVEY]: '开始查勘',
  [OperationType.COMPLETE_SURVEY]: '完成查勘',
  [OperationType.CANCEL_TASK]: '取消任务',
  [OperationType.UPDATE_TASK_STATUS]: '更新状态',
  [OperationType.CREATE_ASSESSMENT]: '创建定损',
  [OperationType.UPDATE_ASSESSMENT]: '修改定损',
  [OperationType.SUBMIT_ASSESSMENT]: '提交定损',
  [OperationType.REVIEW_ASSESSMENT]: '审核定损',
  [OperationType.APPROVE_ASSESSMENT]: '通过定损',
  [OperationType.REJECT_ASSESSMENT]: '拒绝定损'
};
