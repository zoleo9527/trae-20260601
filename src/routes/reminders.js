const express = require('express');
const router = express.Router();
const {
  state,
  STATUS,
  ROLE,
  ROLE_NAME,
  resetAll,
  addAuditLog,
  addNotice,
  addException,
  addChangeTracking,
  confirmChange,
  clearOrderRelatedNotices,
  clearOrderExceptions,
  clearOrderChangeTrackings,
  getOrderChangeTrackings,
  getLatestPendingChange
} = require('../data/store');

router.get('/role', (req, res) => {
  res.json({ role: state.currentRole, roleName: ROLE_NAME[state.currentRole] });
});

router.post('/role', (req, res) => {
  const { role } = req.body;
  if (!Object.values(ROLE).includes(role)) {
    return res.status(400).json({ error: '无效角色' });
  }
  state.currentRole = role;
  res.json({ role: state.currentRole, roleName: ROLE_NAME[state.currentRole] });
});

router.get('/meta', (req, res) => {
  res.json({
    STATUS,
    ROLE,
    ROLE_NAME
  });
});

router.get('/orders', (req, res) => {
  const { status } = req.query;
  let orders = state.orders;
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  res.json(orders);
});

router.get('/orders/:id', (req, res) => {
  const order = state.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json(order);
});

router.get('/locations', (req, res) => {
  res.json(state.locations);
});

router.put('/orders/:id/picking-audit', (req, res) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const { auditor, actualItems, remark, action } = req.body;

  order.pickingAudit = {
    auditor: auditor || '张主管',
    auditTime: new Date().toLocaleString('zh-CN'),
    actualItems: actualItems.map(item => ({
      ...item,
      diff: (item.actualQty || 0) - (item.plannedQty || 0)
    })),
    remark: remark || ''
  };

  const hasDiff = order.pickingAudit.actualItems.some(i => i.diff !== 0);

  if (action === 'reject') {
    order.status = STATUS.PICKING_AUDIT_REJECTED;
    addAuditLog(id, ROLE.WAREHOUSE_SUPERVISOR, auditor || '张主管', '拣货复核驳回', remark || '数据不一致，需要重新拣货');
    addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${id} 拣货复核驳回`, `拣货复核被驳回：${remark || '请重新核对后提交'}`, id);
    addChangeTracking(id, '拣货复核驳回', `拣货复核被驳回：${remark || '数据不一致，需重新拣货'}`, auditor || '张主管', null, order.pickingAudit.actualItems.filter(i => i.diff !== 0));
  } else {
    if (hasDiff) {
      order.pickingAudit.actualItems.forEach(item => {
        if (item.diff !== 0) {
          addException(id, item.diff < 0 ? '库存不足' : '数量差异', item.material, item.plannedQty, item.actualQty, item.diff, auditor || '张主管', item.reason || '');
        }
      });
      addNotice(ROLE.CUSTOMER_SERVICE, `订单 ${id} 拣货复核数量异常`, `存在数量差异，请联系客户确认处理方式`, id);
      addNotice(ROLE.DRIVER, `订单 ${id} 拣货复核变更`, `实际装车数量已更新，请查看最新复核结果`, id);
    }

    if (order.loadingArrange && (order.status === STATUS.LOADING_ARRANGE || order.status === STATUS.LOADING)) {
      addNotice(ROLE.DRIVER, `订单 ${id} 装车数据已更新`, `拣货复核重新提交，装车数量有变化，请核对`, id);
      addAuditLog(id, ROLE.WAREHOUSE_SUPERVISOR, auditor || '张主管', '拣货复核变更（装车中重新修改）', `装车安排阶段复核数据更新，司机需重新核对`);
      addChangeTracking(id, '拣货复核变更（装车中重新修改）', `装车安排阶段复核数据更新，数量有变化，请司机重新核对`, auditor || '张主管', null, order.pickingAudit.actualItems.filter(i => i.diff !== 0));
    } else {
      order.status = STATUS.LOADING_ARRANGE;
      addAuditLog(id, ROLE.WAREHOUSE_SUPERVISOR, auditor || '张主管', '拣货复核通过', remark || '数量确认无误，进入装车安排');
      addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${id} 待装车安排`, '拣货复核已通过，请安排车辆和司机', id);
      addChangeTracking(id, '拣货复核通过', remark || '拣货复核通过，数量确认无误，进入装车安排阶段', auditor || '张主管', null, order.pickingAudit.actualItems.filter(i => i.diff !== 0));
    }
  }

  res.json(order);
});

