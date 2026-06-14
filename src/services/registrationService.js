const { getDB, tx, newId, assertFound } = require('../db');
const { AppError } = require('../errors');

const REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

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
    stmt.run({ id, ...data });
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
    SELECT r.*, u.name AS auditor_name, t.ticket_no
    FROM registrations r
    LEFT JOIN users u ON r.auditor_id = u.id
    LEFT JOIN admission_tickets t ON t.registration_id = r.id
    ${where}
    ORDER BY r.submitted_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: Number(limit), offset: Number(offset) });
  const total = db.prepare(`SELECT COUNT(*) AS c FROM registrations r ${where}`).get(params).c;
  return { total, items: rows };
}

function getRegistrationDetail(id) {
  const db = getDB();
  const reg = db.prepare(`
    SELECT r.*, u.name AS auditor_name, t.id AS ticket_id, t.ticket_no,
           t.seat_no, er.room_code, er.building, er.exam_time,
           gen.name AS generated_by_name
    FROM registrations r
    LEFT JOIN users u ON r.auditor_id = u.id
    LEFT JOIN admission_tickets t ON t.registration_id = r.id
    LEFT JOIN exam_rooms er ON t.exam_room_id = er.id
    LEFT JOIN users gen ON t.generated_by = gen.id
    WHERE r.id = ?
  `).get(id);
  assertFound(reg, 'REGISTRATION_NOT_FOUND');
  reg.timeline = db.prepare(`
    SELECT tl.*, u.name AS operator_name
    FROM registration_timeline tl
    LEFT JOIN users u ON tl.operator_id = u.id
    WHERE tl.registration_id = ?
    ORDER BY tl.created_at ASC
  `).all(id);
  return reg;
}

function auditRegistration(id, { action, reason, auditorId, auditorRole }) {
  if (!['approve', 'reject'].includes(action)) {
    throw new AppError('AUDIT_ACTION_INVALID');
  }
  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    throw new AppError('REJECT_REASON_REQUIRED');
  }
  const db = getDB();
  const reg = assertFound(db.prepare('SELECT * FROM registrations WHERE id = ?').get(id), 'REGISTRATION_NOT_FOUND');
  if (reg.status !== REGISTRATION_STATUS.PENDING) {
    throw new AppError('REGISTRATION_ALREADY_AUDITED');
  }
  const newStatus = action === 'approve' ? REGISTRATION_STATUS.APPROVED : REGISTRATION_STATUS.REJECTED;
  tx(() => {
    db.prepare(`
      UPDATE registrations
      SET status = @status, auditor_id = @auditorId, audit_time = datetime('now'), reject_reason = @reason
      WHERE id = @id
    `).run({ id, status: newStatus, auditorId, reason: action === 'reject' ? reason : null });
    addTimeline(id, action === 'approve' ? 'approve' : 'reject', auditorId, auditorRole,
      action === 'approve' ? `审核通过` : `审核退回：${reason}`);
    if (action === 'approve') {
      pushNotification({
        userRole: 'invigilator',
        registrationId: id,
        title: '新报名通过审核',
        content: `考生 ${reg.candidate_name} 报名已通过审核，请安排考场与准考证`,
        type: 'audit_pass',
      });
    } else {
      pushNotification({
        userRole: 'tech_support',
        registrationId: id,
        title: '报名被退回需补正',
        content: `考生 ${reg.candidate_name} 报名被退回，原因：${reason}`,
        type: 'audit_reject',
      });
    }
  });
  return getRegistrationDetail(id);
}

function addSupplementRemark(id, { remark, operatorId, operatorRole }) {
  if (!remark || remark.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', { remark: '补充备注不能为空' });
  }
  const db = getDB();
  assertFound(db.prepare('SELECT id FROM registrations WHERE id = ?').get(id), 'REGISTRATION_NOT_FOUND');
  tx(() => {
    db.prepare(`
      UPDATE registrations SET supplement_remark = @remark, supplement_time = datetime('now') WHERE id = @id
    `).run({ id, remark });
    addTimeline(id, 'supplement', operatorId, operatorRole, `补充备注：${remark}`);
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

function pushNotification({ userRole, registrationId, title, content, type }) {
  const db = getDB();
  const users = db.prepare("SELECT id FROM users WHERE role = ?").all(userRole);
  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, user_role, registration_id, title, content, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  users.forEach(u => stmt.run(newId(), u.id, userRole, registrationId, title, content, type));
}

module.exports = {
  REGISTRATION_STATUS,
  createRegistration,
  listRegistrations,
  getRegistrationDetail,
  auditRegistration,
  addSupplementRemark,
  addTimeline,
  pushNotification,
};
