const { getDB, tx, newId, assertFound, logOperation, createNotification } = require('../db');
const { AppError } = require('../errors');
const {
  EXAM_BOOKING_STATUS_TRANSITIONS,
  EXAM_SESSION_STATUS_TRANSITIONS,
  canTransition,
  SUBJECT_NAMES,
} = require('../statusConstraints');
const { checkPermission, getUserById } = require('./userService');

function createExamBooking(data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'exam_bookings', 'create');

  if (!data.student_id || !data.subject) {
    throw new AppError('VALIDATION_ERROR', {
      required: ['student_id', 'subject'],
    });
  }

  const existingActive = dbi.prepare(`
    SELECT id FROM exam_bookings
    WHERE student_id = ? AND subject = ? AND status NOT IN ('passed', 'failed', 'cancelled', 'rejected', 'no_show')
  `).get(data.student_id, data.subject);

  if (existingActive) {
    throw new AppError('EXAM_ALREADY_BOOKED', {
      student_id: data.student_id,
      subject: data.subject,
    });
  }

  const id = newId();
  const isMakeup = data.is_makeup ? 1 : 0;

  dbi.prepare(`
    INSERT INTO exam_bookings
    (id, student_id, subject, exam_session_id, status, is_makeup, original_booking_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.student_id,
    data.subject,
    data.exam_session_id || null,
    data.status || 'pending',
    isMakeup,
    data.original_booking_id || null,
    operatorId
  );

  if (data.exam_session_id) {
    incrementSessionBookedCount(data.exam_session_id);
  }

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'create',
    targetType: 'exam_booking',
    targetId: id,
    detail: `创建${isMakeup ? '补考' : ''}考试预约: 科目${data.subject}`,
  });

  const examSpecialists = dbi.prepare(`
    SELECT id, name FROM users WHERE role = 'exam_specialist'
  `).all();
  examSpecialists.forEach(es => {
    createNotification({
      userId: es.id,
      userRole: 'exam_specialist',
      title: '新的考试预约待审核',
      content: `科目${data.subject}有新的预约申请，请及时处理`,
      type: 'exam_booking',
      priority: 'urgent',
      relatedId: id,
      relatedType: 'exam_booking',
    });
  });

  return getExamBookingDetail(id);
}

function listExamBookings(params = {}) {
  const dbi = getDB();
  const { status, subject, student_id, exam_session_id, is_makeup, offset = 0, limit = 20 } = params;

  let sql = `
    SELECT eb.*, s.name as student_name, s.phone as student_phone,
           es.exam_date, es.exam_time, es.exam_location
    FROM exam_bookings eb
    JOIN students s ON eb.student_id = s.id
    LEFT JOIN exam_sessions es ON eb.exam_session_id = es.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM exam_bookings WHERE 1=1';
  const paramsArr = [];
  const countParams = [];

  if (status) {
    sql += ' AND eb.status = ?';
    countSql += ' AND status = ?';
    paramsArr.push(status);
    countParams.push(status);
  }
  if (subject) {
    sql += ' AND eb.subject = ?';
    countSql += ' AND subject = ?';
    paramsArr.push(subject);
    countParams.push(subject);
  }
  if (student_id) {
    sql += ' AND eb.student_id = ?';
    countSql += ' AND student_id = ?';
    paramsArr.push(student_id);
    countParams.push(student_id);
  }
  if (exam_session_id) {
    sql += ' AND eb.exam_session_id = ?';
    countSql += ' AND exam_session_id = ?';
    paramsArr.push(exam_session_id);
    countParams.push(exam_session_id);
  }
  if (is_makeup !== undefined && is_makeup !== null) {
    sql += ' AND eb.is_makeup = ?';
    countSql += ' AND is_makeup = ?';
    paramsArr.push(is_makeup ? 1 : 0);
    countParams.push(is_makeup ? 1 : 0);
  }

  sql += ' ORDER BY eb.created_at DESC LIMIT ? OFFSET ?';
  paramsArr.push(limit, offset);

  const { total } = dbi.prepare(countSql).get(...countParams);
  const list = dbi.prepare(sql).all(...paramsArr);

  return {
    total,
    list: list.map(b => enrichBooking(b)),
  };
}

