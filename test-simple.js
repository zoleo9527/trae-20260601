const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const soupBases = [
  { id: 's1', name: '麻辣红汤锅底', type: 'spicy', stock: 5, minStock: 10, unit: '份', status: 'pending', responsiblePerson: '李主管', notes: '需要加急准备', refundReason: '', supplementNotes: '' },
  { id: 's2', name: '清汤锅底', type: 'mild', stock: 15, minStock: 10, unit: '份', status: 'ready', responsiblePerson: '李主管', notes: '', refundReason: '', supplementNotes: '' },
  { id: 's3', name: '番茄锅底', type: 'tomato', stock: 8, minStock: 10, unit: '份', status: 'preparing', responsiblePerson: '李主管', notes: '正在准备中', refundReason: '', supplementNotes: '已通知仓库补货' },
  { id: 's4', name: '骨汤锅底', type: 'bone', stock: 12, minStock: 10, unit: '份', status: 'ready', responsiblePerson: '李主管', notes: '', refundReason: '', supplementNotes: '' },
];

const soldOuts = [
  { id: 'so1', itemName: '麻辣红汤锅底', category: 'soupBase', reason: '库存不足，正在补货', status: 'active', reportedBy: '张收银', notes: '已有3桌客人点此锅底', refundReason: '', supplementNotes: '预计10分钟后恢复', relatedSoupBaseId: 's1', history: [
    { action: 'reported', actor: '张收银', description: '报告麻辣红汤锅底沽清，库存不足', timestamp: new Date() },
    { action: 'confirmed', actor: '李主管', description: '确认沽清，已安排补货', timestamp: new Date() },
  ]},
  { id: 'so2', itemName: '招牌肥牛', category: 'dish', reason: '供应商送货延迟', status: 'active', reportedBy: '李主管', notes: '已联系供应商', refundReason: '', supplementNotes: '', history: [
    { action: 'reported', actor: '李主管', description: '报告招牌肥牛沽清，供应商延迟', timestamp: new Date() },
  ]},
  { id: 'so3', itemName: '番茄锅底', category: 'soupBase', reason: '备料不足', status: 'active', reportedBy: '王经理', notes: '客人投诉等待时间过长', refundReason: '客人等待超过20分钟', supplementNotes: '已向客人致歉并赠送小菜', relatedSoupBaseId: 's3', history: [
    { action: 'reported', actor: '王经理', description: '报告番茄锅底沽清，客人投诉', timestamp: new Date() },
    { action: 'confirmed', actor: '李主管', description: '确认沽清，正在加急备料', timestamp: new Date() },
  ]},
];

const orders = [
  { id: 'o1', tableNumber: '1号桌', customerName: '张先生', phone: '13900139001', soupBaseId: 's2', soupBaseName: '清汤锅底', soupBaseType: 'mild', dishes: JSON.stringify([{ name: '肥牛卷', quantity: 2 }, { name: '蔬菜拼盘', quantity: 1 }]), totalAmount: 158, paidAmount: 0, status: 'pending', isGroupBuy: false, groupBuyCode: null, groupBuyVerified: false, createdBy: '王经理', notes: '' },
  { id: 'o2', tableNumber: '5号桌', customerName: '李女士', phone: '13900139002', soupBaseId: 's4', soupBaseName: '骨汤锅底', soupBaseType: 'bone', dishes: JSON.stringify([{ name: '羊肉卷', quantity: 1 }, { name: '虾滑', quantity: 1 }, { name: '豆腐', quantity: 1 }]), totalAmount: 228, paidAmount: 228, status: 'confirmed', isGroupBuy: true, groupBuyCode: 'GB20260616001', groupBuyVerified: true, createdBy: '王经理', notes: '团购已核销' },
  { id: 'o3', tableNumber: '8号桌', customerName: '王先生', phone: '13900139003', soupBaseId: 's1', soupBaseName: '麻辣红汤锅底', soupBaseType: 'spicy', dishes: JSON.stringify([{ name: '毛肚', quantity: 1 }, { name: '黄喉', quantity: 1 }]), totalAmount: 198, paidAmount: 0, status: 'pending', isGroupBuy: true, groupBuyCode: 'GB20260616002', groupBuyVerified: false, createdBy: '王经理', notes: '等待团购核销' },
];

