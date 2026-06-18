import axios from "axios"
import type {
  LoginRequest,
  ListSchedulesParams,
  CreateBookingRequest,
  UpdateBookingRequest,
  CreateScheduleRequest,
  UpdateScheduleStatusRequest,
  BatchAssignRequest,
  UpdateAssignmentRequest,
  CreateExceptionRequest,
  HandleExceptionRequest,
  MarkAllReadRequest,
  CreateDamagePhotoRequest,
  PaginationResult,
  Booking,
  Vehicle,
  VehicleSchedule,
  CrewMember,
  CrewAssignment,
  ExceptionRecord,
  ExceptionType,
  Notification,
  DamagePhoto,
  User,
  BookingStatus,
  ScheduleStatus,
  AssignmentStatus,
  ExceptionStatus,
  CrewReviewResult,
  Role,
  VehicleStatus,
  CrewStatus,
  TimelineResult,
} from "@/types"

const baseURL = "/api"
const request = axios.create({ baseURL, timeout: 15000 })

request.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("app-auth-storage")
    if (raw) {
      const parsed = JSON.parse(raw)
      const token = parsed.state?.user?.token
      const uid = parsed.state?.user?.id
      if (token) config.headers.Authorization = "Bearer " + token
      if (uid) config.headers["X-User-ID"] = uid
    }
  } catch {}
  return config
})

request.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.error || err?.message || "请求失败"
    return Promise.reject(new Error(msg))
  }
)

// Auth
export const login = (data: LoginRequest): Promise<User> =>
  request.post("/auth/login", data).then(r => {
    const user = r.data as User
    user.token = "user-" + user.id
    return user
  })

export const getCurrentUser = (): Promise<User> =>
  request.get("/auth/me").then(r => r.data)

export const listUsers = (params?: {
  role?: Role
  page?: number
  page_size?: number
}): Promise<PaginationResult<User>> =>
  request.get("/auth/users", { params }).then(r => r.data)

// Bookings
export const listBookings = (params?: {
  status?: BookingStatus
  date_from?: string
  date_to?: string
  customer?: string
  page?: number
  page_size?: number
}): Promise<PaginationResult<Booking>> =>
  request.get("/bookings", { params }).then(r => r.data)

export const getBooking = (id: string): Promise<Booking> =>
  request.get("/bookings/" + id).then(r => r.data)

export const createBooking = (data: CreateBookingRequest): Promise<Booking> =>
  request.post("/bookings", data).then(r => r.data)

export const updateBooking = (id: string, data: UpdateBookingRequest): Promise<Booking> =>
  request.patch("/bookings/" + id, data).then(r => r.data)

export const deleteBooking = (id: string): Promise<void> =>
  request.delete("/bookings/" + id).then(r => r.data)

// Vehicles
export const listVehicles = (params?: {
  status?: VehicleStatus
  type?: string
  page?: number
  page_size?: number
}): Promise<PaginationResult<Vehicle>> =>
  request.get("/vehicles", { params }).then(r => r.data)

export const getVehicle = (id: string): Promise<Vehicle> =>
  request.get("/vehicles/" + id).then(r => r.data)

export const createVehicle = (data: Omit<Vehicle, "id" | "created_at" | "updated_at">): Promise<Vehicle> =>
  request.post("/vehicles", data).then(r => r.data)

export const updateVehicle = (id: string, data: Partial<Vehicle>): Promise<Vehicle> =>
  request.patch("/vehicles/" + id, data).then(r => r.data)

export const deleteVehicle = (id: string): Promise<void> =>
  request.delete("/vehicles/" + id).then(r => r.data)

// Crew
export const listCrews = (params?: {
  status?: CrewStatus
  position?: string
  page?: number
  page_size?: number
}): Promise<PaginationResult<CrewMember>> =>
  request.get("/crew", { params }).then(r => r.data)

export const getCrew = (id: string): Promise<CrewMember> =>
  request.get("/crew/" + id).then(r => r.data)

export const createCrew = (data: Omit<CrewMember, "id" | "created_at" | "updated_at">): Promise<CrewMember> =>
  request.post("/crew", data).then(r => r.data)

