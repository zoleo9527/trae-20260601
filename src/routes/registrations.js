const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.post('/', (req, res) => {
  const { student_id, exam_session_id, costume_size, track_name, remark } = req.body;

  if (!student_id || !exam_session_id) {
    return res.status(400).json({ code: 1, msg: '学员ID和考级场次ID不能为空' });
  }

  const db = getDb();

  const existing = db.prepare(
    'SELECT id FROM registrations WHERE student_id = ? AND exam_session_id = ?'
  ).get(student_id, exam_session_id);
  if (existing) {
    return res.status(409).json({ code: 1, msg: '该学员已报名此考级场次' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
  if (!student) {
    return res.status(404).json({ code: 1, msg: '学员不存在' });
  }

  const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(exam_session_id);
  if (!session) {
    return res.status(404).json({ code: 1, msg: '考级场次不存在' });
  }
  if (session.status !== 'open') {
    return res.status(400).json({ code: 1, msg: '该考级场次已关闭报名' });
  }

  const now = new Date();
  const deadline = new Date(session.registration_deadline);
  if (now > deadline) {
    return res.status(400).json({ code: 1, msg: '已超过报名截止日期' });
  }

  const result = db.prepare(
    `INSERT INTO registrations (student_id, exam_session_id, costume_size, track_name, remark)
     VALUES (?, ?, ?, ?, ?)`
  ).run(student_id, exam_session_id, costume_size || null, track_name || null, remark || null);

  const docTypes = ['photo', 'id_card_copy', 'previous_certificate'];
  const insertDoc = db.prepare(
    `INSERT INTO registration_documents (registration_id, document_type, upload_status) VALUES (?, ?, 'pending')`
  );
  for (const dt of docTypes) {
    insertDoc.run(result.lastInsertRowid, dt);
  }

  const registration = db.prepare(
    `SELECT r.*, s.name as student_name, s.current_level, s.guardian_phone,
      es.name as exam_name, es.level as exam_level, es.registration_deadline, es.fee
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    WHERE r.id = ?`
  ).get(result.lastInsertRowid);

  res.status(201).json({ code: 0, data: registration });
});

router.get('/', (req, res) => {
  const db = getDb();
  const {
    exam_session_id,
    registration_status,
    payment_status,
    teacher_confirmed,
    student_name,
    page = 1,
    page_size = 20
  } = req.query;

  let sql = `
    SELECT r.*, s.name as student_name, s.gender, s.current_level, s.guardian_phone,
      es.name as exam_name, es.level as exam_level, es.registration_deadline, es.fee,
      t.name as confirmed_teacher_name,
      (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status IN ('pending','rejected')) as missing_doc_count
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    LEFT JOIN teachers t ON r.teacher_confirmed_by = t.id
    WHERE 1=1
  `;
  const params = [];

  if (exam_session_id) {
    sql += ' AND r.exam_session_id = ?';
    params.push(exam_session_id);
  }
  if (registration_status) {
    sql += ' AND r.registration_status = ?';
    params.push(registration_status);
  }
  if (payment_status) {
    sql += ' AND r.payment_status = ?';
    params.push(payment_status);
  }
  if (teacher_confirmed !== undefined) {
    sql += ' AND r.teacher_confirmed = ?';
    params.push(teacher_confirmed === '1' || teacher_confirmed === 'true' ? 1 : 0);
  }
  if (student_name) {
    sql += ' AND s.name LIKE ?';
    params.push(`%${student_name}%`);
  }

  const countSql = sql.replace(/SELECT r\.\*[\s\S]*?WHERE 1=1/, 'SELECT COUNT(*) as cnt FROM registrations r JOIN students s ON r.student_id = s.id JOIN exam_sessions es ON r.exam_session_id = es.id WHERE 1=1');
  const total = db.prepare(countSql).get(...params).cnt;

  sql += ' ORDER BY r.updated_at DESC LIMIT ? OFFSET ?';
  const offset = (parseInt(page) - 1) * parseInt(page_size);
  params.push(parseInt(page_size), offset);

  const list = db.prepare(sql).all(...params);

  res.json({
    code: 0,
    data: {
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    }
  });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const registration = db.prepare(`
    SELECT r.*, s.name as student_name, s.gender, s.birth_date, s.id_card_number,
      s.phone, s.guardian_name, s.guardian_phone, s.current_level,
      es.name as exam_name, es.level as exam_level, es.exam_date, es.registration_deadline,
      es.location, es.fee,
      t.name as confirmed_teacher_name
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    LEFT JOIN teachers t ON r.teacher_confirmed_by = t.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!registration) {
    return res.status(404).json({ code: 1, msg: '报名记录不存在' });
  }

  const documents = db.prepare(
    'SELECT * FROM registration_documents WHERE registration_id = ?'
  ).all(req.params.id);

  const auditLogs = db.prepare(`
    SELECT al.*, t.name as operator_name
    FROM audit_logs al
    LEFT JOIN teachers t ON al.operator_id = t.id
    WHERE al.registration_id = ?
    ORDER BY al.created_at DESC
  `).all(req.params.id);

  const resubmissionLogs = db.prepare(`
    SELECT rl.*, t.name as confirmer_name
    FROM resubmission_logs rl
    LEFT JOIN teachers t ON rl.confirmed_by = t.id
    WHERE rl.registration_id = ?
    ORDER BY rl.resubmitted_at DESC
  `).all(req.params.id);

  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE registration_id = ? ORDER BY sent_at DESC'
  ).all(req.params.id);

  res.json({
    code: 0,
    data: {
      registration,
      documents,
      auditLogs,
      resubmissionLogs,
      notifications
    }
  });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { costume_size, track_name, remark } = req.body;

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!registration) {
    return res.status(404).json({ code: 1, msg: '报名记录不存在' });
  }

  if (registration.registration_status === 'approved') {
    return res.status(400).json({ code: 1, msg: '已审核通过的报名不可修改' });
  }

  db.prepare(
    `UPDATE registrations SET costume_size = ?, track_name = ?, remark = ?, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(
    costume_size ?? registration.costume_size,
    track_name ?? registration.track_name,
    remark ?? registration.remark,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT r.*, s.name as student_name, es.name as exam_name
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    WHERE r.id = ?
  `).get(req.params.id);

  res.json({ code: 0, data: updated });
});

router.put('/:id/confirm', (req, res) => {
  const db = getDb();
  const { teacher_id } = req.body;

  if (!teacher_id) {
    return res.status(400).json({ code: 1, msg: '任课老师ID不能为空' });
  }

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!registration) {
    return res.status(404).json({ code: 1, msg: '报名记录不存在' });
  }

  if (registration.teacher_confirmed) {
    return res.status(400).json({ code: 1, msg: '任课老师已确认，请勿重复确认' });
  }

  db.prepare(
    `UPDATE registrations SET teacher_confirmed = 1, teacher_confirmed_by = ?, teacher_confirmed_at = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(teacher_id, req.params.id);

  db.prepare(
    `INSERT INTO audit_logs (registration_id, action, operator_id, operator_role, comment) VALUES (?, 'approve', ?, 'teacher', '任课老师确认学生适合报考')`
  ).run(req.params.id, teacher_id);

  const updated = db.prepare(`
    SELECT r.*, t.name as confirmed_teacher_name
    FROM registrations r
    LEFT JOIN teachers t ON r.teacher_confirmed_by = t.id
    WHERE r.id = ?
  `).get(req.params.id);

  res.json({ code: 0, data: updated });
});

router.put('/:id/payment', (req, res) => {
  const db = getDb();
  const { payment_status, payment_amount } = req.body;

  if (!payment_status) {
    return res.status(400).json({ code: 1, msg: '缴费状态不能为空' });
  }

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!registration) {
    return res.status(404).json({ code: 1, msg: '报名记录不存在' });
  }

  const paymentTime = payment_status === 'paid' ? "datetime('now','localtime')" : null;
  db.prepare(
    `UPDATE registrations SET payment_status = ?, payment_amount = ?, payment_time = ${paymentTime ? paymentTime : 'NULL'}, updated_at = datetime('now','localtime') WHERE id = ?`
  ).run(payment_status, payment_amount || 0, req.params.id);

  const updated = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  res.json({ code: 0, data: updated });
});

module.exports = router;
