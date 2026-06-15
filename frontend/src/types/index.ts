export type Role = "dispatcher" | "leader" | "customer_service"

export type BookingStatus = "pending" | "confirmed" | "scheduled" | "in_transit" | "in_progress" | "completed" | "cancelled" | "paid"

export type ScheduleStatus = "pending" | "departed" | "arrived_pickup" | "arrived_origin" | "loading" | "transporting" | "arrived_delivery" | "arrived_dest" | "unloading" | "finished" | "completed"

export type AssignmentStatus = "assigned" | "accepted" | "in_progress" | "done" | "rejected"

export type ExceptionType = "delay" | "surcharge" | "damage"

export type ExceptionStatus = "open" | "handling" | "resolved" | "refunded" | "closed" | "returned" | "pending" | "processing"

export interface User { id: string; name: string; role: Role; token: string; phone?: string }

export interface Booking { id: string; orderNo: string; customerName: string; customerPhone: string; moveFrom: string; moveTo: string; moveDate: string; moveTime: string; items: string; areaSize: number; floorFrom: number; floorTo: number; hasElevatorFrom: boolean; hasElevatorTo: boolean; specialRequirements?: string; estimatedPrice: number; finalPrice?: number; status: BookingStatus; createdAt: string; remark?: string; priceAdjusted?: boolean; priceAdjustReason?: string; priceRemark?: string }

export interface Vehicle { id: string; plateNumber: string; type: string; capacity: string; status: "available" | "busy" | "maintenance"; driverName: string; driverPhone: string }
export interface VehicleSchedule { id: string; bookingId: string; booking?: Booking; vehicleId: string; vehicle?: Vehicle; leaderId: string; leader?: CrewMember; departureTime: string; arrivalTime?: string; loadingStartTime?: string; transportStartTime?: string; unloadingStartTime?: string; completedTime?: string; status: ScheduleStatus; createdAt: string }

export interface CrewMember { id: string; name: string; role: "leader" | "mover" | "driver" | "worker"; phone: string; status: "available" | "busy" | "off" }

export interface CrewAssignment { id: string; scheduleId: string; crewId: string; crew?: CrewMember; status: AssignmentStatus; assignedAt: string; acceptedAt?: string; completedAt?: string }

export interface DamagePhoto { id: string; exceptionId: string; url: string; description?: string; createdAt: string; uploadedBy?: string; uploadedAt?: string }
export interface ExceptionRecord { id: string; bookingId: string; booking?: Booking; scheduleId?: string; type: ExceptionType; description: string; status: ExceptionStatus; reportedBy: string; reporterName?: string; resultAmount?: number; refundAmount?: number; handleResult?: string; handledBy?: string; handledAt?: string; createdAt: string; photos?: DamagePhoto[]; damagePhotos?: DamagePhoto[] }

export interface Notification { id: string; userId: string; title: string; content: string; type: "system" | "exception" | "booking" | "assignment"; isRead: boolean; relatedId?: string; createdAt: string }

export interface LoginRequest { role: Role; username: string; password: string }
export interface LoginResponse { token: string; user: User }

export interface CreateBookingRequest { customerName: string; customerPhone: string; moveFrom: string; moveTo: string; moveDate: string; moveTime: string; items: string; areaSize: number; floorFrom: number; floorTo: number; hasElevatorFrom: boolean; hasElevatorTo: boolean; specialRequirements?: string; estimatedPrice: number }

export interface UpdateBookingRequest { status?: BookingStatus; finalPrice?: number; remark?: string; priceAdjusted?: boolean; priceAdjustReason?: string; priceRemark?: string }
export interface CreateScheduleRequest { bookingId: string; vehicleId: string; leaderId: string; moverIds?: string[]; workerIds?: string[]; departureTime: string; arrivalTime: string }
export interface UpdateScheduleStatusRequest { status: ScheduleStatus }
export interface BatchAssignRequest { scheduleId: string; crewIds: string[] }
export interface UpdateAssignmentRequest { status: AssignmentStatus }
export interface CreateExceptionRequest { bookingId: string; scheduleId?: string; type: ExceptionType; description: string; resultAmount?: number; photos?: { url: string; description?: string }[] }
export interface HandleExceptionRequest { status: ExceptionStatus; handleResult?: string; refundAmount?: number; resultAmount?: number; action?: string }
export interface TriggerExceptionRequest { bookingId: string; scheduleId: string; type: ExceptionType }
export interface TimelineEvent { time: string; status: ScheduleStatus; description: string }