const { getDb } = require('../db');
const bus = require('../eventBus');
const dayjs = require('dayjs');

function allocateSlot(containerId, preferredSlot, allocatedBy = '系统') {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(containerId);
  if (!container) throw new Error('集装箱不存在');
  if (container.status === 'DEPARTED') throw new Error('已离港集装箱无法分配位');

  const activeAlloc = db.prepare(
    'SELECT * FROM slot_allocations WHERE container_id = ? AND status = ?'
  ).get(containerId, 'ACTIVE');
  if (activeAlloc) throw new Error('集装箱已有活跃位分配，请先释放或重新分配');

  let slot;
  if (preferredSlot) {
    slot = db.prepare('SELECT * FROM slots WHERE slot_code = ?').get(preferredSlot);
    if (!slot) throw new Error('指定位不存在');
    if (slot.status === 'OCCUPIED' || slot.status === 'LOCKED') throw new Error('指定位不可用');
  } else {
    const typeToBlock = { '20GP': 'A', '40GP': 'B', '40HC': 'C', '45HC': 'B' };
    const preferredBlock = typeToBlock[container.type] || 'A';

    slot = db.prepare(`
      SELECT * FROM slots
      WHERE status = 'EMPTY'
        AND (allowed_type = '' OR allowed_type = ? OR allowed_type LIKE '%' || ? || '%')
        AND (allowed_cargo = '' OR allowed_cargo = ? OR allowed_cargo LIKE '%' || ? || '%')
      ORDER BY CASE WHEN block = ? THEN 0 ELSE 1 END, block, bay, row, tier
      LIMIT 1
    `).get(container.type, container.type, container.cargo_type, container.cargo_type, preferredBlock);
  }

  if (!slot) throw new Error('没有可用位');

  const transaction = db.transaction(() => {
    db.prepare('UPDATE slots SET container_id = ?, container_no = ?, status = ? WHERE id = ?')
      .run(containerId, container.container_no, 'OCCUPIED', slot.id);

    db.prepare(`
      INSERT INTO slot_allocations (container_id, container_no, slot_id, slot_code, allocated_by, allocated_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(containerId, container.container_no, slot.id, slot.slot_code, allocatedBy, now);

    const oldStatus = container.status;
    db.prepare('UPDATE containers SET slot_id = ?, status = ? WHERE id = ?')
      .run(slot.id, 'ALLOCATED', containerId);

    return { oldStatus, slot };
  });

  const result = transaction();

  bus.emit(bus.SLOT_ALLOCATED, {
    containerId,
    container_no: container.container_no,
    slotId: slot.id,
    slot_code: slot.slot_code,
    allocatedBy,
  });

  bus.emit(bus.CONTAINER_STATUS_CHANGED, {
    container_no: container.container_no,
    fromStatus: result.oldStatus,
    toStatus: 'ALLOCATED',
    changedBy: allocatedBy,
    reason: `分配位 ${slot.slot_code}`,
  });

  return { slot_code: slot.slot_code, slot_id: slot.id };
}

function releaseSlot(allocationId, releasedBy = '系统', reason = '') {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const allocation = db.prepare('SELECT * FROM slot_allocations WHERE id = ?').get(allocationId);
  if (!allocation) throw new Error('分配记录不存在');
  if (allocation.status !== 'ACTIVE') throw new Error('该分配已非活跃状态');

  const transaction = db.transaction(() => {
    db.prepare('UPDATE slot_allocations SET status = ? WHERE id = ?')
      .run('RELEASED', allocationId);

    const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(allocation.slot_id);
    if (slot) {
      db.prepare('UPDATE slots SET container_id = NULL, container_no = ?, status = ? WHERE id = ?')
        .run('', 'EMPTY', slot.id);
    }

    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(allocation.container_id);
    if (container) {
      db.prepare('UPDATE containers SET slot_id = NULL, status = ? WHERE id = ?')
        .run('IN_YARD', allocation.container_id);

      bus.emit(bus.CONTAINER_STATUS_CHANGED, {
        container_no: container.container_no,
        fromStatus: container.status,
        toStatus: 'IN_YARD',
        changedBy: releasedBy,
        reason: reason || `释放位 ${allocation.slot_code}`,
      });
    }
  });

  transaction();

  bus.emit(bus.SLOT_RELEASED, {
    containerId: allocation.container_id,
    container_no: allocation.container_no,
    slotId: allocation.slot_id,
    slot_code: allocation.slot_code,
    releasedBy,
    reason,
  });

  return { success: true };
}

function reallocateContainer(containerId, newSlotId, reason, allocatedBy = '系统') {
  const db = getDb();

  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(containerId);
  if (!container) throw new Error('集装箱不存在');

  const newSlot = db.prepare('SELECT * FROM slots WHERE id = ?').get(newSlotId);
  if (!newSlot) throw new Error('目标位不存在');
  if (newSlot.status === 'OCCUPIED' || newSlot.status === 'LOCKED') throw new Error('目标位不可用');

  const activeAlloc = db.prepare(
    'SELECT * FROM slot_allocations WHERE container_id = ? AND status = ?'
  ).get(containerId, 'ACTIVE');

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const transaction = db.transaction(() => {
    if (activeAlloc) {
      db.prepare('UPDATE slot_allocations SET status = ? WHERE id = ?')
        .run('OVERRIDDEN', activeAlloc.id);

      const oldSlot = db.prepare('SELECT * FROM slots WHERE id = ?').get(activeAlloc.slot_id);
      if (oldSlot) {
        db.prepare('UPDATE slots SET container_id = NULL, container_no = ?, status = ? WHERE id = ?')
          .run('', 'EMPTY', oldSlot.id);
      }
    }

    db.prepare('UPDATE slots SET container_id = ?, container_no = ?, status = ? WHERE id = ?')
      .run(containerId, container.container_no, 'OCCUPIED', newSlotId);

    db.prepare(`
      INSERT INTO slot_allocations (container_id, container_no, slot_id, slot_code, allocated_by, allocated_at, status, previous_slot_id, reason)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(
      containerId, container.container_no, newSlotId, newSlot.slot_code,
      allocatedBy, now,
      activeAlloc ? activeAlloc.slot_id : null, reason || ''
    );

    db.prepare('UPDATE containers SET slot_id = ? WHERE id = ?').run(newSlotId, containerId);

    if (container.status === 'MISPLACED') {
      db.prepare('UPDATE containers SET status = ? WHERE id = ?').run('IN_YARD', containerId);

      bus.emit(bus.CONTAINER_STATUS_CHANGED, {
        container_no: container.container_no,
        fromStatus: 'MISPLACED',
        toStatus: 'IN_YARD',
        changedBy: allocatedBy,
        reason: `纠正错位：${reason}`,
      });
    }
  });

  transaction();

  bus.emit(bus.SLOT_ALLOCATED, {
    containerId,
    container_no: container.container_no,
    slotId: newSlotId,
    slot_code: newSlot.slot_code,
    allocatedBy,
    reason,
  });

  return { slot_code: newSlot.slot_code, slot_id: newSlotId };
}

function getSlotAllocations(block, bay) {
  const db = getDb();
  let sql = 'SELECT * FROM slots WHERE 1=1';
  const params = [];

  if (block) {
    sql += ' AND block = ?';
    params.push(block);
  }
  if (bay) {
    sql += ' AND bay = ?';
    params.push(bay);
  }

  sql += ' ORDER BY block, bay, row, tier';
  return db.prepare(sql).all(...params);
}

function getAllocationHistory(containerNo) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM slot_allocations WHERE container_no = ? ORDER BY allocated_at DESC'
  ).all(containerNo);
}