router.post('/orders/:id/picking-audit/reset', (req, res) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const { operator } = req.body;

  order.status = STATUS.PICKING_AUDIT;
  order.pickingAudit = {
    auditor: null,
    auditTime: null,
    actualItems: order.items.map(item => ({
      material: item.material,
      unit: item.unit,
      plannedQty: item.qty,
      actualQty: item.qty,
      diff: 0,
      reason: ''
    })),
    remark: ''
  };

  if (order.loadingArrange) {
    order.loadingArrange = null;
  }
  if (order.deliveryReceipt) {
    order.deliveryReceipt = null;
  }

  clearOrderExceptions(id);
  clearOrderRelatedNotices(id);
  clearOrderChangeTrackings(id);

  addAuditLog(id, ROLE.WAREHOUSE_SUPERVISOR, operator || '张主管', '重置拣货复核', '已清理装车安排、异常记录和相关通知，重新进入拣货复核');
  addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${id} 已重置为待复核状态`, '请重新进行拣货复核', id);
  addNotice(ROLE.DRIVER, `订单 ${id} 装车安排已取消`, '拣货复核被重置，相关装车安排已撤销', id);

  res.json(order);
});

router.put('/orders/:id/loading-arrange', (req, res) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const { arranger, driver, driverPhone, vehicle, remark } = req.body;

  if (!order.loadingArrange) {
    order.loadingArrange = {};
  }
  order.loadingArrange = {
    arranger: arranger || '王调度',
    arrangeTime: new Date().toLocaleString('zh-CN'),
    driver: driver || order.loadingArrange.driver,
    driverPhone: driverPhone || order.loadingArrange.driverPhone,
    vehicle: vehicle || order.loadingArrange.vehicle,
    remark: remark || order.loadingArrange.remark || ''
  };
  order.status = STATUS.LOADING;

  addAuditLog(id, ROLE.WAREHOUSE_SUPERVISOR, arranger || '王调度', '安排装车', `司机${order.loadingArrange.driver}，车牌${order.loadingArrange.vehicle}`);
  if (order.loadingArrange.driver) {
    addNotice(ROLE.DRIVER, `新订单 ${id} 已分配`, `您有新的装车任务：${order.customer}，请及时处理`, id);
  }

  res.json(order);
});

router.post('/orders/:id/loading-start', (req, res) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const { operator } = req.body;
  order.status = STATUS.LOADING;
  addAuditLog(id, ROLE.DRIVER, operator || (order.loadingArrange?.driver || '司机'), '开始装车', '');
  addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${id} 司机已开始装车`, `${operator || order.loadingArrange?.driver} 已开始装车作业`, id);

  res.json(order);
});

router.post('/orders/:id/loading-complete', (req, res) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const { operator } = req.body;
  order.status = STATUS.IN_TRANSIT;
  addAuditLog(id, ROLE.DRIVER, operator || (order.loadingArrange?.driver || '司机'), '装车完成，出发配送', '');
  addNotice(ROLE.CUSTOMER_SERVICE, `订单 ${id} 已出库配送`, `司机已完成装车，正在配送途中`, id);

  res.json(order);
});

router.post('/orders/:id/delivered', (req, res) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const { operator, signer, remark } = req.body;
  order.status = STATUS.COMPLETED;
  order.deliveryReceipt = {
    signer: signer || order.contact,
    signTime: new Date().toLocaleString('zh-CN'),
    remark: remark || ''
  };
  addAuditLog(id, ROLE.DRIVER, operator || (order.loadingArrange?.driver || '司机'), '送达签收', `签收人：${signer || order.contact}`);
  addNotice(ROLE.CUSTOMER_SERVICE, `订单 ${id} 已签收`, `客户已签收，订单完成`, id);
  addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${id} 已完成配送`, `客户已确认签收`, id);

  res.json(order);
});

router.get('/orders/:id/audit-logs', (req, res) => {
  const order = state.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json(order.auditLogs || []);
});

router.get('/orders/:id/changes', (req, res) => {
  const order = state.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json(getOrderChangeTrackings(req.params.id));
});

router.post('/orders/:id/changes/:changeId/confirm', (req, res) => {
  const order = state.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  const { confirmer, remark } = req.body;
  const change = confirmChange(req.params.changeId, confirmer || '司机', remark || '');
  if (!change) return res.status(404).json({ error: '变更记录不存在' });
  addAuditLog(req.params.id, ROLE.DRIVER, confirmer || '司机', '变更确认', `确认变更「${change.changeType}」：${remark || '已核对无异议'}`);
  addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${req.params.id} 变更已确认`, `司机 ${confirmer || '司机'} 已确认变更「${change.changeType}」`, req.params.id);
  addNotice(ROLE.CUSTOMER_SERVICE, `订单 ${req.params.id} 变更已确认`, `司机已确认装车变更，配送可继续`, req.params.id);
  res.json(change);
});