const auditLogs = [
  { action: 'create', targetType: 'soupBase', targetId: 's1', targetName: '麻辣红汤锅底', actor: '李主管', actorRole: '后厨主管', details: JSON.stringify({ stock: 5, minStock: 10 }), timestamp: new Date() },
  { action: 'create', targetType: 'soldOut', targetId: 'so1', targetName: '麻辣红汤锅底', actor: '张收银', actorRole: '收银', details: JSON.stringify({ reason: '库存不足' }), timestamp: new Date() },
];

const todoItems = [
  { id: 't1', title: '准备麻辣红汤锅底（库存不足）', type: 'soupBase', targetId: 's1', targetName: '麻辣红汤锅底', assignee: '李主管', assigneeRole: '后厨主管', priority: 'high', completed: false },
  { id: 't2', title: '处理麻辣红汤锅底沽清', type: 'soldOut', targetId: 'so1', targetName: '麻辣红汤锅底', assignee: '李主管', assigneeRole: '后厨主管', priority: 'high', completed: false },
  { id: 't3', title: '核销8号桌团购券', type: 'order', targetId: 'o3', targetName: '8号桌订单', assignee: '张收银', assigneeRole: '收银', priority: 'medium', completed: false },
  { id: 't4', title: '跟进招牌肥牛供应商', type: 'soldOut', targetId: 'so2', targetName: '招牌肥牛', assignee: '王经理', assigneeRole: '前厅经理', priority: 'medium', completed: false },
  { id: 't5', title: '确认1号桌订单', type: 'order', targetId: 'o1', targetName: '1号桌订单', assignee: '王经理', assigneeRole: '前厅经理', priority: 'low', completed: false },
];

const users = [
  { id: 'u1', name: '王经理', role: '前厅经理', phone: '13800138001' },
  { id: 'u2', name: '李主管', role: '后厨主管', phone: '13800138002' },
  { id: 'u3', name: '张收银', role: '收银', phone: '13800138003' },
  { id: 'u4', name: '管理员', role: '管理员', phone: '13800138000' },
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/role/:role', (req, res) => {
  const roleUsers = users.filter(u => u.role === req.params.role);
  res.json(roleUsers);
});

app.get('/api/soupBases', (req, res) => {
  res.json(soupBases);
});

app.put('/api/soupBases/:id', (req, res) => {
  const index = soupBases.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '锅底不存在' });
  
  Object.assign(soupBases[index], req.body);
  auditLogs.push({
    action: 'update', targetType: 'soupBase', targetId: soupBases[index].id, 
    targetName: soupBases[index].name, actor: req.headers.actor, 
    actorRole: req.headers.actorRole, details: JSON.stringify(req.body), timestamp: new Date()
  });
  
  res.json(soupBases[index]);
});

app.post('/api/soupBases/:id/prepare', (req, res) => {
  const index = soupBases.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '锅底不存在' });
  
  soupBases[index].status = 'preparing';
  soupBases[index].prepareCount = (soupBases[index].prepareCount || 0) + 1;
  
  auditLogs.push({
    action: 'update', targetType: 'soupBase', targetId: soupBases[index].id, 
    targetName: soupBases[index].name, actor: req.headers.actor, 
    actorRole: req.headers.actorRole, details: JSON.stringify({ status: 'preparing' }), timestamp: new Date()
  });
  
  res.json(soupBases[index]);
});

