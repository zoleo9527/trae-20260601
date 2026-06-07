import {
  Package,
  Booking,
  PackageOrder,
  DecorationTask,
  Member,
  Transaction,
  Anomaly,
  OperationLog,
  Room
} from '../types';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const addHours = (date: Date, hours: number) => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const mockRooms: Room[] = [
  { number: '101', name: '小包1号', capacity: 6, type: 'small' },
  { number: '102', name: '小包2号', capacity: 6, type: 'small' },
  { number: '201', name: '中包1号', capacity: 10, type: 'medium' },
  { number: '202', name: '中包2号', capacity: 10, type: 'medium' },
  { number: '301', name: '大包1号', capacity: 15, type: 'large' },
  { number: '302', name: 'VIP包厢', capacity: 20, type: 'vip' },
];

export const mockPackages: Package[] = [
  {
    id: 'pkg_001',
    name: '生日欢乐套餐',
    price: 588,
    description: '包含3小时欢唱+果盘1份+小吃4份+生日布置',
    drinkGifts: [
      { name: '百威啤酒', quantity: 12 },
      { name: '橙汁', quantity: 2 },
    ],
    active: true,
  },
  {
    id: 'pkg_002',
    name: '豪华生日套餐',
    price: 988,
    description: '包含5小时欢唱+豪华果盘2份+小吃8份+主题布置',
    drinkGifts: [
      { name: '百威啤酒', quantity: 24 },
      { name: '红酒', quantity: 2 },
      { name: '软饮', quantity: 6 },
    ],
    active: true,
  },
  {
    id: 'pkg_003',
    name: '至尊生日套餐',
    price: 1688,
    description: '包含8小时欢唱+VIP专属服务+豪华布置+香槟',
    drinkGifts: [
      { name: '百威啤酒', quantity: 48 },
      { name: '香槟', quantity: 2 },
      { name: '洋酒', quantity: 2 },
      { name: '软饮', quantity: 12 },
    ],
    active: true,
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'bk_001',
    roomNumber: '201',
    startTime: addHours(today, 14),
    endTime: addHours(today, 17),
    status: 'confirmed',
    customerName: '张三',
    customerPhone: '13800138001',
    memberId: 'mem_001',
    packageOrderId: 'po_001',
    decorationTaskId: 'dec_001',
    notes: '生日派对，需要浪漫布置',
    createdAt: addDays(today, -2),
    updatedAt: addDays(today, -1),
  },
  {
    id: 'bk_002',
    roomNumber: '301',
    startTime: addHours(today, 18),
    endTime: addHours(today, 22),
    status: 'pending',
    customerName: '李四',
    customerPhone: '13800138002',
    memberId: 'mem_002',
    packageOrderId: 'po_002',
    decorationTaskId: 'dec_002',
    notes: '公司团建',
    createdAt: addDays(today, -1),
    updatedAt: addDays(today, -1),
  },
  {
    id: 'bk_003',
    roomNumber: '201',
    startTime: addHours(today, 19),
    endTime: addHours(today, 22),
    status: 'pending',
    customerName: '王五',
    customerPhone: '13800138003',
    notes: '普通预订',
    createdAt: addHours(today, 10),
    updatedAt: addHours(today, 10),
  },
  {
    id: 'bk_004',
    roomNumber: '101',
    startTime: addDays(today, -1),
    endTime: addDays(today, -1),
    status: 'completed',
    customerName: '赵六',
    customerPhone: '13800138004',
    memberId: 'mem_001',
    createdAt: addDays(today, -3),
    updatedAt: addDays(today, -1),
  },
];

export const mockPackageOrders: PackageOrder[] = [
  {
    id: 'po_001',
    bookingId: 'bk_001',
    packageId: 'pkg_001',
    status: 'processing',
    actualPrice: 588,
    drinkGifts: [
      { name: '百威啤酒', quantity: 12 },
      { name: '橙汁', quantity: 2 },
    ],
    operator: '前台小王',
    createdAt: addDays(today, -1),
  },
  {
    id: 'po_002',
    bookingId: 'bk_002',
    packageId: 'pkg_002',
    status: 'created',
    actualPrice: 988,
    drinkGifts: [
      { name: '百威啤酒', quantity: 24 },
      { name: '红酒', quantity: 2 },
      { name: '软饮', quantity: 6 },
    ],
    createdAt: addDays(today, -1),
  },
];

