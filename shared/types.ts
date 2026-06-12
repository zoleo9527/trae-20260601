export type UserRole = 'project_specialist' | 'review_secretary' | 'finance' | 'admin';

export type RegistrationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';

export type ClarificationStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';

export type OperationType = 'create' | 'update_status' | 'reject' | 'approve' | 'assign' | 'clarify' | 'batch_approve' | 'batch_reject';

export type EntityType = 'registration' | 'clarification';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface BidRegistration {
  id: string;
  projectId: string;
  projectName: string;
  bidderId: string;
  bidderName: string;
  status: RegistrationStatus;
  currentHandlerId?: string;
  currentHandlerRole?: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Clarification {
  id: string;
  registrationId: string;
  question: string;
  answer?: string;
  status: ClarificationStatus;
  createdById: string;
  reviewedById?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperationLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  operationType: OperationType;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  previousStatus?: string;
  newStatus?: string;
  note?: string;
  metadata?: string;
  createdAt: Date;
}

export interface RejectionReason {
  id: string;
  registrationId: string;
  reason: string;
  supplementaryNote?: string;
  rejectedById: string;
  rejectedAt: Date;
}

export interface TodoCounts {
  registrations: {
    pending: number;
    reviewing: number;
    approved: number;
  };
  clarifications: {
    draft: number;
    pending_review: number;
    approved: number;
  };
}