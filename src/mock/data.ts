import type {
    AnomalyReport,
    Elder,
    MedicationReminder,
    OperationLog,
    SupplementRecord,
} from '@/types'

export const MOCK_ELDERS: Elder[] = [
  { id: 'E001', name: '张秀兰', bedNo: '101-1', age: 82, conditions: ['高血压', '糖尿病'] },
  { id: 'E002', name: '王福生', bedNo: '101-2', age: 78, conditions: ['冠心病'] },
  { id: 'E003', name: '李桂芳', bedNo: '102-1', age: 85, conditions: ['高血压', '骨质疏松'] },
  { id: 'E004', name: '陈建国', bedNo: '102-2', age: 76, conditions: ['糖尿病'] },
  { id: 'E005', name: '刘淑珍', bedNo: '103-1', age: 88, conditions: ['阿尔茨海默症', '高血压'] },
  { id: 'E006', name: '赵明远', bedNo: '103-2', age: 74, conditions: ['帕金森'] },
  { id: 'E007', name: '孙秀英', bedNo: '201-1', age: 81, conditions: ['冠心病', '高血脂'] },
  { id: 'E008', name: '周德明', bedNo: '201-2', age: 79, conditions: ['糖尿病', '高血压'] },
]

const today = new Date().toISOString().split('T')[0]

export const MOCK_REMINDERS: MedicationReminder[] = [
  {
    id: 'R001', elderId: 'E001', elderName: '张秀兰', bedNo: '101-1',
    medicationName: '氨氯地平片', dosage: '5mg', scheduledTime: `${today}T06:30:00`,
    status: 'confirmed', caregiverId: 'CG001', caregiverName: '李小燕',
    confirmedAt: `${today}T06:28:00`,
  },
  {
    id: 'R002', elderId: 'E002', elderName: '王福生', bedNo: '101-2',
    medicationName: '阿司匹林肠溶片', dosage: '100mg', scheduledTime: `${today}T07:00:00`,
    status: 'pending', caregiverId: 'CG001', caregiverName: '李小燕',
  },
  {
    id: 'R003', elderId: 'E003', elderName: '李桂芳', bedNo: '102-1',
    medicationName: '缬沙坦胶囊', dosage: '80mg', scheduledTime: `${today}T07:00:00`,
    status: 'abnormal', caregiverId: 'CG002', caregiverName: '王小红',
    abnormalNote: '老人表示头晕不愿服药', reportId: 'AR001',
  },
  {
    id: 'R004', elderId: 'E004', elderName: '陈建国', bedNo: '102-2',
    medicationName: '二甲双胍片', dosage: '500mg', scheduledTime: `${today}T08:00:00`,
    status: 'pending', caregiverId: 'CG002', caregiverName: '王小红',
  },
  {
    id: 'R005', elderId: 'E005', elderName: '刘淑珍', bedNo: '103-1',
    medicationName: '多奈哌齐片', dosage: '5mg', scheduledTime: `${today}T08:30:00`,
    status: 'timeout', caregiverId: 'CG001', caregiverName: '李小燕',
    reportId: 'AR003',
  },
  {
    id: 'R006', elderId: 'E006', elderName: '赵明远', bedNo: '103-2',
    medicationName: '左旋多巴片', dosage: '250mg', scheduledTime: `${today}T09:00:00`,
    status: 'pending', caregiverId: 'CG003', caregiverName: '张丽华',
  },
  {
    id: 'R007', elderId: 'E007', elderName: '孙秀英', bedNo: '201-1',
    medicationName: '阿托伐他汀钙片', dosage: '20mg', scheduledTime: `${today}T18:00:00`,
    status: 'confirmed', caregiverId: 'CG003', caregiverName: '张丽华',
    confirmedAt: `${today}T18:05:00`,
  },
  {
    id: 'R008', elderId: 'E008', elderName: '周德明', bedNo: '201-2',
    medicationName: '格列美脲片', dosage: '2mg', scheduledTime: `${today}T07:30:00`,
    status: 'abnormal', caregiverId: 'CG001', caregiverName: '李小燕',
    abnormalNote: '服药后出现皮疹', reportId: 'AR002',
  },
  {
    id: 'R009', elderId: 'E001', elderName: '张秀兰', bedNo: '101-1',
    medicationName: '二甲双胍缓释片', dosage: '500mg', scheduledTime: `${today}T12:00:00`,
    status: 'pending', caregiverId: 'CG001', caregiverName: '李小燕',
  },
  {
    id: 'R010', elderId: 'E005', elderName: '刘淑珍', bedNo: '103-1',
    medicationName: '硝苯地平控释片', dosage: '30mg', scheduledTime: `${today}T06:30:00`,
    status: 'confirmed', caregiverId: 'CG001', caregiverName: '李小燕',
    confirmedAt: `${today}T06:32:00`,
  },
  {
    id: 'R011', elderId: 'E003', elderName: '李桂芳', bedNo: '102-1',
    medicationName: '碳酸钙D3片', dosage: '600mg', scheduledTime: `${today}T08:00:00`,
    status: 'pending', caregiverId: 'CG002', caregiverName: '王小红',
  },
  {
    id: 'R012', elderId: 'E006', elderName: '赵明远', bedNo: '103-2',
    medicationName: '左旋多巴片', dosage: '250mg', scheduledTime: `${today}T14:00:00`,
    status: 'pending', caregiverId: 'CG003', caregiverName: '张丽华',
  },
]

