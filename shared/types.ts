export interface Landlord {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  landlordId: string;
  type: 'apartment' | 'house' | 'villa';
  bedrooms: number;
  image: string;
}

export interface Order {
  id: string;
  propertyId: string;
  platform: 'airbnb' | 'tujia' | 'xiaozhu';
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  platformFee: number;
  refundAmount: number;
  status: 'completed' | 'cancelled';
}

export interface Expense {
  id: string;
  propertyId: string;
  type: 'cleaning' | 'utility' | 'supplies' | 'other';
  amount: number;
  date: string;
  description: string;
  createdBy: string;
}

export interface Repair {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  cost: number;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: string;
}

export interface Advance {
  id: string;
  propertyId: string;
  repairId?: string;
  amount: number;
  date: string;
  reason: string;
  createdBy: string;
}

export interface Bill {
  id: string;
  propertyId: string;
  landlordId: string;
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  totalRepairs: number;
  totalAdvances: number;
  platformFees: number;
  refundAmount: number;
  netAmount: number;
  status: 'draft' | 'generated' | 'sent' | 'confirmed' | 'disputed' | 'settled';
  createdAt: string;
}

export interface DisputeMessage {
  id: string;
  sender: 'landlord' | 'operator';
  content: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  billId: string;
  landlordId: string;
  type: 'income' | 'expense' | 'repair' | 'other';
  itemId?: string;
  title: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  messages: DisputeMessage[];
}

export type PlatformType = Order['platform'];
export type ExpenseType = Expense['type'];
export type BillStatus = Bill['status'];
export type DisputeStatus = Dispute['status'];
export type DisputeType = Dispute['type'];
export type RepairStatus = Repair['status'];
