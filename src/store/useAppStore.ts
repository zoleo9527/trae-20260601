import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import type {
  Patient,
  Assessment,
  Prescription,
  Appointment,
  Therapist,
  PrescriptionStatus,
} from '@/types'

const THERAPISTS: Therapist[] = [
  { id: 't1', name: '王建国', specialty: '骨科康复' },
  { id: 't2', name: '李敏', specialty: '儿童康复' },
  { id: 't3', name: '张伟', specialty: '神经康复' },
  { id: 't4', name: '陈晓华', specialty: '老年康复' },
]

const PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: '赵明辉',
    gender: 'male',
    age: 45,
    phone: '13800001001',
    category: 'post_surgical',
    categoryLabel: '术后康复',
    diagnosis: '右膝前交叉韧带重建术后',
    createdAt: '2026-05-20T09:00:00',
    updatedAt: '2026-05-20T09:00:00',
  },
  {
    id: 'p2',
    name: '林小雨',
    gender: 'female',
    age: 8,
    phone: '13800001002',
    category: 'pediatric_posture',
    categoryLabel: '儿童姿态矫正',
    diagnosis: '特发性脊柱侧弯(Cobb角18°)',
    createdAt: '2026-05-22T10:30:00',
    updatedAt: '2026-05-22T10:30:00',
  },
  {
    id: 'p3',
    name: '孙桂芳',
    gender: 'female',
    age: 72,
    phone: '13800001003',
    category: 'elderly_balance',
    categoryLabel: '老人平衡训练',
    diagnosis: '帕金森病(Hoehn-Yahr II期)、反复跌倒',
    createdAt: '2026-05-25T14:00:00',
    updatedAt: '2026-05-25T14:00:00',
  },
]

