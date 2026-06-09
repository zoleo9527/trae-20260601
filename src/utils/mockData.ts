import type { Patient, FollowUp, Warning, Indicator, StatusLog, WarningAction, Role } from '@/types'

const patients: Patient[] = [
  { id: 'p1', name: '王秀兰', gender: '女', age: 68, diseaseType: '2型糖尿病' },
  { id: 'p2', name: '李建国', gender: '男', age: 72, diseaseType: '高血压' },
  { id: 'p3', name: '张桂芳', gender: '女', age: 65, diseaseType: '2型糖尿病+高血压' },
  { id: 'p4', name: '赵德明', gender: '男', age: 70, diseaseType: '冠心病' },
  { id: 'p5', name: '刘淑珍', gender: '女', age: 75, diseaseType: '高血压' },
  { id: 'p6', name: '陈志强', gender: '男', age: 63, diseaseType: '2型糖尿病' },
  { id: 'p7', name: '孙桂英', gender: '女', age: 69, diseaseType: '慢性肾病' },
  { id: 'p8', name: '周明华', gender: '男', age: 71, diseaseType: '高血压+冠心病' },
]

const roleNames: Record<Role, string> = {
  doctor: '陈医生',
  nurse: '林护士',
  ph_specialist: '杨专员',
}

function hoursAgo(h: number): string {
  const d = new Date()
  d.setHours(d.getHours() - h)
  return d.toISOString()
}

function makeIndicator(
  id: string,
  followUpId: string,
  name: string,
  value: number,
  unit: string,
  normalMin: number,
  normalMax: number,
  hoursAgoVal: number,
  recorderRole: Role = 'nurse'
): Indicator {
  return { id, followUpId, name, value, unit, normalMin, normalMax, recordedAt: hoursAgo(hoursAgoVal), recorderRole }
}

function makeStatusLog(
  id: string,
  followUpId: string,
  fromStatus: FollowUp['status'] | null,
  toStatus: FollowUp['status'],
  operatorRole: Role,
  operatorName: string,
  hoursAgoVal: number,
  remark: string
): StatusLog {
  return { id, followUpId, fromStatus, toStatus, operatorRole, operatorName, operatedAt: hoursAgo(hoursAgoVal), remark }
}

function makeWarningAction(
  id: string,
  warningId: string,
  actionType: WarningAction['actionType'],
  operatorRole: Role,
  operatorName: string,
  hoursAgoVal: number,
  remark: string
): WarningAction {
  return { id, warningId, actionType, operatorRole, operatorName, operatedAt: hoursAgo(hoursAgoVal), remark }
}

export const initialPatients = patients

