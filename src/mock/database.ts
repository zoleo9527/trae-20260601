import {
  User,
  UserRole,
  Customer,
  Order,
  OrderStatus,
  MeasureRecord,
  AppointmentRecord,
  ScheduleRecord,
  ReturnRecord,
  ReturnReason,
  SupplementRecord,
  AuditLog,
  AuditAction,
} from '../types';

export const mockUsers: User[] = [
  {
    id: 'U-001',
    name: '王小美',
    phone: '13800000001',
    role: UserRole.SALES_GUIDE,
    storeId: 'STORE-001',
  },
  {
    id: 'U-002',
    name: '李芳',
    phone: '13800000002',
    role: UserRole.SALES_GUIDE,
    storeId: 'STORE-001',
  },
  {
    id: 'U-003',
    name: '张大刚',
    phone: '13800000003',
    role: UserRole.MEASURER,
    storeId: 'STORE-001',
  },
  {
    id: 'U-004',
    name: '陈志远',
    phone: '13800000004',
    role: UserRole.INSTALLER,
    storeId: 'STORE-001',
  },
  {
    id: 'U-005',
    name: '刘师傅',
    phone: '13800000005',
    role: UserRole.INSTALLER,
    storeId: 'STORE-001',
  },
  {
    id: 'U-006',
    name: '孙明辉',
    phone: '13800000006',
    role: UserRole.STORE_MANAGER,
    storeId: 'STORE-001',
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'C-001',
    name: '赵女士',
    phone: '13900000001',
    address: '北京市朝阳区阳光花园小区3号楼2单元1801',
  },
  {
    id: 'C-002',
    name: '钱先生',
    phone: '13900000002',
    address: '北京市海淀区中关村科技园A座12层1205',
  },
  {
    id: 'C-003',
    name: '孙女士',
    phone: '13900000003',
    address: '北京市丰台区南三环西路16号院5号楼8层802',
  },
];

