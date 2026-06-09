const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// 1. 错误码系统
// ============================================================
const ErrorCode = {
  VACCINE_APPOINTMENT_NOT_FOUND: { code: 40401, message: '疫苗预约记录不存在' },
  OBSERVATION_NOT_FOUND: { code: 40402, message: '留观记录不存在' },
  EXPORT_TASK_NOT_FOUND: { code: 40403, message: '导出任务不存在' },
  CONTRACT_NOT_FOUND: { code: 40404, message: '签约记录不存在' },
  FOLLOWUP_NOT_FOUND: { code: 40405, message: '随访记录不存在' },
  OBSERVATION_ALREADY_STARTED: { code: 40901, message: '留观已开始，不能重复操作' },
  APPOINTMENT_STATUS_CONFLICT: { code: 40902, message: '预约状态冲突，无法执行此操作' },
  OBSERVATION_NOT_COMPLETED: { code: 42201, message: '留观未完成，无法执行此操作' },
  UNAUTHORIZED_ROLE: { code: 40301, message: '无权限执行此操作' },
  INVALID_PARAMS: { code: 40001, message: '参数错误' },
  HANDOVER_SAME_PERSON: { code: 40903, message: '交接人不能与当前负责人相同' },
  OBSERVATION_ALREADY_COMPLETED: { code: 40904, message: '留观已完成，不能修改' },
  OBSERVATION_ALREADY_ABANDONED: { code: 40905, message: '留观已标记异常，不能修改' },
  INVALID_STATUS_TRANSITION: { code: 42202, message: '无效的状态转换' },
};

function makeError(errorCode, detail) {
  return {
    error: {
      code: errorCode.code,
      message: detail ? `${errorCode.message}: ${detail}` : errorCode.message,
    },
  };
}

// ============================================================
// 2. 角色与权限
// ============================================================
const ROLES = {
  GP: '全科医生',
  NURSE: '护士',
  PH_SPECIALIST: '公共卫生专员',
};

const ROLE_PERMISSIONS = {
  [ROLES.GP]: {
    viewContracts: true,
    viewFollowups: true,
    viewAppointments: true,
    confirmAppointments: true,
    viewObservations: false,
    manageObservations: false,
    exportData: false,
    manageAppointments: false,
  },
  [ROLES.NURSE]: {
    viewContracts: false,
    viewFollowups: false,
    viewAppointments: true,
    confirmAppointments: false,
    viewObservations: true,
    manageObservations: true,
    exportData: false,
    manageAppointments: false,
  },
  [ROLES.PH_SPECIALIST]: {
    viewContracts: true,
    viewFollowups: true,
    viewAppointments: true,
    confirmAppointments: true,
    viewObservations: true,
    manageObservations: true,
    exportData: true,
    manageAppointments: true,
  },
};

function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.headers['x-role'] || req.query.role;
    if (!userRole) {
      return res.status(401).json(makeError(ErrorCode.UNAUTHORIZED_ROLE, '未提供角色信息'));
    }
    if (!roles.includes(userRole)) {
      return res.status(403).json(makeError(ErrorCode.UNAUTHORIZED_ROLE, `需要角色: ${roles.join(' 或 ')}`));
    }
    req.userRole = userRole;
    next();
  };
}

function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role] && ROLE_PERMISSIONS[role][permission];
}

// ============================================================
// 3. 预约状态机
// ============================================================
const APPOINTMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  INOCULATING: 'inoculating',
  INOCULATED: 'inoculated',
  OBSERVING: 'observing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const APPOINTMENT_TRANSITIONS = {
  [APPOINTMENT_STATUSES.PENDING]: [APPOINTMENT_STATUSES.CONFIRMED, APPOINTMENT_STATUSES.CANCELLED],
  [APPOINTMENT_STATUSES.CONFIRMED]: [APPOINTMENT_STATUSES.INOCULATING, APPOINTMENT_STATUSES.CANCELLED],
  [APPOINTMENT_STATUSES.INOCULATING]: [APPOINTMENT_STATUSES.INOCULATED, APPOINTMENT_STATUSES.CANCELLED],
  [APPOINTMENT_STATUSES.INOCULATED]: [APPOINTMENT_STATUSES.OBSERVING],
  [APPOINTMENT_STATUSES.OBSERVING]: [APPOINTMENT_STATUSES.COMPLETED],
};

const OBSERVATION_STATUSES = {
  WAITING: 'waiting',
  OBSERVING: 'observing',
  COMPLETED: 'completed',
  ABNORMAL: 'abnormal',
};

// ============================================================
// 4. 内存数据存储
// ============================================================
const now = new Date();
const ts = (offsetMin) => new Date(now.getTime() - offsetMin * 60000).toISOString();

