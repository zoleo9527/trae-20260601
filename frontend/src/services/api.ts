import axios from "axios"
import type {
  LoginRequest, LoginResponse,
  Booking, CreateBookingRequest, UpdateBookingRequest,
  Vehicle,
  VehicleSchedule, CreateScheduleRequest, UpdateScheduleStatusRequest,
  CrewAssignment, BatchAssignRequest, UpdateAssignmentRequest,
  ExceptionRecord, CreateExceptionRequest, HandleExceptionRequest, TriggerExceptionRequest,
  Notification,
  CrewMember,
} from "@/types"

const baseURL = "/api";
const request = axios.create({ baseURL, timeout: 15000 });

request.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("app-auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export const login = (data: LoginRequest): Promise<LoginResponse> => request.post("/auth/login", data).then(r => r.data);
export const getBookings = (params?: any): Promise<Booking[]> => request.get("/bookings", { params }).then(r => r.data);
export const createBooking = (data: CreateBookingRequest): Promise<Booking> => request.post("/bookings", data).then(r => r.data);
export const updateBooking = (id: string, data: UpdateBookingRequest): Promise<Booking> => request.put(`/bookings/${id}`, data).then(r => r.data);

export const getVehicles = (params?: any): Promise<Vehicle[]> => request.get("/vehicles", { params }).then(r => r.data);
export const createSchedule = (data: CreateScheduleRequest): Promise<VehicleSchedule> => request.post("/schedules", data).then(r => r.data);
export const getSchedules = (params?: any): Promise<VehicleSchedule[]> => request.get("/schedules", { params }).then(r => r.data);
export const getScheduleDetail = (id: string): Promise<VehicleSchedule> => request.get(`/schedules/${id}`).then(r => r.data);
export const updateScheduleStatus = (id: string, data: UpdateScheduleStatusRequest): Promise<VehicleSchedule> => request.patch(`/schedules/${id}/status`, data).then(r => r.data);
export const getScheduleTimeline = (params?: any): Promise<any> => request.get("/schedules/timeline", { params }).then(r => r.data);
export const batchAssign = (data: BatchAssignRequest): Promise<CrewAssignment[]> => request.post("/assignments/batch", data).then(r => r.data);
export const getAssignments = (params?: any): Promise<CrewAssignment[]> => request.get("/assignments", { params }).then(r => r.data);
export const getAssignmentReview = (id: string): Promise<CrewAssignment> => request.get(`/assignments/${id}/review`).then(r => r.data);
export const updateAssignment = (id: string, data: UpdateAssignmentRequest): Promise<CrewAssignment> => request.put(`/assignments/${id}`, data).then(r => r.data);
export const createException = (data: CreateExceptionRequest): Promise<ExceptionRecord> => request.post("/exceptions", data).then(r => r.data);
export const getExceptions = (params?: any): Promise<ExceptionRecord[]> => request.get("/exceptions", { params }).then(r => r.data);
export const handleException = (id: string, data: HandleExceptionRequest): Promise<ExceptionRecord> => request.patch(`/exceptions/${id}/handle`, data).then(r => r.data);
export const triggerException = (data: TriggerExceptionRequest): Promise<ExceptionRecord> => request.post("/exceptions/trigger", data).then(r => r.data);

export const getNotifications = (params?: any): Promise<Notification[]> => request.get("/notifications", { params }).then(r => r.data);
export const readNotification = (id: string): Promise<Notification> => request.patch(`/notifications/${id}/read`).then(r => r.data);

export const getCrew = (params?: any): Promise<CrewMember[]> => request.get("/crew", { params }).then(r => r.data);