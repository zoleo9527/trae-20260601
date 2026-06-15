const STATUS = {
  PENDING_PICK: '待拣货',
  PICKING: '拣货中',
  PICKING_AUDIT: '拣货复核中',
  PICKING_AUDIT_REJECTED: '拣货复核驳回',
  LOADING_ARRANGE: '待装车安排',
  LOADING: '装车中',
  IN_TRANSIT: '配送中',
  DELIVERED: '已送达',
  EXCEPTION: '异常',
  COMPLETED: '已完成'
};

const ROLE = {
  WAREHOUSE_SUPERVISOR: 'warehouse_supervisor',
  DRIVER: 'driver',
  CUSTOMER_SERVICE: 'customer_service'
};

const ROLE_NAME = {
  [ROLE.WAREHOUSE_SUPERVISOR]: '仓库主管',
  [ROLE.DRIVER]: '司机',
  [ROLE.CUSTOMER_SERVICE]: '客服'
};

let orderSeq = 1000;
let noticeSeq = 1;
let exceptionSeq = 1;
let auditLogSeq = 1;

function genOrderNo() {
  orderSeq++;
  return 'SO' + orderSeq;
}

function genNoticeId() {
  return 'N' + Date.now() + '-' + (noticeSeq++);
}

function genExceptionId() {
  return 'E' + Date.now() + '-' + (exceptionSeq++);
}

function genAuditLogId() {
  return 'AL' + Date.now() + '-' + (auditLogSeq++);
}

const initialLocations = [
  { code: 'A-01-01', name: 'A区1排1列', capacity: 100, material: '高强度水泥', unit: '袋', stock: 50 },
  { code: 'A-01-02', name: 'A区1排2列', capacity: 80, material: '红砖', unit: '块', stock: 2000 },
  { code: 'B-02-03', name: 'B区2排3列', capacity: 50, material: '螺纹钢筋φ12', unit: '根', stock: 120 },
  { code: 'B-02-04', name: 'B区2排4列', capacity: 50, material: '螺纹钢筋φ16', unit: '根', stock: 80 },
  { code: 'C-03-01', name: 'C区3排1列', capacity: 30, material: 'PVC排水管φ110', unit: '米', stock: 300 },
  { code: 'C-03-02', name: 'C区3排2列', capacity: 30, material: 'PPR给水管φ25', unit: '米', stock: 500 }
];

