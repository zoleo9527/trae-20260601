const { getDB, tx, newId, assertFound, logOperation, createNotification } = require('../db');
const { AppError } = require('../errors');
const {
  MAKEUP_STATUS_TRANSITIONS,
  canTransition,
  SUBJECT_NAMES,
  PRIORITY_WEIGHTS,
} = require('../statusConstraints');
const { checkPermission, getUserById, getFeeTypeName } = require('./userService');
const { createExamBooking, getMakeupFeeBySubject, batchGetLastOperations } = require('./examBookingService');

function createMakeupExam(data, operatorId) {
  const dbi = getDB();
  const operator = checkPermission(operatorId, 'makeup_exams', 'create');

  if (!data.student_id || !data.failed_booking_id || !data.subject) {
    throw new AppError('VALIDATION_ERROR', {
      required: ['student_id', 'failed_booking_id', 'subject'],
    });
  }

  const existing = dbi.prepare(`
    SELECT id FROM makeup_exams
    WHERE student_id = ? AND subject = ? AND status NOT IN ('completed', 'cancelled')
  `).get(data.student_id, data.subject);

  if (existing) {
    throw new AppError('VALIDATION_ERROR', {
      message: '该科目已有进行中的补考记录',
      existing_id: existing.id,
    });
  }

  const id = newId();
  const makeupFee = data.makeup_fee || getMakeupFeeBySubject(data.subject);

  dbi.prepare(`
    INSERT INTO makeup_exams
    (id, student_id, failed_booking_id, subject, failed_date, fail_reason, makeup_fee, fee_paid, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending_payment', ?)
  `).run(
    id,
    data.student_id,
    data.failed_booking_id,
    data.subject,
    data.failed_date || new Date().toISOString().split('T')[0],
    data.fail_reason || '考试未通过',
    makeupFee,
    operatorId
  );

  logOperation({
    operatorId,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: 'create',
    targetType: 'makeup_exam',
    targetId: id,
    detail: `创建补考记录: 科目${data.subject}，补考费 ¥${makeupFee}`,
  });

  return getMakeupExamDetail(id);
}