const store = {
  contracts: [
    {
      id: 'CT-001',
      residentName: '张伟',
      residentIdCard: '310101199001011234',
      doctorName: '李明华',
      contractDate: '2025-03-15',
      contractType: '家庭医生签约',
      status: 'active',
      packageName: '基础包',
    },
    {
      id: 'CT-002',
      residentName: '王芳',
      residentIdCard: '310101198505062345',
      doctorName: '李明华',
      contractDate: '2025-01-20',
      contractType: '家庭医生签约',
      status: 'active',
      packageName: '高级包',
    },
    {
      id: 'CT-003',
      residentName: '刘建国',
      residentIdCard: '310101197803033456',
      doctorName: '赵红梅',
      contractDate: '2024-11-10',
      contractType: '家庭医生签约',
      status: 'expired',
      packageName: '基础包',
    },
    {
      id: 'CT-004',
      residentName: '陈静',
      residentIdCard: '310101199207074567',
      doctorName: '赵红梅',
      contractDate: '2025-05-01',
      contractType: '家庭医生签约',
      status: 'active',
      packageName: '老年包',
    },
    {
      id: 'CT-005',
      residentName: '孙丽华',
      residentIdCard: '310101196512125678',
      doctorName: '李明华',
      contractDate: '2025-02-14',
      contractType: '家庭医生续约',
      status: 'active',
      packageName: '老年包',
    },
  ],

  followups: [
    {
      id: 'FU-001',
      contractId: 'CT-001',
      residentName: '张伟',
      doctorName: '李明华',
      followupDate: '2025-04-10',
      followupType: '高血压随访',
      content: '血压控制良好，继续用药，建议低盐饮食。',
      nextFollowupDate: '2025-07-10',
      status: 'completed',
    },
    {
      id: 'FU-002',
      contractId: 'CT-002',
      residentName: '王芳',
      doctorName: '李明华',
      followupDate: '2025-05-15',
      followupType: '糖尿病随访',
      content: '血糖偏高，调整用药方案，2周后复查。',
      nextFollowupDate: '2025-05-29',
      status: 'pending',
    },
    {
      id: 'FU-003',
      contractId: 'CT-004',
      residentName: '陈静',
      doctorName: '赵红梅',
      followupDate: '2025-06-01',
      followupType: '孕产妇随访',
      content: '孕期检查正常，胎儿发育良好。',
      nextFollowupDate: '2025-07-01',
      status: 'completed',
    },
    {
      id: 'FU-004',
      contractId: 'CT-005',
      residentName: '孙丽华',
      doctorName: '李明华',
      followupDate: '2025-06-05',
      followupType: '老年人随访',
      content: '心肺功能正常，建议适度运动。',
      nextFollowupDate: '2025-09-05',
      status: 'completed',
    },
  ],

  appointments: [
    {
      id: 'APT-001',
      residentName: '张伟',
      residentIdCard: '310101199001011234',
      residentPhone: '13800138001',
      vaccineName: '新冠疫苗（灭活）',
      vaccineBatch: '202503A001',
      appointmentDate: '2025-06-10',
      appointmentTime: '09:00',
      status: APPOINTMENT_STATUSES.COMPLETED,
      doctorName: '李明华',
      nurseName: '周小燕',
      createdAt: ts(1440 * 3),
      updatedAt: ts(60),
      confirmedAt: ts(1440),
      inoculatedAt: ts(65),
      observationCompletedAt: ts(5),
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-002',
      residentName: '王芳',
      residentIdCard: '310101198505062345',
      residentPhone: '13800138002',
      vaccineName: '流感疫苗（四价）',
      vaccineBatch: '202504B012',
      appointmentDate: '2025-06-10',
      appointmentTime: '09:30',
      status: APPOINTMENT_STATUSES.COMPLETED,
      doctorName: '李明华',
      nurseName: '周小燕',
      createdAt: ts(1440 * 2),
      updatedAt: ts(70),
      confirmedAt: ts(1440 * 2 - 60),
      inoculatedAt: ts(75),
      observationCompletedAt: ts(10),
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-003',
      residentName: '刘建国',
      residentIdCard: '310101197803033456',
      residentPhone: '13800138003',
      vaccineName: '乙肝疫苗（重组）',
      vaccineBatch: '202505C003',
      appointmentDate: '2025-06-10',
      appointmentTime: '10:00',
      status: APPOINTMENT_STATUSES.OBSERVING,
      doctorName: '赵红梅',
      nurseName: '周小燕',
      createdAt: ts(1440),
      updatedAt: ts(40),
      confirmedAt: ts(1440 - 60),
      inoculatedAt: ts(45),
      observationCompletedAt: null,
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-004',
      residentName: '陈静',
      residentIdCard: '310101199207074567',
      residentPhone: '13800138004',
      vaccineName: 'HPV疫苗（九价）',
      vaccineBatch: '202506D008',
      appointmentDate: '2025-06-10',
      appointmentTime: '10:30',
      status: APPOINTMENT_STATUSES.INOCULATED,
      doctorName: '赵红梅',
      nurseName: '吴丽萍',
      createdAt: ts(720),
      updatedAt: ts(35),
      confirmedAt: ts(700),
      inoculatedAt: ts(35),
      observationCompletedAt: null,
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-005',
      residentName: '孙丽华',
      residentIdCard: '310101196512125678',
      residentPhone: '13800138005',
      vaccineName: '带状疱疹疫苗',
      vaccineBatch: '202506E002',
      appointmentDate: '2025-06-10',
      appointmentTime: '11:00',
      status: APPOINTMENT_STATUSES.INOCULATING,
      doctorName: '李明华',
      nurseName: '吴丽萍',
      createdAt: ts(500),
      updatedAt: ts(10),
      confirmedAt: ts(490),
      inoculatedAt: null,
      observationCompletedAt: null,
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-006',
      residentName: '赵丽',
      residentIdCard: '310101200008086789',
      residentPhone: '13800138006',
      vaccineName: '新冠疫苗（腺病毒载体）',
      vaccineBatch: '202505F005',
      appointmentDate: '2025-06-11',
      appointmentTime: '09:00',
      status: APPOINTMENT_STATUSES.CONFIRMED,
      doctorName: '李明华',
      nurseName: null,
      createdAt: ts(300),
      updatedAt: ts(240),
      confirmedAt: ts(240),
      inoculatedAt: null,
      observationCompletedAt: null,
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-007',
      residentName: '黄明远',
      residentIdCard: '310101195506067890',
      residentPhone: '13800138007',
      vaccineName: '流感疫苗（三价）',
      vaccineBatch: '202504G010',
      appointmentDate: '2025-06-11',
      appointmentTime: '09:30',
      status: APPOINTMENT_STATUSES.PENDING,
      doctorName: null,
      nurseName: null,
      createdAt: ts(200),
      updatedAt: ts(200),
      confirmedAt: null,
      inoculatedAt: null,
      observationCompletedAt: null,
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-008',
      residentName: '吴小凡',
      residentIdCard: '310101199912129012',
      residentPhone: '13800138008',
      vaccineName: 'HPV疫苗（二价）',
      vaccineBatch: '202506H001',
      appointmentDate: '2025-06-09',
      appointmentTime: '14:00',
      status: APPOINTMENT_STATUSES.CANCELLED,
      doctorName: null,
      nurseName: null,
      createdAt: ts(2880),
      updatedAt: ts(1440),
      confirmedAt: null,
      inoculatedAt: null,
      observationCompletedAt: null,
      cancelledAt: ts(1440),
      cancelReason: '居民临时有事取消',
    },
    {
      id: 'APT-009',
      residentName: '钱学海',
      residentIdCard: '310101198801010123',
      residentPhone: '13800138009',
      vaccineName: '狂犬疫苗（Vero细胞）',
      vaccineBatch: '202506I003',
      appointmentDate: '2025-06-10',
      appointmentTime: '14:00',
      status: APPOINTMENT_STATUSES.COMPLETED,
      doctorName: '赵红梅',
      nurseName: '周小燕',
      createdAt: ts(1440 * 5),
      updatedAt: ts(120),
      confirmedAt: ts(1440 * 4),
      inoculatedAt: ts(130),
      observationCompletedAt: ts(100),
      cancelledAt: null,
      cancelReason: null,
    },
    {
      id: 'APT-010',
      residentName: '郑秀英',
      residentIdCard: '310101194512123434',
      residentPhone: '13800138010',
      vaccineName: '肺炎球菌疫苗（23价）',
      vaccineBatch: '202505J007',
      appointmentDate: '2025-06-10',
      appointmentTime: '15:00',
      status: APPOINTMENT_STATUSES.OBSERVING,
      doctorName: '李明华',
      nurseName: '吴丽萍',
      createdAt: ts(1440 * 2),
      updatedAt: ts(50),
      confirmedAt: ts(1440 * 2 - 60),
      inoculatedAt: ts(55),
      observationCompletedAt: null,
      cancelledAt: null,
      cancelReason: null,
    },
  ],

  observations: [
    {
      id: 'OBS-001',
      appointmentId: 'APT-001',
      residentName: '张伟',
      vaccineName: '新冠疫苗（灭活）',
      nurseName: '周小燕',
      responsiblePerson: '周小燕',
      status: OBSERVATION_STATUSES.COMPLETED,
      startedAt: ts(65),
      completedAt: ts(5),
      durationMinutes: 60,
      observations: [
        { time: ts(65), note: '接种完成，进入留观区，无异常反应' },
        { time: ts(35), note: '30分钟检查：无异常' },
        { time: ts(5), note: '留观结束，一切正常，可以离开' },
      ],
      handovers: [],
      alertTriggered: false,
    },
    {
      id: 'OBS-002',
      appointmentId: 'APT-002',
      residentName: '王芳',
      vaccineName: '流感疫苗（四价）',
      nurseName: '周小燕',
      responsiblePerson: '周小燕',
      status: OBSERVATION_STATUSES.COMPLETED,
      startedAt: ts(75),
      completedAt: ts(10),
      durationMinutes: 65,
      observations: [
        { time: ts(75), note: '接种完成，进入留观区' },
        { time: ts(45), note: '30分钟检查：局部轻微红肿，属正常反应' },
        { time: ts(10), note: '红肿消退，留观结束，可以离开' },
      ],
      handovers: [],
      alertTriggered: false,
    },
    {
      id: 'OBS-003',
      appointmentId: 'APT-009',
      residentName: '钱学海',
      vaccineName: '狂犬疫苗（Vero细胞）',
      nurseName: '周小燕',
      responsiblePerson: '吴丽萍',
      status: OBSERVATION_STATUSES.COMPLETED,
      startedAt: ts(130),
      completedAt: ts(100),
      durationMinutes: 30,
      observations: [
        { time: ts(130), note: '接种完成，进入留观区' },
        { time: ts(100), note: '留观30分钟，无异常反应，可以离开' },
      ],
      handovers: [
        { from: '周小燕', to: '吴丽萍', time: ts(120), reason: '周小燕下班交接' },
      ],
      alertTriggered: false,
    },
    {
      id: 'OBS-004',
      appointmentId: 'APT-003',
      residentName: '刘建国',
      vaccineName: '乙肝疫苗（重组）',
      nurseName: '周小燕',
      responsiblePerson: '周小燕',
      status: OBSERVATION_STATUSES.OBSERVING,
      startedAt: ts(45),
      completedAt: null,
      durationMinutes: null,
      observations: [
        { time: ts(45), note: '接种完成，进入留观区' },
        { time: ts(15), note: '30分钟检查：无异常' },
      ],
      handovers: [],
      alertTriggered: true,
      alertReason: '留观已超过30分钟仍未完成',
    },
    {
      id: 'OBS-005',
      appointmentId: 'APT-010',
      residentName: '郑秀英',
      vaccineName: '肺炎球菌疫苗（23价）',
      nurseName: '吴丽萍',
      responsiblePerson: '吴丽萍',
      status: OBSERVATION_STATUSES.OBSERVING,
      startedAt: ts(55),
      completedAt: null,
      durationMinutes: null,
      observations: [
        { time: ts(55), note: '接种完成，进入留观区' },
        { time: ts(25), note: '30分钟检查：轻微头晕' },
        { time: ts(20), note: '头晕持续，继续观察' },
      ],
      handovers: [],
      alertTriggered: true,
      alertReason: '留观已超过30分钟，居民仍有不适症状',
    },
    {
      id: 'OBS-006',
      appointmentId: 'APT-004',
      residentName: '陈静',
      vaccineName: 'HPV疫苗（九价）',
      nurseName: '吴丽萍',
      responsiblePerson: '吴丽萍',
      status: OBSERVATION_STATUSES.WAITING,
      startedAt: null,
      completedAt: null,
      durationMinutes: null,
      observations: [],
      handovers: [],
      alertTriggered: false,
    },
    {
      id: 'OBS-007',
      appointmentId: null,
      residentName: '马小凤',
      vaccineName: '流感疫苗（四价）',
      nurseName: '周小燕',
      responsiblePerson: '周小燕',
      status: OBSERVATION_STATUSES.ABNORMAL,
      startedAt: ts(1440 * 2),
      completedAt: ts(1440 * 2 - 60),
      durationMinutes: 60,
      observations: [
        { time: ts(1440 * 2), note: '接种完成，进入留观区' },
        { time: ts(1440 * 2 - 30), note: '出现皮疹、呼吸困难症状' },
        { time: ts(1440 * 2 - 20), note: '疑似过敏反应，紧急处理中' },
        { time: ts(1440 * 2 - 10), note: '已转送上级医院急诊' },
        { time: ts(1440 * 2 - 60), note: '已转院，留观标记为异常' },
      ],
      handovers: [],
      alertTriggered: true,
      alertReason: '出现严重过敏反应，已转送上级医院',
    },
  ],

  exportTasks: {},
  users: [
    { username: 'doctor_li', password: '123456', role: ROLES.GP, name: '李明华' },
    { username: 'doctor_zhao', password: '123456', role: ROLES.GP, name: '赵红梅' },
    { username: 'nurse_zhou', password: '123456', role: ROLES.NURSE, name: '周小燕' },
    { username: 'nurse_wu', password: '123456', role: ROLES.NURSE, name: '吴丽萍' },
    { username: 'ph_chen', password: '123456', role: ROLES.PH_SPECIALIST, name: '陈国强' },
  ],
};

