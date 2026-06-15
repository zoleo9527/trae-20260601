export type OrderStatus =
  | 'pending_assign'
  | 'pending_work'
  | 'working'
  | 'pending_charge'
  | 'pending_receipt'
  | 'pending_return'
  | 'pending_review'
  | 'completed';

export type UserRole = '客服' | '工程师' | '配件管理员';

export type ChargeMethod = '现金' | '微信' | '支付宝' | '转账';

export interface Customer {
  name: string;
  phone: string;
  address: string;
}

export interface Appliance {
  type: string;
  brand: string;
  model: string;
  fault: string;
}

export interface PartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  used: boolean;
}

export interface ChargeInfo {
  amount: number;
  method: ChargeMethod;
  paidAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export interface ReceiptInfo {
  images: string[];
  uploadedAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export interface PartReturnInfo {
  hasReturn: boolean;
  reason: string;
  status: 'pending' | 'submitted' | 'confirmed';
  submittedBy: string | null;
  submittedAt: string | null;
  returnedAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export interface Note {
  id: string;
  role: UserRole;
  author: string;
  content: string;
  createdAt: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: Customer;
  appliance: Appliance;
  assignedTo: string;
  parts: PartItem[];
  charge: ChargeInfo;
  receipt: ReceiptInfo;
  partReturn: PartReturnInfo;
  notes: Note[];
  closedAt: string | null;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_assign: '待派单',
  pending_work: '待施工',
  working: '施工中',
  pending_charge: '待收费',
  pending_receipt: '待回单',
  pending_return: '待配件退回',
  pending_review: '待审核',
  completed: '已完成',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending_assign: 'bg-amber-100 text-amber-800 border-amber-200',
  pending_work: 'bg-blue-100 text-blue-800 border-blue-200',
  working: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  pending_charge: 'bg-orange-100 text-orange-800 border-orange-200',
  pending_receipt: 'bg-purple-100 text-purple-800 border-purple-200',
  pending_return: 'bg-pink-100 text-pink-800 border-pink-200',
  pending_review: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};
