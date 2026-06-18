export type UserRole = 'exhibitor' | 'engineer' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export type ExhibitStatus = 'normal' | 'inspecting' | 'fault_pending' | 'repairing';

export interface Exhibit {
  id: string;
  name: string;
  location: string;
  status: ExhibitStatus;
  created_at: string;
}

export type InspectionResult = 'normal' | 'abnormal';

export interface Inspection {
  id: string;
  exhibit_id: string;
  inspector_id: string;
  result: InspectionResult;
  notes: string | null;
  created_at: string;
  exhibit?: Exhibit;
  inspector?: User;
}

export type FaultStatus = 'pending' | 'processing' | 'completed';

export interface FaultReport {
  id: string;
  exhibit_id: string;
  reporter_id: string;
  assignee_id: string | null;
  description: string;
  status: FaultStatus;
  repair_notes: string | null;
  created_at: string;
  received_at: string | null;
  completed_at: string | null;
  exhibit?: Exhibit;
  reporter?: User;
  assignee?: User | null;
  logs?: OperationLog[];
}

export type OperationType =
  | 'inspection_submitted'
  | 'fault_reported'
  | 'fault_received'
  | 'fault_processed'
  | 'fault_completed';

export interface OperationLog {
  id: string;
  type: OperationType;
  operator_id: string;
  target_id: string;
  target_type: 'inspection' | 'fault_report';
  details: string | null;
  created_at: string;
  operator?: User;
}

export interface DashboardStats {
  totalExhibits: number;
  normalExhibits: number;
  faultExhibits: number;
  todayInspections: number;
  pendingFaults: number;
  processingFaults: number;
  completedFaults: number;
}

export interface TodoItem {
  type: 'inspection' | 'fault';
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

export interface RiskItem {
  type: 'exhibit' | 'fault';
  id: string;
  title: string;
  risk: string;
  status: string;
  duration: string;
}
