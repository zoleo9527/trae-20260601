export type RoleType = 'registrar' | 'trainer' | 'safety_officer';

export type ExamBatchStatus = 
  | 'pending' 
  | 'submitted' 
  | 'confirmed' 
  | 'exam_completed' 
  | 'cancelled';

export type StudentNotificationStatus = 
  | 'pending' 
  | 'notified' 
  | 'confirmed' 
  | 'absent' 
  | 'completed';

export type ExceptionType = 
  | 'missing_documents' 
  | 'timeout' 
  | 'review_failed';

export type ActionType = 
  | 'create_batch'
  | 'submit_batch'
  | 'confirm_batch'
  | 'cancel_batch'
  | 'complete_exam'
  | 'send_notification'
  | 'confirm_notification'
  | 'mark_absent'
  | 'complete_notification'
  | 'handle_exception';

export interface RolePermission {
  action: ActionType;
  allowedRoles: RoleType[];
  description: string;
}

export const ROLE_PERMISSIONS: RolePermission[] = [
  { action: 'create_batch', allowedRoles: ['registrar'], description: '报名员可以创建考试批次' },
  { action: 'submit_batch', allowedRoles: ['registrar'], description: '报名员提交考试批次' },
  { action: 'confirm_batch', allowedRoles: ['trainer', 'safety_officer'], description: '场地教练或安全员确认批次' },
  { action: 'cancel_batch', allowedRoles: ['trainer', 'safety_officer'], description: '场地教练或安全员取消批次' },
  { action: 'complete_exam', allowedRoles: ['safety_officer'], description: '安全员完成考试' },
  { action: 'send_notification', allowedRoles: ['trainer'], description: '场地教练发送学员通知' },
  { action: 'confirm_notification', allowedRoles: ['safety_officer'], description: '安全员确认学员通知' },
  { action: 'mark_absent', allowedRoles: ['trainer', 'safety_officer'], description: '教练或安全员标记缺考' },
  { action: 'complete_notification', allowedRoles: ['trainer'], description: '场地教练完成通知' },
  { action: 'handle_exception', allowedRoles: ['registrar', 'trainer', 'safety_officer'], description: '任何角色都可以处理异常' },
];

export const checkRolePermission = (action: ActionType, role: RoleType): boolean => {
  const permission = ROLE_PERMISSIONS.find(p => p.action === action);
  return permission ? permission.allowedRoles.includes(role) : false;
};

export const getRoleName = (role: RoleType): string => {
  const roleNames: Record<RoleType, string> = {
    registrar: '报名员',
    trainer: '场地教练',
    safety_officer: '安全员',
  };
  return roleNames[role];
};

export const ROLE_NAMES: Record<RoleType, string> = {
  registrar: '报名员',
  trainer: '场地教练',
  safety_officer: '安全员',
};

export interface User {
  id: string;
  name: string;
  role: RoleType;
  phone: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  trainingHours: number;
  documentsComplete: boolean;
}

export interface ExamBatch {
  id: string;
  batchNumber: string;
  examDate: string;
  examTime: string;
  location: string;
  status: ExamBatchStatus;
  submitterId: string;
  submitterName: string;
  submitTime: string;
  confirmerId?: string;
  confirmerName?: string;
  confirmTime?: string;
  students: string[];
  exceptionRecords: ExceptionRecord[];
}

export interface StudentNotification {
  id: string;
  batchId: string;
  studentId: string;
  studentName: string;
  status: StudentNotificationStatus;
  notifierId?: string;
  notifierName?: string;
  notifyTime?: string;
  confirmerId?: string;
  confirmerName?: string;
  confirmTime?: string;
  remarks?: string;
}

export interface ExceptionRecord {
  id: string;
  batchId: string;
  studentId: string;
  studentName: string;
  type: ExceptionType;
  description: string;
  createdAt: string;
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  resolved: boolean;
}

export interface OperationLog {
  id: string;
  operationType: string;
  targetType: 'batch' | 'notification' | 'exception';
  targetId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: RoleType;
  timestamp: string;
  details: string;
}

export interface ErrorCode {
  code: string;
  message: string;
  description: string;
}

