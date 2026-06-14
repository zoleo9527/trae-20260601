export type UserRole = 'counter' | 'warehouse' | 'finance';

export type RecordStatus = 
  | 'pending' 
  | 'reviewing' 
  | 'approved' 
  | 'rejected' 
  | 'closed' 
  | 'recheck';

export interface RecordItem {
  id: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  weight: number;
  photos: string[];
  estimatedValue: number | null;
  status: RecordStatus;
  rejectReason: string | null;
  remark: string;
  operatorId: string;
  operatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  recordId: string;
  statusFrom: RecordStatus | null;
  statusTo: RecordStatus;
  operatorId: string;
  operatorName: string;
  remark: string;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  recordId: string;
  content: string;
  operatorId: string;
  operatorName: string;
  createdAt: string;
}

export interface RecordDetail extends RecordItem {
  history: HistoryItem[];
  notes: NoteItem[];
}

export interface RoleConfig {
  role: UserRole;
  name: string;
  permissions: {
    view: RecordStatus[];
    edit: RecordStatus[];
    actions: ('review' | 'approve' | 'reject' | 'close' | 'recheck' | 'create' | 'update')[];
  };
}

export interface FilterParams {
  status?: RecordStatus;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  counter: {
    role: 'counter',
    name: '柜台评估师',
    permissions: {
      view: ['pending', 'rejected'],
      edit: ['pending', 'rejected'],
      actions: ['create', 'update'],
    },
  },
  warehouse: {
    role: 'warehouse',
    name: '库管',
    permissions: {
      view: ['pending', 'reviewing'],
      edit: ['pending', 'reviewing'],
      actions: ['review', 'approve', 'reject'],
    },
  },
  finance: {
    role: 'finance',
    name: '财务',
    permissions: {
      view: ['approved', 'recheck', 'closed'],
      edit: ['approved', 'recheck'],
      actions: ['close', 'recheck'],
    },
  },
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待审核',
  reviewing: '处理中',
  approved: '已审核',
  rejected: '已退回',
  closed: '已关闭',
  recheck: '需要回查',
};

export const STATUS_COLORS: Record<RecordStatus, string> = {
  pending: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-emerald-100 text-emerald-700',
  recheck: 'bg-purple-100 text-purple-700',
};

export const CATEGORIES = [
  '黄金饰品',
  '名表',
  '电子产品',
  '玉器',
  '奢侈品包',
  '珠宝首饰',
  '古董字画',
  '其他',
];

export const CONDITIONS = [
  '全新',
  '95新',
  '9成新',
  '85新',
  '8成新',
  '7成新',
  '6成新及以下',
];

export const REJECT_REASONS = [
  '缺少配件',
  '信息不全',
  '成色不符',
  '真伪存疑',
  '价格争议',
  '其他原因',
];
