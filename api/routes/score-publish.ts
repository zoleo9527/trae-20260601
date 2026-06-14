import { Router, type Request, type Response } from 'express'
import {
  listSPRecords, initiatePublish, approvePublish, rejectPublish, confirmPublish,
  getPublishReview, getPublishFlow
} from '../services/score-publish.js'
import { getSubject } from '../data/repository.js'
import type { SPStatus, Role } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status } = req.query
  const records = listSPRecords(status as SPStatus | undefined)
  const enriched = records.map(r => ({
    ...r,
    subjectName: getSubject(r.subjectId)?.name || '',
  }))
  res.json({ list: enriched, total: enriched.length })
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const result = getPublishReview(id)
    res.json({
      ...result,
      subjectName: getSubject(result.record.subjectId)?.name || '',
    })
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

router.get('/:id/flow', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const result = getPublishFlow(id)
    res.json({
      ...result,
      subjectName: getSubject(result.record.subjectId)?.name || '',
    })
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { subjectId, summary, operatorRole, operatorName } = req.body
    const record = initiatePublish({ subjectId, summary, operatorRole: operatorRole as Role, operatorName })
    res.json({
      success: true,
      data: {
        ...record,
        subjectName: getSubject(record.subjectId)?.name || '',
      }
    })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id/approve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { opinion, operatorRole, operatorName } = req.body
    const record = approvePublish(id, operatorRole as Role, operatorName, opinion)
    res.json({
      success: true,
      data: {
        ...record,
        subjectName: getSubject(record.subjectId)?.name || '',
      }
    })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id/reject', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { opinion, operatorRole, operatorName } = req.body
    const record = rejectPublish(id, opinion, operatorRole as Role, operatorName)
    res.json({
      success: true,
      data: {
        ...record,
        subjectName: getSubject(record.subjectId)?.name || '',
      }
    })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id/confirm', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { opinion, operatorRole, operatorName } = req.body
    const record = confirmPublish(id, opinion, operatorRole as Role, operatorName)
    res.json({
      success: true,
      data: {
        ...record,
        subjectName: getSubject(record.subjectId)?.name || '',
      }
    })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/:id/review', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const result = getPublishReview(id)
    res.json({
      ...result,
      subjectName: getSubject(result.record.subjectId)?.name || '',
    })
  } catch (e: any) {
    res.status(404).json({ error: e.message })
  }
})

export default router
