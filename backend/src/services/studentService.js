const { getDB, tx, newId, assertFound, logOperation } = require('../db');
const { AppError } = require('../errors');
const { STUDENT_STATUS_TRANSITIONS, canTransition, SUBJECT_NAMES } = require('../statusConstraints');
const { checkPermission, getRoleName } = require('./userService');

function createStudent(data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'students', 'create');

  const existing = dbi.prepare('SELECT id FROM students WHERE id_card = ?').get(data.id_card);
  if (existing) {
    throw new AppError('STUDENT_ID_CARD_DUPLICATE', { id_card: data.id_card });
  }

  if (!data.name || !data.id_card || !data.phone || !data.enroll_date) {
    throw new AppError('VALIDATION_ERROR', {
      required: ['name', 'id_card', 'phone', 'enroll_date'],
    });
  }

  const id = newId();
  dbi.prepare(`
    INSERT INTO students
    (id, name, id_card, phone, gender, license_type, enroll_date, coach_id, current_subject, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.id_card,
    data.phone,
    data.gender || null,
    data.license_type || 'C1',
    data.enroll_date,
    data.coach_id || null,
    data.current_subject || 1,
    data.status || 'studying',
    operatorId
  );

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'create',
    targetType: 'student',
    targetId: id,
    detail: `创建学员档案: ${data.name}`,
  });

  return getStudentDetail(id);
}

function updateStudent(id, data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'students', 'update');
  const student = assertFound(dbi.prepare('SELECT * FROM students WHERE id = ?').get(id), 'STUDENT_NOT_FOUND');

  if (data.status && data.status !== student.status) {
    if (!canTransition(STUDENT_STATUS_TRANSITIONS, student.status, data.status, operator.role)) {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: student.status,
        to: data.status,
        role: operator.role,
      });
    }
  }

  if (data.id_card && data.id_card !== student.id_card) {
    const existing = dbi.prepare('SELECT id FROM students WHERE id_card = ? AND id != ?').get(data.id_card, id);
    if (existing) {
      throw new AppError('STUDENT_ID_CARD_DUPLICATE', { id_card: data.id_card });
    }
  }

  dbi.prepare(`
    UPDATE students SET
      name = COALESCE(?, name),
      id_card = COALESCE(?, id_card),
      phone = COALESCE(?, phone),
      gender = COALESCE(?, gender),
      license_type = COALESCE(?, license_type),
      enroll_date = COALESCE(?, enroll_date),
      coach_id = COALESCE(?, coach_id),
      current_subject = COALESCE(?, current_subject),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.name || null,
    data.id_card || null,
    data.phone || null,
    data.gender || null,
    data.license_type || null,
    data.enroll_date || null,
    data.coach_id || null,
    data.current_subject || null,
    data.status || null,
    id
  );

  const statusChanged = data.status && data.status !== student.status;
  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: statusChanged ? 'status_change' : 'update',
    targetType: 'student',
    targetId: id,
    fromStatus: statusChanged ? student.status : null,
    toStatus: statusChanged ? data.status : null,
    detail: statusChanged
      ? `学员状态变更: ${STUDENT_STATUS_TRANSITIONS[student.status]?.description} -> ${STUDENT_STATUS_TRANSITIONS[data.status]?.description}`
      : `更新学员信息: ${student.name}`,
  });

  return getStudentDetail(id);
}

