export type UserRole = 'rental_consultant' | 'operation_manager' | 'finance';

export type PropertyStatus = 
  | 'vacant'
  | 'viewing_scheduled'
  | 'viewing_completed'
  | 'quotation_pending'
  | 'quotation_submitted'
  | 'quotation_approved'
  | 'contract_drafting'
  | 'contract_reviewing'
  | 'contract_signed'
  | 'handover_pending'
  | 'handover_completed'
  | 'occupied'
  | 'checkout_pending'
  | 'checkout_completed';

export type QuotationStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
export type ContractStatus = 'draft' | 'under_review' | 'approved' | 'signed' | 'rejected' | 'terminated';
export type HandoverStatus = 'pending' | 'in_progress' | 'completed' | 'disputed';
export type DepositStatus = 'unpaid' | 'paid' | 'refunding' | 'refunded' | 'deducted' | 'disputed';

export interface StatusDisplay {
  label: string;
  color: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface DemoAccount {
  username: string;
  name: string;
  role: UserRole;
  roleName: string;
  password: string;
}

export interface Property {
  id: string;
  building: string;
  floor: string;
  roomNumber: string;
  area: number;
  unitPrice: number;
  decoration: 'raw' | 'standard' | 'fine';
  orientation: string;
  status: PropertyStatus;
  description?: string;
  facilities: string[];
  createdAt: string;
  updatedAt: string;
  statusDisplay?: StatusDisplay;
}

export interface ViewingRecord {
  id: string;
  propertyId: string;
  customerName: string;
  customerPhone: string;
  companyName?: string;
  scheduledAt: string;
  actualAt?: string;
  consultantId: string;
  consultantName: string;
  feedback?: string;
  interestLevel: 'low' | 'medium' | 'high';
  needs?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  nextFollowUp?: string;
  createdAt: string;
}

export interface QuotationItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  propertyId: string;
  customerName: string;
  customerPhone: string;
  companyName?: string;
  viewingRecordId?: string;
  consultantId: string;
  consultantName: string;
  leaseTerm: number;
  rentFreePeriod: number;
  paymentMethod: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  depositMonths: number;
  items: QuotationItem[];
  totalAmount: number;
  remarks?: string;
  status: QuotationStatus;
  approverId?: string;
  approverName?: string;
  approvalComment?: string;
  approvedAt?: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  statusDisplay?: StatusDisplay;
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  category: 'basic' | 'payment' | 'liability' | 'termination' | 'other';
}

export interface Contract {
  id: string;
  contractNo: string;
  propertyId: string;
  quotationId: string;
  customerName: string;
  customerPhone: string;
  companyName?: string;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseTerm: number;
  monthlyRent: number;
  annualRent: number;
  paymentMethod: string;
  depositAmount: number;
  rentFreePeriod: number;
  clauses: ContractClause[];
  attachments: string[];
  status: ContractStatus;
  createdBy: string;
  createdByName: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  reviewedAt?: string;
  signatoryPartyA?: string;
  signatoryPartyB?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  statusDisplay?: StatusDisplay;
}

export interface HandoverItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  condition: 'good' | 'normal' | 'damaged';
  remark?: string;
}

export interface HandoverForm {
  id: string;
  handoverNo: string;
  propertyId: string;
  contractId: string;
  type: 'move_in' | 'move_out';
  handoverDate: string;
  items: HandoverItem[];
  remarks?: string;
  status: HandoverStatus;
  createdBy: string;
  createdByName: string;
  receiverName?: string;
  receiverSignAt?: string;
  delivererName?: string;
  delivererSignAt?: string;
  disputes?: string;
  createdAt: string;
  updatedAt: string;
  statusDisplay?: StatusDisplay;
}

export interface DepositRecord {
  id: string;
  depositNo: string;
  propertyId: string;
  contractId: string;
  customerName: string;
  amount: number;
  type: 'rent_deposit' | 'utility_deposit' | 'other';
  status: DepositStatus;
  paidAt?: string;
  refundAmount?: number;
  refundAt?: string;
  deductionReason?: string;
  deductionAmount?: number;
  disputes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  statusDisplay?: StatusDisplay;
}

export interface OperationLog {
  id: string;
  entityType: 'property' | 'viewing' | 'quotation' | 'contract' | 'handover' | 'deposit';
  entityId: string;
  action: string;
  description: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  oldStatus?: string;
  newStatus?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface StatusTransition {
  from: PropertyStatus | null;
  to: PropertyStatus;
  action: string;
  allowedRoles: UserRole[];
  description: string;
}

export interface TimelineEvent {
  key: string;
  title: string;
  description: string;
  operator: string;
  operatorRole: UserRole;
  timestamp: string;
  oldStatus?: string;
  newStatus?: string;
  details?: Record<string, unknown>;
}

export const roleNames: Record<UserRole, string> = {
  rental_consultant: '租赁顾问',
  operation_manager: '运营经理',
  finance: '财务',
};

export const decorationNames: Record<string, string> = {
  raw: '毛坯',
  standard: '标准装修',
  fine: '精装修',
};

export const paymentMethodNames: Record<string, string> = {
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  annual: '年付',
};

export const viewingStatusNames: Record<string, string> = {
  scheduled: '已预约',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未到场',
};

export const interestLevelNames: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export const depositTypeNames: Record<string, string> = {
  rent_deposit: '房租押金',
  utility_deposit: '水电押金',
  other: '其他押金',
};
