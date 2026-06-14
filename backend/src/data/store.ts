import type {
  Registration,
  PhysicalCheck,
  PhysicalHistory,
  ExceptionRecord,
  HandoverLog,
  TrainingSchedule,
  ExamBatch,
  PhysicalForm,
  RegistrationDoc,
  ResponsibilityWarning,
  ResponsibilityMark,
  PhysicalStatus,
  Role,
} from 'shared';

const now = () => new Date().toISOString();

const doc = (id: string, name: string, submitted: boolean, note?: string): RegistrationDoc => ({
  id,
  name,
  submitted,
  note,
});

const makeRespWarning = (opts: {
  triggerType: ResponsibilityWarning['triggerType'];
  mark: ResponsibilityMark;
  missingDocs: string[];
  registrarName: string;
  flowTime: string;
  description: string;
  syncedToException: boolean;
  exceptionId?: string;
}): ResponsibilityWarning => ({
  triggered: true,
  ...opts,
});

export const defaultRegistrations: Registration[] = [
  {
    id: 'R20260601001',
    studentName: '张伟',
    idCard: '310101199001011234',
    phone: '13800138001',
    address: '上海市浦东新区张江镇',
    status: 'completed',
    docs: [
      doc('D1', '身份证复印件', true),
      doc('D2', '一寸照片4张', true),
      doc('D3', '原驾驶证（增驾）', false),
    ],
    registrarName: '李报名',
    createdAt: '2026-06-10T09:15:00.000Z',
    updatedAt: '2026-06-10T09:45:00.000Z',
    remark: '增驾D照，资料基本齐全，缺原驾驶证但学员说可以后补',
    responsibilityWarning: makeRespWarning({
      triggerType: 'missing_docs',
      mark: 'registrar_issue',
      missingDocs: ['原驾驶证（增驾）'],
      registrarName: '李报名',
      flowTime: '2026-06-10T09:45:00.000Z',
      description: '缺原驾驶证（增驾），报名员确认学员后续补交，提前流转体检。',
      syncedToException: true,
      exceptionId: 'E20260601006',
    }),
  },
  {
    id: 'R20260601002',
    studentName: '王芳',
    idCard: '310104199505055678',
    phone: '13800138002',
    address: '上海市徐汇区漕河泾',
    status: 'completed',
    docs: [
      doc('D1', '身份证复印件', true),
      doc('D2', '一寸照片4张', true),
    ],
    registrarName: '李报名',
    createdAt: '2026-06-11T10:20:00.000Z',
    updatedAt: '2026-06-11T10:50:00.000Z',
  },
  {
    id: 'R20260601003',
    studentName: '刘强',
    idCard: '320101198803034321',
    phone: '13800138003',
    address: '江苏省南京市鼓楼区',
    status: 'completed',
    docs: [
      doc('D1', '身份证复印件', true),
      doc('D2', '一寸照片4张', true),
      doc('D3', '居住证', true),
    ],
    registrarName: '赵登记',
    createdAt: '2026-06-11T14:00:00.000Z',
    updatedAt: '2026-06-11T14:30:00.000Z',
  },
  {
    id: 'R20260601004',
    studentName: '陈敏',
    idCard: '330101199212128765',
    phone: '13800138004',
    address: '浙江省杭州市西湖区',
    status: 'delayed',
    docs: [
      doc('D1', '身份证复印件', true),
      doc('D2', '一寸照片4张', false, '照片底色不对，需要蓝底'),
    ],
    registrarName: '李报名',
    createdAt: '2026-06-12T08:30:00.000Z',
    updatedAt: '2026-06-12T08:30:00.000Z',
    delayHours: 48,
    remark: '照片不符合要求，学员承诺次日补交',
  },
  {
    id: 'R20260601005',
    studentName: '杨帆',
    idCard: '340101199808089999',
    phone: '13800138005',
    address: '安徽省合肥市蜀山区',
    status: 'supplement',
    docs: [
      doc('D1', '身份证复印件', true),
      doc('D2', '一寸照片4张', true),
      doc('D3', '体检表原件', false, '缺少医院盖章'),
    ],
    registrarName: '赵登记',
    createdAt: '2026-06-13T11:10:00.000Z',
    updatedAt: '2026-06-13T15:20:00.000Z',
    supplementNote: '体检表无医院公章，退回学员补盖',
  },
  {
    id: 'R20260601006',
    studentName: '周磊',
    idCard: '310115198506062222',
    phone: '13800138006',
    address: '上海市浦东新区金桥',
    status: 'rejected',
    docs: [
      doc('D1', '身份证复印件', false, '复印件模糊'),
      doc('D2', '一寸照片4张', false),
    ],
    registrarName: '李报名',
    createdAt: '2026-06-13T16:00:00.000Z',
    updatedAt: '2026-06-13T16:45:00.000Z',
    rejectReason: '身份证复印件不清晰且照片缺失，不符合报名要求',
    responsibilityWarning: makeRespWarning({
      triggerType: 'rejected_flow',
      mark: 'registrar_issue',
      missingDocs: ['身份证复印件', '一寸照片4张'],
      registrarName: '李报名',
      flowTime: '2026-06-13T16:30:00.000Z',
      description: '报名资料已被驳回，但学员仍被错误流转到体检环节，属于报名员操作失误。',
      syncedToException: true,
      exceptionId: 'E20260601003',
    }),
  },
  {
    id: 'R20260601007',
    studentName: '吴婷',
    idCard: '310110199311113333',
    phone: '13800138007',
    address: '上海市杨浦区五角场',
    status: 'pending',
    docs: [
      doc('D1', '身份证复印件', true),
      doc('D2', '一寸照片4张', false),
    ],
    registrarName: '赵登记',
    createdAt: '2026-06-14T09:00:00.000Z',
    updatedAt: '2026-06-14T09:00:00.000Z',
  },
  {
    id: 'R20260601008',
    studentName: '郑浩',
    idCard: '310112199009094444',
    phone: '13800138008',
    address: '上海市闵行区莘庄',
    status: 'pending',
    docs: [
      doc('D1', '身份证复印件', true),
      doc('D2', '一寸照片4张', true),
      doc('D3', '原驾驶证（增驾）', true),
    ],
    registrarName: '李报名',
    createdAt: '2026-06-14T10:15:00.000Z',
    updatedAt: '2026-06-14T10:15:00.000Z',
    remark: '刚完成资料提交，等待流转',
  },
];

