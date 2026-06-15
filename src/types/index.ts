export type MachineStatus = 'pending' | 'testing' | 'test_passed' | 'test_failed' | 'pending_approval' | 'approved' | 'rejected' | 'completed';

export type TestItemStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type OperationType = 'start_test' | 'update_test_item' | 'complete_test' | 'approve' | 'reject' | 'return' | 'complete_delivery' | 'add_exception' | 'resolve_exception';

export interface OperationRecord {
  id: string;
  machineId: string;
  type: OperationType;
  operator: string;
  description: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface HardwareComponent {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  vendor: string;
}

export interface TestItem {
  id: string;
  name: string;
  description: string;
  status: TestItemStatus;
  result: string;
  remarks: string;
  testedAt?: string;
  tester?: string;
}

export interface BurnInTest {
  id: string;
  machineId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  temperature: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
  items: TestItem[];
  overallStatus: 'pending' | 'running' | 'passed' | 'failed';
  remarks: string;
  operator: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRecord {
  id: string;
  machineId: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  address: string;
  accessories: string[];
  warrantyCard: boolean;
  invoice: boolean;
  signImage?: string;
  signer: string;
  createdAt: string;
}

export interface ApprovalRecord {
  id: string;
  machineId: string;
  approver: string;
  status: ApprovalStatus;
  comments: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ExceptionRecord {
  id: string;
  machineId: string;
  type: 'hardware' | 'software' | 'configuration' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  machineId: string;
  type: 'call' | 'wechat' | 'note' | 'other';
  content: string;
  operator: string;
  createdAt: string;
}

export interface Machine {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  configuration: string;
  hardware: HardwareComponent[];
  status: MachineStatus;
  oldLedgerNo?: string;
  siteRecord?: string;
  burnInTest?: BurnInTest;
  burnInTestHistory: BurnInTest[];
  delivery?: DeliveryRecord;
  approval?: ApprovalRecord;
  approvalHistory: ApprovalRecord[];
  exceptions: ExceptionRecord[];
  communications: CommunicationLog[];
  operations: OperationRecord[];
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
}

export interface ExportTask {
  id: string;
  type: 'burn_in_test' | 'delivery' | 'exception' | 'all';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  totalRecords: number;
  exportedRecords: number;
  createdAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  totalMachines: number;
  pendingTest: number;
  testing: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  completed: number;
  exceptions: number;
  todayTests: number;
  todayDeliveries: number;
}
