export interface Patient {
  id: string;
  name: string;
  gender: string;
  age: number;
  diagnosis: string;
  avatar: string;
}

export interface PainRecord {
  date: string;
  score: number;
}

export interface Course {
  id: string;
  patientId: string;
  totalSessions: number;
  completedSessions: number;
  startDate: string;
  painScoreAdmission: number;
  painScoreCurrent: number;
  painHistory: PainRecord[];
  unfinishedItems: string[];
}

export type ReassessmentConclusion = '结案' | '续疗' | '转诊' | '换方案';
export type ReassessmentStatus = '草稿' | '已提交' | '已审批' | '已退回';

export interface ReassessmentRecord {
  id: string;
  courseId: string;
  patientId: string;
  therapistId: string;
  therapistName: string;
  conclusion: ReassessmentConclusion;
  conclusionReason: string;
  status: ReassessmentStatus;
  functionalScore: number;
  painVAS: number;
  romMeasurement: string;
  subjectiveEvaluation: string;
  submittedAt: string | null;
}

export interface ApprovalRecord {
  id: string;
  reassessmentId: string;
  directorId: string;
  directorName: string;
  action: '通过' | '退回';
  suggestion: string;
  suggestedSessions: number | null;
  notes: string;
  approvedAt: string;
}

export type CommunicationResult = '已同意' | '已暂停' | '已拒绝' | '待沟通';

export interface CommunicationRecord {
  id: string;
  followupPlanId: string;
  communicator: string;
  result: CommunicationResult;
  reason: string;
  communicatedAt: string;
}

export interface ScheduleItem {
  date: string;
  session: string;
}

export interface FollowupPlan {
  id: string;
  reassessmentId: string;
  patientId: string;
  planType: string;
  planDetails: string;
  totalFee: number;
  paymentStatus: string;
  scheduleItems: ScheduleItem[];
  communicationRecords: CommunicationRecord[];
}
