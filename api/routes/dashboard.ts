import { Router, type Request, type Response } from 'express'
import {
  getExam, getAVRecords, getSPRecords, getAuditLogs, getCandidates,
  getRegistrationInfo, getRoomArrangementInfo, getInvigilatorInfo,
  getStageProgress, getStageStatus, setStageStatus, addAuditLog, nextId, assertPermission
} from '../data/repository.js'
import type { StageName, Role } from '../../shared/types.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const exam = getExam()
  const avRecords = getAVRecords()
  const spRecords = getSPRecords()
  const recentLogs = getAuditLogs().slice(0, 10)
  const pendingAV = avRecords.filter(r => r.status === 'pending' || r.status === 'resubmitted').length
  const pendingSP = spRecords.filter(r => r.status === 'initiated' || r.status === 'approved').length
  const progress = getStageProgress()

  const stageNameMap: Record<StageName, string> = {
    'registration': '报名数据',
    'room-arrangement': '考场编排',
    'invigilator-assignment': '监考名单',
    'absence-violation': '缺考违纪',
    'score-publish': '成绩发布',
  }

  const stages = progress.map(p => {
    const status = getStageStatus(p.stage)
    return {
      name: stageNameMap[p.stage],
      key: p.stage,
      status: status.status,
      pendingCount: p.stage === 'absence-violation' ? pendingAV : p.stage === 'score-publish' ? pendingSP : 0,
      completedAt: status.completedAt,
      operatorName: status.operatorName,
    }
  })

  res.json({
    examName: exam.name,
    examDate: exam.date,
    totalCandidates: exam.totalCandidates,
    totalRooms: exam.totalRooms,
    stages,
    recentLogs,
    registration: getRegistrationInfo(),
    roomArrangement: getRoomArrangementInfo(),
    invigilatorAssignment: getInvigilatorInfo(),
    stageProgress: progress,
  })
})

router.get('/stages', (_req: Request, res: Response): void => {
  res.json({ list: getStageProgress() })
})

router.put('/stages/:stage/complete', (req: Request, res: Response): void => {
  try {
    const { stage } = req.params
    const { operatorRole, operatorName } = req.body
    assertPermission(operatorRole as Role, 'manage:stage')

    const validStages: StageName[] = ['absence-violation', 'score-publish']
    if (!validStages.includes(stage as StageName)) {
      res.status(400).json({ error: '无效环节，仅允许手动标记缺考违纪、成绩发布为完成' })
      return
    }

    const progress = getStageProgress().find(p => p.stage === stage)
    if (progress && !progress.canProceed) {
      res.status(400).json({ error: `环节未满足完成条件：${progress.blockers.join('；')}` })
      return
    }

    setStageStatus(stage as StageName, 'completed', operatorName)
    const now = new Date().toISOString()
    addAuditLog({
      id: nextId('log'),
      targetType: 'stage',
      targetId: stage,
      action: 'manual-complete',
      operatorRole: operatorRole as Role,
      operatorName,
      detail: `手动标记环节完成：${stage}`,
      createdAt: now,
    })
    res.json({ success: true, message: '环节已标记为完成' })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

export default router