const physTemplate = (
  id: string,
  registrationId: string,
  studentName: string,
  status: PhysicalStatus,
  version: number,
  examiner: string,
  examinerRole: Role,
  checkedAt: string | null,
  extra: Partial<PhysicalCheck> = {}
): PhysicalCheck => ({
  id,
  registrationId,
  studentName,
  status,
  eyesightLeft: null,
  eyesightRight: null,
  hearing: null,
  bloodPressure: null,
  heartRate: null,
  height: null,
  limbsCheck: null,
  medicalHistory: '',
  examiner,
  examinerRole,
  checkedAt,
  responsibilityMark: 'none',
  version,
  isLatest: true,
  ...extra,
});

export const defaultPhysicals: PhysicalCheck[] = [
  physTemplate('P20260601001', 'R20260601001', '张伟', 'passed', 2, '王教练', 'fieldCoach', '2026-06-10T11:00:00.000Z', {
    eyesightLeft: 5.0, eyesightRight: 5.0, hearing: 'normal',
    bloodPressure: '120/80', heartRate: 72, height: 175, limbsCheck: 'normal',
    medicalHistory: '无',
  }),
  physTemplate('P20260601002', 'R20260601002', '王芳', 'passed', 1, '钱教练', 'fieldCoach', '2026-06-11T14:00:00.000Z', {
    eyesightLeft: 4.9, eyesightRight: 5.0, hearing: 'normal',
    bloodPressure: '115/75', heartRate: 68, height: 162, limbsCheck: 'normal',
    medicalHistory: '无',
  }),
  physTemplate('P20260601003', 'R20260601003', '刘强', 'passed', 2, '孙安全', 'safetyOfficer', '2026-06-12T10:30:00.000Z', {
    eyesightLeft: 5.0, eyesightRight: 4.8, hearing: 'normal',
    bloodPressure: '130/85', heartRate: 75, height: 180, limbsCheck: 'normal',
    medicalHistory: '高血压（服药控制）',
  }),
  physTemplate('P20260601004', 'R20260601004', '陈敏', 'review', 1, '王教练', 'fieldCoach', '2026-06-13T09:15:00.000Z', {
    eyesightLeft: 4.6, eyesightRight: 4.7, hearing: 'normal',
    bloodPressure: '140/90', heartRate: 88, height: 165, limbsCheck: 'normal',
    medicalHistory: '近视，血压偏高',
    reviewNote: '视力未达标准（要求单眼4.9以上），血压临界值。需安全员复核确认是否可报名。',
    responsibilityMark: 'borderline',
    responsibilityNote: '视力和血压均处于临界值，报名员未提前告知学员矫正视力要求，教练也未现场复测确认，双方责任需明确。',
  }),
  physTemplate('P20260601005', 'R20260601005', '杨帆', 'recheck', 2, '钱教练', 'fieldCoach', '2026-06-13T16:30:00.000Z', {
    eyesightLeft: 5.0, eyesightRight: 5.0, hearing: 'abnormal',
    bloodPressure: '118/78', heartRate: 70, height: 172, limbsCheck: 'normal',
    medicalHistory: '右耳听力下降',
    recheckNote: '听力测试未通过，建议去医院做纯音测听后复诊。',
    responsibilityMark: 'coach_issue',
    responsibilityNote: '场地教练在初检时发现听力问题未及时登记，直到学员完成多项检测后才补录，导致流程拖延。',
  }),
  physTemplate('P20260601006', 'R20260601006', '周磊', 'failed', 1, '', 'fieldCoach', null, {
    medicalHistory: '未完成体检',
    responsibilityMark: 'registrar_issue',
    responsibilityNote: '报名资料被驳回，但报名员仍将该学员流转至体检环节，导致流程混乱。',
  }),
];

