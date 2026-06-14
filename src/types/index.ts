export interface User {
  id: number;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  department?: string;
  createdAt: string;
  isActive: boolean;
}

export type UserRole = 'consultant' | 'project_manager' | 'client_finance';

export type ConsultationStatus =
  | '待受理'
  | '已受理'
  | '待补录'
  | '补录中'
  | '待复核'
  | '复核通过'
  | '已退回'
  | '资料清单完成';

export type DocumentStatus = '待发起' | '已要求提供' | '客户已提供' | '已收到' | '已豁免';

export interface Consultation {
  id: number;
  consultationNo: string;
  clientName: string;
  taxType: string;
  description: string;
  status: ConsultationStatus;
  currentHandler: string;
  handlerRole: UserRole;
  consultantId?: number;
  projectManagerId?: number;
  clientFinanceId?: number;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  priority: number;
  amount?: number;
  remarks?: string;
  rejectReason?: string;
  supplementReason?: string;
}

export interface DocumentItem {
  id: number;
  consultationId: number;
  itemName: string;
  itemDescription?: string;
  required: boolean;
  status: DocumentStatus;
  providedBy?: string;
  providedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  remarks?: string;
  incompleteReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: number;
  consultationId: number;
  documentListId?: number;
  operationType: string;
  fromStatus?: string;
  toStatus?: string;
  operator: string;
  operatorRole: UserRole;
  reason?: string;
  remarks?: string;
  createdAt: string;
}

export interface ConsultationDetail {
  consultation: Consultation;
  documents: DocumentItem[];
  logs: OperationLog[];
  consultantName?: string;
  projectManagerName?: string;
  clientFinanceName?: string;
}

export interface CreateConsultationRequest {
  clientName: string;
  taxType: string;
  description: string;
  consultantId?: number;
  projectManagerId?: number;
  clientFinanceId?: number;
  deadline?: string;
  priority: number;
  amount?: number;
  remarks?: string;
}

export interface UpdateConsultationRequest {
  id: number;
  status: ConsultationStatus;
  currentHandler: string;
  handlerRole: UserRole;
  remarks?: string;
  reason?: string;
  operator: string;
  operatorRole: UserRole;
}

export interface CreateDocumentRequest {
  consultationId: number;
  itemName: string;
  itemDescription?: string;
  required: boolean;
  operator: string;
}

export interface UpdateDocumentRequest {
  id: number;
  status: DocumentStatus;
  providedBy?: string;
  receivedBy?: string;
  remarks?: string;
  incompleteReason?: string;
  operator: string;
  operatorRole: UserRole;
}

export interface BatchUpdateDocumentRequest {
  ids: number[];
  status: DocumentStatus;
  operator: string;
  operatorRole: UserRole;
  remarks?: string;
}

export interface DashboardStats {
  totalConsultations: number;
  pendingAccept: number;
  accepted: number;
  pendingSupplement: number;
  supplementing: number;
  pendingReview: number;
  reviewed: number;
  rejected: number;
  docListCompleted: number;
  myPending: number;
  totalDocuments: number;
  docsReceived: number;
  docsPending: number;
  overdueConsultations: Consultation[];
  rejectedConsultations: Consultation[];
  incompleteDocConsultations: ConsultationDetail[];
}

export interface QueryFilter {
  status?: ConsultationStatus;
  handlerRole?: UserRole;
  currentHandler?: string;
  clientName?: string;
  taxType?: string;
  priority?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentListItem {
  id: number;
  consultationId: number;
  consultationNo: string;
  clientName: string;
  taxType: string;
  itemName: string;
  itemDescription?: string;
  required: boolean;
  status: DocumentStatus;
  providedBy?: string;
  providedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  remarks?: string;
  incompleteReason?: string;
  currentHandler: string;
  handlerRole: UserRole;
  consultationStatus: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentQueryFilter {
  status?: DocumentStatus;
  required?: boolean;
  incompleteOnly?: boolean;
  clientName?: string;
  taxType?: string;
  consultationStatus?: ConsultationStatus;
  handlerRole?: UserRole;
  currentHandler?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  consultant: '税务顾问',
  project_manager: '项目经理',
  client_finance: '客户财务',
};

export const CONSULTATION_STATUS_COLORS: Record<ConsultationStatus, string> = {
  '待受理': 'bg-gray-100 text-gray-700',
  '已受理': 'bg-blue-100 text-blue-700',
  '待补录': 'bg-yellow-100 text-yellow-700',
  '补录中': 'bg-orange-100 text-orange-700',
  '待复核': 'bg-purple-100 text-purple-700',
  '复核通过': 'bg-green-100 text-green-700',
  '已退回': 'bg-red-100 text-red-700',
  '资料清单完成': 'bg-emerald-100 text-emerald-700',
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  '待发起': 'bg-gray-100 text-gray-600',
  '已要求提供': 'bg-blue-100 text-blue-600',
  '客户已提供': 'bg-yellow-100 text-yellow-600',
  '已收到': 'bg-green-100 text-green-600',
  '已豁免': 'bg-slate-100 text-slate-600',
};

export const TAX_TYPES = [
  '增值税',
  '企业所得税',
  '个人所得税',
  '土地增值税',
  '房产税',
  '印花税',
  '契税',
  '其他',
];

export const PRIORITY_LABELS: Record<number, string> = {
  3: '高',
  2: '中',
  1: '低',
};

export const WORKFLOW_STEPS: { status: ConsultationStatus; label: string; description: string }[] = [
  { status: '待受理', label: '待受理', description: '咨询登记等待受理' },
  { status: '已受理', label: '已受理', description: '顾问已受理处理中' },
  { status: '待补录', label: '补录', description: '需客户财务补录资料' },
  { status: '补录中', label: '补录中', description: '客户财务正在补录' },
  { status: '待复核', label: '复核', description: '提交项目经理复核' },
  { status: '复核通过', label: '复核通过', description: '复核通过跟进资料' },
  { status: '已退回', label: '退回', description: '退回需重新处理' },
  { status: '资料清单完成', label: '完成', description: '资料清单全部收齐' },
];