function listStudents(params = {}) {
  const dbi = getDB();
  const { status, keyword, coach_id, current_subject, offset = 0, limit = 20 } = params;

  let sql = `
    SELECT s.*, u.name as coach_name
    FROM students s
    LEFT JOIN users u ON s.coach_id = u.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM students WHERE 1=1';
  const paramsArr = [];
  const countParams = [];

  if (status) {
    sql += ' AND s.status = ?';
    countSql += ' AND status = ?';
    paramsArr.push(status);
    countParams.push(status);
  }
  if (current_subject) {
    sql += ' AND s.current_subject = ?';
    countSql += ' AND current_subject = ?';
    paramsArr.push(current_subject);
    countParams.push(current_subject);
  }
  if (coach_id) {
    sql += ' AND s.coach_id = ?';
    countSql += ' AND coach_id = ?';
    paramsArr.push(coach_id);
    countParams.push(coach_id);
  }
  if (keyword) {
    sql += ' AND (s.name LIKE ? OR s.phone LIKE ? OR s.id_card LIKE ?)';
    countSql += ' AND (name LIKE ? OR phone LIKE ? OR id_card LIKE ?)';
    const kw = `%${keyword}%`;
    paramsArr.push(kw, kw, kw);
    countParams.push(kw, kw, kw);
  }

  sql += ' ORDER BY s.updated_at DESC LIMIT ? OFFSET ?';
  paramsArr.push(limit, offset);

  const { total } = dbi.prepare(countSql).get(...countParams);
  const list = dbi.prepare(sql).all(...paramsArr);

  return {
    total,
    list: list.map(s => enrichStudent(s)),
  };
}

function getStudentDetail(id) {
  const dbi = getDB();
  const student = dbi.prepare(`
    SELECT s.*, u.name as coach_name, u.phone as coach_phone
    FROM students s
    LEFT JOIN users u ON s.coach_id = u.id
    WHERE s.id = ?
  `).get(id);

  assertFound(student, 'STUDENT_NOT_FOUND');

  const bookings = dbi.prepare(`
    SELECT eb.*, es.exam_date, es.exam_time, es.exam_location
    FROM exam_bookings eb
    LEFT JOIN exam_sessions es ON eb.exam_session_id = es.id
    WHERE eb.student_id = ?
    ORDER BY eb.created_at DESC
  `).all(id);

  const makeupExams = dbi.prepare(`
    SELECT m.*, eb2.subject as subject, eb2.exam_score as original_score
    FROM makeup_exams m
    JOIN exam_bookings eb2 ON m.failed_booking_id = eb2.id
    WHERE m.student_id = ?
    ORDER BY m.created_at DESC
  `).all(id);

  const feeRecords = dbi.prepare(`
    SELECT * FROM fee_records WHERE student_id = ? ORDER BY created_at DESC
  `).all(id);

  const schedules = dbi.prepare(`
    SELECT cs.*, u.name as coach_name
    FROM coach_schedules cs
    LEFT JOIN coaches c ON cs.coach_id = c.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE cs.student_id = ?
    ORDER BY cs.schedule_date DESC, cs.start_time
    LIMIT 20
  `).all(id);

  const logs = dbi.prepare(`
    SELECT * FROM operation_logs
    WHERE target_type = 'student' AND target_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(id);

  return {
    ...enrichStudent(student),
    examBookings: bookings.map(b => ({ ...b, subject_name: SUBJECT_NAMES[b.subject] })),
    makeupExams,
    feeRecords,
    schedules,
    operationLogs: logs,
  };
}

function enrichStudent(s) {
  return {
    ...s,
    subject_name: SUBJECT_NAMES[s.current_subject],
    status_name: STUDENT_STATUS_TRANSITIONS[s.status]?.description || s.status,
  };
}

function advanceSubject(id, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'students', 'update');
  const student = assertFound(dbi.prepare('SELECT * FROM students WHERE id = ?').get(id), 'STUDENT_NOT_FOUND');

  if (student.current_subject >= 4) {
    return updateStudent(id, { status: 'completed' }, operatorId);
  }

  const nextSubject = student.current_subject + 1;
  const result = updateStudent(id, { current_subject: nextSubject }, operatorId);

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'advance_subject',
    targetType: 'student',
    targetId: id,
    detail: `学员进度推进: 科目${student.current_subject} -> 科目${nextSubject}`,
  });

  return result;
}

module.exports = {
  createStudent,
  updateStudent,
  listStudents,
  getStudentDetail,
  advanceSubject,
  enrichStudent,
};