const MOCK_SUPPLEMENTS: SupplementRecord[] = [
  {
    id: 'S001', reportId: 'AR004', supplementContent: '补充：老人后续同意服药，血压已恢复至140/85mmHg，持续观察中',
    supplementedBy: 'CG001', supplementedAt: `${today}T10:15:00`,
  },
  {
    id: 'S002', reportId: 'AR004', supplementContent: '二次补录：家属电话确认已知悉，要求继续观察',
    supplementedBy: 'CG001', supplementedAt: `${today}T11:30:00`,
  },
  {
    id: 'S003', reportId: 'AR005', supplementContent: '补录：皮疹已消退，老人无其他不适，已通知家属',
    supplementedBy: 'CG002', supplementedAt: `${today}T14:20:00`,
  } as any,
]

export const MOCK_REPORTS: AnomalyReport[] = [
  {
    id: 'AR001', reminderId: 'R003', elderId: 'E003', elderName: '李桂芳', bedNo: '102-1',
    reporterId: 'CG002', reporterName: '王小红', anomalyType: 'medication_refused',
    description: '老人今晨表示头晕，拒绝服用缬沙坦胶囊。经劝说后仍不愿服用，需进一步评估。',
    severity: 'medium', status: 'submitted', submittedAt: `${today}T07:15:00`,
    supplementHistory: [], involvesFamily: true, familyNotified: false, familyConfirmed: false,
    attachments: [],
  },
  {
    id: 'AR002', reminderId: 'R008', elderId: 'E008', elderName: '周德明', bedNo: '201-2',
    reporterId: 'CG001', reporterName: '李小燕', anomalyType: 'adverse_reaction',
    description: '服用格列美脲片约30分钟后，老人手臂出现红色皮疹，伴有轻微瘙痒。',
    severity: 'high', status: 'submitted', submittedAt: `${today}T08:10:00`,
    supplementHistory: [], involvesFamily: true, familyNotified: true, familyConfirmed: false,
    attachments: [
      { id: 'A001', name: '皮疹照片.jpg', size: 2450000, type: 'image/jpeg', uploadedAt: `${today}T08:12:00`, uploadedBy: '李小燕' },
    ],
  },
  {
    id: 'AR003', reminderId: 'R005', elderId: 'E005', elderName: '刘淑珍', bedNo: '103-1',
    reporterId: 'CG001', reporterName: '李小燕', anomalyType: 'timeout',
    description: '多奈哌齐片提醒超时未处理。老人患有阿尔茨海默症，无法自行服药，需护工立即协助。',
    severity: 'high', status: 'approved', submittedAt: `${today}T09:00:00`,
    reviewedBy: 'SV001', reviewedAt: `${today}T09:15:00`,
    supplementHistory: [], involvesFamily: true, familyNotified: true, familyConfirmed: true,
    attachments: [],
  },
  {
    id: 'AR004', reminderId: 'R_prev_1', elderId: 'E001', elderName: '张秀兰', bedNo: '101-1',
    reporterId: 'CG001', reporterName: '李小燕', anomalyType: 'medication_refused',
    description: '老人晨起血压偏高（165/95mmHg），表示不适不愿服药。',
    severity: 'medium', status: 'rejected', submittedAt: `${today}T09:30:00`,
    reviewedBy: 'SV001', reviewedAt: `${today}T09:45:00`,
    rejectionReason: '请补充后续血压监测记录及老人最终是否服药的信息，当前描述不足以判断严重程度。',
    supplementHistory: MOCK_SUPPLEMENTS.filter(s => s.reportId === 'AR004'),
    involvesFamily: true, familyNotified: false, familyConfirmed: false,
    attachments: [
      { id: 'A002', name: '血压监测记录.pdf', size: 125000, type: 'application/pdf', uploadedAt: `${today}T10:10:00`, uploadedBy: '李小燕' },
    ],
  },
  {
    id: 'AR005', reminderId: 'R_prev_2', elderId: 'E004', elderName: '陈建国', bedNo: '102-2',
    reporterId: 'CG002', reporterName: '王小红', anomalyType: 'adverse_reaction',
    description: '服用二甲双胍后出现轻微胃肠道不适，恶心但未呕吐。',
    severity: 'low', status: 'supplemented', submittedAt: `${today}T10:00:00`,
    reviewedBy: 'SV001', reviewedAt: `${today}T10:20:00`,
    rejectionReason: '请补充老人当前血糖值及是否有既往类似反应。',
    supplementHistory: MOCK_SUPPLEMENTS.filter(s => s.reportId === 'AR005'),
    involvesFamily: false, familyNotified: false, familyConfirmed: false,
    attachments: [],
  },
]

