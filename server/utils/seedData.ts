import { User, SoupBase, SoldOut, SoldOutHistory, Order, AuditLog, TodoItem } from '../models';

export const seedData = async () => {
  const users = [
    { id: 'u1', name: '王经理', role: '前厅经理', phone: '13800138001' },
    { id: 'u2', name: '李主管', role: '后厨主管', phone: '13800138002' },
    { id: 'u3', name: '张收银', role: '收银', phone: '13800138003' },
    { id: 'u4', name: '管理员', role: '管理员', phone: '13800138000' },
  ];

  const soupBases = [
    { id: 's1', name: '麻辣红汤锅底', type: 'spicy', stock: 5, minStock: 10, unit: '份', status: 'pending', responsiblePerson: '李主管', notes: '需要加急准备', refundReason: '', supplementNotes: '' },
    { id: 's2', name: '清汤锅底', type: 'mild', stock: 15, minStock: 10, unit: '份', status: 'ready', responsiblePerson: '李主管', notes: '', refundReason: '', supplementNotes: '' },
    { id: 's3', name: '番茄锅底', type: 'tomato', stock: 8, minStock: 10, unit: '份', status: 'preparing', responsiblePerson: '李主管', notes: '正在准备中', refundReason: '', supplementNotes: '已通知仓库补货' },
    { id: 's4', name: '骨汤锅底', type: 'bone', stock: 12, minStock: 10, unit: '份', status: 'ready', responsiblePerson: '李主管', notes: '', refundReason: '', supplementNotes: '' },
  ];

  const soldOuts = [
    { id: 'so1', itemName: '麻辣红汤锅底', category: 'soupBase', reason: '库存不足，正在补货', status: 'active', reportedBy: '张收银', notes: '已有3桌客人点此锅底', refundReason: '', supplementNotes: '预计10分钟后恢复', relatedSoupBaseId: 's1' },
    { id: 'so2', itemName: '招牌肥牛', category: 'dish', reason: '供应商送货延迟', status: 'active', reportedBy: '李主管', notes: '已联系供应商', refundReason: '', supplementNotes: '' },
    { id: 'so3', itemName: '番茄锅底', category: 'soupBase', reason: '备料不足', status: 'active', reportedBy: '王经理', notes: '客人投诉等待时间过长', refundReason: '客人等待超过20分钟', supplementNotes: '已向客人致歉并赠送小菜', relatedSoupBaseId: 's3' },
  ];

  const orders = [
    { id: 'o1', tableNumber: '1号桌', customerName: '张先生', phone: '13900139001', soupBaseId: 's2', soupBaseName: '清汤锅底', soupBaseType: 'mild', dishes: JSON.stringify([{ name: '肥牛卷', quantity: 2 }, { name: '蔬菜拼盘', quantity: 1 }]), totalAmount: 158, paidAmount: 0, status: 'pending', isGroupBuy: false, groupBuyVerified: false, createdBy: '王经理', notes: '' },
    { id: 'o2', tableNumber: '5号桌', customerName: '李女士', phone: '13900139002', soupBaseId: 's4', soupBaseName: '骨汤锅底', soupBaseType: 'bone', dishes: JSON.stringify([{ name: '羊肉卷', quantity: 1 }, { name: '虾滑', quantity: 1 }, { name: '豆腐', quantity: 1 }]), totalAmount: 228, paidAmount: 228, status: 'confirmed', isGroupBuy: true, groupBuyCode: 'GB20260616001', groupBuyVerified: true, createdBy: '王经理', notes: '团购已核销' },
    { id: 'o3', tableNumber: '8号桌', customerName: '王先生', phone: '13900139003', soupBaseId: 's1', soupBaseName: '麻辣红汤锅底', soupBaseType: 'spicy', dishes: JSON.stringify([{ name: '毛肚', quantity: 1 }, { name: '黄喉', quantity: 1 }]), totalAmount: 198, paidAmount: 0, status: 'pending', isGroupBuy: true, groupBuyCode: 'GB20260616002', groupBuyVerified: false, createdBy: '王经理', notes: '等待团购核销' },
  ];

  await User.bulkCreate(users);
  await SoupBase.bulkCreate(soupBases);
  await SoldOut.bulkCreate(soldOuts);
  await Order.bulkCreate(orders);

  const soldOutHistories = [
    { soldOutId: 'so1', action: 'reported', actor: '张收银', description: '报告麻辣红汤锅底沽清，库存不足' },
    { soldOutId: 'so1', action: 'confirmed', actor: '李主管', description: '确认沽清，已安排补货' },
    { soldOutId: 'so2', action: 'reported', actor: '李主管', description: '报告招牌肥牛沽清，供应商延迟' },
    { soldOutId: 'so3', action: 'reported', actor: '王经理', description: '报告番茄锅底沽清，客人投诉' },
    { soldOutId: 'so3', action: 'confirmed', actor: '李主管', description: '确认沽清，正在加急备料' },
  ];

  await SoldOutHistory.bulkCreate(soldOutHistories);

  const auditLogs = [
    { action: 'create', targetType: 'soupBase', targetId: 's1', targetName: '麻辣红汤锅底', actor: '李主管', actorRole: '后厨主管', details: JSON.stringify({ stock: 5, minStock: 10 }) },
    { action: 'create', targetType: 'soldOut', targetId: 'so1', targetName: '麻辣红汤锅底', actor: '张收银', actorRole: '收银', details: JSON.stringify({ reason: '库存不足' }) },
    { action: 'create', targetType: 'order', targetId: 'o2', targetName: '5号桌订单', actor: '王经理', actorRole: '前厅经理', details: JSON.stringify({ isGroupBuy: true }) },
    { action: 'confirm', targetType: 'order', targetId: 'o2', targetName: '5号桌订单', actor: '张收银', actorRole: '收银', details: JSON.stringify({ groupBuyVerified: true }) },
  ];

  await AuditLog.bulkCreate(auditLogs);

  const todoItems = [
    { id: 't1', title: '准备麻辣红汤锅底（库存不足）', type: 'soupBase', targetId: 's1', targetName: '麻辣红汤锅底', assignee: '李主管', assigneeRole: '后厨主管', priority: 'high', completed: false },
    { id: 't2', title: '处理麻辣红汤锅底沽清', type: 'soldOut', targetId: 'so1', targetName: '麻辣红汤锅底', assignee: '李主管', assigneeRole: '后厨主管', priority: 'high', completed: false },
    { id: 't3', title: '核销8号桌团购券', type: 'order', targetId: 'o3', targetName: '8号桌订单', assignee: '张收银', assigneeRole: '收银', priority: 'medium', completed: false },
    { id: 't4', title: '跟进招牌肥牛供应商', type: 'soldOut', targetId: 'so2', targetName: '招牌肥牛', assignee: '王经理', assigneeRole: '前厅经理', priority: 'medium', completed: false },
    { id: 't5', title: '确认1号桌订单', type: 'order', targetId: 'o1', targetName: '1号桌订单', assignee: '王经理', assigneeRole: '前厅经理', priority: 'low', completed: false },
  ];

  await TodoItem.bulkCreate(todoItems);
};