app.post('/api/soupBases/:id/complete', (req, res) => {
  const index = soupBases.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: '锅底不存在' });
  
  const additionalStock = req.body.additionalStock || 10;
  soupBases[index].status = 'ready';
  soupBases[index].stock += additionalStock;
  soupBases[index].lastPreparedAt = new Date();
  
  auditLogs.push({
    action: 'update', targetType: 'soupBase', targetId: soupBases[index].id, 
    targetName: soupBases[index].name, actor: req.headers.actor, 
    actorRole: req.headers.actorRole, details: JSON.stringify({ status: 'ready', addedStock: additionalStock }), timestamp: new Date()
  });
  
  soldOuts.forEach(so => {
    if (so.relatedSoupBaseId === soupBases[index].id && so.status === 'active') {
      so.status = 'resolved';
      so.resolvedBy = req.headers.actor;
      so.resolvedAt = new Date();
      so.history.push({ action: 'resolved', actor: req.headers.actor, description: `解决${so.itemName}沽清`, timestamp: new Date() });
      
      auditLogs.push({
        action: 'resolve', targetType: 'soldOut', targetId: so.id, targetName: so.itemName,
        actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({}), timestamp: new Date()
      });
    }
  });
  
  todoItems.forEach(t => {
    if (t.targetId === soupBases[index].id && t.type === 'soupBase' && !t.completed) {
      t.completed = true;
      t.completedAt = new Date();
    }
  });
  
  res.json(soupBases[index]);
});

app.get('/api/soldOuts', (req, res) => {
  const { status } = req.query;
  let result = soldOuts;
  if (status) {
    result = soldOuts.filter(so => so.status === status);
  }
  res.json(result);
});

app.post('/api/soldOuts', (req, res) => {
  const newSoldOut = {
    id: `so${Date.now()}`,
    ...req.body,
    status: 'active',
    reportedBy: req.headers.actor,
    history: [{ action: 'reported', actor: req.headers.actor, description: `报告${req.body.itemName}沽清：${req.body.reason}`, timestamp: new Date() }],
  };
  soldOuts.push(newSoldOut);
  
  auditLogs.push({
    action: 'create', targetType: 'soldOut', targetId: newSoldOut.id, targetName: newSoldOut.itemName,
    actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({ reason: req.body.reason, category: req.body.category }), timestamp: new Date()
  });
  
  let assignee = '李主管', assigneeRole = '后厨主管';
  if (req.headers.actorRole === '后厨主管') { assignee = '王经理'; assigneeRole = '前厅经理'; }
  
  todoItems.push({
    id: `t${Date.now()}`, title: `处理${newSoldOut.itemName}沽清`, type: 'soldOut', 
    targetId: newSoldOut.id, targetName: newSoldOut.itemName,
    assignee, assigneeRole, priority: 'high', completed: false
  });
  
  res.status(201).json(newSoldOut);
});

app.post('/api/soldOuts/:id/confirm', (req, res) => {
  const soldOut = soldOuts.find(so => so.id === req.params.id);
  if (!soldOut) return res.status(404).json({ error: '沽清记录不存在' });
  
  soldOut.history.push({ action: 'confirmed', actor: req.headers.actor, description: `确认${soldOut.itemName}沽清`, timestamp: new Date() });
  
  auditLogs.push({
    action: 'confirm', targetType: 'soldOut', targetId: soldOut.id, targetName: soldOut.itemName,
    actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({}), timestamp: new Date()
  });
  
  res.json(soldOut);
});

app.post('/api/soldOuts/:id/resolve', (req, res) => {
  const soldOut = soldOuts.find(so => so.id === req.params.id);
  if (!soldOut) return res.status(404).json({ error: '沽清记录不存在' });
  
  soldOut.status = 'resolved';
  soldOut.resolvedBy = req.headers.actor;
  soldOut.resolvedAt = new Date();
  soldOut.history.push({ action: 'resolved', actor: req.headers.actor, description: `解决${soldOut.itemName}沽清`, timestamp: new Date() });
  
  auditLogs.push({
    action: 'resolve', targetType: 'soldOut', targetId: soldOut.id, targetName: soldOut.itemName,
    actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({}), timestamp: new Date()
  });
  
  todoItems.forEach(t => {
    if (t.targetId === soldOut.id && t.type === 'soldOut' && !t.completed) {
      t.completed = true;
      t.completedAt = new Date();
    }
  });
  
  res.json(soldOut);
});