const ASSESSMENTS: Assessment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    therapistId: 't1',
    therapistName: '王建国',
    date: '2026-05-21',
    chiefComplaint: '右膝关节术后3周，活动受限，行走不稳',
    presentIllness:
      '患者3周前因右膝前交叉韧带断裂行关节镜下ACL重建术，术后石膏固定2周，目前膝关节ROM 0-90°，股四头肌肌力3+级，腘绳肌肌力3级，行走时右侧负重不足，上下楼梯需扶手。',
    scales: [
      { id: 's1_1', name: 'Lysholm膝关节评分', score: 52, maxScore: 100, interpretation: '差(<65为差)，主要失分项：跛行、支撑、楼梯、下蹲' },
      { id: 's1_2', name: 'IKDC主观评分', score: 38, maxScore: 100, interpretation: '显著异常，活动度及稳定性均受限' },
      { id: 's1_3', name: 'Tegner活动水平', score: 2, maxScore: 10, interpretation: '术前7级→术后2级，目标恢复至5级' },
    ],
    painPoints: [
      { id: 'pp1_1', region: '右膝前侧', side: 'right', severity: 5, nature: '酸痛', notes: '屈膝>90°时加重' },
      { id: 'pp1_2', region: '右膝内侧', side: 'right', severity: 3, nature: '牵拉痛', notes: '被动伸膝末期出现' },
    ],
    contraindications: [
      { id: 'ci1_1', type: 'absolute', description: '禁止主动开放链伸膝', reason: 'ACL移植物尚未完成韧带化' },
      { id: 'ci1_2', type: 'relative', description: '避免屈膝>120°负重', reason: '术后6周内移植物张力保护' },
    ],
    conclusion:
      '右膝ACL重建术后3周，ROM受限(0-90°)，股四头肌及腘绳肌肌力减退，本体感觉下降。需分阶段恢复ROM、肌力及功能性活动，严格遵循移植物保护原则。',
    createdAt: '2026-05-21T10:00:00',
  },
  {
    id: 'a2',
    patientId: 'p2',
    therapistId: 't2',
    therapistName: '李敏',
    date: '2026-05-23',
    chiefComplaint: '发现双肩不等高、背部不对称2月',
    presentIllness:
      '8岁女童，学校体检发现脊柱侧弯，外院X光示胸椎右侧弯Cobb角18°(T6-T10)，Adam前屈试验(+)，双肩不等高右高左低，左侧腰弯明显。无疼痛主诉，心肺功能正常。',
    scales: [
      { id: 's2_1', name: 'Cobb角测量', score: 18, maxScore: 90, interpretation: '轻度侧弯(10-20°)，需密切观察及保守治疗' },
      { id: 's2_2', name: 'SRS-22r问卷', score: 82, maxScore: 110, interpretation: '功能及外观维度得分偏低' },
      { id: 's2_3', name: '躯干旋转角度(ATR)', score: 6, maxScore: 30, interpretation: '中度旋转(5-7°需干预)' },
    ],
    painPoints: [
      { id: 'pp2_1', region: '左侧腰背部', side: 'left', severity: 2, nature: '酸胀', notes: '久坐后出现' },
    ],
    contraindications: [
      { id: 'ci2_1', type: 'absolute', description: '禁止单侧负重运动', reason: '可能加重侧弯弧度' },
      { id: 'ci2_2', type: 'absolute', description: '禁止过度脊柱旋转动作', reason: '增加椎体旋转畸形风险' },
      { id: 'ci2_3', type: 'relative', description: '避免长时间不对称姿势', reason: '姿势性加重因素' },
    ],
    conclusion:
      '特发性脊柱侧弯(胸椎右凸Cobb 18°)，ATR 6°，进展风险中等(Risser 0)。需行特异性侧弯体操(SSE)配合姿势管理，目标控制Cobb角进展，改善躯干对称性。',
    createdAt: '2026-05-23T11:00:00',
  },
  {
    id: 'a3',
    patientId: 'p3',
    therapistId: 't4',
    therapistName: '陈晓华',
    date: '2026-05-26',
    chiefComplaint: '行走不稳、反复跌倒半年',
    presentIllness:
      '72岁女性，帕金森病5年，Hoehn-Yahr II期，服美多芭250mg tid。近半年跌倒3次(均为向后跌倒)，BBS评分38/56，起立-行走测试18秒，存在冻结步态，后拉试验(+)。合并腰椎退行性变、双膝骨关节炎。',
    scales: [
      { id: 's3_1', name: 'Berg平衡量表(BBS)', score: 38, maxScore: 56, interpretation: '跌倒高风险(<40分)' },
      { id: 's3_2', name: '计时起立-行走(TUG)', score: 18, maxScore: 30, interpretation: '>14秒提示跌倒高风险' },
      { id: 's3_3', name: 'UPDRS-III运动评分', score: 28, maxScore: 108, interpretation: '中度运动障碍' },
      { id: 's3_4', name: 'Mini-BESTest', score: 14, maxScore: 28, interpretation: '平衡能力显著下降(<19分)' },
    ],
    painPoints: [
      { id: 'pp3_1', region: '双膝', side: 'bilateral', severity: 4, nature: '钝痛', notes: '负重及上下楼梯时加重' },
      { id: 'pp3_2', region: '腰骶部', side: 'center', severity: 3, nature: '酸痛', notes: '久站后明显' },
    ],
    contraindications: [
      { id: 'ci3_1', type: 'absolute', description: '禁止快速转身训练', reason: '帕金森患者易诱发冻结步态及跌倒' },
      { id: 'ci3_2', type: 'relative', description: '避免闭眼平衡训练超过2分钟', reason: '视觉代偿受限时跌倒风险高' },
      { id: 'ci3_3', type: 'relative', description: '避免过度疲劳训练', reason: '帕金森运动症状随疲劳加重' },
    ],
    conclusion:
      '帕金森病(H-Y II期)伴平衡障碍(BBS 38分)、冻结步态及反复跌倒。需综合平衡训练、步态训练及安全策略，改善动态平衡及功能性活动能力，降低跌倒风险。',
    createdAt: '2026-05-26T15:00:00',
  },
]

const PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx1',
    patientId: 'p1',
    assessmentId: 'a1',
    version: 2,
    status: 'adjusted',
    therapistId: 't1',
    therapistName: '王建国',
    reviewerId: 'dir1',
    reviewerName: '刘主任',
    reviewedAt: '2026-05-24T09:00:00',
    reviewComment: '第二阶段增加闭链运动比例，减少开链伸膝频次，保护移植物',
    goals: [
      { id: 'g1_1', description: '膝关节ROM恢复至0-120°', targetDate: '2026-06-21', measurable: '关节角度测量', priority: 'high' },
      { id: 'g1_2', description: '股四头肌肌力恢复至4级', targetDate: '2026-07-21', measurable: 'MMT肌力分级', priority: 'high' },
      { id: 'g1_3', description: '无辅助上下楼梯', targetDate: '2026-08-21', measurable: '功能性活动评估', priority: 'medium' },
    ],
    treatmentPlan: [
      { id: 'tp1_1', type: '关节活动度训练', name: '被动/主动辅助屈膝训练', frequency: '每日2次', duration: '15分钟', notes: '缓慢推进至120°，疼痛<4/10' },
      { id: 'tp1_2', type: '肌力训练', name: '闭链运动(靠球静蹲、迷你深蹲)', frequency: '每日1次', duration: '20分钟', notes: '0-45°范围内，避免开链伸膝' },
      { id: 'tp1_3', type: '本体感觉训练', name: '双足平衡板站立', frequency: '每日1次', duration: '10分钟', notes: '扶栏杆保护下进行' },
      { id: 'tp1_4', type: '物理因子', name: 'NMES股四头肌电刺激', frequency: '每周3次', duration: '20分钟', notes: '配合主动收缩' },
      { id: 'tp1_5', type: '功能训练', name: '台阶训练(低台阶)', frequency: '每周3次', duration: '10分钟', notes: '扶手辅助，逐步增加高度' },
    ],
    rationale:
      '基于ACL重建术后3周评估：ROM 0-90°需优先恢复至120°以满足功能性活动；股四头肌3+级需强化但须避免开链伸膝损伤移植物；本体感觉下降需早期介入。第二阶段(主任调整)：增加闭链运动占比(60%→75%)，减少开链训练频次，确保移植物保护。',
    createdAt: '2026-05-22T14:00:00',
  },
  {
    id: 'rx2',
    patientId: 'p2',
    assessmentId: 'a2',
    version: 1,
    status: 'approved',
    therapistId: 't2',
    therapistName: '李敏',
    reviewerId: 'dir1',
    reviewerName: '刘主任',
    reviewedAt: '2026-05-26T10:00:00',
    reviewComment: '处方合理，侧弯体操方案规范，建议加强家庭训练依从性管理',
    goals: [
      { id: 'g2_1', description: 'Cobb角控制在20°以内', targetDate: '2026-11-23', measurable: '6个月后X光复查Cobb角', priority: 'high' },
      { id: 'g2_2', description: 'ATR降低至3°以下', targetDate: '2026-08-23', measurable: '脊柱测量仪ATR读数', priority: 'high' },
      { id: 'g2_3', description: '改善双肩对称性', targetDate: '2026-08-23', measurable: '肩高差<1cm', priority: 'medium' },
    ],
    treatmentPlan: [
      { id: 'tp2_1', type: '特异性侧弯体操(SSE)', name: 'Schroth方法: 右胸凸矫正体式', frequency: '每周5次', duration: '30分钟', notes: '重点: 右侧肋笼打开+左侧腰弯矫正' },
      { id: 'tp2_2', type: '核心稳定训练', name: '腹横肌/多裂肌激活', frequency: '每周5次', duration: '15分钟', notes: '仰卧位及四点跪位' },
      { id: 'tp2_3', type: '姿势管理', name: '坐姿矫正训练', frequency: '每日3次', duration: '5分钟/次', notes: '学校+家庭环境' },
      { id: 'tp2_4', type: '牵伸训练', name: '右侧胸椎旋转肌群牵伸', frequency: '每日2次', duration: '10分钟', notes: '凹侧牵伸为主' },
    ],
    rationale:
      'Cobb角18°处于进展关键期(Risser 0)，ATR 6°提示旋转加重风险。SSE(Schroth方法)为轻度侧弯(10-20°)一线循证方案，配合核心稳定及姿势管理可改善躯干对称性，降低进展风险。运动处方以凹侧打开、凸侧收紧为原则。',
    createdAt: '2026-05-24T16:00:00',
  },
  {
    id: 'rx3',
    patientId: 'p3',
    assessmentId: 'a3',
    version: 1,
    status: 'pending_review',
    therapistId: 't4',
    therapistName: '陈晓华',
    goals: [
      { id: 'g3_1', description: 'BBS评分提升至45分以上', targetDate: '2026-08-26', measurable: 'Berg平衡量表评分', priority: 'high' },
      { id: 'g3_2', description: 'TUG时间缩短至12秒内', targetDate: '2026-08-26', measurable: '计时起立-行走测试', priority: 'high' },
      { id: 'g3_3', description: '3个月内跌倒次数减少50%', targetDate: '2026-08-26', measurable: '跌倒日志记录', priority: 'high' },
      { id: 'g3_4', description: '独立完成室内平地行走', targetDate: '2026-07-26', measurable: '功能性活动评估', priority: 'medium' },
    ],
    treatmentPlan: [
      { id: 'tp3_1', type: '静态平衡训练', name: '双足/单足站立(睁眼→闭眼)', frequency: '每日2次', duration: '10分钟', notes: '靠墙保护，闭眼<2分钟' },
      { id: 'tp3_2', type: '动态平衡训练', name: '重心转移及迈步训练', frequency: '每日1次', duration: '15分钟', notes: '前/后/侧向重心转移' },
      { id: 'tp3_3', type: '步态训练', name: '视觉提示步态训练(地面横线)', frequency: '每周5次', duration: '20分钟', notes: '改善冻结步态，步幅>45cm' },
      { id: 'tp3_4', type: '力量训练', name: '下肢抗阻训练(弹力带)', frequency: '每周3次', duration: '15分钟', notes: '臀中肌/股四头肌为主' },
      { id: 'tp3_5', type: '安全策略', name: '跌倒预防教育及后拉反应训练', frequency: '每周2次', duration: '10分钟', notes: '家属共同参与' },
    ],
    rationale:
      'BBS 38分(<40)提示跌倒高风险，TUG 18秒(>14秒)确认功能性行走能力下降。帕金森II期平衡障碍核心为：姿势不稳、冻结步态、后拉反射异常。处方以平衡+步态训练为主，配合力量训练及安全策略教育，遵循PD-specific康复指南(LPV 2023)。',
    createdAt: '2026-05-27T11:00:00',
  },
]

