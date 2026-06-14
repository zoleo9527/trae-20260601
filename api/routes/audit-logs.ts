import { Router, type Request, type Response } from 'express'
import { getAuditLogs } from '../data/repository.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { targetType, targetId } = req.query
  let logs = getAuditLogs()
  if (targetType) logs = logs.filter(l => l.targetType === targetType)
  if (targetId) logs = logs.filter(l => l.targetId === targetId)
  res.json({ list: logs })
})

export default router