function listMakeupExams(params = {}, operatorId) {
  const dbi = getDB();
  checkPermission(operatorId, 'makeup_exams', 'read');
  const { status, subject, student_id, needs_attention, offset = 0, limit = 20 } = params;

  let sql = `
    SELECT m.*, s.name as student_name, s.phone as student_phone,
           eb.exam_score as original_score,
           nb.status as new_booking_status,
           es.exam_date as new_exam_date, es.exam_time as new_exam_time
    FROM makeup_exams m
    JOIN students s ON m.student_id = s.id
    JOIN exam_bookings eb ON m.failed_booking_id = eb.id
    LEFT JOIN exam_bookings nb ON m.new_booking_id = nb.id
    LEFT JOIN exam_sessions es ON nb.exam_session_id = es.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM makeup_exams WHERE 1=1';
  const paramsArr = [];
  const countParams = [];

  if (status) {
    sql += ' AND m.status = ?';
    countSql += ' AND status = ?';
    paramsArr.push(status);
    countParams.push(status);
  }
  if (subject) {
    sql += ' AND m.subject = ?';
    countSql += ' AND subject = ?';
    paramsArr.push(subject);
    countParams.push(subject);
  }
  if (student_id) {
    sql += ' AND m.student_id = ?';
    countSql += ' AND student_id = ?';
    paramsArr.push(student_id);
    countParams.push(student_id);
  }

  sql += ' ORDER BY m.updated_at DESC LIMIT ? OFFSET ?';
  paramsArr.push(limit, offset);

  const { total } = dbi.prepare(countSql).get(...countParams);
  let list = dbi.prepare(sql).all(...paramsArr);

  const lastOps = batchGetLastOperations('makeup_exam', list.map(m => m.id));
  list = list.map(m => ({ ...m, ...lastOps[m.id] }));

  list = list.map(m => enrichMakeup(m));

  if (needs_attention === true || needs_attention === 'true' || needs_attention === '1') {
    list = list.filter(m => m.needs_attention);
  } else if (needs_attention === false || needs_attention === 'false' || needs_attention === '0') {
    list = list.filter(m => !m.needs_attention);
  }

  return {
    total,
    list,
  };
}

function getMakeupExamDetail(id, operatorId) {
  if (operatorId) {
    checkPermission(operatorId, 'makeup_exams', 'read');
  }
  const dbi = getDB();
  const makeup = dbi.prepare(`
    SELECT m.*, s.name as student_name, s.phone as student_phone, s.id_card,
           eb.exam_score as original_score, es1.exam_date as original_exam_date,
           eb.status as original_booking_status,
           u.name as created_by_name,
           nb.status as new_booking_status,
           es2.exam_date as new_exam_date, es2.exam_time as new_exam_time, es2.exam_location as new_exam_location
    FROM makeup_exams m
    JOIN students s ON m.student_id = s.id
    JOIN exam_bookings eb ON m.failed_booking_id = eb.id
    LEFT JOIN exam_sessions es1 ON eb.exam_session_id = es1.id
    JOIN users u ON m.created_by = u.id
    LEFT JOIN exam_bookings nb ON m.new_booking_id = nb.id
    LEFT JOIN exam_sessions es2 ON nb.exam_session_id = es2.id
    WHERE m.id = ?
  `).get(id);

  assertFound(makeup, 'MAKEUP_NOT_FOUND');

  const timeline = dbi.prepare(`
    SELECT * FROM operation_logs
    WHERE target_type = 'makeup_exam' AND target_id = ?
    ORDER BY created_at ASC
  `).all(id);

  const feeRecord = dbi.prepare(`
    SELECT * FROM fee_records WHERE related_id = ? AND type = 'makeup_fee'
  `).get(id);

  return {
    ...enrichMakeup(makeup),
    timeline,
    feeRecord,
  };
}

function getMakeupExamHistory(studentId, subject = null, operatorId) {
  if (operatorId) {
    checkPermission(operatorId, 'makeup_exams', 'read');
  }
  const dbi = getDB();
  let sql = `
    SELECT m.*, s.name as student_name,
           eb.exam_score as original_score, es1.exam_date as original_exam_date,
           eb2.status as new_booking_status,
           es2.exam_date as new_exam_date
    FROM makeup_exams m
    JOIN students s ON m.student_id = s.id
    JOIN exam_bookings eb ON m.failed_booking_id = eb.id
    LEFT JOIN exam_sessions es1 ON eb.exam_session_id = es1.id
    LEFT JOIN exam_bookings eb2 ON m.new_booking_id = eb2.id
    LEFT JOIN exam_sessions es2 ON eb2.exam_session_id = es2.id
    WHERE m.student_id = ?
  `;
  const params = [studentId];
  if (subject) {
    sql += ' AND m.subject = ?';
    params.push(subject);
  }
  sql += ' ORDER BY m.created_at DESC';

  const list = dbi.prepare(sql).all(...params);
  return list.map(m => enrichMakeup(m));
}

function recordMakeupPayment(id, data, operatorId) {
  return tx(() => {
    const dbi = getDB();
    const operator = checkPermission(operatorId, 'makeup_exams', 'update_fee');
    const makeup = assertFound(dbi.prepare('SELECT * FROM makeup_exams WHERE id = ?').get(id), 'MAKEUP_NOT_FOUND');

    const { amount, payment_method } = data;
    if (!amount || amount <= 0) {
      throw new AppError('VALIDATION_ERROR', { required: ['amount'] });
    }

    if (makeup.status !== 'pending_payment') {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: makeup.status,
        to: 'pending_payment',
        role: operator.role,
        message: '当前状态不支持登记缴费',
      });
    }

    const existingFee = dbi.prepare(`
      SELECT * FROM fee_records WHERE related_id = ? AND type = 'makeup_fee'
    `).get(id);

    let totalPaid = amount;
    let feeStatus = 'partial';
    let feeId;

    if (existingFee) {
      totalPaid = existingFee.paid_amount + amount;
      feeId = existingFee.id;
      if (totalPaid >= makeup.makeup_fee) {
        feeStatus = 'paid';
      }
      dbi.prepare(`
        UPDATE fee_records SET
          paid_amount = ?,
          status = ?,
          remark = COALESCE(remark, '') || ? || '; ',
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        totalPaid,
        feeStatus,
        `补缴¥${amount}${payment_method ? '(' + payment_method + ')' : ''}`,
        feeId
      );
    } else {
      feeId = newId();
      if (totalPaid >= makeup.makeup_fee) {
        feeStatus = 'paid';
      }
      dbi.prepare(`
        INSERT INTO fee_records
        (id, student_id, type, amount, paid_amount, status, related_id, remark, created_by)
        VALUES (?, ?, 'makeup_fee', ?, ?, ?, ?, ?, ?)
      `).run(
        feeId,
        makeup.student_id,
        makeup.makeup_fee,
        amount,
        feeStatus,
        id,
        `补考费缴费¥${amount}${payment_method ? '(' + payment_method + ')' : ''}`,
        operatorId
      );
    }

    const isFullyPaid = totalPaid >= makeup.makeup_fee;
    let newStatus = makeup.status;
    let feePaidTime = makeup.fee_paid_time;

    if (isFullyPaid) {
      newStatus = 'pending_booking';
      feePaidTime = new Date().toISOString();
    }

    dbi.prepare(`
      UPDATE makeup_exams SET
        fee_paid = ?,
        fee_paid_time = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(isFullyPaid ? 1 : 0, feePaidTime, newStatus, id);

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'record_payment',
      targetType: 'makeup_exam',
      targetId: id,
      fromStatus: makeup.status,
      toStatus: newStatus,
      detail: `登记补考费缴费: ¥${amount}${payment_method ? '，支付方式: ' + payment_method : ''}，累计已缴¥${totalPaid}/¥${makeup.makeup_fee}${isFullyPaid ? '，已缴清' : '，待补缴¥' + (makeup.makeup_fee - totalPaid)}`,
    });

    if (isFullyPaid) {
      const examSpecialists = dbi.prepare(`
        SELECT id, name FROM users WHERE role = 'exam_specialist'
      `).all();
      examSpecialists.forEach(es => {
        createNotification({
          userId: es.id,
          userRole: 'exam_specialist',
          title: '补考费已缴，待预约考试',
          content: `科目${makeup.subject}补考费已缴清，请及时安排补考预约`,
          type: 'makeup_exam',
          priority: 'high',
          relatedId: id,
          relatedType: 'makeup_exam',
        });
      });
    }

    return getMakeupExamDetail(id);
  });
}

function bookMakeupExam(id, data, operatorId) {
  return tx(() => {
    const dbi = getDB();
    const operator = checkPermission(operatorId, 'makeup_exams', 'book');
    const makeup = assertFound(dbi.prepare('SELECT * FROM makeup_exams WHERE id = ?').get(id), 'MAKEUP_NOT_FOUND');

    if (makeup.fee_paid !== 1) {
      throw new AppError('MAKEUP_FEE_UNPAID', {
        makeup_id: id,
        makeup_fee: makeup.makeup_fee,
      });
    }

    if (!canTransition(MAKEUP_STATUS_TRANSITIONS, makeup.status, 'booked', operator.role)) {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: makeup.status,
        to: 'booked',
        role: operator.role,
      });
    }

    const tempBooking = createExamBooking({
      student_id: makeup.student_id,
      subject: makeup.subject,
      is_makeup: 1,
      original_booking_id: makeup.failed_booking_id,
      status: 'approved',
    }, operatorId);

    const { bookExamSession } = require('./examBookingService');
    const newBooking = bookExamSession(tempBooking.id, data.exam_session_id, operatorId);

    dbi.prepare(`
      UPDATE makeup_exams SET
        new_booking_id = ?,
        status = 'booked',
        updated_at = datetime('now')
      WHERE id = ?
    `).run(newBooking.id, id);

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'book_makeup',
      targetType: 'makeup_exam',
      targetId: id,
      fromStatus: makeup.status,
      toStatus: 'booked',
      detail: `预约补考考试: 场次ID ${data.exam_session_id}，新预约ID ${newBooking.id}`,
    });

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'book_session',
      targetType: 'exam_booking',
      targetId: newBooking.id,
      fromStatus: 'approved',
      toStatus: 'booked',
      detail: `补考预约场次: 关联补考ID ${id}`,
    });

    return getMakeupExamDetail(id);
  });
}

function completeMakeupExam(id, operatorId) {
  return tx(() => {
    const dbi = getDB();
    const operator = checkPermission(operatorId, 'makeup_exams', 'complete');
    const makeup = assertFound(dbi.prepare('SELECT * FROM makeup_exams WHERE id = ?').get(id), 'MAKEUP_NOT_FOUND');

    if (!canTransition(MAKEUP_STATUS_TRANSITIONS, makeup.status, 'completed', operator.role)) {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: makeup.status,
        to: 'completed',
        role: operator.role,
      });
    }

    if (makeup.status === 'booked' && !makeup.new_booking_id) {
      throw new AppError('VALIDATION_ERROR', {
        message: '已约考状态的补考必须有关联的考试预约',
      });
    }

    let examBookingStatus = null;
    if (makeup.new_booking_id) {
      const booking = dbi.prepare(`
        SELECT status FROM exam_bookings WHERE id = ?
      `).get(makeup.new_booking_id);
      if (booking) {
        examBookingStatus = booking.status;
        if (booking.status !== 'passed' && booking.status !== 'failed' && booking.status !== 'no_show') {
          throw new AppError('INVALID_STATUS_TRANSITION', {
            message: '关联考试预约必须已有结果（通过/未通过/缺考）才能完成补考',
            booking_status: booking.status,
          });
        }
      }
    }

    dbi.prepare(`
      UPDATE makeup_exams SET
        status = 'completed',
        updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'complete',
      targetType: 'makeup_exam',
      targetId: id,
      fromStatus: makeup.status,
      toStatus: 'completed',
      detail: `补考流程完成${examBookingStatus ? `，关联考试预约结果: ${examBookingStatus}` : ''}`,
    });

    if (makeup.new_booking_id) {
      logOperation({
        operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        action: 'complete_makeup',
        targetType: 'exam_booking',
        targetId: makeup.new_booking_id,
        fromStatus: examBookingStatus || makeup.status,
        toStatus: 'completed',
        detail: `关联补考流程已完成: 补考ID ${id}`,
      });
    }

    const feeRecord = dbi.prepare(`
      SELECT * FROM fee_records WHERE related_id = ? AND type = 'makeup_fee'
    `).get(id);
    if (feeRecord && feeRecord.status !== 'paid') {
      dbi.prepare(`
        UPDATE fee_records SET
          status = 'paid',
          updated_at = datetime('now')
        WHERE id = ?
      `).run(feeRecord.id);
      logOperation({
        operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        action: 'update_status',
        targetType: 'fee_record',
        targetId: feeRecord.id,
        fromStatus: feeRecord.status,
        toStatus: 'paid',
        detail: `补考完成，同步更新费用状态为已缴清，关联补考ID ${id}`,
      });
    }

    return getMakeupExamDetail(id);
  });
}

