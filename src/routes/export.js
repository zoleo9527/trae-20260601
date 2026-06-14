const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/roster', (req, res) => {
  const db = getDb();
  const { exam_session_id, registration_status, format } = req.query;

  if (!exam_session_id) {
    return res.status(400).json({ code: 1, msg: '考级场次ID不能为空' });
  }

  let sql = `
    SELECT
      r.id as registration_id,
      s.name as student_name,
      s.gender,
      s.birth_date,
      s.id_card_number,
      s.phone,
      s.guardian_name,
      s.guardian_phone,
      s.current_level,
      es.name as exam_name,
      es.level as exam_level,
      es.exam_date,
      es.location,
      r.costume_size,
      r.track_name,
      r.payment_status,
      r.payment_amount,
      r.registration_status,
      r.teacher_confirmed,
      t.name as confirmed_teacher_name,
      r.remark,
      (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status IN ('pending','rejected')) as missing_doc_count,
      CASE
        WHEN (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status IN ('pending','rejected')) > 0 THEN '资料不全'
        ELSE '资料齐全'
      END as doc_status_label
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN exam_sessions es ON r.exam_session_id = es.id
    LEFT JOIN teachers t ON r.teacher_confirmed_by = t.id
    WHERE r.exam_session_id = ?
  `;
  const params = [exam_session_id];

  if (registration_status) {
    sql += ' AND r.registration_status = ?';
    params.push(registration_status);
  }

  sql += ' ORDER BY s.id';

  const roster = db.prepare(sql).all(...params);

  if (format === 'csv') {
    const headers = ['报名ID', '学员姓名', '性别', '出生日期', '身份证号', '联系电话', '家长姓名', '家长电话', '当前级别', '报考级别', '考级名称', '考试日期', '考试地点', '服装尺码', '曲目', '缴费状态', '缴费金额', '报名状态', '老师确认', '确认老师', '资料状态', '缺项数', '备注'];
    const rows = roster.map(r => [
      r.registration_id,
      r.student_name,
      r.gender === 'M' ? '男' : '女',
      r.birth_date,
      r.id_card_number,
      r.phone,
      r.guardian_name,
      r.guardian_phone,
      r.current_level,
      r.exam_level,
      r.exam_name,
      r.exam_date,
      r.location,
      r.costume_size,
      r.track_name,
      r.payment_status === 'paid' ? '已缴费' : r.payment_status === 'unpaid' ? '未缴费' : '已退款',
      r.payment_amount,
      r.registration_status === 'draft' ? '草稿' : r.registration_status === 'submitted' ? '已提交' : r.registration_status === 'approved' ? '已通过' : r.registration_status === 'rejected' ? '已拒绝' : '已退回',
      r.teacher_confirmed ? '已确认' : '未确认',
      r.confirmed_teacher_name || '',
      r.doc_status_label,
      r.missing_doc_count,
      r.remark || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const BOM = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=exam_roster_${exam_session_id}.csv`);
    return res.send(BOM + csvContent);
  }

  const summary = {
    total: roster.length,
    approved: roster.filter(r => r.registration_status === 'approved').length,
    submitted: roster.filter(r => r.registration_status === 'submitted').length,
    returned: roster.filter(r => r.registration_status === 'returned').length,
    paid: roster.filter(r => r.payment_status === 'paid').length,
    unpaid: roster.filter(r => r.payment_status === 'unpaid').length,
    unconfirmed: roster.filter(r => !r.teacher_confirmed).length,
    incomplete_docs: roster.filter(r => r.missing_doc_count > 0).length,
  };

  res.json({ code: 0, data: { summary, roster } });
});

router.get('/checklist', (req, res) => {
  const db = getDb();
  const { exam_session_id } = req.query;

  if (!exam_session_id) {
    return res.status(400).json({ code: 1, msg: '考级场次ID不能为空' });
  }

  const checklist = db.prepare(`
    SELECT
      r.id as registration_id,
      s.name as student_name,
      s.id_card_number,
      r.costume_size,
      r.track_name,
      r.payment_status,
      r.teacher_confirmed,
      GROUP_CONCAT(
        CASE
          WHEN rd.upload_status = 'verified' THEN rd.document_type || '✓'
          WHEN rd.upload_status = 'rejected' THEN rd.document_type || '✗(' || COALESCE(rd.rejection_reason,'') || ')'
          WHEN rd.upload_status = 'uploaded' THEN rd.document_type || '○'
          WHEN rd.upload_status = 'pending' THEN rd.document_type || '—'
        END, '|'
      ) as doc_checklist,
      (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status != 'verified') as problem_count
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN registration_documents rd ON rd.registration_id = r.id
    WHERE r.exam_session_id = ?
    GROUP BY r.id
    ORDER BY problem_count DESC, s.name
  `).all(exam_session_id);

  const problems = checklist.filter(c => c.problem_count > 0 || c.payment_status !== 'paid' || !c.teacher_confirmed);

  res.json({
    code: 0,
    data: {
      total: checklist.length,
      problem_count: problems.length,
      problems,
      full_list: checklist
    }
  });
});

module.exports = router;