export const EXAM_BATCH_STATUS_MAP: Record<ExamBatchStatus, string> = {
  pending: '待提交',
  submitted: '已提交',
  confirmed: '已确认',
  exam_completed: '考试完成',
  cancelled: '已取消',
};

export const STUDENT_NOTIFICATION_STATUS_MAP: Record<StudentNotificationStatus, string> = {
  pending: '待通知',
  notified: '已通知',
  confirmed: '已确认',
  absent: '缺考',
  completed: '已完成',
};

export const EXCEPTION_TYPE_MAP: Record<ExceptionType, string> = {
  missing_documents: '材料缺失',
  timeout: '超时未处理',
  review_failed: '复核不通过',
};

export interface WorkflowTransition {
  from: ExamBatchStatus | StudentNotificationStatus;
  to: ExamBatchStatus | StudentNotificationStatus;
  action: string;
  allowedRoles: RoleType[];
  errorCode: string;
}

export const BATCH_WORKFLOW: WorkflowTransition[] = [
  { from: 'pending', to: 'submitted', action: '提交批次', allowedRoles: ['registrar'], errorCode: 'EB002' },
  { from: 'submitted', to: 'confirmed', action: '确认批次', allowedRoles: ['trainer', 'safety_officer'], errorCode: 'EB002' },
  { from: 'confirmed', to: 'exam_completed', action: '完成考试', allowedRoles: ['safety_officer'], errorCode: 'EB002' },
  { from: 'pending', to: 'cancelled', action: '取消批次', allowedRoles: ['trainer', 'safety_officer'], errorCode: 'EB002' },
  { from: 'submitted', to: 'cancelled', action: '取消批次', allowedRoles: ['trainer', 'safety_officer'], errorCode: 'EB002' },
];

export const NOTIFICATION_WORKFLOW: WorkflowTransition[] = [
  { from: 'pending', to: 'notified', action: '发送通知', allowedRoles: ['trainer'], errorCode: 'SN003' },
  { from: 'pending', to: 'absent', action: '标记缺考', allowedRoles: ['trainer', 'safety_officer'], errorCode: 'SN003' },
  { from: 'notified', to: 'confirmed', action: '确认通知', allowedRoles: ['safety_officer'], errorCode: 'SN003' },
  { from: 'notified', to: 'absent', action: '标记缺考', allowedRoles: ['trainer', 'safety_officer'], errorCode: 'SN003' },
  { from: 'confirmed', to: 'completed', action: '完成通知', allowedRoles: ['trainer'], errorCode: 'SN003' },
];

export const getNextBatchStatus = (currentStatus: ExamBatchStatus, role: RoleType): ExamBatchStatus | null => {
  const transition = BATCH_WORKFLOW.find(t => t.from === currentStatus && t.allowedRoles.includes(role));
  return transition ? transition.to as ExamBatchStatus : null;
};

export const getNextNotificationStatus = (currentStatus: StudentNotificationStatus, role: RoleType): StudentNotificationStatus | null => {
  const transition = NOTIFICATION_WORKFLOW.find(t => t.from === currentStatus && t.allowedRoles.includes(role));
  return transition ? transition.to as StudentNotificationStatus : null;
};

export const ERROR_CODES: ErrorCode[] = [
  { code: 'EB001', message: '考试批次不存在', description: '根据ID未找到对应的考试批次' },
  { code: 'EB002', message: '考试批次状态不允许此操作', description: '当前状态无法执行该操作' },
  { code: 'EB003', message: '考试批次已过期', description: '考试日期已过，无法修改' },
  { code: 'SN001', message: '学员通知不存在', description: '根据ID未找到对应的学员通知' },
  { code: 'SN002', message: '学员未在考试批次中', description: '该学员未被分配到指定批次' },
  { code: 'SN003', message: '通知状态不允许此操作', description: '当前通知状态无法执行该操作' },
  { code: 'EX001', message: '异常记录不存在', description: '根据ID未找到对应的异常记录' },
  { code: 'EX002', message: '异常已处理完成', description: '该异常记录已被处理完毕' },
  { code: 'USR001', message: '用户未登录', description: '需要先登录系统' },
  { code: 'USR002', message: '权限不足', description: '当前用户无此操作权限' },
];
