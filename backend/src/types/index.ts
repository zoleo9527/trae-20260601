export type UserRole = 'rental_consultant' | 'operation_manager' | 'finance';

export type PropertyStatus = 
  | 'vacant'           // 空置
  | 'viewing_scheduled' // 预约看房
  | 'viewing_completed' // 看房完成
  | 'quotation_pending' // 待报价
  | 'quotation_submitted' // 已报价待确认
  | 'quotation_approved'  // 报价已确认
  | 'contract_drafting'   // 合同起草中
  | 'contract_reviewing'  // 合同审核中
  | 'contract_signed'     // 合同已签署
  | 'handover_pending'    // 待交接
  | 'handover_completed'  // 交接完成
  | 'occupied'           // 已入住
  | 'checkout_pending'    // 待退租
  | 'checkout_completed'; // 已退租

export type QuotationStatus = 
  | 'draft'         // 草稿
  | 'submitted'     // 已提交
  | 'approved'      // 已确认
  | 'rejected'      // 已拒绝
  | 'expired';      // 已过期

export type ContractStatus = 
  | 'draft'         // 草稿
  | 'under_review'  // 审核中
  | 'approved'      // 已批准
  | 'signed'        // 已签署
  | 'rejected'      // 已拒绝
  | 'terminated';   // 已终止

export type HandoverStatus = 
  | 'pending'       // 待交接
  | 'in_progress'   // 交接中
  | 'completed'     // 已完成
  | 'disputed';     // 有争议

export type DepositStatus = 
  | 'unpaid'        // 未支付
  | 'paid'          // 已支付
  | 'refunding'     // 退款中
  | 'refunded'      // 已退还
  | 'deducted'      // 已扣除
  | 'disputed';     // 有争议

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthUser extends User {
  token: string;
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
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  category: 'basic' | 'payment' | 'liability' | 'termination' | 'other';
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
}

export interface HandoverItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  condition: 'good' | 'normal' | 'damaged';
  remark?: string;
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
