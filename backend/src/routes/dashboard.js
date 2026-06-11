const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/summary', (req, res) => {
  const statusData = db.prepare(`
    SELECT status, COUNT(*) as cnt FROM brand_leases GROUP BY status
  `).all();

  const statusMap = {};
  for (const s of statusData) statusMap[s.status] = s.cnt;

  const liabilityCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM deduction_rules WHERE liability_flag IS NOT NULL
      AND id IN (SELECT MAX(id) FROM deduction_rules GROUP BY lease_id)
  `).get().cnt;

  const myPending = db.prepare(`
    SELECT COUNT(*) as cnt FROM brand_leases bl
    WHERE bl.status = 'PENDING'
  `).get().cnt;

  const totalLease = db.prepare('SELECT COUNT(*) as cnt FROM brand_leases').get().cnt;

  const logs = db.prepare(`
    SELECT 
      operator_role, action, COUNT(*) as cnt 
    FROM operation_logs 
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY operator_role, action
    ORDER BY cnt DESC LIMIT 20
  `).all();

  res.json({
    code: 200,
    data: {
      byStatus: {
        DRAFT: statusMap.DRAFT || 0,
        PENDING: statusMap.PENDING || 0,
        ACTIVE: statusMap.ACTIVE || 0,
        REJECTED: statusMap.REJECTED || 0,
      },
      totalLease,
      liabilityCount,
      pendingConfirm: myPending,
      recentActions: logs,
    },
  });
});

router.get('/my-pending', (req, res) => {
  const uid = req.user.id;
  let sql = '';
  const params = [];

  if (req.user.role === 'ROLE_OPERATION_SUPERVISOR') {
    sql = `SELECT bl.*, u.name as submitter_name,
      (SELECT dr.liability_flag FROM deduction_rules dr WHERE dr.lease_id = bl.id ORDER BY dr.id DESC LIMIT 1) as liability_flag
      FROM brand_leases bl LEFT JOIN users u ON bl.submitter_id = u.id
      WHERE bl.status = 'PENDING' ORDER BY bl.id DESC`;
  } else if (req.user.role === 'ROLE_MERCHANDISE_MANAGER') {
    sql = `SELECT bl.*, u.name as confirmer_name,
      (SELECT dr.liability_flag FROM deduction_rules dr WHERE dr.lease_id = bl.id ORDER BY dr.id DESC LIMIT 1) as liability_flag
      FROM brand_leases bl LEFT JOIN users u ON bl.confirmer_id = u.id
      WHERE bl.submitter_id = ? AND bl.status IN ('REJECTED', 'DRAFT')
      ORDER BY bl.id DESC`;
    params.push(uid);
  } else {
    sql = `SELECT bl.*, u.name as submitter_name FROM brand_leases bl
      LEFT JOIN users u ON bl.submitter_id = u.id
      WHERE bl.status = 'ACTIVE' ORDER BY bl.id DESC LIMIT 20`;
  }

  const list = db.prepare(sql).all(...params);
  res.json({ code: 200, data: list });
});

module.exports = router;
