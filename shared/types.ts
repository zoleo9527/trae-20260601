
export type UserRole = 'store_manager' | 'supervisor' | 'product_specialist';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  storeId?: string;
  storeName?: string;
}

export type PromotionStatus = 'pending' | 'processing' | 'completed' | 'has_issue';

export interface PromotionDisplay {
  id: string;
  title: string;
  description: string;
  storeId: string;
  storeName: string;
  productSpecialistId: string;
  productSpecialistName: string;
  status: PromotionStatus;
  createdAt: string;
  deadline: string;
  remarks: Remark[];
  images: string[];
  inspectionCount: number;
}

export type InspectionStatus = 'pending' | 'processing' | 'reviewing' | 'completed' | 'rejected';

export interface InspectionRectification {
  id: string;
  promotionId?: string;
  promotionTitle?: string;
  storeId: string;
  storeName: string;
  supervisorId: string;
  supervisorName: string;
  title: string;
  description: string;
  requirement: string;
  status: InspectionStatus;
  createdAt: string;
  deadline: string;
  remarks: Remark[];
  rejectCount: number;
  lastRejectReason?: string;
  images: string[];
  replyImages: string[];
  replyContent?: string;
  replyAt?: string;
}

export interface Remark {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
  source: 'promotion' | 'inspection';
  sourceId: string;
}

export interface LoginRequest {
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreatePromotionRequest {
  title: string;
  description: string;
  storeId: string;
  storeName: string;
  deadline: string;
}

export interface CreateInspectionRequest {
  promotionId?: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  requirement: string;
  deadline: string;
}

export interface UpdateInspectionStatusRequest {
  status: InspectionStatus;
  rejectReason?: string;
}

export interface ReplyInspectionRequest {
  content: string;
  images: string[];
}

export interface OperationHistory {
  id: string;
  sourceId: string;
  source: 'promotion' | 'inspection';
  action: string;
  description: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  createdAt: string;
  rejectReason?: string;
}

export interface DashboardStats {
  pendingPromotions: number;
  processingPromotions: number;
  completedPromotions: number;
  pendingInspections: number;
  processingInspections: number;
  rejectedInspections: number;
  completedInspections: number;
}
