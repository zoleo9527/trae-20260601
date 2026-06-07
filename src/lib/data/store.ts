import type { Booking, Room, Member, DrinkItem, User, TodoItem, IssueRecord, Note, RechargeRecord, RejectionType, UserRole, DrinkOrderItem, DrinkOrderStatus } from '../types';

const currentUser: User = {
  id: 'user-001',
  name: '系统管理员',
  role: 'admin'
};

const rooms: Room[] = [
  { id: 'room-001', roomNo: '101', type: 'mini', capacity: 2, status: 'available', hourlyRate: 58, features: ['点歌系统', '空调'] },
  { id: 'room-002', roomNo: '102', type: 'small', capacity: 4, status: 'occupied', hourlyRate: 88, features: ['点歌系统', '空调', '沙发'] },
  { id: 'room-003', roomNo: '103', type: 'small', capacity: 4, status: 'reserved', hourlyRate: 88, features: ['点歌系统', '空调', '沙发'] },
  { id: 'room-004', roomNo: '201', type: 'medium', capacity: 8, status: 'available', hourlyRate: 158, features: ['点歌系统', '空调', '沙发', '茶几'] },
  { id: 'room-005', roomNo: '202', type: 'medium', capacity: 8, status: 'cleaning', hourlyRate: 158, features: ['点歌系统', '空调', '沙发', '茶几'] },
  { id: 'room-006', roomNo: '301', type: 'large', capacity: 15, status: 'available', hourlyRate: 258, features: ['点歌系统', '空调', '沙发', '茶几', '舞池'] },
  { id: 'room-007', roomNo: 'VIP-01', type: 'vip', capacity: 20, status: 'maintenance', hourlyRate: 388, features: ['点歌系统', '空调', '真皮沙发', '独立卫生间', '茶水服务'] },
  { id: 'room-008', roomNo: 'VIP-02', type: 'luxury', capacity: 30, status: 'available', hourlyRate: 688, features: ['点歌系统', '空调', '真皮沙发', '独立卫生间', '茶水服务', 'DJ台'] },
];

const members: Member[] = [
  { id: 'member-001', name: '张伟', phone: '13800138001', level: 'gold', balance: 2580, totalRecharge: 10000, points: 5680, createdAt: new Date('2025-06-15'), lastVisitAt: new Date('2026-06-01') },
  { id: 'member-002', name: '李娜', phone: '13800138002', level: 'silver', balance: 860, totalRecharge: 3000, points: 1240, createdAt: new Date('2026-01-20'), lastVisitAt: new Date('2026-06-05') },
  { id: 'member-003', name: '王强', phone: '13800138003', level: 'diamond', balance: 8800, totalRecharge: 50000, points: 32500, createdAt: new Date('2024-12-01'), lastVisitAt: new Date('2026-06-06') },
  { id: 'member-004', name: '刘芳', phone: '13800138004', level: 'normal', balance: 200, totalRecharge: 500, points: 180, createdAt: new Date('2026-05-10') },
];

