export const Role = {
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
  ENGINEER: 'ENGINEER',
  PARTS_ADMIN: 'PARTS_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RepairStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  ASSIGNED: 'ASSIGNED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  ENGINEER_DISPATCHED: 'ENGINEER_DISPATCHED',
  DIAGNOSIS_DONE: 'DIAGNOSIS_DONE',
  PARTS_REQUESTED: 'PARTS_REQUESTED',
  PARTS_DELIVERED: 'PARTS_DELIVERED',
  REPAIR_IN_PROGRESS: 'REPAIR_IN_PROGRESS',
  REPAIR_COMPLETED: 'REPAIR_COMPLETED',
  CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
export type RepairStatus = (typeof RepairStatus)[keyof typeof RepairStatus];

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  RESCHEDULED: 'RESCHEDULED',
  CANCELLED: 'CANCELLED',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const PartRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELIVERED: 'DELIVERED',
} as const;
export type PartRequestStatus = (typeof PartRequestStatus)[keyof typeof PartRequestStatus];
