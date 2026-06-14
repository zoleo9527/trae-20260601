import {
  getAVRecords, getAVRecord, addAVRecord, updateAVRecord, addAuditLog,
  getCandidate, getRoom, getSubject, nextId, assertPermission, getAuditLogs, setStageStatus, getStageProgress
} from '../data/repository.js'
import type { AbsenceViolationRecord, AVType, AVStatus, ViolationCategory, Role, AuditLog } from '../../shared/types.js'

export function listAVRecords(filters: { type?: AVType; roomId?: string; subjectId?: string; status?: AVStatus }, operatorRole?: Role) {
  let records = getAVRecords()
  if (operatorRole === 'invigilator') {
    const invigilatorNames = getRoom(records[0]?.roomId || '') ? ['王建国', '李秀英', '张志强', '刘美玲', '陈海涛', '赵丽华'] : []
    if (invigilatorNames.length > 0) {
      records = records.filter(r => invigilatorNames.includes(r.submittedBy) || r.status !== 'pending')
    }
  }
  if (filters.type) records = records.filter(r => r.type === filters.type)
  if (filters.roomId) records = records.filter(r => r.roomId === filters.roomId)
  if (filters.subjectId) records = records.filter(r => r.subjectId === filters.subjectId)
  if (filters.status) records = records.filter(r => r.status === filters.status)
  return records
}

export function submitAVRecord(data: {
  candidateId: string; type: AVType; violationType?: ViolationCategory;
  roomId: string; subjectId: string; remark: string; operatorRole: Role; operatorName: string;
  parentId?: string
}): AbsenceViolationRecord {
  assertPermission(data.operatorRole, 'submit:av')
  const candidate = getCandidate(data.candidateId)
  if (!candidate) throw new Error('[校验失败] 考生不存在')
  const room = getRoom(data.roomId)
  if (!room) throw new Error('[校验失败] 考场不存在')
  const subject = getSubject(data.subjectId)
  if (!subject) throw new Error('[校验失败] 科目不存在')
  if (!data.remark.trim()) throw new Error('[校验失败] 备注不能为空')
  if (data.type === 'violation' && !data.violationType) throw new Error('[校验失败] 违纪类型不能为空')

  const now = new Date().toISOString()
  const isResubmit = !!data.parentId
  const record: AbsenceViolationRecord = {
    id: nextId('av'),
    candidateId: data.candidateId,
    type: data.type,
    violationType: data.type === 'violation' ? (data.violationType || 'other') : null,
    roomId: data.roomId,
    subjectId: data.subjectId,
    status: isResubmit ? 'resubmitted' : 'pending',
    submittedBy: data.operatorName,
    reviewedBy: null,
    opinion: null,
    remark: data.remark,
    createdAt: now,
    reviewedAt: null,
    version: 1,
    parentId: data.parentId || null,
  }
  addAVRecord(record)

  const typeLabel = data.type === 'absence' ? '缺考' : '违纪'
  const violationLabel = data.type === 'violation' && data.violationType ? `(${getViolationLabel(data.violationType)})` : ''
  const resubmitLabel = isResubmit ? '[重新提交]' : ''

  addAuditLog({
    id: nextId('log'),
    targetType: 'absence-violation',
    targetId: record.id,
    action: isResubmit ? 'resubmit' : 'submit',
    operatorRole: data.operatorRole,
    operatorName: data.operatorName,
    detail: `${resubmitLabel}提交${typeLabel}记录：${candidate.name}-${subject.name}${violationLabel}-${data.remark}`,
    createdAt: now,
    fromStatus: undefined,
    toStatus: record.status,
  })

  updateStagesAfterChange()
  return record
}