let nextId = 100;

function generateId(prefix) {
  nextId++;
  return `${prefix}-${String(nextId).padStart(3, '0')}`;
}

// ============================================================
// 5. API 路由
// ============================================================

// --- 登录 ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json(makeError(ErrorCode.INVALID_PARAMS, '用户名和密码不能为空'));
  }
  const user = store.users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json(makeError(ErrorCode.UNAUTHORIZED_ROLE, '用户名或密码错误'));
  }
  res.json({
    token: `mock-token-${user.username}`,
    role: user.role,
    name: user.name,
    username: user.username,
  });
});

// --- 家庭医生签约 ---
app.get('/api/contracts', requireRole(ROLES.GP, ROLES.PH_SPECIALIST), (req, res) => {
  let contracts = [...store.contracts];
  const { status, residentName } = req.query;
  if (status) contracts = contracts.filter((c) => c.status === status);
  if (residentName) contracts = contracts.filter((c) => c.residentName.includes(residentName));
  res.json({ data: contracts, total: contracts.length });
});

// --- 随访记录 ---
app.get('/api/followups', requireRole(ROLES.GP, ROLES.PH_SPECIALIST), (req, res) => {
  let followups = [...store.followups];
  const { status, contractId } = req.query;
  if (status) followups = followups.filter((f) => f.status === status);
  if (contractId) followups = followups.filter((f) => f.contractId === contractId);
  res.json({ data: followups, total: followups.length });
});

