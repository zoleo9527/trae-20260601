export type UserRole = 'brewer' | 'packaging' | 'sales';

export type BatchStatus =
  | 'PENDING_TEST'
  | 'TESTING'
  | 'TEST_PASSED'
  | 'TEST_ABNORMAL'
  | 'RELEASED'
  | 'REJECTED';

export interface Batch {
  id: string;
  batchNo: string;
  productName: string;
  formula: string;
  tankNo: string;
  fermentationDate: string;
  currentStatus: BatchStatus;
  createdBy: string;
  createdAt: string;
  quantity: number;
  alcoholContent?: number;
}

export interface TestItem {
  id: string;
  testRecordId: string;
  itemName: string;
  value: string;
  standard: string;
  isPass: boolean;
}

export interface TestRecord {
  id: string;
  batchId: string;
  testedBy: string;
  testedAt: string;
  isAbnormal: boolean;
  conclusion: string;
  items: TestItem[];
}

export interface Note {
  id: string;
  batchId: string;
  content: string;
  createdBy: string;
  role: UserRole;
  createdAt: string;
  source?: 'testing' | 'release' | 'manual';
}

export interface StatusLog {
  id: string;
  batchId: string;
  fromStatus: BatchStatus | null;
  toStatus: BatchStatus;
  operatedBy: string;
  role: UserRole;
  operatedAt: string;
  remark: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface TestTemplateItem {
  itemName: string;
  standard: string;
}

export interface TestTemplate {
  formula: string;
  items: TestTemplateItem[];
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  PENDING_TEST: '待检测',
  TESTING: '检测中',
  TEST_PASSED: '检测通过',
  TEST_ABNORMAL: '检测异常',
  RELEASED: '已放行',
  REJECTED: '已拒签',
};

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  PENDING_TEST: 'bg-yellow-100 text-yellow-800',
  TESTING: 'bg-blue-100 text-blue-800',
  TEST_PASSED: 'bg-hop-50 text-hop-green',
  TEST_ABNORMAL: 'bg-warning-50 text-warning-orange',
  RELEASED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  brewer: '酿酒师',
  packaging: '包装主管',
  sales: '销售内勤',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  brewer: 'bg-amber-100 text-amber-800',
  packaging: 'bg-blue-100 text-blue-800',
  sales: 'bg-purple-100 text-purple-800',
};

export const ROLE_DOT_COLORS: Record<UserRole, string> = {
  brewer: '#8B4513',
  packaging: '#4A90D9',
  sales: '#9B59B6',
};

export const STATUS_FLOW: BatchStatus[] = [
  'PENDING_TEST',
  'TESTING',
  'TEST_PASSED',
  'RELEASED',
];

export const ABNORMAL_STATUSES: BatchStatus[] = ['TEST_ABNORMAL', 'REJECTED'];

export const MOCK_DATA_LOCATIONS = {
  batches: 'src/data/mock/batches.ts',
  testRecords: 'src/data/mock/testRecords.ts',
  notes: 'src/data/mock/notes.ts',
  statusLogs: 'src/data/mock/statusLogs.ts',
  testTemplates: 'src/data/mock/testTemplates.ts',
};

export const ROLE_ENTRIES = {
  brewer: { label: '发起品控检测', description: '查看发酵记录，发起品控检测申请', path: '/brewer' },
  packaging: { label: '执行品控检测', description: '检测处理、异常标注、批量操作', path: '/packaging' },
  sales: { label: '放行判断', description: '审核检测记录，执行放行或拒签', path: '/sales' },
};

export const UNIMPLEMENTED_INTEGRATIONS = [
  { name: '发酵罐记录系统', description: '自动获取发酵温度、压力等数据', priority: '高', method: 'REST API' },
  { name: '配方管理系统', description: '拉取产品配方标准参数', priority: '中', method: 'REST API' },
  { name: '经销商订货群', description: '同步放行信息到订货群', priority: '中', method: 'Webhook' },
  { name: '条码打印系统', description: '放行后自动生成产品条码', priority: '低', method: 'SDK' },
  { name: '仓储管理系统', description: '放行后通知WMS入库', priority: '低', method: 'REST API' },
];
