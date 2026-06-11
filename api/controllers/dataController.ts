import type { Request, Response } from 'express'
import { SeedData, buildTimeline, buildTrace } from '../services/dataService'
import type { Requisition, CheckIn, CablePoint, Shortage, ReturnRecord } from '../../shared/types'

function uid(prefix: string) {
  return prefix + '-' + Math.random().toString(36).slice(2, 8)
}

export const projectCtrl = {
  list: (_req: Request, res: Response) => res.json(SeedData.projects)
}

export const cableCtrl = {
  list: (_req: Request, res: Response) => res.json(SeedData.cables)
}

export const teamCtrl = {
  list: (_req: Request, res: Response) => res.json(SeedData.teams)
}

export const requisitionCtrl = {
  list: (req: Request, res: Response) => {
    const { projectId, status, teamId } = req.query
    let data = SeedData.requisitions.slice()
    if (projectId) data = data.filter(r => r.projectId === projectId)
    if (status) data = data.filter(r => r.status === status)
    if (teamId) data = data.filter(r => r.teamId === teamId)
    res.json(data)
  },
  get: (req: Request, res: Response) => {
    const r = SeedData.requisitions.find(x => x.id === req.params.id)
    r ? res.json(r) : res.status(404).json({ error: 'not found' })
  },
  create: (req: Request, res: Response) => {
    const body = req.body as Partial<Requisition>
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const code = `LL-${dateStr}-${String(SeedData.requisitions.length + 1).padStart(3, '0')}`
    const tags: Requisition['tags'] = ['normal']
    body.items?.forEach(it => {
      if (it.designQty && it.quantity > it.designQty * 1.1) {
        it.overFlag = true
        if (!tags.includes('over')) tags.push('over')
        tags.splice(tags.indexOf('normal'), 1)
      }
    })
    if (body.relatedId) {
      tags.push('supplement')
    }
    const record: Requisition = {
      id: uid('req'),
      code,
      projectId: body.projectId!,
      teamId: body.teamId!,
      items: body.items!,
      status: 'pending',
      tags,
      applicant: body.applicant || '张伟',
      applyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark: body.remark
    }
    SeedData.requisitions.unshift(record)
    res.status(201).json(record)
  },
  approve: (req: Request, res: Response) => {
    const r = SeedData.requisitions.find(x => x.id === req.params.id)
    if (!r) return res.status(404).json({ error: 'not found' })
    const { pass, remark, approver } = req.body
    r.status = pass ? 'approved' : 'rejected'
    r.approver = approver || '王建国'
    r.approveTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    r.approverRemark = remark
    res.json(r)
  },
  issue: (req: Request, res: Response) => {
    const r = SeedData.requisitions.find(x => x.id === req.params.id)
    if (!r) return res.status(404).json({ error: 'not found' })
    r.status = 'issued'
    r.issuer = req.body.issuer || '仓库刘主管'
    r.issueTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    res.json(r)
  }
}

export const checkinCtrl = {
  list: (req: Request, res: Response) => {
    const { projectId, teamId } = req.query
    let data = SeedData.checkins.slice()
    if (projectId) data = data.filter(c => c.projectId === projectId)
    if (teamId) data = data.filter(c => c.teamId === teamId)
    res.json(data)
  },
  create: (req: Request, res: Response) => {
    const body = req.body as Partial<CheckIn>
    const record: CheckIn = {
      id: uid('ck'),
      projectId: body.projectId!,
      teamId: body.teamId!,
      checkInTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      location: body.location || { lat: 31.2048, lng: 121.5970, address: '张江博云路2号' },
      workers: body.workers || [],
      weather: body.weather,
      remark: body.remark
    }
    SeedData.checkins.unshift(record)
    res.status(201).json(record)
  },
  checkout: (req: Request, res: Response) => {
    const c = SeedData.checkins.find(x => x.id === req.params.id)
    if (!c) return res.status(404).json({ error: 'not found' })
    c.checkOutTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    res.json(c)
  }
}