const historyFromPhys = (
  p: PhysicalCheck,
  action: PhysicalHistory['action'],
  previousStatus: PhysicalStatus,
  operator: string,
  operatorRole: Role,
  operatedAt: string,
  changeSummary?: string
): PhysicalHistory => ({
  id: `H${p.id}-V${p.version}`,
  physicalId: p.id,
  registrationId: p.registrationId,
  studentName: p.studentName,
  version: p.version,
  action,
  status: p.status,
  previousStatus,
  eyesightLeft: p.eyesightLeft,
  eyesightRight: p.eyesightRight,
  hearing: p.hearing,
  bloodPressure: p.bloodPressure,
  heartRate: p.heartRate,
  height: p.height,
  limbsCheck: p.limbsCheck,
  medicalHistory: p.medicalHistory,
  examiner: p.examiner,
  examinerRole: p.examinerRole,
  checkedAt: p.checkedAt,
  reviewNote: p.reviewNote,
  recheckNote: p.recheckNote,
  responsibilityMark: p.responsibilityMark,
  responsibilityNote: p.responsibilityNote,
  operator,
  operatorRole,
  operatedAt,
  changeSummary,
});

export const defaultPhysicalHistories: PhysicalHistory[] = [
  historyFromPhys(
    { ...defaultPhysicals[0], version: 1 },
    'create', 'pending', '李报名', 'registrar', '2026-06-10T09:45:00.000Z',
    '报名资料完成，自动创建体检待办（缺原驾驶证，责任预警已记录）'
  ),
  historyFromPhys(
    defaultPhysicals[0],
    'submit', 'pending', '王教练', 'fieldCoach', '2026-06-10T11:00:00.000Z',
    '体检完成，各项指标正常，通过'
  ),
  historyFromPhys(
    defaultPhysicals[1],
    'submit', 'pending', '钱教练', 'fieldCoach', '2026-06-11T14:00:00.000Z',
    '体检一次通过'
  ),
  historyFromPhys(
    { ...defaultPhysicals[2], version: 1, status: 'review', responsibilityMark: 'borderline', responsibilityNote: '初次体检视力4.8，安全员需复核', reviewNote: '右眼视力4.8，临界值，建议复核' },
    'submit', 'pending', '王教练', 'fieldCoach', '2026-06-12T08:30:00.000Z',
    '视力临界，提交安全员复核'
  ),
  historyFromPhys(
    defaultPhysicals[2],
    'review', 'review', '孙安全', 'safetyOfficer', '2026-06-12T10:30:00.000Z',
    '安全员复核通过，视力4.8在可接受范围内'
  ),
  historyFromPhys(
    defaultPhysicals[3],
    'submit', 'pending', '王教练', 'fieldCoach', '2026-06-13T09:15:00.000Z',
    '视力和血压均临界，提交待复核，责任标记为边界不清'
  ),
  historyFromPhys(
    { ...defaultPhysicals[4], version: 1, status: 'pending' },
    'create', 'pending', '赵登记', 'registrar', '2026-06-13T11:10:00.000Z',
    '报名补录中创建体检待办'
  ),
  historyFromPhys(
    defaultPhysicals[4],
    'recheck', 'pending', '钱教练', 'fieldCoach', '2026-06-13T16:30:00.000Z',
    '听力异常，需重检；教练延迟补录责任已标记'
  ),
  historyFromPhys(
    defaultPhysicals[5],
    'create', 'pending', '李报名', 'registrar', '2026-06-13T16:30:00.000Z',
    '驳回的报名资料错误流转到体检，自动标记报名员责任'
  ),
];

