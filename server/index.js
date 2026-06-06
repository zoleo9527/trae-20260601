import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const products = [
  {
    id: 'prod-001',
    name: '轻奢真皮手提包',
    sku: 'BAG-001-BLK',
    category: '箱包',
    price: 299,
    originalPrice: 599,
    stock: 500,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'APPROVED',
    createdBy: 'product-001',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    version: 1,
  },
  {
    id: 'prod-002',
    name: '智能运动手表',
    sku: 'WATCH-002-GRY',
    category: '数码',
    price: 899,
    originalPrice: 1599,
    stock: 200,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'APPROVED',
    createdBy: 'product-001',
    createdAt: '2026-06-02T14:00:00Z',
    updatedAt: '2026-06-02T14:00:00Z',
    version: 1,
  },
  {
    id: 'prod-003',
    name: '保湿精华液套装',
    sku: 'SKIN-003-SET',
    category: '美妆',
    price: 199,
    originalPrice: 399,
    stock: 1000,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'PENDING',
    createdBy: 'product-002',
    createdAt: '2026-06-03T09:00:00Z',
    updatedAt: '2026-06-03T09:00:00Z',
    version: 1,
  },
  {
    id: 'prod-004',
    name: '运动休闲T恤',
    sku: 'CLOTH-004-WHT',
    category: '服饰',
    price: 89,
    originalPrice: 159,
    stock: 800,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'REJECTED',
    createdBy: 'product-002',
    createdAt: '2026-06-03T11:00:00Z',
    updatedAt: '2026-06-04T16:00:00Z',
    version: 1,
  },
  {
    id: 'prod-005',
    name: '无线蓝牙耳机',
    sku: 'AUDIO-005-BLK',
    category: '数码',
    price: 159,
    originalPrice: 299,
    stock: 300,
    imageUrl: 'https://via.placeholder.com/100',
    status: 'APPROVED',
    createdBy: 'product-001',
    createdAt: '2026-06-04T10:00:00Z',
    updatedAt: '2026-06-04T10:00:00Z',
    version: 1,
  },
];

const schedules = [
  {
    id: 'sched-001',
    title: '618年中大促 - 美妆专场',
    anchorName: '小美主播',
    assistantName: '助理小王',
    startTime: '2026-06-18T19:00:00Z',
    endTime: '2026-06-18T23:00:00Z',
    estimatedDuration: 240,
    platform: '抖音',
    status: 'COMPLETED',
    products: [
      { productId: 'prod-001', productName: '轻奢真皮手提包', productSku: 'BAG-001-BLK', salePrice: 269, plannedQuantity: 100, displayOrder: 1, isSelected: true },
      { productId: 'prod-003', productName: '保湿精华液套装', productSku: 'SKIN-003-SET', salePrice: 179, plannedQuantity: 300, displayOrder: 2, isSelected: true },
    ],
    createdBy: 'user-001',
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-18T23:30:00Z',
    currentVersion: 3,
  },
  {
    id: 'sched-002',
    title: '数码好物节 - 3C专场',
    anchorName: '科技达人',
    assistantName: '助理小李',
    startTime: '2026-06-20T20:00:00Z',
    endTime: '2026-06-21T00:00:00Z',
    estimatedDuration: 240,
    platform: '淘宝',
    status: 'RETURNED',
    products: [
      { productId: 'prod-002', productName: '智能运动手表', productSku: 'WATCH-002-GRY', salePrice: 799, plannedQuantity: 50, displayOrder: 1, isSelected: true },
      { productId: 'prod-005', productName: '无线蓝牙耳机', productSku: 'AUDIO-005-BLK', salePrice: 139, plannedQuantity: 200, displayOrder: 2, isSelected: true },
    ],
    createdBy: 'user-001',
    createdAt: '2026-06-12T14:00:00Z',
    updatedAt: '2026-06-15T09:30:00Z',
    currentVersion: 2,
  },
  {
    id: 'sched-003',
    title: '夏日穿搭 - 服饰专场',
    anchorName: '时尚博主',
    assistantName: '助理小张',
    startTime: '2026-06-25T19:30:00Z',
    endTime: '2026-06-25T22:30:00Z',
    estimatedDuration: 180,
    platform: '抖音',
    status: 'PENDING_REVIEW',
    products: [
      { productId: 'prod-004', productName: '运动休闲T恤', productSku: 'CLOTH-004-WHT', salePrice: 79, plannedQuantity: 500, displayOrder: 1, isSelected: true },
    ],
    createdBy: 'user-001',
    createdAt: '2026-06-16T11:00:00Z',
    updatedAt: '2026-06-17T15:00:00Z',
    currentVersion: 1,
  },
];