export const updateCrew = (id: string, data: Partial<CrewMember>): Promise<CrewMember> =>
  request.patch("/crew/" + id, data).then(r => r.data)

export const deleteCrew = (id: string): Promise<void> =>
  request.delete("/crew/" + id).then(r => r.data)

// Schedules
export const createSchedule = (data: CreateScheduleRequest): Promise<VehicleSchedule> =>
  request.post("/schedules", data).then(r => r.data)

export const listSchedules = (params?: ListSchedulesParams): Promise<PaginationResult<VehicleSchedule>> =>
  request.get("/schedules", { params }).then(r => r.data)

export const getScheduleTimeline = (date: string): Promise<TimelineResult> =>
  request.get("/schedules/timeline/" + date).then(r => r.data)

export const getSchedule = (id: string): Promise<VehicleSchedule> =>
  request.get("/schedules/" + id).then(r => r.data)

export const updateScheduleStatus = (id: string, data: UpdateScheduleStatusRequest): Promise<VehicleSchedule> =>
  request.patch("/schedules/" + id + "/status", data).then(r => r.data)

// Assignments
export const batchAssign = (data: BatchAssignRequest): Promise<{ message: string }> =>
  request.post("/assignments/batch", data).then(r => r.data)

export const listAssignments = (params?: {
  crew_id?: string
  schedule_id?: string
  status?: AssignmentStatus
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}): Promise<PaginationResult<CrewAssignment>> =>
  request.get("/assignments", { params }).then(r => r.data)

export const getCrewReview = (memberId: string, params?: {
  start_date?: string
  end_date?: string
  user_id?: string
}): Promise<CrewReviewResult> =>
  request.get("/assignments/review/" + memberId, { params }).then(r => r.data)

export const updateAssignment = (id: string, data: UpdateAssignmentRequest): Promise<CrewAssignment> =>
  request.patch("/assignments/" + id, data).then(r => r.data)

// Exceptions
export const createException = (data: CreateExceptionRequest): Promise<ExceptionRecord> =>
  request.post("/exceptions", data).then(r => r.data)

export const uploadDamagePhoto = (data: CreateDamagePhotoRequest): Promise<DamagePhoto> =>
  request.post("/damage-photos", data).then(r => r.data)

export const listExceptions = (params?: {
  booking_id?: string
  leader_id?: string
  user_id?: string
  status?: ExceptionStatus
  type?: ExceptionType
  page?: number
  page_size?: number
}): Promise<PaginationResult<ExceptionRecord>> =>
  request.get("/exceptions", { params }).then(r => r.data)

export const triggerException = (bookingId: string, type?: ExceptionType): Promise<ExceptionRecord> =>
  request.get("/exceptions/trigger/" + bookingId, { params: { type } }).then(r => r.data)

export const handleException = (id: string, data: HandleExceptionRequest): Promise<ExceptionRecord> =>
  request.patch("/exceptions/" + id + "/handle", data).then(r => r.data)

// Notifications
export const listNotifications = (params?: {
  user_id?: string
  page?: number
  page_size?: number
}): Promise<PaginationResult<Notification>> =>
  request.get("/notifications", { params }).then(r => r.data)

export const markNotificationRead = (id: string): Promise<Notification> =>
  request.patch("/notifications/" + id + "/read").then(r => r.data)

export const markAllNotificationsRead = (data?: MarkAllReadRequest): Promise<{ message: string }> =>
  request.post("/notifications/mark-all-read", data || {}).then(r => r.data)

// Damage Photos
export const listDamagePhotos = (params?: {
  booking_id?: string
  leader_id?: string
  user_id?: string
  exception_id?: string
  page?: number
  page_size?: number
}): Promise<PaginationResult<DamagePhoto>> =>
  request.get("/damage-photos", { params }).then(r => r.data)

export const createDamagePhoto = (data: CreateDamagePhotoRequest): Promise<DamagePhoto> =>
  request.post("/damage-photos", data).then(r => r.data)

export const deleteDamagePhoto = (id: string): Promise<void> =>
  request.delete("/damage-photos/" + id).then(r => r.data)