export const defaultExceptions: ExceptionRecord[] = [
  {
    id: 'E20260601001',
    registrationId: 'R20260601004',
    studentName: '陈敏',
    type: 'registration',
    level: 'warning',
    content: '照片底色不符合要求，已超过24小时未补交',
    handler: '李报名',
    handlerRole: 'registrar',
    resolved: false,
    createdAt: '2026-06-13T10:00:00.000Z',
  },
  {
    id: 'E20260601002',
    registrationId: 'R20260601005',
    studentName: '杨帆',
    type: 'registration',
    level: 'warning',
    content: '体检表缺少医院盖章，退回补盖中',
    handler: '赵登记',
    handlerRole: 'registrar',
    resolved: false,
    createdAt: '2026-06-13T16:00:00.000Z',
  },
  {
    id: 'E20260601003',
    registrationId: 'R20260601006',
    studentName: '周磊',
    type: 'handover',
    level: 'error',
    content: '报名资料已驳回，但系统仍流转至体检环节，责任归属不清（报名员责任预警已同步）',
    handler: '李报名',
    handlerRole: 'registrar',
    resolved: false,
    createdAt: '2026-06-13T17:00:00.000Z',
  },
  {
    id: 'E20260601004',
    registrationId: 'R20260601004',
    studentName: '陈敏',
    type: 'physical',
    level: 'warning',
    content: '视力和血压均处于临界值，需安全员复核',
    handler: '王教练',
    handlerRole: 'fieldCoach',
    resolved: false,
    createdAt: '2026-06-13T09:30:00.000Z',
  },
  {
    id: 'E20260601005',
    registrationId: 'R20260601005',
    studentName: '杨帆',
    type: 'physical',
    level: 'warning',
    content: '听力异常，流程记录延迟补录（教练责任已标记）',
    handler: '钱教练',
    handlerRole: 'fieldCoach',
    resolved: false,
    createdAt: '2026-06-13T17:00:00.000Z',
  },
  {
    id: 'E20260601006',
    registrationId: 'R20260601001',
    studentName: '张伟',
    type: 'handover',
    level: 'warning',
    content: '缺原驾驶证（增驾）提前流转体检，报名员责任预警',
    handler: '李报名',
    handlerRole: 'registrar',
    resolved: false,
    createdAt: '2026-06-10T09:45:00.000Z',
  },
];

