export type Role = '前厅经理' | '后厨主管' | '收银' | '管理员';

export type SoupBaseStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export type SoldOutStatus = 'active' | 'resolved';

export type OrderStatus = 'pending' | 'confirmed' | 'served' | 'completed' | 'cancelled';

export type AuditAction = 'create' | 'update' | 'delete' | 'resolve' | 'confirm';

export interface User {
  id: string;
  name: string;
  role: Role;
  phone: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SoupBase {
  id: string;
  name: string;
  type: 'spicy' | 'mild' | 'tomato' | 'bone';
  stock: number;
  minStock: number;
  unit: string;
  status: SoupBaseStatus;
  responsiblePerson: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  lastPreparedAt?: string;
  prepareCount: number;
  refundReason?: string;
  supplementNotes?: string;
}

export interface SoldOut {
  id: string;
  itemName: string;
  category: 'soupBase' | 'dish' | 'drink';
  reason: string;
  status: SoldOutStatus;
  reportedBy: string;
  resolvedBy?: string;
  reportedAt: string;
  resolvedAt?: string;
  history: SoldOutHistory[];
  notes: string;
  refundReason?: string;
  supplementNotes?: string;
  relatedSoupBaseId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SoldOutHistory {
  id?: string;
  soldOutId?: string;
  action: 'reported' | 'confirmed' | 'resolved' | 'updated';
  actor: string;
  timestamp: string;
  description: string;
}

export interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  phone?: string;
  soupBaseId: string;
  soupBaseName: string;
  soupBaseType: SoupBase['type'];
  dishes: OrderDish[];
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  isGroupBuy: boolean;
  groupBuyCode?: string;
  groupBuyVerified: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  servedAt?: string;
  completedAt?: string;
  notes: string;
  refundReason?: string;
  supplementNotes?: string;
}

export interface OrderDish {
  name: string;
  quantity: number;
  price?: number;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  targetType: 'soupBase' | 'soldOut' | 'order' | 'user';
  targetId: string;
  targetName: string;
  actor: string;
  actorRole: Role;
  timestamp: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  type: 'soupBase' | 'soldOut' | 'order';
  targetId: string;
  targetName: string;
  assignee: string;
  assigneeRole: Role;
  priority: 'high' | 'medium' | 'low';
  createdAt?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'warning' | 'info' | 'success' | 'error';
  targetType: 'soupBase' | 'soldOut' | 'order';
  targetId: string;
  read: boolean;
  createdAt: string;
}
