export enum UserRole {
  SALES_GUIDE = 'SALES_GUIDE',
  MEASURER = 'MEASURER',
  INSTALLER = 'INSTALLER',
  STORE_MANAGER = 'STORE_MANAGER',
}

export enum OrderStatus {
  CREATED = 'CREATED',
  MEASURED = 'MEASURED',
  APPOINTMENT_PENDING = 'APPOINTMENT_PENDING',
  APPOINTED = 'APPOINTED',
  INSTALLATION_SCHEDULED = 'INSTALLATION_SCHEDULED',
  INSTALLING = 'INSTALLING',
  REMINDED = 'REMINDED',
  RETURNED = 'RETURNED',
  MATERIALS_NEEDED = 'MATERIALS_NEEDED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ReturnReason {
  WRONG_SIZE = 'WRONG_SIZE',
  MATERIAL_DEFECT = 'MATERIAL_DEFECT',
  WRONG_COLOR = 'WRONG_COLOR',
  STYLE_MISMATCH = 'STYLE_MISMATCH',
  MISSING_ACCESSORIES = 'MISSING_ACCESSORIES',
  CUSTOMER_UNSATISFIED = 'CUSTOMER_UNSATISFIED',
  OTHER = 'OTHER',
}

export enum AuditAction {
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_MEASURE = 'ORDER_MEASURE',
  APPOINTMENT_CREATE = 'APPOINTMENT_CREATE',
  APPOINTMENT_UPDATE = 'APPOINTMENT_UPDATE',
  APPOINTMENT_CANCEL = 'APPOINTMENT_CANCEL',
  SCHEDULE_ASSIGN = 'SCHEDULE_ASSIGN',
  SCHEDULE_REASSIGN = 'SCHEDULE_REASSIGN',
  INSTALLATION_START = 'INSTALLATION_START',
  INSTALLATION_REMIND = 'INSTALLATION_REMIND',
  INSTALLATION_RETURN = 'INSTALLATION_RETURN',
  RETURN_HANDLE = 'RETURN_HANDLE',
  MATERIALS_SUPPLEMENT = 'MATERIALS_SUPPLEMENT',
  MATERIALS_FULFILL = 'MATERIALS_FULFILL',
  MATERIALS_RECEIVED = 'MATERIALS_RECEIVED',
  INSTALLATION_COMPLETE = 'INSTALLATION_COMPLETE',
  ORDER_ARCHIVE = 'ORDER_ARCHIVE',
  REMARK_ADD = 'REMARK_ADD',
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  storeId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface MeasureRecord {
  id: string;
  orderId: string;
  measurerId: string;
  measuredAt: string;
  windows: Array<{
    position: string;
    widthCm: number;
    heightCm: number;
    curtainStyle: string;
    remarks?: string;
  }>;
  notes?: string;
  images?: string[];
}

export interface AppointmentRecord {
  id: string;
  orderId: string;
  createdBy: string;
  preferredDate: string;
  preferredTimeSlot: string;
  backupDate?: string;
  backupTimeSlot?: string;
  customerConfirmedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRecord {
  id: string;
  orderId: string;
  installerId: string;
  assignedBy: string;
  scheduledDate: string;
  timeSlot: string;
  estimatedDurationHours: number;
  actualStartTime?: string;
  actualEndTime?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
  travelNotes?: string;
  toolChecklist?: string[];
  assignedAt: string;
  updatedAt: string;
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  returnedBy: string;
  reason: ReturnReason;
  detailedReason: string;
  images?: string[];
  handledBy?: string;
  handlingNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface SupplementRecord {
  id: string;
  orderId: string;
  requestedBy: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    description?: string;
  }>;
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  notes?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface RemarkRecord {
  id: string;
  orderId: string;
  createdBy: string;
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface AuditLog {
  id: string;
  orderId: string;
  action: AuditAction;
  operatorId: string;
  operatorRole: UserRole;
  operatorName: string;
  payload: Record<string, unknown>;
  ip?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNo: string;
  storeId: string;
  customerId: string;
  customerSnapshot: Customer;
  salesGuideId: string;
  status: OrderStatus;
  productItems: Array<{
    name: string;
    specification: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  measureRecord?: MeasureRecord;
  appointment?: AppointmentRecord;
  schedule?: ScheduleRecord;
  returnRecord?: ReturnRecord;
  supplementRecords: SupplementRecord[];
  remarkRecords: RemarkRecord[];
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface TodoItem {
  id: string;
  orderId: string;
  orderNo: string;
  customerName: string;
  type: 'MEASURE_PENDING' | 'APPOINTMENT_PENDING' | 'SCHEDULE_PENDING' | 'INSTALLATION_PENDING' | 'RETURN_PENDING' | 'SUPPLEMENT_PENDING' | 'REMIND_PENDING' | 'ARCHIVE_PENDING';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: OrderStatus;
  dueAt?: string;
  createdAt: string;
  responsibility: ResponsibilityInfo;
}

export interface ResponsibilityInfo {
  stage: 'MEASURE' | 'APPOINTMENT' | 'SCHEDULE' | 'INSTALLATION' | 'RETURN' | 'MATERIALS' | 'COMPLETED' | 'ARCHIVED';
  currentRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  previousNode: string;
  nextAction: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const TIME_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '14:00-16:00',
  '16:00-18:00',
  '19:00-21:00',
] as const;

export type TimeSlot = typeof TIME_SLOTS[number];
