import type { TimelineEvent, TimelineType, TraceRow } from '../../shared/types'
import { projects, cables, teams, requisitions, checkins, points, shortages, returns } from '../data/seed'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export const SeedData = {
  projects: clone(projects),
  cables: clone(cables),
  teams: clone(teams),
  requisitions: clone(requisitions),
  checkins: clone(checkins),
  points: clone(points),
  shortages: clone(shortages),
  returns: clone(returns)
}

function colorByType(t: TimelineType): string {
  const map: Record<TimelineType, string> = {
    requisition: '#3B82F6',
    approve: '#10B981',
    issue: '#6366F1',
    checkin: '#06B6D4',
    point: '#8B5CF6',
    shortage: '#EA580C',
    supplement: '#F59E0B',
    return: '#14B8A6',
    archive: '#64748B'
  }
  return map[t]
}

export function buildTimeline(projectId: string): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const reqs = SeedData.requisitions.filter(r => r.projectId === projectId)
  const cks = SeedData.checkins.filter(c => c.projectId === projectId)
  const pts = SeedData.points.filter(p => p.projectId === projectId)
  const ss = SeedData.shortages.filter(s => s.projectId === projectId)
  const rts = SeedData.returns.filter(r => r.projectId === projectId)

  for (const r of reqs) {
    events.push({ id: 'req-' + r.id, type: 'requisition', title: `领料申请 ${r.code}`, description: `${r.applicant}提交申请，共${r.items.reduce((s,i)=>s+i.quantity,0)}项线缆`, time: r.applyTime, operator: r.applicant, relatedId: r.id, color: colorByType('requisition') })
    if (r.approveTime && r.approver) {
      events.push({ id: 'apr-' + r.id, type: 'approve', title: r.status === 'rejected' ? '审批驳回' : '审批通过', description: r.approverRemark || '无备注', time: r.approveTime, operator: r.approver!, relatedId: r.id, color: colorByType('approve') })
    }
    if (r.issueTime && r.issuer) {
      events.push({ id: 'iss-' + r.id, type: 'issue', title: '仓库发料', description: `${r.issuer}确认出库，领用人签字：${r.applicant}`, time: r.issueTime, operator: r.issuer, relatedId: r.id, color: colorByType('issue') })
    }
    if (r.tags.includes('supplement')) {
      events.push({ id: 'sup-' + r.id, type: 'supplement', title: `补领关联 ${r.code}`, description: '关联缺料单，紧急补领流程', time: r.applyTime, operator: r.applicant, relatedId: r.id, color: colorByType('supplement') })
    }
  }
  for (const c of cks) {
    events.push({ id: 'ck-' + c.id, type: 'checkin', title: '班组到场签到', description: `${c.workers.join('、')} 共${c.workers.length}人，${c.weather || ''}`, time: c.checkInTime, operator: c.workers[0], relatedId: c.id, color: colorByType('checkin') })
  }
  for (const p of pts) {
    events.push({ id: 'pt-' + p.id, type: 'point', title: `点位记录 ${p.pointCode}`, description: `${p.cableModel} 使用 ${p.usedMeters}米，测试${p.testResult === 'pass' ? '合格' : p.testResult === 'fail' ? '不合格' : '待检'}`, time: p.createTime, operator: p.tester, relatedId: p.id, color: colorByType('point') })
  }
  for (const s of ss) {
    events.push({ id: 's-' + s.id, type: 'shortage', title: `缺料上报 ${s.code}`, description: `${s.cableModel} 缺 ${s.shortageQty}${s.priority === 'critical' ? '【紧急】' : s.priority === 'urgent' ? '【急】' : ''}`, time: s.reportTime, operator: s.reporter, relatedId: s.id, color: colorByType('shortage') })
  }
  for (const r of rts) {
    events.push({ id: 'rt-' + r.id, type: 'return', title: `材料退回 ${r.code}`, description: `共${r.items.length}项，${r.status === 'received' ? '仓库已接收' : '待接收'}`, time: r.returnTime, operator: r.returner, relatedId: r.id, color: colorByType('return') })
  }
  events.sort((a, b) => a.time.localeCompare(b.time))
  if (events.length > 0) {
    const last = events[events.length - 1]
    events.push({ id: 'archive-done', type: 'archive', title: '资料归档节点', description: '项目待竣工，资料员整理资料', time: last.time.replace(/\d{2}:\d{2}:\d{2}/, '20:00:00'), operator: '资料员', relatedId: 'archive', color: colorByType('archive') })
  }
  return events
}

export function buildTrace(requisitionId?: string): TraceRow[] {
  const reqs = requisitionId
    ? SeedData.requisitions.filter(r => r.id === requisitionId)
    : SeedData.requisitions
  const rows: TraceRow[] = []
  for (const r of reqs) {
    for (const item of r.items) {
      const usedPoints = SeedData.points
        .filter(p => p.requisitionId === r.id && p.cableId === item.cableId)
        .map(p => ({
          pointCode: p.pointCode,
          usedMeters: p.usedMeters,
          testResult: p.testResult,
          createTime: p.createTime,
          photos: p.photos
        }))
      const usedMetersSum = usedPoints.reduce((s, p) => s + p.usedMeters, 0)
      const metersPerUnit = item.cableModel.includes('305') ? 305 : 1
      const usedQty = metersPerUnit === 1 ? usedMetersSum : +(usedMetersSum / metersPerUnit).toFixed(2)
      const returned = SeedData.returns
        .filter(rt => rt.requisitionId === r.id)
        .flatMap(rt => rt.items)
        .filter(it => it.cableId === item.cableId)
        .reduce((s, it) => s + it.returnQty, 0)
      rows.push({
        requisitionCode: r.code,
        requisitionId: r.id,
        tags: r.tags,
        cableModel: item.cableModel,
        appliedQty: item.quantity,
        designQty: item.designQty ?? 0,
        usedQty,
        usedPoints,
        returnedQty: returned,
        balance: +(item.quantity - usedQty - returned).toFixed(2)
      })
    }
  }
  return rows
}
