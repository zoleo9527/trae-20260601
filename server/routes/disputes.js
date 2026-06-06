import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { updateStepStatus, now } from './purchases.js'

const router = Router()

router.post('/:purchaseId/raise', async (req, res) => {
  const { db } = req
  const { purchaseId } = req.params
  const { raisedById, raisedByName, description } = req.body

  await db.read()
  const idx = db.data.purchaseOrders.findIndex(p => p.id === purchaseId)
  if (idx === -1) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const purchase = db.data.purchaseOrders[idx]
  const timestamp = now()

  purchase.dispute = {
    id: uuidv4(),
    purchaseId,
    raisedById,
    raisedByName,
    description,
    status: 'pending',
    mediatorId: 'u3',
    mediatorName: '王老师',
    createdAt: timestamp,
    comments: []
  }

  purchase.status = 'dispute_pending'
  purchase.currentHandlerId = 'u3'
  purchase.currentHandlerName = '王老师'
  purchase.currentHandlerRole = 'teacher'
  purchase.updatedAt = timestamp

  const steps = purchase.processSteps
  updateStepStatus(steps, 'dispute_raised', 'current', timestamp, raisedByName, description)

  purchase.exceptions.push({
    id: uuidv4(),
    purchaseId,
    type: 'dispute',
    initiatorId: raisedById,
    initiatorName: raisedByName,
    handlerId: 'u3',
    handlerName: '王老师',
    description,
    status: 'pending',
    createdAt: timestamp,
    comments: []
  })

  await db.write()
  res.json(purchase)
})

router.post('/:purchaseId/mediate', async (req, res) => {
  const { db } = req
  const { purchaseId } = req.params
  const { mediatorId, mediatorName, resolution, resolutionType } = req.body

  await db.read()
  const idx = db.data.purchaseOrders.findIndex(p => p.id === purchaseId)
  if (idx === -1) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const purchase = db.data.purchaseOrders[idx]
  if (!purchase.dispute) {
    return res.status(400).json({ error: '该采购单无争议记录' })
  }

  const timestamp = now()
  purchase.dispute.status = 'resolved'
  purchase.dispute.mediatorId = mediatorId
  purchase.dispute.mediatorName = mediatorName
  purchase.dispute.resolution = resolution
  purchase.dispute.resolutionType = resolutionType
  purchase.dispute.resolvedAt = timestamp

  const disputeException = purchase.exceptions.find(e => e.type === 'dispute')
  if (disputeException) {
    disputeException.status = 'resolved'
    disputeException.resolvedAt = timestamp
    disputeException.resolution = resolution
    disputeException.handlerId = mediatorId
    disputeException.handlerName = mediatorName
  }

  const steps = purchase.processSteps
  updateStepStatus(steps, 'dispute_raised', 'completed', timestamp, mediatorName, resolution)
  updateStepStatus(steps, 'dispute_resolved', 'completed', timestamp, mediatorName, resolution)

  if (resolutionType === 'accept') {
    purchase.status = 'sample_pending'
    purchase.currentHandlerId = 'u1'
    purchase.currentHandlerName = '张管理'
    purchase.currentHandlerRole = 'admin'
    updateStepStatus(steps, 'acceptance_pending', 'completed', timestamp, mediatorName)
    updateStepStatus(steps, 'acceptance_completed', 'completed', timestamp, mediatorName)
    updateStepStatus(steps, 'sample_pending', 'current')
  } else if (resolutionType === 'reject') {
    purchase.status = 'rejected'
    purchase.currentHandlerId = purchase.purchaserId || 'u2'
    purchase.currentHandlerName = purchase.purchaserName || '李采购'
    purchase.currentHandlerRole = 'purchaser'
    updateStepStatus(steps, 'acceptance_pending', 'error', timestamp, mediatorName, resolution)
    updateStepStatus(steps, 'supplement_requested', 'completed', timestamp, mediatorName, resolution)
    updateStepStatus(steps, 'supplement_submitted', 'current')
    
    const oldRejectException = purchase.exceptions.find(e => (e.type === 'reject' || e.type === 'supplement') && e.status !== 'resolved')
    if (oldRejectException) {
      oldRejectException.status = 'resolved'
      oldRejectException.resolvedAt = timestamp
      oldRejectException.resolution = '争议仲裁后重新处理'
    }
    
    const rejectException = {
      id: uuidv4(),
      purchaseId,
      type: 'reject',
      initiatorId: mediatorId,
      initiatorName: mediatorName,
      handlerId: purchase.purchaserId || 'u2',
      handlerName: purchase.purchaserName || '李采购',
      description: resolution || '仲裁决定驳回，需采购员重新处理',
      status: 'processing',
      createdAt: timestamp,
      comments: []
    }
    purchase.exceptions.push(rejectException)
  } else {
    purchase.status = 'pending_acceptance'
    purchase.currentHandlerId = 'u1'
    purchase.currentHandlerName = '张管理'
    purchase.currentHandlerRole = 'admin'
    updateStepStatus(steps, 'acceptance_pending', 'current')
  }

  purchase.updatedAt = timestamp
  await db.write()
  res.json(purchase)
})

router.post('/:purchaseId/comments', async (req, res) => {
  const { db } = req
  const { purchaseId } = req.params
  const { userId, userName, content, attachments } = req.body

  await db.read()
  const purchase = db.data.purchaseOrders.find(p => p.id === purchaseId)
  if (!purchase) {
    return res.status(404).json({ error: '采购单不存在' })
  }
  if (!purchase.dispute) {
    return res.status(400).json({ error: '该采购单无争议记录' })
  }

  purchase.dispute.comments = purchase.dispute.comments || []
  purchase.dispute.comments.push({
    id: uuidv4(),
    userId,
    userName,
    content,
    timestamp: now(),
    attachments: attachments || []
  })

  const disputeException = purchase.exceptions.find(e => e.type === 'dispute')
  if (disputeException) {
    disputeException.comments = disputeException.comments || []
    disputeException.comments.push({
      id: uuidv4(),
      userId,
      userName,
      content,
      timestamp: now(),
      attachments: attachments || []
    })
  }

  if (purchase.status === 'dispute_pending') {
    purchase.status = 'dispute_processing'
  }

  purchase.updatedAt = now()
  await db.write()
  res.json(purchase)
})

export default router