export const initialFollowUps: FollowUp[] = [
  {
    id: 'f1',
    patientId: 'p1',
    status: 'warned',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    createdAt: hoursAgo(24),
    updatedAt: hoursAgo(3),
    deadlineHours: 48,
    indicators: [
      makeIndicator('i1-1', 'f1', '空腹血糖', 8.3, 'mmol/L', 3.9, 6.1, 4, 'nurse'),
      makeIndicator('i1-2', 'f1', '糖化血红蛋白', 8.1, '%', 4.0, 6.0, 4, 'nurse'),
      makeIndicator('i1-3', 'f1', '餐后2h血糖', 12.5, 'mmol/L', 3.9, 7.8, 3, 'nurse'),
    ],
    statusLogs: [
      makeStatusLog('sl1-1', 'f1', null, 'pending', 'ph_specialist', '杨专员', 24, '系统自动创建随访任务'),
      makeStatusLog('sl1-2', 'f1', 'pending', 'in_progress', 'nurse', '林护士', 4, '开始执行随访'),
      makeStatusLog('sl1-3', 'f1', 'in_progress', 'pending_review', 'nurse', '林护士', 3.5, '指标录入完成，提交审核'),
      makeStatusLog('sl1-4', 'f1', 'pending_review', 'warned', 'doctor', '陈医生', 3, '审核发现异常指标，转出预警'),
    ],
  },
  {
    id: 'f2',
    patientId: 'p2',
    status: 'warned',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    createdAt: hoursAgo(36),
    updatedAt: hoursAgo(1.5),
    deadlineHours: 48,
    indicators: [
      makeIndicator('i2-1', 'f2', '收缩压', 185, 'mmHg', 90, 140, 2, 'nurse'),
      makeIndicator('i2-2', 'f2', '舒张压', 112, 'mmHg', 60, 90, 2, 'nurse'),
      makeIndicator('i2-3', 'f2', '心率', 88, '次/分', 60, 100, 2, 'nurse'),
    ],
    statusLogs: [
      makeStatusLog('sl2-1', 'f2', null, 'pending', 'ph_specialist', '杨专员', 36, '系统自动创建随访任务'),
      makeStatusLog('sl2-2', 'f2', 'pending', 'in_progress', 'nurse', '林护士', 4, '开始执行随访'),
      makeStatusLog('sl2-3', 'f2', 'in_progress', 'pending_review', 'nurse', '林护士', 2, '指标录入完成，提交审核'),
      makeStatusLog('sl2-4', 'f2', 'pending_review', 'warned', 'doctor', '陈医生', 1.5, '审核发现异常指标，转出预警'),
    ],
  },
  {
    id: 'f3',
    patientId: 'p3',
    status: 'warned',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(1),
    deadlineHours: 48,
    indicators: [
      makeIndicator('i3-1', 'f3', '空腹血糖', 9.2, 'mmol/L', 3.9, 6.1, 8, 'nurse'),
      makeIndicator('i3-2', 'f3', '收缩压', 175, 'mmHg', 90, 140, 8, 'nurse'),
      makeIndicator('i3-3', 'f3', '舒张压', 105, 'mmHg', 60, 90, 8, 'nurse'),
      makeIndicator('i3-4', 'f3', '糖化血红蛋白', 9.3, '%', 4.0, 6.0, 8, 'nurse'),
    ],
    statusLogs: [
      makeStatusLog('sl3-1', 'f3', null, 'pending', 'ph_specialist', '杨专员', 72, '系统自动创建随访任务'),
      makeStatusLog('sl3-2', 'f3', 'pending', 'in_progress', 'nurse', '林护士', 16, '开始执行随访'),
      makeStatusLog('sl3-3', 'f3', 'in_progress', 'pending_review', 'nurse', '林护士', 8, '指标录入完成，提交审核'),
      makeStatusLog('sl3-4', 'f3', 'pending_review', 'warned', 'doctor', '陈医生', 1, '审核发现异常指标，转出预警'),
    ],
  },
  {
    id: 'f4',
    patientId: 'p4',
    status: 'pending',
    assigneeRole: 'nurse',
    assigneeName: '林护士',
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
    deadlineHours: 48,
    indicators: [],
    statusLogs: [
      makeStatusLog('sl4-1', 'f4', null, 'pending', 'ph_specialist', '杨专员', 2, '系统自动创建随访任务'),
    ],
  },
  {
    id: 'f5',
    patientId: 'p5',
    status: 'completed',
    assigneeRole: 'doctor',
    assigneeName: '陈医生',
    createdAt: hoursAgo(96),
    updatedAt: hoursAgo(12),
    deadlineHours: 48,
    indicators: [
      makeIndicator('i5-1', 'f5', '收缩压', 132, 'mmHg', 90, 140, 16, 'nurse'),
      makeIndicator('i5-2', 'f5', '舒张压', 82, 'mmHg', 60, 90, 16, 'nurse'),
    ],
    statusLogs: [
      makeStatusLog('sl5-1', 'f5', null, 'pending', 'ph_specialist', '杨专员', 96, '系统自动创建随访任务'),
      makeStatusLog('sl5-2', 'f5', 'pending', 'in_progress', 'nurse', '林护士', 20, '开始执行随访'),
      makeStatusLog('sl5-3', 'f5', 'in_progress', 'pending_review', 'nurse', '林护士', 16, '指标录入完成，提交审核'),
      makeStatusLog('sl5-4', 'f5', 'pending_review', 'completed', 'doctor', '陈医生', 12, '审核通过，指标正常'),
    ],
  },
  {
    id: 'f6',
    patientId: 'p6',
    status: 'in_progress',
    assigneeRole: 'nurse',
    assigneeName: '林护士',
    createdAt: hoursAgo(52),
    updatedAt: hoursAgo(6),
    deadlineHours: 48,
    indicators: [
      makeIndicator('i6-1', 'f6', '空腹血糖', 7.8, 'mmol/L', 3.9, 6.1, 6, 'nurse'),
    ],
    statusLogs: [
      makeStatusLog('sl6-1', 'f6', null, 'pending', 'ph_specialist', '杨专员', 52, '系统自动创建随访任务'),
      makeStatusLog('sl6-2', 'f6', 'pending', 'in_progress', 'nurse', '林护士', 6, '开始执行随访'),
    ],
  },
  {
    id: 'f7',
    patientId: 'p7',
    status: 'warned',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(0.5),
    deadlineHours: 48,
    indicators: [
      makeIndicator('i7-1', 'f7', '血肌酐', 180, 'μmol/L', 44, 133, 1, 'nurse'),
      makeIndicator('i7-2', 'f7', 'eGFR', 42, 'ml/min', 60, 120, 1, 'nurse'),
      makeIndicator('i7-3', 'f7', '尿蛋白', 2.5, 'g/24h', 0, 0.15, 1, 'nurse'),
    ],
    statusLogs: [
      makeStatusLog('sl7-1', 'f7', null, 'pending', 'ph_specialist', '杨专员', 30, '系统自动创建随访任务'),
      makeStatusLog('sl7-2', 'f7', 'pending', 'in_progress', 'nurse', '林护士', 3, '开始执行随访'),
      makeStatusLog('sl7-3', 'f7', 'in_progress', 'pending_review', 'nurse', '林护士', 1, '指标录入完成，提交审核'),
      makeStatusLog('sl7-4', 'f7', 'pending_review', 'warned', 'doctor', '陈医生', 0.5, '审核发现异常指标，转出预警'),
    ],
  },
  {
    id: 'f8',
    patientId: 'p8',
    status: 'pending',
    assigneeRole: 'nurse',
    assigneeName: '林护士',
    createdAt: hoursAgo(55),
    updatedAt: hoursAgo(55),
    deadlineHours: 48,
    indicators: [],
    statusLogs: [
      makeStatusLog('sl8-1', 'f8', null, 'pending', 'ph_specialist', '杨专员', 55, '系统自动创建随访任务'),
    ],
  },
]

