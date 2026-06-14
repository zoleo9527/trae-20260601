export type Role = 'manager' | 'assessor' | 'finance';

export type VehicleStatus = 
  | 'pending' 
  | 'inspected' 
  | 'preparing' 
  | 'completed' 
  | 'cancelled';

export type InspectionItemStatus = 'pass' | 'fail' | 'pending' | 'not_applicable';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type AccidentSeverity = 'minor' | 'moderate' | 'severe';

export interface StatusTransitionConfig {
  id: string;
  fromStatus: VehicleStatus;
  toStatus: VehicleStatus;
  requiredRole: Role;
  allowedRoles: Role[];
  requiredFields: string[];
  autoNotifyRoles: Role[];
  timeoutHours: number;
  description: string;
}

export interface AccidentAnnotation {
  id: string;
  reportId: string;
  itemId: string;
  severity: AccidentSeverity;
  description: string;
  location: string;
  annotatedBy: string;
  annotatedAt: Date;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  note: string;
}

export interface CostBudget {
  vehicleId: string;
  estimatedBudget: number;
  actualCost: number;
  warningThreshold: number;
  overrunThreshold: number;
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
}

export interface DocumentReminder {
  id: string;
  vehicleId: string;
  recordId: string;
  documentName: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'completed';
  assigneeId: string;
  dueDate: Date;
  remindedAt: Date | null;
  completedAt: Date | null;
  note: string;
}

export interface OperationRecord {
  id: string;
  vehicleId: string;
  type: 'status_change' | 'inspection' | 'task' | 'finance' | 'note' | 'document';
  action: string;
  previousValue: string | null;
  newValue: string | null;
  actorId: string;
  actorName: string;
  actorRole: Role;
  createdAt: Date;
  note: string;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  phone: string;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  purchasePrice: number;
  estimatedValue: number;
  status: VehicleStatus;
  managerId: string;
  assessorId: string | null;
  financeId: string | null;
  currentAssigneeId: string;
  currentAssigneeRole: Role;
  statusHistory: Array<{
    status: VehicleStatus;
    changedBy: string;
    changedByName: string;
    changedAt: Date;
    note: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InspectionItem {
  id: string;
  category: string;
  name: string;
  description: string;
  status: InspectionItemStatus;
  score: number;
  note: string;
  inspectorId: string;
  inspectedAt: Date;
  isAccident: boolean;
  accidentAnnotations: AccidentAnnotation[];
}

export interface InspectionReport {
  id: string;
  vehicleId: string;
  inspectorId: string;
  items: InspectionItem[];
  overallScore: number;
  conclusion: string;
  recommendations: string;
  hasAccidentRecords: boolean;
  accidentCount: number;
  criticalIssues: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PreparationTask {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  cost: number;
  estimatedCost: number;
  estimatedHours: number;
  actualHours: number;
  status: TaskStatus;
  assigneeId: string;
  assigneeName: string;
  dueDate: Date;
  completedAt: Date | null;
  note: string;
  createdBy: string;
  createdByName: string;
  costHistory: Array<{
    cost: number;
    changedBy: string;
    changedByName: string;
    changedAt: Date;
    reason: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  id: string;
  vehicleId: string;
  type: 'status_change' | 'inspection' | 'task' | 'note' | 'finance';
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FinanceRecord {
  id: string;
  vehicleId: string;
  type: 'loan_application' | 'document' | 'approval' | 'rejection';
  documentName: string;
  status: 'pending' | 'completed' | 'missing' | 'overdue';
  assigneeId: string;
  assigneeName: string;
  dueDate: Date;
  remindedCount: number;
  lastRemindedAt: Date | null;
  note: string;
  createdBy: string;
  createdByName: string;
  updatedAt: Date;
}
