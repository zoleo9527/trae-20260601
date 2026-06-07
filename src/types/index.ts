export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';

export type PackageOrderStatus = 'created' | 'processing' | 'completed' | 'cancelled';

export type DecorationStatus = 'pending' | 'in_progress' | 'completed' | 'restored';

export type AnomalyType = 'room_conflict' | 'drink_gift_issue' | 'member_balance_issue' | 'other';

export type AnomalySeverity = 'high' | 'medium' | 'low';

export type AnomalyStatus = 'open' | 'handling' | 'resolved' | 'ignored';

export type TransactionType = 'recharge' | 'consume' | 'refund';

export type UserRole = 'front_desk' | 'manager';

export interface DrinkGift {
  name: string;
  quantity: number;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  drinkGifts: DrinkGift[];
  active: boolean;
}

export interface Booking {
  id: string;
  roomNumber: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  memberId?: string;
  packageOrderId?: string;
  decorationTaskId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageOrder {
  id: string;
  bookingId: string;
  packageId: string;
  status: PackageOrderStatus;
  actualPrice: number;
  drinkGifts: DrinkGift[];
  operator?: string;
  createdAt: string;
}

export interface DecorationTask {
  id: string;
  bookingId: string;
  theme: string;
  status: DecorationStatus;
  operator?: string;
  photos: string[];
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  balance: number;
  totalSpent: number;
  level: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  relatedBookingId?: string;
  operator?: string;
  note?: string;
  createdAt: string;
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  description: string;
  relatedBookingId?: string;
  relatedEntityId?: string;
  handledBy?: string;
  handlingNote?: string;
  createdAt: string;
  handledAt?: string;
}

export interface OperationLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'status_change';
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  operator?: string;
  note?: string;
  createdAt: string;
}

export interface AuthState {
  currentUser: string;
  role: UserRole;
}

export interface Room {
  number: string;
  name: string;
  capacity: number;
  type: string;
}