const drinkItems: DrinkItem[] = [
  { id: 'drink-001', name: '青岛啤酒', category: '啤酒', price: 18, stock: 120, unit: '瓶' },
  { id: 'drink-002', name: '百威啤酒', category: '啤酒', price: 25, stock: 80, unit: '瓶' },
  { id: 'drink-003', name: '芝华士12年', category: '洋酒', price: 688, stock: 25, unit: '瓶' },
  { id: 'drink-004', name: '可乐', category: '软饮', price: 12, stock: 200, unit: '罐' },
  { id: 'drink-005', name: '雪碧', category: '软饮', price: 12, stock: 180, unit: '罐' },
  { id: 'drink-006', name: '绿茶', category: '软饮', price: 15, stock: 150, unit: '瓶' },
  { id: 'drink-007', name: '果盘（大）', category: '小吃', price: 88, stock: 30, unit: '份' },
  { id: 'drink-008', name: '爆米花', category: '小吃', price: 28, stock: 50, unit: '份' },
  { id: 'drink-009', name: '花生', category: '小吃', price: 18, stock: 60, unit: '份' },
];

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const mockBookings: Booking[] = [
  {
    id: 'booking-001',
    bookingNo: 'KTV-20260607-001',
    customerName: '陈先生',
    customerPhone: '13900139001',
    memberId: 'member-003',
    memberName: '王强',
    memberLevel: 'diamond',
    roomId: 'room-006',
    roomNo: '301',
    roomType: 'large',
    bookedStartTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() + 17 * 60 * 60 * 1000),
    status: 'pending',
    numberOfPeople: 12,
    deposit: 300,
    hourlyRate: 258,
    roomAmount: 774,
    drinkOrders: [],
    totalDrinkAmount: 0,
    totalAmount: 774,
    paidAmount: 300,
    useMemberBalance: 0,
    notes: [
      {
        id: 'note-001',
        content: '客户预订大包301，晚上8点到11点，12人左右。钻石会员王强帮忙预订的。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        type: 'booking'
      }
    ],
    issues: [],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 10 * 60 * 60 * 1000)
  },
  {
    id: 'booking-002',
    bookingNo: 'KTV-20260607-002',
    customerName: '林小姐',
    customerPhone: '13900139002',
    roomId: 'room-003',
    roomNo: '103',
    roomType: 'small',
    bookedStartTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
    status: 'supplement_required',
    supplementRequired: '客户联系电话不完整，需要补充确认人数和是否有会员',
    numberOfPeople: 0,
    deposit: 0,
    hourlyRate: 88,
    roomAmount: 264,
    drinkOrders: [],
    totalDrinkAmount: 0,
    totalAmount: 264,
    paidAmount: 0,
    useMemberBalance: 0,
    notes: [
      {
        id: 'note-002',
        content: '客户电话预订小包103，晚上9点到12点。但只留了手机号，没说具体人数，也没说是不是会员。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() + 11 * 60 * 60 * 1000),
        type: 'booking'
      },
      {
        id: 'note-003',
        content: '信息不全，需要补充确认人数和会员信息才能确认预订。已标记为待补录。',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 11 * 60 * 60 * 1000 + 30 * 60000),
        type: 'supplement',
        relatedTo: 'supplement-info'
      }
    ],
    issues: [
      {
        id: 'issue-001',
        type: 'booking_rejection',
        reason: '客户联系信息不完整，缺少人数确认',
        supplementaryNotes: '需要回电确认具体人数和是否使用会员',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 11 * 60 * 60 * 1000 + 30 * 60000),
        status: 'open',
        relatedBookingId: 'booking-002'
      }
    ],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() + 11 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 11 * 60 * 60 * 1000 + 30 * 60000)
  },
  {
    id: 'booking-003',
    bookingNo: 'KTV-20260607-003',
    customerName: '赵先生',
    customerPhone: '13900139003',
    memberId: 'member-001',
    memberName: '张伟',
    memberLevel: 'gold',
    roomId: 'room-002',
    roomNo: '102',
    roomType: 'small',
    bookedStartTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
    actualStartTime: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 10 * 60000),
    status: 'in_use',
    numberOfPeople: 3,
    deposit: 100,
    hourlyRate: 88,
    roomAmount: 352,
    drinkOrders: [
      {
        id: 'drink-order-001',
        bookingId: 'booking-003',
        items: [
          { drinkId: 'drink-002', drinkName: '百威啤酒', quantity: 6, price: 25, subtotal: 150 },
          { drinkId: 'drink-007', drinkName: '果盘（大）', quantity: 1, price: 88, subtotal: 88 },
          { drinkId: 'drink-008', drinkName: '爆米花', quantity: 2, price: 28, subtotal: 56 }
        ],
        totalAmount: 294,
        status: 'delivered',
        createdBy: '吧台小王',
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 30 * 60000),
        deliveredAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 45 * 60000)
      }
    ],
    totalDrinkAmount: 294,
    totalAmount: 646,
    paidAmount: 100,
    useMemberBalance: 0,
    notes: [
      {
        id: 'note-004',
        content: '金卡会员张伟预订小包102，下午4点到8点，3人。已到店并开始使用。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        type: 'booking'
      },
      {
        id: 'note-005',
        content: '客户已到店，16:10开始使用。确认是3人。',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 10 * 60000),
        type: 'checkin'
      },
      {
        id: 'note-006',
        content: '客户点了6瓶百威、一个大果盘、两份爆米花，已送到。',
        createdBy: '吧台小王',
        createdByRole: 'bar_staff',
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 45 * 60000),
        type: 'drink'
      }
    ],
    issues: [],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
    confirmedBy: '楼面经理张',
    confirmedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 15 * 60000),
    checkedInBy: '楼面经理张',
    checkedInAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 10 * 60000),
    updatedAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 45 * 60000)
  },
  {
    id: 'booking-004',
    bookingNo: 'KTV-20260607-004',
    customerName: '周女士',
    customerPhone: '13900139004',
    memberId: 'member-002',
    memberName: '李娜',
    memberLevel: 'silver',
    roomId: 'room-004',
    roomNo: '201',
    roomType: 'medium',
    bookedStartTime: new Date(today.getTime() + 13 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
    status: 'rejected',
    rejectionReason: '客户预订的201包厢设备临时故障，无法使用。客户不同意更换其他包厢。',
    numberOfPeople: 6,
    deposit: 200,
    hourlyRate: 158,
    roomAmount: 316,
    drinkOrders: [],
    totalDrinkAmount: 0,
    totalAmount: 316,
    paidAmount: 200,
    useMemberBalance: 0,
    notes: [
      {
        id: 'note-007',
        content: '银卡会员李娜帮朋友周女士预订中包201，下午5点到7点，6人。已付定金200元。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        type: 'booking'
      },
      {
        id: 'note-008',
        content: '201包厢点歌系统故障，需要维修。已联系客户更换包厢，但客户坚持要201，不同意其他包厢。',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        type: 'issue',
        relatedTo: 'room-004'
      },
      {
        id: 'note-009',
        content: '已驳回预订，原因：包厢设备故障，客户不同意更换。定金已原路退还。',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 30 * 60000),
        type: 'rejection'
      }
    ],
    issues: [
      {
        id: 'issue-002',
        type: 'room_issue',
        reason: '201包厢点歌系统故障',
        supplementaryNotes: '已通知技术人员维修，预计明天可以恢复使用',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        status: 'open',
        relatedBookingId: 'booking-004'
      }
    ],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 30 * 60000)
  },
  {
    id: 'booking-005',
    bookingNo: 'KTV-20260607-005',
    customerName: '吴先生',
    customerPhone: '13900139005',
    roomId: 'room-001',
    roomNo: '101',
    roomType: 'mini',
    bookedStartTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
    actualStartTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
    actualEndTime: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 15 * 60000),
    status: 'completed',
    numberOfPeople: 2,
    deposit: 50,
    hourlyRate: 58,
    roomAmount: 116,
    drinkOrders: [
      {
        id: 'drink-order-002',
        bookingId: 'booking-005',
        items: [
          { drinkId: 'drink-004', drinkName: '可乐', quantity: 2, price: 12, subtotal: 24 },
          { drinkId: 'drink-009', drinkName: '花生', quantity: 1, price: 18, subtotal: 18 }
        ],
        totalAmount: 42,
        status: 'delivered',
        createdBy: '吧台小王',
        createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 15 * 60000),
        deliveredAt: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 25 * 60000)
      }
    ],
    totalDrinkAmount: 42,
    totalAmount: 158,
    paidAmount: 158,
    useMemberBalance: 0,
    notes: [
      {
        id: 'note-010',
        content: '散客吴先生，两人，迷你包101，下午2点到4点。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60000),
        type: 'booking'
      },
      {
        id: 'note-011',
        content: '客户已到店，准时开始。',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        type: 'checkin'
      },
      {
        id: 'note-012',
        content: '客户超时15分钟，已按规定加收半小时费用。已结账，微信支付。',
        createdBy: '吧台小王',
        createdByRole: 'bar_staff',
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 15 * 60000),
        type: 'general'
      }
    ],
    issues: [],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60000),
    confirmedBy: '楼面经理张',
    confirmedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 45 * 60000),
    checkedInBy: '楼面经理张',
    checkedInAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
    completedBy: '吧台小王',
    completedAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 15 * 60000),
    updatedAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 15 * 60000)
  },
  {
    id: 'booking-006',
    bookingNo: 'KTV-20260606-012',
    customerName: '郑总',
    customerPhone: '13900139006',
    memberId: 'member-003',
    memberName: '王强',
    memberLevel: 'diamond',
    roomId: 'room-008',
    roomNo: 'VIP-02',
    roomType: 'luxury',
    bookedStartTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000),
    actualStartTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000 + 20 * 60000),
    actualEndTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 30 * 60000),
    status: 'completed',
    numberOfPeople: 25,
    deposit: 1000,
    hourlyRate: 688,
    roomAmount: 2752,
    drinkOrders: [
      {
        id: 'drink-order-003',
        bookingId: 'booking-006',
        items: [
          { drinkId: 'drink-003', drinkName: '芝华士12年', quantity: 3, price: 688, subtotal: 2064 },
          { drinkId: 'drink-002', drinkName: '百威啤酒', quantity: 24, price: 25, subtotal: 600 },
          { drinkId: 'drink-007', drinkName: '果盘（大）', quantity: 3, price: 88, subtotal: 264 },
          { drinkId: 'drink-008', drinkName: '爆米花', quantity: 5, price: 28, subtotal: 140 }
        ],
        totalAmount: 3068,
        status: 'delivered',
        createdBy: '吧台小王',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000 + 30 * 60000),
        deliveredAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
        notes: 'VIP客户，优先配送'
      }
    ],
    totalDrinkAmount: 3068,
    totalAmount: 5820,
    paidAmount: 5820,
    useMemberBalance: 5820,
    notes: [
      {
        id: 'note-013',
        content: '钻石会员王强帮郑总预订豪华VIP-02，晚上7点到11点，25人。已从会员卡扣除定金1000。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        type: 'booking'
      },
      {
        id: 'note-014',
        content: '客户公司聚会，25人左右，已到店，7:20开始。',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000 + 20 * 60000),
        type: 'checkin'
      },
      {
        id: 'note-015',
        content: '客户充值了10000元，赠送2000元。余额充足。',
        createdBy: '吧台小王',
        createdByRole: 'bar_staff',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
        type: 'member'
      },
      {
        id: 'note-016',
        content: '已结账，全部从会员卡余额扣除。客户很满意。',
        createdBy: '吧台小王',
        createdByRole: 'bar_staff',
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 30 * 60000),
        type: 'general'
      }
    ],
    issues: [],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    confirmedBy: '楼面经理张',
    confirmedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 30 * 60000),
    checkedInBy: '楼面经理张',
    checkedInAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000 + 20 * 60000),
    completedBy: '吧台小王',
    completedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 30 * 60000),
    updatedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 30 * 60000)
  },
  {
    id: 'booking-007',
    bookingNo: 'KTV-20260607-007',
    customerName: '孙先生',
    customerPhone: '13900139007',
    memberId: 'member-004',
    memberName: '刘芳',
    memberLevel: 'normal',
    roomId: 'room-004',
    roomNo: '201',
    roomType: 'medium',
    bookedStartTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() + 19 * 60 * 60 * 1000),
    status: 'confirmed',
    numberOfPeople: 6,
    deposit: 200,
    hourlyRate: 158,
    roomAmount: 474,
    drinkOrders: [],
    totalDrinkAmount: 0,
    totalAmount: 474,
    paidAmount: 200,
    useMemberBalance: 0,
    notes: [
      {
        id: 'note-017',
        content: '普通会员刘芳帮朋友孙先生预订中包201，晚上10点到凌晨1点，6人。已付定金。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        type: 'booking'
      },
      {
        id: 'note-018',
        content: '已确认预订，201包厢维修完成，可以正常使用。',
        createdBy: '楼面经理张',
        createdByRole: 'floor_manager',
        createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 20 * 60000),
        type: 'booking'
      }
    ],
    issues: [],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() + 12 * 60 * 60 * 1000),
    confirmedBy: '楼面经理张',
    confirmedAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 20 * 60000),
    updatedAt: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 20 * 60000)
  },
  {
    id: 'booking-008',
    bookingNo: 'KTV-20260607-008',
    customerName: '黄先生',
    customerPhone: '13900139008',
    roomId: 'room-005',
    roomNo: '202',
    roomType: 'medium',
    bookedStartTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
    bookedEndTime: new Date(today.getTime() + 21 * 60 * 60 * 1000),
    status: 'pending',
    numberOfPeople: 7,
    deposit: 0,
    hourlyRate: 158,
    roomAmount: 474,
    drinkOrders: [],
    totalDrinkAmount: 0,
    totalAmount: 474,
    paidAmount: 0,
    useMemberBalance: 0,
    notes: [
      {
        id: 'note-019',
        content: '客户电话预订中包202，凌晨12点到3点，7人左右。未付定金，需要确认。',
        createdBy: '预订员小李',
        createdByRole: 'booking_clerk',
        createdAt: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        type: 'booking'
      }
    ],
    issues: [],
    createdBy: '预订员小李',
    createdAt: new Date(today.getTime() + 13 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 13 * 60 * 60 * 1000)
  }
];