const PRESCRIPTION_HISTORY: Prescription[] = [
  {
    id: 'rx1',
    patientId: 'p1',
    assessmentId: 'a1',
    version: 1,
    status: 'archived',
    therapistId: 't1',
    therapistName: '王建国',
    goals: [
      { id: 'g1_1_v1', description: '膝关节ROM恢复至0-120°', targetDate: '2026-06-21', measurable: '关节角度测量', priority: 'high' },
      { id: 'g1_2_v1', description: '股四头肌肌力恢复至4级', targetDate: '2026-07-21', measurable: 'MMT肌力分级', priority: 'high' },
    ],
    treatmentPlan: [
      { id: 'tp1_1_v1', type: '关节活动度训练', name: '被动/主动辅助屈膝训练', frequency: '每日2次', duration: '15分钟', notes: '缓慢推进' },
      { id: 'tp1_2_v1', type: '肌力训练', name: '开链+闭链混合训练', frequency: '每日1次', duration: '20分钟', notes: '包括开链伸膝' },
      { id: 'tp1_3_v1', type: '本体感觉训练', name: '双足平衡板站立', frequency: '每日1次', duration: '10分钟', notes: '扶栏杆保护' },
    ],
    rationale:
      '基于ACL重建术后3周评估：ROM 0-90°需优先恢复至120°，股四头肌3+级需强化，本体感觉下降需早期介入。初版方案含开链伸膝训练。',
    createdAt: '2026-05-22T14:00:00',
  },
]

const APPOINTMENTS: Appointment[] = [
  { id: 'ap1', patientId: 'p1', prescriptionId: 'rx1', therapistId: 't1', therapistName: '王建国', date: '2026-06-09', timeSlot: '09:00-09:45', type: '关节活动度训练', status: 'scheduled', notes: '今日重点: 屈膝推进至100°', createdAt: '2026-06-01T08:00:00' },
  { id: 'ap2', patientId: 'p1', prescriptionId: 'rx1', therapistId: 't1', therapistName: '王建国', date: '2026-06-09', timeSlot: '14:00-14:45', type: '肌力训练+NMES', status: 'scheduled', notes: '闭链运动为主', createdAt: '2026-06-01T08:00:00' },
  { id: 'ap3', patientId: 'p2', prescriptionId: 'rx2', therapistId: 't2', therapistName: '李敏', date: '2026-06-09', timeSlot: '10:00-10:45', type: 'Schroth侧弯体操', status: 'scheduled', notes: '右胸凸矫正体式强化', createdAt: '2026-06-01T08:00:00' },
  { id: 'ap4', patientId: 'p2', prescriptionId: 'rx2', therapistId: 't2', therapistName: '李敏', date: '2026-06-10', timeSlot: '10:00-10:45', type: '核心稳定+姿势管理', status: 'scheduled', notes: '', createdAt: '2026-06-01T08:00:00' },
  { id: 'ap5', patientId: 'p3', prescriptionId: 'rx3', therapistId: 't4', therapistName: '陈晓华', date: '2026-06-09', timeSlot: '11:00-11:45', type: '静态平衡训练', status: 'scheduled', notes: '闭眼训练<2分钟', createdAt: '2026-06-01T08:00:00' },
  { id: 'ap6', patientId: 'p3', prescriptionId: 'rx3', therapistId: 't4', therapistName: '陈晓华', date: '2026-06-09', timeSlot: '15:00-15:45', type: '步态训练(视觉提示)', status: 'scheduled', notes: '地面横线辅助', createdAt: '2026-06-01T08:00:00' },
  { id: 'ap7', patientId: 'p3', prescriptionId: 'rx3', therapistId: 't4', therapistName: '陈晓华', date: '2026-06-10', timeSlot: '11:00-11:45', type: '下肢力量+安全策略', status: 'scheduled', notes: '家属参与', createdAt: '2026-06-01T08:00:00' },
]

