const db = require('../database/db');

const pushNotification = ({ userId, title, content, type = 'SYSTEM', relatedLeaseId = null }) => {
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, related_lease_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, title, content, type, relatedLeaseId);
};

const pushToRole = ({ role, title, content, type = 'SYSTEM', relatedLeaseId = null, excludeUserId = null }) => {
  const users = db.prepare('SELECT id FROM users WHERE role = ?').all(role);
  for (const u of users) {
    if (excludeUserId && u.id === excludeUserId) continue;
    pushNotification({ userId: u.id, title, content, type, relatedLeaseId });
  }
  return users.length;
};

module.exports = { pushNotification, pushToRole };
