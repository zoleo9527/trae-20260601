import type { Landlord, Property, Order, Expense, Repair, Advance, Bill, Dispute } from '../../shared/types';

export const landlords: Landlord[] = [
  { id: 'l1', name: '张明', phone: '13800138001', email: 'zhangming@example.com' },
  { id: 'l2', name: '李华', phone: '13800138002', email: 'lihua@example.com' },
  { id: 'l3', name: '王芳', phone: '13800138003', email: 'wangfang@example.com' },
];

export const properties: Property[] = [
  {
    id: 'p1',
    name: '海景公寓 A座 1201',
    address: '三亚市海棠区海景路88号A座1201',
    landlordId: 'l1',
    type: 'apartment',
    bedrooms: 2,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  },
  {
    id: 'p2',
    name: '山景别墅',
    address: '杭州市西湖区龙井路168号',
    landlordId: 'l1',
    type: 'villa',
    bedrooms: 4,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
  },
  {
    id: 'p3',
    name: '城市民宿 302',
    address: '上海市静安区南京西路1266号302',
    landlordId: 'l2',
    type: 'apartment',
    bedrooms: 1,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
  },
  {
    id: 'p4',
    name: '花园洋房',
    address: '成都市锦江区春熙路99号',
    landlordId: 'l3',
    type: 'house',
    bedrooms: 3,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
  },
];

export const orders: Order[] = [
  { id: 'o1', propertyId: 'p1', platform: 'airbnb', guestName: '陈先生', checkIn: '2024-07-01', checkOut: '2024-07-05', nights: 4, totalAmount: 3200, platformFee: 384, refundAmount: 0, status: 'completed' },
  { id: 'o2', propertyId: 'p1', platform: 'tujia', guestName: '林女士', checkIn: '2024-07-08', checkOut: '2024-07-12', nights: 4, totalAmount: 3600, platformFee: 432, refundAmount: 0, status: 'completed' },
  { id: 'o3', propertyId: 'p1', platform: 'airbnb', guestName: '王先生', checkIn: '2024-07-15', checkOut: '2024-07-20', nights: 5, totalAmount: 4500, platformFee: 540, refundAmount: 0, status: 'completed' },
  { id: 'o4', propertyId: 'p1', platform: 'xiaozhu', guestName: '赵小姐', checkIn: '2024-07-22', checkOut: '2024-07-25', nights: 3, totalAmount: 2700, platformFee: 324, refundAmount: 500, status: 'completed' },
  { id: 'o5', propertyId: 'p1', platform: 'airbnb', guestName: '孙先生', checkIn: '2024-07-28', checkOut: '2024-08-03', nights: 6, totalAmount: 6000, platformFee: 720, refundAmount: 0, status: 'completed' },
  { id: 'o6', propertyId: 'p1', platform: 'tujia', guestName: '周女士', checkIn: '2024-08-05', checkOut: '2024-08-10', nights: 5, totalAmount: 5000, platformFee: 600, refundAmount: 0, status: 'completed' },
  { id: 'o7', propertyId: 'p1', platform: 'airbnb', guestName: '吴先生', checkIn: '2024-08-12', checkOut: '2024-08-18', nights: 6, totalAmount: 6600, platformFee: 792, refundAmount: 0, status: 'completed' },
  { id: 'o8', propertyId: 'p1', platform: 'xiaozhu', guestName: '郑女士', checkIn: '2024-08-20', checkOut: '2024-08-25', nights: 5, totalAmount: 5500, platformFee: 660, refundAmount: 0, status: 'completed' },
  { id: 'o9', propertyId: 'p1', platform: 'airbnb', guestName: '冯先生', checkIn: '2024-09-01', checkOut: '2024-09-04', nights: 3, totalAmount: 2400, platformFee: 288, refundAmount: 0, status: 'completed' },
  { id: 'o10', propertyId: 'p1', platform: 'tujia', guestName: '何女士', checkIn: '2024-09-10', checkOut: '2024-09-12', nights: 2, totalAmount: 1600, platformFee: 192, refundAmount: 0, status: 'completed' },
  { id: 'o11', propertyId: 'p2', platform: 'airbnb', guestName: '马先生', checkIn: '2024-07-05', checkOut: '2024-07-10', nights: 5, totalAmount: 12500, platformFee: 1500, refundAmount: 0, status: 'completed' },
  { id: 'o12', propertyId: 'p2', platform: 'tujia', guestName: '苗女士', checkIn: '2024-07-15', checkOut: '2024-07-20', nights: 5, totalAmount: 13000, platformFee: 1560, refundAmount: 0, status: 'completed' },
  { id: 'o13', propertyId: 'p2', platform: 'airbnb', guestName: '凤先生', checkIn: '2024-08-01', checkOut: '2024-08-07', nights: 6, totalAmount: 18000, platformFee: 2160, refundAmount: 0, status: 'completed' },
  { id: 'o14', propertyId: 'p2', platform: 'xiaozhu', guestName: '花女士', checkIn: '2024-08-10', checkOut: '2024-08-15', nights: 5, totalAmount: 15000, platformFee: 1800, refundAmount: 0, status: 'completed' },
  { id: 'o15', propertyId: 'p3', platform: 'airbnb', guestName: '方先生', checkIn: '2024-07-03', checkOut: '2024-07-06', nights: 3, totalAmount: 1800, platformFee: 216, refundAmount: 0, status: 'completed' },
  { id: 'o16', propertyId: 'p3', platform: 'tujia', guestName: '俞女士', checkIn: '2024-07-10', checkOut: '2024-07-12', nights: 2, totalAmount: 1200, platformFee: 144, refundAmount: 0, status: 'completed' },
  { id: 'o17', propertyId: 'p3', platform: 'airbnb', guestName: '任先生', checkIn: '2024-08-05', checkOut: '2024-08-08', nights: 3, totalAmount: 2100, platformFee: 252, refundAmount: 0, status: 'completed' },
  { id: 'o18', propertyId: 'p4', platform: 'airbnb', guestName: '姜女士', checkIn: '2024-07-07', checkOut: '2024-07-10', nights: 3, totalAmount: 3600, platformFee: 432, refundAmount: 0, status: 'completed' },
  { id: 'o19', propertyId: 'p4', platform: 'tujia', guestName: '魏先生', checkIn: '2024-07-20', checkOut: '2024-07-25', nights: 5, totalAmount: 6000, platformFee: 720, refundAmount: 0, status: 'completed' },
  { id: 'o20', propertyId: 'p4', platform: 'airbnb', guestName: '陶女士', checkIn: '2024-08-15', checkOut: '2024-08-20', nights: 5, totalAmount: 6500, platformFee: 780, refundAmount: 0, status: 'completed' },
];

