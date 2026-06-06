export enum Role {
  DORM_MANAGER = 'DORM_MANAGER',
  REPAIR_WORKER = 'REPAIR_WORKER',
  LOGISTICS_SUPERVISOR = 'LOGISTICS_SUPERVISOR',
}

export enum RepairStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  MATERIAL_REGISTERED = 'MATERIAL_REGISTERED',
  FEE_REGISTERED = 'FEE_REGISTERED',
  RETURNED = 'RETURNED',
  COMPLETED = 'COMPLETED',
}

export enum AuditResult {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepairMaterial {
  id: string;
  orderId: string;
  materialName: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  registeredBy: string;
  registeredAt: Date;
  note?: string;
}

export interface RepairFee {
  id: string;
  orderId: string;
  feeType: string;
  amount: number;
  registeredBy: string;
  registeredAt: Date;
  note?: string;
}

export interface StatusHistory {
  id: string;
  orderId: string;
  fromStatus?: RepairStatus;
  toStatus: RepairStatus;
  operatorId: string;
  operatedAt: Date;
  remark?: string;
}

export interface AuditRecord {
  id: string;
  orderId: string;
  auditorId: string;
  auditResult: AuditResult;
  auditAt: Date;
  auditOpinion?: string;
  returnReason?: string;
}

export interface RepairOrder {
  id: string;
  orderNo: string;
  dormitory: string;
  roomNumber: string;
  issueType: string;
  description: string;
  currentStatus: RepairStatus;
  creatorId: string;
  assigneeId?: string;
  returnReason?: string;
  supplementNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepairOrderDetail extends RepairOrder {
  creator: User;
  assignee?: User;
  materials: RepairMaterial[];
  fees: RepairFee[];
  statusHistories: (StatusHistory & { operator: User })[];
  auditRecords: (AuditRecord & { auditor: User })[];
}
