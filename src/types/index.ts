export enum TrainingNeedStatus {
  DRAFT = '草稿',
  PENDING_REVIEW = '待审核',
  APPROVED = '已通过',
  REJECTED = '已退回',
  SCHEDULED = '已排期'
}

export enum ScheduleStatus {
  PENDING = '待排期',
  SCHEDULED = '已排期',
  CONFIRMED = '已确认',
  REJECTED = '讲师拒绝',
  ENROLLING = '报名中',
  ENROLLMENT_CLOSED = '报名截止',
  IN_PROGRESS = '培训中',
  COMPLETED = '已完成'
}

export enum EnrollmentStatus {
  PENDING = '待确认',
  CONFIRMED = '已确认',
  REJECTED = '已退回',
  RESET = '已重置'
}

export enum TodoType {
  TODAY = '今天要办',
  OVERDUE = '已经拖延',
  RETURNED = '刚刚退回'
}

export type UserRole = 'manager' | 'department' | 'instructor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
}

export interface Student {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  email: string;
  phone: string;
}

export interface TrainingNeed {
  id: string;
  title: string;
  description: string;
  status: TrainingNeedStatus;
  departmentId: string;
  departmentName: string;
  participantDepartments: string[];
  createdAt: Date;
  deadline: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  reviewerName?: string;
  rejectedReason?: string;
}

export interface Instructor {
  id: string;
  name: string;
  expertise: string[];
  contact: string;
  avatar?: string;
}

export interface Schedule {
  id: string;
  trainingNeedId: string;
  trainingNeedTitle: string;
  instructorId: string;
  instructorName: string;
  startTime: Date;
  endTime: Date;
  location: string;
  status: ScheduleStatus;
  createdAt: Date;
  confirmedAt?: Date;
  rejectedReason?: string;
  participantDepartments: string[];
}

export interface Enrollment {
  id: string;
  scheduleId: string;
  scheduleTitle: string;
  departmentId: string;
  departmentName: string;
  studentList: Student[];
  status: EnrollmentStatus;
  createdAt: Date;
  deadline: Date;
  confirmedAt?: Date;
  rejectedReason?: string;
  returnedAt?: Date;
  history?: EnrollmentHistory[];
}

export interface EnrollmentHistory {
  version: number;
  studentList: Student[];
  updatedAt: Date;
  updatedBy: string;
  status: string;
}

export interface TimelineLog {
  id: string;
  entityType: 'training_need' | 'schedule' | 'enrollment';
  entityId: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  createdAt: Date;
  details?: Record<string, unknown>;
}

export interface TodoItem {
  id: string;
  type: TodoType;
  category: 'need' | 'schedule' | 'enrollment' | 'training_need';
  title: string;
  description: string;
  deadline: Date;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  actions?: string[];
  createdAt?: Date;
  returnedAt?: Date;
  entityId: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
}