function getExamBookingDetail(id) {
  const dbi = getDB();
  const booking = dbi.prepare(`
    SELECT eb.*, s.name as student_name, s.phone as student_phone, s.current_subject,
           u.name as created_by_name,
           ap.name as approve_by_name,
           es.exam_date, es.exam_time, es.exam_location, es.total_quota, es.status as session_status
    FROM exam_bookings eb
    JOIN students s ON eb.student_id = s.id
    JOIN users u ON eb.created_by = u.id
    LEFT JOIN users ap ON eb.approve_by = ap.id
    LEFT JOIN exam_sessions es ON eb.exam_session_id = es.id
    WHERE eb.id = ?
  `).get(id);

  assertFound(booking, 'EXAM_BOOKING_NOT_FOUND');

  const timeline = dbi.prepare(`
    SELECT * FROM operation_logs
    WHERE target_type = 'exam_booking' AND target_id = ?
    ORDER BY created_at ASC
  `).all(id);

  const makeupInfo = booking.is_makeup ? dbi.prepare(`
    SELECT m.*, m.status as makeup_status
    FROM makeup_exams m
    WHERE m.new_booking_id = ? OR m.failed_booking_id = ?
  `).get(id, id) : null;

  return {
    ...enrichBooking(booking),
    timeline,
    makeupInfo,
  };
}

function approveBooking(id, data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'exam_bookings', 'approve');
  const booking = assertFound(dbi.prepare('SELECT * FROM exam_bookings WHERE id = ?').get(id), 'EXAM_BOOKING_NOT_FOUND');

  if (!canTransition(EXAM_BOOKING_STATUS_TRANSITIONS, booking.status, 'approved', operator.role)) {
    throw new AppError('INVALID_STATUS_TRANSITION', {
      from: booking.status,
      to: 'approved',
      role: operator.role,
    });
  }

  dbi.prepare(`
    UPDATE exam_bookings SET
      status = 'approved',
      approve_time = datetime('now'),
      approve_by = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(operatorId, id);

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'approve',
    targetType: 'exam_booking',
    targetId: id,
    fromStatus: booking.status,
    toStatus: 'approved',
    detail: `审核通过: 科目${booking.subject}考试预约`,
  });

  return getExamBookingDetail(id);
}

function rejectBooking(id, data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'exam_bookings', 'approve');
  const booking = assertFound(dbi.prepare('SELECT * FROM exam_bookings WHERE id = ?').get(id), 'EXAM_BOOKING_NOT_FOUND');

  if (!data.reason) {
    throw new AppError('VALIDATION_ERROR', { required: ['reason'] });
  }

  if (!canTransition(EXAM_BOOKING_STATUS_TRANSITIONS, booking.status, 'rejected', operator.role)) {
    throw new AppError('INVALID_STATUS_TRANSITION', {
      from: booking.status,
      to: 'rejected',
      role: operator.role,
    });
  }

  dbi.prepare(`
    UPDATE exam_bookings SET
      status = 'rejected',
      reject_reason = ?,
      approve_time = datetime('now'),
      approve_by = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(data.reason, operatorId, id);

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'reject',
    targetType: 'exam_booking',
    targetId: id,
    fromStatus: booking.status,
    toStatus: 'rejected',
    detail: `审核拒绝: 科目${booking.subject}，原因: ${data.reason}`,
  });

  return getExamBookingDetail(id);
}