export const pointCtrl = {
  list: (req: Request, res: Response) => {
    const { requisitionId, projectId, checkInId } = req.query
    let data = SeedData.points.slice()
    if (requisitionId) data = data.filter(p => p.requisitionId === requisitionId)
    if (projectId) data = data.filter(p => p.projectId === projectId)
    if (checkInId) data = data.filter(p => p.checkInId === checkInId)
    res.json(data)
  },
  create: (req: Request, res: Response) => {
    const body = req.body as Partial<CablePoint>
    const record: CablePoint = {
      id: uid('pt'),
      checkInId: body.checkInId!,
      requisitionId: body.requisitionId!,
      projectId: body.projectId!,
      pointCode: body.pointCode!,
      cableId: body.cableId!,
      cableModel: body.cableModel!,
      usedMeters: body.usedMeters!,
      startPoint: body.startPoint || '',
      endPoint: body.endPoint || '',
      photos: body.photos || [],
      tester: body.tester || '',
      testResult: body.testResult || 'pending',
      remark: body.remark,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    }
    SeedData.points.unshift(record)
    res.status(201).json(record)
  }
}

export const shortageCtrl = {
  list: (req: Request, res: Response) => {
    const { projectId, status } = req.query
    let data = SeedData.shortages.slice()
    if (projectId) data = data.filter(s => s.projectId === projectId)
    if (status) data = data.filter(s => s.status === status)
    res.json(data)
  },
  create: (req: Request, res: Response) => {
    const body = req.body as Partial<Shortage>
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const code = `QL-${today}-${String(SeedData.shortages.length + 1).padStart(3, '0')}`
    const record: Shortage = {
      id: uid('s'),
      code,
      projectId: body.projectId!,
      checkInId: body.checkInId!,
      cableId: body.cableId!,
      cableModel: body.cableModel!,
      shortageQty: body.shortageQty!,
      priority: body.priority || 'normal',
      photos: body.photos || [],
      reporter: body.reporter || '李强',
      reportTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'reported',
      remark: body.remark
    }
    SeedData.shortages.unshift(record)
    res.status(201).json(record)
  },
  update: (req: Request, res: Response) => {
    const s = SeedData.shortages.find(x => x.id === req.params.id)
    if (!s) return res.status(404).json({ error: 'not found' })
    Object.assign(s, req.body)
    res.json(s)
  }
}

export const returnCtrl = {
  list: (req: Request, res: Response) => {
    const { projectId, status, teamId } = req.query
    let data = SeedData.returns.slice()
    if (projectId) data = data.filter(r => r.projectId === projectId)
    if (status) data = data.filter(r => r.status === status)
    if (teamId) data = data.filter(r => r.teamId === teamId)
    res.json(data)
  },
  create: (req: Request, res: Response) => {
    const body = req.body as Partial<ReturnRecord>
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const code = `TH-${today}-${String(SeedData.returns.length + 1).padStart(3, '0')}`
    const record: ReturnRecord = {
      id: uid('rt'),
      code,
      requisitionId: body.requisitionId!,
      projectId: body.projectId!,
      teamId: body.teamId!,
      items: body.items!,
      returner: body.returner || '李强',
      returnTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      receiver: body.receiver || '仓库刘主管',
      photos: body.photos || [],
      status: 'pending',
      remark: body.remark
    }
    SeedData.returns.unshift(record)
    res.status(201).json(record)
  },
  receive: (req: Request, res: Response) => {
    const r = SeedData.returns.find(x => x.id === req.params.id)
    if (!r) return res.status(404).json({ error: 'not found' })
    r.status = 'received'
    r.receiveTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
    r.receiver = req.body.receiver || r.receiver
    res.json(r)
  }
}

export const timelineCtrl = {
  get: (req: Request, res: Response) => {
    const pid = req.params.projectId || SeedData.projects[0].id
    res.json(buildTimeline(pid))
  }
}

