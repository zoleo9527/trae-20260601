import dayjs from 'dayjs'

export const ROLES = {
  ADVISOR: 'advisor',
  COACH: 'coach',
  EXAMINER: 'examiner'
}

export const ROLE_LABELS = {
  [ROLES.ADVISOR]: '招生顾问',
  [ROLES.COACH]: '教练',
  [ROLES.EXAMINER]: '考试专员'
}

export const APPOINTMENT_STATUS = {
  PENDING_REVIEW: 'pending_review',
  INFO_INCOMPLETE: 'info_incomplete',
  REVIEWED: 'reviewed',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.PENDING_REVIEW]: '待审核预约',
  [APPOINTMENT_STATUS.INFO_INCOMPLETE]: '资料待补',
  [APPOINTMENT_STATUS.REVIEWED]: '已审核待排班',
  [APPOINTMENT_STATUS.SCHEDULED]: '已排班待练车',
  [APPOINTMENT_STATUS.IN_PROGRESS]: '练车中',
  [APPOINTMENT_STATUS.COMPLETED]: '已完成',
  [APPOINTMENT_STATUS.CANCELLED]: '已取消'
}

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUS.PENDING_REVIEW]: 'yellow',
  [APPOINTMENT_STATUS.INFO_INCOMPLETE]: 'red',
  [APPOINTMENT_STATUS.REVIEWED]: 'blue',
  [APPOINTMENT_STATUS.SCHEDULED]: 'cyan',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'green',
  [APPOINTMENT_STATUS.COMPLETED]: 'gray',
  [APPOINTMENT_STATUS.CANCELLED]: 'gray'
}

export const SCHEDULE_STATUS = {
  UNASSIGNED: 'unassigned',
  ASSIGNED: 'assigned',
  COACH_CONFIRMED: 'coach_confirmed',
  STUDENT_CONFIRMED: 'student_confirmed',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
}

export const SCHEDULE_STATUS_LABELS = {
  [SCHEDULE_STATUS.UNASSIGNED]: '待分配教练',
  [SCHEDULE_STATUS.ASSIGNED]: '已分配待教练确认',
  [SCHEDULE_STATUS.COACH_CONFIRMED]: '教练已确认待学员确认',
  [SCHEDULE_STATUS.STUDENT_CONFIRMED]: '学员已确认',
  [SCHEDULE_STATUS.COMPLETED]: '已完成',
  [SCHEDULE_STATUS.REJECTED]: '已退回'
}

export const SCHEDULE_STATUS_COLORS = {
  [SCHEDULE_STATUS.UNASSIGNED]: 'yellow',
  [SCHEDULE_STATUS.ASSIGNED]: 'blue',
  [SCHEDULE_STATUS.COACH_CONFIRMED]: 'cyan',
  [SCHEDULE_STATUS.STUDENT_CONFIRMED]: 'green',
  [SCHEDULE_STATUS.COMPLETED]: 'gray',
  [SCHEDULE_STATUS.REJECTED]: 'red'
}

export const CAR_TYPES = ['C1手动挡', 'C2自动挡', 'C5残疾人专用']
export const TIME_SLOTS = ['早班 07:00-09:00', '上午 09:00-11:00', '下午 14:00-16:00', '晚班 17:00-19:00']
export const SUBJECTS = ['科目二', '科目三']

export const COACHES = [
  { id: 'C001', name: '张建国', phone: '138****5821', carType: 'C1手动挡', capacity: 6, subjects: ['科目二', '科目三'] },
  { id: 'C002', name: '李明华', phone: '139****3176', carType: 'C2自动挡', capacity: 5, subjects: ['科目二', '科目三'] },
  { id: 'C003', name: '王德宝', phone: '136****9845', carType: 'C1手动挡', capacity: 6, subjects: ['科目二'] },
  { id: 'C004', name: '赵慧芳', phone: '137****2058', carType: 'C2自动挡', capacity: 4, subjects: ['科目三'] },
  { id: 'C005', name: '刘志强', phone: '135****6712', carType: 'C1手动挡', capacity: 7, subjects: ['科目二', '科目三'] }
]

export const STAFF = {
  advisors: [
    { id: 'A001', name: '陈媛媛' },
    { id: 'A002', name: '周晓琪' }
  ],
  examiners: [
    { id: 'E001', name: '孙伟峰' }
  ]
}

