export type Role = 'receptionist' | 'professional' | 'supervisor';

export type AppealStatus = 
  | 'pending_assignment'     // 待分配
  | 'pending_investigation'  // 待核查
  | 'pending_review'         // 待复核
  | 'returned'               // 已退回
  | 'approved'               // 已通过
  | 'archived';              // 已归档

export type OperationType = 
  | 'create'                 // 创建申诉
  | 'assign'                 // 分配专业人员
  | 'submit_investigation'   // 提交核查结果
  | 'approve'                // 通过
  | 'return'                 // 退回
  | 'supplement';            // 补充材料

export interface Appeal {
  id: string;
  appealNumber: string;
  customerName: string;
  customerPhone: string;
  appealContent: string;
  oldLedgerInfo: string;
  assignedProfessional?: string;
  status: AppealStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // 专业人员填写
  siteRecord?: string;
  professionalOpinion?: string;
  
  // 审核主管填写
  reviewConclusion?: string;
  returnReason?: string;
  supplementNote?: string;
  
  // 异常标记
  isException: boolean;
  exceptionReason?: string;
}

export interface OperationHistory {
  id: string;
  appealId: string;
  operatorRole: Role;
  operatorName: string;
  operationType: OperationType;
  operationContent: string;
  reason?: string;
  operationTime: Date;
}

export interface Attachment {
  id: string;
  appealId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadTime: Date;
}

export interface ExceptionRule {
  type: 'timeout' | 'return_count' | 'complaint_escalation';
  condition: (appeal: Appeal) => boolean;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export const ROLE_LABELS: Record<Role, string> = {
  receptionist: '接待人员',
  professional: '专业人员',
  supervisor: '审核主管'
};

export const STATUS_LABELS: Record<AppealStatus, string> = {
  pending_assignment: '待分配',
  pending_investigation: '待核查',
  pending_review: '待复核',
  returned: '已退回',
  approved: '已通过',
  archived: '已归档'
};

export const OPERATION_LABELS: Record<OperationType, string> = {
  create: '创建申诉',
  assign: '分配专业人员',
  submit_investigation: '提交核查结果',
  approve: '通过',
  return: '退回',
  supplement: '补充材料'
};