import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type {
  LiveSchedule,
  Product,
  WorkflowRecord,
  User,
  ScheduleStatus,
  ProductStatus,
  WorkflowActionType,
  ScheduleProduct,
} from '@/types';

interface AppState {
  currentUser: User;
  schedules: LiveSchedule[];
  products: Product[];
  workflowRecords: WorkflowRecord[];
  processedIdempotencyKeys: Set<string>;
  setCurrentUser: (user: User) => void;
  createSchedule: (data: Partial<LiveSchedule>) => LiveSchedule;
  updateSchedule: (id: string, data: Partial<LiveSchedule>, idempotencyKey?: string) => LiveSchedule | null;
  submitScheduleForReview: (id: string, remark: string, idempotencyKey?: string) => boolean;
  reviewSchedule: (id: string, approved: boolean, remark: string, idempotencyKey?: string) => boolean;
  returnSchedule: (id: string, remark: string, idempotencyKey?: string) => boolean;
  supplementSchedule: (id: string, data: Partial<LiveSchedule>, remark: string, idempotencyKey?: string) => boolean;
  startLive: (id: string, idempotencyKey?: string) => boolean;
  endLive: (id: string, idempotencyKey?: string) => boolean;
  cancelSchedule: (id: string, remark: string, idempotencyKey?: string) => boolean;
  createProduct: (data: Partial<Product>) => Product;
  updateProduct: (id: string, data: Partial<Product>, idempotencyKey?: string) => Product | null;
  approveProduct: (id: string, idempotencyKey?: string) => boolean;
  rejectProduct: (id: string, remark: string, idempotencyKey?: string) => boolean;
  getWorkflowHistory: (bizType: 'SCHEDULE' | 'PRODUCT', bizId: string) => WorkflowRecord[];
  getScheduleById: (id: string) => LiveSchedule | undefined;
  getProductById: (id: string) => Product | undefined;
  getProductHistory: (productId: string) => WorkflowRecord[];
}

const initialUser: User = {
  id: 'user-001',
  name: '运营管理员',
  role: 'OPERATION',
};

const initialProducts: Product[] = [
  {
    id: 'prod-001',
    name: '轻奢真皮手提包',
    sku: 'BAG-001-BLK',
    category: '箱包',
    price: 299,
    originalPrice: 599,
    stock: 500,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'APPROVED',
    createdBy: 'product-001',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    version: 1,
  },
  {
    id: 'prod-002',
    name: '智能运动手表',
    sku: 'WATCH-002-GRY',
    category: '数码',
    price: 899,
    originalPrice: 1599,
    stock: 200,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'APPROVED',
    createdBy: 'product-001',
    createdAt: '2026-06-02T14:00:00Z',
    updatedAt: '2026-06-02T14:00:00Z',
    version: 1,
  },
  {
    id: 'prod-003',
    name: '保湿精华液套装',
    sku: 'SKIN-003-SET',
    category: '美妆',
    price: 199,
    originalPrice: 399,
    stock: 1000,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'PENDING',
    createdBy: 'product-002',
    createdAt: '2026-06-03T09:00:00Z',
    updatedAt: '2026-06-03T09:00:00Z',
    version: 1,
  },
  {
    id: 'prod-004',
    name: '运动休闲T恤',
    sku: 'CLOTH-004-WHT',
    category: '服饰',
    price: 89,
    originalPrice: 159,
    stock: 800,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'REJECTED',
    createdBy: 'product-002',
    createdAt: '2026-06-03T11:00:00Z',
    updatedAt: '2026-06-04T16:00:00Z',
    version: 1,
  },
  {
    id: 'prod-005',
    name: '无线蓝牙耳机',
    sku: 'AUDIO-005-BLK',
    category: '数码',
    price: 159,
    originalPrice: 299,
    stock: 300,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'APPROVED',
    createdBy: 'product-001',
    createdAt: '2026-06-04T10:00:00Z',
    updatedAt: '2026-06-04T10:00:00Z',
    version: 1,
  },
];

