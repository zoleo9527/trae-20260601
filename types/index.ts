export type ApplicationStatus =
  | "PENDING"
  | "RISK_REVIEW"
  | "APPROVED"
  | "CONFIRMED"
  | "DISBURSED"
  | "REJECTED";

export type RepaymentStatus =
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "PARTIAL_PAID";

export type ExceptionStatus = "OPEN" | "PROCESSING" | "RESOLVED";

export type ConfirmationAction = "CONFIRM" | "REJECT" | "REQUEST_INFO";

export type UserRole = "OPERATOR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface LoanApplication {
  id: string;
  borrowerName: string;
  borrowerPhone: string;
  amount: number;
  purpose: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
  riskDocuments?: RiskControlDocument[];
  confirmation?: LoanConfirmation;
  repaymentPlans?: RepaymentPlan[];
  exceptions?: ExceptionRecord[];
}

export interface RiskControlDocument {
  id: string;
  applicationId: string;
  type: string;
  status: string;
  uploadedAt: Date;
}

export interface LoanConfirmation {
  id: string;
  applicationId: string;
  operatorId: string;
  action: ConfirmationAction;
  reason?: string;
  confirmedAt: Date;
  operator?: User;
}

export interface RepaymentPlan {
  id: string;
  applicationId: string;
  period: number;
  amount: number;
  dueDate: Date;
  status: RepaymentStatus;
  paidAmount: number;
  collections?: CollectionRecord[];
  exceptions?: ExceptionRecord[];
}

export interface CollectionRecord {
  id: string;
  repaymentId: string;
  method: string;
  result: string;
  collectedAt: Date;
}

export interface ExceptionRecord {
  id: string;
  businessId: string;
  businessType: "APPLICATION" | "REPAYMENT";
  type: string;
  description: string;
  status: ExceptionStatus;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
  logs?: OperationLog[];
  reminders?: SystemReminder[];
}

export interface OperationLog {
  id: string;
  businessId: string;
  businessType: "APPLICATION" | "REPAYMENT" | "EXCEPTION";
  action: string;
  operatorId?: string;
  operatorName: string;
  fromStatus?: string;
  toStatus?: string;
  details?: string;
  createdAt: Date;
}

export interface SystemReminder {
  id: string;
  exceptionId: string;
  type: "SMS" | "PHONE" | "EMAIL";
  content: string;
  sentAt: Date;
  status: "SENT" | "DELIVERED" | "FAILED";
  recipient: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  action: string;
  operator: string;
  fromStatus?: string;
  toStatus?: string;
  details: Record<string, any>;
}