function bookExamSession(bookingId, sessionId, operatorId) {
  return tx(() => {
    const dbi = getDB();
    const operator = checkPermission(operatorId, 'exam_bookings', 'book_session');
    const booking = assertFound(dbi.prepare('SELECT * FROM exam_bookings WHERE id = ?').get(bookingId), 'EXAM_BOOKING_NOT_FOUND');
    const session = assertFound(dbi.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionId), 'EXAM_SESSION_NOT_FOUND');

    if (booking.subject !== session.subject) {
      throw new AppError('VALIDATION_ERROR', {
        message: '考试科目不匹配',
        booking_subject: booking.subject,
        session_subject: session.subject,
      });
    }

    if (session.status !== 'open' && session.status !== 'full') {
      throw new AppError('EXAM_STATUS_INVALID', {
        session_status: session.status,
        allowed: ['open', 'full'],
      });
    }

    if (session.booked_count >= session.total_quota) {
      throw new AppError('EXAM_QUOTA_FULL', {
        session_id: sessionId,
        booked_count: session.booked_count,
        total_quota: session.total_quota,
      });
    }

    if (!canTransition(EXAM_BOOKING_STATUS_TRANSITIONS, booking.status, 'booked', operator.role)) {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: booking.status,
        to: 'booked',
        role: operator.role,
      });
    }

    if (booking.exam_session_id && booking.exam_session_id !== sessionId) {
      decrementSessionBookedCount(booking.exam_session_id);
    }

    dbi.prepare(`
      UPDATE exam_bookings SET
        status = 'booked',
        exam_session_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(sessionId, bookingId);

    incrementSessionBookedCount(sessionId);

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'book_session',
      targetType: 'exam_booking',
      targetId: bookingId,
      fromStatus: booking.status,
      toStatus: 'booked',
      detail: `预约考试场次: ${session.exam_date} ${session.exam_time} ${session.exam_location}`,
    });

    const student = dbi.prepare('SELECT name, phone FROM students WHERE id = ?').get(booking.student_id);
    const admissionConsultants = dbi.prepare(`
      SELECT id, name FROM users WHERE role = 'admission_consultant'
    `).all();
    admissionConsultants.forEach(ac => {
      createNotification({
        userId: ac.id,
        userRole: 'admission_consultant',
        title: '考试预约成功',
        content: `${student?.name || '学员'} 科目${booking.subject}已成功预约 ${session.exam_date} 的考试`,
        type: 'exam_booking',
        priority: 'normal',
        relatedId: bookingId,
        relatedType: 'exam_booking',
      });
    });

    return getExamBookingDetail(bookingId);
  });
}

function recordExamResult(id, data, operatorId) {
  return tx(() => {
    const dbi = getDB();
    const operator = checkPermission(operatorId, 'exam_bookings', 'record_result');
    const booking = assertFound(dbi.prepare('SELECT * FROM exam_bookings WHERE id = ?').get(id), 'EXAM_BOOKING_NOT_FOUND');

    const { result, score, is_attended = true } = data;
    let newStatus;

    if (!is_attended) {
      newStatus = 'no_show';
    } else if (result === 'passed') {
      newStatus = 'passed';
    } else if (result === 'failed') {
      newStatus = 'failed';
    } else {
      throw new AppError('VALIDATION_ERROR', {
        required: ['result'],
        allowed_values: ['passed', 'failed'],
      });
    }

    const fromStatus = is_attended ? 'attended' : booking.status;
    if (!canTransition(EXAM_BOOKING_STATUS_TRANSITIONS, booking.status, newStatus, operator.role)) {
      if (!(booking.status === 'booked' && is_attended && (newStatus === 'passed' || newStatus === 'failed'))) {
        throw new AppError('INVALID_STATUS_TRANSITION', {
          from: booking.status,
          to: newStatus,
          role: operator.role,
        });
      }
    }

    dbi.prepare(`
      UPDATE exam_bookings SET
        status = ?,
        exam_result = ?,
        exam_score = ?,
        result_time = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, result, score || null, id);

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'record_result',
      targetType: 'exam_booking',
      targetId: id,
      fromStatus: booking.status,
      toStatus: newStatus,
      detail: `录入考试结果: ${newStatus === 'passed' ? '通过' : newStatus === 'failed' ? '未通过' : '缺考'}${score ? `，得分: ${score}` : ''}`,
    });

    if (newStatus === 'passed') {
      const student = dbi.prepare('SELECT * FROM students WHERE id = ?').get(booking.student_id);
      if (student && student.current_subject === booking.subject && booking.subject < 4) {
        dbi.prepare(`
          UPDATE students SET
            current_subject = current_subject + 1,
            updated_at = datetime('now')
          WHERE id = ?
        `).run(booking.student_id);

        logOperation({
          operatorId,
          operatorName: operator.name,
          operatorRole: operator.role,
          action: 'auto_advance_subject',
          targetType: 'student',
          targetId: booking.student_id,
          detail: `考试通过，自动推进到科目${booking.subject + 1}`,
        });
      } else if (student && student.current_subject === booking.subject && booking.subject === 4) {
        dbi.prepare(`
          UPDATE students SET
            status = 'completed',
            updated_at = datetime('now')
          WHERE id = ?
        `).run(booking.student_id);
      }
    }

    if (newStatus === 'failed') {
      const makeupId = newId();
      const makeupFee = getMakeupFeeBySubject(booking.subject);

      dbi.prepare(`
        INSERT INTO makeup_exams
        (id, student_id, failed_booking_id, subject, failed_date, fail_reason, makeup_fee, status, created_by)
        VALUES (?, ?, ?, ?, date('now'), ?, ?, 'pending_payment', ?)
      `).run(
        makeupId,
        booking.student_id,
        id,
        booking.subject,
        data.fail_reason || '考试未通过',
        makeupFee,
        operatorId
      );

      logOperation({
        operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        action: 'auto_create_makeup',
        targetType: 'makeup_exam',
        targetId: makeupId,
        detail: `自动创建补考记录: 科目${booking.subject}，补考费 ¥${makeupFee}`,
      });

      const admissionConsultants = dbi.prepare(`
        SELECT id, name FROM users WHERE role = 'admission_consultant'
      `).all();
      admissionConsultants.forEach(ac => {
        createNotification({
          userId: ac.id,
          userRole: 'admission_consultant',
          title: '学员考试未通过，需跟进补考',
          content: `科目${booking.subject}考试未通过，补考费 ¥${makeupFee}，请及时跟进学员缴费`,
          type: 'makeup_exam',
          priority: 'high',
          relatedId: makeupId,
          relatedType: 'makeup_exam',
        });
      });
    }

    return getExamBookingDetail(id);
  });
}

