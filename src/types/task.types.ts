export enum TaskStatus {
  PENDING_ASSIGN = 'pending_assign',
  PENDING_PROCESS = 'pending_process',
  PROCESSING = 'processing',
  PENDING_ASSESSMENT = 'pending_assessment',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum UrgencyLevel {
  NORMAL = 1,
  URGENT = 2,
  CRITICAL = 3
}

export interface SurveyTask {
  taskId: string;
  taskNo: string;
  claimNo: string;
  policyNo?: string;
  licensePlate: string;
  vehicleType?: string;
  ownerName: string;
  ownerPhone: string;
  accidentTime: string;
  accidentLocation: string;
  accidentDesc: string;
  urgencyLevel: UrgencyLevel;
  status: TaskStatus;
  assignedSurveyorId?: string;
  assignedSurveyorName?: string;
  assignedTime?: string;
  surveyStartTime?: string;
  surveyEndTime?: string;
  claimAmount?: number;
  createdBy: string;
  createdByName: string;
  createdTime: string;
  updatedTime: string;
}

export interface CreateTaskParams {
  claimNo: string;
  policyNo?: string;
  licensePlate: string;
  vehicleType?: string;
  ownerName: string;
  ownerPhone: string;
  accidentTime: string;
  accidentLocation: string;
  accidentDesc: string;
  urgencyLevel: UrgencyLevel;
  claimAmount?: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  surveyorId?: string;
  urgencyLevel?: UrgencyLevel;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING_ASSIGN]: '待分配',
  [TaskStatus.PENDING_PROCESS]: '待处理',
  [TaskStatus.PROCESSING]: '处理中',
  [TaskStatus.PENDING_ASSESSMENT]: '待定损',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.CANCELLED]: '已取消'
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING_ASSIGN]: 'bg-gray-100 text-gray-700',
  [TaskStatus.PENDING_PROCESS]: 'bg-blue-100 text-blue-700',
  [TaskStatus.PROCESSING]: 'bg-yellow-100 text-yellow-700',
  [TaskStatus.PENDING_ASSESSMENT]: 'bg-purple-100 text-purple-700',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [TaskStatus.CANCELLED]: 'bg-red-100 text-red-700'
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.NORMAL]: '普通',
  [UrgencyLevel.URGENT]: '紧急',
  [UrgencyLevel.CRITICAL]: '加急'
};

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.NORMAL]: 'text-gray-600',
  [UrgencyLevel.URGENT]: 'text-orange-600',
  [UrgencyLevel.CRITICAL]: 'text-red-600'
};
