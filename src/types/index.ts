export type UserRole = "admin" | "teacher" | "principal";

export type CostumeStatus =
  | "created"
  | "roster_pending"
  | "roster_confirmed"
  | "sizing_pending"
  | "sizing_entered"
  | "size_confirm_pending"
  | "size_confirmed"
  | "approval_pending"
  | "approved"
  | "ordering"
  | "received"
  | "distributed"
  | "archived";

export type SizeConfirmStatus = "pending" | "confirmed" | "exception";

export interface Operator {
  name: string;
  role: UserRole;
}

export interface TimelineEntry {
  id: string;
  costumeId: string;
  status: CostumeStatus;
  operatorName: string;
  operatorRole: UserRole;
  assigneeName: string;
  assigneeRole: UserRole;
  timestamp: string;
  remark: string;
}

export interface SizeChangeLog {
  id: string;
  studentSizeId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
  remark: string;
}

export interface StudentSize {
  id: string;
  costumeId: string;
  studentName: string;
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  size?: string;
  confirmStatus: SizeConfirmStatus;
  remark: string;
  createdAt: string;
  updatedAt: string;
  changeLogs: SizeChangeLog[];
}

export interface Costume {
  id: string;
  name: string;
  performanceDate: string;
  totalSets: number;
  budget: number;
  classes: string;
  status: CostumeStatus;
  currentAssignee: string;
  currentAssigneeRole: UserRole;
  remark: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
  studentSizes: StudentSize[];
}

export interface AppFilters {
  status?: CostumeStatus;
  assigneeRole?: UserRole;
  keyword?: string;
  stuckPreset?: string;
  sizeConfirmStatus?: SizeConfirmStatus;
}

export interface RecentStudentRef {
  costumeId: string;
  studentId: string;
  studentName: string;
  timestamp: string;
}

export interface StatusMeta {
  label: string;
  description: string;
  assigneeRole: UserRole;
  order: number;
}

export interface RoleMeta {
  label: string;
  color: string;
  avatarColor: string;
}