const initialSchedules: LiveSchedule[] = [
  {
    id: 'sched-001',
    title: '618年中大促 - 美妆专场',
    anchorName: '小美主播',
    assistantName: '助理小王',
    startTime: '2026-06-18T19:00:00Z',
    endTime: '2026-06-18T23:00:00Z',
    estimatedDuration: 240,
    platform: '抖音',
    status: 'COMPLETED',
    products: [
      { productId: 'prod-001', productName: '轻奢真皮手提包', productSku: 'BAG-001-BLK', salePrice: 269, plannedQuantity: 100, displayOrder: 1, isSelected: true },
      { productId: 'prod-003', productName: '保湿精华液套装', productSku: 'SKIN-003-SET', salePrice: 179, plannedQuantity: 300, displayOrder: 2, isSelected: true },
    ],
    createdBy: 'user-001',
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-18T23:30:00Z',
    currentVersion: 3,
  },
  {
    id: 'sched-002',
    title: '数码好物节 - 3C专场',
    anchorName: '科技达人',
    assistantName: '助理小李',
    startTime: '2026-06-20T20:00:00Z',
    endTime: '2026-06-21T00:00:00Z',
    estimatedDuration: 240,
    platform: '淘宝',
    status: 'RETURNED',
    products: [
      { productId: 'prod-002', productName: '智能运动手表', productSku: 'WATCH-002-GRY', salePrice: 799, plannedQuantity: 50, displayOrder: 1, isSelected: true },
      { productId: 'prod-005', productName: '无线蓝牙耳机', productSku: 'AUDIO-005-BLK', salePrice: 139, plannedQuantity: 200, displayOrder: 2, isSelected: true },
    ],
    createdBy: 'user-001',
    createdAt: '2026-06-12T14:00:00Z',
    updatedAt: '2026-06-15T09:30:00Z',
    currentVersion: 2,
  },
  {
    id: 'sched-003',
    title: '夏日穿搭 - 服饰专场',
    anchorName: '时尚博主',
    assistantName: '助理小张',
    startTime: '2026-06-25T19:30:00Z',
    endTime: '2026-06-25T22:30:00Z',
    estimatedDuration: 180,
    platform: '抖音',
    status: 'PENDING_REVIEW',
    products: [
      { productId: 'prod-004', productName: '运动休闲T恤', productSku: 'CLOTH-004-WHT', salePrice: 79, plannedQuantity: 500, displayOrder: 1, isSelected: true },
    ],
    createdBy: 'user-001',
    createdAt: '2026-06-16T11:00:00Z',
    updatedAt: '2026-06-17T15:00:00Z',
    currentVersion: 1,
  },
];

const initialWorkflowRecords: WorkflowRecord[] = [
  {
    id: 'wf-001',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: 'user-001',
    actionAt: '2026-06-10T10:00:00Z',
    remark: '创建618美妆专场排期',
    previousStatus: '',
    newStatus: 'DRAFT',
    idempotencyKey: 'key-sched-001-create',
  },
  {
    id: 'wf-002',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 2,
    actionType: 'SUBMIT',
    actionBy: 'user-001',
    actionAt: '2026-06-12T14:00:00Z',
    remark: '提交复核',
    previousStatus: 'DRAFT',
    newStatus: 'PENDING_REVIEW',
    idempotencyKey: 'key-sched-001-submit',
  },
  {
    id: 'wf-003',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 3,
    actionType: 'APPROVE',
    actionBy: 'auditor-001',
    actionAt: '2026-06-13T10:00:00Z',
    remark: '复核通过，商品选品和时间安排合理',
    previousStatus: 'PENDING_REVIEW',
    newStatus: 'APPROVED',
    idempotencyKey: 'key-sched-001-approve',
  },
  {
    id: 'wf-004',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 3,
    actionType: 'START_LIVE',
    actionBy: 'anchor-assistant-001',
    actionAt: '2026-06-18T19:00:00Z',
    remark: '直播开始',
    previousStatus: 'APPROVED',
    newStatus: 'LIVE',
    idempotencyKey: 'key-sched-001-start',
  },
  {
    id: 'wf-005',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 3,
    actionType: 'END_LIVE',
    actionBy: 'anchor-assistant-001',
    actionAt: '2026-06-18T23:30:00Z',
    remark: '直播顺利结束，GMV达标',
    previousStatus: 'LIVE',
    newStatus: 'COMPLETED',
    idempotencyKey: 'key-sched-001-end',
  },
  {
    id: 'wf-006',
    bizType: 'SCHEDULE',
    bizId: 'sched-002',
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: 'user-001',
    actionAt: '2026-06-12T14:00:00Z',
    remark: '创建数码好物节排期',
    previousStatus: '',
    newStatus: 'DRAFT',
    idempotencyKey: 'key-sched-002-create',
  },
  {
    id: 'wf-007',
    bizType: 'SCHEDULE',
    bizId: 'sched-002',
    bizVersion: 1,
    actionType: 'SUBMIT',
    actionBy: 'user-001',
    actionAt: '2026-06-14T10:00:00Z',
    remark: '提交复核',
    previousStatus: 'DRAFT',
    newStatus: 'PENDING_REVIEW',
    idempotencyKey: 'key-sched-002-submit',
  },
  {
    id: 'wf-008',
    bizType: 'SCHEDULE',
    bizId: 'sched-002',
    bizVersion: 2,
    actionType: 'RETURN',
    actionBy: 'auditor-001',
    actionAt: '2026-06-15T09:30:00Z',
    remark: '退回补录：1. 智能手表库存不足，需要确认补货；2. 直播时长建议延长30分钟',
    previousStatus: 'PENDING_REVIEW',
    newStatus: 'RETURNED',
    idempotencyKey: 'key-sched-002-return',
  },
  {
    id: 'wf-009',
    bizType: 'SCHEDULE',
    bizId: 'sched-003',
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: 'user-001',
    actionAt: '2026-06-16T11:00:00Z',
    remark: '创建夏日穿搭专场',
    previousStatus: '',
    newStatus: 'DRAFT',
    idempotencyKey: 'key-sched-003-create',
  },
  {
    id: 'wf-010',
    bizType: 'SCHEDULE',
    bizId: 'sched-003',
    bizVersion: 1,
    actionType: 'SUBMIT',
    actionBy: 'user-001',
    actionAt: '2026-06-17T15:00:00Z',
    remark: '提交复核',
    previousStatus: 'DRAFT',
    newStatus: 'PENDING_REVIEW',
    idempotencyKey: 'key-sched-003-submit',
  },
  {
    id: 'wf-011',
    bizType: 'PRODUCT',
    bizId: 'prod-004',
    bizVersion: 1,
    actionType: 'REJECT',
    actionBy: 'auditor-001',
    actionAt: '2026-06-04T16:00:00Z',
    remark: '商品图片不符合要求，需要重新拍摄',
    previousStatus: 'PENDING',
    newStatus: 'REJECTED',
    idempotencyKey: 'key-prod-004-reject',
  },
];

