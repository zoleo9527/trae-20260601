const { getDB, tx, newId, assertFound, getRoomInvigilators } = require('../db');
const { AppError } = require('../errors');

const REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING_REVIEW: 'pending_review',
};

const STATUS_LABEL = {
  pending: '待审核',
  approved: '审核通过',
  rejected: '已退回',
  pending_review: '补正完成待复审',
};
Object.freeze(STATUS_LABEL);

function hydrateInvigilators(rows, roomIdKey = 'exam_room_id') {
  if (!Array.isArray(rows)) return rows;
  const roomIds = [...new Set(rows.map(r => r[roomIdKey]).filter(Boolean))];
  const roomInvMap = {};
  roomIds.forEach(rid => { roomInvMap[rid] = getRoomInvigilators(rid); });
  return rows.map(r => ({
    ...r,
    invigilators: r[roomIdKey] ? (roomInvMap[r[roomIdKey]] || []) : [],
  }));
}

function validateRegistration(data) {
  const errors = {};
  if (!data.candidate_name || data.candidate_name.trim().length < 2) {
    errors.candidate_name = '考生姓名不能为空且至少2个字符';
  }
  if (!data.id_card || !/^\d{17}[\dXx]$/.test(data.id_card)) {
    errors.id_card = '身份证号格式不正确（18位）';
  }
  if (!data.exam_type || data.exam_type.trim().length === 0) {
    errors.exam_type = '考试类型不能为空';
  }
  if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
    errors.phone = '手机号格式不正确';
  }
  if (Object.keys(errors).length > 0) {
    throw new AppError('VALIDATION_ERROR', errors);
  }
}

function createRegistration(data) {
  validateRegistration(data);
  const db = getDB();
  const id = newId();
  const stmt = db.prepare(`
    INSERT INTO registrations (id, candidate_name, id_card, exam_type, phone, email, status)
    VALUES (@id, @candidate_name, @id_card, @exam_type, @phone, @email, 'pending')
  `);
  tx(() => {
    stmt.run({
      id,
      candidate_name: data.candidate_name,
      id_card: data.id_card,
      exam_type: data.exam_type,
      phone: data.phone || null,
      email: data.email || null,
    });
    addTimeline(id, 'submit', null, null, `考生提交报名申请`);
  });
  return getRegistrationDetail(id);
}

function listRegistrations({ status, keyword, offset = 0, limit = 20 } = {}) {
  const db = getDB();
  const conditions = [];
  const params = {};
  if (status) {
    conditions.push('r.status = @status');
    params.status = status;
  }
  if (keyword) {
    conditions.push('(r.candidate_name LIKE @kw OR r.id_card LIKE @kw)');
    params.kw = `%${keyword}%`;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT r.*, u.name AS auditor_name, t.ticket_no, t.exam_room_id,
           hd.name AS handler_name, ai.name AS assigned_invigilator_name,
           sb.name AS supplement_by_name, rb.name AS reopen_by_name
    FROM registrations r
    LEFT JOIN users u ON r.auditor_id = u.id
    LEFT JOIN users hd ON r.handler_id = hd.id
    LEFT JOIN users ai ON r.assigned_invigilator_id = ai.id
    LEFT JOIN users sb ON r.supplement_by = sb.id
    LEFT JOIN users rb ON r.reopen_by = rb.id
    LEFT JOIN admission_tickets t ON t.registration_id = r.id
    ${where}
    ORDER BY r.submitted_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: Number(limit), offset: Number(offset) });
  const hydrated = hydrateInvigilators(rows, 'exam_room_id').map(r => ({
    ...r,
    status_label: STATUS_LABEL[r.status] || r.status,
    supplement_completed: !!(r.supplement_by && r.supplement_time),
    reopened: !!(r.reopen_by && r.reopen_time),
  }));
  const total = db.prepare(`SELECT COUNT(*) AS c FROM registrations r ${where}`).get(params).c;
  return { total, items: hydrated };
}

