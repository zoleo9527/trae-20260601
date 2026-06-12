export enum UserRole {
  TAX_CONSULTANT = 'tax_consultant',
  PROJECT_MANAGER = 'project_manager',
  CLIENT_FINANCE = 'client_finance'
}

export enum WorkflowStage {
  DRAFT_CREATED = 'draft_created',
  DRAFT_REVIEW = 'draft_review',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  CONFIRMATION_IN_PROGRESS = 'confirmation_in_progress',
  CONFIRMED = 'confirmed',
  RETURNED = 'returned',
  REVISION_IN_PROGRESS = 'revision_in_progress',
  COMPLETED = 'completed'
}

export enum RecordStatus {
  ACTIVE = 'active',
  PENDING_CONFIRMATION = 'pending_confirmation',
  PENDING_REVISION = 'pending_revision',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum TodoType {
  DRAFT_PENDING = 'draft_pending',
  DRAFT_REVISION = 'draft_revision',
  CONFIRMATION_PENDING = 'confirmation_pending',
  MATERIAL_PREPARATION = 'material_preparation',
  APPROVAL_PENDING = 'approval_pending',
  OVERDUE_HANDLING = 'overdue_handling'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  projectIds: string[];
  clientIds: string[];
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  taxTypes: string[];
  contactPerson: string;
  contactEmail: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  taxConsultantId: string;
  projectManagerId: string;
  status: 'active' | 'completed' | 'suspended';
  createdAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Calculation {
  id: string;
  description: string;
  formula: string;
  inputs: Record<string, number>;
  result: number;
  notes?: string;
}

export interface Conclusion {
  id: string;
  content: string;
  policyBasis: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface Policy {
  id: string;
  name: string;
  code: string;
  effectiveDate: Date;
  description: string;
}

export interface Adjustment {
  id: string;
  type: 'increase' | 'decrease';
  amount: number;
  reason: string;
  policyBasis: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DraftContent {
  taxType: string;
  taxableAmount: number;
  taxAmount: number;
  applicablePolicies: Policy[];
  specialAdjustments: Adjustment[];
  riskNotes: string;
  calculations: Calculation[];
  conclusions: Conclusion[];
  sourceDocuments: Document[];
}

export interface MaterialStatus {
  materialId: string;
  status: 'pending' | 'provided' | 'waived';
  providedAt?: Date;
  waiverReason?: string;
}

export interface ConfirmResult {
  isApproved: boolean;
  approvedItems: string[];
  concerns: string[];
  clientRepresentative: string;
  confirmedAt: Date;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  required: boolean;
  source: 'client' | 'consultant';
  status: 'pending' | 'provided' | 'waived';
  providedAt?: Date;
  attachmentUrl?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
  screenshots?: string[];
}

export interface ReturnReason {
  category: 'calculation_error' | 'missing_info' | 'policy_misapplication' |
            'document_issue' | 'other';
  description: string;
  priority: 'high' | 'medium' | 'low';
  relatedSection?: string;
  evidence?: Document[];
}

export interface Note {
  id: string;
  authorId: string;
  authorRole: UserRole;
  content: string;
  type: 'general' | 'technical' | 'client_communication' | 'internal';
  relatedTo?: string;
  createdAt: Date;
  isVisibleToClient: boolean;
}

export interface WorkflowEvent {
  eventType: string;
  actorId: string;
  actorRole: UserRole;
  timestamp: Date;
  details: Record<string, any>;
  previousStage?: WorkflowStage;
  newStage?: WorkflowStage;
}

export interface ResponsibilityEntry {
  stage: WorkflowStage;
  responsibleRole: UserRole;
  responsibleUserId?: string;
  action: string;
  timestamp: Date;
  isComplete: boolean;
  notes?: string;
}

export interface DraftInfo {
  taxConsultantId: string;
  draftContent: DraftContent;
  sourceDocuments: Document[];
  calculations: Calculation[];
  conclusions: Conclusion[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfirmationInfo {
  clientFinanceId: string;
  requiredMaterials: Material[];
  materialsStatus: MaterialStatus[];
  confirmationStatus: 'pending' | 'in_progress' | 'confirmed' | 'returned';
  confirmationResult?: ConfirmResult;
  confirmedAt?: Date;
  deadline: Date;
}

export interface ReturnInfo {
  returnedBy: string;
  returnReason: ReturnReason;
  specificIssues: Issue[];
  suggestedFixes: string[];
  returnedAt: Date;
  expectedFixDeadline: Date;
  isResponsibilityClear: boolean;
  responsibilityNotes?: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ReturnHistoryEntry {
  returnInfo: ReturnInfo;
  resubmittedAt: Date;
  resubmittedBy: string;
  notes?: string;
}

export interface WorkflowRecord {
  id: string;
  projectId: string;
  clientId: string;
  taxPeriod: string;
  createdAt: Date;
  updatedAt: Date;
  currentStage: WorkflowStage;
  status: RecordStatus;
  draftInfo: DraftInfo;
  confirmationInfo: ConfirmationInfo;
  returnInfo?: ReturnInfo;
  returnHistory: ReturnHistoryEntry[];
  supplementaryNotes: Note[];
  workflowHistory: WorkflowEvent[];
  responsibilityTrace: ResponsibilityEntry[];
}

export interface Todo {
  id: string;
  recordId: string;
  type: TodoType;
  title: string;
  description: string;
  assigneeId: string;
  assigneeRole: UserRole;
  status: TodoStatus;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