function pad(n) { return n < 10 ? '0' + n : '' + n }
function genId(p) { return p + '-' + Math.random().toString(36).slice(2, 8).toUpperCase() }

export const STUDENTS = [
  {
    id: 'S20260101', name: '王小明', phone: '188****1001', carType: 'C1手动挡',
    subject: '科目二', advisorId: 'A001', joinDate: '2026-05-10',
    idCardReady: true, paymentDone: true, medicalDone: false, photoDone: true
  },
  {
    id: 'S20260102', name: '李雨薇', phone: '189****1002', carType: 'C2自动挡',
    subject: '科目二', advisorId: 'A002', joinDate: '2026-05-12',
    idCardReady: true, paymentDone: true, medicalDone: true, photoDone: true
  },
  {
    id: 'S20260103', name: '张大勇', phone: '187****1003', carType: 'C1手动挡',
    subject: '科目三', advisorId: 'A001', joinDate: '2026-04-20',
    idCardReady: true, paymentDone: true, medicalDone: true, photoDone: true
  },
  {
    id: 'S20260104', name: '赵子涵', phone: '186****1004', carType: 'C2自动挡',
    subject: '科目二', advisorId: 'A002', joinDate: '2026-05-20',
    idCardReady: true, paymentDone: false, medicalDone: true, photoDone: true
  },
  {
    id: 'S20260105', name: '陈俊杰', phone: '185****1005', carType: 'C1手动挡',
    subject: '科目三', advisorId: 'A001', joinDate: '2026-03-15',
    idCardReady: true, paymentDone: true, medicalDone: true, photoDone: true
  },
  {
    id: 'S20260106', name: '黄思琪', phone: '184****1006', carType: 'C2自动挡',
    subject: '科目二', advisorId: 'A001', joinDate: '2026-05-25',
    idCardReady: false, paymentDone: true, medicalDone: true, photoDone: true
  },
  {
    id: 'S20260107', name: '刘伟东', phone: '183****1007', carType: 'C1手动挡',
    subject: '科目三', advisorId: 'A002', joinDate: '2026-04-01',
    idCardReady: true, paymentDone: true, medicalDone: true, photoDone: true
  },
  {
    id: 'S20260108', name: '孙雅婷', phone: '182****1008', carType: 'C2自动挡',
    subject: '科目二', advisorId: 'A001', joinDate: '2026-05-28',
    idCardReady: true, paymentDone: true, medicalDone: true, photoDone: false
  }
]

const today = dayjs()

export const INITIAL_APPOINTMENTS = [
  {
    id: 'AP-3F2A1D', studentId: 'S20260101', subject: '科目二',
    preferredDates: [today.add(3, 'day').format('YYYY-MM-DD'), today.add(5, 'day').format('YYYY-MM-DD')],
    preferredSlots: ['上午 09:00-11:00', '下午 14:00-16:00'],
    status: APPOINTMENT_STATUS.PENDING_REVIEW,
    createdAt: today.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
    createdBy: 'S20260101',
    reviewNote: '',
    advisorNote: '',
    exception: null,
    handler: null
  },
  {
    id: 'AP-8K7M3P', studentId: 'S20260106', subject: '科目二',
    preferredDates: [today.add(2, 'day').format('YYYY-MM-DD')],
    preferredSlots: ['晚班 17:00-19:00'],
    status: APPOINTMENT_STATUS.INFO_INCOMPLETE,
    createdAt: today.subtract(1, 'day').add(3, 'hour').format('YYYY-MM-DD HH:mm'),
    createdBy: 'A001',
    reviewNote: '学员身份证未上传，无法进入审核。',
    advisorNote: '已电话通知，明天上午补齐。',
    exception: { type: 'missing_idcard', severity: 'warning', message: '缺少身份证复印件' },
    handler: 'A001'
  },
  {
    id: 'AP-2Q5R9L', studentId: 'S20260102', subject: '科目二',
    preferredDates: [today.add(1, 'day').format('YYYY-MM-DD')],
    preferredSlots: ['下午 14:00-16:00'],
    status: APPOINTMENT_STATUS.REVIEWED,
    createdAt: today.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    createdBy: 'A002',
    reviewNote: '资料齐全，优先安排女教练。',
    advisorNote: '学员要求教练脾气好、有耐心，推荐赵慧芳教练。',
    exception: null,
    handler: 'A002'
  },
  {
    id: 'AP-6T4V8B', studentId: 'S20260104', subject: '科目二',
    preferredDates: [today.add(4, 'day').format('YYYY-MM-DD')],
    preferredSlots: ['早班 07:00-09:00'],
    status: APPOINTMENT_STATUS.REVIEWED,
    createdAt: today.subtract(6, 'hour').format('YYYY-MM-DD HH:mm'),
    createdBy: 'A002',
    reviewNote: '体检通过。',
    advisorNote: '缴费还差 500 元，学员表示练车前会补齐。如未补齐请暂停排班。',
    exception: { type: 'unpaid_fee', severity: 'danger', message: '尚有 500 元学费未结清' },
    handler: 'A002'
  },
  {
    id: 'AP-1H9N4J', studentId: 'S20260108', subject: '科目二',
    preferredDates: [today.add(6, 'day').format('YYYY-MM-DD')],
    preferredSlots: ['上午 09:00-11:00'],
    status: APPOINTMENT_STATUS.PENDING_REVIEW,
    createdAt: today.subtract(30, 'minute').format('YYYY-MM-DD HH:mm'),
    createdBy: 'S20260108',
    reviewNote: '',
    advisorNote: '',
    exception: null,
    handler: null
  }
]