const rechargeRecords: RechargeRecord[] = [
  {
    id: 'recharge-001',
    memberId: 'member-003',
    memberName: '王强',
    amount: 10000,
    bonus: 2000,
    paymentMethod: '微信支付',
    createdBy: '吧台小王',
    createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
    bookingId: 'booking-006'
  },
  {
    id: 'recharge-002',
    memberId: 'member-001',
    memberName: '张伟',
    amount: 2000,
    bonus: 200,
    paymentMethod: '支付宝',
    createdBy: '吧台小王',
    createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000),
  }
];

let bookings: Booking[] = [...mockBookings];
let rechargeRecordList: RechargeRecord[] = [...rechargeRecords];

export function getCurrentUser(): User {
  return currentUser;
}

export function getRooms(): Room[] {
  return rooms;
}

export function getRoomById(id: string): Room | undefined {
  return rooms.find(r => r.id === id);
}

export function getMembers(): Member[] {
  return members;
}

export function getMemberById(id: string): Member | undefined {
  return members.find(m => m.id === id);
}

export function getDrinkItems(): DrinkItem[] {
  return drinkItems;
}

export function getDrinkItemById(id: string): DrinkItem | undefined {
  return drinkItems.find(d => d.id === id);
}

export function getBookings(): Booking[] {
  return bookings.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getBookingById(id: string): Booking | undefined {
  return bookings.find(b => b.id === id);
}

export function getRechargeRecords(): RechargeRecord[] {
  return rechargeRecordList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getTodos(role: string): TodoItem[] {
  const todos: TodoItem[] = [];
  
  bookings.forEach(booking => {
    if (booking.status === 'pending') {
      todos.push({
        id: `todo-booking-${booking.id}`,
        type: 'booking',
        title: `待确认预订：${booking.customerName} - ${booking.roomNo}`,
        description: `预订时间：${formatTime(booking.bookedStartTime)}，人数：${booking.numberOfPeople || '未确认'}`,
        bookingId: booking.id,
        priority: 'high',
        role: 'floor_manager',
        createdAt: booking.createdAt
      });
    }
    
    if (booking.status === 'supplement_required') {
      todos.push({
        id: `todo-supplement-${booking.id}`,
        type: 'supplement',
        title: `待补录信息：${booking.customerName} - ${booking.roomNo}`,
        description: booking.supplementRequired || '需要补充客户信息',
        bookingId: booking.id,
        priority: 'high',
        role: 'booking_clerk',
        createdAt: booking.updatedAt
      });
    }
    
    if (booking.status === 'confirmed') {
      const now = new Date();
      const startDiff = booking.bookedStartTime.getTime() - now.getTime();
      if (startDiff > 0 && startDiff < 60 * 60 * 1000) {
        todos.push({
          id: `todo-checkin-${booking.id}`,
          type: 'checkin',
          title: `即将到店：${booking.customerName} - ${booking.roomNo}`,
          description: `预计${formatTime(booking.bookedStartTime)}到达，请准备接待`,
          bookingId: booking.id,
          priority: 'medium',
          role: 'floor_manager',
          createdAt: booking.updatedAt
        });
      }
    }
    
    booking.drinkOrders.forEach(order => {
      if (order.status === 'pending') {
        todos.push({
          id: `todo-drink-${order.id}`,
          type: 'drink',
          title: `待配送酒水：${booking.roomNo}`,
          description: `${order.items.length}件商品，合计¥${order.totalAmount}`,
          bookingId: booking.id,
          priority: 'medium',
          role: 'bar_staff',
          createdAt: order.createdAt
        });
      }
    });
    
    booking.issues.filter(i => i.status === 'open').forEach(issue => {
      let issueRole: UserRole = 'floor_manager';
      if (issue.type === 'drink_issue') issueRole = 'bar_staff';
      if (issue.type === 'booking_rejection') issueRole = 'booking_clerk';
      
      todos.push({
        id: `todo-issue-${issue.id}`,
        type: 'issue',
        title: `待处理问题：${getIssueTypeName(issue.type)}`,
        description: issue.reason,
        bookingId: booking.id,
        priority: 'high',
        role: issueRole,
        createdAt: issue.createdAt,
        issueType: issue.type
      });
    });
    
    if (booking.status === 'in_use') {
      const now = new Date();
      const endDiff = booking.bookedEndTime.getTime() - now.getTime();
      if (endDiff > 0 && endDiff < 30 * 60 * 1000) {
        todos.push({
          id: `todo-review-${booking.id}`,
          type: 'review',
          title: `即将结束：${booking.roomNo} - ${booking.customerName}`,
          description: `预计${formatTime(booking.bookedEndTime)}结束，准备结账`,
          bookingId: booking.id,
          priority: 'medium',
          role: 'bar_staff',
          createdAt: booking.updatedAt
        });
      }
    }
  });
  
  return todos
    .filter(t => role === 'admin' || t.role === role)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function getIssueTypeName(type: RejectionType): string {
  const names: Record<RejectionType, string> = {
    booking_rejection: '预订驳回',
    checkin_rejection: '到店驳回',
    drink_issue: '酒水问题',
    member_issue: '会员问题',
    room_issue: '包厢问题'
  };
  return names[type];
}

export function confirmBooking(bookingId: string, operator: string, operatorRole: UserRole): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking && booking.status === 'pending') {
    booking.status = 'confirmed';
    booking.confirmedBy = operator;
    booking.confirmedAt = new Date();
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `预订已确认，由${operator}确认`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date(),
      type: 'booking'
    });
    booking.updatedAt = new Date();
    
    const room = rooms.find(r => r.id === booking.roomId);
    if (room) room.status = 'reserved';
  }
  return booking;
}

