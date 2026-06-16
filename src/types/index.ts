export interface User {
  id: string;
  username: string;
  role: 'manager' | 'chef' | 'cashier' | 'admin';
  name: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  position: string;
}

export interface Queue {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  status: 'waiting' | 'seated' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  submittedByName: string;
  assignedTableId?: string;
  assignedTableName?: string;
}

export interface Assignment {
  id: string;
  queueId: string;
  tableId: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  details: string;
}

export interface QueueTimelineEvent {
  id: string;
  type: 'create' | 'assign' | 'seat' | 'complete' | 'cancel';
  title: string;
  description: string;
  operatorName: string;
  timestamp: string;
}

export type Role = User['role'];
export type QueueStatus = Queue['status'];
export type TableStatus = Table['status'];
