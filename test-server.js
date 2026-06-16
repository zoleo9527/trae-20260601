const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('前厅经理', '后厨主管', '收银', '管理员'), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false, unique: true },
  avatar: { type: DataTypes.STRING },
});

const SoupBase = sequelize.define('SoupBase', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('spicy', 'mild', 'tomato', 'bone'), allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  minStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  unit: { type: DataTypes.STRING, allowNull: false, defaultValue: '份' },
  status: { type: DataTypes.ENUM('pending', 'preparing', 'ready', 'delivered'), allowNull: false, defaultValue: 'pending' },
  responsiblePerson: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  lastPreparedAt: { type: DataTypes.DATE },
  prepareCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  refundReason: { type: DataTypes.TEXT },
  supplementNotes: { type: DataTypes.TEXT },
});

const SoldOut = sequelize.define('SoldOut', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  itemName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM('soupBase', 'dish', 'drink'), allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'resolved'), allowNull: false, defaultValue: 'active' },
  reportedBy: { type: DataTypes.STRING, allowNull: false },
  resolvedBy: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  refundReason: { type: DataTypes.TEXT },
  supplementNotes: { type: DataTypes.TEXT },
  relatedSoupBaseId: { type: DataTypes.UUID },
  reportedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  resolvedAt: { type: DataTypes.DATE },
});

const SoldOutHistory = sequelize.define('SoldOutHistory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  soldOutId: { type: DataTypes.UUID, allowNull: false },
  action: { type: DataTypes.ENUM('reported', 'confirmed', 'resolved', 'updated'), allowNull: false },
  actor: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tableNumber: { type: DataTypes.STRING, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  soupBaseId: { type: DataTypes.UUID, allowNull: false },
  soupBaseName: { type: DataTypes.STRING, allowNull: false },
  soupBaseType: { type: DataTypes.ENUM('spicy', 'mild', 'tomato', 'bone'), allowNull: false },
  dishes: { type: DataTypes.JSON, allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paidAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'served', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
  isGroupBuy: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  groupBuyCode: { type: DataTypes.STRING },
  groupBuyVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  createdBy: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  refundReason: { type: DataTypes.TEXT },
  supplementNotes: { type: DataTypes.TEXT },
  servedAt: { type: DataTypes.DATE },
  completedAt: { type: DataTypes.DATE },
});

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  action: { type: DataTypes.ENUM('create', 'update', 'delete', 'resolve', 'confirm'), allowNull: false },
  targetType: { type: DataTypes.ENUM('soupBase', 'soldOut', 'order', 'user'), allowNull: false },
  targetId: { type: DataTypes.UUID, allowNull: false },
  targetName: { type: DataTypes.STRING, allowNull: false },
  actor: { type: DataTypes.STRING, allowNull: false },
  actorRole: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.JSON, allowNull: false },
  ipAddress: { type: DataTypes.STRING },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const TodoItem = sequelize.define('TodoItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('soupBase', 'soldOut', 'order'), allowNull: false },
  targetId: { type: DataTypes.UUID, allowNull: false },
  targetName: { type: DataTypes.STRING, allowNull: false },
  assignee: { type: DataTypes.STRING, allowNull: false },
  assigneeRole: { type: DataTypes.STRING, allowNull: false },
  priority: { type: DataTypes.ENUM('high', 'medium', 'low'), allowNull: false, defaultValue: 'medium' },
  completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  completedAt: { type: DataTypes.DATE },
});

