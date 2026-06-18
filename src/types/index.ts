export type UserRole = 'teacher' | 'volunteer' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type ActivityStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Activity {
  id: string;
  name: string;
  date: string;
  lecturer: string;
  participantCount: number;
  status: ActivityStatus;
}

export type FeedbackStatus = 'pending_review' | 'organized' | 'pending_approval' | 'completed';
export type CurrentStep = 'teacher' | 'volunteer' | 'supervisor';

export interface FeedbackContent {
  summary: string;
  ratings: number;
  comments: string[];
  photos: string[];
}

export interface FlowLog {
  id: string;
  relatedType: 'feedback' | 'certificate';
  relatedId: string;
  operatorId: string;
  operatorName: string;
  action: 'submit' | 'review' | 'organize' | 'approve' | 'issue' | 'reject' | 'note';
  remark?: string;
  timestamp: string;
}

export interface Feedback {
  id: string;
  activityId: string;
  activityName: string;
  submittedAt: string;
  content: FeedbackContent;
  status: FeedbackStatus;
  currentStep: CurrentStep;
  assigneeId: string;
  assigneeName: string;
  certificateEligible: boolean;
  flowLogs: FlowLog[];
  isOverdue?: boolean;
}

export type CertificateStatus = 'pending' | 'ready' | 'issued' | 'archived';
export type IssueMethod = 'onsite' | 'mail';

export interface Certificate {
  id: string;
  feedbackId: string;
  activityId: string;
  activityName: string;
  recipientName: string;
  recipientPhone?: string;
  status: CertificateStatus;
  issueMethod?: IssueMethod;
  issuedAt?: string;
  issuedBy?: string;
  flowLogs: FlowLog[];
}

export interface AppState {
  users: User[];
  activities: Activity[];
  feedbacks: Feedback[];
  certificates: Certificate[];
  currentUser: User;
}
