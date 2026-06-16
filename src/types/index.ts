export interface Order {
  id: string;
  customerName: string;
  productType: 'suit' | 'wedding-dress' | 'custom';
  status: 'pending' | 'fitting' | 'adjusting' | 'completed';
  createdAt: string;
  expectedDelivery: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Measurement {
  id: string;
  orderId: string;
  shoulderWidth: number;
  chest: number;
  waist: number;
  hip: number;
  sleeveLength: number;
  pantsLength: number;
  note: string;
}

export interface FittingRecord {
  id: string;
  orderId: string;
  fittingDate: string;
  issues: string;
  imageUrl?: string;
  measurerName: string;
  result?: 'passed' | 'needs-adjustment';
}

export interface Adjustment {
  id: string;
  orderId: string;
  type: 'free' | 'paid' | 'size-change';
  description: string;
  cost: number;
  responsible: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  adjustedBy?: string;
  adjustedAt?: string;
}

export type StatusType = 'all' | Order['status'];
export type ProductType = 'all' | Order['productType'];
