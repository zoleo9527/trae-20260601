export interface Route {
  id: number;
  name: string;
  description?: string;
  direction: 'morning' | 'afternoon';
  estimated_duration: number;
  created_at: string;
  stops?: Stop[];
}

export interface Stop {
  id: number;
  route_id: number;
  name: string;
  address?: string;
  sequence: number;
  estimated_arrival_time: string;
  latitude?: number;
  longitude?: number;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  last_maintenance_date?: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  employee_id: string;
  license_number: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar_url?: string;
}

export interface Student {
  id: number;
  name: string;
  student_id: string;
  grade: string;
  class: string;
  parent_name: string;
  parent_phone: string;
  default_route_id?: number;
  default_stop_id?: number;
  avatar_url?: string;
  default_route?: RouteSummary;
  default_stop?: StopSummary;
}

export interface RouteSummary {
  id: number;
  name: string;
  direction: string;
}

export interface StopSummary {
  id: number;
  name: string;
  estimated_arrival_time: string;
}

export interface Schedule {
  id: number;
  route_id: number;
  vehicle_id: number;
  driver_id: number;
  schedule_date: string;
  shift_type: 'morning' | 'afternoon';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  route?: RouteSummary;
  vehicle?: VehicleSummary;
  driver?: DriverSummary;
  check_ins?: CheckIn[];
  ride_records?: RideRecord[];
}

export interface VehicleSummary {
  id: number;
  plate_number: string;
  model: string;
}

export interface DriverSummary {
  id: number;
  name: string;
  phone: string;
}

export interface CheckIn {
  id: number;
  schedule_id: number;
  stop_id: number;
  driver_id: number;
  actual_arrival_time: string;
  estimated_arrival_time: string;
  status: 'on_time' | 'late' | 'early';
  delay_minutes: number;
  notes?: string;
  created_at: string;
  stop?: StopSummary;
  driver?: DriverSummary;
}

export interface RideRecord {
  id: number;
  schedule_id: number;
  student_id: number;
  stop_id: number;
  check_in_id?: number;
  status: 'pending' | 'boarded' | 'absent' | 'not_checked';
  board_time?: string;
  notes?: string;
  created_at: string;
  student?: StudentSummary;
  stop?: StopSummary;
  schedule?: ScheduleSummary;
}

export interface StudentSummary {
  id: number;
  name: string;
  student_id: string;
  grade: string;
  class: string;
  parent_name: string;
  parent_phone: string;
}

export interface ScheduleSummary {
  id: number;
  schedule_date: string;
  shift_type: string;
  route_name: string;
}

export interface LateEvent {
  id: number;
  schedule_id: number;
  stop_id?: number;
  check_in_id?: number;
  delay_minutes: number;
  detected_time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'resolved' | 'false_alarm';
  reported_by?: string;
  schedule?: ScheduleSummary;
  stop?: StopSummary;
}

export interface Complaint {
  id: number;
  student_id: number;
  schedule_id?: number;
  complaint_type: 'late' | 'no_show' | 'rude_driver' | 'other';
  description: string;
  parent_name: string;
  parent_phone: string;
  complaint_time: string;
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  handler_id?: number;
  handler_notes?: string;
  review_result?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  student?: StudentSummary;
  schedule?: ScheduleSummary;
}

export interface CreateScheduleRequest {
  route_id: number;
  vehicle_id: number;
  driver_id: number;
  schedule_date: string;
  shift_type: 'morning' | 'afternoon';
  notes?: string;
}

export interface CreateCheckInRequest {
  schedule_id: number;
  stop_id: number;
  driver_id: number;
  actual_arrival_time: string;
  notes?: string;
}

export interface CreateComplaintRequest {
  student_id: number;
  schedule_id?: number;
  complaint_type: 'late' | 'no_show' | 'rude_driver' | 'other';
  description: string;
  parent_name: string;
  parent_phone: string;
}

export interface ReviewComplaintRequest {
  complaint_id: number;
  status: 'resolved' | 'rejected';
  review_result: string;
  reviewed_by: number;
}

export interface UpdateRideRecordRequest {
  status: 'boarded' | 'absent';
  board_time?: string;
  notes?: string;
}
