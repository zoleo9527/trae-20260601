import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let orders = [
  { id: 1, orderNo: 'ORD20240101001', customerName: '赵女士', customerPhone: '13900139001', serviceType: '日常保洁', serviceAddress: '北京市朝阳区建国路88号SOHO现代城A座1201', serviceDate: '2024-01-15', serviceTime: '09:00', status: '待排班', createdAt: '2024-01-10 10:30:00', blockReason: '尚未分配家政员，等待客服排班', assignedStaffId: null },
  { id: 2, orderNo: 'ORD20240101002', customerName: '钱先生', customerPhone: '13900139002', serviceType: '深度清洁', serviceAddress: '北京市海淀区中关村大街1号科技大厦B座808', serviceDate: '2024-01-15', serviceTime: '14:00', status: '已排班', createdAt: '2024-01-10 11:00:00', blockReason: '家政员已分配，等待到岗确认', assignedStaffId: 2 },
  { id: 3, orderNo: 'ORD20240101003', customerName: '孙女士', customerPhone: '13900139003', serviceType: '月嫂服务', serviceAddress: '北京市西城区金融街8号金融大厦C座1501', serviceDate: '2024-01-16', serviceTime: '08:00', status: '已到岗', createdAt: '2024-01-11 09:00:00', blockReason: null, assignedStaffId: 3 },
  { id: 4, orderNo: 'ORD20240101004', customerName: '李先生', customerPhone: '13900139004', serviceType: '日常保洁', serviceAddress: '北京市东城区王府井大街100号银泰中心D座602', serviceDate: '2024-01-16', serviceTime: '10:00', status: '服务中', createdAt: '2024-01-12 14:00:00', blockReason: null, assignedStaffId: 2 },
  { id: 5, orderNo: 'ORD20240101005', customerName: '周女士', customerPhone: '13900139005', serviceType: '钟点工', serviceAddress: '北京市丰台区方庄小区12号楼3单元501', serviceDate: '2024-01-17', serviceTime: '09:00', status: '待确认', createdAt: '2024-01-13 16:00:00', blockReason: '家政员刘阿姨离线状态，尚未确认到岗', assignedStaffId: 5 },
  { id: 6, orderNo: 'ORD20240101006', customerName: '吴先生', customerPhone: '13900139006', serviceType: '深度清洁', serviceAddress: '北京市通州区万达写字楼A座901', serviceDate: '2024-01-17', serviceTime: '14:00', status: '已完成', createdAt: '2024-01-14 09:30:00', blockReason: null, assignedStaffId: 3 },
];

let staff = [
  { id: 1, staffNo: 'ST001', name: '张经理', phone: '13800138001', role: '客服', status: '在线' },
  { id: 2, staffNo: 'ST002', name: '李阿姨', phone: '13800138002', role: '家政员', status: '在线' },
  { id: 3, staffNo: 'ST003', name: '王阿姨', phone: '13800138003', role: '家政员', status: '在线' },
  { id: 4, staffNo: 'ST004', name: '陈主管', phone: '13800138004', role: '质检主管', status: '在线' },
  { id: 5, staffNo: 'ST005', name: '刘阿姨', phone: '13800138005', role: '家政员', status: '离线' },
];

let scheduling = [
  { id: 1, orderId: 2, staffId: 2, scheduleDate: '2024-01-15', scheduleTime: '14:00', status: '已排班', createdAt: '2024-01-10 14:00:00', remark: '客服张经理分配' },
  { id: 2, orderId: 3, staffId: 3, scheduleDate: '2024-01-16', scheduleTime: '08:00', status: '已到岗', createdAt: '2024-01-11 10:00:00', remark: '客服张经理分配' },
  { id: 3, orderId: 4, staffId: 2, scheduleDate: '2024-01-16', scheduleTime: '10:00', status: '服务中', createdAt: '2024-01-12 15:00:00', remark: '客服张经理分配' },
  { id: 4, orderId: 5, staffId: 5, scheduleDate: '2024-01-17', scheduleTime: '09:00', status: '待确认', createdAt: '2024-01-13 17:00:00', remark: '客服张经理分配，家政员离线' },
  { id: 5, orderId: 6, staffId: 3, scheduleDate: '2024-01-17', scheduleTime: '14:00', status: '已完成', createdAt: '2024-01-14 10:00:00', remark: '客服张经理分配' },
];

