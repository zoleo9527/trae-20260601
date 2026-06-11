const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { writeLog, LOG_ACTIONS } = require('../utils/logger');
const { pushNotification, pushToRole } = require('../utils/notify');
const router = express.Router();

router.use(authMiddleware);

const LEASE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};

const LIABILITY_MAP = {
  LEASE_NO_RULE: '租约已提交但扣点规则为空（招商经理责任）',
  RATE_ABNORMAL: '扣点比例异常（>50%），需营运督导额外确认',
  SPECIAL_CLAUSE_MISSING: '合同约定有特殊条款但扣点规则未填写（双方需协商）',
  DATE_MISMATCH: '扣点规则生效期与租约日期范围不一致',
  MANUAL_MARKED: '营运督导人工标记责任不清项',
};

const generateLeaseNo = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `OL${y}${m}${rand}`;
};

const checkLiabilityAuto = (lease, rule = null) => {
  const flags = [];

  if (lease.status === LEASE_STATUS.PENDING && (!rule || rule.status === 'DRAFT')) {
    flags.push('LEASE_NO_RULE');
  }

  if (rule) {
    if (rule.base_rate > 50 || rule.promotion_rate > 50) {
      flags.push('RATE_ABNORMAL');
    }
    if (lease.has_special_clause === 1 && (!rule.special_clause || rule.special_clause.trim() === '')) {
      flags.push('SPECIAL_CLAUSE_MISSING');
    }
    if (rule.effective_start && rule.effective_end) {
      if (rule.effective_start < lease.start_date || rule.effective_end > lease.end_date) {
        flags.push('DATE_MISMATCH');
      }
    }
  }

  return flags;
};

