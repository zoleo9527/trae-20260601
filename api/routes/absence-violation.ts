import { Router, type Request, type Response } from 'express'
import { listAVRecords, submitAVRecord, reviewAVRecord, getAVRecordDetail } from '../services/absence-violation.js'
import { getCandidate, getRoom, getSubject } from '../data/repository.js'
import type { AVType, AVStatus, ViolationCategory, Role } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { type, roomId, subjectId, status, operatorRole } = req.query
  const records = listAVRecords({
    type: type as AVType | undefined,
    roomId: roomId as string | undefined,
    subjectId: subjectId as string | undefined,
    status: status as AVStatus | undefined,
  }, operatorRole as Role | undefined)
  const enriched = records.map(r => ({
    ...r,
    candidateName: getCandidate(r.candidateId)?.name || '',
    ticketNo: getCandidate(r.candidateId)?.ticketNo || '',
    roomName: getRoom(r.roomId)?.name || '',
    subjectName: getSubject(r.subjectId)?.name || '',
  }))
  res.json({ list: enriched, total: enriched.length })
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const result = getAVRecordDetail(id)
    const enriched = {
      ...result,
      candidateName: getCandidate(result.record.candidateId)?.name || '',
      ticketNo: getCandidate(result.record.candidateId)?.ticketNo || '',
      roomName: getRoom(result.record.roomId)?.name || '',
      subjectName: getSubject(result.record.subjectId)?.name || '',
    }
    res.json(enriched)
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { candidateId, type, violationType, roomId, subjectId, remark, operatorRole, operatorName, parentId } = req.body
    const record = submitAVRecord({
      candidateId, type: type as AVType, violationType: violationType as ViolationCategory | undefined,
      roomId, subjectId, remark, operatorRole: operatorRole as Role, operatorName, parentId,
    })
    res.json({
      success: true,
      data: {
        ...record,
        candidateName: getCandidate(record.candidateId)?.name || '',
        ticketNo: getCandidate(record.candidateId)?.ticketNo || '',
        roomName: getRoom(record.roomId)?.name || '',
        subjectName: getSubject(record.subjectId)?.name || '',
      }
    })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id/review', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { action, opinion, operatorRole, operatorName, supplementData } = req.body
    const record = reviewAVRecord(
      id, action as 'approve' | 'reject' | 'supplement', opinion,
      operatorRole as Role, operatorName, supplementData
    )
    res.json({
      success: true,
      data: {
        ...record,
        candidateName: getCandidate(record.candidateId)?.name || '',
        ticketNo: getCandidate(record.candidateId)?.ticketNo || '',
        roomName: getRoom(record.roomId)?.name || '',
        subjectName: getSubject(record.subjectId)?.name || '',
      }
    })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

export default router
