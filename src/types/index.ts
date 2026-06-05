export type UserRole = 'reception' | 'coach' | 'manager';

export type RecordStatus = 
  | 'pending_coach_confirm'
  | 'pending_reception_handle'
  | 'pending_manager_audit'
  | 'completed'
  | 'disputed';

export type RejectReason = 
  | 'time_conflict'
  | 'student_no_show'
  | 'venue_issue'
  | 'coach_unavailable'
  | 'other';

export type ResponsibilityFlag = 
  | 'none'
  | 'reception'
  | 'coach'
  | 'both'
  | 'unclear';

export interface ActionHistory {
  id: string;
  timestamp: number;
  operator: UserRole;
  operatorName: string;
  action: string;
  remark?: string;
}

export interface ScheduleRecord {
  id: string;
  studentName: string;
  studentPhone?: string;
  courseType: string;
  coachId: string;
  coachName: string;
  venueId: string;
  venueName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: RecordStatus;
  createdAt: number;
  updatedAt: number;
  isOverdue: boolean;
  confirmedAt?: number;
  confirmedBy?: string;
  rejectedAt?: number;
  rejectedBy?: string;
  rejectReason?: RejectReason;
  rejectRemark?: string;
  receptionRemark?: string;
  coachRemark?: string;
  responsibility: ResponsibilityFlag;
  responsibilityRemark?: string;
  hasResponsibilityRisk: boolean;
  rejectCount: number;
  history: ActionHistory[];
}

export interface Coach {
  id: string;
  name: string;
  phone: string;
  specialty: string[];
}

export interface Venue {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

export const roleNames: Record<UserRole, string> = {
  reception: '场馆前台',
  coach: '教练',
  manager: '值班店长'
};

export const statusNames: Record<RecordStatus, string> = {
  pending_coach_confirm: '待教练确认',
  pending_reception_handle: '待前台处理',
  pending_manager_audit: '待店长仲裁',
  completed: '已完成',
  disputed: '有争议'
};

export const rejectReasonNames: Record<RejectReason, string> = {
  time_conflict: '时间冲突',
  student_no_show: '学员未到',
  venue_issue: '场地问题',
  coach_unavailable: '教练无法到场',
  other: '其他原因'
};

export const responsibilityNames: Record<ResponsibilityFlag, string> = {
  none: '无',
  reception: '前台责任',
  coach: '教练责任',
  both: '双方都有',
  unclear: '责任不清'
};