export const INITIAL_SCHEDULES = [
  {
    id: 'SC-A1B2C3', appointmentId: 'AP-2Q5R9L', studentId: 'S20260102', subject: '科目二',
    coachId: 'C004', date: today.add(1, 'day').format('YYYY-MM-DD'),
    slot: '下午 14:00-16:00',
    status: SCHEDULE_STATUS.ASSIGNED,
    assignedAt: today.subtract(4, 'hour').format('YYYY-MM-DD HH:mm'),
    assignedBy: 'A002',
    passedAppointmentNote: '学员要求教练脾气好、有耐心，推荐赵慧芳教练。',
    coachNote: '',
    rejectReason: '',
    completedAt: null
  },
  {
    id: 'SC-D4E5F6', appointmentId: 'SC-LEGACY-01', studentId: 'S20260103', subject: '科目三',
    coachId: 'C005', date: today.format('YYYY-MM-DD'),
    slot: '上午 09:00-11:00',
    status: SCHEDULE_STATUS.STUDENT_CONFIRMED,
    assignedAt: today.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    assignedBy: 'A001',
    passedAppointmentNote: '学员有驾驶基础，希望直接练路考线路。',
    coachNote: '线路已熟悉，明天可进行模拟考。',
    rejectReason: '',
    completedAt: null
  },
  {
    id: 'SC-G7H8I9', appointmentId: 'SC-LEGACY-02', studentId: 'S20260105', subject: '科目三',
    coachId: 'C001', date: today.subtract(1, 'day').format('YYYY-MM-DD'),
    slot: '下午 14:00-16:00',
    status: SCHEDULE_STATUS.COMPLETED,
    assignedAt: today.subtract(4, 'day').format('YYYY-MM-DD HH:mm'),
    assignedBy: 'A001',
    passedAppointmentNote: '按常规安排即可。',
    coachNote: '操作平稳，建议 3 天后约考。',
    rejectReason: '',
    completedAt: today.subtract(1, 'day').add(2, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'SC-J1K2L3', appointmentId: 'SC-LEGACY-03', studentId: 'S20260107', subject: '科目三',
    coachId: 'C003', date: today.add(3, 'day').format('YYYY-MM-DD'),
    slot: '晚班 17:00-19:00',
    status: SCHEDULE_STATUS.REJECTED,
    assignedAt: today.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    assignedBy: 'A002',
    passedAppointmentNote: '学员工作忙，只能安排周末或晚班。',
    coachNote: '',
    rejectReason: '当天我有私事请假，无法排班，请改派其他教练或调整日期。',
    completedAt: null
  },
  {
    id: 'SC-M4N5O6', appointmentId: 'SC-LEGACY-04', studentId: 'S20260105', subject: '科目三',
    coachId: null, date: null, slot: null,
    status: SCHEDULE_STATUS.UNASSIGNED,
    assignedAt: today.subtract(8, 'hour').format('YYYY-MM-DD HH:mm'),
    assignedBy: null,
    passedAppointmentNote: '之前的教练反馈：灯光模拟通过，但变道观察还需加强。',
    coachNote: '',
    rejectReason: '',
    completedAt: null
  }
]

export { pad, genId }
