export type Role = 'reception' | 'handler' | 'manager';

export type OrderStatus = 
  | 'pending'      
  | 'consuming'    
  | 'completed'    
  | 'abnormal'     
  | 'refunding'    
  | 'refunded'     
  | 'refund_rejected' 
  | 'rejected';    

export type AbnormalType = 
  | 'room_conflict'     
  | 'drink_dispute'     
  | 'member_mismatch'   
  | 'overcharge'        
  | 'other';

export type RefundStatus = 
  | 'pending'    
  | 'approved'   
  | 'rejected';

export interface Member {
  id: string;
  name: string;
  phone: string;
  level: '普通' | '银卡' | '金卡' | '钻石';
  balance: number;
  totalRecharge: number;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  type: '小包' | '中包' | '大包' | '豪华包';
  pricePerHour: number;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface DrinkItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem {
  drinkId: string;
  drinkName: string;
  quantity: number;
  price: number;
  isComplimentary: boolean;
}

export interface AbnormalRecord {
  id: string;
  orderId: string;
  type: AbnormalType;
  description: string;
  reportedBy: string;
  reportedAt: string;
  handlerNote?: string;
  handledAt?: string;
  handledBy?: string;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  applicant: string;
  appliedAt: string;
  status: RefundStatus;
  managerNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  returnToHandler?: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  roomId: string;
  roomName: string;
  roomType: string;
  checkInTime: string;
  checkOutTime?: string;
  durationHours: number;
  roomFee: number;
  items: OrderItem[];
  drinksFee: number;
  complimentaryFee: number;
  totalAmount: number;
  useBalance: number;
  payAmount: number;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
  abnormalRecord?: AbnormalRecord;
  refundRecord?: RefundRecord;
  handlerNote?: string;
  handledBy?: string;
  handledAt?: string;
}

export interface StoreState {
  currentRole: Role;
  currentUser: string;
  members: Member[];
  rooms: Room[];
  drinks: DrinkItem[];
  orders: Order[];
}

export interface StoreActions {
  setRole: (role: Role) => void;
  createOrder: (order: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'status'>) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  completeConsume: (orderId: string, data: {
    checkOutTime: string;
    items: OrderItem[];
    drinksFee: number;
    complimentaryFee: number;
    totalAmount: number;
    useBalance: number;
    payAmount: number;
  }) => void;
  reportAbnormal: (orderId: string, abnormal: Omit<AbnormalRecord, 'id' | 'orderId' | 'reportedAt' | 'reportedBy'>) => void;
  handleAbnormal: (orderId: string, data: {
    handlerNote: string;
    needRefund: boolean;
    refundAmount?: number;
    refundReason?: string;
  }) => void;
  applyRefund: (orderId: string, data: {
    amount: number;
    reason: string;
  }) => void;
  reviewRefund: (refundId: string, data: {
    approved: boolean;
    managerNote: string;
    returnToHandler?: boolean;
  }) => void;
  resubmitRefund: (orderId: string, data: {
    amount: number;
    reason: string;
    handlerNote: string;
  }) => void;
  addMemberBalance: (memberId: string, amount: number) => void;
}