interface AppState {
  currentRole: Role
  patients: Patient[]
  assessments: Assessment[]
  prescriptions: Prescription[]
  prescriptionHistory: Prescription[]
  appointments: Appointment[]
  therapists: Therapist[]

  setCurrentRole: (role: Role) => void
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Patient
  addAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => Assessment
  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'version'>) => Prescription
  adjustPrescription: (id: string, updates: Partial<Prescription>, comment: string) => void
  approvePrescription: (id: string, reviewerId: string, reviewerName: string, comment: string) => void
  addAppointment: (apt: Omit<Appointment, 'id' | 'createdAt'>) => Appointment
  getPatientById: (id: string) => Patient | undefined
  getAssessmentsByPatient: (patientId: string) => Assessment[]
  getPrescriptionsByPatient: (patientId: string) => Prescription[]
  getPrescriptionHistory: (prescriptionId: string) => Prescription[]
  getAppointmentsByPatient: (patientId: string) => Appointment[]
  getAppointmentsByPrescription: (prescriptionId: string) => Appointment[]
}

export const useAppStore = create<AppState>()((set, get) => ({
  currentRole: 'therapist',
  patients: PATIENTS,
  assessments: ASSESSMENTS,
  prescriptions: PRESCRIPTIONS,
  prescriptionHistory: PRESCRIPTION_HISTORY,
  appointments: APPOINTMENTS,
  therapists: THERAPISTS,

  setCurrentRole: (role) => set({ currentRole: role }),

  addPatient: (data) => {
    const patient: Patient = {
      ...data,
      id: `p${uuid().slice(0, 6)}`,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
    }
    set((s) => ({ patients: [...s.patients, patient] }))
    return patient
  },

  addAssessment: (data) => {
    const assessment: Assessment = {
      ...data,
      id: `a${uuid().slice(0, 6)}`,
      createdAt: dayjs().toISOString(),
    }
    set((s) => ({ assessments: [...s.assessments, assessment] }))
    return assessment
  },

  addPrescription: (data) => {
    const prescription: Prescription = {
      ...data,
      id: `rx${uuid().slice(0, 6)}`,
      version: 1,
      createdAt: dayjs().toISOString(),
    }
    set((s) => ({ prescriptions: [...s.prescriptions, prescription] }))
    return prescription
  },

  adjustPrescription: (id, updates, comment) => {
    const state = get()
    const existing = state.prescriptions.find((p) => p.id === id)
    if (!existing) return

    const archived: Prescription = {
      ...existing,
      status: 'archived',
    }
    const adjusted: Prescription = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      status: 'adjusted' as PrescriptionStatus,
      reviewComment: comment,
      reviewedAt: dayjs().toISOString(),
    }
    set({
      prescriptions: state.prescriptions.map((p) => (p.id === id ? adjusted : p)),
      prescriptionHistory: [...state.prescriptionHistory, archived],
    })
  },

  approvePrescription: (id, reviewerId, reviewerName, comment) => {
    set((s) => ({
      prescriptions: s.prescriptions.map((p) =>
        p.id === id
          ? { ...p, status: 'approved' as PrescriptionStatus, reviewerId, reviewerName, reviewedAt: dayjs().toISOString(), reviewComment: comment }
          : p
      ),
    }))
  },

  addAppointment: (data) => {
    const apt: Appointment = {
      ...data,
      id: `ap${uuid().slice(0, 6)}`,
      createdAt: dayjs().toISOString(),
    }
    set((s) => ({ appointments: [...s.appointments, apt] }))
    return apt
  },

  getPatientById: (id) => get().patients.find((p) => p.id === id),
  getAssessmentsByPatient: (patientId) => get().assessments.filter((a) => a.patientId === patientId),
  getPrescriptionsByPatient: (patientId) => get().prescriptions.filter((p) => p.patientId === patientId),
  getPrescriptionHistory: (prescriptionId) => get().prescriptionHistory.filter((p) => p.id === prescriptionId),
  getAppointmentsByPatient: (patientId) => get().appointments.filter((a) => a.patientId === patientId),
  getAppointmentsByPrescription: (prescriptionId) => get().appointments.filter((a) => a.prescriptionId === prescriptionId),
}))
