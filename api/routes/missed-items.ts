import { Router, type Request, type Response } from 'express'
import {
  findMissedItem,
  findMissedItemLogs,
  addMissedItemLog,
  getMissedItems,
  updateMissedItem,
} from '../db.js'

const router = Router()

router.get('/stats', (req: Request, res: Response): void => {
  const items = getMissedItems()
  res.json({
    pending: items.filter((m) => m.status === 'pending').length,
    reminded: items.filter((m) => m.status === 'reminded').length,
    confirmed: items.filter((m) => m.status === 'confirmed').length,
    completed: items.filter((m) => m.status === 'completed').length,
    closed: items.filter((m) => m.status === 'closed').length,
  })
})

router.get('/', (req: Request, res: Response): void => {
  const { status, dept, dateFrom, dateTo } = req.query

  let result = [...getMissedItems()]

  if (status && typeof status === 'string') {
    result = result.filter((m) => m.status === status)
  }

  if (dept && typeof dept === 'string') {
    result = result.filter((m) => m.requiredDept === dept)
  }

  if (dateFrom && typeof dateFrom === 'string') {
    result = result.filter((m) => m.createdAt >= dateFrom)
  }

  if (dateTo && typeof dateTo === 'string') {
    result = result.filter((m) => m.createdAt <= dateTo)
  }

  res.json(result)
})

router.get('/:id', (req: Request, res: Response): void => {
  const item = findMissedItem(req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Missed item not found' })
    return
  }
  res.json(item)
})

router.get('/:id/logs', (req: Request, res: Response): void => {
  const item = findMissedItem(req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Missed item not found' })
    return
  }
  res.json(findMissedItemLogs(req.params.id))
})

router.post('/:id/remind', (req: Request, res: Response): void => {
  const item = findMissedItem(req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Missed item not found' })
    return
  }

  if (item.status !== 'pending') {
    res.status(400).json({ error: 'Only pending missed items can be reminded' })
    return
  }

  const { operatorName } = req.body
  const now = new Date().toISOString()

  const updated = updateMissedItem(item.id, {
    status: 'reminded',
    remindedAt: now,
  })

  addMissedItemLog({
    missedItemId: item.id,
    operatorRole: 'front_desk',
    operatorName: operatorName || '前台导检员',
    action: 'remind',
    detail: `发送漏项提醒，通知患者补做${item.itemName}`,
  })

  res.json(updated)
})

router.post('/:id/confirm', (req: Request, res: Response): void => {
  const item = findMissedItem(req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Missed item not found' })
    return
  }

  if (item.status !== 'reminded') {
    res.status(400).json({ error: 'Only reminded missed items can be confirmed' })
    return
  }

  const { operatorName } = req.body
  const now = new Date().toISOString()

  const updated = updateMissedItem(item.id, {
    status: 'confirmed',
    confirmedAt: now,
  })

  addMissedItemLog({
    missedItemId: item.id,
    operatorRole: 'doctor',
    operatorName: operatorName || '科室医生',
    action: 'confirm',
    detail: `科室医生确认${item.itemName}漏项，已安排补检`,
  })

  res.json(updated)
})

router.post('/:id/complete', (req: Request, res: Response): void => {
  const item = findMissedItem(req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Missed item not found' })
    return
  }

  if (item.status !== 'confirmed') {
    res.status(400).json({ error: 'Only confirmed missed items can be completed' })
    return
  }

  const { operatorName } = req.body
  const now = new Date().toISOString()

  const updated = updateMissedItem(item.id, {
    status: 'completed',
    completedAt: now,
  })

  addMissedItemLog({
    missedItemId: item.id,
    operatorRole: 'doctor',
    operatorName: operatorName || '科室医生',
    action: 'complete',
    detail: `${item.itemName}补检完成`,
  })

  res.json(updated)
})

router.post('/:id/close', (req: Request, res: Response): void => {
  const item = findMissedItem(req.params.id)
  if (!item) {
    res.status(404).json({ error: 'Missed item not found' })
    return
  }

  if (item.status !== 'completed') {
    res.status(400).json({ error: 'Only completed missed items can be closed' })
    return
  }

  const { operatorName, reason } = req.body

  const updated = updateMissedItem(item.id, {
    status: 'closed',
  })

  const reasonText = reason ? `，原因：${reason}` : ''
  addMissedItemLog({
    missedItemId: item.id,
    operatorRole: 'reviewer',
    operatorName: operatorName || '报告审核员',
    action: 'close',
    detail: `报告审核员确认并关闭${item.itemName}漏项${reasonText}`,
  })

  res.json(updated)
})

export default router
