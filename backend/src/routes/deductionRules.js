const express = require('express');
const db = require('../database/db');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { writeLog, LOG_ACTIONS } = require('../utils/logger');
const { pushNotification, pushToRole } = require('../utils/notify');
const { LIABILITY_MAP } = require('./leases');
const router = express.Router();

router.use(authMiddleware);

router.get('/lease/:leaseId', (req, res) => {
  const leaseId = req.params.leaseId;

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
    SELECT dr.*, u.name as creator_name, u2.name as confirmer_name,
           u3.name as liability_marker_name
    FROM deduction_rules dr
    LEFT JOIN users u ON dr.creator_id = u.id
    LEFT JOIN users u2 ON dr.confirmer_id = u2.id
    LEFT JOIN users u3 ON dr.liability_marked_by = u3.id
    WHERE dr.lease_id = ?
    ORDER BY dr.version DESC, dr.id DESC
  `).all(leaseId);

  for (const r of rules) {
    r.liability_desc = r.liability_flag ? LIABILITY_MAP[r.liability_flag] || r.liability_flag : null;
    try { r.tiered_rules = r.tiered_rules ? JSON.parse(r.tiered_rules) : null; } catch (e) {}
  }

  res.json({ code: 200, data: rules });
});

router.get('/:id/version/:version', (req, res) => {
  const { id, version } = req.params;

  const lease = db.prepare('SELECT brand_id, submitter_id FROM brand_leases WHERE id = ?').get(id);
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
  const rule = db.prepare(`
    SELECT dr.*, u.name as creator_name, u2.name as confirmer_name
    FROM deduction_rules dr
    LEFT JOIN users u ON dr.creator_id = u.id
    LEFT JOIN users u2 ON dr.confirmer_id = u2.id
    WHERE dr.lease_id = ? AND dr.version = ?
    ORDER BY dr.id DESC LIMIT 1
  `).get(id, version);

  if (!rule) return res.status(404).json({ code: 404, message: '指定版本不存在' });

  rule.liability_desc = rule.liability_flag ? LIABILITY_MAP[rule.liability_flag] || rule.liability_flag : null;
  try { rule.tiered_rules = rule.tiered_rules ? JSON.parse(rule.tiered_rules) : null; } catch (e) {}

  res.json({ code: 200, data: rule });
});

router.post('/', permissionMiddleware('deduction:create'), (req, res) => {
  const {
    lease_id, base_rate, promotion_rate, tiered_rules, special_clause,
    effective_start, effective_end,
  } = req.body;

  if (!lease_id) return res.status(400).json({ code: 400, message: 'lease_id 必填' });

  const lease = db.prepare('SELECT * FROM brand_leases WHERE id = ?').get(lease_id);
  if (!lease) return res.status(404).json({ code: 404, message: '租约不存在' });
  if (lease.submitter_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '仅租约创建者可录入扣点规则' });
  }
  if (lease.status === 'ACTIVE') {
    return res.status(400).json({ code: 400, message: '租约已生效，不可新建扣点规则' });
  }

  const latest = db.prepare('SELECT MAX(version) as v FROM deduction_rules WHERE lease_id = ?').get(lease_id);
  const newVersion = (latest?.v || 0) + 1;

  if (latest && latest.v > 0) {
    db.prepare("UPDATE deduction_rules SET status = 'SUPERSEDED' WHERE lease_id = ? AND status = 'DRAFT' OR status = 'PENDING_CONFIRM'")
      .run(lease_id);
  }

  const stmt = db.prepare(`
    INSERT INTO deduction_rules
    (lease_id, base_rate, promotion_rate, tiered_rules, special_clause,
     effective_start, effective_end, status, version, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)
  `);

  const result = stmt.run(
    lease_id,
    Number(base_rate || 0),
    Number(promotion_rate || 0),
    tiered_rules ? JSON.stringify(tiered_rules) : null,
    special_clause,
    effective_start,
    effective_end,
    newVersion,
    req.user.id
  );

  writeLog({
    leaseId: lease_id,
    deductionRuleId: result.lastInsertRowid,
    operator: req.user,
    action: LOG_ACTIONS.DEDUCTION_CREATE,
    actionDetail: { version: newVersion, base_rate, promotion_rate },
  });

  res.json({ code: 200, message: '扣点规则已创建', data: { id: result.lastInsertRowid, version: newVersion } });
});

router.put('/:id', permissionMiddleware('deduction:edit:self'), (req, res) => {
  const id = req.params.id;
  const rule = db.prepare('SELECT dr.*, bl.submitter_id, bl.status as lease_status FROM deduction_rules dr LEFT JOIN brand_leases bl ON dr.lease_id = bl.id WHERE dr.id = ?').get(id);
  if (!rule) return res.status(404).json({ code: 404, message: '扣点规则不存在' });
  if (rule.submitter_id !== req.user.id) {
    return res.status(403).json({ code: 403, message: '仅创建者可编辑' });
  }
  if (rule.status !== 'DRAFT') {
    return res.status(400).json({ code: 400, message: '仅草稿状态可编辑' });
  }

  const { base_rate, promotion_rate, tiered_rules, special_clause, effective_start, effective_end } = req.body;
  const changes = {};
  const fields = { base_rate, promotion_rate, special_clause, effective_start, effective_end };

  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && rule[k] !== v) changes[k] = { from: rule[k], to: v };
  }
  if (tiered_rules !== undefined) {
    const newTr = JSON.stringify(tiered_rules);
    if (rule.tiered_rules !== newTr) changes.tiered_rules = { from: rule.tiered_rules, to: newTr };
  }
  if (Object.keys(changes).length === 0) {
    return res.json({ code: 200, message: '无变更' });
  }

  db.prepare(`
    UPDATE deduction_rules SET
      base_rate = COALESCE(?, base_rate),
      promotion_rate = COALESCE(?, promotion_rate),
      tiered_rules = COALESCE(?, tiered_rules),
      special_clause = COALESCE(?, special_clause),
      effective_start = COALESCE(?, effective_start),
      effective_end = COALESCE(?, effective_end),
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    base_rate !== undefined ? Number(base_rate) : null,
    promotion_rate !== undefined ? Number(promotion_rate) : null,
    tiered_rules !== undefined ? JSON.stringify(tiered_rules) : null,
    special_clause,
    effective_start,
    effective_end,
    id
  );

  writeLog({
    leaseId: rule.lease_id,
    deductionRuleId: id,
    operator: req.user,
    action: LOG_ACTIONS.DEDUCTION_EDIT,
    actionDetail: changes,
  });

  res.json({ code: 200, message: '已更新' });
});

