const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', (req, res) => {
  const { recordType, recordId } = req.query;
  if (!recordType || !recordId) {
    return res.status(400).json({ error: 'recordType 和 recordId 为必填参数' });
  }

  const rows = db.prepare(
    'SELECT sl.*, u.displayName as operatorName FROM status_logs sl LEFT JOIN users u ON sl.operator = u.username WHERE sl.recordType = ? AND sl.recordId = ? ORDER BY sl.operateTime ASC'
  ).all(recordType, recordId);

  res.json(rows);
});

module.exports = router;
