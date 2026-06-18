export type Role = "dispatcher" | "leader" | "customer"

export type BookingStatus = "pending" | "assigned" | "in_progress" | "delayed" | "surcharged" | "completed" | "cancelled"

export type ScheduleStatus = "created" | "assigned" | "departed" | "arrived" | "loading" | "moving" | "unloading" | "done" | "exception"

export type AssignmentStatus = "pending" | "accepted" | "arrived" | "working" | "completed" | "rejected"

export type ExceptionType = "delay" | "surcharge" | "damage"

export type ExceptionStatus = "pending" | "confirmed" | "rejected" | "refunded" | "resolved"

export type NotificationType = "system" | "exception" | "booking" | "assignment" | "schedule"

export type VehicleStatus = "idle" | "busy" | "maintenance" | "out_of_service"

export type CrewStatus = "active" | "inactive" | "on_leave"

export interface TimelineResult {
  date: string
  by_vehicle: Record<string, VehicleSchedule[]>
  items: VehicleSchedule[]
}

export interface User {
  id: string
  username: string
  name: string
  role: Role
  phone: string
  created_at: string
  updated_at: string
  token?: string
}

export interface Vehicle {
  id: string
  plate_number: string
  vehicle_type: string
  capacity: string
  driver_name: string
  driver_phone: string
  status: string
  created_at: string
  updated_at: string
}

export interface CrewMember {
  id: string
  name: string
  position: string
  phone: string
  status: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  from_address: string
  to_address: string
  move_date: string
  move_time: string
  house_size: string
  items: string
  remarks: string
  base_price: number
  extra_price: number
  total_price: number
  price_remark: string
  price_adjusted: boolean
  status: BookingStatus
  vehicle_id?: string
  schedule_id?: string
  vehicle?: Vehicle
  schedule?: VehicleSchedule
  created_at: string
  updated_at: string
}

export interface VehicleSchedule {
  id: string
  vehicle_id: string
  booking_id: string
  status: ScheduleStatus
  planned_start: string
  planned_end: string
  actual_start?: string
  actual_end?: string
  remarks: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  booking?: Booking
  leader_id?: string
  assignments?: CrewAssignment[]
}

export interface CrewAssignment {
  id: string
  schedule_id: string
  booking_id: string
  crew_id: string
  role: string
  status: AssignmentStatus
  assigned_at: string
  accepted_at?: string
  arrived_at?: string
  completed_at?: string
  reject_reason?: string
  created_at: string
  crew?: CrewMember
  schedule?: VehicleSchedule
  booking?: Booking
}

export interface DamagePhoto {
  id: string
  booking_id: string
  exception_id?: string
  url: string
  file_name?: string
  description?: string
  uploaded_by?: string
  uploaded_at?: string
  created_at: string
}

export interface ExceptionRecord {
  id: string
  booking_id: string
  schedule_id?: string
  type: ExceptionType
  title: string
  description: string
  status: ExceptionStatus
  reporter_id: string
  reporter_name?: string
  refund_amount: number
  surcharge_amount: number
  reject_count: number
  reject_reason?: string
  handled_by?: string
  handled_at?: string
  handle_remark?: string
  need_customer_notice: boolean
  notify_sent: boolean
  created_at: string
  updated_at: string
  booking?: Booking
  schedule?: VehicleSchedule
  photos?: DamagePhoto[]
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string
  read: boolean
  related_id?: string
  related_type?: string
  created_at: string
}

export interface PaginationResult<T> {
  total: number
  page: number
  page_size: number
  page_count: number
  data: T[]
}

export interface CrewReviewResult {
  total_count: number
  completed_count: number
  reject_count: number
  on_time_rate: number
  unique_customers: number
  recent_assignments: (CrewAssignment & {
    booking?: {
      customer_name?: string
      from_address?: string
      to_address?: string
    }
  })[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ListSchedulesParams {
  vehicle_id?: string
  booking_id?: string
  leader_id?: string
  status?: ScheduleStatus
  date?: string
  page?: number
  page_size?: number
}

export interface CreateBookingRequest {
  customer_name: string
  customer_phone: string
  from_address: string
  to_address: string
  move_date: string
  move_time: string
  house_size: string
  items: string
  remarks: string
  base_price: number
}

export interface UpdateBookingRequest {
  base_price?: number
  extra_price?: number
  final_price?: number
  price_remark?: string
  price_adjusted?: boolean
  status?: BookingStatus
  remarks?: string
}

export interface CreateScheduleRequest {
  booking_id: string
  vehicle_id: string
  planned_start: string
  planned_end: string
  remarks?: string
  crew_list: { crew_id: string; role: string }[]
}

export interface UpdateScheduleStatusRequest {
  status: ScheduleStatus
}

export interface BatchAssignRequest {
  schedule_id: string
  booking_id: string
  crew_list: { crew_id: string; role: string }[]
}

export interface UpdateAssignmentRequest {
  status: AssignmentStatus
  reject_reason?: string
}

export interface CreateExceptionRequest {
  booking_id: string
  schedule_id?: string
  reporter_id?: string
  type: ExceptionType
  title?: string
  description?: string
  refund_amount?: number
  surcharge_amount?: number
}

export interface HandleExceptionRequest {
  status: ExceptionStatus
  handler_id: string
  handle_remark?: string
  reject_reason?: string
  refund_amount?: number
  surcharge_amount?: number
}

export interface TriggerExceptionRequest {
  booking_id: string
  type: ExceptionType
}

export interface MarkAllReadRequest {
  user_id: string
}

export interface CreateDamagePhotoRequest {
  booking_id: string
  exception_id?: string
  url: string
  file_name?: string
  description?: string
  uploaded_by?: string
}