router.put('/:id/confirm', permissionMiddleware('deduction:confirm'), (req, res) => {
  const id = req.params.id;
  const rule = db.prepare('SELECT dr.*, bl.status as lease_status, bl.submitter_id as lease_submitter FROM deduction_rules dr LEFT JOIN brand_leases bl ON dr.lease_id = bl.id WHERE dr.id = ?').get(id);
  if (!rule) return res.status(404).json({ code: 404, message: '扣点规则不存在' });
  if (rule.status !== 'DRAFT' && rule.status !== 'PENDING_CONFIRM') {
    return res.status(400).json({ code: 400, message: '仅草稿或待确认状态可确认' });
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(`
    UPDATE deduction_rules SET status = 'CONFIRMED', confirmer_id = ?, confirmed_at = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(req.user.id, now, id);

  writeLog({
    leaseId: rule.lease_id,
    deductionRuleId: id,
    operator: req.user,
    action: LOG_ACTIONS.DEDUCTION_CONFIRM,
    fromStatus: rule.status,
    toStatus: 'CONFIRMED',
  });

  pushNotification({
    userId: rule.lease_submitter,
    title: '【通知】扣点规则已确认',
    content: `租约ID ${rule.lease_id} 的扣点规则（版本v${rule.version}）已由 ${req.user.name} 确认。`,
    relatedLeaseId: rule.lease_id,
  });

  res.json({ code: 200, message: '扣点规则已确认' });
});

router.put('/:id/mark-liability', permissionMiddleware('deduction:mark-liability'), (req, res) => {
  const { liability_flag, liability_reason } = req.body;
  const id = req.params.id;
  const rule = db.prepare('SELECT * FROM deduction_rules WHERE id = ?').get(id);
  if (!rule) return res.status(404).json({ code: 404, message: '扣点规则不存在' });
  if (!liability_flag || !LIABILITY_MAP[liability_flag]) {
    return res.status(400).json({ code: 400, message: '无效的责任标记类型' });
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(`
    UPDATE deduction_rules SET liability_flag = ?, liability_reason = ?, liability_marked_by = ?, liability_marked_at = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(liability_flag, liability_reason || '', req.user.id, now, id);

  writeLog({
    leaseId: rule.lease_id,
    deductionRuleId: id,
    operator: req.user,
    action: LOG_ACTIONS.DEDUCTION_MARK_LIABILITY,
    actionDetail: { liability_flag, liability_reason },
  });

  const lease = db.prepare('SELECT submitter_id, lease_no, brand_name FROM brand_leases WHERE id = ?').get(rule.lease_id);
  pushNotification({
    userId: lease.submitter_id,
    title: '⚠️ 【责任标记】扣点规则存在待确认项',
    content: `租约 ${lease.lease_no}（${lease.brand_name}）的扣点规则被标记：${LIABILITY_MAP[liability_flag]}。${liability_reason ? '说明：' + liability_reason : ''}`,
    relatedLeaseId: rule.lease_id,
  });

  res.json({ code: 200, message: '已标记责任不清项，已通知招商经理' });
});

router.put('/:id/clear-liability', permissionMiddleware('deduction:mark-liability'), (req, res) => {
  const { clear_reason } = req.body;
  const id = req.params.id;
  const rule = db.prepare('SELECT dr.*, bl.submitter_id, bl.lease_no, bl.brand_name FROM deduction_rules dr LEFT JOIN brand_leases bl ON dr.lease_id = bl.id WHERE dr.id = ?').get(id);
  if (!rule) return res.status(404).json({ code: 404, message: '扣点规则不存在' });
  if (!rule.liability_flag) {
    return res.status(400).json({ code: 400, message: '当前无责任不清标记' });
  }
  if (!clear_reason || clear_reason.trim() === '') {
    return res.status(400).json({ code: 400, message: '清除说明必填' });
  }

  db.prepare(`
    UPDATE deduction_rules SET liability_flag = NULL, liability_reason = NULL, liability_marked_by = NULL, liability_marked_at = NULL, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(id);

  writeLog({
    leaseId: rule.lease_id,
    deductionRuleId: id,
    operator: req.user,
    action: LOG_ACTIONS.DEDUCTION_CLEAR_LIABILITY,
    actionDetail: { clear_reason, previous_flag: rule.liability_flag },
  });

  pushNotification({
    userId: rule.submitter_id,
    title: '【通知】责任标记已清除',
    content: `租约 ${rule.lease_no}（${rule.brand_name}）的扣点规则责任标记已由 ${req.user.name} 清除。说明：${clear_reason}`,
    relatedLeaseId: rule.lease_id,
  });

  res.json({ code: 200, message: '责任标记已清除' });
});

module.exports = router;