export const mockDecorationTasks: DecorationTask[] = [
  {
    id: 'dec_001',
    bookingId: 'bk_001',
    theme: '浪漫粉色主题',
    status: 'in_progress',
    operator: '布置组小李',
    photos: [
      'https://picsum.photos/seed/ktv1/400/300',
      'https://picsum.photos/seed/ktv2/400/300',
    ],
    notes: '气球、鲜花、生日快乐字牌',
    startedAt: addHours(today, 12),
    createdAt: addDays(today, -1),
  },
  {
    id: 'dec_002',
    bookingId: 'bk_002',
    theme: '商务简约主题',
    status: 'pending',
    photos: [],
    notes: '气球为主，简洁大气',
    createdAt: addDays(today, -1),
  },
  {
    id: 'dec_003',
    bookingId: 'bk_004',
    theme: '经典生日主题',
    status: 'completed',
    operator: '布置组小王',
    photos: [
      'https://picsum.photos/seed/ktv3/400/300',
      'https://picsum.photos/seed/ktv4/400/300',
      'https://picsum.photos/seed/ktv5/400/300',
    ],
    notes: '标准布置完成',
    startedAt: addDays(today, -1),
    completedAt: addDays(today, -1),
    createdAt: addDays(today, -2),
  },
];

export const mockMembers: Member[] = [
  {
    id: 'mem_001',
    name: '张三',
    phone: '13800138001',
    balance: 2580,
    totalSpent: 5680,
    level: '金卡',
    createdAt: addDays(today, -180),
  },
  {
    id: 'mem_002',
    name: '李四',
    phone: '13800138002',
    balance: 1200,
    totalSpent: 3200,
    level: '银卡',
    createdAt: addDays(today, -90),
  },
  {
    id: 'mem_003',
    name: '王五',
    phone: '13800138003',
    balance: 500,
    totalSpent: 1500,
    level: '普通',
    createdAt: addDays(today, -30),
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx_001',
    memberId: 'mem_001',
    type: 'recharge',
    amount: 1000,
    balanceAfter: 2580,
    operator: '前台小王',
    note: '会员充值',
    createdAt: addDays(today, -7),
  },
  {
    id: 'tx_002',
    memberId: 'mem_001',
    type: 'consume',
    amount: -588,
    balanceAfter: 1580,
    relatedBookingId: 'bk_004',
    operator: '前台小李',
    note: '包厢消费',
    createdAt: addDays(today, -1),
  },
  {
    id: 'tx_003',
    memberId: 'mem_002',
    type: 'recharge',
    amount: 2000,
    balanceAfter: 1200,
    operator: '前台小王',
    note: '新会员开卡充值',
    createdAt: addDays(today, -60),
  },
  {
    id: 'tx_004',
    memberId: 'mem_002',
    type: 'consume',
    amount: -800,
    balanceAfter: 1200,
    operator: '前台小李',
    note: '消费扣款',
    createdAt: addDays(today, -30),
  },
];

export const mockAnomalies: Anomaly[] = [
  {
    id: 'an_001',
    type: 'room_conflict',
    severity: 'high',
    status: 'open',
    description: '包厢201在19:00-22:00时段存在重复预订',
    relatedBookingId: 'bk_003',
    createdAt: addHours(today, 10),
  },
  {
    id: 'an_002',
    type: 'drink_gift_issue',
    severity: 'medium',
    status: 'handling',
    description: '订单po_001赠送酒水数量与套餐标准不符',
    relatedEntityId: 'po_001',
    handledBy: '店长',
    createdAt: addHours(today, 11),
  },
  {
    id: 'an_003',
    type: 'member_balance_issue',
    severity: 'low',
    status: 'open',
    description: '会员mem_003余额计算存在差异',
    relatedEntityId: 'mem_003',
    createdAt: addHours(today, 9),
  },
];

export const mockOperationLogs: OperationLog[] = [
  {
    id: 'log_001',
    entityType: 'booking',
    entityId: 'bk_001',
    action: 'create',
    afterData: { status: 'pending' },
    operator: '前台小王',
    note: '创建预订',
    createdAt: addDays(today, -2),
  },
  {
    id: 'log_002',
    entityType: 'booking',
    entityId: 'bk_001',
    action: 'status_change',
    beforeData: { status: 'pending' },
    afterData: { status: 'confirmed' },
    operator: '前台小李',
    note: '确认预订',
    createdAt: addDays(today, -1),
  },
  {
    id: 'log_003',
    entityType: 'decoration',
    entityId: 'dec_001',
    action: 'status_change',
    beforeData: { status: 'pending' },
    afterData: { status: 'in_progress' },
    operator: '布置组小李',
    note: '开始布置',
    createdAt: addHours(today, 12),
  },
];
