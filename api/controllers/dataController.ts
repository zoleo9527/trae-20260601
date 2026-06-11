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

export const exportCtrl = {
  requisitions: (req: Request, res: Response) => {
    const { projectId } = req.query
    const pid = projectId as string | undefined
    const rows = buildTrace(undefined, pid)
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
    sendCsv(res, `领料追溯汇总_${pid || '全部'}_${new Date().toISOString().slice(0, 10)}.csv`, [header, ...data])
  },
  points: (req: Request, res: Response) => {
    const { projectId } = req.query
    let pts = SeedData.points.slice()
    if (projectId) pts = pts.filter(p => p.projectId === projectId)
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
    sendCsv(res, `点位照片清单_${projectId || '全部'}_${new Date().toISOString().slice(0, 10)}.csv`, [header, ...data])
  },
  returns: (req: Request, res: Response) => {
    const { projectId } = req.query
    let rts = SeedData.returns.slice()
    if (projectId) rts = rts.filter(r => r.projectId === projectId)
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
    sendCsv(res, `退回记录明细_${projectId || '全部'}_${new Date().toISOString().slice(0, 10)}.csv`, [header, ...data])
  }
}