function getMisplacedContainers() {
  const db = getDb();
  const containers = db.prepare(`
    SELECT c.*, s.slot_code, s.allowed_type, s.allowed_cargo, s.block, sa.id as allocation_id
    FROM containers c
    JOIN slots s ON c.slot_id = s.id
    LEFT JOIN slot_allocations sa ON sa.container_id = c.id AND sa.status = 'ACTIVE'
    WHERE c.status = 'MISPLACED'
       OR (c.slot_id IS NOT NULL AND (
         (s.allowed_type != '' AND s.allowed_type != c.type AND s.allowed_type NOT LIKE '%' || c.type || '%')
         OR (s.allowed_cargo != '' AND s.allowed_cargo != c.cargo_type AND s.allowed_cargo NOT LIKE '%' || c.cargo_type || '%')
       ))
  `).all();
  return containers;
}

function fixMisplaced(allocationId, newSlotId, allocatedBy = '系统') {
  const db = getDb();

  const allocation = db.prepare('SELECT * FROM slot_allocations WHERE id = ?').get(allocationId);
  if (!allocation) throw new Error('分配记录不存在');

  return reallocateContainer(allocation.container_id, newSlotId, '纠正错位', allocatedBy);
}

function setupEventListeners() {
  bus.on(bus.CONTAINER_ENTRY_MODIFIED, (event) => {
    const db = getDb();
    const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(event.containerId);
    if (!container || !container.slot_id) return;

    const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(container.slot_id);
    if (!slot) return;

    const typeMismatch = slot.allowed_type !== '' &&
      slot.allowed_type !== event.newType &&
      !slot.allowed_type.includes(event.newType);
    const cargoMismatch = slot.allowed_cargo !== '' &&
      slot.allowed_cargo !== event.newCargo &&
      !slot.allowed_cargo.includes(event.newCargo);

    if (typeMismatch || cargoMismatch) {
      db.prepare('UPDATE containers SET status = ? WHERE id = ?').run('MISPLACED', container.id);

      const reason = [];
      if (typeMismatch) reason.push(`类型不匹配: 位允许${slot.allowed_type}, 当前${event.newType}`);
      if (cargoMismatch) reason.push(`货物不匹配: 位允许${slot.allowed_cargo}, 当前${event.newCargo}`);

      bus.emit(bus.CONTAINER_STATUS_CHANGED, {
        container_no: container.container_no,
        fromStatus: container.status,
        toStatus: 'MISPLACED',
        changedBy: '系统-自动检测',
        reason: reason.join('; '),
        detail: `入场信息修改后位不再匹配，需要重新分配。操作人: ${event.operator}`,
      });

      console.log(`[SLOT] 集装箱 ${container.container_no} 因入场修改被标记为错位: ${reason.join('; ')}`);
    }
  });

  console.log('[SLOT] 事件监听器已注册: CONTAINER_ENTRY_MODIFIED');
}

module.exports = {
  allocateSlot,
  releaseSlot,
  reallocateContainer,
  getSlotAllocations,
  getAllocationHistory,
  getMisplacedContainers,
  fixMisplaced,
  setupEventListeners,
};
