const { getDb } = require('./db');

function getRegistrationProblems(registrationId) {
  const db = getDb();

  const reg = db.prepare(`
    SELECT r.*, s.id_card_number, s.name as student_name
    FROM registrations r
    JOIN students s ON r.student_id = s.id
    WHERE r.id = ?
  `).get(registrationId);

  if (!reg) return null;

  const problems = [];

  if (!reg.teacher_confirmed) {
    problems.push({
      type: 'teacher_unconfirmed',
      label: '任课老师未确认',
      severity: 'block'
    });
  }

  if (!reg.id_card_number || reg.id_card_number.trim() === '') {
    problems.push({
      type: 'id_card_missing',
      label: '身份证号缺失',
      severity: 'block'
    });
  }

  if (!reg.track_name || reg.track_name.trim() === '') {
    problems.push({
      type: 'track_name_missing',
      label: '曲目缺失',
      severity: 'block'
    });
  }

  if (!reg.costume_size || reg.costume_size.trim() === '') {
    problems.push({
      type: 'costume_size_missing',
      label: '服装尺码缺失',
      severity: 'block'
    });
  }

  if (reg.payment_status !== 'paid') {
    problems.push({
      type: 'payment_unpaid',
      label: '未缴费',
      severity: 'block'
    });
  }

  const docProblems = db.prepare(`
    SELECT * FROM registration_documents
    WHERE registration_id = ? AND upload_status != 'verified'
  `).all(registrationId);

  for (const doc of docProblems) {
    const statusMap = {
      pending: { label: '未上传', severity: 'block' },
      uploaded: { label: '已上传待审', severity: 'warn' },
      rejected: { label: `被退回: ${doc.rejection_reason || ''}`, severity: 'block' }
    };
    const status = statusMap[doc.upload_status] || { label: doc.upload_status, severity: 'warn' };
    problems.push({
      type: `doc_${doc.document_type}`,
      label: `${docLabel(doc.document_type)}${status.label}`,
      severity: status.severity,
      document_id: doc.id
    });
  }

  return {
    registration: reg,
    problems,
    blockingCount: problems.filter(p => p.severity === 'block').length,
    canApprove: problems.filter(p => p.severity === 'block').length === 0
  };
}

function docLabel(type) {
  const map = {
    photo: '照片',
    id_card_copy: '身份证复印件',
    previous_certificate: '上一级证书',
    track_video: '曲目视频',
    other: '其他资料'
  };
  return map[type] || type;
}

function generateReturnComment(registrationId) {
  const result = getRegistrationProblems(registrationId);
  if (!result) return '资料审核未通过';
  if (result.problems.length === 0) return null;

  const blocking = result.problems.filter(p => p.severity === 'block');
  const warnings = result.problems.filter(p => p.severity === 'warn');

  const parts = [];
  if (blocking.length > 0) {
    parts.push('请补充以下必填项：' + blocking.map(p => p.label).join('；'));
  }
  if (warnings.length > 0) {
    parts.push('请注意：' + warnings.map(p => p.label).join('；'));
  }

  return parts.join('。');
}

module.exports = { getRegistrationProblems, generateReturnComment, docLabel };
