import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { now } from './purchases.js'

const router = Router()

router.get('/:purchaseId', async (req, res) => {
  const { db } = req
  await db.read()
  const purchase = db.data.purchaseOrders.find(p => p.id === req.params.purchaseId)
  if (!purchase) {
    return res.status(404).json({ error: '采购单不存在' })
  }
  res.json(purchase.exceptions)
})

router.post('/:purchaseId/comments/:exceptionId', async (req, res) => {
  const { db } = req
  const { purchaseId, exceptionId } = req.params
  const { userId, userName, content, attachments } = req.body

  await db.read()
  const purchase = db.data.purchaseOrders.find(p => p.id === purchaseId)
  if (!purchase) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const exception = purchase.exceptions.find(e => e.id === exceptionId)
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' })
  }

  exception.comments = exception.comments || []
  exception.comments.push({
    id: uuidv4(),
    userId,
    userName,
    content,
    timestamp: now(),
    attachments: attachments || []
  })

  purchase.updatedAt = now()
  await db.write()
  res.json(purchase)
})

router.post('/:purchaseId/resolve/:exceptionId', async (req, res) => {
  const { db } = req
  const { purchaseId, exceptionId } = req.params
  const { userId, userName, resolution } = req.body

  await db.read()
  const purchase = db.data.purchaseOrders.find(p => p.id === purchaseId)
  if (!purchase) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const exception = purchase.exceptions.find(e => e.id === exceptionId)
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' })
  }

  const timestamp = now()
  exception.status = 'resolved'
  exception.resolvedAt = timestamp
  exception.resolution = resolution
  exception.handlerId = userId
  exception.handlerName = userName

  const hasOtherUnresolved = purchase.exceptions.some(
    ex => ex.id !== exceptionId && (ex.status === 'pending' || ex.status === 'processing')
  )

  if (!hasOtherUnresolved && purchase.status !== 'sample_pending' && purchase.status !== 'sample_completed') {
    purchase.status = 'pending_acceptance'
    purchase.currentHandlerId = 'u1'
    purchase.currentHandlerName = '张管理'
    purchase.currentHandlerRole = 'admin'
  }

  purchase.updatedAt = timestamp
  await db.write()
  res.json(purchase)
})

export default router
