const express = require('express');
const dayjs = require('dayjs');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function parseAttachments(row) {
  if (!row) return row;
  if (typeof row.attachments === 'string') {
    try { row.attachments = JSON.parse(row.attachments); } catch { row.attachments = []; }
  }
  if (!Array.isArray(row.attachments)) row.attachments = [];
  return row;
}

router.get('/', (req, res) => {
  const pendingPatrols = db.prepare("SELECT * FROM patrols WHERE status = 'pending' ORDER BY createdAt DESC").all();

  const pendingExceptions = db.prepare("SELECT * FROM exceptions WHERE status IN ('pending', 'handling') ORDER BY createdAt DESC").all().map(parseAttachments);

  const recentLogs = db.prepare(
    'SELECT sl.*, u.displayName as operatorName FROM status_logs sl LEFT JOIN users u ON sl.operator = u.username ORDER BY sl.operateTime DESC LIMIT 20'
  ).all();

  const today = dayjs().format('YYYY-MM-DD');
  const patrolToday = db.prepare("SELECT COUNT(*) as count FROM patrols WHERE patrolDate = ?").get(today).count;
  const exceptionToday = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE date(submitTime) = ?").get(today).count;
  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM patrols WHERE status = 'pending'").get().count
    + db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status IN ('pending', 'handling')").get().count;

  res.json({
    pendingPatrols,
    pendingExceptions,
    recentLogs,
    stats: {
      patrolToday,
      exceptionToday,
      pendingCount
    }
  });
});

module.exports = router;
