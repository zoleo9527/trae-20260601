export type CaseStage =
  | 'entrust_register'
  | 'sample_receive'
  | 'expert_examine'
  | 'opinion_draft'
  | 'quality_review'
  | 'correction_pending'
  | 'dispatch_notice'
  | 'dispatch_sign'
  | 'archived';

export type UserRole = 'receptionist' | 'expert' | 'quality_controller' | 'director';

export type RejectNode = 'back_to_entrust' | 'back_to_expert' | 'back_to_sample';

export type BlockReason =
  | 'awaiting_pickup'
  | 'sign_missing'
  | 'recorrection_needed'
  | 'correction_unfinished'
  | 'approval_pending';

export type ExceptionType = 'sample_abnormal' | 'opinion_rejected' | 'dispatch_delay' | 'correction_missed';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type SceneType = 'normal' | 'multi_reject' | 'sample_abnormal' | 'dispatch_delay' | 'correction_missed';

export interface Sample {
  id: string;
  caseId: string;
  sampleNo: string;
  sampleType: string;
  receiveDate: string;
  status: TaskStatus;
  exceptionNote?: string;
}

export interface Opinion {
  id: string;
  caseId: string;
  version: number;
  draftBy: string;
  submitDate: string;
  content: string;
  conclusion: string;
  status: TaskStatus;
}

export interface ReviewItem {
  id: string;
  category: 'entrust' | 'sample' | 'format' | 'logic';
  label: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
}

export interface ReviewTask {
  id: string;
  caseId: string;
  opinionId: string;
  reviewer: string;
  checkedItems: string[];
  rejectedItems: string[];
  rejectNode?: RejectNode;
  rejectReason?: string;
  status: TaskStatus;
  createdAt: string;
}

export interface CorrectionTask {
  id: string;
  caseId: string;
  sourceReviewId?: string;
  targetRole: UserRole;
  requiredItems: string[];
  replyContent?: string;
  status: TaskStatus;
  deadline: string;
  createdAt: string;
}

export interface DispatchRecord {
  id: string;
  caseId: string;
  noticeDate?: string;
  pickupDate?: string;
  receiver?: string;
  receiverIdCard?: string;
  signImage?: string;
  archiveDate?: string;
  status: TaskStatus;
  blockReasons: BlockReason[];
}

export interface FlowLog {
  id: string;
  caseId: string;
  stage: CaseStage;
  action: string;
  operator: string;
  operatorRole: UserRole;
  timestamp: string;
  detail: string;
}

export interface Case {
  id: string;
  caseNo: string;
  title: string;
  entrustParty: string;
  entrustDate: string;
  currentHandler: string;
  currentHandlerRole: UserRole;
  currentStage: CaseStage;
  status: TaskStatus;
  stuckHours: number;
  hasException: boolean;
  exceptionTypes: ExceptionType[];
  samples: Sample[];
  opinions: Opinion[];
  reviews: ReviewTask[];
  corrections: CorrectionTask[];
  dispatch?: DispatchRecord;
  flowLogs: FlowLog[];
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface BannerAlert {
  id: string;
  type: 'error' | 'warning';
  title: string;
  message: string;
  caseIds: string[];
  actionLabel?: string;
  actionCaseId?: string;
}

export interface StageMeta {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface RoleMeta {
  label: string;
  color: string;
  avatarBg: string;
}

export interface RejectNodeMeta {
  label: string;
  targetRole: UserRole;
  description: string;
}

export interface BlockReasonMeta {
  label: string;
  suggestion: string;
}
