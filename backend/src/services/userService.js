const { getDB, assertFound } = require('../db');
const { AppError } = require('../errors');
const { hasPermission } = require('../statusConstraints');

function getUserById(userId) {
  const dbi = getDB();
  const user = dbi.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return assertFound(user, 'USER_NOT_FOUND');
}

function checkPermission(userId, module, action) {
  const user = getUserById(userId);
  if (!hasPermission(user.role, module, action)) {
    throw new AppError('ROLE_UNAUTHORIZED', {
      module,
      action,
      role: user.role,
    });
  }
  return user;
}

function checkRole(userId, allowedRoles) {
  const user = getUserById(userId);
  if (!allowedRoles.includes(user.role)) {
    throw new AppError('ROLE_UNAUTHORIZED', {
      allowedRoles,
      currentRole: user.role,
    });
  }
  return user;
}

function listUsers(role = null) {
  const dbi = getDB();
  let sql = 'SELECT id, username, name, role, phone, created_at FROM users';
  const params = [];
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  sql += ' ORDER BY created_at DESC';
  const users = dbi.prepare(sql).all(...params);
  return users.map(u => ({
    ...u,
    role_name: getRoleName(u.role),
  }));
}

function getRoleName(role) {
  const names = {
    admission_consultant: '招生顾问',
    coach: '教练',
    exam_specialist: '考试专员',
    admin: '管理员',
  };
  return names[role] || role;
}

