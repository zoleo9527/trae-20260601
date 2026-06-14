const { getDB, newId, assertFound, logOperation } = require('../db');
const { AppError } = require('../errors');
const {
  EXAM_SESSION_STATUS_TRANSITIONS,
  canTransition,
  SUBJECT_NAMES,
} = require('../statusConstraints');
const { checkPermission } = require('./userService');

function createExamSession(data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'exam_sessions', 'create');

  if (!data.subject || !data.exam_date || !data.exam_time || !data.exam_location) {
    throw new AppError('VALIDATION_ERROR', {
      required: ['subject', 'exam_date', 'exam_time', 'exam_location'],
    });
  }

  const id = newId();
  dbi.prepare(`
    INSERT INTO exam_sessions
    (id, subject, exam_date, exam_time, exam_location, total_quota, booked_count, status)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'open')
  `).run(
    id,
    data.subject,
    data.exam_date,
    data.exam_time,
    data.exam_location,
    data.total_quota || 50
  );

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'create',
    targetType: 'exam_session',
    targetId: id,
    detail: `发布考试场次: 科目${data.subject} ${data.exam_date} ${data.exam_time}`,
  });

  return getExamSessionDetail(id);
}

function listExamSessions(params = {}) {
  const dbi = getDB();
  const { subject, status, start_date, end_date, offset = 0, limit = 20 } = params;

  let sql = `
    SELECT es.*,
           (SELECT COUNT(*) FROM exam_bookings eb WHERE eb.exam_session_id = es.id AND eb.status NOT IN ('cancelled', 'rejected')) as actual_booked
    FROM exam_sessions es
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM exam_sessions WHERE 1=1';
  const paramsArr = [];
  const countParams = [];

  if (subject) {
    sql += ' AND es.subject = ?';
    countSql += ' AND subject = ?';
    paramsArr.push(subject);
    countParams.push(subject);
  }
  if (status) {
    sql += ' AND es.status = ?';
    countSql += ' AND status = ?';
    paramsArr.push(status);
    countParams.push(status);
  }
  if (start_date) {
    sql += ' AND es.exam_date >= ?';
    countSql += ' AND exam_date >= ?';
    paramsArr.push(start_date);
    countParams.push(start_date);
  }
  if (end_date) {
    sql += ' AND es.exam_date <= ?';
    countSql += ' AND exam_date <= ?';
    paramsArr.push(end_date);
    countParams.push(end_date);
  }

  sql += ' ORDER BY es.exam_date DESC, es.exam_time LIMIT ? OFFSET ?';
  paramsArr.push(limit, offset);

  const { total } = dbi.prepare(countSql).get(...countParams);
  const list = dbi.prepare(sql).all(...paramsArr);

  return {
    total,
    list: list.map(s => enrichSession(s)),
  };
}

function getExamSessionDetail(id) {
  const dbi = getDB();
  const session = dbi.prepare(`
    SELECT es.*,
           (SELECT COUNT(*) FROM exam_bookings eb WHERE eb.exam_session_id = es.id AND eb.status NOT IN ('cancelled', 'rejected')) as actual_booked
    FROM exam_sessions es
    WHERE es.id = ?
  `).get(id);

  assertFound(session, 'EXAM_SESSION_NOT_FOUND');

  const bookings = dbi.prepare(`
    SELECT eb.*, s.name as student_name, s.phone as student_phone
    FROM exam_bookings eb
    JOIN students s ON eb.student_id = s.id
    WHERE eb.exam_session_id = ?
    ORDER BY eb.created_at DESC
  `).all(id);

  return {
    ...enrichSession(session),
    bookings: bookings.map(b => ({
      ...b,
      subject_name: SUBJECT_NAMES[b.subject],
    })),
  };
}

function updateExamSession(id, data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'exam_sessions', 'update');
  const session = assertFound(dbi.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(id), 'EXAM_SESSION_NOT_FOUND');

  if (data.status && data.status !== session.status) {
    if (!canTransition(EXAM_SESSION_STATUS_TRANSITIONS, session.status, data.status, operator.role)) {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: session.status,
        to: data.status,
        role: operator.role,
      });
    }
  }

  dbi.prepare(`
    UPDATE exam_sessions SET
      subject = COALESCE(?, subject),
      exam_date = COALESCE(?, exam_date),
      exam_time = COALESCE(?, exam_time),
      exam_location = COALESCE(?, exam_location),
      total_quota = COALESCE(?, total_quota),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.subject || null,
    data.exam_date || null,
    data.exam_time || null,
    data.exam_location || null,
    data.total_quota || null,
    data.status || null,
    id
  );

  const statusChanged = data.status && data.status !== session.status;
  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: statusChanged ? 'status_change' : 'update',
    targetType: 'exam_session',
    targetId: id,
    fromStatus: statusChanged ? session.status : null,
    toStatus: statusChanged ? data.status : null,
    detail: statusChanged
      ? `场次状态变更: ${EXAM_SESSION_STATUS_TRANSITIONS[session.status]?.description} -> ${EXAM_SESSION_STATUS_TRANSITIONS[data.status]?.description}`
      : `更新考试场次信息`,
  });

  return getExamSessionDetail(id);
}

function getAvailableSessions(subject) {
  const dbi = getDB();
  const sql = `
    SELECT es.*,
           (SELECT COUNT(*) FROM exam_bookings eb WHERE eb.exam_session_id = es.id AND eb.status NOT IN ('cancelled', 'rejected')) as actual_booked
    FROM exam_sessions es
    WHERE es.status IN ('open', 'full')
    AND es.booked_count < es.total_quota
    ${subject ? 'AND es.subject = ?' : ''}
    ORDER BY es.exam_date, es.exam_time
  `;
  const list = subject ? dbi.prepare(sql).all(subject) : dbi.prepare(sql).all();
  return list.map(s => enrichSession(s));
}

function enrichSession(s) {
  return {
    ...s,
    subject_name: SUBJECT_NAMES[s.subject],
    status_name: EXAM_SESSION_STATUS_TRANSITIONS[s.status]?.description || s.status,
    remaining_quota: s.total_quota - (s.actual_booked !== undefined ? s.actual_booked : s.booked_count),
    is_full: (s.actual_booked !== undefined ? s.actual_booked : s.booked_count) >= s.total_quota,
  };
}

module.exports = {
  createExamSession,
  listExamSessions,
  getExamSessionDetail,
  updateExamSession,
  getAvailableSessions,
  enrichSession,
};