export function rejectBooking(bookingId: string, reason: string, supplementaryNotes: string, operator: string, operatorRole: UserRole): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    booking.status = 'rejected';
    booking.rejectionReason = reason;
    
    const issue: IssueRecord = {
      id: `issue-${Date.now()}`,
      type: 'booking_rejection',
      reason,
      supplementaryNotes,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date(),
      status: 'open',
      relatedBookingId: bookingId
    };
    
    booking.issues.push(issue);
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `预订被驳回：${reason}。补充说明：${supplementaryNotes}`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date(),
      type: 'rejection'
    });
    booking.updatedAt = new Date();
    
    const room = rooms.find(r => r.id === booking.roomId);
    if (room && room.status === 'reserved') room.status = 'available';
  }
  return booking;
}

export function requestSupplement(bookingId: string, supplementInfo: string, operator: string, operatorRole: UserRole): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    booking.status = 'supplement_required';
    booking.supplementRequired = supplementInfo;
    
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `需要补充信息：${supplementInfo}`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date(),
      type: 'supplement'
    });
    booking.updatedAt = new Date();
  }
  return booking;
}

export function completeSupplement(
  bookingId: string, 
  operator: string, 
  operatorRole: UserRole,
  supplementData?: {
    customerPhone?: string;
    numberOfPeople?: number;
    memberId?: string;
    memberName?: string;
    memberLevel?: MemberLevel;
    deposit?: number;
  }
): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking || booking.status !== 'supplement_required') {
    return undefined;
  }
  
  const finalPhone = supplementData?.customerPhone || booking.customerPhone;
  const finalPeople = supplementData?.numberOfPeople !== undefined ? supplementData.numberOfPeople : booking.numberOfPeople;
  
  if (!finalPhone || !finalPhone.trim()) {
    throw new Error('联系电话不能为空');
  }
  if (!finalPeople || finalPeople <= 0) {
    throw new Error('人数不能为空且必须大于 0');
  }
  
  const changes: string[] = [];
  
  if (finalPhone !== booking.customerPhone) {
    booking.customerPhone = finalPhone;
    changes.push(`联系电话更新为 ${finalPhone}`);
  }
  if (finalPeople !== booking.numberOfPeople) {
    booking.numberOfPeople = finalPeople;
    changes.push(`人数更新为 ${finalPeople} 人`);
  }
  
  const memberChanged = supplementData?.memberId !== undefined && supplementData.memberId !== booking.memberId;
  if (memberChanged) {
    if (supplementData.memberId) {
      booking.memberId = supplementData.memberId;
      booking.memberName = supplementData.memberName;
      booking.memberLevel = supplementData.memberLevel;
      changes.push(`关联会员：${supplementData.memberName} (${supplementData.memberLevel || '普通'})`);
    } else {
      const oldMember = booking.memberName || '原会员';
      booking.memberId = null;
      booking.memberName = null;
      booking.memberLevel = null;
      changes.push(`取消会员关联，改为散客`);
    }
  }
  
  if (supplementData?.deposit !== undefined && supplementData.deposit !== booking.deposit) {
    booking.deposit = supplementData.deposit;
    booking.paidAmount = supplementData.deposit;
    changes.push(`定金更新为 ¥${supplementData.deposit}`);
  }
  
  booking.status = 'pending';
  
  const supplementNote = changes.length > 0 
    ? `信息已补充完成：${changes.join('；')}。提交等待确认`
    : '信息已补充完成，等待确认';
  
  booking.lastSupplementSummary = changes.length > 0 ? changes.join('；') : '补录完成';
  
  booking.notes.push({
    id: `note-${Date.now()}`,
    content: supplementNote,
    createdBy: operator,
    createdByRole: operatorRole,
    createdAt: new Date(),
    type: 'supplement'
  });
  
  const openIssue = booking.issues.find(i => i.type === 'booking_rejection' && i.status === 'open');
  if (openIssue) {
    openIssue.status = 'resolved';
    openIssue.resolvedAt = new Date();
    openIssue.resolvedBy = operator;
  }
  
  booking.updatedAt = new Date();
  return booking;
}