export const defaultHandoverLogs: HandoverLog[] = [
  {
    id: 'H20260601001',
    fromRole: 'registrar',
    toRole: 'fieldCoach',
    fromUser: '李报名',
    toUser: '王教练',
    summary: '6月10日白班交接，共完成3人报名，1人待体检\n注意：张伟缺原驾驶证（增驾），已标记报名员责任预警。',
    pendingItems: 1,
    exceptionItems: 1,
    responsibilityItems: 1,
    responsibilityDetails: [
      {
        studentName: '张伟',
        registrationId: 'R20260601001',
        mark: 'registrar_issue',
        description: '缺原驾驶证（增驾），报名员确认学员后续补交，提前流转体检。',
      },
    ],
    createdAt: '2026-06-10T18:00:00.000Z',
  },
  {
    id: 'H20260601002',
    fromRole: 'fieldCoach',
    toRole: 'safetyOfficer',
    fromUser: '王教练',
    toUser: '孙安全',
    summary: '6月12日体检完成2人，1人需安全员复核\n陈敏视力血压临界，责任边界不清；\n周磊为驳回资料错误流转，报名员责任。',
    pendingItems: 1,
    exceptionItems: 3,
    responsibilityItems: 2,
    responsibilityDetails: [
      {
        studentName: '陈敏',
        registrationId: 'R20260601004',
        mark: 'borderline',
        description: '视力和血压均临界，报名员未提前告知矫正要求，教练未复测，边界不清。',
      },
      {
        studentName: '周磊',
        registrationId: 'R20260601006',
        mark: 'registrar_issue',
        description: '报名资料已驳回仍流转到体检，属于报名员操作失误。',
      },
    ],
    createdAt: '2026-06-12T18:00:00.000Z',
  },
];

export const defaultSchedules: TrainingSchedule[] = [
  { id: 'S001', date: '2026-06-15', timeSlot: '08:00-10:00', coach: '王教练', venue: '训练场A区', capacity: 15, registered: 12 },
  { id: 'S002', date: '2026-06-15', timeSlot: '14:00-16:00', coach: '钱教练', venue: '训练场B区', capacity: 15, registered: 8 },
  { id: 'S003', date: '2026-06-16', timeSlot: '08:00-10:00', coach: '王教练', venue: '训练场A区', capacity: 15, registered: 5 },
  { id: 'S004', date: '2026-06-17', timeSlot: '09:00-11:00', coach: '钱教练', venue: '训练场C区', capacity: 20, registered: 10 },
];

export const defaultExamBatches: ExamBatch[] = [
  { id: 'EX001', date: '2026-06-20', subject: 'subject1', venue: '车管所理论考场', capacity: 50, registered: 42 },
  { id: 'EX002', date: '2026-06-22', subject: 'subject2', venue: '车管所桩考场地', capacity: 30, registered: 25 },
  { id: 'EX003', date: '2026-06-25', subject: 'subject3', venue: '车管所路考路线', capacity: 30, registered: 18 },
];

export const defaultPhysicalForms: PhysicalForm[] = [
  { id: 'F001', studentName: '张伟', issuedBy: '浦东人民医院', issuedDate: '2026-06-08', validUntil: '2027-06-08', formNumber: 'TJ20260608001' },
  { id: 'F002', studentName: '王芳', issuedBy: '徐汇中心医院', issuedDate: '2026-06-10', validUntil: '2027-06-10', formNumber: 'TJ20260610002' },
  { id: 'F003', studentName: '刘强', issuedBy: '南京鼓楼医院', issuedDate: '2026-06-09', validUntil: '2027-06-09', formNumber: 'TJ20260609003' },
];

export interface DataStore {
  registrations: Registration[];
  physicals: PhysicalCheck[];
  physicalHistories: PhysicalHistory[];
  exceptions: ExceptionRecord[];
  handoverLogs: HandoverLog[];
  schedules: TrainingSchedule[];
  examBatches: ExamBatch[];
  physicalForms: PhysicalForm[];
  lastResetAt: string;
}

export const createDefaultStore = (): DataStore => ({
  registrations: JSON.parse(JSON.stringify(defaultRegistrations)),
  physicals: JSON.parse(JSON.stringify(defaultPhysicals)),
  physicalHistories: JSON.parse(JSON.stringify(defaultPhysicalHistories)),
  exceptions: JSON.parse(JSON.stringify(defaultExceptions)),
  handoverLogs: JSON.parse(JSON.stringify(defaultHandoverLogs)),
  schedules: JSON.parse(JSON.stringify(defaultSchedules)),
  examBatches: JSON.parse(JSON.stringify(defaultExamBatches)),
  physicalForms: JSON.parse(JSON.stringify(defaultPhysicalForms)),
  lastResetAt: now(),
});

export let store: DataStore = createDefaultStore();

export const resetStore = (): DataStore => {
  store = createDefaultStore();
  return store;
};