const workflowRecords = [
  {
    id: 'wf-001',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: 'user-001',
    actionAt: '2026-06-10T10:00:00Z',
    remark: '创建618美妆专场排期',
    previousStatus: '',
    newStatus: 'DRAFT',
    idempotencyKey: 'key-sched-001-create',
  },
  {
    id: 'wf-002',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 2,
    actionType: 'SUBMIT',
    actionBy: 'user-001',
    actionAt: '2026-06-12T14:00:00Z',
    remark: '提交复核',
    previousStatus: 'DRAFT',
    newStatus: 'PENDING_REVIEW',
    idempotencyKey: 'key-sched-001-submit',
  },
  {
    id: 'wf-003',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 3,
    actionType: 'APPROVE',
    actionBy: 'auditor-001',
    actionAt: '2026-06-13T10:00:00Z',
    remark: '复核通过，商品选品和时间安排合理',
    previousStatus: 'PENDING_REVIEW',
    newStatus: 'APPROVED',
    idempotencyKey: 'key-sched-001-approve',
  },
  {
    id: 'wf-004',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 3,
    actionType: 'START_LIVE',
    actionBy: 'anchor-assistant-001',
    actionAt: '2026-06-18T19:00:00Z',
    remark: '直播开始',
    previousStatus: 'APPROVED',
    newStatus: 'LIVE',
    idempotencyKey: 'key-sched-001-start',
  },
  {
    id: 'wf-005',
    bizType: 'SCHEDULE',
    bizId: 'sched-001',
    bizVersion: 3,
    actionType: 'END_LIVE',
    actionBy: 'anchor-assistant-001',
    actionAt: '2026-06-18T23:30:00Z',
    remark: '直播顺利结束，GMV达标',
    previousStatus: 'LIVE',
    newStatus: 'COMPLETED',
    idempotencyKey: 'key-sched-001-end',
  },
  {
    id: 'wf-006',
    bizType: 'SCHEDULE',
    bizId: 'sched-002',
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: 'user-001',
    actionAt: '2026-06-12T14:00:00Z',
    remark: '创建数码好物节排期',
    previousStatus: '',
    newStatus: 'DRAFT',
    idempotencyKey: 'key-sched-002-create',
  },
  {
    id: 'wf-007',
    bizType: 'SCHEDULE',
    bizId: 'sched-002',
    bizVersion: 1,
    actionType: 'SUBMIT',
    actionBy: 'user-001',
    actionAt: '2026-06-14T10:00:00Z',
    remark: '提交复核',
    previousStatus: 'DRAFT',
    newStatus: 'PENDING_REVIEW',
    idempotencyKey: 'key-sched-002-submit',
  },
  {
    id: 'wf-008',
    bizType: 'SCHEDULE',
    bizId: 'sched-002',
    bizVersion: 2,
    actionType: 'RETURN',
    actionBy: 'auditor-001',
    actionAt: '2026-06-15T09:30:00Z',
    remark: '退回补录：1. 智能手表库存不足，需要确认补货；2. 直播时长建议延长30分钟',
    previousStatus: 'PENDING_REVIEW',
    newStatus: 'RETURNED',
    idempotencyKey: 'key-sched-002-return',
  },
  {
    id: 'wf-009',
    bizType: 'SCHEDULE',
    bizId: 'sched-003',
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: 'user-001',
    actionAt: '2026-06-16T11:00:00Z',
    remark: '创建夏日穿搭专场',
    previousStatus: '',
    newStatus: 'DRAFT',
    idempotencyKey: 'key-sched-003-create',
  },
  {
    id: 'wf-010',
    bizType: 'SCHEDULE',
    bizId: 'sched-003',
    bizVersion: 1,
    actionType: 'SUBMIT',
    actionBy: 'user-001',
    actionAt: '2026-06-17T15:00:00Z',
    remark: '提交复核',
    previousStatus: 'DRAFT',
    newStatus: 'PENDING_REVIEW',
    idempotencyKey: 'key-sched-003-submit',
  },
  {
    id: 'wf-011',
    bizType: 'PRODUCT',
    bizId: 'prod-004',
    bizVersion: 1,
    actionType: 'REJECT',
    actionBy: 'auditor-001',
    actionAt: '2026-06-04T16:00:00Z',
    remark: '商品图片不符合要求，需要重新拍摄',
    previousStatus: 'PENDING',
    newStatus: 'REJECTED',
    idempotencyKey: 'key-prod-004-reject',
  },
];

