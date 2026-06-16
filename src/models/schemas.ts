import { z } from 'zod';
import { 
  StaffRole, 
  ReservationStatus, 
  MinimumConsumptionStatus,
  Priority
} from './types.js';

export const StaffSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: StaffRole,
  phone: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Staff = z.infer<typeof StaffSchema>;

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  tableNumber: z.string().min(1),
  reservationDate: z.date(),
  reservationTime: z.string(),
  partySize: z.number().int().positive(),
  status: ReservationStatus,
  minimumConsumptionAmount: z.number().positive().optional(),
  minimumConsumptionStatus: MinimumConsumptionStatus.optional(),
  reservationStaffId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),  // 内部备注，可传递给低消确认
  priority: Priority.default('medium'),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Reservation = z.infer<typeof ReservationSchema>;

export const BeverageStorageSchema = z.object({
  id: z.string().uuid(),
  reservationId: z.string().uuid(),
  beverageName: z.string().min(1),
  quantity: z.number().positive(),
  storageDate: z.date(),
  retrieveDate: z.date().optional(),
  status: z.enum(['stored', 'retrieved', 'expired', 'unclear']).default('stored'),
  notes: z.string().optional(),
  barStaffId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type BeverageStorage = z.infer<typeof BeverageStorageSchema>;

export const SingerScheduleSchema = z.object({
  id: z.string().uuid(),
  singerName: z.string().min(1),
  performanceDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['scheduled', 'confirmed', 'rescheduled', 'cancelled']).default('scheduled'),
  originalDate: z.date().optional(),  // 改期前日期
  notes: z.string().optional(),
  managerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type SingerSchedule = z.infer<typeof SingerScheduleSchema>;

export const StatusHistorySchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum(['reservation', 'minimum_consumption', 'beverage_storage', 'singer_schedule']),
  entityId: z.string().uuid(),
  previousStatus: z.string().optional(),
  newStatus: z.string(),
  changedBy: z.string().uuid(),
  changedByRole: StaffRole,
  changeReason: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.date()
});
export type StatusHistory = z.infer<typeof StatusHistorySchema>;

export const TodoItemSchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum(['reservation', 'minimum_consumption', 'beverage_storage', 'singer_schedule']),
  entityId: z.string().uuid(),
  assigneeRole: StaffRole,
  assigneeId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: Priority.default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type TodoItem = z.infer<typeof TodoItemSchema>;

export const IssueDetectionSchema = z.object({
  id: z.string().uuid(),
  reservationId: z.string().uuid(),
  issueType: z.enum([
    'duplicate_reservation',
    'beverage_unclear',
    'schedule_conflict',
    'minimum_consumption_pending',
    'notes_incomplete'
  ]),
  severity: z.enum(['warning', 'error', 'critical']).default('warning'),
  description: z.string(),
  relatedEntityId: z.string().uuid().optional(),
  resolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().uuid().optional(),
  createdAt: z.date()
});
export type IssueDetection = z.infer<typeof IssueDetectionSchema>;