export function reviewAVRecord(
  id: string,
  action: 'approve' | 'reject' | 'supplement',
  opinion: string,
  operatorRole: Role,
  operatorName: string,
  supplementData?: { candidateId: string; type: AVType; violationType?: ViolationCategory; roomId: string; subjectId: string; remark: string }
): AbsenceViolationRecord {
  assertPermission(operatorRole, 'review:av')
  const record = getAVRecord(id)
  if (!record) throw new Error('[校验失败] 记录不存在')

  const allowedTransitions: Record<AVStatus, string[]> = {
    pending: ['approve', 'reject', 'supplement'],
    resubmitted: ['approve', 'reject', 'supplement'],
    rejected: ['supplement'],
    approved: [],
    supplemented: [],
  }
  if (!allowedTransitions[record.status]?.includes(action)) {
    throw new Error(`[状态错误] 当前状态「${getStatusLabel(record.status)}」不允许执行「${getActionLabel(action)}」操作`)
  }
  if (!opinion.trim()) throw new Error('[校验失败] 审核意见不能为空')

  const now = new Date().toISOString()
  const statusMap: Record<string, AVStatus> = { approve: 'approved', reject: 'rejected', supplement: 'supplemented' }
  const newStatus = statusMap[action]
  const candidate = getCandidate(record.candidateId)

  if (action === 'supplement' && supplementData) {
    const suppCandidate = getCandidate(supplementData.candidateId)
    if (!suppCandidate) throw new Error('[校验失败] 补录考生不存在')
    const supplementRecord = submitAVRecord({
      ...supplementData,
      operatorRole,
      operatorName,
      parentId: id,
    })
    addAuditLog({
      id: nextId('log'),
      targetType: 'absence-violation',
      targetId: supplementRecord.id,
      action: 'supplement-create',
      operatorRole,
      operatorName,
      detail: `补录新增记录：${suppCandidate.name}-${opinion}`,
      createdAt: now,
      fromStatus: undefined,
      toStatus: supplementRecord.status,
    })
  } else if (action === 'supplement' && !supplementData) {
    console.warn('[警告] 补录操作未提供 supplementData，仅更新原记录状态')
  }

  updateAVRecord(id, {
    status: newStatus,
    reviewedBy: operatorName,
    opinion,
    reviewedAt: now,
  })

  const actionLabels: Record<string, string> = { approve: '审核通过', reject: '审核驳回', supplement: '补录完成' }
  addAuditLog({
    id: nextId('log'),
    targetType: 'absence-violation',
    targetId: id,
    action,
    operatorRole,
    operatorName,
    detail: `${actionLabels[action]}：${candidate?.name || '未知考生'}-${opinion}`,
    createdAt: now,
    fromStatus: record.status,
    toStatus: newStatus,
  })

  updateStagesAfterChange()
  return getAVRecord(id)!
}

export function getAVRecordDetail(id: string): { record: AbsenceViolationRecord; auditLogs: AuditLog[] } {
  const record = getAVRecord(id)
  if (!record) throw new Error('记录不存在')
  const logs = getAuditLogs().filter(l => l.targetType === 'absence-violation' && l.targetId === id)
  return { record, auditLogs: logs }
}

function getViolationLabel(type: ViolationCategory): string {
  const map: Record<ViolationCategory, string> = {
    cheat: '作弊', impersonate: '替考', disrupt: '扰乱考场', device: '携带设备', other: '其他'
  }
  return map[type] || type
}

function getStatusLabel(status: AVStatus): string {
  const map: Record<AVStatus, string> = {
    pending: '待审核', approved: '已通过', rejected: '已驳回', supplemented: '已补录', resubmitted: '重新提交待审'
  }
  return map[status] || status
}

function getActionLabel(action: string): string {
  const map: Record<string, string> = { approve: '通过', reject: '驳回', supplement: '补录' }
  return map[action] || action
}

function updateStagesAfterChange() {
  const progress = getStageProgress()
  const avProgress = progress.find(p => p.stage === 'absence-violation')
  const spProgress = progress.find(p => p.stage === 'score-publish')

  if (avProgress?.canProceed) {
    setStageStatus('absence-violation', 'completed', '系统自动')
  }
  if (avProgress?.blockers.length && avProgress.blockers[0]?.includes('待审核')) {
    setStageStatus('absence-violation', 'active')
  }
  if (spProgress?.canProceed) {
    setStageStatus('score-publish', 'active')
  }
}
