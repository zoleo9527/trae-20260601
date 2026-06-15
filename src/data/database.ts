import { v4 as uuidv4 } from 'uuid';
import type {
  RecyclingOrder,
  Valuation,
  CustomerConfirmation,
  AuditLog,
  IdempotentRecord,
  Role,
} from '@/types/models';

class Database {
  private orders: Map<string, RecyclingOrder> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private idempotentRecords: Map<string, IdempotentRecord> = new Map();
  private orderCounter: number = 1000;

  constructor() {
    this.initializeSeedData();
  }

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    this.orderCounter++;
    return `RC${dateStr}${this.orderCounter.toString().padStart(4, '0')}`;
  }

  generateId(): string {
    return uuidv4();
  }

  generateOrderNoPublic(): string {
    return this.generateOrderNo();
  }

  checkIdempotency(key: string): IdempotentRecord | null {
    return this.idempotentRecords.get(key) || null;
  }

  saveIdempotentRecord(
    key: string,
    action: string,
    response: any,
    orderId?: string
  ): IdempotentRecord {
    const record: IdempotentRecord = {
      key,
      action,
      orderId,
      response,
      timestamp: new Date().toISOString(),
    };
    this.idempotentRecords.set(key, record);
    return record;
  }

  addOrder(order: RecyclingOrder): RecyclingOrder {
    this.orders.set(order.id, order);
    return order;
  }

  getOrder(id: string): RecyclingOrder | undefined {
    return this.orders.get(id);
  }

  getOrderByNo(orderNo: string): RecyclingOrder | undefined {
    return Array.from(this.orders.values()).find(
      (o) => o.orderNo === orderNo
    );
  }

  listOrders(filters?: {
    status?: string[];
    role?: Role;
    userId?: string;
    urgency?: string;
  }): RecyclingOrder[] {
    let result = Array.from(this.orders.values());

    if (filters?.status && filters.status.length > 0) {
      result = result.filter((o) => filters.status!.includes(o.status));
    }

    if (filters?.role === 'RECEPTIONIST') {
      result = result.filter(
        (o) =>
          o.status === 'DRAFT' ||
          o.status === 'VALUATED' ||
          o.status === 'PENDING_CONFIRMATION' ||
          o.status === 'CONFIRMED' ||
          o.status === 'OBJECTED' ||
          o.status === 'RE_VALUATED'
      );
    } else if (filters?.role === 'PROCESSOR') {
      result = result.filter(
        (o) =>
          o.status === 'PENDING_VALUATION' ||
          o.status === 'VALUATED' ||
          o.status === 'OBJECTED' ||
          o.status === 'RE_VALUATED'
      );
    } else if (filters?.role === 'MANAGER') {
      // Manager sees all
    }

    if (filters?.urgency) {
      result = result.filter((o) => o.urgency === filters.urgency);
    }

    return result.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  updateOrder(id: string, updates: Partial<RecyclingOrder>): RecyclingOrder {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error(`Order ${id} not found`);
    }
    const updated = {
      ...order,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  addAuditLog(log: Omit<AuditLog, 'id'>): AuditLog {
    const auditLog: AuditLog = {
      ...log,
      id: this.generateId(),
    };
    this.auditLogs.set(auditLog.id, auditLog);
    return auditLog;
  }

  getAuditLogs(orderId: string): AuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter((l) => l.orderId === orderId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  private initializeSeedData(): void {
    const seedOrders: RecyclingOrder[] = [
      {
        id: this.generateId(),
        orderNo: this.generateOrderNo(),
        status: 'PENDING_VALUATION',
        receptionistId: 'rec-001',
        receptionistName: '李前台',
        customerName: '张先生',
        customerPhone: '13800138001',
        customerIdCard: '110101199001011234',
        device: {
          id: this.generateId(),
          category: 'PHONE',
          brand: 'Apple',
          model: 'iPhone 14 Pro',
          serialNumber: 'C8NHPX3JDTWF',
          condition: 'GOOD',
          purchaseDate: '2023-09-15',
          originalPrice: 7999,
          defects: ['屏幕有轻微划痕', '电池健康度85%'],
          accessories: ['充电器', '数据线', '包装盒'],
          imei: '356789012345678',
          storage: '256GB',
          color: '深空黑',
        },
        source: 'WALK_IN',
        urgency: 'URGENT',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        valuations: [],
        confirmations: [],
        tags: ['老客户', '高价值'],
      },
      {
        id: this.generateId(),
        orderNo: this.generateOrderNo(),
        status: 'PENDING_CONFIRMATION',
        receptionistId: 'rec-001',
        receptionistName: '李前台',
        customerName: '王女士',
        customerPhone: '13900139002',
        device: {
          id: this.generateId(),
          category: 'LAPTOP',
          brand: 'MacBook',
          model: 'MacBook Pro 14寸 M2',
          serialNumber: 'FVFYD02Q0J',
          condition: 'LIKE_NEW',
          purchaseDate: '2023-06-01',
          originalPrice: 14999,
          defects: ['底部有轻微磕碰'],
          accessories: ['充电器', '包装盒'],
          storage: '512GB',
          color: '银色',
        },
        currentValuationId: 'val-seed-002',
        source: 'ONLINE',
        urgency: 'NORMAL',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        valuations: [
          {
            id: 'val-seed-002',
            orderId: '',
            processorId: 'proc-001',
            processorName: '陈师傅',
            status: 'APPROVED',
            estimatedPrice: 9500,
            minPrice: 9000,
            maxPrice: 10000,
            inspectionItems: {
              screen: '完好',
              battery: '循环次数85',
              appearance: '轻微使用痕迹',
              function: '全部正常',
              waterproof: '未检测',
              idLocked: false,
              networkLocked: false,
            },
            remarks: [
              {
                id: 'remark-003',
                content: '客户说因为换新款所以出，机器爱护得很好，底部磕碰是放包里钥匙蹭的，功能全好。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-001',
                authorName: '陈师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                isVisibleToCustomer: true,
                isCritical: false,
              },
              {
                id: 'remark-004',
                content: 'M2芯片性能过剩，二手市场需求稳定，价格可以给到9500，客户心理预期是9000，有利润空间。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-001',
                authorName: '陈师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
                isVisibleToCustomer: false,
                isCritical: false,
              },
              {
                id: 'remark-005',
                content: '同意估价，注意确认时提醒客户数据备份。',
                authorRole: 'MANAGER',
                authorId: 'mgr-001',
                authorName: '刘店长',
                timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                isVisibleToCustomer: false,
                isCritical: false,
              },
            ],
            photos: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
            submittedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
            approvedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
            approvedBy: '刘店长',
            version: 1,
          },
        ],
        confirmations: [],
        tags: ['线上预约', 'Mac系列'],
      },
      {
        id: this.generateId(),
        orderNo: this.generateOrderNo(),
        status: 'OBJECTED',
        receptionistId: 'rec-002',
        receptionistName: '赵前台',
        customerName: '刘先生',
        customerPhone: '13700137003',
        device: {
          id: this.generateId(),
          category: 'PHONE',
          brand: '华为',
          model: 'Mate 60 Pro',
          serialNumber: '867890123456789',
          condition: 'FAIR',
          purchaseDate: '2023-10-01',
          originalPrice: 6999,
          defects: ['屏幕裂痕', '边框变形', '摄像头进灰'],
          accessories: ['充电器'],
          imei: '867890123456789',
          storage: '512GB',
          color: '雅川青',
        },
        currentValuationId: 'val-seed-003',
        source: 'WALK_IN',
        urgency: 'EMERGENCY',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        valuations: [
          {
            id: 'val-seed-003',
            orderId: '',
            processorId: 'proc-002',
            processorName: '王师傅',
            status: 'APPROVED',
            estimatedPrice: 2800,
            minPrice: 2500,
            maxPrice: 3000,
            inspectionItems: {
              screen: '外屏破裂，内屏显示正常',
              battery: '健康度78%',
              appearance: '边框两处变形',
              function: '通话、拍照正常',
              waterproof: '已破坏',
              idLocked: false,
              networkLocked: false,
            },
            remarks: [
              {
                id: 'remark-006',
                content: '屏幕需要更换（约800元），边框矫正（约200元），摄像头清灰（约50元），综合成本约1050元。修好后可以卖4200左右。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-002',
                authorName: '王师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
                isVisibleToCustomer: false,
                isCritical: true,
              },
              {
                id: 'remark-007',
                content: '屏幕外屏有裂痕，边框有轻微变形，功能都正常使用，我们检测后给出的回收价是2800元。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-002',
                authorName: '王师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
                isVisibleToCustomer: true,
                isCritical: false,
              },
            ],
            photos: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            approvedBy: '刘店长',
            version: 1,
          },
        ],
        confirmations: [
          {
            id: 'conf-seed-001',
            orderId: '',
            valuationId: 'val-seed-003',
            status: 'OBJECTED',
            customerName: '刘先生',
            customerPhone: '13700137003',
            objectionContent: '我这手机才买半年，买的时候6999，怎么才给2800？屏幕只是小裂痕，不影响使用啊！你们是不是故意压价？',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            confirmationMethod: 'ON_SITE',
            seenValuationRemarks: ['remark-007'],
          },
        ],
        tags: ['特急', '客户情绪激动', '需要重新估价'],
      },
      {
        id: this.generateId(),
        orderNo: this.generateOrderNo(),
        status: 'CONFIRMED',
        receptionistId: 'rec-001',
        receptionistName: '李前台',
        customerName: '陈先生',
        customerPhone: '13600136004',
        device: {
          id: this.generateId(),
          category: 'TABLET',
          brand: 'Apple',
          model: 'iPad Pro 11寸',
          serialNumber: 'DLXHPX3JDTWF',
          condition: 'LIKE_NEW',
          purchaseDate: '2024-01-15',
          originalPrice: 6799,
          defects: [],
          accessories: ['充电器', '数据线', '包装盒', 'Apple Pencil'],
          storage: '256GB',
          color: '深空灰',
        },
        currentValuationId: 'val-seed-004',
        source: 'REFERRAL',
        urgency: 'NORMAL',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        valuations: [
          {
            id: 'val-seed-004',
            orderId: '',
            processorId: 'proc-001',
            processorName: '陈师傅',
            status: 'APPROVED',
            estimatedPrice: 4800,
            minPrice: 4500,
            maxPrice: 5000,
            inspectionItems: {
              screen: '完美',
              battery: '循环次数23',
              appearance: '几乎全新',
              function: '全部正常',
              waterproof: '完好',
              idLocked: false,
              networkLocked: false,
            },
            remarks: [
              {
                id: 'remark-008',
                content: '朋友介绍来的，机器确实很新，基本没用过，连笔一起收了。价格可以顶一点给，4800没问题。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-001',
                authorName: '陈师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
                isVisibleToCustomer: false,
                isCritical: false,
              },
              {
                id: 'remark-009',
                content: '您的iPad保护得很好，我们给出的回收价是4800元，连Apple Pencil一起收。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-001',
                authorName: '陈师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
                isVisibleToCustomer: true,
                isCritical: false,
              },
            ],
            photos: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
            submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
            approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
            approvedBy: '刘店长',
            version: 1,
          },
        ],
        confirmations: [
          {
            id: 'conf-seed-002',
            orderId: '',
            valuationId: 'val-seed-004',
            status: 'CONFIRMED',
            customerName: '陈先生',
            customerPhone: '13600136004',
            confirmedPrice: 4800,
            confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
            confirmationMethod: 'ON_SITE',
            seenValuationRemarks: ['remark-009'],
          },
        ],
        tags: ['转介绍', '完美品相'],
        finalPrice: 4800,
      },
      {
        id: this.generateId(),
        orderNo: this.generateOrderNo(),
        status: 'COMPLETED',
        receptionistId: 'rec-002',
        receptionistName: '赵前台',
        customerName: '孙女士',
        customerPhone: '13500135005',
        device: {
          id: this.generateId(),
          category: 'CAMERA',
          brand: 'Sony',
          model: 'A7M4',
          serialNumber: '456789012345',
          condition: 'GOOD',
          purchaseDate: '2022-11-20',
          originalPrice: 16999,
          defects: ['机身有轻微使用痕迹', '快门次数约1.2万'],
          accessories: ['充电器', '数据线', '包装盒', '说明书', '原装电池×2'],
          storage: '',
          color: '黑色',
        },
        currentValuationId: 'val-seed-005',
        source: 'ONLINE',
        urgency: 'NORMAL',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        valuations: [
          {
            id: 'val-seed-005',
            orderId: '',
            processorId: 'proc-002',
            processorName: '王师傅',
            status: 'APPROVED',
            estimatedPrice: 9500,
            minPrice: 9000,
            maxPrice: 10000,
            inspectionItems: {
              screen: '完好',
              battery: '状态良好',
              appearance: '轻微使用痕迹',
              function: '全部正常',
              waterproof: '未检测',
              idLocked: false,
              networkLocked: false,
            },
            remarks: [
              {
                id: 'remark-010',
                content: '快门次数正常，CMOS干净，两块原装电池加分。近期二手市场A7M4价格稳定，9500好出。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-002',
                authorName: '王师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
                isVisibleToCustomer: false,
                isCritical: false,
              },
              {
                id: 'remark-011',
                content: '相机检测状态良好，快门次数约1.2万次，两块原装电池都在，我们给出的回收价是9500元。',
                authorRole: 'PROCESSOR',
                authorId: 'proc-002',
                authorName: '王师傅',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
                isVisibleToCustomer: true,
                isCritical: false,
              },
            ],
            photos: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            approvedBy: '刘店长',
            version: 1,
          },
        ],
        confirmations: [
          {
            id: 'conf-seed-003',
            orderId: '',
            valuationId: 'val-seed-005',
            status: 'CONFIRMED',
            customerName: '孙女士',
            customerPhone: '13500135005',
            confirmedPrice: 9500,
            confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
            confirmationMethod: 'ONLINE',
            seenValuationRemarks: ['remark-011'],
          },
        ],
        tags: ['线上', '相机', '已完成'],
        finalPrice: 9500,
      },
    ];

    seedOrders.forEach((order) => {
      order.valuations.forEach((v) => (v.orderId = order.id));
      order.confirmations.forEach((c) => (c.orderId = order.id));
      this.orders.set(order.id, order);
    });

    const seedAuditLogs: Omit<AuditLog, 'id'>[] = [
      {
        orderId: seedOrders[2].id,
        actorRole: 'PROCESSOR',
        actorId: 'proc-002',
        actorName: '王师傅',
        action: '创建估价',
        newValue: { valuationId: 'val-seed-003' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        idempotencyKey: 'idem-seed-001',
      },
      {
        orderId: seedOrders[2].id,
        actorRole: 'PROCESSOR',
        actorId: 'proc-002',
        actorName: '王师傅',
        action: '提交估价',
        oldValue: { status: 'DRAFT' },
        newValue: { status: 'SUBMITTED' },
        field: 'valuation.status',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        idempotencyKey: 'idem-seed-002',
      },
      {
        orderId: seedOrders[2].id,
        actorRole: 'MANAGER',
        actorId: 'mgr-001',
        actorName: '刘店长',
        action: '审批估价通过',
        oldValue: { status: 'SUBMITTED' },
        newValue: { status: 'APPROVED' },
        field: 'valuation.status',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        idempotencyKey: 'idem-seed-003',
      },
      {
        orderId: seedOrders[2].id,
        actorRole: 'RECEPTIONIST',
        actorId: 'rec-002',
        actorName: '赵前台',
        action: '发起客户确认',
        oldValue: { status: 'VALUATED' },
        newValue: { status: 'PENDING_CONFIRMATION' },
        field: 'order.status',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
        idempotencyKey: 'idem-seed-004',
      },
      {
        orderId: seedOrders[2].id,
        actorRole: 'RECEPTIONIST',
        actorId: 'rec-002',
        actorName: '赵前台',
        action: '客户提出异议',
        oldValue: { status: 'PENDING_CONFIRMATION' },
        newValue: { status: 'OBJECTED' },
        field: 'order.status',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        idempotencyKey: 'idem-seed-005',
      },
      {
        orderId: seedOrders[2].id,
        actorRole: 'RECEPTIONIST',
        actorId: 'rec-002',
        actorName: '赵前台',
        action: '记录客户异议',
        newValue: {
          objection:
            '我这手机才买半年，买的时候6999，怎么才给2800？屏幕只是小裂痕，不影响使用啊！你们是不是故意压价？',
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        idempotencyKey: 'idem-seed-006',
      },
    ];

    seedAuditLogs.forEach((log) => this.addAuditLog(log));
  }
}

export const db = new Database();
