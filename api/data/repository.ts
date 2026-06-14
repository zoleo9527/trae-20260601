import type {
  Exam, Room, Subject, Candidate, Invigilator,
  AbsenceViolationRecord, ScorePublishRecord,
  AuditLog, ExportTask, RoleInfo, Role,
  RegistrationInfo, RoomArrangementInfo, InvigilatorInfo, StageName, StageProgress
} from '../../shared/types.js'

let exams: Exam[] = []
let rooms: Room[] = []
let subjects: Subject[] = []
let candidates: Candidate[] = []
let invigilators: Invigilator[] = []
let avRecords: AbsenceViolationRecord[] = []
let spRecords: ScorePublishRecord[] = []
let auditLogs: AuditLog[] = []
let exportTasks: ExportTask[] = []

let stageStatus: Record<StageName, { status: 'completed' | 'active' | 'pending'; completedAt?: string; operatorName?: string }> = {
  'registration': { status: 'completed', completedAt: new Date(Date.now() - 86400000 * 7).toISOString(), operatorName: '考务专员' },
  'room-arrangement': { status: 'completed', completedAt: new Date(Date.now() - 86400000 * 5).toISOString(), operatorName: '考务专员' },
  'invigilator-assignment': { status: 'completed', completedAt: new Date(Date.now() - 86400000 * 3).toISOString(), operatorName: '考务专员' },
  'absence-violation': { status: 'active' },
  'score-publish': { status: 'pending' },
}

let idCounter = 1000
export function nextId(prefix: string): string {
  idCounter++
  return `${prefix}${idCounter}`
}

export function getRoleInfo(role: Role): RoleInfo {
  const map: Record<Role, RoleInfo> = {
    invigilator: { role: 'invigilator', name: '监考老师', permissions: ['submit:av', 'view:own-av', 'resubmit:av'] },
    admin: { role: 'admin', name: '考务专员', permissions: ['review:av', 'initiate:sp', 'approve:sp', 'reject:sp', 'view:all', 'view:audit', 'manage:stage', 'reset:data'] },
    tech: { role: 'tech', name: '技术支持', permissions: ['confirm:sp', 'manage:export', 'view:system', 'view:all'] },
  }
  return map[role]
}

export function checkPermission(role: Role, permission: string): boolean {
  const info = getRoleInfo(role)
  return info.permissions.includes(permission) || info.permissions.includes('view:all')
}

export function assertPermission(role: Role, permission: string): void {
  if (!checkPermission(role, permission)) {
    const info = getRoleInfo(role)
    throw new Error(`[权限不足] 当前角色「${info.name}」无此操作权限，需要：${permission}`)
  }
}

