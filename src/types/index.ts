export type EmployeeStatus =
  | 'pending_training'
  | 'in_training'
  | 'training_exception'
  | 'pending_documents'
  | 'collecting_documents'
  | 'completed';

export type RiskFlagType =
  | 'temporary_absence'
  | 'attendance_dispute'
  | 'salary_deduction';

export type UserRole =
  | 'recruiter'
  | 'site_supervisor'
  | 'payroll_accountant';

export type DocumentType =
  | 'id_card'
  | 'health_cert'
  | 'labor_contract'
  | 'social_security'
  | 'photo'
  | 'background_check';

export interface Employee {
  id: string;
  name: string;
  idCardNumber: string;
  dispatchCompany: string;
  position: string;
  currentStatus: EmployeeStatus;
  currentOwner: UserRole;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
  phone?: string;
}

export interface StatusLog {
  id: string;
  employeeId: string;
  fromStatus: EmployeeStatus | null;
  toStatus: EmployeeStatus;
  operator: string;
  operatorRole: UserRole;
  remark?: string;
  timestamp: string;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  safetyTraining: boolean;
  companyRules: boolean;
  positionSkill: boolean;
  emergencyProcedure: boolean;
  trainingResult: 'passed' | 'failed' | 'pending';
  trainingRemark?: string;
  trainer: string;
  trainingDate: string;
}

export interface DocumentItem {
  id: string;
  employeeId: string;
  documentType: DocumentType;
  documentName: string;
  collected: boolean;
  collectedDate?: string;
  remark?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface RiskFlag {
  id: string;
  employeeId: string;
  flagType: RiskFlagType;
  description: string;
  active: boolean;
  flaggedBy: string;
  flaggedByRole: UserRole;
  flaggedAt: string;
  resolvedRemark?: string;
  resolvedAt?: string;
}

export interface CurrentUser {
  role: UserRole;
  name: string;
}

export interface Filters {
  status?: EmployeeStatus;
  riskType?: RiskFlagType;
  owner?: UserRole;
  keyword?: string;
}

export interface TrainingInput {
  safetyTraining: boolean;
  companyRules: boolean;
  positionSkill: boolean;
  emergencyProcedure: boolean;
  trainingResult: 'passed' | 'failed';
  trainingRemark?: string;
}