export const initialWarnings: Warning[] = [
  {
    id: 'w1',
    indicatorId: 'i3-1',
    followUpId: 'f3',
    level: 'red',
    ruleName: '血糖持续偏高',
    ruleDesc: '空腹血糖 ≥ 7.0 mmol/L',
    status: 'active',
    assigneeRole: 'doctor',
    assigneeName: '陈医生',
    triggeredAt: hoursAgo(1),
    actions: [],
  },
  {
    id: 'w2',
    indicatorId: 'i3-2',
    followUpId: 'f3',
    level: 'orange',
    ruleName: '血压波动异常',
    ruleDesc: '收缩压 ≥ 180 mmHg',
    status: 'active',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    triggeredAt: hoursAgo(1),
    actions: [],
  },
  {
    id: 'w3',
    indicatorId: 'i2-1',
    followUpId: 'f2',
    level: 'orange',
    ruleName: '血压波动异常',
    ruleDesc: '收缩压 ≥ 180 mmHg 或舒张压 ≥ 110 mmHg',
    status: 'active',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    triggeredAt: hoursAgo(1.5),
    actions: [],
  },
  {
    id: 'w4',
    indicatorId: 'i7-1',
    followUpId: 'f7',
    level: 'red',
    ruleName: '肾功能异常',
    ruleDesc: '血肌酐 ≥ 133 μmol/L',
    status: 'active',
    assigneeRole: 'doctor',
    assigneeName: '陈医生',
    triggeredAt: hoursAgo(0.5),
    actions: [],
  },
  {
    id: 'w5',
    indicatorId: '',
    followUpId: 'f6',
    level: 'yellow',
    ruleName: '随访超时未处理',
    ruleDesc: '随访单超过48小时未进入下一状态',
    status: 'active',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    triggeredAt: hoursAgo(4),
    actions: [],
  },
  {
    id: 'w6',
    indicatorId: '',
    followUpId: 'f8',
    level: 'yellow',
    ruleName: '随访超时未处理',
    ruleDesc: '随访单超过48小时未进入下一状态',
    status: 'active',
    assigneeRole: 'ph_specialist',
    assigneeName: '杨专员',
    triggeredAt: hoursAgo(7),
    actions: [],
  },
  {
    id: 'w7',
    indicatorId: 'i1-1',
    followUpId: 'f1',
    level: 'red',
    ruleName: '血糖持续偏高',
    ruleDesc: '空腹血糖 ≥ 7.0 mmol/L',
    status: 'processing',
    assigneeRole: 'doctor',
    assigneeName: '陈医生',
    triggeredAt: hoursAgo(3),
    actions: [
      makeWarningAction('wa7-1', 'w7', 'remind', 'ph_specialist', '杨专员', 2, '已提醒负责人处理'),
    ],
  },
]

export { roleNames }
