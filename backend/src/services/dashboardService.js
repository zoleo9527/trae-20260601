const { getDB } = require('../db');
const { getUserById, getRoleDashboardConfig, getMyTodos, getRoleName } = require('./userService');
const { SUBJECT_NAMES, PRIORITY_WEIGHTS } = require('../statusConstraints');
const { getCoachByUserId } = require('./coachService');

function getDashboardData(userId, userRole) {
  const dbi = getDB();
  const user = getUserById(userId);
  const dashboardConfig = getRoleDashboardConfig(userRole);
  const todos = getMyTodos(userId, userRole);

  const stats = getRoleStats(userId, userRole);
  const priorityItems = getPriorityItems(userId, userRole);
  const stuckItems = getStuckItems(userRole);
  const recentChanges = getRecentChanges();

  return {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      role_name: getRoleName(user.role),
    },
    dashboardConfig,
    stats,
    todos,
    priorityItems,
    stuckItems,
    recentChanges,
  };
}

function getRoleStats(userId, userRole) {
  const dbi = getDB();
  const stats = {};

  const baseStats = dbi.prepare(`
    SELECT
      (SELECT COUNT(*) FROM students WHERE status = 'studying') as total_students,
      (SELECT COUNT(*) FROM coaches WHERE status = 'active') as total_coaches,
      (SELECT COUNT(*) FROM exam_bookings WHERE status = 'pending') as pending_approval_count,
      (SELECT COUNT(*) FROM fee_records WHERE status IN ('unpaid', 'partial')) as unpaid_fees,
      (SELECT COUNT(*) FROM makeup_exams WHERE status = 'pending_payment') as pending_makeup_payment,
      (SELECT COUNT(*) FROM makeup_exams WHERE status = 'pending_booking') as pending_makeup_booking
  `).get();

  Object.assign(stats, baseStats);

  if (userRole === 'coach') {
    const coach = getCoachByUserId(userId);
    if (coach) {
      const coachStats = dbi.prepare(`
        SELECT
          (SELECT COUNT(*) FROM students WHERE coach_id = ? AND status = 'studying') as my_students_count,
          (SELECT COUNT(*) FROM coach_schedules WHERE coach_id = ? AND schedule_date = date('now') AND status = 'booked') as today_schedule_count,
          (SELECT COUNT(*) FROM coach_schedules WHERE coach_id = ? AND status = 'completed' AND schedule_date >= date('now', '-7 days')) as completed_practice
      `).get(coach.user_id, coach.id, coach.id);
      Object.assign(stats, coachStats);
    }
  }

  if (userRole === 'exam_specialist') {
    const examStats = dbi.prepare(`
      SELECT
        (SELECT COUNT(*) FROM exam_bookings eb JOIN exam_sessions es ON eb.exam_session_id = es.id WHERE eb.status = 'booked' AND es.exam_date >= date('now')) as upcoming_exams,
        (SELECT COUNT(*) FROM exam_bookings WHERE status = 'passed') /
        CASE WHEN (SELECT COUNT(*) FROM exam_bookings WHERE status IN ('passed', 'failed', 'no_show')) > 0
             THEN (SELECT COUNT(*) FROM exam_bookings WHERE status IN ('passed', 'failed', 'no_show'))
             ELSE 1 END * 100 as pass_rate
    `).get();
    Object.assign(stats, examStats);
  }

  return stats;
}

function getPriorityItems(userId, userRole) {
  const dbi = getDB();
  const items = [];

  const pendingApprovals = dbi.prepare(`
    SELECT eb.id, 'exam_approval' as type, eb.subject, eb.apply_time, s.name as student_name,
           'urgent' as priority, eb.status
    FROM exam_bookings eb
    JOIN students s ON eb.student_id = s.id
    WHERE eb.status = 'pending'
    ORDER BY eb.apply_time DESC
    LIMIT 5
  `).all();
  items.push(...pendingApprovals.map(item => ({
    ...item,
    priorityWeight: PRIORITY_WEIGHTS.pending_approval,
    title: `${item.student_name} - 科目${item.subject} 待审核`,
    description: `申请时间: ${item.apply_time}`,
  })));

  const pendingPaymentMakeup = dbi.prepare(`
    SELECT m.id, 'makeup_payment' as type, m.subject, m.makeup_fee, m.created_at, s.name as student_name,
           'high' as priority
    FROM makeup_exams m
    JOIN students s ON m.student_id = s.id
    WHERE m.status = 'pending_payment'
    ORDER BY m.created_at DESC
    LIMIT 5
  `).all();
  items.push(...pendingPaymentMakeup.map(item => ({
    ...item,
    priorityWeight: PRIORITY_WEIGHTS.makeup_pending_payment,
    title: `${item.student_name} - 补考待缴费`,
    description: `科目${item.subject} 补考费 ¥${item.makeup_fee}`,
  })));

  const pendingBookingMakeup = dbi.prepare(`
    SELECT m.id, 'makeup_booking' as type, m.subject, m.created_at, s.name as student_name,
           'high' as priority
    FROM makeup_exams m
    JOIN students s ON m.student_id = s.id
    WHERE m.status = 'pending_booking'
    ORDER BY m.created_at DESC
    LIMIT 5
  `).all();
  items.push(...pendingBookingMakeup.map(item => ({
    ...item,
    priorityWeight: PRIORITY_WEIGHTS.makeup_pending_booking,
    title: `${item.student_name} - 补考待约考`,
    description: `科目${item.subject}`,
  })));

  const tomorrowExams = dbi.prepare(`
    SELECT eb.id, 'tomorrow_exam' as type, eb.subject, es.exam_date, es.exam_time, es.exam_location,
           s.name as student_name, 'normal' as priority
    FROM exam_bookings eb
    JOIN exam_sessions es ON eb.exam_session_id = es.id
    JOIN students s ON eb.student_id = s.id
    WHERE eb.status = 'booked' AND es.exam_date = date('now', '+1 day')
    ORDER BY es.exam_time
    LIMIT 5
  `).all();
  items.push(...tomorrowExams.map(item => ({
    ...item,
    priorityWeight: PRIORITY_WEIGHTS.exam_tomorrow,
    title: `${item.student_name} - 明日考试`,
    description: `科目${item.subject} ${item.exam_time} ${item.exam_location}`,
  })));

  return items
    .sort((a, b) => b.priorityWeight - a.priorityWeight)
    .slice(0, 10);
}