export const traceCtrl = {
  get: (req: Request, res: Response) => {
    const rid = req.params.requisitionId
    const { projectId } = req.query
    res.json(buildTrace(rid, projectId as string | undefined))
  }
}

function csvEscape(v: string | number): string {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function sendCsv(res: Response, filename: string, rows: (string | number)[][]) {
  const bom = '\uFEFF'
  const csv = bom + rows.map(r => r.map(csvEscape).join(',')).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  res.send(csv)
}

function inDateRange(t: string, from?: string, to?: string): boolean {
  if (!t) return true
  const d = t.slice(0, 10)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

function fileSuffix(from?: string, to?: string): string {
  if (from && to) return `${from}_${to}`
  if (from) return `${from}_至今`
  if (to) return `至_${to}`
  return new Date().toISOString().slice(0, 10)
}

export const exportCtrl = {
  requisitions: (req: Request, res: Response) => {
    const { projectId, from, to } = req.query
    const pid = projectId as string | undefined
    const fromStr = from as string | undefined
    const toStr = to as string | undefined
    let rows = buildTrace(undefined, pid)
    if (fromStr || toStr) {
      const reqIds = new Set(
        SeedData.requisitions
          .filter(r => inDateRange(r.applyTime, fromStr, toStr))
          .map(r => r.code)
      )
      rows = rows.filter(r => reqIds.has(r.requisitionCode))
    }
    const header = ['领料单号', '标签', '线缆型号', '设计量', '申请量', '已使用量', '已退回量', '结余', '关联点位数量', '状态说明']
    const data = rows.map(r => [
      r.requisitionCode,
      r.tags.join('/'),
      r.cableModel,
      r.designQty,
      r.appliedQty,
      r.usedQty,
      r.returnedQty,
      r.balance,
      r.usedPoints.length,
      r.balance < 0 ? '超支' : r.balance > 0 ? '有结余' : '刚好用完'
    ])
    sendCsv(res, `领料追溯汇总_${pid || '全部'}_${fileSuffix(fromStr, toStr)}.csv`, [header, ...data])
  },
  points: (req: Request, res: Response) => {
    const { projectId, from, to } = req.query
    const pid = projectId as string | undefined
    const fromStr = from as string | undefined
    const toStr = to as string | undefined
    let pts = SeedData.points.slice()
    if (pid) pts = pts.filter(p => p.projectId === pid)
    if (fromStr || toStr) pts = pts.filter(p => inDateRange(p.createTime, fromStr, toStr))
    const header = ['点位编号', '所属项目', '关联领料单', '线缆型号', '使用米数', '起点', '终点', '测试结果', '测试人', '记录时间', '照片数量', '照片URL', '备注']
    const data = pts.map(p => [
      p.pointCode,
      SeedData.projects.find(x => x.id === p.projectId)?.name || p.projectId,
      (SeedData.requisitions.find(r => r.id === p.requisitionId)?.code) || p.requisitionId,
      p.cableModel,
      p.usedMeters,
      p.startPoint,
      p.endPoint,
      p.testResult === 'pass' ? '合格' : p.testResult === 'fail' ? '不合格' : '待检',
      p.tester || '未测',
      p.createTime,
      p.photos.length,
      p.photos.join('; ') || '无',
      p.remark || ''
    ])
    sendCsv(res, `点位照片清单_${pid || '全部'}_${fileSuffix(fromStr, toStr)}.csv`, [header, ...data])
  },
  returns: (req: Request, res: Response) => {
    const { projectId, from, to } = req.query
    const pid = projectId as string | undefined
    const fromStr = from as string | undefined
    const toStr = to as string | undefined
    let rts = SeedData.returns.slice()
    if (pid) rts = rts.filter(r => r.projectId === pid)
    if (fromStr || toStr) rts = rts.filter(r => inDateRange(r.returnTime, fromStr, toStr))
    const header = ['退回单号', '关联领料单', '所属项目', '班组', '退回人', '退回时间', '状态', '物品明细', '照片数量', '仓库接收人', '接收时间', '备注']
    const data = rts.map(r => [
      r.code,
      SeedData.requisitions.find(x => x.id === r.requisitionId)?.code || r.requisitionId,
      SeedData.projects.find(x => x.id === r.projectId)?.name || r.projectId,
      SeedData.teams.find(x => x.id === r.teamId)?.name || r.teamId,
      r.returner,
      r.returnTime,
      r.status === 'received' ? '已接收' : '待接收',
      r.items.map(it => `${it.cableModel} x${it.returnQty} (${it.condition === 'good' ? '完好' : it.condition === 'damaged' ? '破损' : '部分'})`).join('；'),
      r.photos.length,
      r.receiver || '',
      r.receiveTime || '',
      r.remark || ''
    ])
    sendCsv(res, `退回记录明细_${pid || '全部'}_${fileSuffix(fromStr, toStr)}.csv`, [header, ...data])
  },
  checkins: (req: Request, res: Response) => {
    const { projectId, from, to } = req.query
    const pid = projectId as string | undefined
    const fromStr = from as string | undefined
    const toStr = to as string | undefined
    let cks = SeedData.checkins.slice()
    if (pid) cks = cks.filter(c => c.projectId === pid)
    if (fromStr || toStr) cks = cks.filter(c => inDateRange(c.checkInTime, fromStr, toStr))
    const header = ['打卡单号', '所属项目', '班组', '签到时间', '签退时间', '工人名单', '人数', '位置', '天气', '备注']
    const data = cks.map(c => [
      c.id,
      SeedData.projects.find(x => x.id === c.projectId)?.name || c.projectId,
      SeedData.teams.find(x => x.id === c.teamId)?.name || c.teamId,
      c.checkInTime,
      c.checkOutTime || '未签退',
      c.workers.join('、'),
      c.workers.length,
      c.location?.address || `${c.location?.lat}, ${c.location?.lng}`,
      c.weather || '晴',
      c.remark || ''
    ])
    sendCsv(res, `打卡考勤记录_${pid || '全部'}_${fileSuffix(fromStr, toStr)}.csv`, [header, ...data])
  },
  shortages: (req: Request, res: Response) => {
    const { projectId, from, to } = req.query
    const pid = projectId as string | undefined
    const fromStr = from as string | undefined
    const toStr = to as string | undefined
    let ss = SeedData.shortages.slice()
    if (pid) ss = ss.filter(s => s.projectId === pid)
    if (fromStr || toStr) ss = ss.filter(s => inDateRange(s.reportTime, fromStr, toStr))
    const header = ['缺料单号', '所属项目', '关联打卡单', '线缆型号', '缺料数量', '紧急程度', '上报人', '上报时间', '状态', '照片数量', '照片URL', '关联补领单', '备注']
    const data = ss.map(s => [
      s.code,
      SeedData.projects.find(x => x.id === s.projectId)?.name || s.projectId,
      s.checkInId,
      s.cableModel,
      s.shortageQty,
      s.priority === 'critical' ? '特急' : s.priority === 'urgent' ? '紧急' : '普通',
      s.reporter,
      s.reportTime,
      s.status === 'reported' ? '已上报' : s.status === 'approved' ? '已批准' : s.status === 'supplied' ? '已补供' : '已关闭',
      s.photos.length,
      s.photos.join('; ') || '无',
      s.supplementReqId || '未关联',
      s.remark || ''
    ])
    sendCsv(res, `缺料上报记录_${pid || '全部'}_${fileSuffix(fromStr, toStr)}.csv`, [header, ...data])
  },
  pdf: async (req: Request, res: Response) => {
    const { projectId, from, to, modules } = req.query
    const pid = projectId as string | undefined
    const fromStr = from as string | undefined
    const toStr = to as string | undefined
    const modList = (modules as string || 'requisition,point,return,checkin,shortage').split(',')

    const projectName = pid
      ? (SeedData.projects.find(p => p.id === pid)?.name || '全部项目')
      : '全部项目'
    const dateRange = fromStr || toStr ? `（${fromStr || '不限'} ~ ${toStr || '不限'}）` : ''
    const exportTime = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const moduleNames: Record<string, string> = {
      requisition: '领料台账',
      point: '点位记录',
      return: '退回记录',
      checkin: '打卡考勤',
      shortage: '缺料上报'
    }

    let reqs = buildTrace(undefined, pid)
    if (fromStr || toStr) {
      const reqIds = new Set(
        SeedData.requisitions
          .filter(r => inDateRange(r.applyTime, fromStr, toStr))
          .map(r => r.code)
      )
      reqs = reqs.filter(r => reqIds.has(r.requisitionCode))
    }
    let pts = SeedData.points.slice()
    if (pid) pts = pts.filter(p => p.projectId === pid)
    if (fromStr || toStr) pts = pts.filter(p => inDateRange(p.createTime, fromStr, toStr))
    let rts = SeedData.returns.slice()
    if (pid) rts = rts.filter(r => r.projectId === pid)
    if (fromStr || toStr) rts = rts.filter(r => inDateRange(r.returnTime, fromStr, toStr))
    let cks = SeedData.checkins.slice()
    if (pid) cks = cks.filter(c => c.projectId === pid)
    if (fromStr || toStr) cks = cks.filter(c => inDateRange(c.checkInTime, fromStr, toStr))
    let ss = SeedData.shortages.slice()
    if (pid) ss = ss.filter(s => s.projectId === pid)
    if (fromStr || toStr) ss = ss.filter(s => inDateRange(s.reportTime, fromStr, toStr))

    const totalDesign = reqs.reduce((s, r) => s + r.designQty, 0)
    const totalUsed = reqs.reduce((s, r) => s + r.usedQty, 0)
    const totalReturned = reqs.reduce((s, r) => s + r.returnedQty, 0)
    const totalBalance = reqs.reduce((s, r) => s + r.balance, 0)
    const overCount = reqs.filter(r => r.tags.includes('over')).length
    const wrongCount = reqs.filter(r => r.tags.includes('wrong')).length
    const supplementCount = reqs.filter(r => r.tags.includes('supplement')).length

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>弱电施工竣工资料 - ${projectName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "SimSun", sans-serif; padding: 40px; color: #333; line-height: 1.6; }
  .cover { text-align: center; padding: 80px 0; border-bottom: 2px solid #1E40AF; margin-bottom: 40px; }
  .cover h1 { font-size: 36px; color: #1E40AF; margin-bottom: 20px; }
  .cover h2 { font-size: 20px; color: #666; margin-bottom: 40px; }
  .cover .meta { font-size: 14px; color: #999; }
  .section { margin-bottom: 40px; }
  .section h3 { font-size: 18px; color: #1E40AF; border-left: 4px solid #1E40AF; padding-left: 12px; margin-bottom: 16px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat { background: #f5f7fa; padding: 16px; border-radius: 4px; }
  .stat .label { font-size: 12px; color: #999; margin-bottom: 4px; }
  .stat .value { font-size: 24px; font-weight: bold; color: #1E40AF; }
  .stat.warn .value { color: #EA580C; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  th { background: #f0f4ff; color: #1E40AF; padding: 8px; text-align: left; border: 1px solid #dbeafe; }
  td { padding: 8px; border: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #fafafa; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-right: 4px; }
  .tag-over { background: #fef3c7; color: #92400e; }
  .tag-wrong { background: #f3f4f6; color: #4b5563; }
  .tag-supplement { background: #dbeafe; color: #1e40af; }
  .tag-normal { background: #dcfce7; color: #166534; }
  .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
  .photo-grid img { width: 100%; height: 80px; object-fit: cover; border-radius: 3px; }
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px; }
  .page-break { page-break-before: always; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="cover">
  <h1>弱电施工线缆管理竣工资料</h1>
  <h2>${projectName} ${dateRange}</h2>
  <p class="meta">导出时间：${exportTime}</p>
  <p class="meta">资料员：王建国 &nbsp;&nbsp; 项目负责人：王建国</p>
</div>

<div class="section">
  <h3>一、项目数据汇总</h3>
  <div class="summary">
    <div class="stat"><div class="label">设计总量</div><div class="value">${totalDesign.toFixed(2)}</div></div>
    <div class="stat"><div class="label">已使用</div><div class="value">${totalUsed.toFixed(2)}</div></div>
    <div class="stat"><div class="label">已退回</div><div class="value">${totalReturned.toFixed(2)}</div></div>
    <div class="stat"><div class="label">结余</div><div class="value">${totalBalance.toFixed(2)}</div></div>
    <div class="stat"><div class="label">领料单总数</div><div class="value">${reqs.length}</div></div>
    <div class="stat"><div class="label">点位记录</div><div class="value">${pts.length}</div></div>
    <div class="stat warn"><div class="label">超领/错领</div><div class="value">${overCount + wrongCount}</div></div>
    <div class="stat warn"><div class="label">补领次数</div><div class="value">${supplementCount}</div></div>
  </div>
</div>`

    if (modList.includes('requisition')) {
      html += `
<div class="section page-break">
  <h3>二、领料台账汇总</h3>
  <table>
    <thead><tr><th>单号</th><th>标签</th><th>线缆型号</th><th>设计量</th><th>申请量</th><th>已使用</th><th>已退回</th><th>结余</th><th>状态</th></tr></thead>
    <tbody>`
      for (const r of reqs) {
        const tags = r.tags.map(t => `<span class="tag tag-${t}">${t === 'over' ? '超领' : t === 'wrong' ? '错领' : t === 'supplement' ? '补领' : '正常'}</span>`).join('')
        const status = r.balance < 0 ? '<span style="color:#dc2626">超支</span>' : r.balance > 0 ? '<span style="color:#059669">有结余</span>' : '<span style="color:#6b7280">刚好用完</span>'
        html += `<tr><td>${r.requisitionCode}</td><td>${tags}</td><td>${r.cableModel}</td><td>${r.designQty}</td><td>${r.appliedQty}</td><td>${r.usedQty}</td><td>${r.returnedQty}</td><td>${r.balance.toFixed(2)}</td><td>${status}</td></tr>`
      }
      html += `</tbody></table>
</div>`
    }

    if (modList.includes('point')) {
      html += `
<div class="section page-break">
  <h3>三、点位记录与照片清单</h3>
  <table>
    <thead><tr><th>点位号</th><th>线缆型号</th><th>使用米数</th><th>起终点</th><th>测试结果</th><th>测试人</th><th>记录时间</th><th>照片</th></tr></thead>
    <tbody>`
      for (const p of pts) {
        const tr = p.testResult === 'pass' ? '<span style="color:#059669">合格</span>' : p.testResult === 'fail' ? '<span style="color:#dc2626">不合格</span>' : '<span style="color:#d97706">待检</span>'
        const photos = p.photos.slice(0, 4).map(url => `<img src="${url}" alt="点位照片" />`).join('')
        const photoGrid = photos ? `<div class="photo-grid">${photos}</div>${p.photos.length > 4 ? `<div style="font-size:11px;color:#999;margin-top:4px">共 ${p.photos.length} 张照片</div>` : ''}` : '<span style="color:#999">无</span>'
        html += `<tr><td>${p.pointCode}</td><td>${p.cableModel}</td><td>${p.usedMeters}m</td><td>${p.startPoint} → ${p.endPoint}</td><td>${tr}</td><td>${p.tester || '-'}  </td><td>${p.createTime}</td><td>${photoGrid}</td></tr>`
      }
      html += `</tbody></table>
</div>`
    }

    if (modList.includes('return')) {
      html += `
<div class="section page-break">
  <h3>四、材料退回记录</h3>
  <table>
    <thead><tr><th>退回单号</th><th>关联领料单</th><th>退回人</th><th>退回时间</th><th>物品明细</th><th>状态</th><th>仓库接收人</th><th>照片</th></tr></thead>
    <tbody>`
      for (const r of rts) {
        const items = r.items.map(it => `${it.cableModel} ×${it.returnQty} (${it.condition === 'good' ? '完好' : it.condition === 'damaged' ? '破损' : '部分'})`).join('<br/>')
        const st = r.status === 'received' ? '<span style="color:#059669">已接收</span>' : '<span style="color:#d97706">待接收</span>'
        const photos = r.photos.slice(0, 4).map(url => `<img src="${url}" alt="退回照片" />`).join('')
        const photoGrid = photos ? `<div class="photo-grid">${photos}</div>` : '<span style="color:#999">无</span>'
        html += `<tr><td>${r.code}</td><td>${SeedData.requisitions.find(x => x.id === r.requisitionId)?.code || r.requisitionId}</td><td>${r.returner}</td><td>${r.returnTime}</td><td>${items}</td><td>${st}</td><td>${r.receiver || '-'}</td><td>${photoGrid}</td></tr>`
      }
      html += `</tbody></table>
</div>`
    }

    if (modList.includes('checkin')) {
      html += `
<div class="section page-break">
  <h3>五、打卡考勤记录</h3>
  <table>
    <thead><tr><th>序号</th><th>班组</th><th>签到时间</th><th>签退时间</th><th>工人名单</th><th>人数</th><th>位置</th><th>天气</th></tr></thead>
    <tbody>`
      for (let i = 0; i < cks.length; i++) {
        const c = cks[i]
        html += `<tr><td>${i + 1}</td><td>${SeedData.teams.find(x => x.id === c.teamId)?.name || c.teamId}</td><td>${c.checkInTime}</td><td>${c.checkOutTime || '未签退'}</td><td>${c.workers.join('、')}</td><td>${c.workers.length}</td><td>${c.location?.address || '已定位'}</td><td>${c.weather || '晴'}</td></tr>`
      }
      html += `</tbody></table>
</div>`
    }

    if (modList.includes('shortage')) {
      html += `
<div class="section page-break">
  <h3>六、缺料上报与补领记录</h3>
  <table>
    <thead><tr><th>缺料单号</th><th>线缆型号</th><th>缺料数量</th><th>紧急程度</th><th>上报人</th><th>上报时间</th><th>状态</th><th>关联补领单</th><th>备注</th></tr></thead>
    <tbody>`
      for (const s of ss) {
        const pr = s.priority === 'critical' ? '<span style="color:#dc2626;font-weight:bold">特急</span>' : s.priority === 'urgent' ? '<span style="color:#ea580c;font-weight:bold">紧急</span>' : '普通'
        const st = s.status === 'reported' ? '已上报' : s.status === 'approved' ? '已批准' : s.status === 'supplied' ? '已补供' : '已关闭'
        html += `<tr><td>${s.code}</td><td>${s.cableModel}</td><td>${s.shortageQty}</td><td>${pr}</td><td>${s.reporter}</td><td>${s.reportTime}</td><td>${st}</td><td>${s.supplementReqId || '-'}</td><td>${s.remark || ''}</td></tr>`
      }
      html += `</tbody></table>
</div>`
    }

    html += `
<div class="footer">
  <p>本资料由弱电施工线缆管理系统自动生成，共 ${modList.length} 个模块</p>
  <p>打印时间：${new Date().toISOString().replace('T', ' ').slice(0, 19)}</p>
</div>
</body>
</html>`

    const filename = `竣工资料_${projectName}_${fileSuffix(fromStr, toStr)}.html`
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(html)
  }
}
