export interface ReturnCase {
  id: string;
  caseNo: string;
  customerName: string;
  productName: string;
  batchNo: string;
  returnQuantity: number;
  unit: string;
  returnReason: 'odor' | 'spec' | 'other';
  reasonDetail: string;
  customerPhotos: string[];
  status: 'registered' | 'tracing' | 'reinspecting' | 'processing' | 'recalling' | 'closed';
  conclusion?: 'false_alarm' | 'quality_issue' | 'price_adjustment';
  conclusionRemark?: string;
  priceAdjustment?: number;
  registeredAt: string;
  registeredBy: string;
  closedAt?: string;
  closedBy?: string;
}

export interface OutRecord {
  id: string;
  customerName: string;
  quantity: number;
  outTime: string;
  orderNo: string;
}

export interface BatchTrace {
  batchNo: string;
  rawMaterial: {
    rawBatchNo: string;
    supplier: string;
    supplyDate: string;
    inspectionReport: string;
    weight: number;
    quarantineNo: string;
  };
  production: {
    workshop: string;
    teamNo: string;
    teamLeader: string;
    productionDate: string;
    processRecords: string[];
    equipment: string[];
    shift: string;
  };
  coldStorage: {
    warehouseNo: string;
    locationCode: string;
    inTime: string;
    temperature: number;
    outRecords: OutRecord[];
    remainingStock: number;
    unit: string;
  };
}

export interface PhotoItem {
  id: string;
  url: string;
  description: string;
  uploadedAt: string;
}

export interface Reinspection {
  caseId: string;
  inspector: string;
  inspectTime: string;
  photos: PhotoItem[];
  conclusion: 'false_alarm' | 'quality_issue' | 'price_adjustment';
  remark: string;
  productionSupplement?: {
    teamLeader: string;
    supplementTime: string;
    content: string;
  };
  stockConfirmation?: {
    warehouseKeeper: string;
    confirmTime: string;
    remainingStock: number;
    remark: string;
  };
}

export interface RecallCustomer {
  id: string;
  customerName: string;
  contact: string;
  phone: string;
  shippedQuantity: number;
  shippedDate: string;
  unit: string;
  notifyStatus: 'pending' | 'notified' | 'confirmed' | 'returned';
  notifyTime?: string;
  returnedQuantity?: number;
  remark?: string;
}

export interface RecallTask {
  id: string;
  caseId: string;
  caseNo: string;
  productName: string;
  batchNo: string;
  status: 'pending' | 'notifying' | 'completed';
  createdAt: string;
  readyToCompleteAt?: string;
  completedAt?: string;
  reason: string;
  finalDisposition?: string;
  customers: RecallCustomer[];
}

export type CaseStatus = ReturnCase['status'];
export type ConclusionType = Reinspection['conclusion'];
export type NotifyStatus = RecallCustomer['notifyStatus'];
export type RecallStatus = RecallTask['status'];
