import {
  getExportTasks, getExportTask, addExportTask, updateExportTask,
  getAVRecords, getSPRecords, getCandidate, getRoom, getSubject,
  nextId, assertPermission, getCandidates, addAuditLog
} from '../data/repository.js'
import type { ExportType, ExportTask, Role } from '../../shared/types.js'

export function listExportTasks() {
  return getExportTasks()
}

export function getExportTaskById(id: string) {
  return getExportTask(id)
}

export function createExportTask(type: ExportType, filters: Record<string, string>, operatorRole: Role, operatorName: string): ExportTask {
  assertPermission(operatorRole, 'manage:export')

  const now = new Date().toISOString()
  const task: ExportTask = {
    id: nextId('exp'),
    type,
    status: 'pending',
    createdBy: operatorName,
    downloadUrl: null,
    filters,
    createdAt: now,
    completedAt: null,
    recordCount: 0,
  }
  addExportTask(task)

  addAuditLog({
    id: nextId('log'),
    targetType: 'export',
    targetId: task.id,
    action: 'create',
    operatorRole,
    operatorName,
    detail: `创建导出任务：${type === 'absence-violation' ? '缺考违纪数据' : '成绩数据'}，筛选条件：${JSON.stringify(filters)}`,
    createdAt: now,
  })

  setTimeout(() => processExportTask(task.id), 800)
  return task
}

function processExportTask(id: string) {
  const task = getExportTask(id)
  if (!task) return
  updateExportTask(id, { status: 'processing' })

  setTimeout(() => {
    try {
      const count = calculateRecordCount(task)
      updateExportTask(id, {
        status: 'completed',
        downloadUrl: `/api/export/${id}/download`,
        completedAt: new Date().toISOString(),
        recordCount: count,
      })
    } catch {
      updateExportTask(id, { status: 'failed' })
    }
  }, 2500)
}

function calculateRecordCount(task: ExportTask): number {
  if (task.type === 'absence-violation') {
    let records = getAVRecords()
    if (task.filters.roomId) records = records.filter(r => r.roomId === task.filters.roomId)
    if (task.filters.subjectId) records = records.filter(r => r.subjectId === task.filters.subjectId)
    if (task.filters.status) records = records.filter(r => r.status === task.filters.status)
    if (task.filters.type) records = records.filter(r => r.type === task.filters.type)
    return records.length
  } else {
    let records = getSPRecords()
    if (task.filters.status) records = records.filter(r => r.status === task.filters.status)
    if (task.filters.subjectId) records = records.filter(r => r.subjectId === task.filters.subjectId)
    return records.reduce((sum, r) => sum + r.summary.total, 0)
  }
}

export function getExportDownload(id: string): { csv: string; filename: string } {
  const task = getExportTask(id)
  if (!task) throw new Error('导出任务不存在')
  if (task.status !== 'completed') throw new Error('导出任务未完成')
  if (task.type === 'absence-violation') return { csv: generateAVCsv(task.filters), filename: `缺考违纪数据_${Date.now()}.csv` }
  return { csv: generateScoreCsv(task.filters), filename: `成绩数据_${Date.now()}.csv` }
}

function generateAVCsv(filters: Record<string, string>): string {
  let records = getAVRecords()
  if (filters.roomId) records = records.filter(r => r.roomId === filters.roomId)
  if (filters.subjectId) records = records.filter(r => r.subjectId === filters.subjectId)
  if (filters.status) records = records.filter(r => r.status === filters.status)
  if (filters.type) records = records.filter(r => r.type === filters.type)

  const statusMap: Record<string, string> = {
    pending: '待审核', approved: '已通过', rejected: '已驳回', supplemented: '已补录', resubmitted: '重新提交待审'
  }
  const typeMap: Record<string, string> = { absence: '缺考', violation: '违纪' }
  const violationMap: Record<string, string> = {
    cheat: '作弊', impersonate: '替考', disrupt: '扰乱考场', device: '携带设备', other: '其他'
  }

  const header = '记录ID,考生姓名,准考证号,类型,违纪类型,考场,科目,状态,提交人,审核人,审核意见,备注,版本,创建时间,审核时间,关联父记录'
  const rows = records.map(r => {
    const cand = getCandidate(r.candidateId)
    const room = getRoom(r.roomId)
    const subj = getSubject(r.subjectId)
    return [
      r.id,
      cand?.name || '',
      cand?.ticketNo || '',
      typeMap[r.type] || r.type,
      r.violationType ? (violationMap[r.violationType] || r.violationType) : '',
      room?.name || r.roomId,
      subj?.name || r.subjectId,
      statusMap[r.status] || r.status,
      r.submittedBy,
      r.reviewedBy || '',
      (r.opinion || '').replace(/,/g, '，').replace(/\n/g, ' '),
      (r.remark || '').replace(/,/g, '，').replace(/\n/g, ' '),
      `v${r.version || 1}`,
      r.createdAt,
      r.reviewedAt || '',
      r.parentId || '',
    ].join(',')
  })
  return [header, ...rows].join('\n')
}

function generateScoreCsv(filters: Record<string, string>): string {
  let spRecords = getSPRecords()
  if (filters.status) spRecords = spRecords.filter(r => r.status === filters.status)
  if (filters.subjectId) spRecords = spRecords.filter(r => r.subjectId === filters.subjectId)

  const candidates = getCandidates()
  const statusMap: Record<string, string> = {
    initiated: '待审批', approved: '已审批', confirmed: '已发布', rejected: '已驳回'
  }

  const header = '科目,状态,总人数,及格人数,不及格人数,及格率,最高分,最低分,平均分,发起人,审批人,确认人,意见,创建时间,审批时间,确认时间,版本'
  const rows = spRecords.map(r => {
    const subj = getSubject(r.subjectId)
    const passRate = r.summary.total > 0 ? ((r.summary.pass / r.summary.total) * 100).toFixed(1) + '%' : '-'
    return [
      subj?.name || r.subjectId,
      statusMap[r.status] || r.status,
      r.summary.total,
      r.summary.pass,
      r.summary.fail,
      passRate,
      r.summary.max,
      r.summary.min,
      r.summary.avg,
      r.initiatedBy,
      r.rejectedBy || '',
      r.confirmedBy || '',
      (r.opinion || '').replace(/,/g, '，').replace(/\n/g, ' '),
      r.createdAt,
      r.rejectedAt || '',
      r.confirmedAt || '',
      `v${r.version || 1}`,
    ].join(',')
  })

  const detailHeader = '\n\n--- 考生明细 ---\n准考证号,姓名,考场,科目,成绩,缺考违纪记录数'
  let detailRows: string[] = []
  const subjectFilter = filters.subjectId
  candidates.forEach(c => {
    if (subjectFilter && c.subjectId !== subjectFilter) return
    const room = getRoom(c.roomId)
    const subj = getSubject(c.subjectId)
    const avCount = getAVRecords().filter(r => r.candidateId === c.id).length
    detailRows.push([
      c.ticketNo, c.name, room?.name || c.roomId, subj?.name || c.subjectId,
      c.score != null ? c.score : '-', avCount
    ].join(','))
  })

  return [header, ...rows, detailHeader, ...detailRows].join('\n')
}