function cancelMakeupExam(id, data, operatorId) {
  return tx(() => {
    const dbi = getDB();
    const operator = checkPermission(operatorId, 'makeup_exams', 'cancel');
    const makeup = assertFound(dbi.prepare('SELECT * FROM makeup_exams WHERE id = ?').get(id), 'MAKEUP_NOT_FOUND');

    if (!canTransition(MAKEUP_STATUS_TRANSITIONS, makeup.status, 'cancelled', operator.role)) {
      throw new AppError('INVALID_STATUS_TRANSITION', {
        from: makeup.status,
        to: 'cancelled',
        role: operator.role,
      });
    }

    let cancelledBookingId = null;
    let releasedSessionId = null;

    if (makeup.new_booking_id) {
      const booking = dbi.prepare(`
        SELECT * FROM exam_bookings WHERE id = ?
      `).get(makeup.new_booking_id);
      if (booking && booking.status === 'booked') {
        const { decrementSessionBookedCount } = require('./examBookingService');
        if (booking.exam_session_id) {
          decrementSessionBookedCount(booking.exam_session_id);
          releasedSessionId = booking.exam_session_id;
        }
        dbi.prepare(`
          UPDATE exam_bookings SET
            status = 'cancelled',
            cancel_reason = ?,
            cancel_time = datetime('now'),
            updated_at = datetime('now')
          WHERE id = ?
        `).run(data?.reason || '补考取消', booking.id);
        cancelledBookingId = booking.id;
        logOperation({
          operatorId,
          operatorName: operator.name,
          operatorRole: operator.role,
          action: 'cancel',
          targetType: 'exam_booking',
          targetId: booking.id,
          fromStatus: booking.status,
          toStatus: 'cancelled',
          detail: `因补考取消而取消: 关联补考ID ${id}，原因: ${data?.reason || '无原因'}`,
        });
      }
    }

    dbi.prepare(`
      UPDATE makeup_exams SET
        status = 'cancelled',
        updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    const detailParts = [];
    if (data?.reason) detailParts.push(`原因: ${data.reason}`);
    if (cancelledBookingId) detailParts.push(`已取消关联考试预约: ${cancelledBookingId}`);
    if (releasedSessionId) detailParts.push(`已释放场次名额: ${releasedSessionId}`);

    logOperation({
      operatorId,
      operatorName: operator.name,
      operatorRole: operator.role,
      action: 'cancel',
      targetType: 'makeup_exam',
      targetId: id,
      fromStatus: makeup.status,
      toStatus: 'cancelled',
      detail: detailParts.length > 0 ? detailParts.join('，') : '取消补考',
    });

    const feeRecord = dbi.prepare(`
      SELECT * FROM fee_records WHERE related_id = ? AND type = 'makeup_fee'
    `).get(id);
    if (feeRecord && feeRecord.status === 'paid') {
      logOperation({
        operatorId,
        operatorName: operator.name,
        operatorRole: operator.role,
        action: 'cancel_with_fee',
        targetType: 'fee_record',
        targetId: feeRecord.id,
        fromStatus: feeRecord.status,
        toStatus: 'paid',
        detail: `补考已取消，费用已缴清，需办理退款，关联补考ID ${id}`,
      });
    }

    return getMakeupExamDetail(id);
  });
}

function getMakeupReviewData(id, operatorId) {
  if (operatorId) {
    checkPermission(operatorId, 'makeup_exams', 'review');
  }
  const dbi = getDB();
  const makeup = getMakeupExamDetail(id, operatorId);

  const originalBooking = dbi.prepare(`
    SELECT eb.*, es.exam_date, es.exam_time, es.exam_location
    FROM exam_bookings eb
    LEFT JOIN exam_sessions es ON eb.exam_session_id = es.id
    WHERE eb.id = ?
  `).get(makeup.failed_booking_id);

  const allAttempts = dbi.prepare(`
    SELECT eb.*, es.exam_date, es.exam_time, es.exam_location
    FROM exam_bookings eb
    LEFT JOIN exam_sessions es ON eb.exam_session_id = es.id
    WHERE eb.student_id = ? AND eb.subject = ?
    ORDER BY eb.created_at ASC
  `).all(makeup.student_id, makeup.subject);

  const studentInfo = dbi.prepare(`
    SELECT s.*, u.name as coach_name
    FROM students s
    LEFT JOIN users u ON s.coach_id = u.id
    WHERE s.id = ?
  `).get(makeup.student_id);

  return {
    makeup,
    originalBooking,
    allAttempts,
    studentInfo,
    attemptCount: allAttempts.length,
    subject_name: SUBJECT_NAMES[makeup.subject],
  };
}

function computeMakeupAttention(makeup) {
  let priority = 'normal';
  let stuckReason = null;

  if (makeup.status === 'pending_payment') {
    priority = 'high';
    const createdDays = Math.floor((Date.now() - new Date(makeup.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (createdDays > 7) {
      stuckReason = `补考费已超过${createdDays}天未缴清`;
    }
  } else if (makeup.status === 'pending_booking') {
    priority = 'high';
    const paidDays = makeup.payment_time
      ? Math.floor((Date.now() - new Date(makeup.payment_time).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - new Date(makeup.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (paidDays > 3) {
      stuckReason = `缴费后已${paidDays}天未约考`;
    }
  } else if (makeup.status === 'booked' && makeup.new_exam_date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const examDate = new Date(makeup.new_exam_date);
    if (examDate.toDateString() === tomorrow.toDateString()) {
      priority = 'high';
    }
  }

  const needsAttention = priority === 'urgent' || priority === 'high' || !!stuckReason;

  return { priority, stuck_reason: stuckReason, needs_attention: needsAttention };
}

function enrichMakeup(m) {
  const attention = computeMakeupAttention(m);
  return {
    ...m,
    subject_name: SUBJECT_NAMES[m.subject],
    status_name: MAKEUP_STATUS_TRANSITIONS[m.status]?.description || m.status,
    fee_paid: !!m.fee_paid,
    priority: attention.priority,
    stuck_reason: attention.stuck_reason,
    needs_attention: attention.needs_attention,
    last_operator_name: m.last_operator_name || null,
    last_action_time: m.last_action_time || null,
  };
}

module.exports = {
  createMakeupExam,
  listMakeupExams,
  getMakeupExamDetail,
  getMakeupExamHistory,
  recordMakeupPayment,
  bookMakeupExam,
  completeMakeupExam,
  cancelMakeupExam,
  getMakeupReviewData,
  enrichMakeup,
};
