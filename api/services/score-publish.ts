import {
  getSPRecords, getSPRecord, addSPRecord, updateSPRecord, addAuditLog,
  getAuditLogs, getSubject, nextId, assertPermission, setStageStatus, getStageProgress, getAVRecords
} from '../data/repository.js'
import type { ScorePublishRecord, SPStatus, ScoreSummary, Role, AuditLog } from '../../shared/types.js'

export function listSPRecords(status?: SPStatus) {
  let records = getSPRecords()
  if (status) records = records.filter(r => r.status === status)
  return records
}

export function initiatePublish(data: {
  subjectId: string; summary: ScoreSummary; operatorRole: Role; operatorName: string
}): ScorePublishRecord {
  assertPermission(data.operatorRole, 'initiate:sp')

  const avProgress = getStageProgress().find(p => p.stage === 'absence-violation')
  if (!avProgress?.canProceed) {
    throw new Error(`[流程错误] 请先完成缺考违纪审核流程：${avProgress?.blockers.join('；') || '仍有待处理事项'}`)
  }

  const subject = getSubject(data.subjectId)
  if (!subject) throw new Error('[校验失败] 科目不存在')
  if (!data.summary) throw new Error('[校验失败] 成绩汇总不能为空')
  const { total, pass, fail } = data.summary
  if (total <= 0) throw new Error('[校验失败] 总人数必须大于0')
  if (pass < 0 || fail < 0) throw new Error('[校验失败] 及格/不及格人数不能为负数')
  if (pass + fail !== total) throw new Error(`[校验失败] 人数不匹配：及格(${pass}) + 不及格(${fail}) ≠ 总数(${total})`)
  if (data.summary.max < data.summary.min) throw new Error('[校验失败] 最高分不能低于最低分')
  if (data.summary.avg < 0 || data.summary.avg > 100) throw new Error('[校验失败] 平均分应在0-100之间')

  const existing = getSPRecords().find(r => r.subjectId === data.subjectId && r.status !== 'rejected')
  if (existing) throw new Error(`[校验失败] 科目「${subject.name}」已有进行中的发布记录，请先处理后再发起`)

  const now = new Date().toISOString()
  const record: ScorePublishRecord = {
    id: nextId('sp'),
    subjectId: data.subjectId,
    status: 'initiated',
    initiatedBy: data.operatorName,
    confirmedBy: null,
    rejectedBy: null,
    opinion: null,
    summary: data.summary,
    createdAt: now,
    confirmedAt: null,
    rejectedAt: null,
    version: 1,
  }
  addSPRecord(record)

  addAuditLog({
    id: nextId('log'),
    targetType: 'score-publish',
    targetId: record.id,
    action: 'initiate',
    operatorRole: data.operatorRole,
    operatorName: data.operatorName,
    detail: `发起成绩发布：${subject.name}(总${total}人，及格${pass}人，不及格${fail}人，均分${data.summary.avg})`,
    createdAt: now,
    fromStatus: undefined,
    toStatus: 'initiated',
  })

  updateStagesAfterChange()
  return record
}

export function approvePublish(id: string, operatorRole: Role, operatorName: string, opinion?: string): ScorePublishRecord {
  assertPermission(operatorRole, 'approve:sp')
  const record = getSPRecord(id)
  if (!record) throw new Error('[校验失败] 发布记录不存在')

  const allowedTransitions: Record<SPStatus, string[]> = {
    initiated: ['approve', 'reject'],
    approved: ['reject', 'confirm'],
    confirmed: [],
    rejected: [],
  }
  if (!allowedTransitions[record.status]?.includes('approve')) {
    throw new Error(`[状态错误] 当前状态「${getStatusLabel(record.status)}」不允许执行「审批通过」操作`)
  }

  const now = new Date().toISOString()
  const subject = getSubject(record.subjectId)
  const finalOpinion = opinion || '审批通过，成绩数据核对无误'

  updateSPRecord(id, { status: 'approved' })

  addAuditLog({
    id: nextId('log'),
    targetType: 'score-publish',
    targetId: id,
    action: 'approve',
    operatorRole,
    operatorName,
    detail: `审批通过：${subject?.name || ''}-${finalOpinion}`,
    createdAt: now,
    fromStatus: record.status,
    toStatus: 'approved',
  })

  updateStagesAfterChange()
  return getSPRecord(id)!
}

export function rejectPublish(id: string, opinion: string, operatorRole: Role, operatorName: string): ScorePublishRecord {
  assertPermission(operatorRole, 'reject:sp')
  const record = getSPRecord(id)
  if (!record) throw new Error('[校验失败] 发布记录不存在')

  const allowedTransitions: Record<SPStatus, string[]> = {
    initiated: ['approve', 'reject'],
    approved: ['reject', 'confirm'],
    confirmed: [],
    rejected: [],
  }
  if (!allowedTransitions[record.status]?.includes('reject')) {
    throw new Error(`[状态错误] 当前状态「${getStatusLabel(record.status)}」不允许执行「驳回」操作`)
  }
  if (!opinion.trim()) throw new Error('[校验失败] 驳回意见不能为空')

  const now = new Date().toISOString()
  const subject = getSubject(record.subjectId)

  updateSPRecord(id, { status: 'rejected', rejectedBy: operatorName, opinion, rejectedAt: now })

  addAuditLog({
    id: nextId('log'),
    targetType: 'score-publish',
    targetId: id,
    action: 'reject',
    operatorRole,
    operatorName,
    detail: `驳回发布：${subject?.name || ''}-${opinion}`,
    createdAt: now,
    fromStatus: record.status,
    toStatus: 'rejected',
  })

  updateStagesAfterChange()
  return getSPRecord(id)!
}