const now = new Date();
const daysAgo = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
};
const daysLater = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    orderNo: 'CL-20260615-001',
    storeId: 'STORE-001',
    customerId: 'C-001',
    customerSnapshot: mockCustomers[0],
    salesGuideId: 'U-001',
    status: OrderStatus.CREATED,
    productItems: [
      { name: '亚麻遮光窗帘', specification: '宽2.5m x 高2.8m', quantity: 2, unitPrice: 680 },
      { name: '纱帘', specification: '宽2.5m x 高2.8m', quantity: 2, unitPrice: 280 },
    ],
    totalAmount: 1920,
    supplementRecords: [],
    remarkRecords: [],
    auditLogs: [
      {
        id: 'A-001',
        orderId: 'ORD-001',
        action: AuditAction.ORDER_CREATE,
        operatorId: 'U-001',
        operatorRole: UserRole.SALES_GUIDE,
        operatorName: '王小美',
        payload: { source: '门店签单', totalAmount: 1920 },
        timestamp: daysAgo(3),
      },
    ],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'ORD-002',
    orderNo: 'CL-20260614-002',
    storeId: 'STORE-001',
    customerId: 'C-002',
    customerSnapshot: mockCustomers[1],
    salesGuideId: 'U-002',
    status: OrderStatus.MEASURED,
    productItems: [
      { name: '天鹅绒高精密窗帘', specification: '宽3.2m x 高3.0m', quantity: 1, unitPrice: 1580 },
      { name: '罗马杆', specification: '黑色 3.2m', quantity: 1, unitPrice: 260 },
    ],
    totalAmount: 1840,
    measureRecord: {
      id: 'M-002',
      orderId: 'ORD-002',
      measurerId: 'U-003',
      measuredAt: daysAgo(1),
      windows: [
        {
          position: '办公室落地窗',
          widthCm: 320,
          heightCm: 300,
          curtainStyle: '对开 + 幔头',
          remarks: '左侧有空调管需避让',
        },
      ],
      notes: '墙面为大理石，安装需专用钻头',
    },
    supplementRecords: [],
    remarkRecords: [],
    auditLogs: [
      {
        id: 'A-002',
        orderId: 'ORD-002',
        action: AuditAction.ORDER_CREATE,
        operatorId: 'U-002',
        operatorRole: UserRole.SALES_GUIDE,
        operatorName: '李芳',
        payload: { source: '老客户介绍', totalAmount: 1840 },
        timestamp: daysAgo(5),
      },
      {
        id: 'A-003',
        orderId: 'ORD-002',
        action: AuditAction.ORDER_MEASURE,
        operatorId: 'U-003',
        operatorRole: UserRole.MEASURER,
        operatorName: '张大刚',
        payload: { windows: 1, totalWidth: 320 },
        timestamp: daysAgo(1),
      },
    ],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  },
  {
    id: 'ORD-003',
    orderNo: 'CL-20260612-003',
    storeId: 'STORE-001',
    customerId: 'C-003',
    customerSnapshot: mockCustomers[2],
    salesGuideId: 'U-001',
    status: OrderStatus.REMINDED,
    productItems: [
      { name: '棉麻混纺窗帘', specification: '宽2.0m x 高2.6m', quantity: 3, unitPrice: 520 },
      { name: '轨道', specification: '静音轨道 2.0m', quantity: 3, unitPrice: 120 },
    ],
    totalAmount: 1920,
    measureRecord: {
      id: 'M-003',
      orderId: 'ORD-003',
      measurerId: 'U-003',
      measuredAt: daysAgo(8),
      windows: [
        { position: '主卧', widthCm: 200, heightCm: 260, curtainStyle: '单开' },
        { position: '次卧', widthCm: 200, heightCm: 260, curtainStyle: '单开' },
        { position: '客厅', widthCm: 200, heightCm: 260, curtainStyle: '单开', remarks: '需留窗帘盒空间' },
      ],
    },
    appointment: {
      id: 'A-003',
      orderId: 'ORD-003',
      createdBy: 'U-001',
      preferredDate: daysLater(2).slice(0, 10),
      preferredTimeSlot: '14:00-16:00',
      backupDate: daysLater(3).slice(0, 10),
      backupTimeSlot: '10:00-12:00',
      customerConfirmedAt: daysAgo(5),
      notes: '客户周末在家',
      createdAt: daysAgo(6),
      updatedAt: daysAgo(6),
    },
    schedule: {
      id: 'S-003',
      orderId: 'ORD-003',
      installerId: 'U-004',
      assignedBy: 'U-006',
      scheduledDate: daysLater(2).slice(0, 10),
      timeSlot: '14:00-16:00',
      estimatedDurationHours: 3,
      status: 'PENDING',
      travelNotes: '南三环西路约30分钟车程',
      toolChecklist: ['电钻', '螺丝刀', '水平仪', '专用钻头'],
      assignedAt: daysAgo(5),
      updatedAt: daysAgo(2),
    },
    supplementRecords: [],
    remarkRecords: [
      {
        id: 'R-003',
        orderId: 'ORD-003',
        createdBy: 'U-006',
        content: '客户今早来电催促安装，希望能提前到明天上午',
        createdAt: daysAgo(2),
      },
    ],
    auditLogs: [
      {
        id: 'A-004',
        orderId: 'ORD-003',
        action: AuditAction.ORDER_CREATE,
        operatorId: 'U-001',
        operatorRole: UserRole.SALES_GUIDE,
        operatorName: '王小美',
        payload: { totalAmount: 1920 },
        timestamp: daysAgo(10),
      },
      {
        id: 'A-005',
        orderId: 'ORD-003',
        action: AuditAction.ORDER_MEASURE,
        operatorId: 'U-003',
        operatorRole: UserRole.MEASURER,
        operatorName: '张大刚',
        payload: { windows: 3 },
        timestamp: daysAgo(8),
      },
      {
        id: 'A-006',
        orderId: 'ORD-003',
        action: AuditAction.APPOINTMENT_CREATE,
        operatorId: 'U-001',
        operatorRole: UserRole.SALES_GUIDE,
        operatorName: '王小美',
        payload: { date: daysLater(2).slice(0, 10), timeSlot: '14:00-16:00' },
        timestamp: daysAgo(6),
      },
      {
        id: 'A-007',
        orderId: 'ORD-003',
        action: AuditAction.SCHEDULE_ASSIGN,
        operatorId: 'U-006',
        operatorRole: UserRole.STORE_MANAGER,
        operatorName: '孙明辉',
        payload: { installerId: 'U-004', installerName: '陈志远' },
        timestamp: daysAgo(5),
      },
      {
        id: 'A-008',
        orderId: 'ORD-003',
        action: AuditAction.INSTALLATION_REMIND,
        operatorId: 'U-006',
        operatorRole: UserRole.STORE_MANAGER,
        operatorName: '孙明辉',
        payload: { reason: '客户催促安装', previousStatus: OrderStatus.INSTALLATION_SCHEDULED },
        timestamp: daysAgo(2),
      },
      {
        id: 'A-009',
        orderId: 'ORD-003',
        action: AuditAction.REMARK_ADD,
        operatorId: 'U-006',
        operatorRole: UserRole.STORE_MANAGER,
        operatorName: '孙明辉',
        payload: { remarkId: 'R-003' },
        timestamp: daysAgo(2),
      },
    ],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
];

export class MockDatabase {
  private users: Map<string, User>;
  private customers: Map<string, Customer>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map(mockUsers.map(u => [u.id, u]));
    this.customers = new Map(mockCustomers.map(c => [c.id, c]));
    this.orders = new Map(mockOrders.map(o => [o.id, JSON.parse(JSON.stringify(o))]));
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUsersByRole(role: UserRole): User[] {
    return Array.from(this.users.values()).filter(u => u.role === role);
  }

  getCustomer(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getOrderByNo(orderNo: string): Order | undefined {
    return Array.from(this.orders.values()).find(o => o.orderNo === orderNo);
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrdersByStatus(status: OrderStatus): Order[] {
    return Array.from(this.orders.values()).filter(o => o.status === status);
  }

  getOrdersBySalesGuide(salesGuideId: string): Order[] {
    return Array.from(this.orders.values()).filter(o => o.salesGuideId === salesGuideId);
  }

  getOrdersByInstaller(installerId: string): Order[] {
    return Array.from(this.orders.values()).filter(o => o.schedule?.installerId === installerId);
  }

  saveOrder(order: Order): Order {
    order.updatedAt = new Date().toISOString();
    this.orders.set(order.id, order);
    return order;
  }

  generateId(prefix: string): string {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
  }

  generateOrderNo(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = Array.from(this.orders.values()).filter(o =>
      o.orderNo.startsWith(`CL-${today}`)
    ).length + 1;
    return `CL-${today}-${String(count).padStart(3, '0')}`;
  }
}