export function seedData(): void {
  idCounter = 1000
  exams = [{ id: 'exam1', name: '2026年春季期末考试', date: '2026-06-20', totalCandidates: 20, totalRooms: 3 }]
  rooms = [
    { id: 'room1', name: 'A101', capacity: 30 },
    { id: 'room2', name: 'A102', capacity: 30 },
    { id: 'room3', name: 'B201', capacity: 25 },
  ]
  subjects = [
    { id: 'subj1', name: '高等数学' },
    { id: 'subj2', name: '大学英语' },
    { id: 'subj3', name: '计算机基础' },
    { id: 'subj4', name: '思想政治' },
  ]
  const names = ['张伟','李娜','王强','刘洋','陈静','杨磊','赵敏','黄海','周芳','吴涛','徐明','孙丽','马超','朱红','胡波','郭云','林峰','何雪','罗杰','梁宇']
  candidates = []
  for (let i = 0; i < 20; i++) {
    candidates.push({
      id: `cand${i + 1}`,
      name: names[i],
      ticketNo: `TK2026${String(i + 1).padStart(3, '0')}`,
      roomId: rooms[i % 3].id,
      subjectId: subjects[i % 4].id,
      score: Math.round(Math.random() * 60 + 40),
    })
  }
  invigilators = [
    { id: 'inv1', name: '王建国', roomId: 'room1', phone: '138****1001' },
    { id: 'inv2', name: '李秀英', roomId: 'room1', phone: '138****1002' },
    { id: 'inv3', name: '张志强', roomId: 'room2', phone: '138****1003' },
    { id: 'inv4', name: '刘美玲', roomId: 'room2', phone: '138****1004' },
    { id: 'inv5', name: '陈海涛', roomId: 'room3', phone: '138****1005' },
    { id: 'inv6', name: '赵丽华', roomId: 'room3', phone: '138****1006' },
  ]
  const now = new Date().toISOString()
  avRecords = [
    { id: 'av1', candidateId: 'cand1', type: 'absence', violationType: null, roomId: 'room1', subjectId: 'subj1', status: 'pending', submittedBy: '王建国', reviewedBy: null, opinion: null, remark: '开考30分钟未到，联系不上', createdAt: now, reviewedAt: null, version: 1, parentId: null },
    { id: 'av2', candidateId: 'cand5', type: 'violation', violationType: 'cheat', roomId: 'room2', subjectId: 'subj2', status: 'pending', submittedBy: '张志强', reviewedBy: null, opinion: null, remark: '夹带小抄，已当场没收', createdAt: now, reviewedAt: null, version: 1, parentId: null },
    { id: 'av3', candidateId: 'cand8', type: 'absence', violationType: null, roomId: 'room2', subjectId: 'subj3', status: 'approved', submittedBy: '张志强', reviewedBy: '考务专员', opinion: '情况属实，医院证明已附', remark: '因病缺考，已提前请假', createdAt: now, reviewedAt: now, version: 1, parentId: null },
    { id: 'av4', candidateId: 'cand12', type: 'violation', violationType: 'device', roomId: 'room3', subjectId: 'subj1', status: 'rejected', submittedBy: '陈海涛', reviewedBy: '考务专员', opinion: '证据不足，请补充手机照片或其他监考老师签字确认', remark: '手机未关机，闹钟响铃', createdAt: now, reviewedAt: now, version: 1, parentId: null },
    { id: 'av5', candidateId: 'cand15', type: 'violation', violationType: 'disrupt', roomId: 'room3', subjectId: 'subj4', status: 'supplemented', submittedBy: '陈海涛', reviewedBy: '考务专员', opinion: '已补录完整信息，附加两位监考老师签字扫描件', remark: '考场大声喧哗，影响周围考生', createdAt: now, reviewedAt: now, version: 1, parentId: null },
  ]
  spRecords = [
    { id: 'sp1', subjectId: 'subj1', status: 'initiated', initiatedBy: '考务专员', confirmedBy: null, rejectedBy: null, opinion: null, summary: { total: 20, pass: 15, fail: 5, max: 98, min: 32, avg: 72.5 }, createdAt: now, confirmedAt: null, rejectedAt: null, version: 1 },
    { id: 'sp2', subjectId: 'subj2', status: 'confirmed', initiatedBy: '考务专员', confirmedBy: '技术支持', rejectedBy: null, opinion: '成绩核对无误，已与答题卡扫描数据比对一致', summary: { total: 20, pass: 18, fail: 2, max: 95, min: 45, avg: 78.3 }, createdAt: now, confirmedAt: now, rejectedAt: null, version: 1 },
  ]
  auditLogs = [
    { id: 'log1', targetType: 'stage', targetId: 'registration', action: 'complete', operatorRole: 'admin', operatorName: '考务专员', detail: '完成报名数据校验：20人报名，20人已缴费', createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: 'log2', targetType: 'stage', targetId: 'room-arrangement', action: 'complete', operatorRole: 'admin', operatorName: '考务专员', detail: '完成考场编排：3个考场，平均利用率67%', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'log3', targetType: 'stage', targetId: 'invigilator-assignment', action: 'complete', operatorRole: 'admin', operatorName: '考务专员', detail: '完成监考分配：6名监考老师，3个考场双监考', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'log4', targetType: 'absence-violation', targetId: 'av1', action: 'submit', operatorRole: 'invigilator', operatorName: '王建国', detail: '提交缺考记录：张伟-高等数学(开考30分钟未到)', createdAt: now, fromStatus: undefined, toStatus: 'pending' },
    { id: 'log5', targetType: 'absence-violation', targetId: 'av2', action: 'submit', operatorRole: 'invigilator', operatorName: '张志强', detail: '提交违纪记录：陈静-大学英语(作弊-夹带小抄)', createdAt: now, fromStatus: undefined, toStatus: 'pending' },
    { id: 'log6', targetType: 'absence-violation', targetId: 'av3', action: 'submit', operatorRole: 'invigilator', operatorName: '张志强', detail: '提交缺考记录：黄海-计算机基础(因病请假)', createdAt: now, fromStatus: undefined, toStatus: 'pending' },
    { id: 'log7', targetType: 'absence-violation', targetId: 'av3', action: 'approve', operatorRole: 'admin', operatorName: '考务专员', detail: '审核通过：黄海-计算机基础(缺考)-情况属实，医院证明已附', createdAt: now, fromStatus: 'pending', toStatus: 'approved' },
    { id: 'log8', targetType: 'absence-violation', targetId: 'av4', action: 'submit', operatorRole: 'invigilator', operatorName: '陈海涛', detail: '提交违纪记录：孙丽-高等数学(携带设备-手机响铃)', createdAt: now, fromStatus: undefined, toStatus: 'pending' },
    { id: 'log9', targetType: 'absence-violation', targetId: 'av4', action: 'reject', operatorRole: 'admin', operatorName: '考务专员', detail: '审核驳回：孙丽-高等数学(携带设备)-证据不足，请补充手机照片或其他监考老师签字确认', createdAt: now, fromStatus: 'pending', toStatus: 'rejected' },
    { id: 'log10', targetType: 'absence-violation', targetId: 'av5', action: 'submit', operatorRole: 'invigilator', operatorName: '陈海涛', detail: '提交违纪记录：胡波-思想政治(扰乱考场)', createdAt: now, fromStatus: undefined, toStatus: 'pending' },
    { id: 'log11', targetType: 'absence-violation', targetId: 'av5', action: 'supplement', operatorRole: 'admin', operatorName: '考务专员', detail: '补录完成：胡波-思想政治(扰乱考场)-已补录两位监考老师签字', createdAt: now, fromStatus: 'pending', toStatus: 'supplemented' },
    { id: 'log12', targetType: 'score-publish', targetId: 'sp1', action: 'initiate', operatorRole: 'admin', operatorName: '考务专员', detail: '发起成绩发布：高等数学(总20人，及格15人，不及格5人)', createdAt: now, fromStatus: undefined, toStatus: 'initiated' },
    { id: 'log13', targetType: 'score-publish', targetId: 'sp2', action: 'initiate', operatorRole: 'admin', operatorName: '考务专员', detail: '发起成绩发布：大学英语(总20人，及格18人，不及格2人)', createdAt: now, fromStatus: undefined, toStatus: 'initiated' },
    { id: 'log14', targetType: 'score-publish', targetId: 'sp2', action: 'approve', operatorRole: 'admin', operatorName: '考务专员', detail: '审批通过：大学英语成绩发布', createdAt: now, fromStatus: 'initiated', toStatus: 'approved' },
    { id: 'log15', targetType: 'score-publish', targetId: 'sp2', action: 'confirm', operatorRole: 'tech', operatorName: '技术支持', detail: '确认发布：大学英语-成绩核对无误，已与答题卡扫描数据比对一致', createdAt: now, fromStatus: 'approved', toStatus: 'confirmed' },
  ]
  exportTasks = []
  stageStatus = {
    'registration': { status: 'completed', completedAt: new Date(Date.now() - 86400000 * 7).toISOString(), operatorName: '考务专员' },
    'room-arrangement': { status: 'completed', completedAt: new Date(Date.now() - 86400000 * 5).toISOString(), operatorName: '考务专员' },
    'invigilator-assignment': { status: 'completed', completedAt: new Date(Date.now() - 86400000 * 3).toISOString(), operatorName: '考务专员' },
    'absence-violation': { status: 'active' },
    'score-publish': { status: 'pending' },
  }
}

