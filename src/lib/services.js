import { STATUS, FLOW, ROLES } from './constants.js';

let _store = null;
const DATA_PATH = typeof process !== 'undefined' 
  ? (() => {
      try {
        const path = require('path');
        const fileURLToPath = require('url').fileURLToPath;
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        return path.join(__dirname, '..', 'data.json');
      } catch(e) { return null; }
    })() : null;

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function createInitialData() {
  const data = {
    pawn_orders: [],
    status_transitions: [],
    notifications: [],
    attachments: [],
    _seq: { pawn_orders: 0, status_transitions: 0, notifications: 0, attachments: 0 }
  };

  const orders = [
    {
      order_no: 'PD20260601001', customer_name: '张三', customer_phone: '13800138001',
      item_name: '黄金项链', item_desc: '24K金，约35克，周大福品牌',
      appraised_value: 28000, loan_amount: 20000,
      pawn_date: '2026-05-01', due_date: '2026-06-01',
      current_status: 'OVERDUE_PENDING',
      transition: { from_status: 'NORMAL', to_status: 'OVERDUE_PENDING', action_type: 'INITIATE_OVERDUE', actor_role: 'APPRAISER', actor_name: '李评估', notes: '到期未赎，柜台评估师李评估确认逾期，当物外观完好无损坏' }
    },
    {
      order_no: 'PD20260515002', customer_name: '李四', customer_phone: '13800138002',
      item_name: '劳力士手表', item_desc: '潜航者系列，绿水鬼，9成新',
      appraised_value: 85000, loan_amount: 60000,
      pawn_date: '2026-04-15', due_date: '2026-05-15',
      current_status: 'OVERDUE_CONFIRMED',
      transition: { from_status: 'OVERDUE_PENDING', to_status: 'OVERDUE_CONFIRMED', action_type: 'CONFIRM_OVERDUE', actor_role: 'APPRAISER', actor_name: '李评估', notes: '评估师确认逾期，转库管核验当物；客户电话未接通' }
    },
    {
      order_no: 'PD20260401003', customer_name: '王五', customer_phone: '13800138003',
      item_name: '翡翠手镯', item_desc: '冰种飘绿，内径58mm，国家级鉴定证书',
      appraised_value: 150000, loan_amount: 100000,
      pawn_date: '2026-03-01', due_date: '2026-04-01',
      current_status: 'STORAGE_CHECKED',
      transition: { from_status: 'OVERDUE_CONFIRMED', to_status: 'STORAGE_CHECKED', action_type: 'STORAGE_AUDIT', actor_role: 'STORAGE', actor_name: '王库管', notes: '二次库房清点：证书齐全，手镯无裂纹，封条完整' }
    },
    {
      order_no: 'PD20260315004', customer_name: '赵六', customer_phone: '13800138004',
      item_name: '钻石戒指', item_desc: '1克拉，D色VVS1，GIA证书',
      appraised_value: 120000, loan_amount: 80000,
      pawn_date: '2026-02-15', due_date: '2026-03-15',
      current_status: 'FINANCIAL_SETTLED',
      transition: { from_status: 'STORAGE_CHECKED', to_status: 'FINANCIAL_SETTLED', action_type: 'FINANCIAL_SETTLE', actor_role: 'FINANCE', actor_name: '陈财务', notes: '财务核算：逾期61天，违约金累计￥4,880，待处置底价￥84,880' }
    },
    {
      order_no: 'PD20260101005', customer_name: '孙七', customer_phone: '13800138005',
      item_name: '和田玉把件', item_desc: '羊脂玉，约120克，大师工艺',
      appraised_value: 65000, loan_amount: 45000,
      pawn_date: '2025-12-01', due_date: '2026-01-01',
      current_status: 'CUSTOMER_NOTIFIED',
      transition: { from_status: 'FINANCIAL_SETTLED', to_status: 'CUSTOMER_NOTIFIED', action_type: 'NOTIFY_CUSTOMER', actor_role: 'APPRAISER', actor_name: '李评估', notes: '多渠道通知完成，客户微信确认知晓处置事宜' }
    },
    {
      order_no: 'PD20260610006', customer_name: '周八', customer_phone: '13800138006',
      item_name: '银币收藏套装', item_desc: '2008奥运纪念金币套装，原盒原证',
      appraised_value: 45000, loan_amount: 30000,
      pawn_date: '2026-05-10', due_date: '2026-06-10',
      current_status: 'NORMAL',
      transition: null
    }
  ];

  orders.forEach((order, idx) => {
    const orderId = idx + 1;
    data._seq.pawn_orders = orderId;
    const created = now();
    data.pawn_orders.push({
      id: orderId,
      order_no: order.order_no,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      item_name: order.item_name,
      item_desc: order.item_desc,
      appraised_value: order.appraised_value,
      loan_amount: order.loan_amount,
      pawn_date: order.pawn_date,
      due_date: order.due_date,
      current_status: order.current_status,
      created_at: created,
      updated_at: created
    });
    if (order.transition) {
      const tId = ++data._seq.status_transitions;
      data.status_transitions.push({
        id: tId,
        order_id: orderId,
        from_status: order.transition.from_status,
        to_status: order.transition.to_status,
        actor_role: order.transition.actor_role,
        actor_name: order.transition.actor_name,
        action_type: order.transition.action_type,
        notes: order.transition.notes,
        has_alert: 0,
        alert_message: null,
        created_at: created
      });
    }
  });

  data.notifications = [
    { id: ++data._seq.notifications, order_id: 5, transition_id: 5, notify_method: 'FORMAL', notify_channel: 'WECHAT',
      content: '孙七先生您好，您于2025-12-01典当的和田玉把件已逾期164天，请于收到通知后7日内前来办理赎当或续当手续，逾期我方将按合同约定处置当物。',
      sent_by_role: 'APPRAISER', sent_by_name: '李评估', customer_ack: 1, ack_method: 'WECHAT',
      ack_notes: '客户微信回复"知道了，下周过来处理"', sent_at: '2026-06-10 10:00:00', ack_at: '2026-06-10 14:30:00' },
    { id: ++data._seq.notifications, order_id: 5, transition_id: 5, notify_method: 'FORMAL', notify_channel: 'SMS',
      content: '【XX典当】孙七先生，您典当的和田玉把件已逾期，请尽快处理。询：400-xxx-xxxx',
      sent_by_role: 'APPRAISER', sent_by_name: '李评估', customer_ack: 0, ack_method: null,
      ack_notes: null, sent_at: '2026-06-10 10:05:00', ack_at: null },
    { id: ++data._seq.notifications, order_id: 5, transition_id: 5, notify_method: 'FORMAL', notify_channel: 'PHONE',
      content: '电话沟通记录：客户表示资金紧张，希望再宽限15天',
      sent_by_role: 'APPRAISER', sent_by_name: '李评估', customer_ack: 1, ack_method: 'PHONE',
      ack_notes: '通话时长3分20秒，客户确认宽限期', sent_at: '2026-06-11 10:15:00', ack_at: '2026-06-11 10:18:20' }
  ];

  data.attachments = [
    { id: ++data._seq.attachments, order_id: 5, transition_id: 5, notification_id: null, file_name: '微信通知截图.jpg',
      file_type: 'IMG', file_size: 0, uploaded_by_role: 'APPRAISER', uploaded_by_name: '李评估',
      storage_path: null, is_placeholder: 1, created_at: '2026-06-10 14:35:00' },
    { id: ++data._seq.attachments, order_id: 2, transition_id: 2, notification_id: null, file_name: '手表核验照片-正面.jpg',
      file_type: 'IMG', file_size: 0, uploaded_by_role: 'STORAGE', uploaded_by_name: '王库管',
      storage_path: null, is_placeholder: 1, created_at: '2026-06-08 09:20:00' }
  ];

  return data;
}

