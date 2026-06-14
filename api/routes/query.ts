import { Router, type Request, type Response } from 'express'
import { getCandidates, getRoom, getSubject, getAVRecords, getAuditLogs } from '../data/repository.js'
import type { Role } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { keyword, roomId, subjectId, operatorRole } = req.query
  let candidates = getCandidates()
  if (keyword) {
    const kw = String(keyword).toLowerCase()
    candidates = candidates.filter(c => c.name.toLowerCase().includes(kw) || c.ticketNo.toLowerCase().includes(kw))
  }
  if (roomId) candidates = candidates.filter(c => c.roomId === roomId)
  if (subjectId) candidates = candidates.filter(c => c.subjectId === subjectId)
  const result = candidates.map(c => {
    const avRecords = getAVRecords().filter(r => r.candidateId === c.id)
    const auditLogs = getAuditLogs().filter(l =>
      l.targetType === 'absence-violation' && avRecords.some(r => r.id === l.targetId)
    )
    return {
      candidate: c,
      room: getRoom(c.roomId),
      subject: getSubject(c.subjectId),
      avRecords,
      auditLogs,
    }
  })
  res.json({ list: result, total: result.length, queriedBy: operatorRole })
})

router.get('/candidates', (_req: Request, res: Response): void => {
  const candidates = getCandidates().map(c => ({
    ...c,
    roomName: getRoom(c.roomId)?.name || '',
    subjectName: getSubject(c.subjectId)?.name || '',
  }))
  res.json({ list: candidates, total: candidates.length })
})

export default router
