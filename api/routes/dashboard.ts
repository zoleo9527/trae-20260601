import { Router, type Request, type Response } from 'express'
import {
  getExam, getAVRecords, getSPRecords, getAuditLogs, getCandidates, getRooms, getSubjects,
  getRegistrationInfo, getRoomArrangementInfo, getInvigilatorInfo,
  getStageProgress, getStageStatus, setStageStatus, addAuditLog, nextId, assertPermission
} from '../data/repository.js'
import type { StageName, Role } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const exam = getExam()
  const avRecords = getAVRecords()
  const spRecords = getSPRecords()
  const candidates = getCandidates()
  const rooms = getRooms()
  const subjects = getSubjects()
  const recentLogs = getAuditLogs().slice(0, 10)
  const pendingAV = avRecords.filter(r => r.status === 'pending' || r.status === 'resubmitted').length
  const pendingSP = spRecords.filter(r => r.status === 'initiated' || r.status === 'approved').length
  const progress = getStageProgress()
  const role = (req.query.role as string) || 'admin'

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

  const avStats = {
    pending: avRecords.filter(r => r.status === 'pending').length,
    resubmitted: avRecords.filter(r => r.status === 'resubmitted').length,
    approved: avRecords.filter(r => r.status === 'approved').length,
    rejected: avRecords.filter(r => r.status === 'rejected').length,
    supplemented: avRecords.filter(r => r.status === 'supplemented').length,
    total: avRecords.length,
  }

  const spStats = {
    initiated: spRecords.filter(r => r.status === 'initiated').length,
    approved: spRecords.filter(r => r.status === 'approved').length,
    confirmed: spRecords.filter(r => r.status === 'confirmed').length,
    rejected: spRecords.filter(r => r.status === 'rejected').length,
    total: spRecords.length,
  }

  const avPendingAll = avRecords.filter(r => r.status === 'pending' || r.status === 'resubmitted')
  const invigilatorNames = ['王建国', '李秀英', '张志强', '刘美玲', '陈海涛', '赵丽华']
  let avPendingFiltered = avPendingAll
  if (role === 'invigilator') {
    avPendingFiltered = avPendingAll.filter(r => invigilatorNames.includes(r.submittedBy))
  } else if (role === 'tech') {
    avPendingFiltered = []
  }
  const avPendingSummary = avPendingFiltered
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 3)
    .map(r => {
      const cand = candidates.find(c => c.id === r.candidateId)
      const room = rooms.find(rm => rm.id === r.roomId)
      const subj = subjects.find(s => s.id === r.subjectId)
      return {
        id: r.id,
        candidateName: cand?.name || '未知考生',
        type: r.type,
        violationType: r.violationType,
        status: r.status,
        roomName: room?.name || '未知考场',
        subjectName: subj?.name || '未知科目',
        submittedBy: r.submittedBy,
        version: r.version,
        createdAt: r.createdAt,
      }
    })

  let spPendingFiltered = spRecords
  if (role === 'admin') {
    spPendingFiltered = spRecords.filter(r => r.status === 'initiated')
  } else if (role === 'tech') {
    spPendingFiltered = spRecords.filter(r => r.status === 'approved')
  } else {
    spPendingFiltered = []
  }
  const spPendingSummary = spPendingFiltered
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 3)
    .map(r => {
      const subj = subjects.find(s => s.id === r.subjectId)
      return {
        id: r.id,
        subjectName: subj?.name || '未知科目',
        status: r.status,
        submittedBy: r.initiatedBy,
        version: r.version,
        totalCandidates: r.summary.total,
        passCount: r.summary.pass,
        failCount: r.summary.fail,
        avgScore: r.summary.avg,
        createdAt: r.createdAt,
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
    avStats,
    spStats,
    avPendingSummary,
    spPendingSummary,
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

    const validStages: StageName[] = ['registration', 'room-arrangement', 'invigilator-assignment', 'absence-violation', 'score-publish']
    if (!validStages.includes(stage as StageName)) {
      res.status(400).json({ error: '[参数错误] 无效环节，仅支持：registration/room-arrangement/invigilator-assignment/absence-violation/score-publish' })
      return
    }

    const progress = getStageProgress().find(p => p.stage === stage)
    if (progress && !progress.canProceed) {
      res.status(400).json({ error: `[流程错误] 环节未满足完成条件：${progress.blockers.join('；')}` })
      return
    }

    setStageStatus(stage as StageName, 'completed', operatorName)
    const now = new Date().toISOString()

    const stageNameMap: Record<StageName, string> = {
      'registration': '报名数据',
      'room-arrangement': '考场编排',
      'invigilator-assignment': '监考名单',
      'absence-violation': '缺考违纪',
      'score-publish': '成绩发布',
    }

    addAuditLog({
      id: nextId('log'),
      targetType: 'stage',
      targetId: stage,
      action: 'manual-complete',
      operatorRole: operatorRole as Role,
      operatorName,
      detail: `手动标记环节完成：${stageNameMap[stage as StageName]}`,
      createdAt: now,
    })
    res.json({ success: true, message: `环节「${stageNameMap[stage as StageName]}」已标记为完成` })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

export default router
