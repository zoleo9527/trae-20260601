export type UserRole = '前台' | '技师' | '店长';

export type BalanceStatus = '待处理' | '处理中' | '已完成' | '需复检';

export type InspectionStatus = '待质检' | '质检中' | '质检通过' | '质检不通过';

export type LogAction = '创建工单' | '更新动平衡' | '完成动平衡' | '开始质检' | '质检通过' | '质检不通过' | '交车完成' | '修改记录' | '查看详情';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password: string;
}

export interface BalanceRecord {
  id: string;
  workOrderId: string;
  wheelPosition: string;
  balanceValue: number;
  beforeValue: number;
  status: BalanceStatus;
  technicianId: string;
  createdAt: string;
  updatedAt: string;
  remark: string;
}

export interface InspectionRecord {
  id: string;
  workOrderId: string;
  status: InspectionStatus;
  inspectorId: string;
  checkItems: string[];
  passedItems: string[];
  failedItems: string[];
  createdAt: string;
  updatedAt: string;
  remark: string;
}

export interface WorkOrder {
  id: string;
  plateNumber: string;
  customerName: string;
  phone: string;
  vehicleModel: string;
  tireType: string;
  balanceRecords: BalanceRecord[];
  inspectionRecord: InspectionRecord | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: '进行中' | '已完成';
}

export interface OperationLog {
  id: string;
  workOrderId: string;
  action: LogAction;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
  details: string;
}