export const expenses: Expense[] = [
  { id: 'e1', propertyId: 'p1', type: 'cleaning', amount: 150, date: '2024-07-05', description: '退房保洁服务', createdBy: '运营小王' },
  { id: 'e2', propertyId: 'p1', type: 'cleaning', amount: 150, date: '2024-07-12', description: '日常保洁', createdBy: '运营小李' },
  { id: 'e3', propertyId: 'p1', type: 'cleaning', amount: 180, date: '2024-07-20', description: '深度保洁（房东质疑费用过高）', createdBy: '运营小王' },
  { id: 'e4', propertyId: 'p1', type: 'cleaning', amount: 150, date: '2024-07-26', description: '退房保洁', createdBy: '运营小王' },
  { id: 'e5', propertyId: 'p1', type: 'supplies', amount: 200, date: '2024-07-15', description: '一次性用品补充（拖鞋、牙刷等）', createdBy: '运营小李' },
  { id: 'e6', propertyId: 'p1', type: 'utility', amount: 380, date: '2024-07-31', description: '7月水电费', createdBy: '财务小张' },
  { id: 'e7', propertyId: 'p1', type: 'cleaning', amount: 150, date: '2024-08-04', description: '退房保洁', createdBy: '运营小王' },
  { id: 'e8', propertyId: 'p1', type: 'cleaning', amount: 150, date: '2024-08-11', description: '日常保洁', createdBy: '运营小王' },
  { id: 'e9', propertyId: 'p1', type: 'cleaning', amount: 150, date: '2024-08-19', description: '退房保洁', createdBy: '运营小李' },
  { id: 'e10', propertyId: 'p1', type: 'utility', amount: 420, date: '2024-08-31', description: '8月水电费', createdBy: '财务小张' },
  { id: 'e11', propertyId: 'p2', type: 'cleaning', amount: 300, date: '2024-07-10', description: '别墅退房保洁', createdBy: '运营小王' },
  { id: 'e12', propertyId: 'p2', type: 'cleaning', amount: 300, date: '2024-07-20', description: '别墅日常保洁', createdBy: '运营小王' },
  { id: 'e13', propertyId: 'p2', type: 'supplies', amount: 500, date: '2024-07-25', description: '别墅用品补充', createdBy: '运营小李' },
  { id: 'e14', propertyId: 'p2', type: 'utility', amount: 850, date: '2024-07-31', description: '7月水电费', createdBy: '财务小张' },
  { id: 'e15', propertyId: 'p3', type: 'cleaning', amount: 100, date: '2024-07-06', description: '退房保洁', createdBy: '运营小李' },
  { id: 'e16', propertyId: 'p3', type: 'cleaning', amount: 100, date: '2024-07-12', description: '日常保洁', createdBy: '运营小李' },
  { id: 'e17', propertyId: 'p3', type: 'utility', amount: 200, date: '2024-07-31', description: '7月水电费', createdBy: '财务小张' },
  { id: 'e18', propertyId: 'p4', type: 'cleaning', amount: 200, date: '2024-07-10', description: '退房保洁', createdBy: '运营小王' },
  { id: 'e19', propertyId: 'p4', type: 'cleaning', amount: 200, date: '2024-07-25', description: '日常保洁', createdBy: '运营小王' },
  { id: 'e20', propertyId: 'p4', type: 'utility', amount: 450, date: '2024-07-31', description: '7月水电费', createdBy: '财务小张' },
];

