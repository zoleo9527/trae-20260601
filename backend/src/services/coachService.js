const { getDB, tx, newId, assertFound, logOperation } = require('../db');
const { AppError } = require('../errors');
const {
  SCHEDULE_STATUS_TRANSITIONS,
  canTransition,
  SUBJECT_NAMES,
} = require('../statusConstraints');
const { checkPermission, getUserById, getScheduleTypeName } = require('./userService');

function listCoaches(params = {}) {
  const dbi = getDB();
  const { status, subject, offset = 0, limit = 20 } = params;

  let sql = `
    SELECT c.*, u.name, u.phone, u.username, u.role
    FROM coaches c
    JOIN users u ON c.user_id = u.id
    WHERE 1=1
  `;
  const paramsArr = [];

  if (status) {
    sql += ' AND c.status = ?';
    paramsArr.push(status);
  }

  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  paramsArr.push(limit, offset);

  const list = dbi.prepare(sql).all(...paramsArr);
  return {
    total: list.length,
    list: list.map(c => ({
      ...c,
      subjects_array: c.subjects ? c.subjects.split(',').map(Number) : [],
    })),
  };
}

function getCoachDetail(coachId) {
  const dbi = getDB();
  const coach = dbi.prepare(`
    SELECT c.*, u.name, u.phone, u.username, u.role, u.created_at as user_created_at
    FROM coaches c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(coachId);

  assertFound(coach, 'COACH_NOT_FOUND');

  const students = dbi.prepare(`
    SELECT s.* FROM students s
    WHERE s.coach_id = ? AND s.status = 'studying'
    ORDER BY s.created_at DESC
  `).all(coach.user_id);

  const schedules = dbi.prepare(`
    SELECT cs.*, s.name as student_name, s.phone as student_phone
    FROM coach_schedules cs
    LEFT JOIN students s ON cs.student_id = s.id
    WHERE cs.coach_id = ?
    ORDER BY cs.schedule_date DESC, cs.start_time
    LIMIT 50
  `).all(coachId);

  return {
    ...coach,
    subjects_array: coach.subjects ? coach.subjects.split(',').map(Number) : [],
    students,
    schedules: schedules.map(s => enrichSchedule(s)),
  };
}

function createSchedule(data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'coach_schedules', 'create');

  if (!data.coach_id || !data.schedule_date || !data.start_time || !data.end_time) {
    throw new AppError('VALIDATION_ERROR', {
      required: ['coach_id', 'schedule_date', 'start_time', 'end_time'],
    });
  }

  const conflict = dbi.prepare(`
    SELECT id FROM coach_schedules
    WHERE coach_id = ? AND schedule_date = ?
    AND (
      (start_time <= ? AND end_time > ?) OR
      (start_time < ? AND end_time >= ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `).get(
    data.coach_id,
    data.schedule_date,
    data.start_time, data.start_time,
    data.end_time, data.end_time,
    data.start_time, data.end_time
  );

  if (conflict) {
    throw new AppError('COACH_SCHEDULE_CONFLICT', {
      coach_id: data.coach_id,
      schedule_date: data.schedule_date,
      start_time: data.start_time,
      end_time: data.end_time,
    });
  }

  const id = newId();
  dbi.prepare(`
    INSERT INTO coach_schedules
    (id, coach_id, schedule_date, start_time, end_time, type, student_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.coach_id,
    data.schedule_date,
    data.start_time,
    data.end_time,
    data.type || 'practice',
    data.student_id || null,
    data.student_id ? 'booked' : 'available'
  );

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'create',
    targetType: 'coach_schedule',
    targetId: id,
    detail: `创建排班: ${data.schedule_date} ${data.start_time}-${data.end_time}`,
  });

  return getScheduleDetail(id);
}

function listSchedules(params = {}) {
  const dbi = getDB();
  const { coach_id, student_id, schedule_date, status, type, offset = 0, limit = 50 } = params;

  let sql = `
    SELECT cs.*, c.user_id as coach_user_id,
           u.name as coach_name, u.phone as coach_phone,
           s.name as student_name, s.phone as student_phone
    FROM coach_schedules cs
    JOIN coaches c ON cs.coach_id = c.id
    JOIN users u ON c.user_id = u.id
    LEFT JOIN students s ON cs.student_id = s.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM coach_schedules WHERE 1=1';
  const paramsArr = [];
  const countParams = [];

  if (coach_id) {
    sql += ' AND cs.coach_id = ?';
    countSql += ' AND coach_id = ?';
    paramsArr.push(coach_id);
    countParams.push(coach_id);
  }
  if (student_id) {
    sql += ' AND cs.student_id = ?';
    countSql += ' AND student_id = ?';
    paramsArr.push(student_id);
    countParams.push(student_id);
  }
  if (schedule_date) {
    sql += ' AND cs.schedule_date = ?';
    countSql += ' AND schedule_date = ?';
    paramsArr.push(schedule_date);
    countParams.push(schedule_date);
  }
  if (status) {
    sql += ' AND cs.status = ?';
    countSql += ' AND status = ?';
    paramsArr.push(status);
    countParams.push(status);
  }
  if (type) {
    sql += ' AND cs.type = ?';
    countSql += ' AND type = ?';
    paramsArr.push(type);
    countParams.push(type);
  }

  sql += ' ORDER BY cs.schedule_date, cs.start_time LIMIT ? OFFSET ?';
  paramsArr.push(limit, offset);

  const { total } = dbi.prepare(countSql).get(...countParams);
  const list = dbi.prepare(sql).all(...paramsArr);

  return {
    total,
    list: list.map(s => enrichSchedule(s)),
  };
}

function getScheduleDetail(id) {
  const dbi = getDB();
  const schedule = dbi.prepare(`
    SELECT cs.*, c.user_id as coach_user_id,
           u.name as coach_name, u.phone as coach_phone,
           s.name as student_name, s.phone as student_phone, s.current_subject
    FROM coach_schedules cs
    JOIN coaches c ON cs.coach_id = c.id
    JOIN users u ON c.user_id = u.id
    LEFT JOIN students s ON cs.student_id = s.id
    WHERE cs.id = ?
  `).get(id);

  assertFound(schedule, 'VALIDATION_ERROR');

  return enrichSchedule(schedule);
}

function bookSchedule(id, data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'coach_schedules', 'book');
  const schedule = assertFound(dbi.prepare('SELECT * FROM coach_schedules WHERE id = ?').get(id), 'VALIDATION_ERROR');

  if (!data.student_id) {
    throw new AppError('VALIDATION_ERROR', { required: ['student_id'] });
  }

  if (!canTransition(SCHEDULE_STATUS_TRANSITIONS, schedule.status, 'booked', operator.role)) {
    throw new AppError('INVALID_STATUS_TRANSITION', {
      from: schedule.status,
      to: 'booked',
      role: operator.role,
    });
  }

  dbi.prepare(`
    UPDATE coach_schedules SET
      student_id = ?,
      status = 'booked',
      updated_at = datetime('now')
    WHERE id = ?
  `).run(data.student_id, id);

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'book',
    targetType: 'coach_schedule',
    targetId: id,
    fromStatus: schedule.status,
    toStatus: 'booked',
    detail: `预约练车: 学员ID ${data.student_id}`,
  });

  return getScheduleDetail(id);
}

function completeSchedule(id, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'coach_schedules', 'complete');
  const schedule = assertFound(dbi.prepare('SELECT * FROM coach_schedules WHERE id = ?').get(id), 'VALIDATION_ERROR');

  if (!canTransition(SCHEDULE_STATUS_TRANSITIONS, schedule.status, 'completed', operator.role)) {
    throw new AppError('INVALID_STATUS_TRANSITION', {
      from: schedule.status,
      to: 'completed',
      role: operator.role,
    });
  }

  dbi.prepare(`
    UPDATE coach_schedules SET
      status = 'completed',
      updated_at = datetime('now')
    WHERE id = ?
  `).run(id);

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'complete',
    targetType: 'coach_schedule',
    targetId: id,
    fromStatus: schedule.status,
    toStatus: 'completed',
    detail: `完成练车`,
  });

  return getScheduleDetail(id);
}

function cancelSchedule(id, data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'coach_schedules', 'update');
  const schedule = assertFound(dbi.prepare('SELECT * FROM coach_schedules WHERE id = ?').get(id), 'VALIDATION_ERROR');

  if (!canTransition(SCHEDULE_STATUS_TRANSITIONS, schedule.status, 'cancelled', operator.role)) {
    throw new AppError('INVALID_STATUS_TRANSITION', {
      from: schedule.status,
      to: 'cancelled',
      role: operator.role,
    });
  }

  dbi.prepare(`
    UPDATE coach_schedules SET
      status = 'cancelled',
      student_id = NULL,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(id);

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'cancel',
    targetType: 'coach_schedule',
    targetId: id,
    fromStatus: schedule.status,
    toStatus: 'cancelled',
    detail: `取消排班: ${data?.reason || '无原因'}`,
  });

  return getScheduleDetail(id);
}

function getCoachByUserId(userId) {
  const dbi = getDB();
  return dbi.prepare('SELECT * FROM coaches WHERE user_id = ?').get(userId);
}

function enrichSchedule(s) {
  return {
    ...s,
    status_name: SCHEDULE_STATUS_TRANSITIONS[s.status]?.description || s.status,
    type_name: getScheduleTypeName(s.type),
    student_subject_name: s.current_subject ? SUBJECT_NAMES[s.current_subject] : null,
  };
}

module.exports = {
  listCoaches,
  getCoachDetail,
  createSchedule,
  listSchedules,
  getScheduleDetail,
  bookSchedule,
  completeSchedule,
  cancelSchedule,
  getCoachByUserId,
  enrichSchedule,
};
