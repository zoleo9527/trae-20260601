const express = require('express');
const db = require('../database/db');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { LIABILITY_MAP } = require('./leases');
const router = express.Router();

router.use(authMiddleware);

router.get('/summary', permissionMiddleware('dashboard:view'), (req, res) => {
  const role = req.user.role;
  const { brand_id, liability_type, status } = req.query;

  let baseWhere = 'WHERE 1=1';
  const baseParams = [];

  if (brand_id) {
    baseWhere += ' AND bl.brand_id = ?';
    baseParams.push(Number(brand_id));
  }
  if (status) {
    baseWhere += ' AND bl.status = ?';
    baseParams.push(status);
  }

  let statusData;
  let liabilityCount;
  let myPending;
  let totalLease;

  if (role === 'ROLE_STORE_MANAGER') {
    const brandId = req.user.brand_id;
    baseWhere += ' AND bl.brand_id = ?';
    baseParams.push(brandId);
  } else if (role === 'ROLE_MERCHANDISE_MANAGER') {
    const uid = req.user.id;
    baseWhere += ' AND bl.submitter_id = ?';
    baseParams.push(uid);
  }

  statusData = db.prepare(`
    SELECT bl.status, COUNT(*) as cnt FROM brand_leases bl ${baseWhere} GROUP BY bl.status
  `).all(...baseParams);

  let liabilityWhere = baseWhere.slice();
  const liabilityParams = [...baseParams];
  if (liability_type) {
    liabilityWhere += ' AND dr.liability_flag = ?';
    liabilityParams.push(liability_type);
  }

  liabilityCount = db.prepare(`
    SELECT COUNT(DISTINCT bl.id) as cnt FROM brand_leases bl
    INNER JOIN deduction_rules dr ON dr.lease_id = bl.id AND dr.liability_flag IS NOT NULL
    ${liabilityWhere}
      AND dr.id IN (SELECT MAX(dr2.id) FROM deduction_rules dr2 GROUP BY dr2.lease_id)
  `).get(...liabilityParams).cnt;

  const pendingParams = [...baseParams];
  myPending = db.prepare(`
    SELECT COUNT(*) as cnt FROM brand_leases bl ${baseWhere} AND bl.status = 'PENDING'
  `).get(...pendingParams).cnt;

  totalLease = db.prepare(`SELECT COUNT(*) as cnt FROM brand_leases bl ${baseWhere}`).get(...baseParams).cnt;

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

  const byBrandParams = [...baseParams];
  const byBrand = db.prepare(`
    SELECT bl.brand_id, bl.brand_name, COUNT(*) as cnt,
      SUM(CASE WHEN bl.status = 'PENDING' THEN 1 ELSE 0 END) as pending_cnt,
      SUM(CASE WHEN bl.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_cnt
    FROM brand_leases bl ${baseWhere}
    GROUP BY bl.brand_id, bl.brand_name
    ORDER BY cnt DESC
  `).all(...byBrandParams);

  const liabilityBaseParams = [...baseParams];
  let liabilityBaseWhere = baseWhere.slice();
  if (liability_type) {
    liabilityBaseWhere += ' AND dr.liability_flag = ?';
    liabilityBaseParams.push(liability_type);
  }

  const byLiabilityType = db.prepare(`
    SELECT dr.liability_flag, COUNT(DISTINCT bl.id) as cnt
    FROM brand_leases bl
    INNER JOIN deduction_rules dr ON dr.lease_id = bl.id AND dr.liability_flag IS NOT NULL
    ${liabilityBaseWhere}
      AND dr.id IN (SELECT MAX(dr2.id) FROM deduction_rules dr2 GROUP BY dr2.lease_id)
    GROUP BY dr.liability_flag
    ORDER BY cnt DESC
  `).all(...liabilityBaseParams).map(r => ({
    liability_flag: r.liability_flag,
    liability_desc: LIABILITY_MAP[r.liability_flag] || r.liability_flag,
    cnt: r.cnt,
  }));

  const blockerList = db.prepare(`
    SELECT bl.id as lease_id, bl.lease_no, bl.brand_name, bl.status as lease_status,
      u.name as submitter_name,
      dr.liability_flag, dr.liability_reason, dr.liability_marked_at,
      u2.name as liability_marker_name, dr.version as deduction_version, dr.status as deduction_status
    FROM brand_leases bl
    INNER JOIN deduction_rules dr ON dr.lease_id = bl.id AND dr.liability_flag IS NOT NULL
      AND dr.id IN (SELECT MAX(dr2.id) FROM deduction_rules dr2 GROUP BY dr2.lease_id)
    LEFT JOIN users u ON bl.submitter_id = u.id
    LEFT JOIN users u2 ON dr.liability_marked_by = u2.id
    ${liabilityBaseWhere}
    ORDER BY dr.liability_marked_at DESC LIMIT 20
  `).all(...liabilityBaseParams).map(r => ({
    ...r,
    liability_desc: LIABILITY_MAP[r.liability_flag] || r.liability_flag,
  }));

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
      byBrand,
      byLiabilityType,
      blockerList,
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