export const MOCK_LOGS: OperationLog[] = [
  { id: 'L001', entityType: 'reminder', entityId: 'R001', action: 'confirm', operatorId: 'CG001', operatorName: '李小燕', operatorRole: 'caregiver', timestamp: `${today}T06:28:00`, detail: '确认服药：氨氯地平片 5mg' },
  { id: 'L002', entityType: 'reminder', entityId: 'R003', action: 'mark_abnormal', operatorId: 'CG002', operatorName: '王小红', operatorRole: 'caregiver', timestamp: `${today}T07:10:00`, detail: '标记异常：老人表示头晕不愿服药' },
  { id: 'L003', entityType: 'report', entityId: 'AR001', action: 'submit', operatorId: 'CG002', operatorName: '王小红', operatorRole: 'caregiver', timestamp: `${today}T07:15:00`, detail: '提交异常上报：拒服药物' },
  { id: 'L004', entityType: 'reminder', entityId: 'R008', action: 'mark_abnormal', operatorId: 'CG001', operatorName: '李小燕', operatorRole: 'caregiver', timestamp: `${today}T08:05:00`, detail: '标记异常：服药后出现皮疹' },
  { id: 'L005', entityType: 'report', entityId: 'AR002', action: 'submit', operatorId: 'CG001', operatorName: '李小燕', operatorRole: 'caregiver', timestamp: `${today}T08:10:00`, detail: '提交异常上报：不良反应' },
  { id: 'L006', entityType: 'report', entityId: 'AR003', action: 'approve', operatorId: 'SV001', operatorName: '陈主管', operatorRole: 'supervisor', timestamp: `${today}T09:15:00`, detail: '审批通过：超时异常' },
  { id: 'L007', entityType: 'report', entityId: 'AR004', action: 'reject', operatorId: 'SV001', operatorName: '陈主管', operatorRole: 'supervisor', timestamp: `${today}T09:45:00`, detail: '驳回原因：请补充后续血压监测记录及老人最终是否服药的信息' },
  { id: 'L008', entityType: 'report', entityId: 'AR004', action: 'supplement', operatorId: 'CG001', operatorName: '李小燕', operatorRole: 'caregiver', timestamp: `${today}T10:15:00`, detail: '补录：老人后续同意服药，血压已恢复' },
  { id: 'L009', entityType: 'report', entityId: 'AR004', action: 'supplement', operatorId: 'CG001', operatorName: '李小燕', operatorRole: 'caregiver', timestamp: `${today}T11:30:00`, detail: '二次补录：家属电话确认已知悉' },
  { id: 'L010', entityType: 'report', entityId: 'AR005', action: 'reject', operatorId: 'SV001', operatorName: '陈主管', operatorRole: 'supervisor', timestamp: `${today}T10:20:00`, detail: '驳回原因：请补充老人当前血糖值' },
  { id: 'L011', entityType: 'report', entityId: 'AR005', action: 'supplement', operatorId: 'CG002', operatorName: '王小红', operatorRole: 'caregiver', timestamp: `${today}T14:20:00`, detail: '补录：皮疹已消退，老人无其他不适' },
  { id: 'L012', entityType: 'reminder', entityId: 'R007', action: 'confirm', operatorId: 'CG003', operatorName: '张丽华', operatorRole: 'caregiver', timestamp: `${today}T18:05:00`, detail: '确认服药：阿托伐他汀钙片 20mg' },
  { id: 'L013', entityType: 'report', entityId: 'AR002', action: 'family_notify', operatorId: 'SW001', operatorName: '赵社工', operatorRole: 'social_worker', timestamp: `${today}T08:30:00`, detail: '已通知家属：周德明不良反应' },
]