seedData()

export const getExam = () => exams[0]
export const getRooms = () => rooms
export const getSubjects = () => subjects
export const getCandidates = () => candidates
export const getCandidate = (id: string) => candidates.find(c => c.id === id)
export const getRoom = (id: string) => rooms.find(r => r.id === id)
export const getSubject = (id: string) => subjects.find(s => s.id === id)
export const getInvigilators = () => invigilators
export const getInvigilator = (id: string) => invigilators.find(i => i.id === id)
export const getStageStatus = (stage: StageName) => stageStatus[stage]
export const setStageStatus = (stage: StageName, status: 'completed' | 'active' | 'pending', operatorName?: string) => {
  stageStatus[stage] = {
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    operatorName,
  }
}

export function getRegistrationInfo(): RegistrationInfo {
  const subjectMap = new Map<string, number>()
  const roomMap = new Map<string, number>()
  let paidCount = 0
  candidates.forEach(c => {
    subjectMap.set(c.subjectId, (subjectMap.get(c.subjectId) || 0) + 1)
    roomMap.set(c.roomId, (roomMap.get(c.roomId) || 0) + 1)
    paidCount++
  })
  return {
    totalRegistered: candidates.length,
    totalPaid: paidCount,
    totalUnpaid: candidates.length - paidCount,
    subjects: subjects.map(s => ({
      subjectId: s.id,
      subjectName: s.name,
      count: subjectMap.get(s.id) || 0,
    })),
    rooms: rooms.map(r => ({
      roomId: r.id,
      roomName: r.name,
      count: roomMap.get(r.id) || 0,
    })),
  }
}

export function getRoomArrangementInfo(): RoomArrangementInfo {
  const arrangements = rooms.map(r => {
    const assigned = candidates.filter(c => c.roomId === r.id).length
    return {
      roomId: r.id,
      roomName: r.name,
      capacity: r.capacity,
      assigned,
      utilization: r.capacity > 0 ? Math.round((assigned / r.capacity) * 100) : 0,
    }
  })
  return {
    totalRooms: rooms.length,
    utilizedRooms: arrangements.filter(a => a.assigned > 0).length,
    totalCapacity: rooms.reduce((sum, r) => sum + r.capacity, 0),
    arrangements,
  }
}

