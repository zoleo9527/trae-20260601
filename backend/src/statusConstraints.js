const EXAM_BOOKING_STATUS_TRANSITIONS = {
  pending: {
    allowedTo: ['approved', 'rejected', 'cancelled'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '待审核',
  },
  approved: {
    allowedTo: ['booked', 'cancelled'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '审核通过',
  },
  rejected: {
    allowedTo: [],
    allowedRoles: [],
    description: '审核拒绝',
    isFinal: true,
  },
  booked: {
    allowedTo: ['cancelled', 'attended', 'no_show'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '已约考',
  },
  cancelled: {
    allowedTo: [],
    allowedRoles: [],
    description: '已取消',
    isFinal: true,
  },
  attended: {
    allowedTo: ['passed', 'failed'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '已参加',
  },
  passed: {
    allowedTo: [],
    allowedRoles: [],
    description: '已通过',
    isFinal: true,
  },
  failed: {
    allowedTo: [],
    allowedRoles: [],
    description: '未通过',
    isFinal: true,
  },
  no_show: {
    allowedTo: [],
    allowedRoles: [],
    description: '缺考',
    isFinal: true,
  },
};

const MAKEUP_STATUS_TRANSITIONS = {
  pending_payment: {
    allowedTo: ['pending_booking', 'cancelled'],
    allowedRoles: ['admission_consultant', 'admin'],
    description: '待缴费',
  },
  pending_booking: {
    allowedTo: ['booked', 'cancelled'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '待约考',
  },
  booked: {
    allowedTo: ['completed', 'cancelled'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '已约考',
  },
  completed: {
    allowedTo: [],
    allowedRoles: [],
    description: '已完成',
    isFinal: true,
  },
  cancelled: {
    allowedTo: [],
    allowedRoles: [],
    description: '已取消',
    isFinal: true,
  },
};

const SCHEDULE_STATUS_TRANSITIONS = {
  available: {
    allowedTo: ['booked', 'cancelled'],
    allowedRoles: ['coach', 'admission_consultant', 'admin'],
    description: '可预约',
  },
  booked: {
    allowedTo: ['completed', 'cancelled'],
    allowedRoles: ['coach', 'admin'],
    description: '已预约',
  },
  completed: {
    allowedTo: [],
    allowedRoles: [],
    description: '已完成',
    isFinal: true,
  },
  cancelled: {
    allowedTo: [],
    allowedRoles: [],
    description: '已取消',
    isFinal: true,
  },
};

const STUDENT_STATUS_TRANSITIONS = {
  studying: {
    allowedTo: ['suspended', 'completed', 'dropped'],
    allowedRoles: ['admission_consultant', 'admin'],
    description: '学习中',
  },
  suspended: {
    allowedTo: ['studying', 'dropped'],
    allowedRoles: ['admission_consultant', 'admin'],
    description: '已休学',
  },
  completed: {
    allowedTo: [],
    allowedRoles: [],
    description: '已结业',
    isFinal: true,
  },
  dropped: {
    allowedTo: [],
    allowedRoles: [],
    description: '已退学',
    isFinal: true,
  },
};

const EXAM_SESSION_STATUS_TRANSITIONS = {
  open: {
    allowedTo: ['full', 'closed', 'cancelled'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '报名中',
  },
  full: {
    allowedTo: ['closed', 'cancelled'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '名额已满',
  },
  closed: {
    allowedTo: ['completed', 'cancelled'],
    allowedRoles: ['exam_specialist', 'admin'],
    description: '已截止',
  },
  completed: {
    allowedTo: [],
    allowedRoles: [],
    description: '已完成',
    isFinal: true,
  },
  cancelled: {
    allowedTo: [],
    allowedRoles: [],
    description: '已取消',
    isFinal: true,
  },
};

const FEE_STATUS_TRANSITIONS = {
  unpaid: {
    allowedTo: ['partial', 'paid'],
    allowedRoles: ['admission_consultant', 'admin'],
    description: '未缴费',
  },
  partial: {
    allowedTo: ['paid'],
    allowedRoles: ['admission_consultant', 'admin'],
    description: '部分缴费',
  },
  paid: {
    allowedTo: [],
    allowedRoles: [],
    description: '已缴清',
    isFinal: true,
  },
};

function canTransition(transitionMap, fromStatus, toStatus, userRole) {
  const fromConfig = transitionMap[fromStatus];
  if (!fromConfig) return false;
  if (!fromConfig.allowedTo.includes(toStatus)) return false;
  if (fromConfig.allowedRoles.length > 0 && !fromConfig.allowedRoles.includes(userRole)) return false;
  return true;
}

function getStatusDescription(transitionMap, status) {
  return transitionMap[status]?.description || status;
}

function isFinalStatus(transitionMap, status) {
  return transitionMap[status]?.isFinal || false;
}

const ROLE_PERMISSIONS = {
  admission_consultant: {
    modules: ['students', 'fees', 'makeup_exams'],
    actions: {
      students: ['create', 'read', 'update'],
      fees: ['create', 'read', 'update'],
      makeup_exams: ['read', 'update_fee'],
      exam_bookings: ['read'],
      coach_schedules: ['read', 'book'],
    },
  },
  coach: {
    modules: ['coach_schedules', 'students'],
    actions: {
      coach_schedules: ['read', 'create', 'update', 'complete'],
      students: ['read'],
      exam_bookings: ['read'],
    },
  },
  exam_specialist: {
    modules: ['exam_sessions', 'exam_bookings', 'makeup_exams'],
    actions: {
      exam_sessions: ['create', 'read', 'update'],
      exam_bookings: ['create', 'read', 'update', 'approve', 'record_result'],
      makeup_exams: ['read', 'book'],
      students: ['read'],
    },
  },
  admin: {
    modules: ['users', 'students', 'coaches', 'coach_schedules', 'exam_sessions', 'exam_bookings', 'makeup_exams', 'fees', 'logs'],
    actions: {
      users: ['create', 'read', 'update', 'delete'],
      students: ['create', 'read', 'update', 'delete'],
      coaches: ['create', 'read', 'update', 'delete'],
      coach_schedules: ['create', 'read', 'update', 'delete'],
      exam_sessions: ['create', 'read', 'update', 'delete'],
      exam_bookings: ['create', 'read', 'update', 'delete', 'approve', 'record_result'],
      makeup_exams: ['create', 'read', 'update', 'delete'],
      fees: ['create', 'read', 'update', 'delete'],
      logs: ['read'],
    },
  },
};

function hasPermission(userRole, module, action) {
  const rolePerm = ROLE_PERMISSIONS[userRole];
  if (!rolePerm) return false;
  if (!rolePerm.modules.includes(module)) return false;
  if (!rolePerm.actions[module]) return false;
  return rolePerm.actions[module].includes(action);
}

const SUBJECT_NAMES = {
  1: '科目一（理论考试）',
  2: '科目二（场地驾驶）',
  3: '科目三（道路驾驶）',
  4: '科目四（安全文明）',
};

const PRIORITY_WEIGHTS = {
  pending_approval: 100,
  makeup_pending_payment: 90,
  makeup_pending_booking: 80,
  exam_tomorrow: 70,
  schedule_conflict: 60,
  fee_overdue: 50,
};

module.exports = {
  EXAM_BOOKING_STATUS_TRANSITIONS,
  MAKEUP_STATUS_TRANSITIONS,
  SCHEDULE_STATUS_TRANSITIONS,
  STUDENT_STATUS_TRANSITIONS,
  EXAM_SESSION_STATUS_TRANSITIONS,
  FEE_STATUS_TRANSITIONS,
  canTransition,
  getStatusDescription,
  isFinalStatus,
  ROLE_PERMISSIONS,
  hasPermission,
  SUBJECT_NAMES,
  PRIORITY_WEIGHTS,
};