function getRegistrationDetail(id) {
  const db = getDB();
  const reg = db.prepare(`
    SELECT r.*, u.name AS auditor_name, t.id AS ticket_id, t.ticket_no,
           t.seat_no, er.room_code, er.building, er.exam_time, er.id AS exam_room_id,
           gen.name AS generated_by_name,
           hd.name AS handler_name, ai.name AS assigned_invigilator_name,
           sb.name AS supplement_by_name, rb.name AS reopen_by_name
    FROM registrations r
    LEFT JOIN users u ON r.auditor_id = u.id
    LEFT JOIN users hd ON r.handler_id = hd.id
    LEFT JOIN users ai ON r.assigned_invigilator_id = ai.id
    LEFT JOIN users sb ON r.supplement_by = sb.id
    LEFT JOIN users rb ON r.reopen_by = rb.id
    LEFT JOIN admission_tickets t ON t.registration_id = r.id
    LEFT JOIN exam_rooms er ON t.exam_room_id = er.id
    LEFT JOIN users gen ON t.generated_by = gen.id
    WHERE r.id = ?
  `).get(id);
  assertFound(reg, 'REGISTRATION_NOT_FOUND');
  reg.status_label = STATUS_LABEL[reg.status] || reg.status;
  reg.invigilators = getRoomInvigilators(reg.exam_room_id);
  reg.supplement_completed = !!(reg.supplement_by && reg.supplement_time);
  reg.reopened = !!(reg.reopen_by && reg.reopen_time);
  reg.timeline = db.prepare(`
    SELECT tl.*, u.name AS operator_name
    FROM registration_timeline tl
    LEFT JOIN users u ON tl.operator_id = u.id
    WHERE tl.registration_id = ?
    ORDER BY tl.created_at ASC
  `).all(id);
  return reg;
}

function auditRegistration(id, { action, reason, auditorId, auditorRole, handlerId, assignedInvigilatorId }) {
  if (!['approve', 'reject'].includes(action)) {
    throw new AppError('AUDIT_ACTION_INVALID');
  }
  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    throw new AppError('REJECT_REASON_REQUIRED');
  }
  const db = getDB();
  const reg = assertFound(db.prepare('SELECT * FROM registrations WHERE id = ?').get(id), 'REGISTRATION_NOT_FOUND');
  if (![REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.PENDING_REVIEW].includes(reg.status)) {
    throw new AppError('REGISTRATION_ALREADY_AUDITED');
  }
  const isReviewCycle = reg.status === REGISTRATION_STATUS.PENDING_REVIEW;
  const newStatus = action === 'approve' ? REGISTRATION_STATUS.APPROVED : REGISTRATION_STATUS.REJECTED;
  const finalHandlerId = action === 'reject' ? (handlerId || null) : null;
  const finalInvigilatorId = action === 'approve' ? (assignedInvigilatorId || pickRoundRobinInvigilator(db)) : null;
  tx(() => {
    if (action === 'reject') {
      db.prepare(`
        UPDATE registrations
        SET status = @status, auditor_id = @auditorId, audit_time = datetime('now'),
            reject_reason = @reason,
            handler_id = @handlerId,
            assigned_invigilator_id = NULL
        WHERE id = @id
      `).run({
        id, status: newStatus, auditorId,
        reason, handlerId: finalHandlerId,
      });
    } else {
      db.prepare(`
        UPDATE registrations
        SET status = @status, auditor_id = @auditorId, audit_time = datetime('now'),
            handler_id = NULL,
            assigned_invigilator_id = @assignedInvigilatorId
        WHERE id = @id
      `).run({
        id, status: newStatus, auditorId,
        assignedInvigilatorId: finalInvigilatorId,
      });
    }
    const handlerName = finalHandlerId
      ? (db.prepare('SELECT name FROM users WHERE id = ?').get(finalHandlerId)?.name || '')
      : '';
    const invigilatorName = finalInvigilatorId
      ? (db.prepare('SELECT name FROM users WHERE id = ?').get(finalInvigilatorId)?.name || '')
      : '';
    const prefix = isReviewCycle ? '复审' : '审核';
    addTimeline(id, action === 'approve' ? (isReviewCycle ? 're_review_approve' : 'approve') : (isReviewCycle ? 're_review_reject' : 'reject'),
      auditorId, auditorRole,
      action === 'approve'
        ? `${prefix}通过（保留历史补正记录）${invigilatorName ? `，准考证负责监考：${invigilatorName}` : ''}`
        : `${prefix}退回：${reason}${handlerName ? `，归属处理人：${handlerName}` : ''}`
    );
    if (action === 'approve') {
      if (finalInvigilatorId) {
        pushNotification({
          userIds: [finalInvigilatorId],
          registrationId: id,
          title: isReviewCycle ? '复审通过：待您生成准考证' : '新报名通过审核（待您生成准考证）',
          content: `考生 ${reg.candidate_name}（${reg.exam_type}）${prefix}通过，请及时生成准考证`,
          type: 'audit_pass',
        });
      }
    } else {
      if (finalHandlerId) {
        pushNotification({
          userIds: [finalHandlerId],
          registrationId: id,
          title: isReviewCycle ? '复审再次退回：请继续补正' : '您有新的报名退回补正任务',
          content: `考生 ${reg.candidate_name} 报名${prefix}退回，原因：${reason}`,
          type: 'audit_reject',
        });
      } else {
        pushNotification({
          userRole: 'tech_support',
          registrationId: id,
          title: isReviewCycle ? '复审再次退回：请接单补正' : '报名被退回需补正',
          content: `考生 ${reg.candidate_name} 报名${prefix}退回，原因：${reason}`,
          type: 'audit_reject',
        });
      }
    }
  });
  return getRegistrationDetail(id);
}

