export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'delayed';
export type PartStatus = 'requested' | 'approved' | 'picked' | 'installed';
export type DispatchStatus = 'unassigned' | 'assigned' | 'accepted' | 'rejected' | 'completed';

export interface StatusChange {
  id: string;
  fromStatus: string;
  toStatus: string;
  operator: string;
  operatorRole: string;
  timestamp: string;
  remark: string;
}

export interface AfterSaleCommunication {
  id: string;
  type: 'customer' | 'handler' | 'system';
  content: string;
  operator: string;
  timestamp: string;
}

export interface AfterSaleInfo {
  issue?: string;
  handler?: string;
  status?: 'pending' | 'processing' | 'resolved';
  createTime?: string;
  updateTime?: string;
  communications: AfterSaleCommunication[];
}

export interface PartRequest {
  id: string;
  orderId: string;
  partName: string;
  partCode: string;
  quantity: number;
  status: PartStatus;
  requester: string;
  requestTime: string;
  statusHistory: StatusChange[];
  currentHandler?: string;
  currentHandlerRole?: string;
  remark?: string;
}

export interface Master {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  status: 'available' | 'busy' | 'off';
  currentOrders: string[];
  rating: number;
}

export interface DispatchRecord {
  id: string;
  orderId: string;
  masterId: string;
  masterName: string;
  status: DispatchStatus;
  dispatchTime: string;
  acceptTime?: string;
  completeTime?: string;
  statusHistory: StatusChange[];
  remark?: string;
  rejectReason?: string;
}

export interface InstallationOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  productType: string;
  productModel: string;
  status: TaskStatus;
  createTime: string;
  scheduledTime?: string;
  completeTime?: string;
  dispatcher?: string;
  assignedMaster?: string;
  assignedMasterId?: string;
  partRequests: PartRequest[];
  dispatchRecords: DispatchRecord[];
  statusHistory: StatusChange[];
  afterSale?: AfterSaleInfo;
  remark?: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  delayedOrders: number;
  pendingParts: number;
  unassignedMasters: number;
}