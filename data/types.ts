export type UserRole = '客服' | '维修工程师' | '配件管理员';

export type ComplaintStatus = 
  | '待客服受理' 
  | '待维修工程师处理' 
  | '待配件管理员处理' 
  | '待回访' 
  | '已完成' 
  | '已驳回';

export type ReturnReason = 
  | '信息不全' 
  | '配件缺失' 
  | '需客户补充' 
  | '技术问题' 
  | '其他';

export type RejectReason = 
  | '信息不全' 
  | '非质量问题' 
  | '超出保修期' 
  | '用户取消' 
  | '其他';

export interface ComplaintRecord {
  id: string;
  customerName: string;
  phone: string;
  productType: string;
  productModel: string;
  complaintContent: string;
  complaintTime: string;
  status: ComplaintStatus;
  currentAssignee: UserRole;
  
  customerService?: {
    handler: string;
    handleTime?: string;
    remark?: string;
  };
  
  engineer?: {
    handler: string;
    handleTime?: string;
    repairContent?: string;
    partsUsed?: string[];
    remark?: string;
    returnHandler?: string;
    returnTime?: string;
    returnReason?: ReturnReason;
    returnRemark?: string;
  };
  
  partsManager?: {
    handler: string;
    handleTime?: string;
    partsPrepared?: string[];
    remark?: string;
    returnHandler?: string;
    returnTime?: string;
    returnReason?: ReturnReason;
    returnRemark?: string;
  };
  
  revisit?: {
    handler: string;
    revisitTime?: string;
    customerSatisfaction?: '满意' | '一般' | '不满意';
    revisitContent?: string;
    returnHandler?: string;
    returnTime?: string;
    returnReason?: ReturnReason;
    returnRemark?: string;
  };
  
  rejectReason?: RejectReason;
  rejectRemark?: string;
  rejectTime?: string;
  
  history: HistoryRecord[];
}

export interface HistoryRecord {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
}

export interface TodoStats {
  pendingCount: number;
  abnormalCount: number;
  completedCount: number;
}
