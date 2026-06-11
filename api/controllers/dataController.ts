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
  list: (_req: Request, res: Response) => res.json(SeedData.checkins),
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
  list: (_req: Request, res: Response) => res.json(SeedData.shortages),
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
  list: (_req: Request, res: Response) => res.json(SeedData.returns),
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
    res.json(buildTrace(rid))
  }
}
