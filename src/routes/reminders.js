const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.post('/batch', (req, res) => {
  const db = getDb();
  const { type, registration_ids, content, sent_by } = req.body;

  if (!type || !Array.isArray(registration_ids) || registration_ids.length === 0) {
    return res.status(400).json({ code: 1, msg: '提醒类型和报名ID列表不能为空' });
  }

  const validTypes = ['material_missing', 'deadline_approaching', 'audit_returned', 'payment_reminder', 'general'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ code: 1, msg: `提醒类型必须是: ${validTypes.join('/')}` });
  }

  const results = [];
  const insertNotif = db.prepare(
    `INSERT INTO notifications (registration_id, type, content, sent_to, status) VALUES (?, ?, ?, ?, 'sent')`
  );

  for (const rid of registration_ids) {
    const reg = db.prepare(`
      SELECT r.*, s.name as student_name, s.guardian_phone, s.phone as student_phone
      FROM registrations r
      JOIN students s ON r.student_id = s.id
      WHERE r.id = ?
    `).get(rid);

    if (!reg) {
      results.push({ registration_id: rid, status: 'not_found' });
      continue;
    }

    let notifContent = content;
    if (!notifContent) {
      const templates = {
        material_missing: `【考级资料提醒】${reg.student_name}同学，您的考级报名资料尚不完整，请尽快补充。截止日期临近，逾期将无法参加考级。`,
        deadline_approaching: `【考级截止提醒】${reg.student_name}同学，考级报名即将截止，请尽快完成报名及资料提交。`,
        audit_returned: `【资料退回提醒】${reg.student_name}同学，您提交的考级资料已被退回，请及时修改并重新提交。`,
        payment_reminder: `【缴费提醒】${reg.student_name}同学，您尚未完成考级缴费，请尽快缴费以免影响报名。`,
        general: `【考级通知】${reg.student_name}同学，请关注您的考级报名状态，如有疑问请联系教务老师。`
      };
      notifContent = templates[type] || templates.general;
    }

    const sentTo = reg.guardian_phone || reg.student_phone;
    insertNotif.run(rid, type, notifContent, sentTo);
    results.push({ registration_id: rid, status: 'sent', sent_to: sentTo });
  }

  res.json({ code: 0, data: results });
});

router.post('/auto-missing', (req, res) => {
  const db = getDb();

  const missing = db.prepare(`
    SELECT r.id as registration_id, s.name as student_name, s.guardian_phone, s.phone as student_phone,
      es.registration_deadline, es.name as exam_name,
      GROUP_CONCAT(
        CASE WHEN rd.upload_status = 'pending' THEN rd.document_type
             WHEN rd.upload_status = 'rejected' THEN rd.document_type || '(退回)'
        END, '、'
      ) as missing_items
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    JOIN registration_documents rd ON rd.registration_id = r.id
    WHERE rd.upload_status IN ('pending', 'rejected')
      AND r.registration_status NOT IN ('approved')
      AND es.registration_deadline <= date('now','+7 days','localtime')
    GROUP BY r.id
  `).all();

  const insertNotif = db.prepare(
    `INSERT INTO notifications (registration_id, type, content, sent_to, status) VALUES (?, 'material_missing', ?, ?, 'sent')`
  );

  const results = [];
  for (const item of missing) {
    const content = `【考级资料提醒】${item.student_name}同学，您有以下资料尚未完成：${item.missing_items}。报名截止日期${item.registration_deadline}，请尽快提交。`;
    insertNotif.run(item.registration_id, content, item.guardian_phone || item.student_phone);
    results.push({ registration_id: item.registration_id, student_name: item.student_name, sent_to: item.guardian_phone || item.student_phone });
  }

  res.json({ code: 0, data: { sent_count: results.length, details: results } });
});

router.get('/', (req, res) => {
  const db = getDb();
  const { registration_id, type, status, page = 1, page_size = 20 } = req.query;

  let sql = `
    SELECT n.*, s.name as student_name
    FROM notifications n
    LEFT JOIN registrations r ON n.registration_id = r.id
    LEFT JOIN students s ON r.student_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (registration_id) {
    sql += ' AND n.registration_id = ?';
    params.push(registration_id);
  }
  if (type) {
    sql += ' AND n.type = ?';
    params.push(type);
  }
  if (status) {
    sql += ' AND n.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY n.sent_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

module.exports = router;
