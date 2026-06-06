import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { updateStepStatus, now } from './purchases.js'

const router = Router()

router.post('/:purchaseId', async (req, res) => {
  const { db } = req
  const { purchaseId } = req.params
  const { action, remark, operatorId, operatorName } = req.body

  await db.read()
  const idx = db.data.purchaseOrders.findIndex(p => p.id === purchaseId)
  if (idx === -1) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const purchase = db.data.purchaseOrders[idx]
  const record = {
    id: uuidv4(),
    purchaseId,
    operatorId,
    operatorName,
    action,
    remark,
    timestamp: now()
  }

  purchase.acceptanceRecords.push(record)
  
  const steps = purchase.processSteps
  const timestamp = now()

  if (action === 'accept') {
    purchase.status = 'sample_pending'
    purchase.currentHandlerId = operatorId
    purchase.currentHandlerName = operatorName
    purchase.currentHandlerRole = 'admin'
    updateStepStatus(steps, 'acceptance_pending', 'completed', timestamp, operatorName)
    updateStepStatus(steps, 'supplement_submitted', 'completed', timestamp, operatorName)
    updateStepStatus(steps, 'acceptance_completed', 'completed', timestamp, operatorName)
    updateStepStatus(steps, 'sample_pending', 'current')
  } else if (action === 'supplement') {
    purchase.status = 'supplementing'
    purchase.currentHandlerId = purchase.purchaserId
    purchase.currentHandlerName = purchase.purchaserName
    purchase.currentHandlerRole = 'purchaser'
    updateStepStatus(steps, 'acceptance_pending', 'completed', timestamp, operatorName)
    updateStepStatus(steps, 'supplement_requested', 'current', timestamp, operatorName, remark)
    
    const exception = {
      id: uuidv4(),
      purchaseId,
      type: 'supplement',
      initiatorId: operatorId,
      initiatorName: operatorName,
      handlerId: purchase.purchaserId,
      handlerName: purchase.purchaserName,
      description: remark || '需要补充材料',
      status: 'processing',
      createdAt: timestamp,
      comments: []
    }
    purchase.exceptions.push(exception)
  } else if (action === 'reject') {
    purchase.status = 'rejected'
    purchase.currentHandlerId = purchase.purchaserId
    purchase.currentHandlerName = purchase.purchaserName
    purchase.currentHandlerRole = 'purchaser'
    updateStepStatus(steps, 'acceptance_pending', 'error', timestamp, operatorName, remark)
    
    const exception = {
      id: uuidv4(),
      purchaseId,
      type: 'reject',
      initiatorId: operatorId,
      initiatorName: operatorName,
      handlerId: purchase.purchaserId,
      handlerName: purchase.purchaserName,
      description: remark || '验收被驳回',
      status: 'processing',
      createdAt: timestamp,
      comments: []
    }
    purchase.exceptions.push(exception)
  }

  purchase.updatedAt = now()
  await db.write()
  res.json(purchase)
})

router.post('/:purchaseId/resubmit', async (req, res) => {
  const { db } = req
  const { purchaseId } = req.params
  const { remark, operatorId, operatorName, attachments } = req.body

  await db.read()
  const idx = db.data.purchaseOrders.findIndex(p => p.id === purchaseId)
  if (idx === -1) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const purchase = db.data.purchaseOrders[idx]
  purchase.resubmitCount = (purchase.resubmitCount || 0) + 1
  purchase.status = 'supplement_submitted'
  purchase.currentHandlerId = 'u1'
  purchase.currentHandlerName = '张管理'
  purchase.currentHandlerRole = 'admin'
  purchase.updatedAt = now()

  const steps = purchase.processSteps
  const timestamp = now()
  updateStepStatus(steps, 'supplement_requested', 'completed', timestamp, operatorName)
  updateStepStatus(steps, 'supplement_submitted', 'current', timestamp, operatorName, remark)

  const supplementException = purchase.exceptions.find(e => (e.type === 'supplement' || e.type === 'reject') && e.status !== 'resolved')
  if (supplementException) {
    supplementException.status = 'resolved'
    supplementException.resolvedAt = timestamp
    supplementException.resolution = remark || '材料已补充'
    supplementException.comments = supplementException.comments || []
    supplementException.comments.push({
      id: uuidv4(),
      userId: operatorId,
      userName: operatorName,
      content: `已补充材料：${remark || '相关证明文件'}`,
      timestamp,
      attachments: attachments || []
    })
  }

  await db.write()
  res.json(purchase)
})

export default router
