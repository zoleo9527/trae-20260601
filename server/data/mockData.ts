import type {
  Order,
  CustomsDocument,
  InventoryItem,
  OrderStatus,
  CustomsStatus,
  ResponsibilityFlag,
  UserRole,
  TimelineEventType,
  TimelineEvent,
} from '../../types';

const OPERATORS = {
  '运营-李明': 'operation' as UserRole,
  '运营-王芳': 'operation' as UserRole,
  '关务-张伟': 'customs' as UserRole,
  '关务-刘静': 'customs' as UserRole,
  '仓配-陈强': 'warehouse' as UserRole,
};

const PLATFORMS = ['亚马逊', 'Shopify', '速卖通', 'eBay'];
const COUNTRIES = ['US', 'UK', 'DE', 'FR', 'JP'];
const CURRENCIES: Record<string, string> = {
  US: 'USD',
  UK: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  JP: 'JPY',
};

const PRODUCTS = [
  { sku: 'SKU001', name: '无线蓝牙耳机', price: 29.99 },
  { sku: 'SKU002', name: '智能手表', price: 89.99 },
  { sku: 'SKU003', name: '手机壳', price: 12.99 },
  { sku: 'SKU004', name: '数据线套装', price: 19.99 },
  { sku: 'SKU005', name: '移动电源', price: 39.99 },
  { sku: 'SKU006', name: '蓝牙音箱', price: 49.99 },
  { sku: 'SKU007', name: '笔记本支架', price: 25.99 },
  { sku: 'SKU008', name: '键盘保护膜', price: 9.99 },
  { sku: 'SKU009', name: '鼠标垫', price: 14.99 },
  { sku: 'SKU010', name: '摄像头', price: 59.99 },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function createTimelineEvent(
  type: TimelineEventType,
  title: string,
  description: string,
  operator: string,
  timestamp: string,
  metadata?: Record<string, any>
): TimelineEvent {
  return {
    id: generateId(),
    type,
    title,
    description,
    operator,
    operatorRole: operator === '系统' ? 'system' : OPERATORS[operator as keyof typeof OPERATORS] || 'system',
    timestamp,
    metadata,
  };
}

function createCompletedOrders(): Order[] {
  const orders: Order[] = [];
  const baseTime = new Date('2026-05-10T10:00:00');

  for (let i = 0; i < 5; i++) {
    const orderNo = `CB202605${String(1001 + i).padStart(4, '0')}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const platform = PLATFORMS[i % PLATFORMS.length];
    const product = PRODUCTS[i % PRODUCTS.length];
    const quantity = Math.floor(Math.random() * 3) + 1;

    const timeline: TimelineEvent[] = [
      createTimelineEvent(
        'system',
        '订单创建',
        `从${platform}平台同步订单`,
        '系统',
        new Date(baseTime.getTime() + i * 86400000).toISOString()
      ),
      createTimelineEvent(
        'sync',
        '订单同步成功',
        `订单信息已同步至ERP系统`,
        '运营-李明',
        new Date(baseTime.getTime() + i * 86400000 + 3600000).toISOString()
      ),
      createTimelineEvent(
        'status_change',
        '状态变更',
        '订单状态变更为待报关',
        '运营-王芳',
        new Date(baseTime.getTime() + i * 86400000 + 86400000).toISOString(),
        { from: 'synced', to: 'pending_customs' }
      ),
      createTimelineEvent(
        'customs',
        '报关资料提交',
        '报关资料已准备并提交审核',
        '关务-张伟',
        new Date(baseTime.getTime() + i * 86400000 + 172800000).toISOString()
      ),
      createTimelineEvent(
        'customs',
        '报关审核通过',
        '海关审核通过，货物已放行',
        '关务-刘静',
        new Date(baseTime.getTime() + i * 86400000 + 259200000).toISOString()
      ),
      createTimelineEvent(
        'comment',
        '发货备注',
        '货物已交由物流商派送',
        '仓配-陈强',
        new Date(baseTime.getTime() + i * 86400000 + 345600000).toISOString()
      ),
      createTimelineEvent(
        'status_change',
        '订单完成',
        '订单已完成全部流程',
        '系统',
        new Date(baseTime.getTime() + i * 86400000 + 432000000).toISOString(),
        { from: 'customs_processing', to: 'completed' }
      ),
    ];

    orders.push({
      id: generateId(),
      orderNo,
      platform,
      platformOrderNo: `${platform.toUpperCase().slice(0, 2)}-${Date.now()}-${i}`,
      buyerName: `买家${i + 1}`,
      buyerCountry: country,
      totalAmount: product.price * quantity,
      currency: CURRENCIES[country],
      skuList: [
        {
          sku: product.sku,
          name: product.name,
          quantity,
          price: product.price,
        },
      ],
      status: 'completed',
      responsibilityFlag: 'none',
      syncCount: 1,
      lastSyncAt: new Date(baseTime.getTime() + i * 86400000 + 3600000).toISOString(),
      createdAt: new Date(baseTime.getTime() + i * 86400000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + i * 86400000 + 432000000).toISOString(),
      timeline,
    });
  }

  return orders;
}

function createSyncFailedOrders(): Order[] {
  const orders: Order[] = [];
  const baseTime = new Date('2026-06-01T09:00:00');

  for (let i = 0; i < 3; i++) {
    const orderNo = `CB202605${String(1006 + i).padStart(4, '0')}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const platform = PLATFORMS[i % PLATFORMS.length];
    const product = PRODUCTS[(i + 5) % PRODUCTS.length];

    const timeline: TimelineEvent[] = [
      createTimelineEvent(
        'system',
        '订单创建',
        `从${platform}平台同步订单`,
        '系统',
        new Date(baseTime.getTime() + i * 3600000).toISOString()
      ),
      createTimelineEvent(
        'sync',
        '首次同步失败',
        '平台API接口超时，同步失败',
        '系统',
        new Date(baseTime.getTime() + i * 3600000 + 600000).toISOString(),
        { error: 'API_TIMEOUT', retryCount: 1 }
      ),
      createTimelineEvent(
        'sync',
        '第二次同步失败',
        '订单数据格式异常，需要人工处理',
        '运营-李明',
        new Date(baseTime.getTime() + i * 3600000 + 1800000).toISOString(),
        { error: 'DATA_FORMAT_ERROR', retryCount: 2 }
      ),
      createTimelineEvent(
        'comment',
        '异常备注',
        '订单金额字段缺失，已联系平台技术支持',
        '运营-王芳',
        new Date(baseTime.getTime() + i * 3600000 + 3600000).toISOString()
      ),
    ];

    orders.push({
      id: generateId(),
      orderNo,
      platform,
      platformOrderNo: `${platform.toUpperCase().slice(0, 2)}-${Date.now()}-${i + 10}`,
      buyerName: `买家${6 + i}`,
      buyerCountry: country,
      totalAmount: product.price * 2,
      currency: CURRENCIES[country],
      skuList: [
        {
          sku: product.sku,
          name: product.name,
          quantity: 2,
          price: product.price,
        },
      ],
      status: 'sync_failed',
      responsibilityFlag: 'none',
      syncCount: 3,
      lastSyncAt: new Date(baseTime.getTime() + i * 3600000 + 1800000).toISOString(),
      createdAt: new Date(baseTime.getTime() + i * 3600000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + i * 3600000 + 3600000).toISOString(),
      timeline,
    });
  }

  return orders;
}

function createPendingCustomsOrders(): Order[] {
  const orders: Order[] = [];
  const baseTime = new Date('2026-06-03T08:00:00');

  for (let i = 0; i < 4; i++) {
    const orderNo = `CB202605${String(1009 + i).padStart(4, '0')}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const platform = PLATFORMS[(i + 2) % PLATFORMS.length];
    const product = PRODUCTS[(i + 3) % PRODUCTS.length];

    const timeline: TimelineEvent[] = [
      createTimelineEvent(
        'system',
        '订单创建',
        `从${platform}平台同步订单`,
        '系统',
        new Date(baseTime.getTime() + i * 7200000).toISOString()
      ),
      createTimelineEvent(
        'sync',
        '订单同步成功',
        `订单信息已同步至ERP系统`,
        '运营-李明',
        new Date(baseTime.getTime() + i * 7200000 + 1800000).toISOString()
      ),
      createTimelineEvent(
        'status_change',
        '状态变更',
        '订单状态变更为待报关',
        '运营-王芳',
        new Date(baseTime.getTime() + i * 7200000 + 3600000).toISOString(),
        { from: 'synced', to: 'pending_customs' }
      ),
      createTimelineEvent(
        'comment',
        '待处理备注',
        '等待关务人员处理报关资料',
        '运营-李明',
        new Date(baseTime.getTime() + i * 7200000 + 5400000).toISOString()
      ),
    ];

    orders.push({
      id: generateId(),
      orderNo,
      platform,
      platformOrderNo: `${platform.toUpperCase().slice(0, 2)}-${Date.now()}-${i + 20}`,
      buyerName: `买家${9 + i}`,
      buyerCountry: country,
      totalAmount: product.price * (Math.floor(Math.random() * 2) + 1),
      currency: CURRENCIES[country],
      skuList: [
        {
          sku: product.sku,
          name: product.name,
          quantity: Math.floor(Math.random() * 2) + 1,
          price: product.price,
        },
      ],
      status: 'pending_customs',
      responsibilityFlag: 'none',
      syncCount: 1,
      lastSyncAt: new Date(baseTime.getTime() + i * 7200000 + 1800000).toISOString(),
      createdAt: new Date(baseTime.getTime() + i * 7200000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + i * 7200000 + 5400000).toISOString(),
      timeline,
    });
  }

  return orders;
}

function createPendingConfirmOrders(): Order[] {
  const orders: Order[] = [];
  const baseTime = new Date('2026-06-02T10:00:00');
  const twentyFiveHoursAgo = new Date(Date.now() - 25 * 3600000);

  for (let i = 0; i < 2; i++) {
    const orderNo = `CB202605${String(1013 + i).padStart(4, '0')}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const platform = PLATFORMS[i % PLATFORMS.length];
    const product = PRODUCTS[(i + 7) % PRODUCTS.length];

    const timeline: TimelineEvent[] = [
      createTimelineEvent(
        'system',
        '订单创建',
        `从${platform}平台同步订单`,
        '系统',
        new Date(baseTime.getTime() + i * 43200000).toISOString()
      ),
      createTimelineEvent(
        'sync',
        '订单同步成功',
        `订单信息已同步至ERP系统`,
        '运营-李明',
        new Date(baseTime.getTime() + i * 43200000 + 3600000).toISOString()
      ),
      createTimelineEvent(
        'status_change',
        '状态变更',
        '订单状态变更为待报关',
        '运营-王芳',
        new Date(baseTime.getTime() + i * 43200000 + 86400000).toISOString(),
        { from: 'synced', to: 'pending_customs' }
      ),
      createTimelineEvent(
        'responsibility',
        '责任待确认',
        '订单同步已超过24小时未处理，请相关人员确认责任归属',
        '系统',
        twentyFiveHoursAgo.toISOString(),
        { trigger: 'timeout_24h' }
      ),
      createTimelineEvent(
        'comment',
        '责任确认中',
        '正在核实该订单的处理责任归属',
        '运营-王芳',
        new Date(twentyFiveHoursAgo.getTime() + 3600000).toISOString()
      ),
    ];

    orders.push({
      id: generateId(),
      orderNo,
      platform,
      platformOrderNo: `${platform.toUpperCase().slice(0, 2)}-${Date.now()}-${i + 30}`,
      buyerName: `买家${13 + i}`,
      buyerCountry: country,
      totalAmount: product.price * 2,
      currency: CURRENCIES[country],
      skuList: [
        {
          sku: product.sku,
          name: product.name,
          quantity: 2,
          price: product.price,
        },
      ],
      status: 'pending_customs',
      responsibilityFlag: 'pending_confirm',
      syncCount: 1,
      lastSyncAt: new Date(baseTime.getTime() + i * 43200000 + 3600000).toISOString(),
      createdAt: new Date(baseTime.getTime() + i * 43200000).toISOString(),
      updatedAt: new Date(twentyFiveHoursAgo.getTime() + 3600000).toISOString(),
      timeline,
    });
  }

  return orders;
}

function createRejectedOrder(): Order {
  const baseTime = new Date('2026-06-04T14:00:00');
  const orderNo = 'CB2026050015';
  const country = 'DE';
  const platform = '亚马逊';
  const product = PRODUCTS[4];

  const timeline: TimelineEvent[] = [
    createTimelineEvent(
      'system',
      '订单创建',
      `从${platform}平台同步订单`,
      '系统',
      baseTime.toISOString()
    ),
    createTimelineEvent(
      'sync',
      '订单同步成功',
      `订单信息已同步至ERP系统`,
      '运营-李明',
      new Date(baseTime.getTime() + 3600000).toISOString()
    ),
    createTimelineEvent(
      'status_change',
      '状态变更',
      '订单状态变更为待报关',
      '运营-王芳',
      new Date(baseTime.getTime() + 86400000).toISOString(),
      { from: 'synced', to: 'pending_customs' }
    ),
    createTimelineEvent(
      'customs',
      '报关资料提交',
      '报关资料已准备并提交审核',
      '关务-张伟',
      new Date(baseTime.getTime() + 172800000).toISOString()
    ),
    createTimelineEvent(
      'customs',
      '报关驳回',
      'HS编码与商品描述不符，需要重新提交',
      '关务-刘静',
      new Date(baseTime.getTime() + 259200000).toISOString(),
      { reason: 'HS_CODE_MISMATCH', rejectCount: 1 }
    ),
    createTimelineEvent(
      'comment',
      '驳回处理',
      '正在重新核对商品信息和HS编码',
      '关务-张伟',
      new Date(baseTime.getTime() + 288000000).toISOString()
    ),
  ];

  return {
    id: generateId(),
    orderNo,
    platform,
    platformOrderNo: `${platform.toUpperCase().slice(0, 2)}-${Date.now()}-99`,
    buyerName: '买家15',
    buyerCountry: country,
    totalAmount: product.price * 3,
    currency: CURRENCIES[country],
    skuList: [
      {
        sku: product.sku,
        name: product.name,
        quantity: 3,
        price: product.price,
      },
    ],
    status: 'exception',
    responsibilityFlag: 'customs',
    syncCount: 1,
    lastSyncAt: new Date(baseTime.getTime() + 3600000).toISOString(),
    createdAt: baseTime.toISOString(),
    updatedAt: new Date(baseTime.getTime() + 288000000).toISOString(),
    timeline,
  };
}

function createCustomsDocuments(): CustomsDocument[] {
  const documents: CustomsDocument[] = [];
  const orders = [
    ...createCompletedOrders(),
    ...createPendingCustomsOrders(),
    createRejectedOrder(),
  ];

  const baseTime = new Date('2026-05-15T10:00:00');

  for (let i = 0; i < 5; i++) {
    const order = orders[i];
    const docNo = `BG202605${String(1001 + i).padStart(4, '0')}`;

    const timeline: TimelineEvent[] = [
      createTimelineEvent(
        'system',
        '报关单创建',
        '系统自动生成报关单草稿',
        '系统',
        new Date(baseTime.getTime() + i * 86400000).toISOString()
      ),
      createTimelineEvent(
        'status_change',
        '提交审核',
        '报关资料已提交审核',
        '关务-张伟',
        new Date(baseTime.getTime() + i * 86400000 + 3600000).toISOString(),
        { from: 'draft', to: 'pending_review' }
      ),
      createTimelineEvent(
        'customs',
        '审核通过',
        '报关资料审核通过',
        '关务-刘静',
        new Date(baseTime.getTime() + i * 86400000 + 7200000).toISOString(),
        { version: 1 }
      ),
    ];

    documents.push({
      id: generateId(),
      orderId: order.id,
      orderNo: order.orderNo,
      version: 1,
      status: 'completed',
      declarationNo: `${docNo}-V1`,
      exporter: '深圳某贸易有限公司',
      importer: `${order.buyerCountry} Import Co.`,
      goodsDescription: order.skuList.map(s => s.name).join(', '),
      hsCode: '8517629000',
      declaredValue: order.totalAmount,
      currency: order.currency,
      weight: order.skuList.reduce((sum, s) => sum + s.quantity * 0.5, 0),
      quantity: order.skuList.reduce((sum, s) => sum + s.quantity, 0),
      submitter: '关务-张伟',
      reviewer: '关务-刘静',
      reviewComment: '资料齐全，同意放行',
      createdAt: new Date(baseTime.getTime() + i * 86400000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + i * 86400000 + 7200000).toISOString(),
      timeline,
    });

    if (i < 2) {
      documents.push({
        id: generateId(),
        orderId: order.id,
        orderNo: order.orderNo,
        version: 2,
        status: 'completed',
        declarationNo: `${docNo}-V2`,
        exporter: '深圳某贸易有限公司',
        importer: `${order.buyerCountry} Import Co.`,
        goodsDescription: order.skuList.map(s => s.name).join(', ') + '（更新版）',
        hsCode: '8517629000',
        declaredValue: order.totalAmount,
        currency: order.currency,
        weight: order.skuList.reduce((sum, s) => sum + s.quantity * 0.5, 0),
        quantity: order.skuList.reduce((sum, s) => sum + s.quantity, 0),
        submitter: '关务-张伟',
        reviewer: '关务-刘静',
        reviewComment: '更新商品描述后审核通过',
        createdAt: new Date(baseTime.getTime() + i * 86400000 + 86400000).toISOString(),
        updatedAt: new Date(baseTime.getTime() + i * 86400000 + 172800000).toISOString(),
        timeline: [
          ...timeline,
          createTimelineEvent(
            'status_change',
            '版本更新',
            '更新报关资料并重新提交',
            '关务-张伟',
            new Date(baseTime.getTime() + i * 86400000 + 86400000).toISOString(),
            { version: 2 }
          ),
          createTimelineEvent(
            'customs',
            '审核通过',
            '更新后的报关资料审核通过',
            '关务-刘静',
            new Date(baseTime.getTime() + i * 86400000 + 172800000).toISOString(),
            { version: 2 }
          ),
        ],
      });
    }
  }

  for (let i = 0; i < 3; i++) {
    const order = orders[5 + i];
    const docNo = `BG202605${String(1006 + i).padStart(4, '0')}`;

    documents.push({
      id: generateId(),
      orderId: order.id,
      orderNo: order.orderNo,
      version: 1,
      status: 'pending_review',
      exporter: '深圳某贸易有限公司',
      importer: `${order.buyerCountry} Import Co.`,
      goodsDescription: order.skuList.map(s => s.name).join(', '),
      hsCode: '8517629000',
      declaredValue: order.totalAmount,
      currency: order.currency,
      weight: order.skuList.reduce((sum, s) => sum + s.quantity * 0.5, 0),
      quantity: order.skuList.reduce((sum, s) => sum + s.quantity, 0),
      submitter: '关务-张伟',
      createdAt: new Date(baseTime.getTime() + (5 + i) * 86400000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + (5 + i) * 86400000 + 3600000).toISOString(),
      timeline: [
        createTimelineEvent(
          'system',
          '报关单创建',
          '系统自动生成报关单草稿',
          '系统',
          new Date(baseTime.getTime() + (5 + i) * 86400000).toISOString()
        ),
        createTimelineEvent(
          'status_change',
          '提交审核',
          '报关资料已提交审核，等待处理',
          '关务-张伟',
          new Date(baseTime.getTime() + (5 + i) * 86400000 + 3600000).toISOString(),
          { from: 'draft', to: 'pending_review' }
        ),
      ],
    });
  }

  for (let i = 0; i < 2; i++) {
    const order = orders[8 + i];
    const docNo = `BG202605${String(1009 + i).padStart(4, '0')}`;

    documents.push({
      id: generateId(),
      orderId: order.id,
      orderNo: order.orderNo,
      version: 1,
      status: 'draft',
      exporter: '深圳某贸易有限公司',
      importer: `${order.buyerCountry} Import Co.`,
      goodsDescription: order.skuList.map(s => s.name).join(', '),
      hsCode: '8517629000',
      declaredValue: order.totalAmount,
      currency: order.currency,
      weight: order.skuList.reduce((sum, s) => sum + s.quantity * 0.5, 0),
      quantity: order.skuList.reduce((sum, s) => sum + s.quantity, 0),
      createdAt: new Date(baseTime.getTime() + (8 + i) * 86400000).toISOString(),
      updatedAt: new Date(baseTime.getTime() + (8 + i) * 86400000 + 1800000).toISOString(),
      timeline: [
        createTimelineEvent(
          'system',
          '报关单创建',
          '系统自动生成报关单草稿',
          '系统',
          new Date(baseTime.getTime() + (8 + i) * 86400000).toISOString()
        ),
        createTimelineEvent(
          'comment',
          '草稿编辑中',
          '正在完善报关资料信息',
          '关务-张伟',
          new Date(baseTime.getTime() + (8 + i) * 86400000 + 1800000).toISOString()
        ),
      ],
    });
  }

  return documents;
}

function createInventoryItems(): InventoryItem[] {
  const items: InventoryItem[] = [];
  const warehouses = ['深圳仓库', '义乌仓库', '广州仓库'];
  const baseTime = new Date('2026-06-05T08:00:00');

  for (let i = 0; i < 20; i++) {
    const product = PRODUCTS[i % PRODUCTS.length];
    const warehouse = warehouses[i % warehouses.length];
    const isWarning = i < 3;
    const quantity = isWarning ? 5 : Math.floor(Math.random() * 500) + 50;
    const reservedQuantity = Math.floor(quantity * 0.2);
    const warningThreshold = isWarning ? 20 : 10;

    items.push({
      id: generateId(),
      sku: `${product.sku}-${String(i + 1).padStart(3, '0')}`,
      productName: `${product.name}（${warehouse}）`,
      warehouse,
      quantity,
      reservedQuantity,
      availableQuantity: quantity - reservedQuantity,
      lastUpdated: new Date(baseTime.getTime() + i * 3600000).toISOString(),
      warningThreshold,
    });
  }

  return items;
}

export function generateMockData(): {
  orders: Order[];
  customsDocuments: CustomsDocument[];
  inventoryItems: InventoryItem[];
} {
  const orders: Order[] = [
    ...createCompletedOrders(),
    ...createSyncFailedOrders(),
    ...createPendingCustomsOrders(),
    ...createPendingConfirmOrders(),
    createRejectedOrder(),
  ];

  const customsDocuments = createCustomsDocuments();
  const inventoryItems = createInventoryItems();

  return { orders, customsDocuments, inventoryItems };
}
