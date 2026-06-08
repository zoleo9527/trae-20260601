const { getDb } = require('../db');
const bus = require('../eventBus');
const dayjs = require('dayjs');

function listInspectionPlans(filters = {}) {
  const db = getDb();
  let sql = `
    SELECT ip.*, c.type, c.cargo_type, c.status as container_status, c.owner
    FROM inspection_plans ip
    LEFT JOIN containers c ON ip.container_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND ip.status = ?';
    params.push(filters.status);
  }
  if (filters.plan_type) {
    sql += ' AND ip.plan_type = ?';
    params.push(filters.plan_type);
  }
  if (filters.container_no) {
    sql += ' AND ip.container_no LIKE ?';
    params.push(`%${filters.container_no}%`);
  }

  sql += ' ORDER BY ip.planned_date DESC';
  return db.prepare(sql).all(...params);
}

function notifyInspection(planId, notifiedTo) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const plan = db.prepare('SELECT * FROM inspection_plans WHERE id = ?').get(planId);
  if (!plan) throw new Error('查验计划不存在');
  if (plan.status !== 'SCHEDULED') throw new Error('只有计划中的查验可以发送通知');

  db.prepare('UPDATE inspection_plans SET status = ?, notified_at = ?, notified_to = ? WHERE id = ?')
    .run('NOTIFIED', now, notifiedTo, planId);

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(plan.container_id);
  if (container && container.inspection_status === 'PENDING') {
    db.prepare('UPDATE containers SET inspection_status = ? WHERE id = ?').run('NOTIFIED', container.id);
  }

  return { id: planId, status: 'NOTIFIED', notified_at: now };
}

function markMissed(planId, reason) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const plan = db.prepare('SELECT * FROM inspection_plans WHERE id = ?').get(planId);
  if (!plan) throw new Error('查验计划不存在');
  if (plan.status === 'COMPLETED') throw new Error('已完成的查验不可标记为遗漏');

  db.prepare('UPDATE inspection_plans SET status = ?, missed_reason = ? WHERE id = ?')
    .run('MISSED', reason || '', planId);

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(plan.container_id);
  if (container) {
    db.prepare('UPDATE containers SET inspection_status = ? WHERE id = ?')
      .run('NONE', container.id);
  }

  bus.emit(bus.INSPECTION_MISSED, {
    planId,
    container_no: plan.container_no,
    plan_type: plan.plan_type,
    reason,
  });

  return { id: planId, status: 'MISSED' };
}

function getMissedNotifications() {
  const db = getDb();
  return db.prepare(`
    SELECT ip.*, c.type, c.cargo_type, c.status as container_status, c.owner
    FROM inspection_plans ip
    LEFT JOIN containers c ON ip.container_id = c.id
    WHERE ip.status = 'MISSED'
    ORDER BY ip.planned_date DESC
  `).all();
}

function schedulePlan(data) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(data.container_id);
  if (!container) throw new Error('集装箱不存在');

  const result = db.prepare(`
    INSERT INTO inspection_plans (container_id, container_no, plan_type, planned_date, status)
    VALUES (?, ?, ?, ?, 'SCHEDULED')
  `).run(data.container_id, container.container_no, data.plan_type || 'CUSTOMS', data.planned_date || '');

  return { id: result.lastInsertRowid, container_no: container.container_no, status: 'SCHEDULED' };
}

module.exports = { listInspectionPlans, notifyInspection, markMissed, getMissedNotifications, schedulePlan };
