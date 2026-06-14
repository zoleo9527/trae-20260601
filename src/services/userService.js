const { getDB } = require('../db');
const { AppError } = require('../errors');

const ROLE_LABELS = {
  admin_staff: '考务专员',
  invigilator: '监考老师',
  tech_support: '技术支持',
};

function listUsers(role) {
  const db = getDB();
  const sql = role ? 'SELECT * FROM users WHERE role = ? ORDER BY created_at' : 'SELECT * FROM users ORDER BY created_at';
  const params = role ? [role] : [];
  return db.prepare(sql).all(...params);
}

function getUser(id) {
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('USER_NOT_FOUND');
  return user;
}

function checkRole(userId, allowedRoles) {
  const user = getUser(userId);
  if (!allowedRoles.includes(user.role)) {
    throw new AppError('ROLE_UNAUTHORIZED');
  }
  return user;
}

function getMyTodos(userId, role) {
  const db = getDB();
  const todos = [];
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? AND is_read = 0
    ORDER BY created_at DESC
    LIMIT 50
  `).all(userId);
  todos.push(...notifications.map(n => ({
    id: n.id,
    type: 'notification',
    notif_type: n.type,
    title: n.title,
    content: n.content,
    registration_id: n.registration_id,
    created_at: n.created_at,
  })));

  if (role === 'admin_staff') {
    const pending = db.prepare(`
      SELECT id, candidate_name, exam_type, submitted_at
      FROM registrations WHERE status = 'pending'
      ORDER BY submitted_at ASC
    `).all();
    todos.push(...pending.map(r => ({
      id: `audit-${r.id}`,
      type: 'audit_pending',
      title: `待审核：${r.candidate_name}`,
      content: `考试类型：${r.exam_type}，提交时间：${r.submitted_at}`,
      registration_id: r.id,
      created_at: r.submitted_at,
    })));
  }

  if (role === 'invigilator') {
    const approvedNoTicket = db.prepare(`
      SELECT r.id, r.candidate_name, r.exam_type, r.audit_time
      FROM registrations r
      LEFT JOIN admission_tickets t ON t.registration_id = r.id
      WHERE r.status = 'approved' AND t.id IS NULL
      ORDER BY r.audit_time ASC
    `).all();
    todos.push(...approvedNoTicket.map(r => ({
      id: `ticket-${r.id}`,
      type: 'ticket_pending',
      title: `待生成准考证：${r.candidate_name}`,
      content: `考试类型：${r.exam_type}，审核通过时间：${r.audit_time}`,
      registration_id: r.id,
      created_at: r.audit_time,
    })));
  }

  if (role === 'tech_support') {
    const rejected = db.prepare(`
      SELECT id, candidate_name, reject_reason, audit_time
      FROM registrations WHERE status = 'rejected' AND (supplement_remark IS NULL OR supplement_remark = '')
      ORDER BY audit_time ASC
    `).all();
    todos.push(...rejected.map(r => ({
      id: `supplement-${r.id}`,
      type: 'supplement_pending',
      title: `报名退回待补正：${r.candidate_name}`,
      content: `退回原因：${r.reject_reason}`,
      registration_id: r.id,
      created_at: r.audit_time,
    })));
  }

  todos.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  return {
    user_role: role,
    user_role_label: ROLE_LABELS[role] || role,
    total: todos.length,
    items: todos,
  };
}

function markNotificationRead(notificationId, userId) {
  const db = getDB();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
  return { success: true };
}

function listExamRooms() {
  const db = getDB();
  return db.prepare(`
    SELECT er.*, COUNT(at.id) AS occupied
    FROM exam_rooms er
    LEFT JOIN admission_tickets at ON at.exam_room_id = er.id
    GROUP BY er.id
    ORDER BY er.room_code
  `).all();
}

function listInvigilatorAssignments() {
  const db = getDB();
  return db.prepare(`
    SELECT ia.*, u.name AS invigilator_name, u.username,
           er.room_code, er.building, er.exam_time
    FROM invigilator_assignments ia
    JOIN users u ON ia.invigilator_id = u.id
    JOIN exam_rooms er ON ia.exam_room_id = er.id
    ORDER BY er.room_code
  `).all();
}

module.exports = {
  ROLE_LABELS,
  listUsers,
  getUser,
  checkRole,
  getMyTodos,
  markNotificationRead,
  listExamRooms,
  listInvigilatorAssignments,
};