let checkin = [
  { id: 1, schedulingId: 2, staffId: 3, checkinTime: '2024-01-16 07:55:00', status: '已到岗', remark: '准时到达', notArrivedReason: null },
  { id: 2, schedulingId: 3, staffId: 2, checkinTime: '2024-01-16 09:58:00', status: '已到岗', remark: '提前到达', notArrivedReason: null },
  { id: 3, schedulingId: 4, staffId: 5, checkinTime: '', status: '未到岗', remark: '等待确认', notArrivedReason: '家政员离线，无法确认到岗状态' },
  { id: 4, schedulingId: 5, staffId: 3, checkinTime: '2024-01-17 13:55:00', status: '已到岗', remark: '准时到达', notArrivedReason: null },
];

let operationLogs = [
  { id: 1, orderId: 1, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '创建订单', detail: '创建订单ORD20240101001', createdAt: '2024-01-10 10:30:00' },
  { id: 2, orderId: 1, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '分配任务', detail: '等待排班分配', createdAt: '2024-01-10 10:35:00' },
  { id: 3, orderId: 2, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '创建订单', detail: '创建订单ORD20240101002', createdAt: '2024-01-10 11:00:00' },
  { id: 4, orderId: 2, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '排班分配', detail: '分配李阿姨(ST002)负责该订单', createdAt: '2024-01-10 14:00:00' },
  { id: 5, orderId: 3, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '创建订单', detail: '创建订单ORD20240101003', createdAt: '2024-01-11 09:00:00' },
  { id: 6, orderId: 3, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '排班分配', detail: '分配王阿姨(ST003)负责该订单', createdAt: '2024-01-11 10:00:00' },
  { id: 7, orderId: 3, operatorId: 3, operatorName: '王阿姨', operatorRole: '家政员', action: '到岗确认', detail: '已到达服务地点', createdAt: '2024-01-16 07:55:00' },
  { id: 8, orderId: 4, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '创建订单', detail: '创建订单ORD20240101004', createdAt: '2024-01-12 14:00:00' },
  { id: 9, orderId: 4, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '排班分配', detail: '分配李阿姨(ST002)负责该订单', createdAt: '2024-01-12 15:00:00' },
  { id: 10, orderId: 4, operatorId: 2, operatorName: '李阿姨', operatorRole: '家政员', action: '到岗确认', detail: '已到达服务地点', createdAt: '2024-01-16 09:58:00' },
  { id: 11, orderId: 4, operatorId: 4, operatorName: '陈主管', operatorRole: '质检主管', action: '服务开始', detail: '服务正式开始', createdAt: '2024-01-16 10:00:00' },
  { id: 12, orderId: 5, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '创建订单', detail: '创建订单ORD20240101005', createdAt: '2024-01-13 16:00:00' },
  { id: 13, orderId: 5, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '排班分配', detail: '分配刘阿姨(ST005)负责该订单', createdAt: '2024-01-13 17:00:00' },
  { id: 14, orderId: 6, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '创建订单', detail: '创建订单ORD20240101006', createdAt: '2024-01-14 09:30:00' },
  { id: 15, orderId: 6, operatorId: 1, operatorName: '张经理', operatorRole: '客服', action: '排班分配', detail: '分配王阿姨(ST003)负责该订单', createdAt: '2024-01-14 10:00:00' },
  { id: 16, orderId: 6, operatorId: 3, operatorName: '王阿姨', operatorRole: '家政员', action: '到岗确认', detail: '已到达服务地点', createdAt: '2024-01-17 13:55:00' },
  { id: 17, orderId: 6, operatorId: 4, operatorName: '陈主管', operatorRole: '质检主管', action: '服务完成', detail: '服务已完成，等待客户评价', createdAt: '2024-01-17 17:00:00' },
];

const getBlockReason = (order) => {
  if (order.status === '待排班') {
    return '尚未分配家政员，等待客服排班';
  }
  if (order.status === '已排班') {
    const schedule = scheduling.find(s => s.orderId === order.id);
    const assignedStaff = staff.find(st => st.id === schedule?.staffId);
    if (assignedStaff && assignedStaff.status === '离线') {
      return `家政员${assignedStaff.name}当前离线，无法确认到岗`;
    }
    return '家政员已分配，等待到岗确认';
  }
  if (order.status === '待确认') {
    const schedule = scheduling.find(s => s.orderId === order.id);
    const checkinRecord = checkin.find(c => c.schedulingId === schedule?.id);
    return checkinRecord?.notArrivedReason || '到岗状态待确认';
  }
  return null;
};