app.get('/api/orders', (req, res) => {
  const { status, isGroupBuy } = req.query;
  let result = orders;
  if (status) result = result.filter(o => o.status === status);
  if (isGroupBuy !== undefined) result = result.filter(o => o.isGroupBuy === (isGroupBuy === 'true'));
  res.json(result);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: `o${Date.now()}`,
    ...req.body,
    paidAmount: 0,
    status: 'pending',
    isGroupBuy: req.body.isGroupBuy || false,
    groupBuyVerified: false,
    createdBy: req.headers.actor,
  };
  orders.push(newOrder);
  
  auditLogs.push({
    action: 'create', targetType: 'order', targetId: newOrder.id, targetName: `${newOrder.tableNumber}订单`,
    actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({ isGroupBuy: newOrder.isGroupBuy, totalAmount: newOrder.totalAmount }), timestamp: new Date()
  });
  
  if (newOrder.isGroupBuy) {
    todoItems.push({
      id: `t${Date.now()}`, title: `核销${newOrder.tableNumber}团购券`, type: 'order',
      targetId: newOrder.id, targetName: `${newOrder.tableNumber}订单`,
      assignee: '张收银', assigneeRole: '收银', priority: 'high', completed: false
    });
  }
  
  res.status(201).json(newOrder);
});

app.post('/api/orders/:id/verify', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (!order.isGroupBuy) return res.status(400).json({ error: '该订单不是团购订单' });
  
  order.groupBuyVerified = true;
  order.status = 'confirmed';
  order.paidAmount = order.totalAmount;
  
  auditLogs.push({
    action: 'confirm', targetType: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
    actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({ groupBuyVerified: true }), timestamp: new Date()
  });
  
  todoItems.forEach(t => {
    if (t.targetId === order.id && t.type === 'order' && !t.completed) {
      t.completed = true;
      t.completedAt = new Date();
    }
  });
  
  res.json(order);
});

app.post('/api/orders/:id/confirm', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  order.status = 'confirmed';
  
  auditLogs.push({
    action: 'confirm', targetType: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
    actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({ status: 'confirmed' }), timestamp: new Date()
  });
  
  res.json(order);
});

app.post('/api/orders/:id/complete', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  order.status = 'completed';
  order.completedAt = new Date();
  
  auditLogs.push({
    action: 'update', targetType: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
    actor: req.headers.actor, actorRole: req.headers.actorRole, details: JSON.stringify({ status: 'completed' }), timestamp: new Date()
  });
  
  if (order.soupBaseId) {
    const soupBase = soupBases.find(s => s.id === order.soupBaseId);
    if (soupBase && soupBase.stock > 0) {
      soupBase.stock--;
    }
  }
  
  res.json(order);
});

app.get('/api/auditLogs', (req, res) => {
  const { action, targetType, actor } = req.query;
  let result = auditLogs;
  if (action) result = result.filter(l => l.action === action);
  if (targetType) result = result.filter(l => l.targetType === targetType);
  if (actor) result = result.filter(l => l.actor === actor);
  res.json(result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

app.get('/api/todoItems', (req, res) => {
  const { assigneeRole, completed } = req.query;
  let result = todoItems;
  if (assigneeRole) result = result.filter(t => t.assigneeRole === assigneeRole);
  if (completed !== undefined) result = result.filter(t => t.completed === (completed === 'true'));
  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.put('/api/todoItems/:id/complete', (req, res) => {
  const todo = todoItems.find(t => t.id === req.params.id);
  if (!todo) return res.status(404).json({ error: '待办事项不存在' });
  
  todo.completed = true;
  todo.completedAt = new Date();
  res.json(todo);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
