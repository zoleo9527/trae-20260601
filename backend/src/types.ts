export type UserRole = 'business' | 'director' | 'talent_agent' | 'finance';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Talent {
  id: string;
  name: string;
  platform: string;
  followers: number;
  category: string;
  contact: string;
  agentId: string;
  createdAt: string;
}

export interface BrandDemand {
  id: string;
  brandName: string;
  productName: string;
  budget: number;
  demandDescription: string;
  businessId: string;
  createdAt: string;
  deadline: string;
}

export type ScriptStatus = 'draft' | 'pending_review' | 'approved' | 'revised';

export interface ScriptVersion {
  id: string;
  demandId: string;
  version: number;
  content: string;
  status: ScriptStatus;
  createdBy: string;
  createdAt: string;
  remark?: string;
}

export type CaseStatus =
  | 'pending_script'
  | 'scripting'
  | 'pending_approval'
  | 'shooting'
  | 'pending_data'
  | 'data_submitted'
  | 'data_rejected'
  | 'pending_settlement'
  | 'settlement_pending_review'
  | 'settlement_rejected'
  | 'completed'
  | 'delayed';

export interface SettlementData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clickRate: number;
  conversionRate: number;
  actualFee: number;
  platformFee: number;
  talentFee: number;
}

export interface CaseRecord {
  id: string;
  demandId: string;
  talentId: string;
  scriptId: string;
  status: CaseStatus;
  currentHandler: UserRole;
  
  settlementData?: SettlementData;
  dataSubmittedAt?: string;
  dataSubmittedBy?: string;
  
  rejectReason?: string;
  rejectAt?: string;
  rejectBy?: string;
  
  supplementaryRemark?: string;
  supplementaryAt?: string;
  
  settlementReviewedAt?: string;
  settlementReviewedBy?: string;
  settlementRemark?: string;
  
  paidAt?: string;
  paidAmount?: number;
  
  createdAt: string;
  updatedAt: string;
  delayedDays?: number;
}

export interface TodoItem {
  id: string;
  caseId: string;
  title: string;
  description: string;
  role: UserRole;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
}

export interface StatusLog {
  id: string;
  caseId: string;
  fromStatus: CaseStatus | null;
  toStatus: CaseStatus;
  operatorId: string;
  operatorRole: UserRole;
  remark?: string;
  createdAt: string;
}
