const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.post('/review', (req, res) => {
  const db = getDb();
  const { registration_ids, action, operator_id, operator_role, comment } = req.body;

  if (!Array.isArray(registration_ids) || registration_ids.length === 0) {
    return res.status(400).json({ code: 1, msg: '请提供报名ID列表' });
  }
  if (!action || !operator_id) {
    return res.status(400).json({ code: 1, msg: '审核动作和操作人ID不能为空' });
  }

  const validActions = ['approve', 'reject', 'return'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ code: 1, msg: `审核动作必须是: ${validActions.join('/')}` });
  }

  if ((action === 'reject' || action === 'return') && !comment) {
    return res.status(400).json({ code: 1, msg: '退回/拒绝时必须填写原因' });
  }

  const statusMap = { approve: 'approved', reject: 'rejected', return: 'returned' };
  const results = [];

  const updateReg = db.prepare(
    `UPDATE registrations SET registration_status = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  );
  const insertLog = db.prepare(
    `INSERT INTO audit_logs (registration_id, action, operator_id, operator_role, comment) VALUES (?, ?, ?, ?, ?)`
  );

  for (const rid of registration_ids) {
    const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(rid);
    if (!reg) {
      results.push({ registration_id: rid, status: 'not_found' });
      continue;
    }

    if (action === 'approve') {
      const allDocsVerified = db.prepare(
        `SELECT COUNT(*) as cnt FROM registration_documents WHERE registration_id = ? AND upload_status != 'verified'`
      ).get(rid).cnt;
      if (allDocsVerified > 0) {
        results.push({ registration_id: rid, status: 'skipped', reason: '存在未通过审核的资料项' });
        continue;
      }
      if (reg.payment_status !== 'paid') {
        results.push({ registration_id: rid, status: 'skipped', reason: '未缴费' });
        continue;
      }
    }

    updateReg.run(statusMap[action], rid);
    insertLog.run(rid, action, operator_id, operator_role || 'academic', comment || null);
    results.push({ registration_id: rid, status: 'success' });
  }

  res.json({ code: 0, data: results });
});

router.get('/logs', (req, res) => {
  const db = getDb();
  const { registration_id, action, operator_role, page = 1, page_size = 20 } = req.query;

  let sql = `
    SELECT al.*, r.id as registration_id, s.name as student_name, es.name as exam_name,
      t.name as operator_name
    FROM audit_logs al
    JOIN registrations r ON al.registration_id = r.id
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    LEFT JOIN teachers t ON al.operator_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (registration_id) {
    sql += ' AND al.registration_id = ?';
    params.push(registration_id);
  }
  if (action) {
    sql += ' AND al.action = ?';
    params.push(action);
  }
  if (operator_role) {
    sql += ' AND al.operator_role = ?';
    params.push(operator_role);
  }

  sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const logs = db.prepare(sql).all(...params);
  res.json({ code: 0, data: logs });
});

router.get('/returned', (req, res) => {
  const db = getDb();

  const returned = db.prepare(`
    SELECT r.id as registration_id, r.registration_status, r.remark, r.updated_at,
      s.name as student_name, s.guardian_phone,
      es.name as exam_name, es.registration_deadline,
      (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status = 'rejected') as rejected_doc_count,
      (SELECT COUNT(*) FROM resubmission_logs rl WHERE rl.registration_id = r.id AND rl.confirmed_at IS NULL) as unconfirmed_resubmit_count
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    WHERE r.registration_status = 'returned'
    ORDER BY es.registration_deadline ASC
  `).all();

  for (const item of returned) {
    item.rejected_docs = db.prepare(`
      SELECT rd.*, al.comment as latest_return_comment
      FROM registration_documents rd
      LEFT JOIN (
        SELECT registration_id, comment, ROW_NUMBER() OVER (PARTITION BY registration_id ORDER BY created_at DESC) as rn
        FROM audit_logs WHERE action = 'return'
      ) al ON al.registration_id = rd.registration_id AND al.rn = 1
      WHERE rd.registration_id = ? AND rd.upload_status = 'rejected'
    `).all(item.registration_id);
  }

  res.json({ code: 0, data: returned });
});

module.exports = router;
