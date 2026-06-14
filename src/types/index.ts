export type ApplicationStatus =
  | 'pending'
  | 'correction'
  | 'approved'
  | 'rejected'
  | 'archived';

export type ReviewStage =
  | 'receive'
  | 'review'
  | 'correction_sent'
  | 'correction_received'
  | 'exception_note'
  | 'final_approve'
  | 'archive';

export type MaterialStatus = 'submitted' | 'missing' | 'incorrect' | 'corrected';

export interface Material {
  id: string;
  name: string;
  status: MaterialStatus;
  isOriginal: boolean;
  remark?: string;
}

export interface CorrectionItem {
  id: string;
  materialName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CorrectionNotice {
  id: string;
  reviewRecordId: string;
  sender: string;
  sentAt: string;
  deadline: string;
  status: 'pending' | 'replied' | 'overdue';
  items: CorrectionItem[];
}

export interface ReviewRecord {
  id: string;
  stage: ReviewStage;
  reviewer: string;
  reviewTime: string;
  result: 'pass' | 'correction' | 'reject' | 'receive' | 'archive';
  remark?: string;
  isResponsibilityBoundary?: boolean;
}

export interface Application {
  id: string;
  appointmentNo: string;
  applicantName: string;
  applicantPhone: string;
  applicationType: string;
  status: ApplicationStatus;
  receivedAt: string;
  windowNo: string;
  handler: string;
  materials: Material[];
  reviewRecords: ReviewRecord[];
  correctionNotices: CorrectionNotice[];
  currentReviewer?: string;
  exceptionNote?: string;
  archiveNo?: string;
  archivedAt?: string;
}

export interface StatData {
  pending: number;
  correction: number;
  approved: number;
  archived: number;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '待审核',
  correction: '补正中',
  approved: '已通过',
  rejected: '已驳回',
  archived: '已归档',
};

export const STAGE_LABELS: Record<ReviewStage, string> = {
  receive: '材料接收',
  review: '公证员审核',
  correction_sent: '补正通知发送',
  correction_received: '补正材料接收',
  exception_note: '异常说明录入',
  final_approve: '最终审核通过',
  archive: '归档',
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  submitted: '已提交',
  missing: '缺失',
  incorrect: '有误',
  corrected: '已补正',
};

export const RESPONSIBLE_PARTY: Record<ReviewStage, string> = {
  receive: '窗口受理员',
  review: '公证员',
  correction_sent: '公证员',
  correction_received: '窗口受理员',
  exception_note: '公证员',
  final_approve: '公证员',
  archive: '系统自动',
};