function getStuckItems(userRole) {
  const dbi = getDB();
  const stuck = [];

  const unpaidFeesStuck = dbi.prepare(`
    SELECT fr.id, 'fee_overdue' as type, fr.amount, fr.created_at, s.name as student_name, fr.status
    FROM fee_records fr
    JOIN students s ON fr.student_id = s.id
    WHERE fr.status IN ('unpaid', 'partial')
    AND fr.created_at < date('now', '-7 days')
    ORDER BY fr.created_at
    LIMIT 5
  `).all();
  stuck.push(...unpaidFeesStuck.map(item => ({
    ...item,
    title: `${item.student_name} - 费用逾期`,
    description: `¥${item.amount} 已超过7天未缴清`,
    stuckDays: Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  })));

  const pendingApprovalStuck = dbi.prepare(`
    SELECT eb.id, 'approval_stuck' as type, eb.subject, eb.apply_time, s.name as student_name
    FROM exam_bookings eb
    JOIN students s ON eb.student_id = s.id
    WHERE eb.status = 'pending'
    AND eb.apply_time < datetime('now', '-24 hours')
    ORDER BY eb.apply_time
    LIMIT 5
  `).all();
  stuck.push(...pendingApprovalStuck.map(item => ({
    ...item,
    title: `${item.student_name} - 审核超时`,
    description: `科目${item.subject} 预约申请已超过24小时未处理`,
    stuckHours: Math.floor((Date.now() - new Date(item.apply_time).getTime()) / (1000 * 60 * 60)),
  })));

  const noScheduleStudents = dbi.prepare(`
    SELECT s.id, 'no_schedule' as type, s.name, s.current_subject, s.created_at,
           (SELECT MAX(cs.schedule_date) FROM coach_schedules cs WHERE cs.student_id = s.id) as last_schedule_date
    FROM students s
    WHERE s.status = 'studying'
    AND (SELECT COUNT(*) FROM coach_schedules cs WHERE cs.student_id = s.id AND cs.status = 'booked') = 0
    AND (SELECT MAX(cs.schedule_date) FROM coach_schedules cs WHERE cs.student_id = s.id) IS NULL
    OR (SELECT MAX(cs.schedule_date) FROM coach_schedules cs WHERE cs.student_id = s.id) < date('now', '-14 days')
    ORDER BY s.created_at
    LIMIT 5
  `).all();
  stuck.push(...noScheduleStudents.map(item => ({
    ...item,
    title: `${item.name} - 长期未安排练车`,
    description: `科目${item.current_subject}，已超过14天未练车`,
    stuckDays: item.last_schedule_date
      ? Math.floor((Date.now() - new Date(item.last_schedule_date).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  })));

  return stuck;
}

function getRecentChanges(limit = 15) {
  const dbi = getDB();
  const logs = dbi.prepare(`
    SELECT ol.*,
           CASE ol.target_type
             WHEN 'student' THEN (SELECT name FROM students WHERE id = ol.target_id)
             WHEN 'exam_booking' THEN (SELECT s.name || ' - 科目' || eb.subject FROM exam_bookings eb JOIN students s ON eb.student_id = s.id WHERE eb.id = ol.target_id)
             WHEN 'makeup_exam' THEN (SELECT s.name || ' - 科目' || m.subject FROM makeup_exams m JOIN students s ON m.student_id = s.id WHERE m.id = ol.target_id)
             WHEN 'coach_schedule' THEN (SELECT cs.schedule_date || ' ' || cs.start_time FROM coach_schedules cs WHERE cs.id = ol.target_id)
             WHEN 'exam_session' THEN (SELECT '科目' || es.subject || ' ' || es.exam_date FROM exam_sessions es WHERE es.id = ol.target_id)
             ELSE ol.target_id
           END as target_display
    FROM operation_logs ol
    ORDER BY ol.created_at DESC
    LIMIT ?
  `).all(limit);

  return logs.map(log => ({
    ...log,
    time_ago: getTimeAgo(log.created_at),
  }));
}

function getTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return dateStr.split(' ')[0];
}

module.exports = {
  getDashboardData,
  getPriorityItems,
  getStuckItems,
  getRecentChanges,
};
