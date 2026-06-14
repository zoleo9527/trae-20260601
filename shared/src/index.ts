export type Role = 'purchaseManager' | 'appraiser' | 'financeSpecialist';

export type CarSourceStatus =
  | 'pending'
  | 'normal'
  | 'accident_missed'
  | 'prep_over_budget';

export type InspectionStatus =
  | 'pending'
  | 'passed'
  | 'recheck';

export type LoanStatus =
  | 'pending'
  | 'approved'
  | 'supplement'
  | 'rejected';

export type TransferStage =
  | 'purchase'
  | 'appraisal'
  | 'transfer'
  | 'loan_review'
  | 'loan_funding'
  | 'completed';

export type UrgencyAction = 'urge' | 'return' | 'supplement' | 'none';

export interface CarSourceDoc {
  id: string;
  name: string;
  submitted: boolean;
  placeholder?: string;
}

export interface InspectionItem {
  id: string;
  name: string;
  result: 'normal' | 'abnormal' | 'n/a';
  note?: string;
}

export interface LoanDoc {
  id: string;
  name: string;
  submitted: boolean;
  placeholder?: string;
}

export interface StatusChangeLog {
  id: string;
  orderId: string;
  stage: TransferStage;
  fromStage?: TransferStage;
  action: 'submit' | 'urge' | 'return' | 'supplement' | 'pass' | 'reject' | 'fund';
  operator: string;
  operatorRole: Role;
  operatedAt: string;
  remark?: string;
}

export interface CarSource {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  purchasePrice: number;
  expectedPrice: number;
  status: CarSourceStatus;
  ownerName: string;
  ownerPhone: string;
  purchaseManager: string;
  docs: CarSourceDoc[];
  createdAt: string;
  updatedAt: string;
  purchaseRemark?: string;
}

export interface InspectionReport {
  id: string;
  carSourceId: string;
  orderId: string;
  plateNumber: string;
  status: InspectionStatus;
  appraiser: string;
  items: InspectionItem[];
  accidentMarked: boolean;
  prepCost: number;
  inspectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resultSummary?: string;
}

export interface LoanApplication {
  id: string;
  orderId: string;
  carSourceId: string;
  plateNumber: string;
  buyerName: string;
  buyerPhone: string;
  loanAmount: number;
  loanTerm: number;
  status: LoanStatus;
  financeSpecialist: string;
  docs: LoanDoc[];
  appliedAt: string | null;
  approvedAt: string | null;
  fundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransferOrder {
  id: string;
  carSourceId: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  buyerName: string;
  buyerPhone: string;
  dealPrice: number;
  stage: TransferStage;
  previousStage?: TransferStage;
  currentHandlerRole: Role;
  currentHandler: string;
  purchaseManager: string;
  appraiser: string;
  financeSpecialist: string;
  transferRemark: string;
  loanRemark: string;
  urgencyAction: UrgencyAction;
  urgencyBy?: string;
  urgencyAt?: string;
  urgencyNote?: string;
  createdAt: string;
  updatedAt: string;
  transferCompletedAt?: string;
  loanCompletedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalOrders: number;
  ordersByStage: Record<TransferStage, number>;
  myPending: number;
  urgentOrders: number;
  returnedOrders: number;
  supplementOrders: number;
  todayCompleted: number;
  totalLoanAmount: number;
  carSourcesByStatus: Record<CarSourceStatus, number>;
}

export const DEMO_ACCOUNTS: Record<Role, { user: string; name: string }> = {
  purchaseManager: { user: '赵收车', name: '收车经理' },
  appraiser: { user: '钱评估', name: '评估师' },
  financeSpecialist: { user: '孙金融', name: '金融专员' },
};
