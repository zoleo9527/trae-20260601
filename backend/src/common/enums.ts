export enum AppointmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPPLEMENTED = 'supplemented',
  ASSIGNED = 'assigned',
  CHECKED_IN = 'checked_in',
  LOADING = 'loading',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UserRole {
  DISPATCHER = 'dispatcher',
  FORKMAN = 'forkman',
  CLERK = 'clerk',
}

export enum DockStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

export enum LogAction {
  CREATE = 'create',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUPPLEMENT = 'supplement',
  ASSIGN_DOCK = 'assign_dock',
  REASSIGN_DOCK = 'reassign_dock',
  CHECK_IN = 'check_in',
  START_LOADING = 'start_loading',
  COMPLETE = 'complete',
  CANCEL = 'cancel',
  NOTE = 'note',
}