SoldOut.hasMany(SoldOutHistory, { foreignKey: 'soldOutId', as: 'history' });
SoldOutHistory.belongsTo(SoldOut, { foreignKey: 'soldOutId' });
Order.belongsTo(SoupBase, { foreignKey: 'soupBaseId', as: 'soupBase' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const seedData = async () => {
  await User.bulkCreate([
    { id: 'u1', name: '王经理', role: '前厅经理', phone: '13800138001' },
    { id: 'u2', name: '李主管', role: '后厨主管', phone: '13800138002' },
    { id: 'u3', name: '张收银', role: '收银', phone: '13800138003' },
    { id: 'u4', name: '管理员', role: '管理员', phone: '13800138000' },
  ]);

  await SoupBase.bulkCreate([
    { id: 's1', name: '麻辣红汤锅底', type: 'spicy', stock: 5, minStock: 10, unit: '份', status: 'pending', responsiblePerson: '李主管', notes: '需要加急准备', refundReason: '', supplementNotes: '' },
    { id: 's2', name: '清汤锅底', type: 'mild', stock: 15, minStock: 10, unit: '份', status: 'ready', responsiblePerson: '李主管', notes: '', refundReason: '', supplementNotes: '' },
    { id: 's3', name: '番茄锅底', type: 'tomato', stock: 8, minStock: 10, unit: '份', status: 'preparing', responsiblePerson: '李主管', notes: '正在准备中', refundReason: '', supplementNotes: '已通知仓库补货' },
    { id: 's4', name: '骨汤锅底', type: 'bone', stock: 12, minStock: 10, unit: '份', status: 'ready', responsiblePerson: '李主管', notes: '', refundReason: '', supplementNotes: '' },
  ]);

  await SoldOut.bulkCreate([
    { id: 'so1', itemName: '麻辣红汤锅底', category: 'soupBase', reason: '库存不足，正在补货', status: 'active', reportedBy: '张收银', notes: '已有3桌客人点此锅底', refundReason: '', supplementNotes: '预计10分钟后恢复', relatedSoupBaseId: 's1' },
    { id: 'so2', itemName: '招牌肥牛', category: 'dish', reason: '供应商送货延迟', status: 'active', reportedBy: '李主管', notes: '已联系供应商', refundReason: '', supplementNotes: '' },
    { id: 'so3', itemName: '番茄锅底', category: 'soupBase', reason: '备料不足', status: 'active', reportedBy: '王经理', notes: '客人投诉等待时间过长', refundReason: '客人等待超过20分钟', supplementNotes: '已向客人致歉并赠送小菜', relatedSoupBaseId: 's3' },
  ]);

  await Order.bulkCreate([
    { id: 'o1', tableNumber: '1号桌', customerName: '张先生', phone: '13900139001', soupBaseId: 's2', soupBaseName: '清汤锅底', soupBaseType: 'mild', dishes: JSON.stringify([{ name: '肥牛卷', quantity: 2 }, { name: '蔬菜拼盘', quantity: 1 }]), totalAmount: 158, paidAmount: 0, status: 'pending', isGroupBuy: false, groupBuyVerified: false, createdBy: '王经理', notes: '' },
    { id: 'o2', tableNumber: '5号桌', customerName: '李女士', phone: '13900139002', soupBaseId: 's4', soupBaseName: '骨汤锅底', soupBaseType: 'bone', dishes: JSON.stringify([{ name: '羊肉卷', quantity: 1 }, { name: '虾滑', quantity: 1 }, { name: '豆腐', quantity: 1 }]), totalAmount: 228, paidAmount: 228, status: 'confirmed', isGroupBuy: true, groupBuyCode: 'GB20260616001', groupBuyVerified: true, createdBy: '王经理', notes: '团购已核销' },
    { id: 'o3', tableNumber: '8号桌', customerName: '王先生', phone: '13900139003', soupBaseId: 's1', soupBaseName: '麻辣红汤锅底', soupBaseType: 'spicy', dishes: JSON.stringify([{ name: '毛肚', quantity: 1 }, { name: '黄喉', quantity: 1 }]), totalAmount: 198, paidAmount: 0, status: 'pending', isGroupBuy: true, groupBuyCode: 'GB20260616002', groupBuyVerified: false, createdBy: '王经理', notes: '等待团购核销' },
  ]);

  await SoldOutHistory.bulkCreate([
    { soldOutId: 'so1', action: 'reported', actor: '张收银', description: '报告麻辣红汤锅底沽清，库存不足' },
    { soldOutId: 'so1', action: 'confirmed', actor: '李主管', description: '确认沽清，已安排补货' },
    { soldOutId: 'so2', action: 'reported', actor: '李主管', description: '报告招牌肥牛沽清，供应商延迟' },
    { soldOutId: 'so3', action: 'reported', actor: '王经理', description: '报告番茄锅底沽清，客人投诉' },
    { soldOutId: 'so3', action: 'confirmed', actor: '李主管', description: '确认沽清，正在加急备料' },
  ]);

  await AuditLog.bulkCreate([
    { action: 'create', targetType: 'soupBase', targetId: 's1', targetName: '麻辣红汤锅底', actor: '李主管', actorRole: '后厨主管', details: JSON.stringify({ stock: 5, minStock: 10 }) },
    { action: 'create', targetType: 'soldOut', targetId: 'so1', targetName: '麻辣红汤锅底', actor: '张收银', actorRole: '收银', details: JSON.stringify({ reason: '库存不足' }) },
    { action: 'create', targetType: 'order', targetId: 'o2', targetName: '5号桌订单', actor: '王经理', actorRole: '前厅经理', details: JSON.stringify({ isGroupBuy: true }) },
    { action: 'confirm', targetType: 'order', targetId: 'o2', targetName: '5号桌订单', actor: '张收银', actorRole: '收银', details: JSON.stringify({ groupBuyVerified: true }) },
  ]);

  await TodoItem.bulkCreate([
    { id: 't1', title: '准备麻辣红汤锅底（库存不足）', type: 'soupBase', targetId: 's1', targetName: '麻辣红汤锅底', assignee: '李主管', assigneeRole: '后厨主管', priority: 'high', completed: false },
    { id: 't2', title: '处理麻辣红汤锅底沽清', type: 'soldOut', targetId: 'so1', targetName: '麻辣红汤锅底', assignee: '李主管', assigneeRole: '后厨主管', priority: 'high', completed: false },
    { id: 't3', title: '核销8号桌团购券', type: 'order', targetId: 'o3', targetName: '8号桌订单', assignee: '张收银', assigneeRole: '收银', priority: 'medium', completed: false },
    { id: 't4', title: '跟进招牌肥牛供应商', type: 'soldOut', targetId: 'so2', targetName: '招牌肥牛', assignee: '王经理', assigneeRole: '前厅经理', priority: 'medium', completed: false },
    { id: 't5', title: '确认1号桌订单', type: 'order', targetId: 'o1', targetName: '1号桌订单', assignee: '王经理', assigneeRole: '前厅经理', priority: 'low', completed: false },
  ]);
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.get('/api/users/role/:role', async (req, res) => {
  const users = await User.findAll({ where: { role: req.params.role } });
  res.json(users);
});

app.get('/api/soupBases', async (req, res) => {
  const soupBases = await SoupBase.findAll({ order: [['createdAt', 'DESC']] });
  res.json(soupBases);
});

app.put('/api/soupBases/:id', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) return res.status(404).json({ error: '锅底不存在' });
  
  const { actor, actorRole } = req.headers;
  const changes = {};
  if (req.body.stock !== undefined) changes.stock = req.body.stock;
  if (req.body.status !== undefined) changes.status = req.body.status;
  if (req.body.notes !== undefined) changes.notes = req.body.notes;
  if (req.body.refundReason !== undefined) changes.refundReason = req.body.refundReason;
  if (req.body.supplementNotes !== undefined) changes.supplementNotes = req.body.supplementNotes;
  
  await soupBase.update(changes);
  
  await AuditLog.create({
    action: 'update',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor,
    actorRole: actorRole,
    details: JSON.stringify(changes),
  });
  
  res.json(soupBase);
});

app.post('/api/soupBases/:id/prepare', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) return res.status(404).json({ error: '锅底不存在' });
  
  const { actor, actorRole } = req.headers;
  await soupBase.update({ status: 'preparing', prepareCount: soupBase.prepareCount + 1 });
  
  await AuditLog.create({
    action: 'update',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor,
    actorRole: actorRole,
    details: JSON.stringify({ status: 'preparing' }),
  });
  
  res.json(soupBase);
});

