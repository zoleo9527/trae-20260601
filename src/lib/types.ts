export type UserRole = 'booking_clerk' | 'floor_manager' | 'bar_staff' | 'admin';

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'arrived'
  | 'in_use'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'supplement_required';

export type RoomStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';

export type RoomType = 'mini' | 'small' | 'medium' | 'large' | 'vip' | 'luxury';

export type DrinkOrderStatus = 'pending' | 'preparing' | 'delivered' | 'cancelled';

export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';

export type RejectionType = 'booking_rejection' | 'checkin_rejection' | 'drink_issue' | 'member_issue' | 'room_issue';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Room {
  id: string;
  roomNo: string;
  type: RoomType;
  capacity: number;
  status: RoomStatus;
  hourlyRate: number;
  features: string[];
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  level: MemberLevel;
  balance: number;
  totalRecharge: number;
  points: number;
  createdAt: Date;
  lastVisitAt?: Date;
}

export interface DrinkItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
}

export interface DrinkOrderItem {
  drinkId: string;
  drinkName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface DrinkOrder {
  id: string;
  bookingId: string;
  items: DrinkOrderItem[];
  totalAmount: number;
  status: DrinkOrderStatus;
  createdBy: string;
  createdAt: Date;
  deliveredAt?: Date;
  notes?: string;
}

export interface RechargeRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  bonus: number;
  paymentMethod: string;
  createdBy: string;
  createdAt: Date;
  bookingId?: string;
}

export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdByRole: UserRole;
  createdAt: Date;
  type: 'booking' | 'checkin' | 'drink' | 'member' | 'rejection' | 'supplement' | 'general' | 'issue';
  relatedTo?: string;
}

export interface IssueRecord {
  id: string;
  type: RejectionType;
  reason: string;
  supplementaryNotes: string;
  createdBy: string;
  createdByRole: UserRole;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  status: 'open' | 'resolved';
  relatedBookingId?: string;
  relatedDrinkOrderId?: string;
}

export interface Booking {
  id: string;
  bookingNo: string;
  customerName: string;
  customerPhone: string;
  memberId?: string;
  memberName?: string;
  memberLevel?: MemberLevel;
  
  roomId: string;
  roomNo: string;
  roomType: RoomType;
  
  bookedStartTime: Date;
  bookedEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  
  status: BookingStatus;
  rejectionReason?: string;
  supplementRequired?: string;
  
  numberOfPeople: number;
  deposit: number;
  hourlyRate: number;
  roomAmount: number;
  
  drinkOrders: DrinkOrder[];
  totalDrinkAmount: number;
  
  totalAmount: number;
  paidAmount: number;
  useMemberBalance: number;
  
  notes: Note[];
  issues: IssueRecord[];
  
  createdBy: string;
  createdAt: Date;
  confirmedBy?: string;
  confirmedAt?: Date;
  checkedInBy?: string;
  checkedInAt?: Date;
  completedBy?: string;
  completedAt?: Date;
  updatedAt: Date;
  
  lastSupplementSummary?: string;
}

export interface TodoItem {
  id: string;
  type: 'booking' | 'checkin' | 'drink' | 'recharge' | 'issue' | 'supplement' | 'review';
  title: string;
  description: string;
  bookingId: string;
  priority: 'high' | 'medium' | 'low';
  role: UserRole;
  createdAt: Date;
  issueType?: RejectionType;
}