const processedKeys = new Set(workflowRecords.map(r => r.idempotencyKey));

const addWorkflowRecord = (record) => {
  const idempotencyKey = record.idempotencyKey || uuidv4();
  
  if (processedKeys.has(idempotencyKey)) {
    return { success: true, idempotencyKey, isDuplicate: true };
  }

  const newRecord = {
    ...record,
    id: uuidv4(),
    idempotencyKey,
    actionAt: dayjs().toISOString(),
  };

  workflowRecords.push(newRecord);
  processedKeys.add(idempotencyKey);

  return { success: true, idempotencyKey, isDuplicate: false };
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/schedules', (_req, res) => {
  res.json({
    code: 0,
    data: schedules,
    total: schedules.length,
  });
});

app.get('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const schedule = schedules.find(s => s.id === id);
  
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  const history = workflowRecords
    .filter(r => r.bizType === 'SCHEDULE' && r.bizId === id)
    .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());

  res.json({
    code: 0,
    data: {
      ...schedule,
      history,
    },
  });
});

app.get('/api/schedules/:id/history', (req, res) => {
  const { id } = req.params;
  const history = workflowRecords
    .filter(r => r.bizType === 'SCHEDULE' && r.bizId === id)
    .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());

  res.json({
    code: 0,
    data: history,
  });
});

app.post('/api/schedules', (req, res) => {
  const { idempotencyKey, userId, ...data } = req.body;

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    const record = workflowRecords.find(r => r.idempotencyKey === idempotencyKey);
    const existingSchedule = record ? schedules.find(s => s.id === record.bizId) : null;
    return res.json({
      code: 0,
      data: existingSchedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  const newSchedule = {
    id: uuidv4(),
    title: data.title || '',
    anchorName: data.anchorName || '',
    assistantName: data.assistantName || '',
    startTime: data.startTime || dayjs().add(1, 'day').toISOString(),
    endTime: data.endTime || dayjs().add(1, 'day').add(2, 'hour').toISOString(),
    estimatedDuration: data.estimatedDuration || 120,
    platform: data.platform || '抖音',
    status: 'DRAFT',
    products: data.products || [],
    createdBy: userId || 'user-001',
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
    currentVersion: 1,
  };

  schedules.push(newSchedule);

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: newSchedule.id,
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: userId || 'user-001',
    remark: '创建直播排期',
    previousStatus: '',
    newStatus: 'DRAFT',
    idempotencyKey,
  });

  res.json({
    code: 0,
    data: newSchedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: '创建成功',
  });
});

app.put('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const { idempotencyKey, userId, ...data } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (!['DRAFT', 'RETURNED'].includes(schedule.status)) {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能编辑` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion + 1,
    actionType: 'UPDATE',
    actionBy: userId || 'user-001',
    remark: '更新排期信息',
    previousStatus: schedule.status,
    newStatus: schedule.status,
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    Object.assign(schedule, data, {
      currentVersion: schedule.currentVersion + 1,
      updatedAt: dayjs().toISOString(),
    });
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '更新成功',
  });
});

