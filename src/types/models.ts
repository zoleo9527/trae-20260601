export type Role = 'RECEPTIONIST' | 'PROCESSOR' | 'MANAGER';

export type RecyclingOrderStatus =
  | 'DRAFT'
  | 'PENDING_VALUATION'
  | 'VALUATED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'OBJECTED'
  | 'RE_VALUATED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type ValuationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export type ConfirmationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'OBJECTED'
  | 'EXPIRED';

export type DeviceCategory = 'PHONE' | 'TABLET' | 'LAPTOP' | 'CAMERA' | 'GAME_CONSOLE' | 'OTHER';

export type DeviceCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'BROKEN';

export interface Device {
  id: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  serialNumber: string;
  condition: DeviceCondition;
  purchaseDate?: string;
  originalPrice?: number;
  defects: string[];
  accessories: string[];
  imei?: string;
  storage?: string;
  color?: string;
}

export interface ValuationRemark {
  id: string;
  content: string;
  authorRole: Role;
  authorId: string;
  authorName: string;
  timestamp: string;
  isVisibleToCustomer: boolean;
  isCritical: boolean;
}

export interface Valuation {
  id: string;
  orderId: string;
  processorId: string;
  processorName: string;
  status: ValuationStatus;
  estimatedPrice: number;
  minPrice: number;
  maxPrice: number;
  inspectionItems: {
    screen: string;
    battery: string;
    appearance: string;
    function: string;
    waterproof: string;
    idLocked: boolean;
    networkLocked: boolean;
  };
  remarks: ValuationRemark[];
  photos: string[];
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  version: number;
  parentValuationId?: string;
}

export interface CustomerConfirmation {
  id: string;
  orderId: string;
  valuationId: string;
  status: ConfirmationStatus;
  customerName: string;
  customerPhone: string;
  customerIdCard?: string;
  confirmedPrice?: number;
  objectionContent?: string;
  objectionPhotos?: string[];
  confirmedAt?: string;
  expiredAt?: string;
  createdAt: string;
  signature?: string;
  confirmationMethod: 'ONLINE' | 'ON_SITE' | 'PHONE';
  seenValuationRemarks: string[];
}

export interface RecyclingOrder {
  id: string;
  orderNo: string;
  status: RecyclingOrderStatus;
  receptionistId: string;
  receptionistName: string;
  customerName: string;
  customerPhone: string;
  customerIdCard?: string;
  device: Device;
  currentValuationId?: string;
  valuations: Valuation[];
  confirmations: CustomerConfirmation[];
  source: 'WALK_IN' | 'ONLINE' | 'REFERRAL';
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  finalPrice?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  tags: string[];
}

export interface AuditLog {
  id: string;
  orderId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  field?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  idempotencyKey: string;
}

export interface IdempotentRecord {
  key: string;
  orderId?: string;
  action: string;
  timestamp: string;
  response: any;
}