export const repairs: Repair[] = [
  { id: 'r1', propertyId: 'p1', title: '智能门锁更换', description: '原门锁故障，需更换智能门锁', cost: 850, date: '2024-07-18', status: 'completed', createdBy: '运营小王' },
  { id: 'r2', propertyId: 'p1', title: '空调维修', description: '客厅空调不制冷，添加氟利昂', cost: 300, date: '2024-08-08', status: 'completed', createdBy: '运营小李' },
  { id: 'r3', propertyId: 'p1', title: '热水器检查', description: '热水出水不稳定', cost: 150, date: '2024-09-05', status: 'completed', createdBy: '运营小王' },
  { id: 'r4', propertyId: 'p2', title: '花园水管维修', description: '花园灌溉水管破裂', cost: 450, date: '2024-07-22', status: 'completed', createdBy: '运营小王' },
  { id: 'r5', propertyId: 'p2', title: '泳池设备保养', description: '泳池过滤系统定期保养', cost: 1200, date: '2024-08-15', status: 'completed', createdBy: '运营小李' },
  { id: 'r6', propertyId: 'p3', title: '灯具更换', description: '卧室吸顶灯损坏更换', cost: 180, date: '2024-07-15', status: 'completed', createdBy: '运营小李' },
  { id: 'r7', propertyId: 'p4', title: '马桶疏通', description: '卫生间马桶堵塞疏通', cost: 150, date: '2024-07-28', status: 'completed', createdBy: '运营小王' },
];

export const advances: Advance[] = [
  { id: 'a1', propertyId: 'p1', repairId: 'r1', amount: 850, date: '2024-07-18', reason: '垫付智能门锁更换费用', createdBy: '运营小王' },
  { id: 'a2', propertyId: 'p1', repairId: 'r2', amount: 300, date: '2024-08-08', reason: '垫付空调维修费用', createdBy: '运营小李' },
  { id: 'a3', propertyId: 'p2', repairId: 'r4', amount: 450, date: '2024-07-22', reason: '垫付花园水管维修费用', createdBy: '运营小王' },
  { id: 'a4', propertyId: 'p2', repairId: 'r5', amount: 1200, date: '2024-08-15', reason: '垫付泳池设备保养费用', createdBy: '运营小李' },
  { id: 'a5', propertyId: 'p3', repairId: 'r6', amount: 180, date: '2024-07-15', reason: '垫付灯具更换费用', createdBy: '运营小李' },
];

