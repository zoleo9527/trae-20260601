import { loadData, saveData, initDataIfEmpty, type DataStore } from './store.js'

export interface Diversion {
  id: string
  examNo: string
  patientName: string
  patientAge: number
  patientGender: string
  status: 'pending' | 'diverted' | 'confirmed' | 'completed' | 'rejected' | 'approved'
  assignedDept: string | null
  assignedDoctor: string | null
  urgency: 'normal' | 'urgent' | 'timeout'
  anomalyType: string[]
  createdAt: string
  updatedAt: string
}

export interface DiversionLog {
  id: string
  diversionId: string
  operatorRole: 'front_desk' | 'doctor' | 'reviewer'
  operatorName: string
  action: string
  detail: string
  createdAt: string
}

export interface Attachment {
  id: string
  diversionId: string
  fileName: string
  fileType: string
  fileUrl: string | null
  uploadedAt: string | null
  uploadedBy: string | null
}

export interface MissedItem {
  id: string
  examNo: string
  patientName: string
  itemName: string
  requiredDept: string
  status: 'pending' | 'reminded' | 'confirmed' | 'completed' | 'closed'
  remindedAt: string | null
  confirmedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface MissedItemLog {
  id: string
  missedItemId: string
  operatorRole: 'front_desk' | 'doctor' | 'reviewer'
  operatorName: string
  action: string
  detail: string
  createdAt: string
}

let idCounter = 5000

function nextId(prefix: string): string {
  idCounter++
  return `${prefix}${idCounter}`
}

const initialData: DataStore = {
  diversions: [
    { id: 'dv1001', examNo: 'EX20260604001', patientName: '张伟', patientAge: 45, patientGender: '男', status: 'pending', assignedDept: null, assignedDoctor: null, urgency: 'urgent', anomalyType: ['missing_material'], createdAt: '2026-06-04T08:30:00.000Z', updatedAt: '2026-06-04T08:30:00.000Z' },
    { id: 'dv1002', examNo: 'EX20260604002', patientName: '李娜', patientAge: 32, patientGender: '女', status: 'diverted', assignedDept: '内科', assignedDoctor: '王医生', urgency: 'normal', anomalyType: ['missing_material'], createdAt: '2026-06-04T08:45:00.000Z', updatedAt: '2026-06-04T09:10:00.000Z' },
    { id: 'dv1003', examNo: 'EX20260604003', patientName: '王强', patientAge: 58, patientGender: '男', status: 'pending', assignedDept: null, assignedDoctor: null, urgency: 'timeout', anomalyType: ['timeout'], createdAt: '2026-06-03T14:00:00.000Z', updatedAt: '2026-06-03T14:00:00.000Z' },
    { id: 'dv1004', examNo: 'EX20260604004', patientName: '赵敏', patientAge: 41, patientGender: '女', status: 'confirmed', assignedDept: '外科', assignedDoctor: '李医生', urgency: 'normal', anomalyType: ['review_failed'], createdAt: '2026-06-04T09:00:00.000Z', updatedAt: '2026-06-04T09:30:00.000Z' },
    { id: 'dv1005', examNo: 'EX20260604005', patientName: '孙磊', patientAge: 55, patientGender: '男', status: 'pending', assignedDept: null, assignedDoctor: null, urgency: 'urgent', anomalyType: ['missing_material'], createdAt: '2026-06-04T09:15:00.000Z', updatedAt: '2026-06-04T09:15:00.000Z' },
    { id: 'dv1006', examNo: 'EX20260604006', patientName: '周婷', patientAge: 28, patientGender: '女', status: 'completed', assignedDept: '妇科', assignedDoctor: '陈医生', urgency: 'normal', anomalyType: [], createdAt: '2026-06-03T10:00:00.000Z', updatedAt: '2026-06-03T11:30:00.000Z' },
    { id: 'dv1007', examNo: 'EX20260604007', patientName: '吴刚', patientAge: 63, patientGender: '男', status: 'pending', assignedDept: null, assignedDoctor: null, urgency: 'timeout', anomalyType: ['timeout'], createdAt: '2026-06-03T13:30:00.000Z', updatedAt: '2026-06-03T13:30:00.000Z' },
    { id: 'dv1008', examNo: 'EX20260604008', patientName: '郑芳', patientAge: 37, patientGender: '女', status: 'rejected', assignedDept: null, assignedDoctor: null, urgency: 'normal', anomalyType: ['review_failed'], createdAt: '2026-06-04T07:50:00.000Z', updatedAt: '2026-06-04T08:20:00.000Z' },
    { id: 'dv1009', examNo: 'EX20260604009', patientName: '刘洋', patientAge: 50, patientGender: '男', status: 'diverted', assignedDept: '心内科', assignedDoctor: '张医生', urgency: 'urgent', anomalyType: ['missing_material', 'timeout'], createdAt: '2026-06-04T10:00:00.000Z', updatedAt: '2026-06-04T10:30:00.000Z' },
    { id: 'dv1010', examNo: 'EX20260604010', patientName: '陈静', patientAge: 44, patientGender: '女', status: 'pending', assignedDept: null, assignedDoctor: null, urgency: 'normal', anomalyType: [], createdAt: '2026-06-04T10:15:00.000Z', updatedAt: '2026-06-04T10:15:00.000Z' },
    { id: 'dv1011', examNo: 'EX20260604011', patientName: '黄明', patientAge: 67, patientGender: '男', status: 'completed', assignedDept: '骨科', assignedDoctor: '赵医生', urgency: 'normal', anomalyType: [], createdAt: '2026-06-03T09:00:00.000Z', updatedAt: '2026-06-03T10:45:00.000Z' },
    { id: 'dv1012', examNo: 'EX20260604012', patientName: '杨丽', patientAge: 29, patientGender: '女', status: 'diverted', assignedDept: '内分泌科', assignedDoctor: '刘医生', urgency: 'normal', anomalyType: [], createdAt: '2026-06-04T11:00:00.000Z', updatedAt: '2026-06-04T11:20:00.000Z' },
  ],
  diversionLogs: [
    { id: 'dvl1990', diversionId: 'dv1001', operatorRole: 'front_desk', operatorName: '前台小王', action: 'create', detail: '创建分流记录，缺体检申请表', createdAt: '2026-06-04T08:30:00.000Z' },
    { id: 'dvl1991', diversionId: 'dv1002', operatorRole: 'front_desk', operatorName: '前台小李', action: 'create', detail: '创建分流记录，缺血常规报告', createdAt: '2026-06-04T08:45:00.000Z' },
    { id: 'dvl1992', diversionId: 'dv1003', operatorRole: 'front_desk', operatorName: '前台小张', action: 'create', detail: '创建分流记录，已超时24小时', createdAt: '2026-06-03T14:00:00.000Z' },
    { id: 'dvl1993', diversionId: 'dv1004', operatorRole: 'front_desk', operatorName: '前台小李', action: 'create', detail: '创建分流记录，外科复核不通过', createdAt: '2026-06-04T09:00:00.000Z' },
    { id: 'dvl1994', diversionId: 'dv1005', operatorRole: 'front_desk', operatorName: '前台小王', action: 'create', detail: '创建分流记录，缺肝功能报告', createdAt: '2026-06-04T09:15:00.000Z' },
    { id: 'dvl1995', diversionId: 'dv1006', operatorRole: 'front_desk', operatorName: '前台小张', action: 'create', detail: '创建分流记录', createdAt: '2026-06-03T10:00:00.000Z' },
    { id: 'dvl1996', diversionId: 'dv1007', operatorRole: 'front_desk', operatorName: '前台小李', action: 'create', detail: '创建分流记录，已超时18小时', createdAt: '2026-06-03T13:30:00.000Z' },
    { id: 'dvl1997', diversionId: 'dv1008', operatorRole: 'front_desk', operatorName: '前台小王', action: 'create', detail: '创建分流记录', createdAt: '2026-06-04T07:50:00.000Z' },
    { id: 'dvl1998', diversionId: 'dv1009', operatorRole: 'front_desk', operatorName: '前台小张', action: 'create', detail: '创建分流记录，缺心脏彩超报告且超时', createdAt: '2026-06-04T10:00:00.000Z' },
    { id: 'dvl1999', diversionId: 'dv1010', operatorRole: 'front_desk', operatorName: '前台小李', action: 'create', detail: '创建分流记录', createdAt: '2026-06-04T10:15:00.000Z' },
    { id: 'dvl2000', diversionId: 'dv1011', operatorRole: 'front_desk', operatorName: '前台小王', action: 'create', detail: '创建分流记录', createdAt: '2026-06-03T09:00:00.000Z' },
    { id: 'dvl2008', diversionId: 'dv1012', operatorRole: 'front_desk', operatorName: '前台小张', action: 'create', detail: '创建分流记录', createdAt: '2026-06-04T11:00:00.000Z' },
    { id: 'dvl2009', diversionId: 'dv1004', operatorRole: 'front_desk', operatorName: '前台小李', action: 'divert', detail: '分流至外科，指定李医生', createdAt: '2026-06-04T09:05:00.000Z' },
    { id: 'dvl2010', diversionId: 'dv1006', operatorRole: 'front_desk', operatorName: '前台小王', action: 'divert', detail: '分流至妇科，指定陈医生', createdAt: '2026-06-03T10:10:00.000Z' },
    { id: 'dvl2011', diversionId: 'dv1006', operatorRole: 'doctor', operatorName: '陈医生', action: 'confirm', detail: '确认接收妇科分流患者', createdAt: '2026-06-03T10:20:00.000Z' },
    { id: 'dvl2012', diversionId: 'dv1008', operatorRole: 'front_desk', operatorName: '前台小王', action: 'divert', detail: '分流至内科，指定王医生', createdAt: '2026-06-04T08:00:00.000Z' },
    { id: 'dvl2013', diversionId: 'dv1008', operatorRole: 'doctor', operatorName: '王医生', action: 'confirm', detail: '确认接收内科分流患者', createdAt: '2026-06-04T08:10:00.000Z' },
    { id: 'dvl2014', diversionId: 'dv1008', operatorRole: 'doctor', operatorName: '王医生', action: 'complete', detail: '内科检查完成，待审核', createdAt: '2026-06-04T08:15:00.000Z' },
    { id: 'dvl2015', diversionId: 'dv1011', operatorRole: 'front_desk', operatorName: '前台小李', action: 'divert', detail: '分流至骨科，指定赵医生', createdAt: '2026-06-03T09:15:00.000Z' },
    { id: 'dvl2016', diversionId: 'dv1011', operatorRole: 'doctor', operatorName: '赵医生', action: 'confirm', detail: '确认接收骨科分流患者', createdAt: '2026-06-03T09:30:00.000Z' },
    { id: 'dvl2001', diversionId: 'dv1002', operatorRole: 'front_desk', operatorName: '前台小李', action: 'divert', detail: '分流至内科，指定王医生', createdAt: '2026-06-04T09:10:00.000Z' },
    { id: 'dvl2002', diversionId: 'dv1004', operatorRole: 'doctor', operatorName: '李医生', action: 'confirm', detail: '确认接收外科分流患者', createdAt: '2026-06-04T09:30:00.000Z' },
    { id: 'dvl2003', diversionId: 'dv1006', operatorRole: 'doctor', operatorName: '陈医生', action: 'complete', detail: '妇科检查已完成', createdAt: '2026-06-03T11:30:00.000Z' },
    { id: 'dvl2004', diversionId: 'dv1008', operatorRole: 'reviewer', operatorName: '审核员赵主管', action: 'reject', detail: '复核资料不完整，驳回分流申请', createdAt: '2026-06-04T08:20:00.000Z' },
    { id: 'dvl2005', diversionId: 'dv1009', operatorRole: 'front_desk', operatorName: '前台小王', action: 'divert', detail: '分流至心内科，指定张医生', createdAt: '2026-06-04T10:30:00.000Z' },
    { id: 'dvl2006', diversionId: 'dv1011', operatorRole: 'doctor', operatorName: '赵医生', action: 'complete', detail: '骨科检查已完成', createdAt: '2026-06-03T10:45:00.000Z' },
    { id: 'dvl2007', diversionId: 'dv1012', operatorRole: 'front_desk', operatorName: '前台小李', action: 'divert', detail: '分流至内分泌科，指定刘医生', createdAt: '2026-06-04T11:20:00.000Z' },
  ],
  attachments: [
    { id: 'att3001', diversionId: 'dv1001', fileName: '体检申请表.pdf', fileType: '补检凭证', fileUrl: null, uploadedAt: null, uploadedBy: null },
    { id: 'att3006', diversionId: 'dv1001', fileName: '身份证复印件.jpg', fileType: '身份材料', fileUrl: null, uploadedAt: null, uploadedBy: null },
    { id: 'att3002', diversionId: 'dv1002', fileName: '血常规报告.jpg', fileType: '检验报告', fileUrl: '/uploads/blood_report.jpg', uploadedAt: '2026-06-04T09:05:00.000Z', uploadedBy: '前台小李' },
    { id: 'att3003', diversionId: 'dv1003', fileName: '心电图报告.pdf', fileType: '检查报告', fileUrl: '/uploads/ecg_report.pdf', uploadedAt: '2026-06-03T14:10:00.000Z', uploadedBy: '前台小王' },
    { id: 'att3007', diversionId: 'dv1003', fileName: '超时情况说明.docx', fileType: '其他', fileUrl: null, uploadedAt: null, uploadedBy: null },
    { id: 'att3004', diversionId: 'dv1004', fileName: '外科检查记录.docx', fileType: '检查记录', fileUrl: '/uploads/surgery_record.docx', uploadedAt: '2026-06-04T09:25:00.000Z', uploadedBy: '李医生' },
    { id: 'att3008', diversionId: 'dv1004', fileName: '复核意见.pdf', fileType: '审核材料', fileUrl: '/uploads/review_opinion.pdf', uploadedAt: '2026-06-04T09:28:00.000Z', uploadedBy: '审核员赵主管' },
    { id: 'att3005', diversionId: 'dv1009', fileName: '心脏彩超报告.pdf', fileType: '补检凭证', fileUrl: null, uploadedAt: null, uploadedBy: null },
    { id: 'att3009', diversionId: 'dv1009', fileName: '加项审批单.pdf', fileType: '加项审批', fileUrl: null, uploadedAt: null, uploadedBy: null },
    { id: 'att3010', diversionId: 'dv1005', fileName: '肝功能报告.pdf', fileType: '补检凭证', fileUrl: null, uploadedAt: null, uploadedBy: null },
    { id: 'att3011', diversionId: 'dv1007', fileName: '骨密度报告.pdf', fileType: '补检凭证', fileUrl: null, uploadedAt: null, uploadedBy: null },
    { id: 'att3012', diversionId: 'dv1008', fileName: '内科复查记录.docx', fileType: '复查记录', fileUrl: '/uploads/recheck_record.docx', uploadedAt: '2026-06-04T08:18:00.000Z', uploadedBy: '王医生' },
  ],
  missedItems: [
    { id: 'mi4001', examNo: 'EX20260604001', patientName: '张伟', itemName: '腹部B超', requiredDept: '超声科', status: 'pending', remindedAt: null, confirmedAt: null, completedAt: null, createdAt: '2026-06-04T08:35:00.000Z' },
    { id: 'mi4002', examNo: 'EX20260604002', patientName: '李娜', itemName: '甲状腺功能', requiredDept: '检验科', status: 'reminded', remindedAt: '2026-06-04T09:20:00.000Z', confirmedAt: null, completedAt: null, createdAt: '2026-06-04T08:50:00.000Z' },
    { id: 'mi4003', examNo: 'EX20260604003', patientName: '王强', itemName: '胸部CT', requiredDept: '放射科', status: 'pending', remindedAt: null, confirmedAt: null, completedAt: null, createdAt: '2026-06-03T14:05:00.000Z' },
    { id: 'mi4004', examNo: 'EX20260604005', patientName: '孙磊', itemName: '肝功能检查', requiredDept: '检验科', status: 'completed', remindedAt: '2026-06-04T09:30:00.000Z', confirmedAt: '2026-06-04T09:45:00.000Z', completedAt: '2026-06-04T10:00:00.000Z', createdAt: '2026-06-04T09:20:00.000Z' },
    { id: 'mi4005', examNo: 'EX20260604007', patientName: '吴刚', itemName: '骨密度检测', requiredDept: '放射科', status: 'pending', remindedAt: null, confirmedAt: null, completedAt: null, createdAt: '2026-06-03T13:35:00.000Z' },
    { id: 'mi4006', examNo: 'EX20260604004', patientName: '赵敏', itemName: '乳腺超声', requiredDept: '超声科', status: 'closed', remindedAt: '2026-06-04T09:40:00.000Z', confirmedAt: null, completedAt: null, createdAt: '2026-06-04T09:10:00.000Z' },
    { id: 'mi4007', examNo: 'EX20260604009', patientName: '刘洋', itemName: '动态心电图', requiredDept: '心内科', status: 'confirmed', remindedAt: '2026-06-04T10:40:00.000Z', confirmedAt: '2026-06-04T11:00:00.000Z', completedAt: null, createdAt: '2026-06-04T10:05:00.000Z' },
    { id: 'mi4008', examNo: 'EX20260604010', patientName: '陈静', itemName: '妇科TCT', requiredDept: '妇科', status: 'pending', remindedAt: null, confirmedAt: null, completedAt: null, createdAt: '2026-06-04T10:20:00.000Z' },
  ],
  missedItemLogs: [
    { id: 'mil4990', missedItemId: 'mi4001', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到腹部B超未完成', createdAt: '2026-06-04T08:35:00.000Z' },
    { id: 'mil4991', missedItemId: 'mi4002', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到甲状腺功能未完成', createdAt: '2026-06-04T08:50:00.000Z' },
    { id: 'mil4992', missedItemId: 'mi4003', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到胸部CT未完成', createdAt: '2026-06-03T14:05:00.000Z' },
    { id: 'mil4993', missedItemId: 'mi4004', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到肝功能检查未完成', createdAt: '2026-06-04T09:20:00.000Z' },
    { id: 'mil4994', missedItemId: 'mi4005', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到骨密度检测未完成', createdAt: '2026-06-03T13:35:00.000Z' },
    { id: 'mil4995', missedItemId: 'mi4006', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到乳腺超声未完成', createdAt: '2026-06-04T09:10:00.000Z' },
    { id: 'mil4996', missedItemId: 'mi4007', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到动态心电图未完成', createdAt: '2026-06-04T10:05:00.000Z' },
    { id: 'mil4997', missedItemId: 'mi4008', operatorRole: 'front_desk', operatorName: '系统自动检测', action: 'create', detail: '系统检测到妇科TCT未完成', createdAt: '2026-06-04T10:20:00.000Z' },
    { id: 'mil5006', missedItemId: 'mi4006', operatorRole: 'front_desk', operatorName: '前台小李', action: 'remind', detail: '电话提醒患者补做乳腺超声', createdAt: '2026-06-04T09:40:00.000Z' },
    { id: 'mil5001', missedItemId: 'mi4002', operatorRole: 'front_desk', operatorName: '前台小李', action: 'remind', detail: '电话提醒患者补做甲状腺功能检查', createdAt: '2026-06-04T09:20:00.000Z' },
    { id: 'mil5002', missedItemId: 'mi4004', operatorRole: 'front_desk', operatorName: '前台小王', action: 'remind', detail: '短信提醒患者补做肝功能检查', createdAt: '2026-06-04T09:30:00.000Z' },
    { id: 'mil5007', missedItemId: 'mi4004', operatorRole: 'doctor', operatorName: '张医生', action: 'confirm', detail: '科室医生确认肝功能漏项，已安排补检', createdAt: '2026-06-04T09:45:00.000Z' },
    { id: 'mil5003', missedItemId: 'mi4004', operatorRole: 'doctor', operatorName: '张医生', action: 'complete', detail: '肝功能检查已完成', createdAt: '2026-06-04T10:00:00.000Z' },
    { id: 'mil5004', missedItemId: 'mi4006', operatorRole: 'reviewer', operatorName: '审核员赵主管', action: 'close', detail: '患者放弃该项检查，关闭漏项', createdAt: '2026-06-04T09:45:00.000Z' },
    { id: 'mil5005', missedItemId: 'mi4007', operatorRole: 'front_desk', operatorName: '前台小李', action: 'remind', detail: '电话提醒患者补做动态心电图', createdAt: '2026-06-04T10:40:00.000Z' },
    { id: 'mil5008', missedItemId: 'mi4007', operatorRole: 'doctor', operatorName: '张医生', action: 'confirm', detail: '科室医生确认动态心电图漏项，已安排补检', createdAt: '2026-06-04T11:00:00.000Z' },
  ],
}

initDataIfEmpty(initialData)

export function getDiversions(): Diversion[] {
  return loadData().diversions as Diversion[]
}

export function saveDiversions(items: Diversion[]) {
  saveData({ diversions: items })
}

export function getDiversionLogs(): DiversionLog[] {
  return loadData().diversionLogs as DiversionLog[]
}

export function saveDiversionLogs(items: DiversionLog[]) {
  saveData({ diversionLogs: items })
}

export function getAttachments(): Attachment[] {
  return loadData().attachments as Attachment[]
}

export function saveAttachments(items: Attachment[]) {
  saveData({ attachments: items })
}

export function getMissedItems(): MissedItem[] {
  return loadData().missedItems as MissedItem[]
}

export function saveMissedItems(items: MissedItem[]) {
  saveData({ missedItems: items })
}

export function getMissedItemLogs(): MissedItemLog[] {
  return loadData().missedItemLogs as MissedItemLog[]
}

export function saveMissedItemLogs(items: MissedItemLog[]) {
  saveData({ missedItemLogs: items })
}

export function findDiversion(id: string): Diversion | undefined {
  return getDiversions().find((d) => d.id === id)
}

export function findDiversionLogs(diversionId: string): DiversionLog[] {
  return getDiversionLogs().filter((l) => l.diversionId === diversionId)
}

export function findAttachments(diversionId: string): Attachment[] {
  return getAttachments().filter((a) => a.diversionId === diversionId)
}

export function addDiversionLog(log: Omit<DiversionLog, 'id' | 'createdAt'>): DiversionLog {
  const logs = getDiversionLogs()
  const newLog: DiversionLog = {
    ...log,
    id: nextId('dvl'),
    createdAt: new Date().toISOString(),
  }
  logs.push(newLog)
  saveDiversionLogs(logs)
  return newLog
}

export function addAttachment(att: Omit<Attachment, 'id'>, operatorName?: string): Attachment {
  const attachments = getAttachments()
  const now = new Date().toISOString()
  const newAtt: Attachment = {
    ...att,
    id: nextId('att'),
    uploadedAt: att.fileUrl ? now : null,
    uploadedBy: att.fileUrl ? (operatorName || null) : null,
  }
  attachments.push(newAtt)
  saveAttachments(attachments)
  return newAtt
}

export function updateAttachment(id: string, updates: Partial<Attachment>): Attachment | undefined {
  const attachments = getAttachments()
  const idx = attachments.findIndex((a) => a.id === id)
  if (idx === -1) return undefined
  attachments[idx] = { ...attachments[idx], ...updates }
  saveAttachments(attachments)
  return attachments[idx]
}

export function findMissedItem(id: string): MissedItem | undefined {
  return getMissedItems().find((m) => m.id === id)
}

export function findMissedItemLogs(missedItemId: string): MissedItemLog[] {
  return getMissedItemLogs().filter((l) => l.missedItemId === missedItemId)
}

export function addMissedItemLog(log: Omit<MissedItemLog, 'id' | 'createdAt'>): MissedItemLog {
  const logs = getMissedItemLogs()
  const newLog: MissedItemLog = {
    ...log,
    id: nextId('mil'),
    createdAt: new Date().toISOString(),
  }
  logs.push(newLog)
  saveMissedItemLogs(logs)
  return newLog
}

export function updateDiversion(id: string, updates: Partial<Diversion>): Diversion | undefined {
  const items = getDiversions()
  const idx = items.findIndex((d) => d.id === id)
  if (idx === -1) return undefined
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() }
  saveDiversions(items)
  return items[idx]
}

export function updateMissedItem(id: string, updates: Partial<MissedItem>): MissedItem | undefined {
  const items = getMissedItems()
  const idx = items.findIndex((m) => m.id === id)
  if (idx === -1) return undefined
  items[idx] = { ...items[idx], ...updates }
  saveMissedItems(items)
  return items[idx]
}