function pickRoundRobinInvigilator(db) {
  const row = db.prepare(`
    SELECT u.id, COUNT(r.id) AS load
    FROM users u
    LEFT JOIN registrations r ON r.assigned_invigilator_id = u.id AND r.status = 'approved'
    WHERE u.role = 'invigilator'
    GROUP BY u.id
    ORDER BY load ASC, u.created_at ASC
    LIMIT 1
  `).get();
  return row ? row.id : null;
}

function addSupplementRemark(id, { remark, operatorId, operatorRole, handlerId, markResolved = false }) {
  if (!remark || remark.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', { remark: '补充备注不能为空' });
  }
  const db = getDB();
  const reg = assertFound(db.prepare('SELECT * FROM registrations WHERE id = ?').get(id), 'REGISTRATION_NOT_FOUND');
  if (markResolved && reg.status !== REGISTRATION_STATUS.REJECTED) {
    throw new AppError('REGISTRATION_STATUS_INVALID', {
      hint: `仅 rejected 状态可标记补正完成，当前状态：${reg.status}`,
    });
  }
  tx(() => {
    if (handlerId) {
      db.prepare(`
        UPDATE registrations
        SET handler_id = @handlerId
        WHERE id = @id
      `).run({ id, handlerId });
      const handlerName = db.prepare('SELECT name FROM users WHERE id = ?').get(handlerId)?.name || '';
      addTimeline(id, 'supplement_reassign', operatorId, operatorRole,
        `转派给 ${handlerName}，备注：${remark}`);
      pushNotification({
        userIds: [handlerId],
        registrationId: id,
        title: '补正任务已转派给您',
        content: `考生 ${reg.candidate_name} 的补正任务：${remark}`,
        type: 'supplement_reassign',
      });
    } else if (markResolved) {
      db.prepare(`
        UPDATE registrations
        SET status = 'pending_review',
            supplement_remark = @remark, supplement_time = datetime('now'),
            supplement_by = @operatorId
        WHERE id = @id
      `).run({ id, remark, operatorId });
      const operatorName = db.prepare('SELECT name FROM users WHERE id = ?').get(operatorId)?.name || '';
      addTimeline(id, 'supplement_done', operatorId, operatorRole,
        `补正完成，标记待复审。处理说明：${remark}`);
      pushNotification({
        userRole: 'admin_staff',
        registrationId: id,
        title: '补正完成，待复审接回',
        content: `考生 ${reg.candidate_name} 已由 ${operatorName} 完成补正，请及时复审（${remark}）`,
        type: 'supplement_done',
      });
    } else {
      addTimeline(id, 'supplement', operatorId, operatorRole, `补充备注：${remark}`);
    }
  });
  return getRegistrationDetail(id);
}

