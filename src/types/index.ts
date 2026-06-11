export type Role = 'counterManager' | 'floorSupervisor' | 'brandSupervisor';

export type PromotionStatus = 
  | 'draft' 
  | 'pendingSupervisor' 
  | 'pendingBrand' 
  | 'active' 
  | 'salesPending' 
  | 'completed' 
  | 'rejected';

export type StepAction = 'submit' | 'approve' | 'reject' | 'complete' | 'create';

export interface ProcessStep {
  id: string;
  promotionId: string;
  role: Role;
  action: StepAction;
  operator: string;
  comment: string;
  createdAt: string;
}

export interface Remark {
  id: string;
  promotionId: string;
  stepId?: string;
  role: Role;
  operator: string;
  content: string;
  attachments: string[];
  createdAt: string;
}

export interface SalesData {
  id: string;
  promotionId: string;
  actualSales: number;
  targetSales: number;
  customerCount: number;
  operator: string;
  comment: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  counter: string;
  brand: string;
  type: string;
  startDate: string;
  endDate: string;
  budget: number;
  description: string;
  status: PromotionStatus;
  currentRole: Role;
  createdAt: string;
  updatedAt: string;
  steps: ProcessStep[];
  remarks: Remark[];
  salesData?: SalesData;
}

export interface RecentItem {
  id: string;
  promotionId: string;
  title: string;
  openedAt: string;
}

export interface AppState {
  currentRole: Role;
  promotions: Promotion[];
  recentItems: RecentItem[];
}

export const ROLE_LABELS: Record<Role, string> = {
  counterManager: '柜长',
  floorSupervisor: '楼层主管',
  brandSupervisor: '品牌督导',
};

export const STATUS_LABELS: Record<PromotionStatus, string> = {
  draft: '草稿',
  pendingSupervisor: '待主管审核',
  pendingBrand: '待督导确认',
  active: '活动进行中',
  salesPending: '待销售核对',
  completed: '已完成',
  rejected: '已驳回',
};

export const STATUS_COLORS: Record<PromotionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  pendingSupervisor: 'bg-amber-50 text-amber-700 border-amber-200',
  pendingBrand: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  salesPending: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-navy-50 text-navy-700 border-navy-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export const PROMOTION_TYPES = [
  '满减活动',
  '折扣促销',
  '买赠活动',
  '会员专享',
  '新品推广',
  '节日特惠',
  '清仓甩卖',
  '其他',
];

export const COUNTERS = [
  '1F 化妆品区',
  '1F 珠宝首饰',
  '2F 女士服装',
  '2F 鞋履箱包',
  '3F 男士服装',
  '3F 运动休闲',
  '4F 儿童用品',
  '4F 家居生活',
  '5F 餐饮美食',
];

export const BRANDS = [
  '雅诗兰黛',
  '兰蔻',
  '迪奥',
  '香奈儿',
  '耐克',
  '阿迪达斯',
  '优衣库',
  'ZARA',
  'HM',
  '周大福',
  '六福珠宝',
  '老凤祥',
];