// --- 疫苗预约 ---
app.get('/api/appointments', (req, res) => {
  const role = req.headers['x-role'] || req.query.role;
  if (!role) {
    return res.status(401).json(makeError(ErrorCode.UNAUTHORIZED_ROLE, '未提供角色信息'));
  }
  if (!hasPermission(role, 'viewAppointments')) {
    return res.status(403).json(makeError(ErrorCode.UNAUTHORIZED_ROLE));
  }
  let appointments = [...store.appointments];
  const { status, vaccineName, residentName, date } = req.query;
  if (status) appointments = appointments.filter((a) => a.status === status);
  if (vaccineName) appointments = appointments.filter((a) => a.vaccineName.includes(vaccineName));
  if (residentName) appointments = appointments.filter((a) => a.residentName.includes(residentName));
  if (date) appointments = appointments.filter((a) => a.appointmentDate === date);

  if (role === ROLES.GP) {
    appointments = appointments.filter(
      (a) =>
        [
          APPOINTMENT_STATUSES.PENDING,
          APPOINTMENT_STATUSES.CONFIRMED,
          APPOINTMENT_STATUSES.CANCELLED,
        ].includes(a.status) || a.doctorName
    );
  }

  appointments = appointments.map((a) => {
    const result = { ...a };
    const obs = store.observations.find((o) => o.appointmentId === a.id);
    if (obs) {
      result.observationId = obs.id;
      result.observationStatus = obs.status;
      result.observationResponsible = obs.responsiblePerson;
      result.observationHandoverCount = obs.handovers.length;
      if (obs.handovers.length) {
        const last = obs.handovers[obs.handovers.length - 1];
        result.observationLastHandover = { from: last.from, to: last.to, reason: last.reason, time: last.time };
      }
    }
    return result;
  });

  res.json({ data: appointments, total: appointments.length });
});

