export type UserRole = 'operator' | 'recruiter' | 'hr';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  company?: string;
}

export interface Position {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  requirements: string[];
  status: 'open' | 'closed';
  recruiterId: string;
  recruiterName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  positionId: string;
  positionTitle: string;
  interviewDate: string;
  interviewStatus: 'pending' | 'passed' | 'failed';
  onboardDate?: string;
  onboardStatus?: 'pending' | 'onboarded' | 'left';
  recruiterId: string;
  recruiterName: string;
  hrId?: string;
  hrName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementCandidate {
  name: string;
  phone: string;
  interviewDate: string;
  onboardDate: string;
  status: string;
}

export interface HistoryRecord {
  time: string;
  role: '运营' | '招聘顾问' | '企业HR';
  operator: string;
  action: string;
  remark: string;
}

export interface Settlement {
  id: string;
  positionId: string;
  position: string;
  company: string;
  recruiterId: string;
  recruiterName: string;
  hrId?: string;
  hrName?: string;
  candidates: SettlementCandidate[];
  settlementAmount: number;
  status: 'pending_hr_confirm' | 'pending_operator_review' | 'completed' | 'rejected' | 'appealing';
  history: HistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  role: '企业HR' | '招聘顾问';
  files: string[];
  description: string;
}

export interface Appeal {
  id: string;
  settlementId: string;
  position: string;
  company: string;
  recruiterId: string;
  recruiterName: string;
  hrId: string;
  hrName: string;
  appealReason: string;
  status: 'pending_recruiter_response' | 'pending_operator_arbitration' | 'resolved' | 'rejected';
  evidence: Evidence[];
  history: HistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

export type SettlementStatus = Settlement['status'];
export type AppealStatus = Appeal['status'];
