export type Role = 'customer_service' | 'engineer' | 'parts_admin';

export const RoleLabel: Record<Role, string> = {
  customer_service: '客服',
  engineer: '维修工程师',
  parts_admin: '配件管理员',
};

export type TicketStatus =
  | 'created'
  | 'assigned_to_engineer'
  | 'diagnosing'
  | 'diagnosed_need_parts'
  | 'diagnosed_no_parts'
  | 'parts_applying'
  | 'parts_approved'
  | 'parts_rejected'
  | 'repairing'
  | 'completed'
  | 'cancelled';

export const StatusLabel: Record<TicketStatus, string> = {
  created: '新建工单',
  assigned_to_engineer: '已派单给工程师',
  diagnosing: '故障诊断中',
  diagnosed_need_parts: '诊断完成-需配件',
  diagnosed_no_parts: '诊断完成-无需配件',
  parts_applying: '配件申请中',
  parts_approved: '配件已批准',
  parts_rejected: '配件已驳回',
  repairing: '维修中',
  completed: '已完成',
  cancelled: '已取消',
};

export const StatusColor: Record<TicketStatus, string> = {
  created: 'default',
  assigned_to_engineer: 'blue',
  diagnosing: 'processing',
  diagnosed_need_parts: 'orange',
  diagnosed_no_parts: 'cyan',
  parts_applying: 'warning',
  parts_approved: 'green',
  parts_rejected: 'red',
  repairing: 'processing',
  completed: 'success',
  cancelled: 'default',
};

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

export interface ApplianceInfo {
  type: string;
  brand: string;
  model: string;
  purchaseDate: string;
  warranty: boolean;
  serialNo?: string;
}

export interface PartItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unit: string;
  reason: string;
}

export interface DiagnosisResult {
  symptoms: string[];
  faultCode?: string;
  faultDescription: string;
  solution: string;
  needParts: boolean;
  estimateMinutes?: number;
  laborFee?: number;
  remark?: string;
}

export interface PartsApplication {
  id: string;
  ticketId: string;
  appliedBy: string;
  appliedAt: string;
  items: PartItem[];
  diagnosisRemarkCarried: string;
  reviewBy?: string;
  reviewAt?: string;
  reviewRemark?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CommunicationRecord {
  id: string;
  role: Role;
  person: string;
  content: string;
  screenshotUrl?: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  status: TicketStatus;
  fromStatus?: TicketStatus;
  operator: string;
  operatorRole: Role;
  occurredAt: string;
  remark?: string;
}

export interface ServiceTicket {
  id: string;
  ticketNo: string;
  source: string;
  customer: CustomerInfo;
  appliance: ApplianceInfo;
  complaintDescription: string;
  createdAt: string;
  createdBy: string;
  status: TicketStatus;
  currentHandler: Role;
  handlers: {
    customer_service?: string;
    engineer?: string;
    parts_admin?: string;
  };
  diagnosis?: DiagnosisResult;
  partsApplications: PartsApplication[];
  onSiteRecords: string[];
  communications: CommunicationRecord[];
  timeline: TimelineEntry[];
  finalReport?: string;
  completedAt?: string;
  idempotencyKeys: Record<string, boolean>;
}

export interface CreateTicketRequest {
  source: string;
  customer: CustomerInfo;
  appliance: ApplianceInfo;
  complaintDescription: string;
  operator: string;
  idempotencyKey: string;
}

export interface AssignEngineerRequest {
  ticketId: string;
  engineer: string;
  operator: string;
  idempotencyKey: string;
  remark?: string;
}

export interface SubmitDiagnosisRequest {
  ticketId: string;
  diagnosis: DiagnosisResult;
  operator: string;
  idempotencyKey: string;
}

export interface SubmitPartsApplicationRequest {
  ticketId: string;
  items: PartItem[];
  operator: string;
  idempotencyKey: string;
  remark?: string;
}

export interface ReviewPartsRequest {
  applicationId: string;
  approved: boolean;
  reviewRemark?: string;
  operator: string;
  idempotencyKey: string;
}

export interface CompleteRepairRequest {
  ticketId: string;
  finalReport: string;
  operator: string;
  idempotencyKey: string;
}