app.post('/api/soupBases/:id/complete', async (req, res) => {
  const soupBase = await SoupBase.findByPk(req.params.id);
  if (!soupBase) return res.status(404).json({ error: '锅底不存在' });
  
  const { actor, actorRole } = req.headers;
  const additionalStock = req.body.additionalStock || 10;
  
  await soupBase.update({
    status: 'ready',
    stock: soupBase.stock + additionalStock,
    lastPreparedAt: new Date(),
  });
  
  await AuditLog.create({
    action: 'update',
    targetType: 'soupBase',
    targetId: soupBase.id,
    targetName: soupBase.name,
    actor: actor,
    actorRole: actorRole,
    details: JSON.stringify({ status: 'ready', addedStock: additionalStock }),
  });
  
  await SoldOut.update(
    { status: 'resolved', resolvedBy: actor, resolvedAt: new Date() },
    { where: { relatedSoupBaseId: soupBase.id, status: 'active' } }
  );
  
  await TodoItem.update(
    { completed: true, completedAt: new Date() },
    { where: { targetId: soupBase.id, type: 'soupBase', completed: false } }
  );
  
  res.json(soupBase);
});

app.get('/api/soldOuts', async (req, res) => {
  const { status } = req.query;
  const whereClause = status ? { status } : {};
  const soldOuts = await SoldOut.findAll({ 
    where: whereClause,
    include: [{ model: SoldOutHistory, as: 'history' }],
    order: [['reportedAt', 'DESC']],
  });
  res.json(soldOuts);
});

