export type UserRole = 'social_worker' | 'volunteer_leader' | 'community_officer';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  name: string;
  phone: string;
}

export type ServiceStatus = 
  | 'pending_checkin'
  | 'checked_in'
  | 'pending_confirm'
  | 'confirmed'
  | 'rejected'
  | 'cancelled';

export interface ServiceRecord {
  id: number;
  user_id: number;
  volunteer_id: number;
  service_type: string;
  service_date: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  status: ServiceStatus;
  location: string;
  description: string;
  created_by: number;
  confirmed_by: number | null;
  rejected_by: number | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  volunteer_name?: string;
  volunteer_phone?: string;
  creator_name?: string;
  confirmer_name?: string;
  rejecter_name?: string;
}

export interface Volunteer {
  id: number;
  name: string;
  phone: string;
  id_card: string;
  registered_at: string;
  status: 'active' | 'inactive';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TodayTasksResponse {
  pendingCheckin: ServiceRecord[];
  checkedIn: ServiceRecord[];
  pendingConfirm: ServiceRecord[];
  overdue: ServiceRecord[];
  recentlyRejected: ServiceRecord[];
  pendingCheckinCount: number;
  checkedInCount: number;
  pendingConfirmCount: number;
  overdueCount: number;
  rejectedCount: number;
}

export interface CheckinRequest {
  service_record_id: number;
  checkin_location: string;
}

export interface ConfirmRequest {
  service_record_id: number;
  confirmed_duration: number;
  notes?: string;
}

export interface RejectRequest {
  service_record_id: number;
  reason: string;
}

export interface ServiceCreateRequest {
  volunteer_id: number;
  service_type: string;
  service_date: string;
  start_time: string;
  location: string;
  description: string;
}
