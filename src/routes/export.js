const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { getRegistrationProblems, docLabel } = require('../validation');

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
      CASE WHEN s.id_card_number IS NULL OR s.id_card_number = '' THEN 1 ELSE 0 END as id_card_missing,
      s.phone,
      s.guardian_name,
      s.guardian_phone,
      s.current_level,
      es.name as exam_name,
      es.level as exam_level,
      es.exam_date,
      es.location,
      r.costume_size,
      CASE WHEN r.costume_size IS NULL OR r.costume_size = '' THEN 1 ELSE 0 END as costume_size_missing,
      r.track_name,
      CASE WHEN r.track_name IS NULL OR r.track_name = '' THEN 1 ELSE 0 END as track_name_missing,
      r.payment_status,
      r.payment_amount,
      r.registration_status,
      r.teacher_confirmed,
      t.name as confirmed_teacher_name,
      r.remark,
      (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status != 'verified') as missing_doc_count,
      CASE
        WHEN (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status != 'verified') > 0 THEN '资料不全'
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
    missing_id_card: roster.filter(r => r.id_card_missing).length,
    missing_costume_size: roster.filter(r => r.costume_size_missing).length,
    missing_track_name: roster.filter(r => r.track_name_missing).length,
    total_problems: roster.reduce((sum, r) => sum + r.missing_doc_count + r.id_card_missing + r.costume_size_missing + r.track_name_missing + (r.teacher_confirmed ? 0 : 1) + (r.payment_status === 'paid' ? 0 : 1), 0)
  };

  res.json({ code: 0, data: { summary, roster } });
});

router.get('/checklist', (req, res) => {
  const db = getDb();
  const { exam_session_id } = req.query;

  if (!exam_session_id) {
    return res.status(400).json({ code: 1, msg: '考级场次ID不能为空' });
  }

  const baseList = db.prepare(`
    SELECT
      r.id as registration_id,
      s.name as student_name,
      s.id_card_number,
      CASE WHEN s.id_card_number IS NULL OR s.id_card_number = '' THEN 1 ELSE 0 END as id_card_missing,
      r.costume_size,
      CASE WHEN r.costume_size IS NULL OR r.costume_size = '' THEN 1 ELSE 0 END as costume_size_missing,
      r.track_name,
      CASE WHEN r.track_name IS NULL OR r.track_name = '' THEN 1 ELSE 0 END as track_name_missing,
      r.payment_status,
      r.teacher_confirmed,
      GROUP_CONCAT(
        CASE
          WHEN rd.upload_status = 'verified' THEN rd.document_type || '✓'
          WHEN rd.upload_status = 'rejected' THEN rd.document_type || '✗(' || COALESCE(rd.rejection_reason,'') || ')'
          WHEN rd.upload_status = 'uploaded' THEN rd.document_type || '△'
          WHEN rd.upload_status = 'pending' THEN rd.document_type || '—'
        END, '|'
      ) as doc_checklist,
      (SELECT COUNT(*) FROM registration_documents rd WHERE rd.registration_id = r.id AND rd.upload_status != 'verified') as doc_problem_count
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    JOIN registration_documents rd ON rd.registration_id = r.id
    WHERE r.exam_session_id = ?
    GROUP BY r.id
  `).all(exam_session_id);

  const checklist = baseList.map(item => {
    const infoItems = [];
    let infoProblemCount = 0;

    if (!item.teacher_confirmed) {
      infoItems.push('teacher_confirm✗');
      infoProblemCount++;
    } else {
      infoItems.push('teacher_confirm✓');
    }

    if (item.id_card_missing) {
      infoItems.push('id_card✗');
      infoProblemCount++;
    } else {
      infoItems.push('id_card✓');
    }

    if (item.track_name_missing) {
      infoItems.push('track_name✗');
      infoProblemCount++;
    } else {
      infoItems.push('track_name✓');
    }

    if (item.costume_size_missing) {
      infoItems.push('costume_size✗');
      infoProblemCount++;
    } else {
      infoItems.push('costume_size✓');
    }

    if (item.payment_status !== 'paid') {
      infoItems.push('payment✗');
      infoProblemCount++;
    } else {
      infoItems.push('payment✓');
    }

    const problem_count = item.doc_problem_count + infoProblemCount;

    return {
      ...item,
      info_checklist: infoItems.join('|'),
      doc_problem_count: item.doc_problem_count,
      info_problem_count: infoProblemCount,
      problem_count: problem_count
    };
  });

  checklist.sort((a, b) => b.problem_count - a.problem_count || a.student_name.localeCompare(b.student_name, 'zh'));

  const problems = checklist.filter(c => c.problem_count > 0);

  const summary = {
    total: checklist.length,
    problem_count: problems.length,
    doc_problems: checklist.filter(c => c.doc_problem_count > 0).length,
    info_problems: checklist.filter(c => c.info_problem_count > 0).length,
    teacher_unconfirmed: checklist.filter(c => !c.teacher_confirmed).length,
    missing_id_card: checklist.filter(c => c.id_card_missing).length,
    missing_track_name: checklist.filter(c => c.track_name_missing).length,
    missing_costume_size: checklist.filter(c => c.costume_size_missing).length,
    unpaid: checklist.filter(c => c.payment_status !== 'paid').length,
    total_problem_items: checklist.reduce((sum, c) => sum + c.problem_count, 0)
  };

  res.json({
    code: 0,
    data: {
      total: checklist.length,
      problem_count: problems.length,
      summary,
      problems,
      full_list: checklist
    }
  });
});

module.exports = router;
