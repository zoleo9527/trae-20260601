const express = require('express');
const db = require('../database/db');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { LIABILITY_MAP } = require('./leases');
const router = express.Router();

router.use(authMiddleware);

router.get('/summary', permissionMiddleware('dashboard:view'), (req, res) => {
  const role = req.user.role;

  let statusData;
  let liabilityCount;
  let myPending;
  let totalLease;

  if (role === 'ROLE_STORE_MANAGER') {
    const brandId = req.user.brand_id;
    statusData = db.prepare(`
      SELECT status, COUNT(*) as cnt FROM brand_leases WHERE brand_id = ? GROUP BY status
    `).all(brandId);
    liabilityCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM deduction_rules dr
      LEFT JOIN brand_leases bl ON dr.lease_id = bl.id
      WHERE dr.liability_flag IS NOT NULL AND bl.brand_id = ?
        AND dr.id IN (SELECT MAX(id2) FROM deduction_rules GROUP BY lease_id)
    `).get(brandId).cnt;
    myPending = db.prepare(`
      SELECT COUNT(*) as cnt FROM brand_leases bl WHERE bl.status = 'PENDING' AND bl.brand_id = ?
    `).get(brandId).cnt;
    totalLease = db.prepare('SELECT COUNT(*) as cnt FROM brand_leases WHERE brand_id = ?').get(brandId).cnt;
  } else if (role === 'ROLE_MERCHANDISE_MANAGER') {
    const uid = req.user.id;
    statusData = db.prepare(`
      SELECT status, COUNT(*) as cnt FROM brand_leases WHERE submitter_id = ? GROUP BY status
    `).all(uid);
    liabilityCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM deduction_rules dr
      LEFT JOIN brand_leases bl ON dr.lease_id = bl.id
      WHERE dr.liability_flag IS NOT NULL AND bl.submitter_id = ?
        AND dr.id IN (SELECT MAX(id2) FROM deduction_rules GROUP BY lease_id)
    `).get(uid).cnt;
    myPending = db.prepare(`
      SELECT COUNT(*) as cnt FROM brand_leases bl WHERE bl.status = 'PENDING' AND bl.submitter_id = ?
    `).get(uid).cnt;
    totalLease = db.prepare('SELECT COUNT(*) as cnt FROM brand_leases WHERE submitter_id = ?').get(uid).cnt;
  } else {
    statusData = db.prepare(`
      SELECT status, COUNT(*) as cnt FROM brand_leases GROUP BY status
    `).all();
    liabilityCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM deduction_rules WHERE liability_flag IS NOT NULL
        AND id IN (SELECT MAX(id) FROM deduction_rules GROUP BY lease_id)
    `).get().cnt;
    myPending = db.prepare(`
      SELECT COUNT(*) as cnt FROM brand_leases bl WHERE bl.status = 'PENDING'
    `).get().cnt;
    totalLease = db.prepare('SELECT COUNT(*) as cnt FROM brand_leases').get().cnt;
  }

  const statusMap = {};
  for (const s of statusData) statusMap[s.status] = s.cnt;

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
  const role = req.user.role;
  let sql = '';
  const params = [];

  if (role === 'ROLE_OPERATION_SUPERVISOR') {
    sql = `SELECT bl.*, u.name as submitter_name,
      (SELECT dr.liability_flag FROM deduction_rules dr WHERE dr.lease_id = bl.id ORDER BY dr.id DESC LIMIT 1) as liability_flag
      FROM brand_leases bl LEFT JOIN users u ON bl.submitter_id = u.id
      WHERE bl.status = 'PENDING' ORDER BY bl.id DESC`;
  } else if (role === 'ROLE_MERCHANDISE_MANAGER') {
    sql = `SELECT bl.*, u.name as confirmer_name,
      (SELECT dr.liability_flag FROM deduction_rules dr WHERE dr.lease_id = bl.id ORDER BY dr.id DESC LIMIT 1) as liability_flag
      FROM brand_leases bl LEFT JOIN users u ON bl.confirmer_id = u.id
      WHERE bl.submitter_id = ? AND bl.status IN ('REJECTED', 'DRAFT')
      ORDER BY bl.id DESC`;
    params.push(uid);
  } else if (role === 'ROLE_STORE_MANAGER') {
    sql = `SELECT bl.*, u.name as submitter_name,
      (SELECT dr.liability_flag FROM deduction_rules dr WHERE dr.lease_id = bl.id ORDER BY dr.id DESC LIMIT 1) as liability_flag
      FROM brand_leases bl LEFT JOIN users u ON bl.submitter_id = u.id
      WHERE bl.brand_id = ? AND bl.status IN ('PENDING', 'ACTIVE')
      ORDER BY bl.id DESC LIMIT 20`;
    params.push(req.user.brand_id);
  } else if (role === 'ROLE_SUPERVISOR') {
    sql = `SELECT bl.*, u.name as submitter_name,
      (SELECT dr.liability_flag FROM deduction_rules dr WHERE dr.lease_id = bl.id ORDER BY dr.id DESC LIMIT 1) as liability_flag
      FROM brand_leases bl LEFT JOIN users u ON bl.submitter_id = u.id
      WHERE bl.status IN ('PENDING', 'DRAFT', 'REJECTED')
      ORDER BY bl.id DESC LIMIT 50`;
  } else {
    return res.status(403).json({ code: 403, message: '无权查看待办列表' });
  }

  const list = db.prepare(sql).all(...params);

  for (const item of list) {
    item.liability_desc = item.liability_flag ? LIABILITY_MAP[item.liability_flag] || item.liability_flag : null;
  }

  res.json({ code: 200, data: list });
});

module.exports = router;