app.put('/api/schedules/:id/submit', (req, res) => {
  const { id } = req.params;
  const { remark, idempotencyKey, userId } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.json({
      code: 0,
      data: schedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  if (!['DRAFT', 'RETURNED'].includes(schedule.status)) {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能提交复核` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion + 1,
    actionType: 'SUBMIT',
    actionBy: userId || 'user-001',
    remark: remark || '提交复核',
    previousStatus: schedule.status,
    newStatus: 'PENDING_REVIEW',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    schedule.status = 'PENDING_REVIEW';
    schedule.currentVersion += 1;
    schedule.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '提交复核成功',
  });
});

app.put('/api/schedules/:id/approve', (req, res) => {
  const { id } = req.params;
  const { remark, idempotencyKey, userId } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.json({
      code: 0,
      data: schedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  if (schedule.status !== 'PENDING_REVIEW') {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能复核` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion + 1,
    actionType: 'APPROVE',
    actionBy: userId || 'auditor-001',
    remark: remark || '复核通过',
    previousStatus: schedule.status,
    newStatus: 'APPROVED',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    schedule.status = 'APPROVED';
    schedule.currentVersion += 1;
    schedule.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '复核通过',
  });
});

app.put('/api/schedules/:id/return', (req, res) => {
  const { id } = req.params;
  const { remark, idempotencyKey, userId } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.json({
      code: 0,
      data: schedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  if (!['PENDING_REVIEW', 'REVIEWED'].includes(schedule.status)) {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能退回` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion + 1,
    actionType: 'RETURN',
    actionBy: userId || 'auditor-001',
    remark: remark || '退回补录',
    previousStatus: schedule.status,
    newStatus: 'RETURNED',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    schedule.status = 'RETURNED';
    schedule.currentVersion += 1;
    schedule.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '已退回补录',
  });
});

app.put('/api/schedules/:id/supplement', (req, res) => {
  const { id } = req.params;
  const { remark, idempotencyKey, userId, ...data } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.json({
      code: 0,
      data: schedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  if (schedule.status !== 'RETURNED') {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能补录` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion + 1,
    actionType: 'SUPPLEMENT',
    actionBy: userId || 'user-001',
    remark: remark || '补录完成',
    previousStatus: schedule.status,
    newStatus: 'DRAFT',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    Object.assign(schedule, data, {
      status: 'DRAFT',
      currentVersion: schedule.currentVersion + 1,
      updatedAt: dayjs().toISOString(),
    });
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '补录完成',
  });
});

app.put('/api/schedules/:id/start-live', (req, res) => {
  const { id } = req.params;
  const { idempotencyKey, userId } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.json({
      code: 0,
      data: schedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  if (schedule.status !== 'APPROVED') {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能开始直播` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion,
    actionType: 'START_LIVE',
    actionBy: userId || 'anchor-assistant-001',
    remark: '直播开始',
    previousStatus: schedule.status,
    newStatus: 'LIVE',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    schedule.status = 'LIVE';
    schedule.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '直播已开始',
  });
});

app.put('/api/schedules/:id/end-live', (req, res) => {
  const { id } = req.params;
  const { idempotencyKey, userId } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.json({
      code: 0,
      data: schedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  if (schedule.status !== 'LIVE') {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能结束直播` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion,
    actionType: 'END_LIVE',
    actionBy: userId || 'anchor-assistant-001',
    remark: '直播结束',
    previousStatus: schedule.status,
    newStatus: 'COMPLETED',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    schedule.status = 'COMPLETED';
    schedule.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '直播已结束',
  });
});

app.put('/api/schedules/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { remark, idempotencyKey, userId } = req.body;

  const schedule = schedules.find(s => s.id === id);
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '排期不存在' });
  }

  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.json({
      code: 0,
      data: schedule,
      idempotencyKey,
      isDuplicate: true,
      message: '重复提交，已忽略',
    });
  }

  if (['COMPLETED', 'CANCELLED', 'LIVE'].includes(schedule.status)) {
    return res.status(400).json({ code: 400, message: `当前状态${schedule.status}不能取消` });
  }

  const result = addWorkflowRecord({
    bizType: 'SCHEDULE',
    bizId: id,
    bizVersion: schedule.currentVersion,
    actionType: 'CANCEL',
    actionBy: userId || 'user-001',
    remark: remark || '取消排期',
    previousStatus: schedule.status,
    newStatus: 'CANCELLED',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    schedule.status = 'CANCELLED';
    schedule.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: schedule,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '排期已取消',
  });
});

app.get('/api/products', (_req, res) => {
  res.json({
    code: 0,
    data: products,
    total: products.length,
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }

  const history = workflowRecords
    .filter(r => r.bizType === 'PRODUCT' && r.bizId === id)
    .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());

  res.json({
    code: 0,
    data: {
      ...product,
      history,
    },
  });
});

app.get('/api/products/:id/history', (req, res) => {
  const { id } = req.params;
  const history = workflowRecords
    .filter(r => r.bizType === 'PRODUCT' && r.bizId === id)
    .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());

  res.json({
    code: 0,
    data: history,
  });
});

app.post('/api/products', (req, res) => {
  const data = req.body;
  const newProduct = {
    id: uuidv4(),
    name: data.name || '',
    sku: data.sku || '',
    category: data.category || '',
    price: data.price || 0,
    originalPrice: data.originalPrice || 0,
    stock: data.stock || 0,
    imageUrl: data.imageUrl || 'https://via.placeholder.com/100',
    status: 'PENDING',
    createdBy: data.userId || 'user-001',
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
    version: 1,
  };

  products.push(newProduct);

  addWorkflowRecord({
    bizType: 'PRODUCT',
    bizId: newProduct.id,
    bizVersion: 1,
    actionType: 'CREATE',
    actionBy: data.userId || 'user-001',
    remark: '创建商品',
    previousStatus: '',
    newStatus: 'PENDING',
  });

  res.json({
    code: 0,
    data: newProduct,
    message: '创建成功',
  });
});

