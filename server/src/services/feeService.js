const { getDb } = require('../db');
const bus = require('../eventBus');
const dayjs = require('dayjs');

function calculateOverdueFees() {
  const db = getDb();
  const now = dayjs();
  const containers = db.prepare(`
    SELECT c.* FROM containers c
    WHERE c.status IN ('IN_YARD', 'ALLOCATED', 'MISPLACED')
  `).all();

  const results = [];

  const transaction = db.transaction(() => {
    for (const c of containers) {
      const entryTime = dayjs(c.entry_time);
      const actualDays = now.diff(entryTime, 'day');
      const freeDays = c.cargo_type === 'DANGEROUS' ? 3 : 7;
      const dailyRate = c.type === '20GP' ? 50 : 80;
      const totalFee = Math.max(0, (actualDays - freeDays) * dailyRate);

      const existing = db.prepare(
        'SELECT * FROM fee_items WHERE container_id = ? AND status IN (?, ?)'
      ).get(c.id, 'PENDING', 'DISPUTED');

      if (existing) {
        db.prepare('UPDATE fee_items SET actual_days = ?, total_fee = ? WHERE id = ?')
          .run(actualDays, totalFee, existing.id);
        results.push({ id: existing.id, container_no: c.container_no, total_fee: totalFee, updated: true });
      } else if (totalFee > 0) {
        const r = db.prepare(`
          INSERT INTO fee_items (container_id, container_no, free_days, actual_days, daily_rate, total_fee, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
        `).run(c.id, c.container_no, freeDays, actualDays, dailyRate, totalFee, now.format('YYYY-MM-DD HH:mm:ss'));

        results.push({ id: r.lastInsertRowid, container_no: c.container_no, total_fee: totalFee, updated: false });
      }
    }
  });

  transaction();
  return results;
}

function listFeeItems(filters = {}) {
  const db = getDb();
  let sql = `
    SELECT fi.*, c.type, c.cargo_type, c.status as container_status, c.owner
    FROM fee_items fi
    LEFT JOIN containers c ON fi.container_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND fi.status = ?';
    params.push(filters.status);
  }
  if (filters.container_no) {
    sql += ' AND fi.container_no LIKE ?';
    params.push(`%${filters.container_no}%`);
  }

  sql += ' ORDER BY fi.created_at DESC';
  return db.prepare(sql).all(...params);
}

function createDispute(feeId, reason, handler) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const fee = db.prepare('SELECT * FROM fee_items WHERE id = ?').get(feeId);
  if (!fee) throw new Error('费用记录不存在');
  if (fee.status !== 'PENDING' && fee.status !== 'INVOICED') throw new Error('当前状态不可发起争议');

  db.prepare('UPDATE fee_items SET status = ?, dispute_reason = ?, dispute_handler = ? WHERE id = ?')
    .run('DISPUTED', reason, handler, feeId);

  bus.emit(bus.FEE_DISPUTED, {
    feeId,
    container_no: fee.container_no,
    reason,
    handler,
  });

  return { id: feeId, status: 'DISPUTED' };
}

function resolveDispute(feeId, result) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const fee = db.prepare('SELECT * FROM fee_items WHERE id = ?').get(feeId);
  if (!fee) throw new Error('费用记录不存在');
  if (fee.status !== 'DISPUTED') throw new Error('当前状态不是争议中');

  db.prepare('UPDATE fee_items SET status = ?, dispute_result = ? WHERE id = ?')
    .run('PAID', result, feeId);

  return { id: feeId, status: 'PAID', dispute_result: result };
}

function getFeeSummary() {
  const db = getDb();
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_count,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'INVOICED' THEN 1 ELSE 0 END) as invoiced_count,
      SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'DISPUTED' THEN 1 ELSE 0 END) as disputed_count,
      SUM(CASE WHEN status = 'PENDING' THEN total_fee ELSE 0 END) as pending_total,
      SUM(CASE WHEN status = 'INVOICED' THEN total_fee ELSE 0 END) as invoiced_total,
      SUM(CASE WHEN status = 'PAID' THEN total_fee ELSE 0 END) as paid_total,
      SUM(CASE WHEN status = 'DISPUTED' THEN total_fee ELSE 0 END) as disputed_total,
      SUM(total_fee) as grand_total
    FROM fee_items
  `).get();

  return summary;
}

module.exports = { calculateOverdueFees, listFeeItems, createDispute, resolveDispute, getFeeSummary };