function createInitialOrders() {
  const now = Date.now();
  const orders = [];

  orders.push({
    id: genOrderNo(),
    customer: '中建三局-城南项目部',
    address: '城南开发区科技路88号',
    contact: '王经理',
    phone: '13800138001',
    items: [
      { material: '高强度水泥', unit: '袋', qty: 30, locationCode: 'A-01-01' },
      { material: '红砖', unit: '块', qty: 500, locationCode: 'A-01-02' }
    ],
    status: STATUS.PICKING_AUDIT,
    expectedDelivery: new Date(now + 3600000 * 8).toLocaleString('zh-CN'),
    createdAt: new Date(now - 3600000 * 2).toLocaleString('zh-CN'),
    pickingAudit: {
      auditor: null,
      auditTime: null,
      actualItems: [
        { material: '高强度水泥', unit: '袋', plannedQty: 30, actualQty: 28, diff: -2, reason: '库存不足，待补货' },
        { material: '红砖', unit: '块', plannedQty: 500, actualQty: 500, diff: 0, reason: '' }
      ],
      remark: ''
    },
    loadingArrange: null,
    deliveryReceipt: null,
    auditLogs: [
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '创建拣货单', time: new Date(now - 3600000 * 1.5).toLocaleString('zh-CN'), remark: '系统自动生成拣货单' },
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '开始拣货', time: new Date(now - 3600000 * 1).toLocaleString('zh-CN'), remark: '仓库拣货员李师傅开始作业' }
    ]
  });

  orders.push({
    id: genOrderNo(),
    customer: '万科地产-翡翠湾工地',
    address: '翡翠湾小区施工现场',
    contact: '李工',
    phone: '13900139002',
    items: [
      { material: '螺纹钢筋φ12', unit: '根', qty: 100, locationCode: 'B-02-03' },
      { material: 'PVC排水管φ110', unit: '米', qty: 100, locationCode: 'C-03-01' }
    ],
    status: STATUS.LOADING_ARRANGE,
    expectedDelivery: new Date(now + 3600000 * 6).toLocaleString('zh-CN'),
    createdAt: new Date(now - 3600000 * 4).toLocaleString('zh-CN'),
    pickingAudit: {
      auditor: '张主管',
      auditTime: new Date(now - 3600000 * 2).toLocaleString('zh-CN'),
      actualItems: [
        { material: '螺纹钢筋φ12', unit: '根', plannedQty: 100, actualQty: 100, diff: 0, reason: '' },
        { material: 'PVC排水管φ110', unit: '米', plannedQty: 100, actualQty: 100, diff: 0, reason: '' }
      ],
      remark: '复核通过，数量无误'
    },
    loadingArrange: {
      arranger: null,
      arrangeTime: null,
      driver: null,
      driverPhone: null,
      vehicle: null,
      remark: ''
    },
    deliveryReceipt: null,
    auditLogs: [
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '创建拣货单', time: new Date(now - 3600000 * 3.5).toLocaleString('zh-CN'), remark: '' },
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '拣货完成', time: new Date(now - 3600000 * 2.5).toLocaleString('zh-CN'), remark: '' },
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '拣货复核通过', time: new Date(now - 3600000 * 2).toLocaleString('zh-CN'), remark: '数量准确，已入库待装车' }
    ]
  });

  orders.push({
    id: genOrderNo(),
    customer: '碧桂园-云麓华府',
    address: '云麓华府2号楼工地',
    contact: '赵队长',
    phone: '13700137003',
    items: [
      { material: 'PPR给水管φ25', unit: '米', qty: 200, locationCode: 'C-03-02' },
      { material: '高强度水泥', unit: '袋', qty: 50, locationCode: 'A-01-01' }
    ],
    status: STATUS.LOADING,
    expectedDelivery: new Date(now + 3600000 * 3).toLocaleString('zh-CN'),
    createdAt: new Date(now - 3600000 * 6).toLocaleString('zh-CN'),
    pickingAudit: {
      auditor: '张主管',
      auditTime: new Date(now - 3600000 * 4).toLocaleString('zh-CN'),
      actualItems: [
        { material: 'PPR给水管φ25', unit: '米', plannedQty: 200, actualQty: 200, diff: 0, reason: '' },
        { material: '高强度水泥', unit: '袋', plannedQty: 50, actualQty: 50, diff: 0, reason: '' }
      ],
      remark: '复核通过'
    },
    loadingArrange: {
      arranger: '王调度',
      arrangeTime: new Date(now - 3600000 * 3).toLocaleString('zh-CN'),
      driver: '刘师傅',
      driverPhone: '13600136004',
      vehicle: '皖A·B8888',
      remark: '今日下午送达，注意避开学校路段'
    },
    deliveryReceipt: null,
    auditLogs: [
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '创建拣货单', time: new Date(now - 3600000 * 5.5).toLocaleString('zh-CN'), remark: '' },
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '拣货复核通过', time: new Date(now - 3600000 * 4).toLocaleString('zh-CN'), remark: '' },
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '王调度', action: '安排装车', time: new Date(now - 3600000 * 3).toLocaleString('zh-CN'), remark: '司机刘师傅，车牌皖A·B8888' },
      { id: genAuditLogId(), role: ROLE.DRIVER, operator: '刘师傅', action: '开始装车', time: new Date(now - 3600000 * 1).toLocaleString('zh-CN'), remark: '' }
    ]
  });

  orders.push({
    id: genOrderNo(),
    customer: '保利地产-天汇广场',
    address: '天汇广场A座',
    contact: '陈工',
    phone: '13500135005',
    items: [
      { material: '螺纹钢筋φ16', unit: '根', qty: 60, locationCode: 'B-02-04' },
      { material: '红砖', unit: '块', qty: 1000, locationCode: 'A-01-02' }
    ],
    status: STATUS.EXCEPTION,
    expectedDelivery: new Date(now + 3600000 * 12).toLocaleString('zh-CN'),
    createdAt: new Date(now - 3600000 * 3).toLocaleString('zh-CN'),
    pickingAudit: {
      auditor: null,
      auditTime: null,
      actualItems: [
        { material: '螺纹钢筋φ16', unit: '根', plannedQty: 60, actualQty: 60, diff: 0, reason: '' },
        { material: '红砖', unit: '块', plannedQty: 1000, actualQty: 950, diff: -50, reason: '库存短缺' }
      ],
      remark: ''
    },
    loadingArrange: null,
    deliveryReceipt: null,
    auditLogs: [
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '创建拣货单', time: new Date(now - 3600000 * 2.5).toLocaleString('zh-CN'), remark: '' },
      { id: genAuditLogId(), role: ROLE.WAREHOUSE_SUPERVISOR, operator: '张主管', action: '拣货完成', time: new Date(now - 3600000 * 1.5).toLocaleString('zh-CN'), remark: '' }
    ]
  });

  return orders;
}