export const bills: Bill[] = [
  { id: 'b1', propertyId: 'p1', landlordId: 'l1', year: 2024, month: 7, totalIncome: 20000, totalExpenses: 1060, totalRepairs: 850, totalAdvances: 850, platformFees: 2400, refundAmount: 500, netAmount: 14340, status: 'disputed', createdAt: '2024-08-01' },
  { id: 'b2', propertyId: 'p1', landlordId: 'l1', year: 2024, month: 8, totalIncome: 23100, totalExpenses: 720, totalRepairs: 300, totalAdvances: 300, platformFees: 2772, refundAmount: 0, netAmount: 19008, status: 'sent', createdAt: '2024-09-01' },
  { id: 'b3', propertyId: 'p2', landlordId: 'l1', year: 2024, month: 7, totalIncome: 25500, totalExpenses: 1650, totalRepairs: 450, totalAdvances: 450, platformFees: 3060, refundAmount: 0, netAmount: 19890, status: 'confirmed', createdAt: '2024-08-01' },
  { id: 'b4', propertyId: 'p2', landlordId: 'l1', year: 2024, month: 8, totalIncome: 33000, totalExpenses: 850, totalRepairs: 1200, totalAdvances: 1200, platformFees: 3960, refundAmount: 0, netAmount: 25790, status: 'generated', createdAt: '2024-09-01' },
  { id: 'b5', propertyId: 'p3', landlordId: 'l2', year: 2024, month: 7, totalIncome: 3000, totalExpenses: 400, totalRepairs: 180, totalAdvances: 180, platformFees: 360, refundAmount: 0, netAmount: 1880, status: 'settled', createdAt: '2024-08-01' },
  { id: 'b6', propertyId: 'p3', landlordId: 'l2', year: 2024, month: 8, totalIncome: 2100, totalExpenses: 200, totalRepairs: 0, totalAdvances: 0, platformFees: 252, refundAmount: 0, netAmount: 1648, status: 'sent', createdAt: '2024-09-01' },
  { id: 'b7', propertyId: 'p4', landlordId: 'l3', year: 2024, month: 7, totalIncome: 9600, totalExpenses: 850, totalRepairs: 150, totalAdvances: 0, platformFees: 1152, refundAmount: 0, netAmount: 7448, status: 'confirmed', createdAt: '2024-08-01' },
  { id: 'b8', propertyId: 'p4', landlordId: 'l3', year: 2024, month: 8, totalIncome: 6500, totalExpenses: 450, totalRepairs: 0, totalAdvances: 0, platformFees: 780, refundAmount: 0, netAmount: 5270, status: 'draft', createdAt: '2024-09-01' },
];

export const disputes: Dispute[] = [
  {
    id: 'd1',
    billId: 'b1',
    landlordId: 'l1',
    type: 'expense',
    itemId: 'e3',
    title: '保洁费用过高',
    description: '7月20日的深度保洁费用180元，比平时高出30元，请问是什么原因？是否有额外的服务内容？',
    status: 'reviewing',
    createdAt: '2024-08-03',
    messages: [
      { id: 'dm1', sender: 'landlord', content: '请问7月20日的保洁费用为什么是180元，比平时贵？', createdAt: '2024-08-03 10:00' },
      { id: 'dm2', sender: 'operator', content: '张老师您好，那次是深度保洁，包含了油烟机清洗和床垫除螨服务，所以费用稍高。我稍后把保洁明细发给您确认。', createdAt: '2024-08-03 14:30' },
    ],
  },
];

export interface Database {
  landlords: Landlord[];
  properties: Property[];
  orders: Order[];
  expenses: Expense[];
  repairs: Repair[];
  advances: Advance[];
  bills: Bill[];
  disputes: Dispute[];
}

export const db: Database = {
  landlords,
  properties,
  orders,
  expenses,
  repairs,
  advances,
  bills,
  disputes,
};