app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let result = orders.map(o => ({
    ...o,
    blockReason: getBlockReason(o),
  }));
  if (status) {
    result = result.filter(o => o.status === status);
  }
  res.json(result);
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === Number(id));
  if (order) {
    res.json({
      ...order,
      blockReason: getBlockReason(order),
    });
  } else {
    res.json(null);
  }
});

app.get('/api/orders/:id/detail', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === Number(id));
  if (!order) {
    res.json(null);
    return;
  }

  const schedule = scheduling.find(s => s.orderId === order.id);
  const assignedStaff = schedule ? staff.find(st => st.id === schedule.staffId) : null;
  const checkinRecord = schedule ? checkin.find(c => c.schedulingId === schedule.id) : null;
  const logs = operationLogs.filter(l => l.orderId === order.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const customerServiceStaff = staff.find(st => st.role === '客服');
  const qcStaff = staff.find(st => st.role === '质检主管');

  res.json({
    order: {
      ...order,
      blockReason: getBlockReason(order),
    },
    schedule: schedule ? {
      ...schedule,
      staffName: assignedStaff?.name,
      staffNo: assignedStaff?.staffNo,
      staffPhone: assignedStaff?.phone,
      staffStatus: assignedStaff?.status,
    } : null,
    checkin: checkinRecord ? {
      ...checkinRecord,
      staffName: assignedStaff?.name,
    } : null,
    logs: logs.map(l => ({
      ...l,
      operatorRole: staff.find(st => st.id === l.operatorId)?.role || l.operatorRole,
    })),
    handlers: {
      customerService: customerServiceStaff ? {
        id: customerServiceStaff.id,
        name: customerServiceStaff.name,
        role: customerServiceStaff.role,
        status: customerServiceStaff.status,
        currentAction: order.status === '待排班' ? '需要排班分配' : '已处理',
      } : null,
      housekeeper: assignedStaff ? {
        id: assignedStaff.id,
        name: assignedStaff.name,
        role: assignedStaff.role,
        status: assignedStaff.status,
        currentAction: order.status === '已排班' ? '需要到岗确认' : 
                       order.status === '待确认' ? '需要确认到岗状态' :
                       order.status === '服务中' ? '正在服务' : '已完成',
      } : null,
      qcSupervisor: qcStaff ? {
        id: qcStaff.id,
        name: qcStaff.name,
        role: qcStaff.role,
        status: qcStaff.status,
        currentAction: order.status === '服务中' ? '需要监督服务' : 
                       order.status === '已完成' ? '需要确认完成' : '待介入',
      } : null,
    },
  });
});

app.get('/api/staff', (req, res) => {
  const { role, status } = req.query;
  let result = [...staff];
  if (role) result = result.filter(s => s.role === role);
  if (status) result = result.filter(s => s.status === status);
  res.json(result);
});

app.get('/api/scheduling', (req, res) => {
  const { orderId, staffId, status } = req.query;
  let result = scheduling.map(s => {
    const order = orders.find(o => o.id === s.orderId);
    const sStaff = staff.find(st => st.id === s.staffId);
    return {
      ...s,
      orderNo: order?.orderNo,
      customerName: order?.customerName,
      serviceAddress: order?.serviceAddress,
      staffName: sStaff?.name,
      staffRole: sStaff?.role,
      staffStatus: sStaff?.status,
    };
  });
  if (orderId) result = result.filter(s => s.orderId === Number(orderId));
  if (staffId) result = result.filter(s => s.staffId === Number(staffId));
  if (status) result = result.filter(s => s.status === status);
  res.json(result);
});

app.get('/api/checkin', (req, res) => {
  const { schedulingId, staffId, status } = req.query;
  let result = checkin.map(c => {
    const schedule = scheduling.find(s => s.id === c.schedulingId);
    const sStaff = staff.find(st => st.id === c.staffId);
    return {
      ...c,
      orderId: schedule?.orderId,
      scheduleDate: schedule?.scheduleDate,
      scheduleTime: schedule?.scheduleTime,
      staffName: sStaff?.name,
      staffRole: sStaff?.role,
      staffStatus: sStaff?.status,
    };
  });
  if (schedulingId) result = result.filter(c => c.schedulingId === Number(schedulingId));
  if (staffId) result = result.filter(c => c.staffId === Number(staffId));
  if (status) result = result.filter(c => c.status === status);
  res.json(result);
});