export const useStore = create<AppState>((set, get) => ({
  currentUser: initialUser,
  schedules: initialSchedules,
  products: initialProducts,
  workflowRecords: initialWorkflowRecords,
  processedIdempotencyKeys: new Set(initialWorkflowRecords.map(r => r.idempotencyKey)),

  setCurrentUser: (user) => set({ currentUser: user }),

  _addWorkflowRecord: (record: Omit<WorkflowRecord, 'id' | 'idempotencyKey' | 'actionAt'> & { idempotencyKey?: string }) => {
    const state = get();
    const idempotencyKey = record.idempotencyKey || uuidv4();
    
    if (state.processedIdempotencyKeys.has(idempotencyKey)) {
      return false;
    }

    const newRecord: WorkflowRecord = {
      ...record,
      id: uuidv4(),
      idempotencyKey,
      actionAt: dayjs().toISOString(),
    };

    set((state) => ({
      workflowRecords: [...state.workflowRecords, newRecord],
      processedIdempotencyKeys: new Set([...state.processedIdempotencyKeys, idempotencyKey]),
    }));

    return true;
  },

  createSchedule: (data) => {
    const state = get();
    const newSchedule: LiveSchedule = {
      id: uuidv4(),
      title: data.title || '',
      anchorName: data.anchorName || '',
      assistantName: data.assistantName || state.currentUser.name,
      startTime: data.startTime || dayjs().add(1, 'day').toISOString(),
      endTime: data.endTime || dayjs().add(1, 'day').add(2, 'hour').toISOString(),
      estimatedDuration: data.estimatedDuration || 120,
      platform: data.platform || '抖音',
      status: 'DRAFT',
      products: data.products || [],
      createdBy: state.currentUser.id,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      currentVersion: 1,
    };

    set((state) => ({
      schedules: [...state.schedules, newSchedule],
    }));

    get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: newSchedule.id,
      bizVersion: 1,
      actionType: 'CREATE',
      actionBy: state.currentUser.id,
      remark: '创建直播排期',
      previousStatus: '',
      newStatus: 'DRAFT',
    });

    return newSchedule;
  },

  updateSchedule: (id, data, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule) return null;

    const key = idempotencyKey || `update-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) {
      return schedule;
    }

    const newVersion = schedule.currentVersion + 1;
    const updatedSchedule: LiveSchedule = {
      ...schedule,
      ...data,
      updatedAt: dayjs().toISOString(),
      currentVersion: newVersion,
    };

    set((state) => ({
      schedules: state.schedules.map(s => s.id === id ? updatedSchedule : s),
    }));

    get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: newVersion,
      actionType: 'UPDATE',
      actionBy: state.currentUser.id,
      remark: '更新排期信息',
      previousStatus: schedule.status,
      newStatus: schedule.status,
      idempotencyKey: key,
    });

    return updatedSchedule;
  },

  submitScheduleForReview: (id, remark, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule || !['DRAFT', 'RETURNED'].includes(schedule.status)) return false;

    const key = idempotencyKey || `submit-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    const newVersion = schedule.currentVersion + 1;
    set((state) => ({
      schedules: state.schedules.map(s => 
        s.id === id 
          ? { ...s, status: 'PENDING_REVIEW', updatedAt: dayjs().toISOString(), currentVersion: newVersion }
          : s
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: newVersion,
      actionType: 'SUBMIT',
      actionBy: state.currentUser.id,
      remark: remark || '提交复核',
      previousStatus: schedule.status,
      newStatus: 'PENDING_REVIEW',
      idempotencyKey: key,
    });
  },

  reviewSchedule: (id, approved, remark, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule || schedule.status !== 'PENDING_REVIEW') return false;

    const key = idempotencyKey || `review-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    const newStatus: ScheduleStatus = approved ? 'APPROVED' : 'REVIEWED';
    const newVersion = schedule.currentVersion + 1;

    set((state) => ({
      schedules: state.schedules.map(s => 
        s.id === id 
          ? { ...s, status: newStatus, updatedAt: dayjs().toISOString(), currentVersion: newVersion }
          : s
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: newVersion,
      actionType: approved ? 'APPROVE' : 'REJECT',
      actionBy: state.currentUser.id,
      remark: remark || (approved ? '复核通过' : '复核不通过'),
      previousStatus: schedule.status,
      newStatus,
      idempotencyKey: key,
    });
  },

  returnSchedule: (id, remark, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule || !['PENDING_REVIEW', 'REVIEWED'].includes(schedule.status)) return false;

    const key = idempotencyKey || `return-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    const newVersion = schedule.currentVersion + 1;
    set((state) => ({
      schedules: state.schedules.map(s => 
        s.id === id 
          ? { ...s, status: 'RETURNED', updatedAt: dayjs().toISOString(), currentVersion: newVersion }
          : s
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: newVersion,
      actionType: 'RETURN',
      actionBy: state.currentUser.id,
      remark: remark || '退回补录',
      previousStatus: schedule.status,
      newStatus: 'RETURNED',
      idempotencyKey: key,
    });
  },

  supplementSchedule: (id, data, remark, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule || schedule.status !== 'RETURNED') return false;

    const key = idempotencyKey || `supplement-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    const newVersion = schedule.currentVersion + 1;
    set((state) => ({
      schedules: state.schedules.map(s => 
        s.id === id 
          ? { ...s, ...data, status: 'DRAFT', updatedAt: dayjs().toISOString(), currentVersion: newVersion }
          : s
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: newVersion,
      actionType: 'SUPPLEMENT',
      actionBy: state.currentUser.id,
      remark: remark || '补录完成',
      previousStatus: 'RETURNED',
      newStatus: 'DRAFT',
      idempotencyKey: key,
    });
  },

  startLive: (id, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule || schedule.status !== 'APPROVED') return false;

    const key = idempotencyKey || `start-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    set((state) => ({
      schedules: state.schedules.map(s => 
        s.id === id 
          ? { ...s, status: 'LIVE', updatedAt: dayjs().toISOString() }
          : s
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: schedule.currentVersion,
      actionType: 'START_LIVE',
      actionBy: state.currentUser.id,
      remark: '直播开始',
      previousStatus: schedule.status,
      newStatus: 'LIVE',
      idempotencyKey: key,
    });
  },

  endLive: (id, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule || schedule.status !== 'LIVE') return false;

    const key = idempotencyKey || `end-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    set((state) => ({
      schedules: state.schedules.map(s => 
        s.id === id 
          ? { ...s, status: 'COMPLETED', updatedAt: dayjs().toISOString() }
          : s
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: schedule.currentVersion,
      actionType: 'END_LIVE',
      actionBy: state.currentUser.id,
      remark: '直播结束',
      previousStatus: schedule.status,
      newStatus: 'COMPLETED',
      idempotencyKey: key,
    });
  },

  cancelSchedule: (id, remark, idempotencyKey) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === id);
    if (!schedule || ['COMPLETED', 'CANCELLED', 'LIVE'].includes(schedule.status)) return false;

    const key = idempotencyKey || `cancel-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    set((state) => ({
      schedules: state.schedules.map(s => 
        s.id === id 
          ? { ...s, status: 'CANCELLED', updatedAt: dayjs().toISOString() }
          : s
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'SCHEDULE',
      bizId: id,
      bizVersion: schedule.currentVersion,
      actionType: 'CANCEL',
      actionBy: state.currentUser.id,
      remark: remark || '取消排期',
      previousStatus: schedule.status,
      newStatus: 'CANCELLED',
      idempotencyKey: key,
    });
  },

  createProduct: (data) => {
    const state = get();
    const newProduct: Product = {
      id: uuidv4(),
      name: data.name || '',
      sku: data.sku || '',
      category: data.category || '',
      price: data.price || 0,
      originalPrice: data.originalPrice || 0,
      stock: data.stock || 0,
      imageUrl: data.imageUrl || 'https://via.placeholder.com/100',
      status: 'PENDING',
      createdBy: state.currentUser.id,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      version: 1,
    };

    set((state) => ({
      products: [...state.products, newProduct],
    }));

    get()._addWorkflowRecord({
      bizType: 'PRODUCT',
      bizId: newProduct.id,
      bizVersion: 1,
      actionType: 'CREATE',
      actionBy: state.currentUser.id,
      remark: '创建商品',
      previousStatus: '',
      newStatus: 'PENDING',
    });

    return newProduct;
  },

  updateProduct: (id, data, idempotencyKey) => {
    const state = get();
    const product = state.products.find(p => p.id === id);
    if (!product) return null;

    const key = idempotencyKey || `update-prod-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) {
      return product;
    }

    const newVersion = product.version + 1;
    const updatedProduct: Product = {
      ...product,
      ...data,
      updatedAt: dayjs().toISOString(),
      version: newVersion,
    };

    set((state) => ({
      products: state.products.map(p => p.id === id ? updatedProduct : p),
    }));

    get()._addWorkflowRecord({
      bizType: 'PRODUCT',
      bizId: id,
      bizVersion: newVersion,
      actionType: 'UPDATE',
      actionBy: state.currentUser.id,
      remark: '更新商品信息',
      previousStatus: product.status,
      newStatus: product.status,
      idempotencyKey: key,
    });

    return updatedProduct;
  },

  approveProduct: (id, idempotencyKey) => {
    const state = get();
    const product = state.products.find(p => p.id === id);
    if (!product || product.status !== 'PENDING') return false;

    const key = idempotencyKey || `approve-prod-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    const newVersion = product.version + 1;
    set((state) => ({
      products: state.products.map(p => 
        p.id === id 
          ? { ...p, status: 'APPROVED', updatedAt: dayjs().toISOString(), version: newVersion }
          : p
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'PRODUCT',
      bizId: id,
      bizVersion: newVersion,
      actionType: 'APPROVE',
      actionBy: state.currentUser.id,
      remark: '商品审核通过',
      previousStatus: product.status,
      newStatus: 'APPROVED',
      idempotencyKey: key,
    });
  },

  rejectProduct: (id, remark, idempotencyKey) => {
    const state = get();
    const product = state.products.find(p => p.id === id);
    if (!product || product.status !== 'PENDING') return false;

    const key = idempotencyKey || `reject-prod-${id}-${Date.now()}`;
    if (state.processedIdempotencyKeys.has(key)) return true;

    const newVersion = product.version + 1;
    set((state) => ({
      products: state.products.map(p => 
        p.id === id 
          ? { ...p, status: 'REJECTED', updatedAt: dayjs().toISOString(), version: newVersion }
          : p
      ),
    }));

    return get()._addWorkflowRecord({
      bizType: 'PRODUCT',
      bizId: id,
      bizVersion: newVersion,
      actionType: 'REJECT',
      actionBy: state.currentUser.id,
      remark: remark || '商品审核不通过',
      previousStatus: product.status,
      newStatus: 'REJECTED',
      idempotencyKey: key,
    });
  },

  getWorkflowHistory: (bizType, bizId) => {
    return get().workflowRecords
      .filter(r => r.bizType === bizType && r.bizId === bizId)
      .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());
  },

  getScheduleById: (id) => get().schedules.find(s => s.id === id),

  getProductById: (id) => get().products.find(p => p.id === id),

  getProductHistory: (productId) => {
    return get().workflowRecords
      .filter(r => r.bizType === 'PRODUCT' && r.bizId === productId)
      .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());
  },
}));
