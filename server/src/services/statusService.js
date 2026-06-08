const { getDb } = require('../db');
const dayjs = require('dayjs');

function recordChange(containerNo, fromStatus, toStatus, changedBy, reason, detail) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.prepare(`
    INSERT INTO status_change_logs (container_no, from_status, to_status, changed_by, changed_at, reason, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(containerNo, fromStatus || '', toStatus, changedBy || '', now, reason || '', detail || '');
}

function getChangeHistory(containerNo) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM status_change_logs WHERE container_no = ? ORDER BY changed_at DESC'
  ).all(containerNo);
}

function bulkStatusUpdate(containerIds, newStatus, changedBy) {
  const db = getDb();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const results = [];

  const transaction = db.transaction(() => {
    for (const id of containerIds) {
      const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(id);
      if (!container) continue;

      const oldStatus = container.status;
      db.prepare('UPDATE containers SET status = ? WHERE id = ?').run(newStatus, id);

      db.prepare(`
        INSERT INTO status_change_logs (container_no, from_status, to_status, changed_by, changed_at, reason, detail)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(container.container_no, oldStatus, newStatus, changedBy || '', now, '批量状态更新', '');

      results.push({ id, container_no: container.container_no, from: oldStatus, to: newStatus });
    }
  });

  transaction();
  return results;
}

module.exports = { recordChange, getChangeHistory, bulkStatusUpdate };
