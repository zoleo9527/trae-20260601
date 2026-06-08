const { getDb } = require('../db');
const bus = require('../eventBus');
const dayjs = require('dayjs');

function registerEntry(data) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const insertContainer = db.prepare(`
    INSERT INTO containers (container_no, type, size_text, owner, cargo_type, weight_kg, status, entry_time, expected_departure, inspection_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'ENTERING', ?, ?, ?, ?)
  `);

  const insertGateRecord = db.prepare(`
    INSERT INTO gate_records (container_id, container_no, truck_no, driver_name, driver_phone, operator_id, operator_name, entry_type, entry_time, gate_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTERED')
  `);

  const transaction = db.transaction(() => {
    const sizeTextMap = { '20GP': '20英尺标准箱', '40GP': '40英尺标准箱', '40HC': '40英尺高箱', '45HC': '45英尺高箱' };

    const cResult = insertContainer.run(
      data.container_no, data.type || '20GP',
      data.size_text || sizeTextMap[data.type] || '',
      data.owner || '', data.cargo_type || 'GENERAL',
      data.weight_kg || 0, now,
      data.expected_departure || '', data.inspection_status || 'NONE',
      data.notes || ''
    );
    const containerId = cResult.lastInsertRowid;

    const gResult = insertGateRecord.run(
      containerId, data.container_no,
      data.truck_no || '', data.driver_name || '', data.driver_phone || '',
      data.operator_id || null, data.operator_name || '',
      data.entry_type || 'IMPORT', now
    );
    const gateRecordId = gResult.lastInsertRowid;

    db.prepare('UPDATE containers SET gate_record_id = ? WHERE id = ?').run(gateRecordId, containerId);

    return { containerId, gateRecordId };
  });

  const result = transaction();

  bus.emit(bus.CONTAINER_STATUS_CHANGED, {
    container_no: data.container_no,
    fromStatus: '',
    toStatus: 'ENTERING',
    changedBy: data.operator_name || '系统',
    reason: '进场登记',
  });

  return { id: result.containerId, gate_record_id: result.gateRecordId, container_no: data.container_no };
}

function modifyEntry(id, data, operator) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
  if (!container) throw new Error('集装箱记录不存在');

  const gateRecord = db.prepare('SELECT * FROM gate_records WHERE container_id = ? ORDER BY id DESC LIMIT 1').get(id);

  const transaction = db.transaction(() => {
    const fields = [];
    const values = [];

    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.size_text !== undefined) { fields.push('size_text = ?'); values.push(data.size_text); }
    if (data.owner !== undefined) { fields.push('owner = ?'); values.push(data.owner); }
    if (data.cargo_type !== undefined) { fields.push('cargo_type = ?'); values.push(data.cargo_type); }
    if (data.weight_kg !== undefined) { fields.push('weight_kg = ?'); values.push(data.weight_kg); }
    if (data.expected_departure !== undefined) { fields.push('expected_departure = ?'); values.push(data.expected_departure); }
    if (data.inspection_status !== undefined) { fields.push('inspection_status = ?'); values.push(data.inspection_status); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE containers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    if (gateRecord) {
      const grFields = [];
      const grValues = [];

      if (data.truck_no !== undefined) { grFields.push('truck_no = ?'); grValues.push(data.truck_no); }
      if (data.driver_name !== undefined) { grFields.push('driver_name = ?'); grValues.push(data.driver_name); }
      if (data.driver_phone !== undefined) { grFields.push('driver_phone = ?'); grValues.push(data.driver_phone); }
      if (data.entry_type !== undefined) { grFields.push('entry_type = ?'); grValues.push(data.entry_type); }

      if (grFields.length > 0 || data.type !== undefined || data.cargo_type !== undefined) {
        grFields.push('modified_at = ?'); grValues.push(now);
        grFields.push('modified_by = ?'); grValues.push(operator || '');
        grFields.push('modification_reason = ?'); grValues.push(data.modification_reason || '');
        grValues.push(gateRecord.id);
        db.prepare(`UPDATE gate_records SET ${grFields.join(', ')} WHERE id = ?`).run(...grValues);
      }
    }
  });

  transaction();

  const oldType = container.type;
  const oldCargo = container.cargo_type;
  const newType = data.type !== undefined ? data.type : oldType;
  const newCargo = data.cargo_type !== undefined ? data.cargo_type : oldCargo;

  if (oldType !== newType || oldCargo !== newCargo) {
    bus.emit(bus.CONTAINER_ENTRY_MODIFIED, {
      containerId: id,
      container_no: container.container_no,
      oldType,
      newType,
      oldCargo,
      newCargo,
      operator: operator || '',
      reason: data.modification_reason || '',
    });
  }

  return db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
}