app.put('/api/products/:id/approve', (req, res) => {
  const { id } = req.params;
  const { idempotencyKey, userId } = req.body;

  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }

  if (product.status !== 'PENDING') {
    return res.status(400).json({ code: 400, message: `当前状态${product.status}不能审核` });
  }

  const result = addWorkflowRecord({
    bizType: 'PRODUCT',
    bizId: id,
    bizVersion: product.version + 1,
    actionType: 'APPROVE',
    actionBy: userId || 'auditor-001',
    remark: '商品审核通过',
    previousStatus: product.status,
    newStatus: 'APPROVED',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    product.status = 'APPROVED';
    product.version += 1;
    product.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: product,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '审核通过',
  });
});

app.put('/api/products/:id/reject', (req, res) => {
  const { id } = req.params;
  const { remark, idempotencyKey, userId } = req.body;

  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }

  if (product.status !== 'PENDING') {
    return res.status(400).json({ code: 400, message: `当前状态${product.status}不能审核` });
  }

  const result = addWorkflowRecord({
    bizType: 'PRODUCT',
    bizId: id,
    bizVersion: product.version + 1,
    actionType: 'REJECT',
    actionBy: userId || 'auditor-001',
    remark: remark || '商品审核不通过',
    previousStatus: product.status,
    newStatus: 'REJECTED',
    idempotencyKey,
  });

  if (!result.isDuplicate) {
    product.status = 'REJECTED';
    product.version += 1;
    product.updatedAt = dayjs().toISOString();
  }

  res.json({
    code: 0,
    data: product,
    idempotencyKey: result.idempotencyKey,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate ? '重复提交，已忽略' : '审核拒绝',
  });
});

app.get('/api/workflow/records', (req, res) => {
  const { bizType, bizId } = req.query;
  
  let filtered = [...workflowRecords];
  
  if (bizType) {
    filtered = filtered.filter(r => r.bizType === bizType);
  }
  if (bizId) {
    filtered = filtered.filter(r => r.bizId === bizId);
  }
  
  filtered.sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime());

  res.json({
    code: 0,
    data: filtered,
    total: filtered.length,
  });
});

app.get('/api/stats/overview', (_req, res) => {
  res.json({
    code: 0,
    data: {
      schedules: {
        total: schedules.length,
        draft: schedules.filter(s => s.status === 'DRAFT').length,
        pendingReview: schedules.filter(s => s.status === 'PENDING_REVIEW').length,
        returned: schedules.filter(s => s.status === 'RETURNED').length,
        approved: schedules.filter(s => s.status === 'APPROVED').length,
        live: schedules.filter(s => s.status === 'LIVE').length,
        completed: schedules.filter(s => s.status === 'COMPLETED').length,
        cancelled: schedules.filter(s => s.status === 'CANCELLED').length,
      },
      products: {
        total: products.length,
        pending: products.filter(p => p.status === 'PENDING').length,
        approved: products.filter(p => p.status === 'APPROVED').length,
        rejected: products.filter(p => p.status === 'REJECTED').length,
        offShelf: products.filter(p => p.status === 'OFF_SHELF').length,
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server is running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/schedules`);
  console.log(`   GET  /api/schedules/:id`);
  console.log(`   GET  /api/schedules/:id/history`);
  console.log(`   POST /api/schedules`);
  console.log(`   PUT  /api/schedules/:id`);
  console.log(`   PUT  /api/schedules/:id/submit`);
  console.log(`   PUT  /api/schedules/:id/approve`);
  console.log(`   PUT  /api/schedules/:id/return`);
  console.log(`   PUT  /api/schedules/:id/supplement`);
  console.log(`   PUT  /api/schedules/:id/start-live`);
  console.log(`   PUT  /api/schedules/:id/end-live`);
  console.log(`   PUT  /api/schedules/:id/cancel`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/products/:id`);
  console.log(`   GET  /api/products/:id/history`);
  console.log(`   POST /api/products`);
  console.log(`   PUT  /api/products/:id/approve`);
  console.log(`   PUT  /api/products/:id/reject`);
  console.log(`   GET  /api/workflow/records`);
  console.log(`   GET  /api/stats/overview`);
});

export default app;
