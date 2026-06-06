import { v4 as uuidv4 } from 'uuid';
import { InventoryLockOrder, Role } from './types';

class DataStore {
  private orders: Map<string, InventoryLockOrder> = new Map();

  constructor() {
    this.initMockData();
  }

  private initMockData() {
    const now = new Date().toISOString();
    
    const mockOrders: InventoryLockOrder[] = [
      {
        id: uuidv4(),
        orderNo: 'INV-20260606-001',
        liveSessionId: 'LIVE-001',
        liveSessionName: '618大促专场-美妆护肤',
        skuList: [
          { skuId: 'SKU001', skuName: '精华液50ml', originalPrice: 399, livePrice: 199, stockAvailable: 500, stockLocked: 200, unit: '瓶' },
          { skuId: 'SKU002', skuName: '面霜30g', originalPrice: 299, livePrice: 149, stockAvailable: 300, stockLocked: 150, unit: '瓶' },
        ],
        totalLockedAmount: 200 * 199 + 150 * 149,
        priority: 'EXTREME',
        status: 'PENDING_REVIEW',
        createdBy: '李明',
        createdByRole: 'ASSISTANT',
        createdAt: now,
        updatedAt: now,
        currentHandler: '王芳',
        currentHandlerRole: 'STAGE_CONTROL',
        giftList: [],
        priceRemark: '主播直播间专属价，比日常低50%，注意价格口径统一',
        operationLogs: [
          {
            id: uuidv4(),
            timestamp: now,
            operator: '李明',
            role: 'ASSISTANT',
            action: '创建库存锁定单',
            remark: '618大促美妆场，紧急锁定库存',
            toStatus: 'PENDING_LOCK'
          },
          {
            id: uuidv4(),
            timestamp: now,
            operator: '李明',
            role: 'ASSISTANT',
            action: '提交锁定',
            remark: '已确认SKU数量和价格',
            fromStatus: 'PENDING_LOCK',
            toStatus: 'PENDING_REVIEW'
          }
        ],
        expectedLiveTime: '2026-06-06 20:00:00'
      },
      {
        id: uuidv4(),
        orderNo: 'INV-20260606-002',
        liveSessionId: 'LIVE-002',
        liveSessionName: '服饰穿搭专场',
        skuList: [
          { skuId: 'SKU003', skuName: '连衣裙S码', originalPrice: 599, livePrice: 299, stockAvailable: 200, stockLocked: 100, unit: '件' },
          { skuId: 'SKU004', skuName: 'T恤M码', originalPrice: 199, livePrice: 89, stockAvailable: 500, stockLocked: 300, unit: '件' },
        ],
        totalLockedAmount: 100 * 299 + 300 * 89,
        priority: 'URGENT',
        status: 'GIFT_CONFIGURING',
        createdBy: '张伟',
        createdByRole: 'ASSISTANT',
        createdAt: now,
        updatedAt: now,
        currentHandler: '赵敏',
        currentHandlerRole: 'AFTER_SALES_LEAD',
        giftList: [],
        priceRemark: '满299减50，注意凑单规则',
        operationLogs: [
          {
            id: uuidv4(),
            timestamp: now,
            operator: '张伟',
            role: 'ASSISTANT',
            action: '创建库存锁定单',
            remark: '服饰专场预热',
            toStatus: 'PENDING_LOCK'
          },
          {
            id: uuidv4(),
            timestamp: now,
            operator: '张伟',
            role: 'ASSISTANT',
            action: '提交锁定',
            remark: '',
            fromStatus: 'PENDING_LOCK',
            toStatus: 'PENDING_REVIEW'
          },
          {
            id: uuidv4(),
            timestamp: now,
            operator: '王芳',
            role: 'STAGE_CONTROL',
            action: '审核通过',
            remark: '库存确认无误，价格符合活动要求',
            fromStatus: 'PENDING_REVIEW',
            toStatus: 'GIFT_CONFIGURING'
          }
        ],
        expectedLiveTime: '2026-06-07 19:30:00'
      },
      {
        id: uuidv4(),
        orderNo: 'INV-20260606-003',
        liveSessionId: 'LIVE-003',
        liveSessionName: '家居生活专场',
        skuList: [
          { skuId: 'SKU005', skuName: '保温杯500ml', originalPrice: 199, livePrice: 99, stockAvailable: 1000, stockLocked: 500, unit: '个' },
        ],
        totalLockedAmount: 500 * 99,
        priority: 'NORMAL',
        status: 'REVIEW_REJECTED',
        createdBy: '陈静',
        createdByRole: 'ASSISTANT',
        createdAt: now,
        updatedAt: now,
        currentHandler: '陈静',
        currentHandlerRole: 'ASSISTANT',
        giftList: [],
        priceRemark: '',
        operationLogs: [
          {
            id: uuidv4(),
            timestamp: now,
            operator: '陈静',
            role: 'ASSISTANT',
            action: '创建库存锁定单',
            remark: '',
            toStatus: 'PENDING_LOCK'
          },
          {
            id: uuidv4(),
            timestamp: now,
            operator: '陈静',
            role: 'ASSISTANT',
            action: '提交锁定',
            remark: '',
            fromStatus: 'PENDING_LOCK',
            toStatus: 'PENDING_REVIEW'
          },
          {
            id: uuidv4(),
            timestamp: now,
            operator: '王芳',
            role: 'STAGE_CONTROL',
            action: '审核驳回',
            remark: '价格口径不一致，直播价比日常价还高，请重新确认',
            fromStatus: 'PENDING_REVIEW',
            toStatus: 'REVIEW_REJECTED'
          }
        ],
        rejectReason: '价格口径不一致，直播价比日常价还高，请重新确认',
        expectedLiveTime: '2026-06-08 20:00:00'
      }
    ];

    mockOrders.forEach(order => {
      this.orders.set(order.id, order);
    });
  }

  getAllOrders(): InventoryLockOrder[] {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrderById(id: string): InventoryLockOrder | undefined {
    return this.orders.get(id);
  }

  getOrdersByRole(role: Role): InventoryLockOrder[] {
    return this.getAllOrders().filter(order => {
      if (role === 'ASSISTANT') {
        return ['DRAFT', 'PENDING_LOCK', 'REVIEW_REJECTED', 'RETURNED'].includes(order.status) 
          || order.createdByRole === 'ASSISTANT';
      }
      if (role === 'STAGE_CONTROL') {
        return ['PENDING_REVIEW', 'GIFT_CONFIGURING', 'GIFT_CONFIGURED'].includes(order.status);
      }
      if (role === 'AFTER_SALES_LEAD') {
        return ['GIFT_CONFIGURING', 'GIFT_CONFIGURED', 'COMPLETED'].includes(order.status);
      }
      return false;
    });
  }

  addOrder(order: InventoryLockOrder): void {
    this.orders.set(order.id, order);
  }

  updateOrder(id: string, updates: Partial<InventoryLockOrder>): InventoryLockOrder | undefined {
    const order = this.orders.get(id);
    if (order) {
      const updated = { ...order, ...updates, updatedAt: new Date().toISOString() };
      this.orders.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const store = new DataStore();