router.get('/', permissionMiddleware('lease:view:all'), (req, res) => {
  const { status, keyword, liability_flag, brand_id, liability_type, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE 1=1';
  const params = [];

  if (status) {
    where += ' AND l.status = ?';
    params.push(status);
  }
  if (keyword) {
    where += ' AND (l.brand_name LIKE ? OR l.lease_no LIKE ? OR l.store_code LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  if (brand_id) {
    where += ' AND l.brand_id = ?';
    params.push(Number(brand_id));
  }

  if (liability_flag === '1') {
    where += ` AND EXISTS (
      SELECT 1 FROM deduction_rules dr
      WHERE dr.lease_id = l.id AND dr.liability_flag IS NOT NULL
        AND dr.id = (SELECT MAX(id) FROM deduction_rules dr2 WHERE dr2.lease_id = l.id)
    )`;
  } else if (liability_flag === '0') {
    where += ` AND NOT EXISTS (
      SELECT 1 FROM deduction_rules dr
      WHERE dr.lease_id = l.id AND dr.liability_flag IS NOT NULL
        AND dr.id = (SELECT MAX(id) FROM deduction_rules dr2 WHERE dr2.lease_id = l.id)
    )`;
  }

  if (liability_type) {
    where += ` AND EXISTS (
      SELECT 1 FROM deduction_rules dr
      WHERE dr.lease_id = l.id AND dr.liability_flag = ?
        AND dr.id = (SELECT MAX(id) FROM deduction_rules dr2 WHERE dr2.lease_id = l.id)
    )`;
    params.push(liability_type);
  }

  const countSql = `SELECT COUNT(*) as cnt FROM brand_leases l ${where}`;
  const total = db.prepare(countSql).get(...params).cnt;

  const sql = `
    SELECT l.*, 
      u.name as submitter_name,
      u2.name as confirmer_name,
      dr_cur.liability_flag,
      dr_cur.liability_reason,
      dr_cur.liability_marked_by,
      u3.name as liability_marker_name,
      dr_cur.liability_marked_at,
      dr_cur.status as deduction_status,
      dr_cur.version as deduction_version
    FROM brand_leases l
    LEFT JOIN users u ON l.submitter_id = u.id
    LEFT JOIN users u2 ON l.confirmer_id = u2.id
    LEFT JOIN (
      SELECT dr.* FROM deduction_rules dr
      WHERE dr.id = (SELECT MAX(id) FROM deduction_rules dr2 WHERE dr2.lease_id = dr.lease_id)
    ) dr_cur ON dr_cur.lease_id = l.id
    LEFT JOIN users u3 ON dr_cur.liability_marked_by = u3.id
    ${where}
    ORDER BY l.id DESC LIMIT ? OFFSET ?
  `;
  const list = db.prepare(sql).all(...params, Number(pageSize), offset);

  for (const item of list) {
    item.liability_desc = item.liability_flag ? LIABILITY_MAP[item.liability_flag] || item.liability_flag : null;
  }

  res.json({ code: 200, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
});

router.get('/my', permissionMiddleware('lease:view:self'), (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  const uid = req.user.id;

  let where = 'WHERE l.submitter_id = ?';
  const params = [uid];
  if (status) {
    where += ' AND l.status = ?';
    params.push(status);
  }

  const countSql = `SELECT COUNT(*) as cnt FROM brand_leases l ${where}`;
  const total = db.prepare(countSql).get(...params).cnt;

  const sql = `
    SELECT l.*,
      (SELECT dr.liability_flag FROM deduction_rules dr WHERE dr.lease_id = l.id ORDER BY dr.id DESC LIMIT 1) as liability_flag
    FROM brand_leases l ${where}
    ORDER BY l.id DESC LIMIT ? OFFSET ?
  `;
  const list = db.prepare(sql).all(...params, Number(pageSize), offset);

  for (const item of list) {
    item.liability_desc = item.liability_flag ? LIABILITY_MAP[item.liability_flag] || item.liability_flag : null;
  }

  res.json({ code: 200, data: { list, total } });
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  const lease = db.prepare(`
    SELECT l.*, u.name as submitter_name, u2.name as confirmer_name
    FROM brand_leases l
    LEFT JOIN users u ON l.submitter_id = u.id
    LEFT JOIN users u2 ON l.confirmer_id = u2.id
    WHERE l.id = ?
  `).get(id);

  if (!lease) return res.status(404).json({ code: 404, message: '租约不存在' });

  const role = req.user.role;
  if (role === 'ROLE_STORE_MANAGER') {
    if (lease.brand_id !== req.user.brand_id) {
      return res.status(403).json({ code: 403, message: '品牌店长仅可查看所属品牌的租约' });
    }
  } else if (role === 'ROLE_MERCHANDISE_MANAGER') {
    if (lease.submitter_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '招商经理仅可查看自己创建的租约' });
    }
  } else if (role !== 'ROLE_OPERATION_SUPERVISOR' && role !== 'ROLE_SUPERVISOR') {
    return res.status(403).json({ code: 403, message: '无权查看此租约' });
  }

  const logs = db.prepare(`
    SELECT * FROM operation_logs WHERE lease_id = ? ORDER BY created_at DESC
  `).all(id);

  for (const log of logs) {
    try { log.action_detail = log.action_detail ? JSON.parse(log.action_detail) : null; } catch (e) {}
  }

  lease.operation_logs = logs;
  res.json({ code: 200, data: lease });
});

router.post('/', permissionMiddleware('lease:create'), (req, res) => {
  const {
    brand_id, brand_name, store_code, floor, area,
    start_date, end_date, base_rent, payment_method,
    contract_content, has_special_clause = 0,
  } = req.body;

  if (!brand_id || !brand_name || !start_date || !end_date) {
    return res.status(400).json({ code: 400, message: '品牌信息和租约日期不能为空' });
  }

  const lease_no = generateLeaseNo();
  const stmt = db.prepare(`
    INSERT INTO brand_leases
    (lease_no, brand_id, brand_name, store_code, floor, area, start_date, end_date,
     base_rent, payment_method, contract_content, has_special_clause, status, submitter_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    lease_no, brand_id, brand_name, store_code, floor, area, start_date, end_date,
    base_rent, payment_method, contract_content, has_special_clause, LEASE_STATUS.DRAFT, req.user.id
  );

  writeLog({
    leaseId: result.lastInsertRowid,
    operator: req.user,
    action: LOG_ACTIONS.LEASE_CREATE,
    actionDetail: { lease_no, brand_name },
    toStatus: LEASE_STATUS.DRAFT,
  });

  res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid, lease_no } });
});

router.put('/:id', permissionMiddleware('lease:edit:self'), (req, res) => {
  const id = req.params.id;
  const lease = db.prepare('SELECT * FROM brand_leases WHERE id = ?').get(id);
  if (!lease) return res.status(404).json({ code: 404, message: '租约不存在' });

  if (lease.status !== LEASE_STATUS.DRAFT && lease.status !== LEASE_STATUS.REJECTED) {
    return res.status(400).json({ code: 400, message: '仅草稿或已驳回状态可编辑' });
  }
  if (lease.submitter_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '仅创建者可编辑此租约' });
  }

  const fields = ['brand_name', 'store_code', 'floor', 'area', 'start_date', 'end_date',
    'base_rent', 'payment_method', 'contract_content', 'has_special_clause'];
  const updates = [];
  const values = [];
  const changes = {};

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
      if (lease[f] !== req.body[f]) changes[f] = { from: lease[f], to: req.body[f] };
    }
  }

  if (updates.length === 0) {
    return res.json({ code: 200, message: '无变更' });
  }

  values.push(id);
  db.prepare(`UPDATE brand_leases SET ${updates.join(', ')}, updated_at = datetime('now', 'localtime') WHERE id = ?`).run(...values);

  writeLog({
    leaseId: id,
    operator: req.user,
    action: LOG_ACTIONS.LEASE_EDIT,
    actionDetail: changes,
    fromStatus: lease.status,
    toStatus: lease.status,
  });

  res.json({ code: 200, message: '更新成功' });
});

router.put('/:id/submit', permissionMiddleware('lease:submit:self'), (req, res) => {
  const id = req.params.id;
  const lease = db.prepare('SELECT * FROM brand_leases WHERE id = ?').get(id);
  if (!lease) return res.status(404).json({ code: 404, message: '租约不存在' });

  if (lease.status !== LEASE_STATUS.DRAFT && lease.status !== LEASE_STATUS.REJECTED) {
    return res.status(400).json({ code: 400, message: '仅草稿或已驳回状态可提交' });
  }
  if (lease.submitter_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '仅创建者可提交此租约' });
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(`
    UPDATE brand_leases SET status = ?, submitted_at = ?, rejected_reason = NULL, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(LEASE_STATUS.PENDING, now, id);

  const rule = db.prepare('SELECT * FROM deduction_rules WHERE lease_id = ? ORDER BY version DESC, id DESC LIMIT 1').get(id);
  const flags = checkLiabilityAuto({ ...lease, status: LEASE_STATUS.PENDING }, rule);

  if (flags.length > 0) {
    if (rule) {
      db.prepare(`UPDATE deduction_rules SET liability_flag = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`)
        .run(flags[0], rule.id);
    } else {
      const latestVer = db.prepare('SELECT MAX(version) as v FROM deduction_rules WHERE lease_id = ?').get(id);
      const nextVer = (latestVer?.v || 0) + 1;
      const nowTs = new Date().toISOString().slice(0, 19).replace('T', ' ');
      db.prepare(`
        INSERT INTO deduction_rules
        (lease_id, base_rate, promotion_rate, status, version, creator_id,
         liability_flag, liability_reason, liability_marked_by, liability_marked_at)
        VALUES (?, 0, 0, 'DRAFT', ?, ?, ?, '系统自动检测：提交租约时无扣点规则', ?, ?)
      `).run(id, nextVer, req.user.id, flags[0], req.user.id, nowTs);

      writeLog({
        leaseId: id,
        operator: req.user,
        action: LOG_ACTIONS.DEDUCTION_MARK_LIABILITY,
        actionDetail: { auto_flag: flags[0], reason: '提交租约时无扣点规则，系统自动标记LEASE_NO_RULE' },
        toStatus: 'DRAFT',
      });
    }
  }

  writeLog({
    leaseId: id,
    operator: req.user,
    action: LOG_ACTIONS.LEASE_SUBMIT,
    actionDetail: { auto_liability_flags: flags },
    fromStatus: lease.status,
    toStatus: LEASE_STATUS.PENDING,
  });

  const notifyCount = pushToRole({
    role: 'ROLE_OPERATION_SUPERVISOR',
    title: '【待办】新租约待确认扣点',
    content: `租约编号 ${lease.lease_no}（${lease.brand_name}）已提交，请确认扣点规则。${flags.length > 0 ? '⚠️存在责任不清项，请关注。' : ''}`,
    relatedLeaseId: id,
  });

  res.json({
    code: 200,
    message: '提交成功，已通知营运督导确认',
    data: { notified_users: notifyCount, liability_flags: flags },
  });
});

router.put('/:id/confirm', permissionMiddleware('lease:confirm'), (req, res) => {
  const id = req.params.id;
  const lease = db.prepare('SELECT * FROM brand_leases WHERE id = ?').get(id);
  if (!lease) return res.status(404).json({ code: 404, message: '租约不存在' });

  if (lease.status !== LEASE_STATUS.PENDING) {
    return res.status(400).json({ code: 400, message: '仅待确认状态可确认生效' });
  }

  const rule = db.prepare('SELECT * FROM deduction_rules WHERE lease_id = ? ORDER BY version DESC, id DESC LIMIT 1').get(id);
  if (!rule || rule.status !== 'CONFIRMED') {
    return res.status(400).json({ code: 400, message: '扣点规则尚未确认，请先确认扣点规则' });
  }
  if (rule.liability_flag) {
    return res.status(400).json({
      code: 400,
      message: `存在责任不清标记【${LIABILITY_MAP[rule.liability_flag] || rule.liability_flag}】，清除后方可确认租约生效`,
    });
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(`
    UPDATE brand_leases SET status = ?, confirmer_id = ?, activated_at = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(LEASE_STATUS.ACTIVE, req.user.id, now, id);

  writeLog({
    leaseId: id,
    operator: req.user,
    action: LOG_ACTIONS.LEASE_CONFIRM,
    fromStatus: lease.status,
    toStatus: LEASE_STATUS.ACTIVE,
  });

  pushNotification({
    userId: lease.submitter_id,
    title: '【通知】租约已生效',
    content: `租约编号 ${lease.lease_no}（${lease.brand_name}）已由 ${req.user.name} 确认生效。`,
    relatedLeaseId: id,
  });

  res.json({ code: 200, message: '租约已确认生效' });
});

router.put('/:id/reject', permissionMiddleware('lease:reject'), (req, res) => {
  const { reason } = req.body;
  const id = req.params.id;
  const lease = db.prepare('SELECT * FROM brand_leases WHERE id = ?').get(id);
  if (!lease) return res.status(404).json({ code: 404, message: '租约不存在' });
  if (lease.status !== LEASE_STATUS.PENDING) {
    return res.status(400).json({ code: 400, message: '仅待确认状态可驳回' });
  }
  if (!reason || reason.trim() === '') {
    return res.status(400).json({ code: 400, message: '驳回原因不能为空' });
  }

  db.prepare(`
    UPDATE brand_leases SET status = ?, rejected_reason = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(LEASE_STATUS.REJECTED, reason, id);

  writeLog({
    leaseId: id,
    operator: req.user,
    action: LOG_ACTIONS.LEASE_REJECT,
    actionDetail: { reason },
    fromStatus: lease.status,
    toStatus: LEASE_STATUS.REJECTED,
  });

  pushNotification({
    userId: lease.submitter_id,
    title: '【通知】租约被驳回',
    content: `租约编号 ${lease.lease_no}（${lease.brand_name}）被驳回。原因：${reason}`,
    relatedLeaseId: id,
  });

  res.json({ code: 200, message: '已驳回，通知已发送给招商经理' });
});

router.get('/:id/deduction-history', (req, res) => {
  const leaseId = req.params.id;

  const lease = db.prepare('SELECT brand_id, submitter_id FROM brand_leases WHERE id = ?').get(leaseId);
  if (!lease) return res.status(404).json({ code: 404, message: '租约不存在' });

  const role = req.user.role;
  if (role === 'ROLE_STORE_MANAGER') {
    if (lease.brand_id !== req.user.brand_id) {
      return res.status(403).json({ code: 403, message: '品牌店长仅可查看所属品牌的扣点规则' });
    }
  } else if (role === 'ROLE_MERCHANDISE_MANAGER') {
    if (lease.submitter_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '招商经理仅可查看自己租约的扣点规则' });
    }
  } else if (role !== 'ROLE_OPERATION_SUPERVISOR' && role !== 'ROLE_SUPERVISOR') {
    return res.status(403).json({ code: 403, message: '无权查看扣点规则' });
  }
  const rules = db.prepare(`
    SELECT dr.*, u.name as creator_name, u2.name as confirmer_name
    FROM deduction_rules dr
    LEFT JOIN users u ON dr.creator_id = u.id
    LEFT JOIN users u2 ON dr.confirmer_id = u2.id
    WHERE dr.lease_id = ?
    ORDER BY dr.version DESC, dr.id DESC
  `).all(leaseId);

  for (const r of rules) {
    r.liability_desc = r.liability_flag ? LIABILITY_MAP[r.liability_flag] || r.liability_flag : null;
    try { r.tiered_rules = r.tiered_rules ? JSON.parse(r.tiered_rules) : null; } catch (e) {}
  }

  res.json({ code: 200, data: rules });
});

router.get('/options/brands', (req, res) => {
  const brands = db.prepare('SELECT * FROM brands ORDER BY id').all();
  res.json({ code: 200, data: brands });
});

module.exports = { router, LEASE_STATUS, LIABILITY_MAP };