function getMyTodos(userId, userRole) {
  const dbi = getDB();
  const todos = [];

  if (userRole === 'admission_consultant' || userRole === 'admin') {
    const unpaidFees = dbi.prepare(`
      SELECT fr.id, fr.type, fr.amount, fr.status, s.name as student_name, s.phone
      FROM fee_records fr
      JOIN students s ON fr.student_id = s.id
      WHERE fr.status IN ('unpaid', 'partial')
      ORDER BY fr.created_at DESC
      LIMIT 10
    `).all();
    todos.push(...unpaidFees.map(f => ({
      type: 'fee',
      title: `${f.student_name} - 待缴费`,
      description: `${getFeeTypeName(f.type)} ¥${f.amount}`,
      priority: f.status === 'unpaid' && f.amount > 500 ? 'high' : 'normal',
      data: f,
    })));

    const pendingPaymentMakeup = dbi.prepare(`
      SELECT m.id, m.subject, m.makeup_fee, s.name as student_name, s.phone
      FROM makeup_exams m
      JOIN students s ON m.student_id = s.id
      WHERE m.status = 'pending_payment'
      ORDER BY m.created_at DESC
      LIMIT 10
    `).all();
    todos.push(...pendingPaymentMakeup.map(m => ({
      type: 'makeup_payment',
      title: `${m.student_name} - 补考待缴费`,
      description: `科目${m.subject} 补考费 ¥${m.makeup_fee}`,
      priority: 'high',
      data: m,
    })));
  }

  if (userRole === 'coach' || userRole === 'admin') {
    const coach = dbi.prepare('SELECT id FROM coaches WHERE user_id = ?').get(userId);
    if (coach) {
      const todaySchedules = dbi.prepare(`
        SELECT cs.id, cs.schedule_date, cs.start_time, cs.end_time, cs.type, cs.status,
               s.name as student_name, s.phone
        FROM coach_schedules cs
        LEFT JOIN students s ON cs.student_id = s.id
        WHERE cs.coach_id = ? AND cs.schedule_date = date('now')
        ORDER BY cs.start_time
      `).all(coach.id);
      todos.push(...todaySchedules.map(sc => ({
        type: 'schedule',
        title: `${sc.start_time}-${sc.end_time} ${sc.student_name || '可预约'}`,
        description: getScheduleTypeName(sc.type),
        priority: sc.status === 'booked' ? 'high' : 'normal',
        data: sc,
      })));
    }
  }

  if (userRole === 'exam_specialist' || userRole === 'admin') {
    const pendingApprovals = dbi.prepare(`
      SELECT eb.id, eb.subject, eb.apply_time, eb.status, s.name as student_name, s.phone
      FROM exam_bookings eb
      JOIN students s ON eb.student_id = s.id
      WHERE eb.status = 'pending'
      ORDER BY eb.apply_time DESC
      LIMIT 10
    `).all();
    todos.push(...pendingApprovals.map(b => ({
      type: 'exam_approval',
      title: `${b.student_name} - 科目${b.subject} 待审核`,
      description: `申请时间: ${b.apply_time}`,
      priority: 'urgent',
      data: b,
    })));

    const pendingBookingMakeup = dbi.prepare(`
      SELECT m.id, m.subject, s.name as student_name, s.phone
      FROM makeup_exams m
      JOIN students s ON m.student_id = s.id
      WHERE m.status = 'pending_booking'
      ORDER BY m.created_at DESC
      LIMIT 10
    `).all();
    todos.push(...pendingBookingMakeup.map(m => ({
      type: 'makeup_booking',
      title: `${m.student_name} - 补考待约考`,
      description: `科目${m.subject}`,
      priority: 'high',
      data: m,
    })));

    const tomorrowExams = dbi.prepare(`
      SELECT eb.id, eb.subject, es.exam_date, es.exam_time, es.exam_location,
             s.name as student_name, s.phone
      FROM exam_bookings eb
      JOIN exam_sessions es ON eb.exam_session_id = es.id
      JOIN students s ON eb.student_id = s.id
      WHERE eb.status = 'booked' AND es.exam_date = date('now', '+1 day')
      ORDER BY es.exam_time
      LIMIT 10
    `).all();
    todos.push(...tomorrowExams.map(e => ({
      type: 'tomorrow_exam',
      title: `${e.student_name} - 明日考试`,
      description: `科目${e.subject} ${e.exam_time} ${e.exam_location}`,
      priority: 'normal',
      data: e,
    })));
  }

  return todos.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function getFeeTypeName(type) {
  const names = { tuition: '学费', makeup_fee: '补考费', other: '其他费用' };
  return names[type] || type;
}

function getScheduleTypeName(type) {
  const names = { practice: '练车', exam_accompany: '考试陪练' };
  return names[type] || type;
}

function getRoleDashboardConfig(userRole) {
  const configs = {
    admission_consultant: {
      title: '招生顾问工作台',
      quickActions: [
        { key: 'new_student', label: '新增学员', icon: 'UserPlus', path: '/students/new' },
        { key: 'record_fee', label: '登记缴费', icon: 'CreditCard', path: '/fees/new' },
        { key: 'followup', label: '学员跟进', icon: 'Users', path: '/students' },
      ],
      stats: ['total_students', 'unpaid_fees', 'pending_makeup_payment'],
    },
    coach: {
      title: '教练工作台',
      quickActions: [
        { key: 'my_students', label: '我的学员', icon: 'Users', path: '/my-students' },
        { key: 'today_schedule', label: '今日排班', icon: 'Calendar', path: '/my-schedule' },
        { key: 'new_schedule', label: '发布排班', icon: 'Plus', path: '/schedules/new' },
      ],
      stats: ['my_students_count', 'today_schedule_count', 'completed_practice'],
    },
    exam_specialist: {
      title: '考试专员工作台',
      quickActions: [
        { key: 'pending_approval', label: '待审核预约', icon: 'FileCheck', path: '/exam-bookings?pending' },
        { key: 'new_session', label: '发布考试场次', icon: 'CalendarPlus', path: '/exam-sessions/new' },
        { key: 'record_result', label: '录入成绩', icon: 'FileSpreadsheet', path: '/exam-bookings?record' },
      ],
      stats: ['pending_approval_count', 'upcoming_exams', 'pass_rate'],
    },
    admin: {
      title: '管理员工作台',
      quickActions: [
        { key: 'new_user', label: '新增用户', icon: 'UserPlus', path: '/users/new' },
        { key: 'system_config', label: '系统配置', icon: 'Settings', path: '/settings' },
        { key: 'operation_logs', label: '操作日志', icon: 'History', path: '/logs' },
      ],
      stats: ['total_students', 'total_coaches', 'pending_approval_count', 'unpaid_fees'],
    },
  };
  return configs[userRole] || configs.admin;
}

module.exports = {
  getUserById,
  checkPermission,
  checkRole,
  listUsers,
  getRoleName,
  getMyTodos,
  getRoleDashboardConfig,
  getFeeTypeName,
  getScheduleTypeName,
};
