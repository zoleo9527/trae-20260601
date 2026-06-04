export type UserRole = 'nursing_supervisor' | 'care_worker' | 'social_worker';

export type NursingLevelType = 1 | 2 | 3 | 4 | 5;

export type BedStatus = 'available' | 'occupied' | 'pending_adjustment' | 'maintenance';

export type ResidentStatus = 'active' | 'pending_transfer' | 'discharged';

export type NursingLevelStatus = 'pending' | 'confirmed' | 'anomaly' | 'returned';

export type NoteSource = 'bed_arrangement' | 'nursing_level' | 'anomaly_return';

export type AnomalyType = 'health_change' | 'behavior_change' | 'family_complaint' | 'other';

export type AnomalyAction = 'alert' | 'return';

export type NursingLevelSource = 'bed_arrangement' | 'periodic_assessment' | 'anomaly_report';

export interface Note {
  id: string;
  content: string;
  source: NoteSource;
  transferredToNursingLevel: boolean;
  createdAt: string;
  createdBy: UserRole;
}

export interface AnomalyDetail {
  type: AnomalyType;
  description: string;
  action: AnomalyAction;
  returnedFrom?: string;
  returnReason?: string;
}

export interface NursingLevelHistory {
  id: string;
  fromLevel: NursingLevelType;
  toLevel: NursingLevelType;
  source: NursingLevelSource;
  changedAt: string;
  changedBy: UserRole;
  note?: string;
}

export interface Resident {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  admissionDate: string;
  nursingLevel: NursingLevelType;
  bedId: string;
  notes: Note[];
  status: ResidentStatus;
}

export interface Bed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  floor: number;
  status: BedStatus;
  residentId: string | null;
  notes: Note[];
}

export interface NursingLevel {
  id: string;
  residentId: string;
  level: NursingLevelType;
  source: NursingLevelSource;
  status: NursingLevelStatus;
  createdAt: string;
  confirmedAt: string | null;
  anomalyDetail: AnomalyDetail | null;
  notes: Note[];
  history: NursingLevelHistory[];
}

export interface Notification {
  id: string;
  type: 'anomaly' | 'return' | 'level_change' | 'task';
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: 'bed' | 'nursing_level';
}

export const NURSING_LEVEL_LABELS: Record<NursingLevelType, string> = {
  1: '一级',
  2: '二级',
  3: '三级',
  4: '四级',
  5: '五级',
};

export const NURSING_LEVEL_COLORS: Record<NursingLevelType, string> = {
  1: 'bg-emerald-100 text-emerald-800',
  2: 'bg-sky-100 text-sky-800',
  3: 'bg-amber-100 text-amber-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800',
};

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  available: '空闲',
  occupied: '已住',
  pending_adjustment: '待调整',
  maintenance: '维护中',
};

export const BED_STATUS_COLORS: Record<BedStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-sky-500',
  pending_adjustment: 'bg-amber-500',
  maintenance: 'bg-zinc-400',
};

export const NURSING_LEVEL_STATUS_LABELS: Record<NursingLevelStatus, string> = {
  pending: '待评估',
  confirmed: '已确认',
  anomaly: '异常',
  returned: '已退回',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  nursing_supervisor: '护理主管',
  care_worker: '责任护工',
  social_worker: '社工',
};

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  health_change: '健康状况变化',
  behavior_change: '行为异常',
  family_complaint: '家属投诉',
  other: '其他',
};
