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
      uploaded: { label: '已上传待审核', severity: 'block' },
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

function resubmitterLabel(who) {
  const map = { parent: '家长', teacher: '任课老师', student: '学员' };
  return map[who] || who;
}

function getResubmissionSummary(registrationId) {
  const db = getDb();

  const total = db.prepare(
    'SELECT COUNT(*) as cnt FROM resubmission_logs WHERE registration_id = ?'
  ).get(registrationId).cnt;

  const unconfirmed = db.prepare(
    'SELECT COUNT(*) as cnt FROM resubmission_logs WHERE registration_id = ? AND confirmed_at IS NULL'
  ).get(registrationId).cnt;

  const confirmed = db.prepare(
    'SELECT COUNT(*) as cnt FROM resubmission_logs WHERE registration_id = ? AND confirmed_at IS NOT NULL'
  ).get(registrationId).cnt;

  const latestResubmit = db.prepare(`
    SELECT rl.*, rd.document_type, t.name as confirmer_name
    FROM resubmission_logs rl
    JOIN registration_documents rd ON rl.document_id = rd.id
    LEFT JOIN teachers t ON rl.confirmed_by = t.id
    WHERE rl.registration_id = ?
    ORDER BY rl.resubmitted_at DESC
    LIMIT 1
  `).get(registrationId);

  const latestConfirmed = db.prepare(`
    SELECT rl.*, rd.document_type, t.name as confirmer_name
    FROM resubmission_logs rl
    JOIN registration_documents rd ON rl.document_id = rd.id
    JOIN teachers t ON rl.confirmed_by = t.id
    WHERE rl.registration_id = ? AND rl.confirmed_at IS NOT NULL
    ORDER BY rl.confirmed_at DESC
    LIMIT 1
  `).get(registrationId);

  const resubmitDocTypes = db.prepare(`
    SELECT DISTINCT rd.document_type
    FROM resubmission_logs rl
    JOIN registration_documents rd ON rl.document_id = rd.id
    WHERE rl.registration_id = ?
    ORDER BY rl.resubmitted_at DESC
  `).all(registrationId).map(r => docLabel(r.document_type));

  let latest_resubmit = null;
  if (latestResubmit) {
    latest_resubmit = {
      resubmitted_at: latestResubmit.resubmitted_at,
      resubmitted_by: latestResubmit.resubmitted_by,
      resubmitted_by_label: resubmitterLabel(latestResubmit.resubmitted_by),
      document_id: latestResubmit.document_id,
      document_type: latestResubmit.document_type,
      document_type_label: docLabel(latestResubmit.document_type),
      note: latestResubmit.note,
      is_confirmed: !!latestResubmit.confirmed_at,
      confirmed_at: latestResubmit.confirmed_at,
      confirmed_by: latestResubmit.confirmed_by,
      confirmed_by_name: latestResubmit.confirmer_name
    };
  }

  let latest_confirm = null;
  if (latestConfirmed) {
    latest_confirm = {
      confirmed_at: latestConfirmed.confirmed_at,
      confirmed_by: latestConfirmed.confirmed_by,
      confirmed_by_name: latestConfirmed.confirmer_name,
      document_id: latestConfirmed.document_id,
      document_type: latestConfirmed.document_type,
      document_type_label: docLabel(latestConfirmed.document_type),
      resubmitted_at: latestConfirmed.resubmitted_at,
      resubmitted_by_label: resubmitterLabel(latestConfirmed.resubmitted_by)
    };
  }

  let status_text = '无补件记录';
  if (total > 0) {
    if (unconfirmed === 0) {
      status_text = `共${total}次补件，全部已确认`;
    } else if (confirmed === 0) {
      status_text = `共${total}次补件，${unconfirmed}次待确认`;
    } else {
      status_text = `共${total}次补件，${confirmed}次已确认，${unconfirmed}次待确认`;
    }
  }

  return {
    total_resubmit_count: total,
    unconfirmed_resubmit_count: unconfirmed,
    confirmed_resubmit_count: confirmed,
    resubmitted_document_types: resubmitDocTypes,
    latest_resubmit: latest_resubmit,
    latest_confirm: latest_confirm,
    status_text: status_text
  };
}

module.exports = { getRegistrationProblems, generateReturnComment, docLabel, getResubmissionSummary };
