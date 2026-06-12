export type UserRole = 'project_manager' | 'reviewer' | 'finance' | 'admin';

export type BidStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'deposit_paid' 
  | 'deposit_refunded' 
  | 'dispute' 
  | 'completed' 
  | 'cancelled';

export type CollectionStatus = 
  | 'pending' 
  | 'first_reminder' 
  | 'second_reminder' 
  | 'legal_notice' 
  | 'paid' 
  | 'overdue';

export interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  location: string;
  appraisedValue: number;
  startingPrice: number;
  reservePrice: number;
  status: 'auctioning' | 'completed' | 'cancelled';
  auctionDate: string;
  createdAt: string;
}

export interface Bidder {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  company?: string;
  qualificationStatus: 'verified' | 'pending' | 'rejected';
  createdAt: string;
}

export interface DepositRecord {
  id: string;
  bidId: string;
  amount: number;
  paidAt?: string;
  refundedAt?: string;
  status: 'pending' | 'paid' | 'refunded' | 'refunding';
  paymentMethod?: string;
  transactionNo?: string;
  notes: string;
}

export interface Confirmation {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  bidderId: string;
  bidderName: string;
  bidAmount: number;
  depositAmount: number;
  balanceAmount: number;
  status: BidStatus;
  confirmedAt?: string;
  signedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  dataCompleteness: {
    subjectData: boolean;
    bidderQualification: boolean;
    contractSigned: boolean;
    otherDocuments: boolean;
  };
}

export interface CollectionRecord {
  id: string;
  confirmationId: string;
  subjectCode: string;
  subjectName: string;
  bidderName: string;
  bidderPhone: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: CollectionStatus;
  dueDate: string;
  lastRemindAt?: string;
  nextRemindAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  reminders: Reminder[];
}

export interface Reminder {
  id: string;
  type: 'call' | 'sms' | 'email' | 'letter';
  content: string;
  sentAt: string;
  operator: string;
  result?: 'success' | 'failed' | 'pending';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
}

export interface ActionLog {
  id: string;
  type: string;
  targetId: string;
  targetType: 'confirmation' | 'collection';
  operator: string;
  content: string;
  createdAt: string;
}