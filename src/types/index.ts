export type BusinessType = '政策咨询' | '税务筹划' | '争议处理';
export type UrgencyLevel = '普通' | '紧急' | '加急';
export type WorkOrderStatus = 
  | '待判断'      
  | '判断中'      
  | '待审批'      
  | '审批通过'    
  | '审批驳回'    
  | '已签收'      
  | '处理完成';   

export interface PolicyJudgment {
  judgmentBasis: string;
  policyReference: string;
  riskWarning: string;
  handlingSuggestion: string;
  judgedBy: string;
  judgedAt: string;
}

export interface Approval {
  approvalOpinion: string;
  approvalResult: '通过' | '驳回';
  rejectReason?: string;
  approvedBy: string;
  approvedAt: string;
}

export interface SignReceipt {
  receiptConfirm: string;
  receiptRemark: string;
  receivedBy: string;
  receivedAt: string;
}

export interface HistoryRemark {
  id: string;
  timestamp: string;
  operator: string;
  role: string;
  action: string;
  detail?: string;
  attachments?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  customerName: string;
  businessType: BusinessType;
  urgencyLevel: UrgencyLevel;
  status: WorkOrderStatus;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  policyJudgment?: PolicyJudgment;
  approval?: Approval;
  signReceipt?: SignReceipt;
  attachments: Attachment[];
  historyRemarks: HistoryRemark[];
}

export type UserRole = '税务顾问' | '项目经理' | '客户财务';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface FilterParams {
  status?: WorkOrderStatus[];
  businessType?: BusinessType;
  urgencyLevel?: UrgencyLevel;
  dateRange?: {
    start: string;
    end: string;
  };
  keyword?: string;
}