router.get('/notices', (req, res) => {
  const { role, unread } = req.query;
  let notices = state.notices;
  if (role) notices = notices.filter(n => n.role === role);
  if (unread === 'true') notices = notices.filter(n => !n.read);
  res.json(notices);
});

router.post('/notices/:id/read', (req, res) => {
  const notice = state.notices.find(n => n.id === req.params.id);
  if (!notice) return res.status(404).json({ error: '通知不存在' });
  notice.read = true;
  res.json(notice);
});

router.post('/notices/read-all', (req, res) => {
  const { role } = req.body;
  state.notices.forEach(n => {
    if (!role || n.role === role) n.read = true;
  });
  res.json({ ok: true });
});

router.get('/exceptions', (req, res) => {
  const { status, orderId } = req.query;
  let exceptions = state.exceptions;
  if (status) exceptions = exceptions.filter(e => e.status === status);
  if (orderId) exceptions = exceptions.filter(e => e.orderId === orderId);
  res.json(exceptions);
});

router.put('/exceptions/:id', (req, res) => {
  const exception = state.exceptions.find(e => e.id === req.params.id);
  if (!exception) return res.status(404).json({ error: '异常不存在' });

  const { status: newStatus, handler, handleRemark } = req.body;
  exception.status = newStatus || '已处理';
  exception.handler = handler || '客服';
  exception.handleTime = new Date().toLocaleString('zh-CN');
  exception.handleRemark = handleRemark || '';

  const order = state.orders.find(o => o.id === exception.orderId);
  if (order) {
    addAuditLog(exception.orderId, ROLE.CUSTOMER_SERVICE, handler || '客服', `异常处理：${exception.type}`, handleRemark || `异常已${exception.status}`);
    if (newStatus === '已处理') {
      addChangeTracking(exception.orderId, '异常已处理', `异常「${exception.type}」已处理：${handleRemark || '已解决'}`, handler || '客服', null, [
        { material: exception.material, plannedQty: exception.plannedQty, actualQty: exception.actualQty, diff: exception.diff, reason: handleRemark || '' }
      ]);
      if (order.status === STATUS.EXCEPTION) {
        order.status = STATUS.LOADING_ARRANGE;
        addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${exception.orderId} 异常已解决`, '可以继续安排装车了', exception.orderId);
      }
    }
  }

  res.json(exception);
});

router.post('/exceptions/:id/escalate', (req, res) => {
  const exception = state.exceptions.find(e => e.id === req.params.id);
  if (!exception) return res.status(404).json({ error: '异常不存在' });

  exception.status = '已升级';
  addNotice(ROLE.CUSTOMER_SERVICE, `异常 ${exception.id} 已升级处理`, `订单 ${exception.orderId} 的 ${exception.type} 异常需要紧急处理`, exception.orderId);

  res.json(exception);
});

router.post('/demo/trigger-exception', (req, res) => {
  const { orderId, type = 'reject' } = req.body;
  let order;

  if (orderId) {
    order = state.orders.find(o => o.id === orderId);
  } else {
    order = state.orders.find(o =>
      o.status === STATUS.PICKING_AUDIT || o.status === STATUS.PICKING_AUDIT_REJECTED
    );
  }

  if (!order) return res.status(400).json({ error: '没有合适的订单可触发异常' });

  if (type === 'reject') {
    order.status = STATUS.PICKING_AUDIT_REJECTED;
    if (!order.pickingAudit) {
      order.pickingAudit = {
        auditor: '系统演示',
        auditTime: new Date().toLocaleString('zh-CN'),
        actualItems: order.items.map(i => ({
          material: i.material, unit: i.unit, plannedQty: i.qty, actualQty: i.qty, diff: 0, reason: ''
        })),
        remark: ''
      };
    }
    addAuditLog(order.id, ROLE.WAREHOUSE_SUPERVISOR, '系统演示', '拣货复核驳回', '演示触发：数据不一致，需要重新拣货');
    addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${order.id} 拣货复核驳回`, '演示触发：拣货复核被驳回，请重新核对后提交', order.id);
    addNotice(ROLE.CUSTOMER_SERVICE, `订单 ${order.id} 拣货复核异常`, '演示触发：拣货复核被驳回，可能影响配送时效', order.id);
    addChangeTracking(order.id, '拣货复核驳回', '演示触发：拣货复核被驳回，数据不一致需重新拣货', '系统演示', null, []);

    res.json({ ok: true, orderId: order.id, type: 'reject', message: '已触发拣货复核驳回异常' });
  } else if (type === 'shortage') {
    const targetItem = order.items[0];
    const shortageQty = Math.floor(targetItem.qty * 0.15) || 1;
    const actualQty = targetItem.qty - shortageQty;

    if (!order.pickingAudit) {
      order.pickingAudit = {
        auditor: null, auditTime: null,
        actualItems: order.items.map(i => ({
          material: i.material, unit: i.unit, plannedQty: i.qty, actualQty: i.qty, diff: 0, reason: ''
        })),
        remark: ''
      };
    }

    const targetActual = order.pickingAudit.actualItems.find(i => i.material === targetItem.material);
    if (targetActual) {
      targetActual.actualQty = actualQty;
      targetActual.diff = -shortageQty;
      targetActual.reason = '演示触发：库存短缺';
    }

    addException(order.id, '库存不足', targetItem.material, targetItem.qty, actualQty, -shortageQty, '系统演示', '演示触发的库存短缺异常');
    addNotice(ROLE.CUSTOMER_SERVICE, `订单 ${order.id} 拣货复核数量异常`, `演示触发：${targetItem.material} 短缺 ${shortageQty}${targetItem.unit}，请联系客户确认处理方式`, order.id);
    addNotice(ROLE.WAREHOUSE_SUPERVISOR, `订单 ${order.id} 出现库存异常`, `演示触发：${targetItem.material} 数量有差异，请复核`, order.id);
    addAuditLog(order.id, ROLE.WAREHOUSE_SUPERVISOR, '系统演示', '异常上报', `演示触发：${targetItem.material} 库存短缺 ${shortageQty}${targetItem.unit}`);
    addChangeTracking(order.id, '异常上报', `演示触发：${targetItem.material} 库存短缺 ${shortageQty}${targetItem.unit}，请复核处理`, '系统演示', null, [
      { material: targetItem.material, plannedQty: targetItem.qty, actualQty: actualQty, diff: -shortageQty, reason: '演示触发：库存短缺' }
    ]);

    if (order.status === STATUS.PICKING_AUDIT) {
    } else if (order.status === STATUS.LOADING_ARRANGE || order.status === STATUS.LOADING) {
      addNotice(ROLE.DRIVER, `订单 ${order.id} 装车数据已更新`, `演示触发：${targetItem.material} 数量变更，请核对装车数量`, order.id);
    }

    res.json({
      ok: true,
      orderId: order.id,
      type: 'shortage',
      material: targetItem.material,
      shortage: shortageQty,
      message: `已触发 ${targetItem.material} 库存短缺异常`
    });
  } else {
    res.status(400).json({ error: '未知异常类型' });
  }
});

router.post('/reset', (req, res) => {
  resetAll();
  res.json({ ok: true, message: '所有数据已重置' });
});

router.get('/dashboard', (req, res) => {
  const orders = state.orders;
  res.json({
    total: orders.length,
    byStatus: Object.values(STATUS).reduce((acc, s) => {
      acc[s] = orders.filter(o => o.status === s).length;
      return acc;
    }, {}),
    pendingAudit: orders.filter(o => o.status === STATUS.PICKING_AUDIT || o.status === STATUS.PICKING_AUDIT_REJECTED).length,
    pendingArrange: orders.filter(o => o.status === STATUS.LOADING_ARRANGE).length,
    loading: orders.filter(o => o.status === STATUS.LOADING).length,
    inTransit: orders.filter(o => o.status === STATUS.IN_TRANSIT).length,
    exception: orders.filter(o => o.status === STATUS.EXCEPTION).length,
    unreadCount: state.notices.filter(n => n.role === state.currentRole && !n.read).length,
    openExceptions: state.exceptions.filter(e => e.status === '待处理').length
  });
});

router.get('/orders-change-summary', (req, res) => {
  const AUDIT_CHANGE_ACTIONS = ['拣货复核通过', '拣货复核驳回', '拣货复核变更（装车中重新修改）', '重置拣货复核', '异常上报'];
  const result = state.orders.map(order => {
    const audit = order.pickingAudit;
    const hasAuditDiff = audit && audit.actualItems && audit.actualItems.some(i => i.diff !== 0);
    const auditDiffItems = audit && audit.actualItems ? audit.actualItems.filter(i => i.diff !== 0) : [];

    const auditLogs = order.auditLogs || [];
    const lastAuditChangeLog = [...auditLogs].reverse().find(l => AUDIT_CHANGE_ACTIONS.includes(l.action));
    const hasAuditChange = !!lastAuditChangeLog;

    const orderExceptions = state.exceptions.filter(e => e.orderId === order.id);
    const openExceptions = orderExceptions.filter(e => e.status === '待处理');
    const latestException = orderExceptions.length ? orderExceptions[orderExceptions.length - 1] : null;

    const orderNotices = state.notices.filter(n => n.orderId === order.id);
    const unreadNotices = orderNotices.filter(n => !n.read);
    const roleUnreadNotices = unreadNotices.filter(n => n.role === state.currentRole);

    const supervisorNotices = orderNotices.filter(n => n.role === ROLE.WAREHOUSE_SUPERVISOR);
    const driverNotices = orderNotices.filter(n => n.role === ROLE.DRIVER);
    const csNotices = orderNotices.filter(n => n.role === ROLE.CUSTOMER_SERVICE);
    const noticeStatusByRole = {
      warehouse_supervisor: { total: supervisorNotices.length, unread: supervisorNotices.filter(n => !n.read).length },
      driver: { total: driverNotices.length, unread: driverNotices.filter(n => !n.read).length },
      customer_service: { total: csNotices.length, unread: csNotices.filter(n => !n.read).length }
    };

    let diffSummary = null;
    if (auditDiffItems.length) {
      diffSummary = auditDiffItems.map(i =>
        `${i.material} ${i.plannedQty}${i.unit} → ${i.actualQty}${i.unit} (${i.diff > 0 ? '+' : ''}${i.diff})`
      ).join('；');
    }

    let lastAuditChangeSummary = null;
    if (lastAuditChangeLog) {
      lastAuditChangeSummary = `${lastAuditChangeLog.action}（${lastAuditChangeLog.operator}，${lastAuditChangeLog.time}）`;
      if (lastAuditChangeLog.remark) {
        lastAuditChangeSummary += ` - ${lastAuditChangeLog.remark}`;
      }
    }

    let exceptionSummary = null;
    if (latestException) {
      exceptionSummary = `${latestException.type}：${latestException.material} 差异${latestException.diff > 0 ? '+' : ''}${latestException.diff}${latestException.material.includes('管') || latestException.material.includes('钢筋') ? '米/根' : latestException.material.includes('砖') ? '块' : '袋'}（${latestException.status}）`;
      if (latestException.handleRemark) {
        exceptionSummary += ` - 处理：${latestException.handleRemark}`;
      }
    }

    const orderChanges = getOrderChangeTrackings(order.id);
    const pendingChanges = orderChanges.filter(c => c.status === '待确认');
    const pendingChange = pendingChanges.length ? pendingChanges[0] : null;
    const confirmedChanges = orderChanges.filter(c => c.status === '已确认');
    const archivedChanges = orderChanges.filter(c => c.status === '已归档');
    const latestChange = orderChanges.length ? orderChanges[0] : null;

    return {
      orderId: order.id,
      status: order.status,
      customer: order.customer,
      hasAuditDiff,
      hasAuditChange,
      diffSummary,
      lastAuditChangeSummary,
      lastAuditChangeLog: lastAuditChangeLog || null,
      auditDiffCount: auditDiffItems.length,
      exceptionCount: orderExceptions.length,
      openExceptionCount: openExceptions.length,
      latestException,
      exceptionSummary,
      hasOpenException: openExceptions.length > 0,
      unreadNoticeCount: unreadNotices.length,
      roleUnreadNoticeCount: roleUnreadNotices.length,
      hasUnreadNotice: roleUnreadNotices.length > 0,
      noticeStatusByRole,
      lastAuditTime: audit?.auditTime || null,
      lastExceptionTime: latestException?.reportTime || null,
      changeCount: orderChanges.length,
      pendingChangeCount: pendingChanges.length,
      confirmedChangeCount: confirmedChanges.length,
      archivedChangeCount: archivedChanges.length,
      hasPendingChange: pendingChanges.length > 0,
      latestChange,
      pendingChange
    };
  });

  res.json(result);
});

module.exports = router;