app.post('/api/appointments', requireRole(ROLES.PH_SPECIALIST), (req, res) => {
  const {
    residentName,
    residentIdCard,
    residentPhone,
    vaccineName,
    vaccineBatch,
    appointmentDate,
    appointmentTime,
    doctorName,
  } = req.body;
  if (!residentName || !vaccineName || !appointmentDate || !appointmentTime) {
    return res.status(400).json(makeError(ErrorCode.INVALID_PARAMS));
  }
  const appointment = {
    id: generateId('APT'),
    residentName,
    residentIdCard: residentIdCard || '',
    residentPhone: residentPhone || '',
    vaccineName,
    vaccineBatch: vaccineBatch || '',
    appointmentDate,
    appointmentTime,
    status: APPOINTMENT_STATUSES.PENDING,
    doctorName: doctorName || null,
    nurseName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmedAt: null,
    inoculatedAt: null,
    observationCompletedAt: null,
    cancelledAt: null,
    cancelReason: null,
  };
  store.appointments.push(appointment);
  res.status(201).json({ data: appointment });
});

app.put('/api/appointments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, cancelReason } = req.body;
  const role = req.headers['x-role'] || req.query.role;
  if (!role) {
    return res.status(401).json(makeError(ErrorCode.UNAUTHORIZED_ROLE, '未提供角色信息'));
  }

  const appointment = store.appointments.find((a) => a.id === id);
  if (!appointment) {
    return res.status(404).json(makeError(ErrorCode.VACCINE_APPOINTMENT_NOT_FOUND, id));
  }

  const allowedTransitions = APPOINTMENT_TRANSITIONS[appointment.status] || [];
  if (!allowedTransitions.includes(status)) {
    return res.status(409).json(
      makeError(ErrorCode.INVALID_STATUS_TRANSITION, `当前状态 "${appointment.status}" 不能转换为 "${status}"，允许的转换: [${allowedTransitions.join(', ')}]`)
    );
  }

  if (status === APPOINTMENT_STATUSES.CONFIRMED) {
    if (!hasPermission(role, 'confirmAppointments') && !hasPermission(role, 'manageAppointments')) {
      return res.status(403).json(makeError(ErrorCode.UNAUTHORIZED_ROLE, '需要全科医生或公共卫生专员权限'));
    }
    appointment.confirmedAt = new Date().toISOString();
  }

  if (status === APPOINTMENT_STATUSES.CANCELLED) {
    appointment.cancelledAt = new Date().toISOString();
    appointment.cancelReason = cancelReason || '管理员取消';
  }

  appointment.status = status;
  appointment.updatedAt = new Date().toISOString();
  res.json({ data: appointment });
});

app.post('/api/appointments/:id/start-inoculation', requireRole(ROLES.NURSE, ROLES.PH_SPECIALIST), (req, res) => {
  const { id } = req.params;
  const { nurseName } = req.body;
  if (!nurseName) {
    return res.status(400).json(makeError(ErrorCode.INVALID_PARAMS, '护士姓名不能为空'));
  }

  const appointment = store.appointments.find((a) => a.id === id);
  if (!appointment) {
    return res.status(404).json(makeError(ErrorCode.VACCINE_APPOINTMENT_NOT_FOUND, id));
  }

  if (appointment.status !== APPOINTMENT_STATUSES.CONFIRMED) {
    return res.status(409).json(
      makeError(ErrorCode.APPOINTMENT_STATUS_CONFLICT, `只有"已确认"的预约才能开始接种，当前状态: "${appointment.status}"`)
    );
  }

  appointment.status = APPOINTMENT_STATUSES.INOCULATING;
  appointment.nurseName = nurseName;
  appointment.updatedAt = new Date().toISOString();
  res.json({ data: appointment });
});

