export type OrderStatus =
  | 'created'
  | 'pending_review'
  | 'designing'
  | 'pending_approval'
  | 'revision_needed'
  | 'approved'
  | 'printing'
  | 'quality_check'
  | 'ready_for_install'
  | 'installing'
  | 'completed';

export type UserRole = 'receptionist' | 'designer' | 'installer' | 'production' | 'quality' | 'customer' | 'admin';

export type RevisionType = 'color' | 'dimension' | 'content' | 'layout' | 'typography' | 'other';

export type IssueType = 'customer_revision' | 'color' | 'dimension' | 'quality' | 'installation' | 'design' | 'other';

export interface HistoryItem {
  status: string;
  operator: string;
  remark: string;
  timestamp: string;
}

export interface Revision {
  id: string;
  type: RevisionType;
  description: string;
  operator: string;
  fileUrl: string | null;
  beforeData: Record<string, any>;
  afterData: Record<string, any>;
  timestamp: string;
}

export interface Issue {
  id: string;
  type: IssueType;
  description: string;
  status: 'pending' | 'resolved';
  reportedAt: string;
  resolvedAt?: string;
}

export interface InstallationRecord {
  installTime: string;
  operator: string;
  remark: string;
  photos: string[];
  issueReported: boolean;
  completedAt: string;
}

export interface CustomerConfirmation {
  customerName: string;
  signature: string;
  confirmType: 'approve' | 'revise';
  feedback: string;
  confirmedAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  businessType: string;
  title: string;
  description: string;
  width: number | null;
  height: number | null;
  unit: string;
  quantity: number;
  material: string;
  colorMode: string;
  status: OrderStatus;
  urgent: boolean;
  expectedDelivery: string | null;
  installAddress: string | null;
  installTime: string | null;
  createdAt: string;
  updatedAt: string;
  currentHandler: UserRole | null;
  history: HistoryItem[];
  revisions: Revision[];
  installation: InstallationRecord | null;
  customerConfirmation: CustomerConfirmation | null;
  issues: Issue[];
}

export interface Statistics {
  total: number;
  byStatus: Record<string, number>;
  urgent: number;
  pendingReview: number;
  designing: number;
  pendingApproval: number;
  revisionNeeded: number;
  printing: number;
  readyForInstall: number;
  installing: number;
  completed: number;
  openIssues: number;
  issuesByType: Record<string, number>;
  overdue: number;
  approachingDeadline: number;
  alerts: Alert[];
}

export interface Alert {
  type: 'warning' | 'danger';
  orderId: string;
  message: string;
  waitTime?: number;
  issues?: string[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  created: '已创建',
  pending_review: '待审核',
  designing: '设计中',
  pending_approval: '待客户确认',
  revision_needed: '待改稿',
  approved: '已确认',
  printing: '喷绘中',
  quality_check: '质检中',
  ready_for_install: '待安装',
  installing: '安装中',
  completed: '已完成'
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'default',
  pending_review: 'gold',
  designing: 'blue',
  pending_approval: 'cyan',
  revision_needed: 'red',
  approved: 'green',
  printing: 'purple',
  quality_check: 'orange',
  ready_for_install: 'geekblue',
  installing: 'magenta',
  completed: 'success'
};

export const REVISION_TYPE_LABELS: Record<RevisionType, string> = {
  color: '颜色调整',
  dimension: '尺寸修改',
  content: '内容修改',
  layout: '布局调整',
  typography: '字体调整',
  other: '其他改稿'
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  customer_revision: '客户改稿',
  color: '色差问题',
  dimension: '尺寸问题',
  quality: '质量问题',
  installation: '安装问题',
  design: '设计问题',
  other: '其他问题'
};

export const ROLE_LABELS: Record<UserRole, string> = {
  receptionist: '接单员',
  designer: '设计师',
  installer: '安装队长',
  production: '喷绘员',
  quality: '质检员',
  customer: '客户',
  admin: '管理员'
};

export const BUSINESS_TYPES = [
  '门店招牌',
  '背景墙',
  '户外广告',
  '促销海报',
  '室内装修',
  '文化墙',
  '菜单灯箱',
  '宣传物料',
  '展厅布置',
  '婚礼背景',
  '导视系统',
  '其他'
];

export const MATERIALS = [
  '喷绘布',
  '550加厚灯箱布',
  'PP背胶',
  'PP背胶+冷裱膜',
  '相纸',
  '相纸+铝合金框',
  '亚克力水晶字',
  '3cm厚亚克力水晶字',
  '亚克力UV打印',
  '灯箱片',
  '不锈钢包边发光字',
  '喷绘+KT板',
  '桁架+喷绘背景板',
  '亚克力+不锈钢',
  '多种材质',
  '其他'
];