export function confirmPublish(id: string, opinion: string, operatorRole: Role, operatorName: string): ScorePublishRecord {
  assertPermission(operatorRole, 'confirm:sp')
  const record = getSPRecord(id)
  if (!record) throw new Error('[校验失败] 发布记录不存在')

  const allowedTransitions: Record<SPStatus, string[]> = {
    initiated: ['approve', 'reject'],
    approved: ['reject', 'confirm'],
    confirmed: [],
    rejected: [],
  }
  if (!allowedTransitions[record.status]?.includes('confirm')) {
    throw new Error(`[状态错误] 当前状态「${getStatusLabel(record.status)}」不允许执行「确认发布」操作，需先由考务专员审批`)
  }
  if (!opinion.trim()) throw new Error('[校验失败] 确认意见不能为空')

  const now = new Date().toISOString()
  const subject = getSubject(record.subjectId)

  updateSPRecord(id, { status: 'confirmed', confirmedBy: operatorName, opinion, confirmedAt: now })

  addAuditLog({
    id: nextId('log'),
    targetType: 'score-publish',
    targetId: id,
    action: 'confirm',
    operatorRole,
    operatorName,
    detail: `确认发布：${subject?.name || ''}-${opinion}`,
    createdAt: now,
    fromStatus: record.status,
    toStatus: 'confirmed',
  })

  updateStagesAfterChange()
  return getSPRecord(id)!
}

export function getPublishReview(id: string) {
  const record = getSPRecord(id)
  if (!record) throw new Error('发布记录不存在')
  const logs = getAuditLogs().filter(l => l.targetType === 'score-publish' && l.targetId === id)
  return { record, auditLogs: logs }
}

export function getPublishFlow(id: string): {
  record: ScorePublishRecord
  auditLogs: AuditLog[]
  flow: { step: number; label: string; status: 'done' | 'current' | 'pending'; operator?: string; time?: string; detail?: string }[]
} {
  const { record, auditLogs } = getPublishReview(id)
  const subject = getSubject(record.subjectId)

  const flow = [
    {
      step: 1,
      label: '发起发布申请',
      status: 'done' as const,
      operator: record.initiatedBy,
      time: record.createdAt,
      detail: `${subject?.name || ''} 成绩发布申请已提交`,
    },
    {
      step: 2,
      label: '考务专员审批',
      status: (record.status === 'approved' || record.status === 'confirmed') ? 'done' as const : record.status === 'rejected' ? 'done' as const : record.status === 'initiated' ? 'current' as const : 'pending' as const,
      operator: record.status !== 'initiated' ? (record.rejectedBy || '考务专员') : undefined,
      time: record.status !== 'initiated' ? (record.rejectedAt || auditLogs.find(l => l.action === 'approve')?.createdAt) : undefined,
      detail: record.status === 'rejected' ? `已驳回：${record.opinion}` : record.status !== 'initiated' ? '审批通过' : '待考务专员审批',
    },
    {
      step: 3,
      label: '技术支持确认发布',
      status: record.status === 'confirmed' ? 'done' as const : record.status === 'approved' ? 'current' as const : 'pending' as const,
      operator: record.confirmedBy || undefined,
      time: record.confirmedAt || undefined,
      detail: record.status === 'confirmed' ? `已确认：${record.opinion}` : record.status === 'approved' ? '待技术支持与系统核对后确认发布' : '等待前置步骤完成',
    },
    {
      step: 4,
      label: '成绩已发布',
      status: record.status === 'confirmed' ? 'done' as const : 'pending' as const,
      operator: record.status === 'confirmed' ? '系统自动' : undefined,
      time: record.confirmedAt || undefined,
      detail: record.status === 'confirmed' ? '成绩数据已同步至查询系统，考生可查询' : '等待发布确认',
    },
  ]
  return { record, auditLogs, flow }
}

function getStatusLabel(status: SPStatus): string {
  const map: Record<SPStatus, string> = {
    initiated: '待审批(考务专员)', approved: '待确认(技术支持)', confirmed: '已发布', rejected: '已驳回'
  }
  return map[status] || status
}

function updateStagesAfterChange() {
  const progress = getStageProgress()
  const spProgress = progress.find(p => p.stage === 'score-publish')

  const total = getSPRecords().length
  const confirmed = getSPRecords().filter(r => r.status === 'confirmed').length
  const totalSubjects = 4

  if (total > 0 && confirmed === total && confirmed >= totalSubjects) {
    setStageStatus('score-publish', 'completed', '系统自动')
  } else if (total > 0) {
    setStageStatus('score-publish', 'active')
  }
}