const state = {
  orders: [],
  locations: [],
  notices: [],
  exceptions: [],
  currentRole: ROLE.WAREHOUSE_SUPERVISOR
};

function resetAll() {
  orderSeq = 1000;
  noticeSeq = 1;
  exceptionSeq = 1;
  auditLogSeq = 1;
  state.orders = createInitialOrders();
  state.locations = JSON.parse(JSON.stringify(initialLocations));

  const soPicking = state.orders[0];
  const soWaiting = state.orders[1];
  const soLoading = state.orders[2];
  const soException = state.orders[3];

  state.notices = [
    { id: genNoticeId(), role: ROLE.CUSTOMER_SERVICE, title: `订单 ${soException.id} 拣货复核异常`, content: '红砖短缺50块，需要联系客户确认是否部分发货或等待补货', time: new Date(Date.now() - 1800000).toLocaleString('zh-CN'), read: false, orderId: soException.id },
    { id: genNoticeId(), role: ROLE.WAREHOUSE_SUPERVISOR, title: `订单 ${soWaiting.id} 等待装车安排`, content: '拣货复核已通过，请安排装车', time: new Date(Date.now() - 7200000).toLocaleString('zh-CN'), read: false, orderId: soWaiting.id },
    { id: genNoticeId(), role: ROLE.DRIVER, title: `订单 ${soLoading.id} 已分配装车任务`, content: '碧桂园-云麓华府订单已安排装车，请及时处理', time: new Date(Date.now() - 600000).toLocaleString('zh-CN'), read: false, orderId: soLoading.id }
  ];
  state.exceptions = [
    { id: genExceptionId(), orderId: soException.id, type: '库存不足', material: '红砖', plannedQty: 1000, actualQty: 950, diff: -50, reporter: '张主管', reportTime: new Date(Date.now() - 1800000).toLocaleString('zh-CN'), status: '待处理', handler: null, handleTime: null, handleRemark: '' }
  ];
  state.currentRole = ROLE.WAREHOUSE_SUPERVISOR;
}

function clearOrderRelatedNotices(orderId) {
  state.notices = state.notices.filter(n => n.orderId !== orderId);
}

function clearOrderExceptions(orderId) {
  state.exceptions = state.exceptions.filter(e => e.orderId !== orderId);
}

function addAuditLog(orderId, role, operator, action, remark) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  if (!order.auditLogs) order.auditLogs = [];
  order.auditLogs.push({
    id: genAuditLogId(),
    role,
    operator,
    action,
    time: new Date().toLocaleString('zh-CN'),
    remark: remark || ''
  });
}

function addNotice(role, title, content, orderId) {
  state.notices.unshift({
    id: genNoticeId(),
    role,
    title,
    content,
    time: new Date().toLocaleString('zh-CN'),
    read: false,
    orderId: orderId || null
  });
}

function addException(orderId, type, material, plannedQty, actualQty, diff, reporter, remark) {
  state.exceptions.unshift({
    id: genExceptionId(),
    orderId,
    type,
    material,
    plannedQty,
    actualQty,
    diff,
    reporter,
    reportTime: new Date().toLocaleString('zh-CN'),
    status: '待处理',
    handler: null,
    handleTime: null,
    handleRemark: remark || ''
  });
}

resetAll();

module.exports = {
  state,
  STATUS,
  ROLE,
  ROLE_NAME,
  resetAll,
  addAuditLog,
  addNotice,
  addException,
  clearOrderRelatedNotices,
  clearOrderExceptions,
  genAuditLogId,
  genNoticeId,
  genExceptionId
};