export function getInvigilatorInfo(): InvigilatorInfo {
  const roomWithInvigilator = new Set<string>()
  const assignments = invigilators.map(i => {
    const room = rooms.find(r => r.id === i.roomId)
    if (room) roomWithInvigilator.add(room.id)
    return {
      invigilatorId: i.id,
      invigilatorName: i.name,
      roomId: i.roomId,
      roomName: room?.name || '未分配',
      phone: i.phone,
    }
  })
  return {
    totalInvigilators: invigilators.length,
    assignedRooms: roomWithInvigilator.size,
    unassignedRooms: rooms.length - roomWithInvigilator.size,
    assignments,
  }
}

export function getStageProgress(): StageProgress[] {
  const pendingAV = avRecords.filter(r => r.status === 'pending' || r.status === 'resubmitted').length
  const pendingSP = spRecords.filter(r => r.status === 'initiated' || r.status === 'approved').length

  const canProceedAV = pendingAV === 0 && stageStatus['absence-violation'].status !== 'pending'
  const canProceedSP = canProceedAV || (pendingAV === 0 && spRecords.some(r => r.status === 'confirmed'))

  return [
    {
      stage: 'registration',
      stageName: '报名数据',
      order: 1,
      canProceed: true,
      blockers: [],
      nextAction: null,
      nextRole: null,
    },
    {
      stage: 'room-arrangement',
      stageName: '考场编排',
      order: 2,
      canProceed: true,
      blockers: [],
      nextAction: null,
      nextRole: null,
    },
    {
      stage: 'invigilator-assignment',
      stageName: '监考名单',
      order: 3,
      canProceed: true,
      blockers: [],
      nextAction: null,
      nextRole: null,
    },
    {
      stage: 'absence-violation',
      stageName: '缺考违纪',
      order: 4,
      canProceed: canProceedAV,
      blockers: pendingAV > 0 ? [`仍有 ${pendingAV} 条待审核记录`] : [],
      nextAction: pendingAV > 0 ? '审核所有待处理记录' : stageStatus['absence-violation'].status !== 'completed' ? '标记环节完成' : null,
      nextRole: pendingAV > 0 ? 'admin' : stageStatus['absence-violation'].status !== 'completed' ? 'admin' : null,
    },
    {
      stage: 'score-publish',
      stageName: '成绩发布',
      order: 5,
      canProceed: canProceedSP,
      blockers: !canProceedAV ? ['请先完成缺考违纪审核流程'] : pendingSP > 0 ? [`仍有 ${pendingSP} 条待发布记录`] : [],
      nextAction: canProceedAV && spRecords.length === 0 ? '发起成绩发布申请' : pendingSP > 0 ? '完成审批与确认' : null,
      nextRole: canProceedAV && spRecords.length === 0 ? 'admin' : pendingSP > 0 ? (spRecords.some(r => r.status === 'approved') ? 'tech' : 'admin') : null,
    },
  ]
}

export const getAVRecords = () => avRecords
export const getAVRecord = (id: string) => avRecords.find(r => r.id === id)
export const addAVRecord = (r: AbsenceViolationRecord) => { avRecords.push(r) }
export const updateAVRecord = (id: string, update: Partial<AbsenceViolationRecord>) => {
  const idx = avRecords.findIndex(r => r.id === id)
  if (idx >= 0) {
    avRecords[idx] = {
      ...avRecords[idx],
      ...update,
      version: (avRecords[idx].version || 1) + 1,
    }
  }
}

export const getSPRecords = () => spRecords
export const getSPRecord = (id: string) => spRecords.find(r => r.id === id)
export const addSPRecord = (r: ScorePublishRecord) => { spRecords.push(r) }
export const updateSPRecord = (id: string, update: Partial<ScorePublishRecord>) => {
  const idx = spRecords.findIndex(r => r.id === id)
  if (idx >= 0) {
    spRecords[idx] = {
      ...spRecords[idx],
      ...update,
      version: (spRecords[idx].version || 1) + 1,
    }
  }
}

export const getAuditLogs = () => auditLogs
export const addAuditLog = (log: AuditLog) => { auditLogs.unshift(log) }

export const getExportTasks = () => exportTasks
export const getExportTask = (id: string) => exportTasks.find(t => t.id === id)
export const addExportTask = (t: ExportTask) => { exportTasks.unshift(t) }
export const updateExportTask = (id: string, update: Partial<ExportTask>) => {
  const idx = exportTasks.findIndex(t => t.id === id)
  if (idx >= 0) exportTasks[idx] = { ...exportTasks[idx], ...update }
}