export function checkInBooking(bookingId: string, operator: string, operatorRole: UserRole): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking && (booking.status === 'confirmed' || booking.status === 'arrived')) {
    booking.status = 'in_use';
    booking.actualStartTime = new Date();
    booking.checkedInBy = operator;
    booking.checkedInAt = new Date();
    
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `客户已到店，开始使用包厢`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date(),
      type: 'checkin'
    });
    booking.updatedAt = new Date();
    
    const room = rooms.find(r => r.id === booking.roomId);
    if (room) room.status = 'occupied';
  }
  return booking;
}

export function markArrived(bookingId: string, operator: string, operatorRole: UserRole): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking && booking.status === 'confirmed') {
    booking.status = 'arrived';
    
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `客户已到达，正在安排包厢`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date(),
      type: 'checkin'
    });
    booking.updatedAt = new Date();
  }
  return booking;
}

export function completeBooking(bookingId: string, operator: string, operatorRole: UserRole): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking && booking.status === 'in_use') {
    booking.status = 'completed';
    booking.actualEndTime = new Date();
    booking.completedBy = operator;
    booking.completedAt = new Date();
    
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `包厢使用结束，已结账`,
      createdBy: operator,
      createdByRole: operatorRole,
      createdAt: new Date(),
      type: 'general'
    });
    booking.updatedAt = new Date();
    
    const room = rooms.find(r => r.id === booking.roomId);
    if (room) room.status = 'cleaning';
  }
  return booking;
}

