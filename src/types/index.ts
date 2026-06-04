export type UserRole = 'nurse_manager' | 'primary_nurse' | 'social_worker' | 'family';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone: string;
}

export interface Bed {
  id: string;
  bedNumber: string;
  floor: string;
  roomNumber: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  elderId?: string;
}

export interface Elder {
  id: string;
  name: string;
  idCard: string;
  age: number;
  gender: 'male' | 'female';
  bedId: string;
  healthStatus: 'good' | 'fair' | 'poor' | 'critical';
  primaryNurseId: string;
  checkInDate: string;
}

export interface FamilyMember {
  id: string;
  elderId: string;
  name: string;
  relationship: string;
  phone: string;
  wechatId?: string;
}

export type VisitStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'checked_in' 
  | 'completed' 
  | 'cancelled'
  | 'pending_followup'
  | 'stuck';

export interface VisitAppointment {
  id: string;
  requestId: string;
  elderId: string;
  familyMemberId: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdCard?: string;
  numberOfVisitors: number;
  requestedDate: string;
  requestedTimeSlot: string;
  visitType: 'regular' | 'special' | 'emergency';
  purpose?: string;
  status: VisitStatus;
  statusHistory: StatusHistoryItem[];
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  checkInAt?: string;
  checkOutAt?: string;
  notes?: string;
  isIdempotent?: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  remark?: string;
}

export type CommunicationType = 'wechat' | 'phone' | 'on_site' | 'video' | 'letter';
export type CommunicationStatus = 'pending' | 'in_progress' | 'completed' | 'stuck' | 'escalated';

export interface CommunicationRecord {
  id: string;
  requestId: string;
  elderId: string;
  familyMemberId: string;
  type: CommunicationType;
  title: string;
  content: string;
  status: CommunicationStatus;
  statusHistory: StatusHistoryItem[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  createdAt: string;
  assignedTo?: string;
  assignedAt?: string;
  completedAt?: string;
  resolution?: string;
  followUpNeeded: boolean;
  followUpDate?: string;
  tags: string[];
  isIdempotent?: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface ShiftRecord {
  id: string;
  date: string;
  shiftType: 'morning' | 'afternoon' | 'night';
  nurseId: string;
  elderIds: string[];
  handoverNotes: string;
  abnormalSituations: string[];
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  idempotencyKey?: string;
}

export interface Permission {
  canCreateVisit: boolean;
  canApproveVisit: boolean;
  canCancelVisit: boolean;
  canViewAllVisits: boolean;
  canCreateCommunication: boolean;
  canAssignCommunication: boolean;
  canResolveCommunication: boolean;
  canViewAllCommunications: boolean;
  canViewElderInfo: boolean;
  canEditElderInfo: boolean;
}