app.post('/api/appointments/:id/complete-inoculation', requireRole(ROLES.NURSE, ROLES.PH_SPECIALIST), (req, res) => {
  const { id } = req.params;
  const appointment = store.appointments.find((a) => a.id === id);
  if (!appointment) {
    return res.status(404).json(makeError(ErrorCode.VACCINE_APPOINTMENT_NOT_FOUND, id));
  }

  if (appointment.status !== APPOINTMENT_STATUSES.INOCULATING) {
    return res.status(409).json(
      makeError(ErrorCode.APPOINTMENT_STATUS_CONFLICT, `只有"接种中"的预约才能完成接种，当前状态: "${appointment.status}"`)
    );
  }

  appointment.status = APPOINTMENT_STATUSES.INOCULATED;
  appointment.inoculatedAt = new Date().toISOString();
  appointment.updatedAt = new Date().toISOString();

  const observation = {
    id: generateId('OBS'),
    appointmentId: appointment.id,
    residentName: appointment.residentName,
    vaccineName: appointment.vaccineName,
    nurseName: appointment.nurseName,
    responsiblePerson: appointment.nurseName,
    status: OBSERVATION_STATUSES.WAITING,
    startedAt: null,
    completedAt: null,
    durationMinutes: null,
    observations: [],
    handovers: [],
    alertTriggered: false,
  };
  store.observations.push(observation);

  res.json({ data: { appointment, observation } });
});

// --- 留观记录 ---
app.get('/api/observations', requireRole(ROLES.NURSE, ROLES.PH_SPECIALIST), (req, res) => {
  let observations = [...store.observations];
  const { status, alertOnly } = req.query;
  if (status) observations = observations.filter((o) => o.status === status);
  if (alertOnly === 'true') observations = observations.filter((o) => o.alertTriggered);

  const nowMs = Date.now();
  observations = observations.map((obs) => {
    const result = { ...obs };
    if (
      (result.status === OBSERVATION_STATUSES.WAITING || result.status === OBSERVATION_STATUSES.OBSERVING) &&
      result.startedAt
    ) {
      const elapsed = Math.floor((nowMs - new Date(result.startedAt).getTime()) / 60000);
      result.elapsedMinutes = elapsed;
      if (elapsed > 30 && !result.alertTriggered) {
        result.alertTriggered = true;
        result.alertReason = `留观已超过30分钟（当前${elapsed}分钟）仍未完成`;
      }
    }
    if (result.appointmentId) {
      const appointment = store.appointments.find((a) => a.id === result.appointmentId);
      if (appointment) {
        result.appointmentStatus = appointment.status;
        result.appointmentDoctor = appointment.doctorName;
      }
    }
    return result;
  });

  res.json({ data: observations, total: observations.length });
});

app.get('/api/observations/:id', requireRole(ROLES.NURSE, ROLES.PH_SPECIALIST), (req, res) => {
  const observation = store.observations.find((o) => o.id === req.params.id);
  if (!observation) {
    return res.status(404).json(makeError(ErrorCode.OBSERVATION_NOT_FOUND, req.params.id));
  }

  const result = { ...observation };
  if (
    (result.status === OBSERVATION_STATUSES.WAITING || result.status === OBSERVATION_STATUSES.OBSERVING) &&
    result.startedAt
  ) {
    const elapsed = Math.floor((Date.now() - new Date(result.startedAt).getTime()) / 60000);
    result.elapsedMinutes = elapsed;
    if (elapsed > 30 && !result.alertTriggered) {
      result.alertTriggered = true;
      result.alertReason = `留观已超过30分钟（当前${elapsed}分钟）仍未完成`;
    }
  }

  if (observation.appointmentId) {
    const appointment = store.appointments.find((a) => a.id === observation.appointmentId);
    result.appointment = appointment || null;
  }

  res.json({ data: result });
});

app.post('/api/observations/:id/start', requireRole(ROLES.NURSE, ROLES.PH_SPECIALIST), (req, res) => {
  const observation = store.observations.find((o) => o.id === req.params.id);
  if (!observation) {
    return res.status(404).json(makeError(ErrorCode.OBSERVATION_NOT_FOUND, req.params.id));
  }

  if (observation.status !== OBSERVATION_STATUSES.WAITING) {
    return res.status(409).json(
      makeError(ErrorCode.OBSERVATION_ALREADY_STARTED, `只有"等待中"的留观才能开始，当前状态: "${observation.status}"`)
    );
  }

  const { note } = req.body;
  observation.status = OBSERVATION_STATUSES.OBSERVING;
  observation.startedAt = new Date().toISOString();
  observation.observations.push({
    time: observation.startedAt,
    note: note || '开始留观观察',
  });

  if (observation.appointmentId) {
    const appointment = store.appointments.find((a) => a.id === observation.appointmentId);
    if (appointment && appointment.status === APPOINTMENT_STATUSES.INOCULATED) {
      appointment.status = APPOINTMENT_STATUSES.OBSERVING;
      appointment.updatedAt = new Date().toISOString();
    }
  }

  res.json({ data: observation });
});