function reopenRegistration(id, { operatorId, operatorRole, reason, reassignInvigilatorId }) {
  const db = getDB();
  const reg = assertFound(db.prepare('SELECT * FROM registrations WHERE id = ?').get(id), 'REGISTRATION_NOT_FOUND');
  if (reg.status !== REGISTRATION_STATUS.PENDING_REVIEW) {
    throw new AppError('REGISTRATION_STATUS_INVALID', {
      hint: `仅 pending_review 状态可接回复审，当前状态：${reg.status}`,
    });
  }
  tx(() => {
    db.prepare(`
      UPDATE registrations
      SET status = 'pending',
          auditor_id = NULL, audit_time = NULL,
          handler_id = NULL,
          assigned_invigilator_id = COALESCE(@reassignInvigilatorId, assigned_invigilator_id),
          reopen_by = @operatorId,
          reopen_time = datetime('now')
      WHERE id = @id
    `).run({ id, operatorId, reassignInvigilatorId: reassignInvigilatorId || null });
    const operatorName = db.prepare('SELECT name FROM users WHERE id = ?').get(operatorId)?.name || '';
    const detail = reason
      ? `由 ${operatorName} 接回复审（保留补正历史），原因：${reason}`
      : `由 ${operatorName} 接回复审（保留补正历史），重新进入待审核队列`;
    addTimeline(id, 'reopen_review', operatorId, operatorRole, detail);
    if (reassignInvigilatorId) {
      const invName = db.prepare('SELECT name FROM users WHERE id = ?').get(reassignInvigilatorId)?.name || '';
      pushNotification({
        userIds: [reassignInvigilatorId],
        registrationId: id,
        title: '复审报名已接回',
        content: `考生 ${reg.candidate_name} 已接回待审核，初审通过后由您负责准考证生成（${invName}）`,
        type: 'reopen_review',
      });
    }
  });
  return getRegistrationDetail(id);
}

function addTimeline(registrationId, actionType, operatorId, operatorRole, detail) {
  const db = getDB();
  db.prepare(`
    INSERT INTO registration_timeline (id, registration_id, action_type, operator_id, operator_role, detail)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newId(), registrationId, actionType, operatorId, operatorRole, detail);
}

function pushNotification({ userIds, userRole, examRoomId, registrationId, title, content, type }) {
  const db = getDB();
  const ids = new Set();
  if (Array.isArray(userIds)) userIds.forEach(id => id && ids.add(id));
  if (userRole) {
    db.prepare("SELECT id FROM users WHERE role = ?").all(userRole).forEach(u => ids.add(u.id));
  }
  if (examRoomId) {
    db.prepare(`
      SELECT invigilator_id AS id FROM invigilator_assignments WHERE exam_room_id = ?
    `).all(examRoomId).forEach(r => ids.add(r.id));
  }
  if (ids.size === 0) return;
  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, user_role, registration_id, title, content, type)
    VALUES (?, ?, (SELECT role FROM users WHERE id = ?), ?, ?, ?, ?)
  `);
  ids.forEach(uid => {
    stmt.run(newId(), uid, uid, registrationId || null, title, content, type);
  });
}

module.exports = {
  REGISTRATION_STATUS,
  STATUS_LABEL,
  createRegistration,
  listRegistrations,
  getRegistrationDetail,
  auditRegistration,
  addSupplementRemark,
  reopenRegistration,
  addTimeline,
  pushNotification,
  hydrateInvigilators,
};