function getStore() {
  try {
    if (typeof require !== 'undefined' && DATA_PATH) {
      const fs = require('fs');
      if (_store && !fs.existsSync(DATA_PATH)) {
        _store = null;
      }
    }
  } catch (e) { /* ignore */ }
  if (_store) return _store;
  try {
    if (typeof require !== 'undefined' && require('fs').existsSync(DATA_PATH)) {
      const raw = require('fs').readFileSync(DATA_PATH, 'utf-8');
      _store = JSON.parse(raw);
    } else {
      _store = createInitialData();
      saveStore();
    }
  } catch (e) {
    _store = createInitialData();
    saveStore();
  }
  return _store;
}

function saveStore() {
  try {
    if (typeof require !== 'undefined' && DATA_PATH) {
      require('fs').writeFileSync(DATA_PATH, JSON.stringify(_store, null, 2), 'utf-8');
    }
  } catch (e) { /* ignore */ }
}

export function getAllOrders() {
  const s = getStore();
  return s.pawn_orders.slice().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

export function getOrdersByStatus(statuses) {
  const s = getStore();
  return s.pawn_orders.filter(o => statuses.includes(o.current_status))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

export function getOrderById(id) {
  const s = getStore();
  return s.pawn_orders.find(o => o.id === id) || null;
}

export function getOrderByNo(orderNo) {
  const s = getStore();
  return s.pawn_orders.find(o => o.order_no === orderNo) || null;
}

export function getTransitionsByOrderId(orderId) {
  const s = getStore();
  return s.status_transitions.filter(t => t.order_id === orderId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function getNotificationsByOrderId(orderId) {
  const s = getStore();
  return s.notifications.filter(n => n.order_id === orderId)
    .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
}

export function getAttachmentsByOrderId(orderId) {
  const s = getStore();
  return s.attachments.filter(a => a.order_id === orderId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getNotificationById(id) {
  const s = getStore();
  return s.notifications.find(n => n.id === id) || null;
}

export function getAvailableActions(order, role) {
  return FLOW.filter(f => f.from === order.current_status && f.actor === role);
}

export function executeTransition(orderId, action, role, roleName, notes, abnormalTrigger = null) {
  const s = getStore();
  const order = getOrderById(orderId);
  if (!order) throw new Error('典当单不存在');
  const flow = FLOW.find(f => f.action === action && f.from === order.current_status && f.actor === role);
  if (!flow) throw new Error('无权执行此操作或状态不匹配');

  if (flow.isAbnormal && !abnormalTrigger) {
    throw new Error('异常退回必须指定异常类型');
  }

  const alertMsg = abnormalTrigger ? abnormalTrigger.alertMessage : null;
  const hasAlert = abnormalTrigger ? 1 : 0;
  const abnormalType = abnormalTrigger ? abnormalTrigger.key : null;
  const abnormalLabel = abnormalTrigger ? abnormalTrigger.label : null;
  const abnormalSeverity = abnormalTrigger ? (abnormalTrigger.severity || 'medium') : null;

  const tId = ++s._seq.status_transitions;
  const created = now();
  s.status_transitions.push({
    id: tId,
    order_id: orderId,
    from_status: order.current_status,
    to_status: flow.to,
    actor_role: role,
    actor_name: roleName,
    action_type: action,
    notes: notes || '',
    has_alert: hasAlert,
    alert_message: alertMsg,
    abnormal_type: abnormalType,
    abnormal_label: abnormalLabel,
    abnormal_severity: abnormalSeverity,
    is_abnormal: flow.isAbnormal ? 1 : 0,
    created_at: created
  });

  const idx = s.pawn_orders.findIndex(o => o.id === orderId);
  s.pawn_orders[idx].current_status = flow.to;
  s.pawn_orders[idx].updated_at = created;

  saveStore();
  return { ...s.pawn_orders[idx], _action: flow };
}

export function createNotification(data) {
  const s = getStore();
  const { orderId, transitionId, method, channel, content, role, roleName } = data;
  const id = ++s._seq.notifications;
  const n = {
    id,
    order_id: orderId,
    transition_id: transitionId || null,
    notify_method: method,
    notify_channel: channel,
    content: content,
    sent_by_role: role,
    sent_by_name: roleName,
    customer_ack: 0,
    ack_method: null,
    ack_notes: null,
    sent_at: now(),
    ack_at: null
  };
  s.notifications.push(n);
  saveStore();
  return n;
}

export function ackNotification(notificationId, ackMethod, ackNotes) {
  const s = getStore();
  const idx = s.notifications.findIndex(n => n.id === notificationId);
  if (idx < 0) throw new Error('通知不存在');
  s.notifications[idx].customer_ack = 1;
  s.notifications[idx].ack_method = ackMethod;
  s.notifications[idx].ack_notes = ackNotes;
  s.notifications[idx].ack_at = now();
  saveStore();
  return s.notifications[idx];
}

export function createAttachment(data) {
  const s = getStore();
  const { orderId, transitionId, notificationId, fileName, fileType, fileSize, role, roleName, isPlaceholder, storagePath } = data;
  const id = ++s._seq.attachments;
  const a = {
    id,
    order_id: orderId,
    transition_id: transitionId || null,
    notification_id: notificationId || null,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize || 0,
    uploaded_by_role: role,
    uploaded_by_name: roleName,
    storage_path: storagePath || null,
    is_placeholder: isPlaceholder ? 1 : 0,
    created_at: now()
  };
  s.attachments.push(a);
  saveStore();
  return a;
}

export function getDashboardStats() {
  const s = getStore();
  const byStatusMap = {};
  s.pawn_orders.forEach(o => {
    byStatusMap[o.current_status] = (byStatusMap[o.current_status] || 0) + 1;
  });
  const byStatus = Object.entries(byStatusMap).map(([k, v]) => ({ current_status: k, cnt: v }));

  const overdue = s.pawn_orders.filter(o => !['NORMAL', 'CLOSED', 'CUSTOMER_ACKNOWLEDGED'].includes(o.current_status)).length;
  const pendingAction = s.pawn_orders.filter(o => 
    ['OVERDUE_PENDING', 'OVERDUE_CONFIRMED', 'STORAGE_CHECKED', 'FINANCIAL_SETTLED', 'CUSTOMER_NOTIFIED'].includes(o.current_status)
  ).length;
  const alerts = s.status_transitions.filter(t => t.has_alert === 1).length;

  return { byStatus, overdue, pendingAction, alerts };
}

export function getTimelineForOrder(orderId) {
  const transitions = getTransitionsByOrderId(orderId).map(t => ({
    type: 'transition',
    id: `T-${t.id}`,
    time: t.created_at,
    data: t
  }));
  const notifications = getNotificationsByOrderId(orderId).map(n => ({
    type: 'notification',
    id: `N-${n.id}`,
    time: n.sent_at,
    data: n
  }));
  return [...transitions, ...notifications].sort((a, b) => new Date(a.time) - new Date(b.time));
}

export function getLastAbnormalForOrder(orderId) {
  const transitions = getTransitionsByOrderId(orderId);
  const abnormalList = transitions.filter(t => t.is_abnormal === 1);
  if (abnormalList.length === 0) return null;
  const last = abnormalList[abnormalList.length - 1];
  const normalAfterAbnormal = transitions.filter(t => t.id > last.id && t.is_abnormal !== 1);
  if (normalAfterAbnormal.length > 0) return null;

  const abnormalCount = abnormalList.length;

  let lastRecovery = null;
  if (abnormalList.length >= 2) {
    const prevAbnormal = abnormalList[abnormalList.length - 2];
    const recoveryList = transitions.filter(t =>
      t.id > prevAbnormal.id &&
      t.id < last.id &&
      t.is_abnormal !== 1
    );
    if (recoveryList.length > 0) {
      const r = recoveryList[recoveryList.length - 1];
      lastRecovery = {
        action_type: r.action_type,
        actor_role: r.actor_role,
        actor_name: r.actor_name,
        notes: r.notes,
        from_status: r.from_status,
        to_status: r.to_status,
        created_at: r.created_at
      };
    }
  }

  return {
    abnormal_type: last.abnormal_type,
    abnormal_label: last.abnormal_label,
    abnormal_severity: last.abnormal_severity,
    alert_message: last.alert_message,
    returned_from_role: last.actor_role,
    returned_from_name: last.actor_name,
    returned_from_status: last.from_status,
    returned_to_status: last.to_status,
    action_type: last.action_type,
    notes: last.notes,
    created_at: last.created_at,
    abnormal_count: abnormalCount,
    last_recovery: lastRecovery
  };
}

export function enrichOrdersWithAbnormal(orders) {
  return orders.map(o => ({
    ...o,
    last_abnormal: getLastAbnormalForOrder(o.id)
  }));
}

export function getAbnormalOrders(role = null) {
  const all = getAllOrders();
  const enriched = enrichOrdersWithAbnormal(all).filter(o => o.last_abnormal);
  if (!role) return enriched;
  const { STATUS } = require ? require('./constants.js') : {};
  return enriched.filter(o => {
    const statusMap = {
      OVERDUE_PENDING: 'APPRAISER',
      OVERDUE_CONFIRMED: 'STORAGE',
      STORAGE_CHECKED: 'FINANCE',
      FINANCIAL_SETTLED: 'APPRAISER',
      CUSTOMER_NOTIFIED: 'APPRAISER',
      DISPOSAL_PENDING: 'FINANCE'
    };
    return statusMap[o.current_status] === role;
  });
}

export function getAbnormalStats() {
  const all = enrichOrdersWithAbnormal(getAllOrders());
  const abnormals = all.filter(o => o.last_abnormal);

  const bySeverity = {};
  const byRole = {};
  const byType = {};

  abnormals.forEach(o => {
    const sev = o.last_abnormal.abnormal_severity || 'medium';
    bySeverity[sev] = (bySeverity[sev] || 0) + 1;

    const pendingRole = STATUS[o.current_status]?.role;
    if (pendingRole) {
      byRole[pendingRole] = (byRole[pendingRole] || 0) + 1;
    }

    const typeKey = o.last_abnormal.abnormal_type || 'UNKNOWN';
    byType[typeKey] = (byType[typeKey] || 0) + 1;
  });

  const repeatAbnormals = abnormals.filter(o => o.last_abnormal.abnormal_count > 1);

  return {
    total: abnormals.length,
    bySeverity,
    byRole,
    byType,
    repeatCount: repeatAbnormals.length,
    repeatOrders: repeatAbnormals.map(o => ({
      id: o.id,
      order_no: o.order_no,
      customer_name: o.customer_name,
      item_name: o.item_name,
      abnormal_count: o.last_abnormal.abnormal_count,
      abnormal_label: o.last_abnormal.abnormal_label,
      abnormal_severity: o.last_abnormal.abnormal_severity
    }))
  };
}
