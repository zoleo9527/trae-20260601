export type ProjectStatus = 
  | 'draft' 
  | 'initial_review' 
  | 're_review' 
  | 'approved' 
  | 'rejected';

export type DocumentStatus = 
  | 'pending' 
  | 'drafting' 
  | 'review' 
  | 'published' 
  | 'rejected';

export interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  biddingType: '公开招标' | '邀请招标' | '竞争性谈判' | '单一来源';
  status: ProjectStatus;
  handler: string;
  documentHandler: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface QARecord {
  id: string;
  question: string;
  answer: string;
  answeredBy: string;
  answeredAt: string;
}

export interface Evaluation {
  id: string;
  documentId: string;
  scheduledAt: string;
  location: string;
  evaluators: string[];
  status: 'pending' | 'completed' | 'cancelled';
}

export interface Document {
  id: string;
  projectId: string;
  projectName?: string;
  status: DocumentStatus;
  content: string;
  handler: string;
  qaRecords: QARecord[];
  evaluation: Evaluation | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface StatusHistory {
  id: string;
  entityType: 'project' | 'document';
  entityId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  reason: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: 'project_specialist' | 'review_secretary' | 'finance';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const ProjectStatusLabels: Record<ProjectStatus, string> = {
  draft: '草稿',
  initial_review: '待初审',
  re_review: '待复审',
  approved: '立项通过',
  rejected: '已驳回',
};

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  pending: '待编制',
  drafting: '编制中',
  review: '待审核',
  published: '已发布',
  rejected: '已驳回',
};

export const BiddingTypes = [
  '公开招标',
  '邀请招标',
  '竞争性谈判',
  '单一来源',
] as const;

export const RoleLabels: Record<User['role'], string> = {
  project_specialist: '项目专员',
  review_secretary: '评审秘书',
  finance: '财务人员',
};
