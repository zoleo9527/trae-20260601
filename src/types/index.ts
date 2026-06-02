export type ProductStatus =
  | 'PENDING_RECEIVE'
  | 'RECEIVED'
  | 'MISSING_DOCS'
  | 'PENDING_APPRAISAL'
  | 'APPRAISING'
  | 'APPRAISAL_DISPUTE'
  | 'APPRAISAL_FAILED'
  | 'APPRAISAL_PASSED'
  | 'CUSTOMER_WITHDRAW'
  | 'PENDING_LISTING'
  | 'LISTED'
  | 'PRICE_CHANGING'
  | 'SOLD'
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'RETURNED';

export const STATUS_LABELS: Record<ProductStatus, string> = {
  PENDING_RECEIVE: '待收货',
  RECEIVED: '已收货',
  MISSING_DOCS: '资料缺失',
  PENDING_APPRAISAL: '待鉴定',
  APPRAISING: '鉴定中',
  APPRAISAL_DISPUTE: '鉴定争议',
  APPRAISAL_FAILED: '鉴定未通过',
  APPRAISAL_PASSED: '鉴定通过',
  CUSTOMER_WITHDRAW: '客户撤回',
  PENDING_LISTING: '待上架',
  LISTED: '已上架',
  PRICE_CHANGING: '改价审批中',
  SOLD: '已成交',
  PENDING_SETTLEMENT: '待结算',
  SETTLED: '已结算',
  RETURNED: '已退回',
};

export const STATUS_COLORS: Record<ProductStatus, string> = {
  PENDING_RECEIVE: 'bg-charcoal-500 text-white',
  RECEIVED: 'bg-luxury-600 text-white',
  MISSING_DOCS: 'bg-coral-500 text-white',
  PENDING_APPRAISAL: 'bg-champagne-500 text-luxury-800',
  APPRAISING: 'bg-champagne-400 text-luxury-800',
  APPRAISAL_DISPUTE: 'bg-coral-600 text-white',
  APPRAISAL_FAILED: 'bg-charcoal-700 text-white',
  APPRAISAL_PASSED: 'bg-jade-500 text-white',
  CUSTOMER_WITHDRAW: 'bg-coral-500 text-white',
  PENDING_LISTING: 'bg-champagne-500 text-luxury-800',
  LISTED: 'bg-jade-600 text-white',
  PRICE_CHANGING: 'bg-champagne-600 text-white',
  SOLD: 'bg-jade-500 text-white',
  PENDING_SETTLEMENT: 'bg-champagne-500 text-luxury-800',
  SETTLED: 'bg-luxury-800 text-white',
  RETURNED: 'bg-charcoal-600 text-white',
};

export interface Customer {
  id: string;
  name: string;
  phone: string;
  idCard?: string;
}

export interface Flaw {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  imageUrl?: string;
}

export const FLAW_SEVERITY_LABELS: Record<Flaw['severity'], string> = {
  minor: '轻微',
  moderate: '中度',
  severe: '严重',
};

export const FLAW_SEVERITY_COLORS: Record<Flaw['severity'], string> = {
  minor: 'bg-jade-100 text-jade-600',
  moderate: 'bg-champagne-100 text-champagne-700',
  severe: 'bg-coral-100 text-coral-600',
};

export interface PriceHistoryItem {
  id: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  operator: string;
  timestamp: string;
}

export interface Settlement {
  id: string;
  salePrice: number;
  commissionRate: number;
  commission: number;
  settlementAmount: number;
  status: 'pending' | 'confirmed' | 'paid';
  confirmedAt?: string;
  operator?: string;
}

export interface StatusLog {
  id: string;
  status: ProductStatus;
  description: string;
  operator: string;
  timestamp: string;
  visibleToCustomer: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  expectedPrice: number;
  currentPrice: number;
  status: ProductStatus;
  customer: Customer;
  receivedAt: string;
  appraisalAt?: string;
  listedAt?: string;
  soldAt?: string;
  settledAt?: string;
  documents: {
    hasCertificate: boolean;
    hasInvoice: boolean;
    hasBox: boolean;
    missingNotes?: string;
  };
  appraisal?: {
    conclusion: 'genuine' | 'counterfeit' | 'disputed';
    remark: string;
    appraiser: string;
    flaws: Flaw[];
  };
  isDisputed: boolean;
  disputeReason?: string;
  customerWithdraw: boolean;
  withdrawReason?: string;
  priceHistory: PriceHistoryItem[];
  settlement?: Settlement;
  statusLogs: StatusLog[];
  images: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface User {
  id: string;
  name: string;
  role: 'receiver' | 'appraiser' | 'operator' | 'finance' | 'cs';
  employeeId: string;
  avatar?: string;
}

export const ROLE_LABELS: Record<User['role'], string> = {
  receiver: '收货员',
  appraiser: '鉴定师',
  operator: '运营专员',
  finance: '财务',
  cs: '客服',
};

export interface StatsData {
  pending: number;
  exception: number;
  completed: number;
}