export function addNote(bookingId: string, note: Omit<Note, 'id' | 'createdAt'>): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    booking.notes.push({
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date()
    });
    booking.updatedAt = new Date();
  }
  return booking;
}

export function addIssue(bookingId: string, issue: Omit<IssueRecord, 'id' | 'createdAt' | 'status'>): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    const newIssue: IssueRecord = {
      ...issue,
      id: `issue-${Date.now()}`,
      createdAt: new Date(),
      status: 'open'
    };
    
    booking.issues.push(newIssue);
    
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `${getIssueTypeName(issue.type)}：${issue.reason}。补充说明：${issue.supplementaryNotes}`,
      createdBy: issue.createdBy,
      createdByRole: issue.createdByRole,
      createdAt: new Date(),
      type: 'issue',
      relatedTo: newIssue.id
    });
    
    booking.updatedAt = new Date();
  }
  return booking;
}

export function resolveIssue(bookingId: string, issueId: string, resolvedBy: string): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    const issue = booking.issues.find(i => i.id === issueId);
    if (issue) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date();
      issue.resolvedBy = resolvedBy;
      booking.updatedAt = new Date();
    }
  }
  return booking;
}

export function addDrinkOrder(bookingId: string, items: DrinkOrderItem[], notes?: string): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    const order = {
      id: `drink-order-${Date.now()}`,
      bookingId,
      items,
      totalAmount,
      status: 'pending' as const,
      createdBy: '吧台小王',
      createdAt: new Date(),
      notes
    };
    
    booking.drinkOrders.push(order);
    booking.totalDrinkAmount += totalAmount;
    booking.totalAmount += totalAmount;
    booking.updatedAt = new Date();
    
    booking.notes.push({
      id: `note-${Date.now()}`,
      content: `新增酒水订单：${items.length}件商品，合计¥${totalAmount}`,
      createdBy: '吧台小王',
      createdByRole: 'bar_staff',
      createdAt: new Date(),
      type: 'drink'
    });
  }
  return booking;
}

