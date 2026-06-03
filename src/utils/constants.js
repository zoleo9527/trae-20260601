export const CELL_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  DELIVERED: 'delivered',
  MALFUNCTION: 'malfunction',
  MAINTENANCE: 'maintenance',
};

export const ORDER_STATUS = {
  CREATED: 'created',
  CELL_ASSIGNED: 'cell_assigned',
  DELIVERED: 'delivered',
  PICKED_UP: 'picked_up',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
};

export const CABINET_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
};

export const REMOTE_OPEN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTED: 'executed',
  FAILED: 'failed',
};

export const EXCEPTION_TYPE = {
  DOOR_STUCK: 'door_stuck',
  PICKUP_CODE_INVALID: 'pickup_code_invalid',
  CELL_OCCUPIED_ERROR: 'cell_occupied_error',
  TIMEOUT_UNPICKED: 'timeout_unpicked',
  CABINET_OFFLINE: 'cabinet_offline',
  OTHER: 'other',
};

export const PICKUP_CODE_STATUS = {
  ACTIVE: 'active',
  USED: 'used',
  EXPIRED: 'expired',
};

export const TIMEOUT_REMINDER_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  ACKNOWLEDGED: 'acknowledged',
};

export const PICKUP_TIMEOUT_HOURS = 24;
export const PICKUP_CODE_LENGTH = 6;
