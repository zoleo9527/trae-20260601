export type UserRole = 'ADMIN' | 'CONSULTANT' | 'COACH' | 'SPECIALIST' | 'ARCHIVER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type StudentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REVIEW_PASSED'
  | 'PENDING_EXAM'
  | 'EXAM_PASSED'
  | 'ARCHIVED'
  | 'COACH_ASSIGNED'
  | 'TRAINING'
  | 'PENDING_EXAM_BOOKING'
  | 'EXAM_PASSED_FINAL'
  | 'COMPLETED';

export interface Student {
  id: string;
  studentNo: string;
  name: string;
  idCard: string;
  phone: string;
  address: string;
  carType: 'C1' | 'C2';
  enrollmentDate: string;
  status: StudentStatus;
  enrollmentConsultantId: string;
  coachId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Archive {
  id: string;
  studentId: string;
  archiveStatus: 'PENDING' | 'COMPLETE' | 'LOCKED';
  documentStatus: 'PENDING' | 'COMPLETE';
  missingDocuments: string[];
  lastUpdateBy: string;
  lastUpdateAt: string;
  lockedAt?: string;
  lockedBy?: string;
}

export type TrainingProgress =
  | 'NOT_STARTED'
  | 'THEORY'
  | 'PRACTICE_BASIC'
  | 'PRACTICE_INTERMEDIATE'
  | 'PRACTICE_ADVANCED'
  | 'READY_FOR_EXAM';

export interface Training {
  id: string;
  studentId: string;
  coachId: string;
  assignDate: string;
  progress: TrainingProgress;
  theoryCompleted: boolean;
  practiceHours: number;
  lastProgressUpdate: string;
}

export type ExamSubject = 'THEORY' | 'SUBJECT2' | 'SUBJECT3' | 'SUBJECT4';
export type ExamStatus = 'PENDING' | 'SCHEDULED' | 'TAKEN' | 'ABSENT';
export type ExamResult = 'PASSED' | 'FAILED';

export interface Exam {
  id: string;
  studentId: string;
  examSubject: ExamSubject;
  examDate: string;
  examStatus: ExamStatus;
  examResult?: ExamResult;
  examVenue: string;
  specialistId: string;
  absenceReason?: string;
  notes?: string;
  createdAt: string;
}

export type OperationType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'ARCHIVE_UPDATE'
  | 'TRAINING_UPDATE'
  | 'EXAM_SCHEDULE'
  | 'EXAM_RESULT';

export interface OperationLog {
  id: string;
  studentId: string;
  operatorId: string;
  operatorRole: UserRole;
  operationType: OperationType;
  beforeValue?: Record<string, any>;
  afterValue?: Record<string, any>;
  changeReason?: string;
  operatedAt: string;
}

export type NotificationType =
  | 'STUDENT_UPDATE'
  | 'ARCHIVE_UPDATE'
  | 'EXAM_RESULT'
  | 'TRAINING_UPDATE'
  | 'STATUS_CHANGE';

export interface Notification {
  id: string;
  studentId: string;
  recipientId: string;
  recipientRole: UserRole;
  notificationType: NotificationType;
  title: string;
  content: string;
  relatedOperationId: string;
  isRead: boolean;
  isConfirmed: boolean;
  confirmedAt?: string;
  createdAt: string;
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待资料审核',
  REVIEW_PASSED: '资料审核通过',
  PENDING_EXAM: '待体检',
  EXAM_PASSED: '体检合格',
  ARCHIVED: '已建档',
  COACH_ASSIGNED: '已分配教练',
  TRAINING: '培训中',
  PENDING_EXAM_BOOKING: '待考试',
  EXAM_PASSED_FINAL: '考试通过',
  COMPLETED: '结业',
};

export const TRAINING_PROGRESS_LABELS: Record<TrainingProgress, string> = {
  NOT_STARTED: '未开始',
  THEORY: '理论学习',
  PRACTICE_BASIC: '基础练习',
  PRACTICE_INTERMEDIATE: '进阶练习',
  PRACTICE_ADVANCED: '强化练习',
  READY_FOR_EXAM: '准备考试',
};

export const EXAM_SUBJECT_LABELS: Record<ExamSubject, string> = {
  THEORY: '科目一',
  SUBJECT2: '科目二',
  SUBJECT3: '科目三',
  SUBJECT4: '科目四',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '管理员',
  CONSULTANT: '招生顾问',
  COACH: '教练',
  SPECIALIST: '考试专员',
  ARCHIVER: '档案员',
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  CREATE: '新增',
  UPDATE: '修改',
  DELETE: '删除',
  STATUS_CHANGE: '状态变更',
  ARCHIVE_UPDATE: '档案更新',
  TRAINING_UPDATE: '训练更新',
  EXAM_SCHEDULE: '考试预约',
  EXAM_RESULT: '考试成绩',
};
