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