app.post('/api/soldOuts', async (req, res) => {
  const { itemName, category, reason, notes, refundReason, supplementNotes, relatedSoupBaseId } = req.body;
  const { actor, actorRole } = req.headers;
  
  const soldOut = await SoldOut.create({
    itemName, category, reason, reportedBy: actor, notes: notes || '',
    refundReason, supplementNotes, relatedSoupBaseId,
  });
  
  await SoldOutHistory.create({
    soldOutId: soldOut.id, action: 'reported', actor: actor, description: `报告${itemName}沽清：${reason}`
  });
  
  await AuditLog.create({
    action: 'create', targetType: 'soldOut', targetId: soldOut.id, targetName: soldOut.itemName,
    actor: actor, actorRole: actorRole, details: JSON.stringify({ reason, category })
  });
  
  let assignee = '李主管', assigneeRole = '后厨主管';
  if (actorRole === '后厨主管') { assignee = '王经理'; assigneeRole = '前厅经理'; }
  
  await TodoItem.create({
    title: `处理${itemName}沽清`, type: 'soldOut', targetId: soldOut.id, targetName: soldOut.itemName,
    assignee, assigneeRole, priority: 'high'
  });
  
  res.status(201).json(soldOut);
});

app.post('/api/soldOuts/:id/confirm', async (req, res) => {
  const soldOut = await SoldOut.findByPk(req.params.id);
  if (!soldOut) return res.status(404).json({ error: '沽清记录不存在' });
  
  const { actor, actorRole } = req.headers;
  
  await SoldOutHistory.create({
    soldOutId: soldOut.id, action: 'confirmed', actor: actor, description: `确认${soldOut.itemName}沽清`
  });
  
  await AuditLog.create({
    action: 'confirm', targetType: 'soldOut', targetId: soldOut.id, targetName: soldOut.itemName,
    actor: actor, actorRole: actorRole, details: JSON.stringify({})
  });
  
  res.json(soldOut);
});

app.post('/api/soldOuts/:id/resolve', async (req, res) => {
  const soldOut = await SoldOut.findByPk(req.params.id);
  if (!soldOut) return res.status(404).json({ error: '沽清记录不存在' });
  
  const { actor, actorRole } = req.headers;
  
  await soldOut.update({ status: 'resolved', resolvedBy: actor, resolvedAt: new Date() });
  
  await SoldOutHistory.create({
    soldOutId: soldOut.id, action: 'resolved', actor: actor, description: `解决${soldOut.itemName}沽清`
  });
  
  await AuditLog.create({
    action: 'resolve', targetType: 'soldOut', targetId: soldOut.id, targetName: soldOut.itemName,
    actor: actor, actorRole: actorRole, details: JSON.stringify({})
  });
  
  await TodoItem.update(
    { completed: true, completedAt: new Date() },
    { where: { targetId: soldOut.id, type: 'soldOut', completed: false } }
  );
  
  res.json(soldOut);
});

