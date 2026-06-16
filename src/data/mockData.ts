import { Store, User, Product, StockRequest, Inspection, Difference } from '../types';

export const mockStores: Store[] = [
  { id: 1, name: '望京SOHO店', region: '北京', address: '北京市朝阳区望京街10号', createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: '国贸店', region: '北京', address: '北京市朝阳区建国门外大街1号', createdAt: '2024-01-01T00:00:00Z' },
  { id: 3, name: '三里屯店', region: '北京', address: '北京市朝阳区三里屯太古里', createdAt: '2024-01-01T00:00:00Z' },
];

export const mockUsers: User[] = [
  { id: 1, name: '张三', role: 'manager', storeId: 1, createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: '李四', role: 'supervisor', storeId: null, createdAt: '2024-01-01T00:00:00Z' },
  { id: 3, name: '王五', role: 'purchaser', storeId: null, createdAt: '2024-01-01T00:00:00Z' },
  { id: 4, name: '赵六', role: 'manager', storeId: 2, createdAt: '2024-01-01T00:00:00Z' },
];

export const mockProducts: Product[] = [
  { id: 1, name: '生菜', spec: '250g/袋', unit: '袋', category: '蔬菜', isCold: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: '鸡胸肉', spec: '500g/盒', unit: '盒', category: '肉类', isCold: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 3, name: '牛奶', spec: '1L/瓶', unit: '瓶', category: '乳制品', isCold: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 4, name: '大米', spec: '5kg/袋', unit: '袋', category: '粮油', isCold: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 5, name: '食用油', spec: '5L/桶', unit: '桶', category: '粮油', isCold: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 6, name: '番茄', spec: '500g/盒', unit: '盒', category: '蔬菜', isCold: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 7, name: '三文鱼', spec: '200g/盒', unit: '盒', category: '海鲜', isCold: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 8, name: '鸡蛋', spec: '30枚/盒', unit: '盒', category: '蛋类', isCold: false, createdAt: '2024-01-01T00:00:00Z' },
];

export const mockStockRequests: StockRequest[] = [
  {
    id: 1,
    storeId: 1,
    userId: 1,
    productId: 2,
    requestQty: 10,
    reason: '库存不足，影响营业',
    affectsBusiness: true,
    status: 'pending',
    expectedDate: '2026-06-20',
    supervisorComment: null,
    confirmedQty: null,
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 2,
    storeId: 1,
    userId: 1,
    productId: 3,
    requestQty: 20,
    reason: '临时断货',
    affectsBusiness: false,
    status: 'approved',
    expectedDate: '2026-06-18',
    supervisorComment: '已审核，同意申领',
    confirmedQty: 20,
    createdAt: '2026-06-14T09:00:00Z',
    updatedAt: '2026-06-14T14:00:00Z',
  },
  {
    id: 3,
    storeId: 2,
    userId: 4,
    productId: 4,
    requestQty: 5,
    reason: '库存告急',
    affectsBusiness: true,
    status: 'delivering',
    expectedDate: '2026-06-19',
    supervisorComment: '已审核',
    confirmedQty: 5,
    createdAt: '2026-06-13T11:00:00Z',
    updatedAt: '2026-06-15T08:00:00Z',
  },
  {
    id: 4,
    storeId: 1,
    userId: 1,
    productId: 7,
    requestQty: 15,
    reason: '周末备货',
    affectsBusiness: false,
    status: 'delivered',
    expectedDate: '2026-06-17',
    supervisorComment: '已审核',
    confirmedQty: 15,
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-06-16T09:00:00Z',
  },
  {
    id: 5,
    storeId: 3,
    userId: 1,
    productId: 2,
    requestQty: 8,
    reason: '临时断货',
    affectsBusiness: false,
    status: 'inspected',
    expectedDate: '2026-06-16',
    supervisorComment: '已审核',
    confirmedQty: 8,
    createdAt: '2026-06-10T14:00:00Z',
    updatedAt: '2026-06-16T10:00:00Z',
  },
  {
    id: 6,
    storeId: 2,
    userId: 4,
    productId: 5,
    requestQty: 6,
    reason: '库存不足',
    affectsBusiness: false,
    status: 'rejected',
    expectedDate: '2026-06-21',
    supervisorComment: '暂时无法配货，建议下周再申请',
    confirmedQty: null,
    createdAt: '2026-06-15T15:00:00Z',
    updatedAt: '2026-06-15T16:00:00Z',
  },
];

export const mockInspections: Inspection[] = [
  {
    id: 1,
    requestId: 5,
    actualQty: 6,
    actualSpec: '500g/盒',
    temperature: 2,
    isNormal: false,
    inspectorId: 4,
    inspectedAt: '2026-06-16T10:00:00Z',
  },
];

export const mockDifferences: Difference[] = [
  {
    id: 1,
    inspectionId: 1,
    type: 'shortage',
    description: '申领8盒，实际到货6盒，少配2盒',
    status: 'pending',
    handlerId: null,
    processedAt: null,
    processingResult: null,
  },
  {
    id: 2,
    inspectionId: 1,
    type: 'temperature',
    description: '冷链温度异常，到货时温度为2°C，超出标准范围(0-1°C)',
    status: 'processing',
    handlerId: 3,
    processedAt: '2026-06-16T11:00:00Z',
    processingResult: '已联系供应商确认，将补发2盒并提供5%折扣补偿',
  },
];

export const reasonOptions = [
  '临时断货',
  '库存不足',
  '库存告急',
  '周末备货',
  '新品上架',
  '其他',
];

export const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已审核（待配货）',
  rejected: '已驳回',
  delivering: '配货中（已确认数量）',
  delivered: '已发货',
  inspected: '已验收',
};

export const differenceTypeLabels: Record<string, string> = {
  shortage: '少配',
  wrong_spec: '错配',
  temperature: '温度异常',
  other: '其他',
};

export const differenceStatusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};
