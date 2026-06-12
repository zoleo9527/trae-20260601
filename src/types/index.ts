export type ApplicationStatus =
  | 'pending'
  | 'inspecting'
  | 'costing'
  | 'confirming'
  | 'disputing'
  | 'completed';

export type UserRole = 'consultant' | 'manager' | 'finance' | 'customer';

export interface Tenant {
  companyName: string;
  contactPerson: string;
  contactPhone: string;
}

export interface Contract {
  contractNo: string;
  floorRoom: string;
  area: number;
  depositAmount: number;
  startDate: string;
  endDate: string;
  dailyRent: number;
}

export interface SurrenderInfo {
  reason: string;
  expectedMoveOutDate: string;
  remark: string;
  applicant: string;
}

export type InspectionStatus = 'normal' | 'damaged' | 'missing';

export interface InspectionItem {
  id: string;
  category: string;
  name: string;
  status: InspectionStatus;
  description: string;
  photos: string[];
  estimatedCost?: number;
}

export interface KeyHandover {
  type: string;
  quantity: number;
  handedOver: boolean;
}

export interface Inspection {
  id: string;
  inspector: string;
  inspectionDate: string;
  items: InspectionItem[];
  keys: KeyHandover[];
  remark: string;
}

export interface RentSettlement {
  occupationDays: number;
  dailyRent: number;
  amount: number;
  period: string;
  basis: string;
}

export interface UtilityFee {
  type: 'water' | 'electricity';
  previousReading: number;
  currentReading: number;
  unitPrice: number;
  amount: number;
  period: string;
}

export interface RepairFee {
  id: string;
  itemName: string;
  damageDescription: string;
  quotedAmount: number;
  quoteAttachment?: string;
  basis: string;
}

export interface PenaltyFee {
  amount: number;
  clause: string;
  defaultDays: number;
  formula: string;
}

export type DeductionCategory = 'rent' | 'utility' | 'repair' | 'penalty' | 'other';

export interface DeductionItem {
  id: string;
  category: DeductionCategory;
  itemName: string;
  amount: number;
  basis: string;
  relatedEvidence?: string;
}

export interface CostBreakdown {
  id: string;
  preparedBy: string;
  preparedAt: string;
  totalDeposit: number;
  totalDeduction: number;
  refundAmount: number;
  rentSettlement: RentSettlement;
  utilityFees: UtilityFee[];
  repairFees: RepairFee[];
  penaltyFee?: PenaltyFee;
  deductions: DeductionItem[];
}

export interface DisputeResponse {
  content: string;
  adjustedAmount?: number;
  responder: string;
  respondedAt: string;
}

export interface Dispute {
  id: string;
  deductionItemId: string;
  customerReason: string;
  customerAttachments?: string[];
  createdAt: string;
  response?: DisputeResponse;
}

export interface Confirmation {
  id: string;
  customerViewedAt?: string;
  disputes: Dispute[];
  finalConfirmed?: boolean;
  confirmedAt?: string;
  confirmerName?: string;
  signature?: string;
}

export interface SurrenderApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  tenant: Tenant;
  contract: Contract;
  surrenderInfo: SurrenderInfo;
  inspection?: Inspection;
  costBreakdown?: CostBreakdown;
  confirmation?: Confirmation;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: '待验收',
  inspecting: '验收中',
  costing: '费用核算中',
  confirming: '待客户确认',
  disputing: '异议处理中',
  completed: '已完成',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  inspecting: 'bg-navy-100 text-navy-700',
  costing: 'bg-sage-100 text-sage-600',
  confirming: 'bg-coral-50 text-coral-500',
  disputing: 'bg-coral-100 text-coral-600',
  completed: 'bg-sage-200 text-sage-700',
};

export const INSPECTION_LABELS: Record<InspectionStatus, string> = {
  normal: '正常',
  damaged: '损坏',
  missing: '缺失',
};

export const INSPECTION_COLORS: Record<InspectionStatus, string> = {
  normal: 'bg-sage-100 text-sage-600',
  damaged: 'bg-coral-100 text-coral-600',
  missing: 'bg-amber-100 text-amber-700',
};

export const DEDUCTION_CATEGORY_LABELS: Record<DeductionCategory, string> = {
  rent: '租金结算',
  utility: '水电费用',
  repair: '维修费用',
  penalty: '违约金',
  other: '其他费用',
};