app.get('/api/orders', async (req, res) => {
  const { status, isGroupBuy } = req.query;
  const whereClause = {};
  if (status) whereClause.status = status;
  if (isGroupBuy !== undefined) whereClause.isGroupBuy = isGroupBuy === 'true';
  
  const orders = await Order.findAll({ 
    include: [{ model: SoupBase, as: 'soupBase' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { tableNumber, customerName, phone, soupBaseId, soupBaseName, soupBaseType, dishes, totalAmount, isGroupBuy, groupBuyCode, notes } = req.body;
  const { actor, actorRole } = req.headers;
  
  const order = await Order.create({
    tableNumber, customerName, phone, soupBaseId, soupBaseName, soupBaseType,
    dishes: typeof dishes === 'string' ? dishes : JSON.stringify(dishes),
    totalAmount, isGroupBuy: isGroupBuy || false, groupBuyCode,
    createdBy: actor, notes: notes || ''
  });
  
  await AuditLog.create({
    action: 'create', targetType: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
    actor: actor, actorRole: actorRole, details: JSON.stringify({ isGroupBuy, totalAmount })
  });
  
  if (isGroupBuy) {
    await TodoItem.create({
      title: `核销${order.tableNumber}团购券`, type: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
      assignee: '张收银', assigneeRole: '收银', priority: 'high'
    });
  }
  
  res.status(201).json(order);
});

app.post('/api/orders/:id/verify', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (!order.isGroupBuy) return res.status(400).json({ error: '该订单不是团购订单' });
  
  const { actor, actorRole } = req.headers;
  
  await order.update({ groupBuyVerified: true, status: 'confirmed', paidAmount: order.totalAmount });
  
  await AuditLog.create({
    action: 'confirm', targetType: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
    actor: actor, actorRole: actorRole, details: JSON.stringify({ groupBuyVerified: true })
  });
  
  await TodoItem.update(
    { completed: true, completedAt: new Date() },
    { where: { targetId: order.id, type: 'order', completed: false } }
  );
  
  res.json(order);
});

app.post('/api/orders/:id/confirm', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  const { actor, actorRole } = req.headers;
  
  await order.update({ status: 'confirmed' });
  
  await AuditLog.create({
    action: 'confirm', targetType: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
    actor: actor, actorRole: actorRole, details: JSON.stringify({ status: 'confirmed' })
  });
  
  res.json(order);
});

app.post('/api/orders/:id/complete', async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  const { actor, actorRole } = req.headers;
  
  await order.update({ status: 'completed', completedAt: new Date() });
  
  await AuditLog.create({
    action: 'update', targetType: 'order', targetId: order.id, targetName: `${order.tableNumber}订单`,
    actor: actor, actorRole: actorRole, details: JSON.stringify({ status: 'completed' })
  });
  
  if (order.soupBaseId) {
    const soupBase = await SoupBase.findByPk(order.soupBaseId);
    if (soupBase && soupBase.stock > 0) {
      await soupBase.update({ stock: soupBase.stock - 1 });
    }
  }
  
  res.json(order);
});

app.get('/api/auditLogs', async (req, res) => {
  const { action, targetType, actor } = req.query;
  const whereClause = {};
  if (action) whereClause.action = action;
  if (targetType) whereClause.targetType = targetType;
  if (actor) whereClause.actor = actor;
  
  const logs = await AuditLog.findAll({ where: whereClause, order: [['timestamp', 'DESC']] });
  res.json(logs);
});

app.get('/api/todoItems', async (req, res) => {
  const { assigneeRole, completed } = req.query;
  const whereClause = {};
  if (assigneeRole) whereClause.assigneeRole = assigneeRole;
  if (completed !== undefined) whereClause.completed = completed === 'true';
  
  const todos = await TodoItem.findAll({ where: whereClause, order: [['createdAt', 'DESC']] });
  res.json(todos);
});

app.put('/api/todoItems/:id/complete', async (req, res) => {
  const todo = await TodoItem.findByPk(req.params.id);
  if (!todo) return res.status(404).json({ error: '待办事项不存在' });
  
  await todo.update({ completed: true, completedAt: new Date() });
  res.json(todo);
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    await sequelize.sync({ force: true });
    console.log('Database synced');
    
    await seedData();
    console.log('Seed data inserted');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