function cancelBooking(id, data, operatorId) {
  return tx(() => {
    const dbi = getDB();
    const operator = checkPermission(operatorId, 'exam_bookings', 'update');
    const booking = assertFound(dbi.prepare('SELECT * FROM exam_bookings WHERE id = ?').get(id), 'EXAM_BOOKING_NOT_FOUND');

    if (!canTransition(EXAM_BOOKING_STATUS_TRANSITIONS, booking.status, 'cancelled', operator.role)) {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: booking.status,
        to: 'cancelled',
        role: operator.role,
      });
    }

    if (booking.exam_session_id) {
      decrementSessionBookedCount(booking.exam_session_id);
    }

    dbi.prepare(`
      UPDATE exam_bookings SET
        status = 'cancelled',
        cancel_reason = ?,
        cancel_time = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(data?.reason || '用户取消', id);

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'cancel',
      targetType: 'exam_booking',
      targetId: id,
      fromStatus: booking.status,
      toStatus: 'cancelled',
      detail: `取消考试预约: ${data?.reason || '用户取消'}`,
    });

    return getExamBookingDetail(id);
  });
}

function incrementSessionBookedCount(sessionId) {
  const dbi = getDB();
  const session = dbi.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionId);
  if (!session) return;

  const newCount = session.booked_count + 1;
  let newStatus = session.status;

  if (newCount >= session.total_quota && session.status === 'open') {
    newStatus = 'full';
  }

  dbi.prepare(`
    UPDATE exam_sessions SET
      booked_count = ?,
      status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(newCount, newStatus, sessionId);
}

function decrementSessionBookedCount(sessionId) {
  const dbi = getDB();
  const session = dbi.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionId);
  if (!session) return;

  const newCount = Math.max(0, session.booked_count - 1);
  let newStatus = session.status;

  if (newCount < session.total_quota && session.status === 'full') {
    newStatus = 'open';
  }

  dbi.prepare(`
    UPDATE exam_sessions SET
      booked_count = ?,
      status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(newCount, newStatus, sessionId);
}

function getMakeupFeeBySubject(subject) {
  const fees = { 1: 100, 2: 250, 3: 300, 4: 100 };
  return fees[subject] || 100;
}

function enrichBooking(b) {
  return {
    ...b,
    subject_name: SUBJECT_NAMES[b.subject],
    status_name: EXAM_BOOKING_STATUS_TRANSITIONS[b.status]?.description || b.status,
    is_makeup: !!b.is_makeup,
    session_status_name: b.session_status ? EXAM_SESSION_STATUS_TRANSITIONS[b.session_status]?.description : null,
  };
}

module.exports = {
  createExamBooking,
  listExamBookings,
  getExamBookingDetail,
  approveBooking,
  rejectBooking,
  bookExamSession,
  recordExamResult,
  cancelBooking,
  getMakeupFeeBySubject,
  enrichBooking,
  incrementSessionBookedCount,
  decrementSessionBookedCount,
};