export function updateDrinkOrderStatus(bookingId: string, orderId: string, status: DrinkOrderStatus): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    const order = booking.drinkOrders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (status === 'delivered') {
        order.deliveredAt = new Date();
      }
      booking.updatedAt = new Date();
    }
  }
  return booking;
}

export function rechargeMember(memberId: string, amount: number, bonus: number, paymentMethod: string, operator: string, bookingId?: string): RechargeRecord | undefined {
  const member = members.find(m => m.id === memberId);
  if (member) {
    member.balance += amount + bonus;
    member.totalRecharge += amount;
    
    const record: RechargeRecord = {
      id: `recharge-${Date.now()}`,
      memberId,
      memberName: member.name,
      amount,
      bonus,
      paymentMethod,
      createdBy: operator,
      createdAt: new Date(),
      bookingId
    };
    
    rechargeRecordList.push(record);
    return record;
  }
  return undefined;
}

export function updateBookingPayment(bookingId: string, paidAmount: number, useMemberBalance: number): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    booking.paidAmount += paidAmount;
    booking.useMemberBalance += useMemberBalance;
    booking.updatedAt = new Date();
  }
  return booking;
}

export function updateBooking(bookingId: string, updates: Partial<Booking>): Booking | undefined {
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    Object.assign(booking, updates);
    booking.updatedAt = new Date();
  }
  return booking;
}