app.get('/api/logs', (req, res) => {
  const { orderId } = req.query;
  let result = [...operationLogs];
  if (orderId) result = result.filter(l => l.orderId === Number(orderId));
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result.map(l => ({
    ...l,
    operatorRole: staff.find(st => st.id === l.operatorId)?.role || l.operatorRole,
  })));
});

app.post('/api/scheduling', (req, res) => {
  const { orderId, staffId, scheduleDate, scheduleTime, remark } = req.body;
  const newSchedule = {
    id: scheduling.length + 1,
    orderId,
    staffId,
    scheduleDate,
    scheduleTime,
    status: '已排班',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    remark: remark || '客服分配',
  };
  scheduling.push(newSchedule);
  
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = '已排班';
    order.assignedStaffId = staffId;
    order.blockReason = getBlockReason(order);
  }
  
  const sStaff = staff.find(st => st.id === staffId);
  const operator = staff.find(st => st.role === '客服');
  operationLogs.push({
    id: operationLogs.length + 1,
    orderId,
    operatorId: operator?.id || 1,
    operatorName: operator?.name || '张经理',
    operatorRole: '客服',
    action: '排班分配',
    detail: `分配${sStaff?.name}(${sStaff?.staffNo})负责该订单`,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  });
  
  res.json({ id: newSchedule.id });
});

app.post('/api/checkin', (req, res) => {
  const { schedulingId, staffId, checkinTime, status, remark, notArrivedReason } = req.body;
  const newCheckin = {
    id: checkin.length + 1,
    schedulingId,
    staffId,
    checkinTime,
    status,
    remark,
    notArrivedReason: status === '未到岗' ? notArrivedReason : null,
  };
  checkin.push(newCheckin);
  
  const schedule = scheduling.find(s => s.id === schedulingId);
  if (schedule) {
    schedule.status = status === '已到岗' ? '已到岗' : '待确认';
  }
  
  const order = orders.find(o => o.id === schedule?.orderId);
  if (order) {
    order.status = status === '已到岗' ? '已到岗' : '待确认';
    order.blockReason = getBlockReason(order);
  }
  
  const sStaff = staff.find(st => st.id === staffId);
  operationLogs.push({
    id: operationLogs.length + 1,
    orderId: schedule?.orderId,
    operatorId: staffId,
    operatorName: sStaff?.name,
    operatorRole: sStaff?.role,
    action: status === '已到岗' ? '到岗确认' : '到岗异常',
    detail: status === '已到岗' ? remark : `未到岗原因: ${notArrivedReason}`,
    createdAt: checkinTime,
  });
  
  res.json({ id: newCheckin.id });
});

app.put('/api/checkin/:id', (req, res) => {
  const { id } = req.params;
  const { status, remark, notArrivedReason } = req.body;
  const c = checkin.find(c => c.id === Number(id));
  if (c) {
    c.status = status;
    c.remark = remark;
    if (notArrivedReason) {
      c.notArrivedReason = notArrivedReason;
    }
    
    const schedule = scheduling.find(s => s.id === c.schedulingId);
    if (schedule) {
      schedule.status = status === '已到岗' ? '已到岗' : '待确认';
    }
    
    const order = orders.find(o => o.id === schedule?.orderId);
    if (order) {
      order.status = status === '已到岗' ? '已到岗' : '待确认';
      order.blockReason = getBlockReason(order);
    }
    
    const sStaff = staff.find(st => st.id === c.staffId);
    operationLogs.push({
      id: operationLogs.length + 1,
      orderId: schedule?.orderId,
      operatorId: c.staffId,
      operatorName: sStaff?.name,
      operatorRole: sStaff?.role,
      action: '到岗状态更新',
      detail: `状态更新为${status}, 备注: ${remark}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    
    res.json({ changes: 1 });
  } else {
    res.json({ changes: 0 });
  }
});

app.put('/api/orders/:id/block-reason', (req, res) => {
  const { id } = req.params;
  const { blockReason } = req.body;
  const order = orders.find(o => o.id === Number(id));
  if (order) {
    order.blockReason = blockReason;
    operationLogs.push({
      id: operationLogs.length + 1,
      orderId: order.id,
      operatorId: 1,
      operatorName: '张经理',
      operatorRole: '客服',
      action: '阻塞原因更新',
      detail: blockReason,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    res.json({ changes: 1 });
  } else {
    res.json({ changes: 0 });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});