function listEntries(filters = {}) {
  const db = getDb();
  let sql = `
    SELECT gr.*, c.type, c.cargo_type, c.weight_kg, c.status, c.inspection_status, c.slot_id
    FROM gate_records gr
    LEFT JOIN containers c ON gr.container_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.gate_status) {
    sql += ' AND gr.gate_status = ?';
    params.push(filters.gate_status);
  }
  if (filters.entry_type) {
    sql += ' AND gr.entry_type = ?';
    params.push(filters.entry_type);
  }
  if (filters.container_no) {
    sql += ' AND gr.container_no LIKE ?';
    params.push(`%${filters.container_no}%`);
  }
  if (filters.operator_name) {
    sql += ' AND gr.operator_name = ?';
    params.push(filters.operator_name);
  }

  sql += ' ORDER BY gr.entry_time DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(Number(filters.limit));
  }

  return db.prepare(sql).all(...params);
}

function getEntry(id) {
  const db = getDb();
  const gateRecord = db.prepare('SELECT * FROM gate_records WHERE id = ?').get(id);
  if (!gateRecord) return null;

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(gateRecord.container_id);
  return { ...gateRecord, container };
}

function listPickupContainers() {
  const db = getDb();
  return db.prepare(`
    SELECT c.*, s.slot_code, gr.truck_no as entry_truck_no, gr.driver_name as entry_driver_name, gr.driver_phone as entry_driver_phone
    FROM containers c
    LEFT JOIN slots s ON c.slot_id = s.id
    LEFT JOIN gate_records gr ON c.gate_record_id = gr.id
    WHERE c.status IN ('IN_YARD', 'ALLOCATED')
    ORDER BY c.entry_time DESC
  `).all();
}

function pickupRequest(data) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(data.container_id);
  if (!container) throw new Error('集装箱不存在');
  if (!['IN_YARD', 'ALLOCATED'].includes(container.status)) {
    throw new Error(`集装箱状态为 ${container.status}，不可提取`);
  }

  const oldStatus = container.status;

  const transaction = db.transaction(() => {
    db.prepare('UPDATE containers SET status = ? WHERE id = ?').run('DEPARTING', data.container_id);

    db.prepare(`
      INSERT INTO status_change_logs (container_no, from_status, to_status, changed_by, changed_at, reason, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      container.container_no, oldStatus, 'DEPARTING',
      data.requested_by || '客服', now, '提箱申请',
      `提箱时间: ${data.pickup_time || now}, 车牌: ${data.truck_no || ''}, 司机: ${data.driver_name || ''} ${data.driver_phone || ''}`
    );
  });

  transaction();

  bus.emit(bus.CONTAINER_STATUS_CHANGED, {
    container_no: container.container_no,
    fromStatus: oldStatus,
    toStatus: 'DEPARTING',
    changedBy: data.requested_by || '客服',
    reason: '提箱申请',
    detail: `车牌: ${data.truck_no || ''}, 司机: ${data.driver_name || ''}`,
  });

  return db.prepare('SELECT * FROM containers WHERE id = ?').get(data.container_id);
}

function listPickupRecords(filters = {}) {
  const db = getDb();
  let sql = `
    SELECT c.id, c.container_no, c.type, c.owner, c.cargo_type, c.status,
           c.slot_id, c.actual_departure,
           s.slot_code,
           latest_scl.changed_at as pickup_time,
           latest_scl.detail as pickup_detail,
           latest_scl.changed_by as requested_by
    FROM containers c
    LEFT JOIN slots s ON c.slot_id = s.id
    LEFT JOIN (
      SELECT scl.container_no, scl.changed_at, scl.detail, scl.changed_by
      FROM status_change_logs scl
      INNER JOIN (
        SELECT container_no, MAX(id) as max_id
        FROM status_change_logs
        WHERE to_status = 'DEPARTING'
        GROUP BY container_no
      ) latest ON scl.id = latest.max_id
    ) latest_scl ON latest_scl.container_no = c.container_no
    WHERE c.status IN ('DEPARTING', 'DEPARTED')
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND c.status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY latest_scl.changed_at DESC';

  return db.prepare(sql).all(...params);
}

function pickupCancel(data) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(data.container_id);
  if (!container) throw new Error('集装箱不存在');
  if (container.status !== 'DEPARTING') {
    throw new Error(`集装箱状态为 ${container.status}，非待离港状态，无法取消`);
  }

  const oldStatus = container.status;

  const transaction = db.transaction(() => {
    db.prepare('UPDATE containers SET status = ? WHERE id = ?').run('IN_YARD', data.container_id);

    db.prepare(`
      INSERT INTO status_change_logs (container_no, from_status, to_status, changed_by, changed_at, reason, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      container.container_no, 'DEPARTING', 'IN_YARD',
      data.cancelled_by || '客服', now, '取消提箱申请',
      `取消原因: ${data.cancel_reason || '客户取消'}，堆位保留: ${container.slot_id ? '是' : '无'}`
    );
  });

  transaction();

  bus.emit(bus.CONTAINER_STATUS_CHANGED, {
    container_no: container.container_no,
    fromStatus: 'DEPARTING',
    toStatus: 'IN_YARD',
    changedBy: data.cancelled_by || '客服',
    reason: '取消提箱申请',
    detail: `堆位 ${container.slot_id || '无'} 保留`,
  });

  return db.prepare('SELECT * FROM containers WHERE id = ?').get(data.container_id);
}

module.exports = { registerEntry, modifyEntry, listEntries, getEntry, listPickupContainers, pickupRequest, listPickupRecords, pickupCancel };
