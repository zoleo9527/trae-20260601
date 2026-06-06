import { create } from 'zustand';
import type {
  PreparationOrder,
  InventoryLock,
  CustomsDoc,
  ReturnRecord,
  OperationLog,
  SkuInventory,
  RiskAlert,
  User,
  UserRole,
  PreparationOrderStatus,
  InventoryLockStatus,
} from '@/types';
import {
  preparationOrders as initialOrders,
  inventoryLocks as initialLocks,
  customsDocs as initialCustoms,
  returnRecords as initialReturns,
  operationLogs as initialLogs,
  skuInventories as initialInventories,
  riskAlerts as initialRisks,
  currentUser as initialUser,
} from '@/data/mockData';

interface AppState {
  currentUser: User;
  preparationOrders: PreparationOrder[];
  inventoryLocks: InventoryLock[];
  customsDocs: CustomsDoc[];
  returnRecords: ReturnRecord[];
  operationLogs: OperationLog[];
  skuInventories: SkuInventory[];
  riskAlerts: RiskAlert[];
  currentRole: UserRole;
  
  setCurrentRole: (role: UserRole) => void;
  
  getPreparationOrderById: (id: string) => PreparationOrder | undefined;
  getInventoryLockById: (id: string) => InventoryLock | undefined;
  getCustomsDocById: (id: string) => CustomsDoc | undefined;
  getLogsByBiz: (bizType: OperationLog['bizType'], bizId: string) => OperationLog[];
  
  createPreparationOrder: (order: Omit<PreparationOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePreparationStatus: (id: string, status: PreparationOrderStatus, remark?: string) => void;
  addPreparationRemark: (id: string, remark: string) => void;
  
  createInventoryLock: (lock: Omit<InventoryLock, 'id' | 'createdAt' | 'updatedAt'>) => void;
  releaseInventoryLock: (id: string, reason: string) => void;
  
  addOperationLog: (log: Omit<OperationLog, 'id' | 'operateAt'>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: initialUser,
  preparationOrders: initialOrders,
  inventoryLocks: initialLocks,
  customsDocs: initialCustoms,
  returnRecords: initialReturns,
  operationLogs: initialLogs,
  skuInventories: initialInventories,
  riskAlerts: initialRisks,
  currentRole: 'operator',

  setCurrentRole: (role) => set({ currentRole: role }),

  getPreparationOrderById: (id) => get().preparationOrders.find(o => o.id === id),
  getInventoryLockById: (id) => get().inventoryLocks.find(l => l.id === id),
  getCustomsDocById: (id) => get().customsDocs.find(c => c.id === id),
  getLogsByBiz: (bizType, bizId) => 
    get().operationLogs
      .filter(l => l.bizType === bizType && l.bizId === bizId)
      .sort((a, b) => new Date(b.operateAt).getTime() - new Date(a.operateAt).getTime()),

  createPreparationOrder: (order) => {
    const newOrder: PreparationOrder = {
      ...order,
      id: `po_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({
      preparationOrders: [newOrder, ...state.preparationOrders],
    }));
    get().addOperationLog({
      bizType: 'preparation',
      bizId: newOrder.id,
      operation: '创建备货单',
      operator: get().currentUser.id,
      operatorName: get().currentUser.name,
      detail: `创建备货单，包含${order.items.length}个SKU，共${order.totalQuantity}件商品`,
      toStatus: order.status,
    });
  },

  updatePreparationStatus: (id, status, remark) => {
    const order = get().getPreparationOrderById(id);
    if (!order) return;
    
    set(state => ({
      preparationOrders: state.preparationOrders.map(o =>
        o.id === id 
          ? { ...o, status, updatedAt: new Date().toISOString(), remark: remark || o.remark }
          : o
      ),
    }));
    
    const statusLabels: Record<string, string> = {
      PENDING_AUDIT: '提交审核',
      AUDITING: '开始审核',
      PENDING_SUPPLEMENT: '退回补件',
      AUDIT_PASS: '审核通过',
      WAREHOUSE_CONFIRM: '仓配确认',
      INVENTORY_LOCKED: '库存锁定',
      SHIPPED: '已发运',
      RECEIVED: '已入库',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    };
    
    get().addOperationLog({
      bizType: 'preparation',
      bizId: id,
      operation: statusLabels[status] || '状态变更',
      operator: get().currentUser.id,
      operatorName: get().currentUser.name,
      detail: `状态从${order.status}变更为${status}`,
      fromStatus: order.status,
      toStatus: status,
      remark,
    });
    
    if (status === 'INVENTORY_LOCKED') {
      order.items.forEach(item => {
        get().createInventoryLock({
          lockNo: `SD${Date.now()}`,
          status: 'LOCKED',
          sku: item.sku,
          skuName: item.skuName,
          lockQuantity: item.quantity,
          bizType: 'preparation',
          bizId: id,
          bizNo: order.orderNo,
          expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          locker: get().currentUser.id,
          lockerName: get().currentUser.name,
          remark: remark || order.remark,
          warehouseCode: order.warehouseCode,
          warehouseName: order.warehouseName,
        });
      });
    }
  },

  addPreparationRemark: (id, remark) => {
    set(state => ({
      preparationOrders: state.preparationOrders.map(o =>
        o.id === id ? { ...o, remark, updatedAt: new Date().toISOString() } : o
      ),
    }));
    get().addOperationLog({
      bizType: 'preparation',
      bizId: id,
      operation: '添加备注',
      operator: get().currentUser.id,
      operatorName: get().currentUser.name,
      detail: remark,
    });
  },

  createInventoryLock: (lock) => {
    const newLock: InventoryLock = {
      ...lock,
      id: `il_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({
      inventoryLocks: [newLock, ...state.inventoryLocks],
    }));
    get().addOperationLog({
      bizType: 'inventory_lock',
      bizId: newLock.id,
      operation: '创建锁定',
      operator: lock.locker,
      operatorName: lock.lockerName,
      detail: `锁定${lock.skuName}共${lock.lockQuantity}件`,
      toStatus: lock.status,
      remark: lock.remark,
    });
  },

  releaseInventoryLock: (id, reason) => {
    const lock = get().getInventoryLockById(id);
    if (!lock) return;
    
    set(state => ({
      inventoryLocks: state.inventoryLocks.map(l =>
        l.id === id 
          ? { ...l, status: 'RELEASED' as InventoryLockStatus, updatedAt: new Date().toISOString() }
          : l
      ),
    }));
    
    get().addOperationLog({
      bizType: 'inventory_lock',
      bizId: id,
      operation: '释放锁定',
      operator: get().currentUser.id,
      operatorName: get().currentUser.name,
      detail: reason,
      fromStatus: lock.status,
      toStatus: 'RELEASED',
    });
  },

  addOperationLog: (log) => {
    const newLog: OperationLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operateAt: new Date().toISOString(),
    };
    set(state => ({
      operationLogs: [newLog, ...state.operationLogs],
    }));
  },
}));