app.post('/api/observations/:id/complete', requireRole(ROLES.NURSE, ROLES.PH_SPECIALIST), (req, res) => {
  const observation = store.observations.find((o) => o.id === req.params.id);
  if (!observation) {
    return res.status(404).json(makeError(ErrorCode.OBSERVATION_NOT_FOUND, req.params.id));
  }

  if (observation.status === OBSERVATION_STATUSES.COMPLETED) {
    return res.status(409).json(makeError(ErrorCode.OBSERVATION_ALREADY_COMPLETED));
  }
  if (observation.status === OBSERVATION_STATUSES.ABNORMAL) {
    return res.status(409).json(makeError(ErrorCode.OBSERVATION_ALREADY_ABANDONED));
  }
  if (observation.status === OBSERVATION_STATUSES.WAITING) {
    return res.status(422).json(makeError(ErrorCode.OBSERVATION_NOT_COMPLETED, '留观尚未开始，不能完成'));
  }

  const { note, markAbnormal } = req.body;
  const completedAt = new Date().toISOString();

  if (markAbnormal) {
    observation.status = OBSERVATION_STATUSES.ABNORMAL;
    observation.alertTriggered = true;
    observation.alertReason = note || '留观期间发现异常';
  } else {
    observation.status = OBSERVATION_STATUSES.COMPLETED;
  }

  observation.completedAt = completedAt;
  if (observation.startedAt) {
    observation.durationMinutes = Math.floor(
      (new Date(completedAt).getTime() - new Date(observation.startedAt).getTime()) / 60000
    );
  }
  observation.observations.push({
    time: completedAt,
    note: note || (markAbnormal ? '留观标记异常结束' : '留观结束，一切正常'),
  });

  if (observation.appointmentId) {
    const appointment = store.appointments.find((a) => a.id === observation.appointmentId);
    if (appointment && appointment.status === APPOINTMENT_STATUSES.OBSERVING) {
      if (markAbnormal) {
        // 异常留观不自动完成预约，保持observing状态
      } else {
        appointment.status = APPOINTMENT_STATUSES.COMPLETED;
        appointment.observationCompletedAt = completedAt;
      }
      appointment.updatedAt = completedAt;
    }
  }

  res.json({ data: observation });
});

app.post('/api/observations/:id/handover', requireRole(ROLES.NURSE, ROLES.PH_SPECIALIST), (req, res) => {
  const observation = store.observations.find((o) => o.id === req.params.id);
  if (!observation) {
    return res.status(404).json(makeError(ErrorCode.OBSERVATION_NOT_FOUND, req.params.id));
  }

  if (observation.status === OBSERVATION_STATUSES.COMPLETED) {
    return res.status(409).json(makeError(ErrorCode.OBSERVATION_ALREADY_COMPLETED));
  }
  if (observation.status === OBSERVATION_STATUSES.ABNORMAL) {
    return res.status(409).json(makeError(ErrorCode.OBSERVATION_ALREADY_ABANDONED));
  }

  const { toPerson, reason } = req.body;
  if (!toPerson) {
    return res.status(400).json(makeError(ErrorCode.INVALID_PARAMS, '交接人不能为空'));
  }
  if (toPerson === observation.responsiblePerson) {
    return res.status(409).json(makeError(ErrorCode.HANDOVER_SAME_PERSON));
  }

  const handover = {
    from: observation.responsiblePerson,
    to: toPerson,
    time: new Date().toISOString(),
    reason: reason || '',
  };

  observation.handovers.push(handover);
  observation.responsiblePerson = toPerson;
  observation.observations.push({
    time: handover.time,
    note: `责任人由 ${handover.from} 交接给 ${handover.to}，原因: ${reason || '无'}`,
  });

  res.json({ data: observation });
});

