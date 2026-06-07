const db = require('../db');

function logOperation(userId, action, targetType, targetId = null, detail = null) {
  try {
    db.prepare(`
      INSERT INTO operation_logs (user_id, action, target_type, target_id, detail)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, action, targetType, targetId, detail ? JSON.stringify(detail) : null);
  } catch (err) {
    console.error('记录操作日志失败:', err);
  }
}

module.exports = { logOperation };
