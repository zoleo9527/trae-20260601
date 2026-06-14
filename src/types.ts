export type UserRole = 'counter' | 'warehouse' | 'finance';

export type RecordStatus = 'pending_assessment' | 'pending_storage' | 'pending_photo' | 'pending_review' | 'abnormal' | 'completed' | 'rejected';

export type TodoType = 'assessment' | 'storage' | 'photo' | 'review' | 'finance_confirm';

export interface PhotoItem {
  id: string;
  url: string;
  label: string;
  uploadTime: string;
  uploadBy: string;
  remark?: string;
}

export interface OperationLog {
  id: string;
  operation: string;
  operator: string;
  operatorRole: UserRole;
  operateTime: string;
  reason?: string;
  remark?: string;
}

export interface PawnRecord {
  id: string;
  pawnNo: string;
  customerName: string;
  customerPhone: string;
  itemName: string;
  itemCategory: string;
  estimatedValue: number;
  pawnAmount: number;
  pawnDate: string;
  duration: string;
  
  assessmentResult?: string;
  assessmentRemark?: string;
  assessedBy?: string;
  assessmentTime?: string;
  
  storageStatus: 'pending' | 'stored' | 'rejected';
  storageLocation?: string;
  storedBy?: string;
  storageTime?: string;
  storageRemark?: string;
  rejectReason?: string;
  
  photoStatus: 'pending' | 'taken' | 'rejected';
  photos?: PhotoItem[];
  photoTakenBy?: string;
  photoTime?: string;
  photoRemark?: string;
  photoRejectReason?: string;
  
  financeConfirmed: boolean;
  financeConfirmedBy?: string;
  financeConfirmTime?: string;
  financeRemark?: string;
  
  status: RecordStatus;
  abnormalReason?: string;
  currentHandler: UserRole;
  
  operationLogs: OperationLog[];
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  pawnRecordId: string;
  pawnNo: string;
  itemName: string;
  type: TodoType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  createdAt: string;
}

export interface StatCard {
  title: string;
  value: number;
  trend?: number;
  color: string;
}