// --- 导出任务 ---
app.post('/api/export', requireRole(ROLES.PH_SPECIALIST), (req, res) => {
  const { type, filters } = req.body;
  if (!type || !['appointments', 'observations'].includes(type)) {
    return res.status(400).json(makeError(ErrorCode.INVALID_PARAMS, 'type 必须为 appointments 或 observations'));
  }

  const taskId = `EXPORT-${Date.now()}`;
  store.exportTasks[taskId] = {
    id: taskId,
    type,
    filters: filters || {},
    status: 'processing',
    createdAt: new Date().toISOString(),
    completedAt: null,
    csvContent: null,
  };

  setTimeout(() => {
    const task = store.exportTasks[taskId];
    if (!task) return;

    let records;
    if (type === 'appointments') {
      records = store.appointments;
      if (filters.status) records = records.filter((r) => r.status === filters.status);
      if (filters.date) records = records.filter((r) => r.appointmentDate === filters.date);
      if (filters.vaccineName) records = records.filter((r) => r.vaccineName.includes(filters.vaccineName));

      const header = '预约ID,居民姓名,身份证号,联系电话,疫苗名称,疫苗批号,预约日期,预约时间,状态,医生,护士,创建时间,确认时间,接种时间,留观完成时间,取消原因\n';
      const rows = records
        .map(
          (r) =>
            `${r.id},${r.residentName},${r.residentIdCard},${r.residentPhone},${r.vaccineName},${r.vaccineBatch},${r.appointmentDate},${r.appointmentTime},${r.status},${r.doctorName || ''},${r.nurseName || ''},${r.createdAt},${r.confirmedAt || ''},${r.inoculatedAt || ''},${r.observationCompletedAt || ''},${r.cancelReason || ''}`
        )
        .join('\n');
      task.csvContent = header + rows;
    } else {
      records = store.observations;
      if (filters.status) records = records.filter((r) => r.status === filters.status);
      if (filters.alertOnly) records = records.filter((r) => r.alertTriggered);

      const header = '留观ID,关联预约ID,居民姓名,疫苗名称,接种护士,当前负责人,状态,开始时间,完成时间,时长(分钟),是否告警,告警原因,交接次数\n';
      const rows = records
        .map(
          (r) =>
            `${r.id},${r.appointmentId || ''},${r.residentName},${r.vaccineName},${r.nurseName},${r.responsiblePerson},${r.status},${r.startedAt || ''},${r.completedAt || ''},${r.durationMinutes || ''},${r.alertTriggered},${r.alertReason || ''},${r.handovers.length}`
        )
        .join('\n');
      task.csvContent = header + rows;
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
  }, 1500);

  res.status(202).json({ data: { taskId, status: 'processing' } });
});

app.get('/api/export/:taskId', requireRole(ROLES.PH_SPECIALIST), (req, res) => {
  const task = store.exportTasks[req.params.taskId];
  if (!task) {
    return res.status(404).json(makeError(ErrorCode.EXPORT_TASK_NOT_FOUND, req.params.taskId));
  }
  const result = {
    id: task.id,
    type: task.type,
    status: task.status,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  };
  if (task.status === 'completed') {
    result.csvContent = task.csvContent;
  }
  res.json({ data: result });
});

// --- 仪表盘 ---
app.get('/api/dashboard', (req, res) => {
  const role = req.headers['x-role'] || req.query.role;
  if (!role) {
    return res.status(401).json(makeError(ErrorCode.UNAUTHORIZED_ROLE, '未提供角色信息'));
  }

  const stats = {
    totalAppointments: store.appointments.length,
    pendingAppointments: store.appointments.filter((a) => a.status === APPOINTMENT_STATUSES.PENDING).length,
    confirmedAppointments: store.appointments.filter((a) => a.status === APPOINTMENT_STATUSES.CONFIRMED).length,
    inoculatingAppointments: store.appointments.filter((a) => a.status === APPOINTMENT_STATUSES.INOCULATING).length,
    inoculatedAppointments: store.appointments.filter((a) => a.status === APPOINTMENT_STATUSES.INOCULATED).length,
    observingAppointments: store.appointments.filter((a) => a.status === APPOINTMENT_STATUSES.OBSERVING).length,
    completedAppointments: store.appointments.filter((a) => a.status === APPOINTMENT_STATUSES.COMPLETED).length,
    cancelledAppointments: store.appointments.filter((a) => a.status === APPOINTMENT_STATUSES.CANCELLED).length,
    totalObservations: store.observations.length,
    waitingObservations: store.observations.filter((o) => o.status === OBSERVATION_STATUSES.WAITING).length,
    observingObservations: store.observations.filter((o) => o.status === OBSERVATION_STATUSES.OBSERVING).length,
    completedObservations: store.observations.filter((o) => o.status === OBSERVATION_STATUSES.COMPLETED).length,
    abnormalObservations: store.observations.filter((o) => o.status === OBSERVATION_STATUSES.ABNORMAL).length,
    alertObservations: store.observations.filter((o) => o.alertTriggered).length,
  };

  if (hasPermission(role, 'viewContracts')) {
    stats.totalContracts = store.contracts.length;
    stats.activeContracts = store.contracts.filter((c) => c.status === 'active').length;
    stats.expiredContracts = store.contracts.filter((c) => c.status === 'expired').length;
    stats.pendingFollowups = store.followups.filter((f) => f.status === 'pending').length;
  }

  if (hasPermission(role, 'exportData')) {
    stats.totalExportTasks = Object.keys(store.exportTasks).length;
    stats.processingExportTasks = Object.values(store.exportTasks).filter((t) => t.status === 'processing').length;
  }

  const alerts = [];
  store.observations.forEach((obs) => {
    if (obs.alertTriggered) {
      alerts.push({
        id: obs.id,
        type: 'observation_alert',
        residentName: obs.residentName,
        vaccineName: obs.vaccineName,
        message: obs.alertReason || '留观异常',
        severity: obs.status === OBSERVATION_STATUSES.ABNORMAL ? 'high' : 'medium',
        createdAt: obs.startedAt || obs.observations[0]?.time,
      });
    }
  });
  stats.alerts = alerts;

  res.json({ data: stats });
});

// --- 启动服务器 ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`社区卫生站疫苗预约与留观记录系统 - 后端服务已启动`);
  console.log(`地址: http://localhost:${PORT}`);
  console.log(`可用角色: ${Object.values(ROLES).join(', ')}`);
});
