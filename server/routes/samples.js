import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { updateStepStatus, now } from './purchases.js'

const router = Router()

router.post('/:purchaseId', async (req, res) => {
  const { db } = req
  const { purchaseId } = req.params
  const { operatorId, operatorName, sampleTime, sampleQuantity, storageLocation, temperature, remark, attachments } = req.body

  await db.read()
  const idx = db.data.purchaseOrders.findIndex(p => p.id === purchaseId)
  if (idx === -1) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const purchase = db.data.purchaseOrders[idx]
  const timestamp = now()

  const sampleRecord = {
    id: uuidv4(),
    purchaseId,
    operatorId,
    operatorName,
    sampleTime: sampleTime || timestamp,
    sampleQuantity,
    storageLocation,
    temperature,
    remark,
    attachments: attachments || [],
    status: 'completed'
  }

  purchase.sampleRecord = sampleRecord
  purchase.status = 'sample_completed'
  purchase.currentHandlerId = 'u3'
  purchase.currentHandlerName = '王老师'
  purchase.currentHandlerRole = 'teacher'
  purchase.updatedAt = timestamp

  const steps = purchase.processSteps
  updateStepStatus(steps, 'sample_pending', 'completed', timestamp, operatorName)
  updateStepStatus(steps, 'sample_completed', 'completed', timestamp, operatorName)
  updateStepStatus(steps, 'sample_confirmed', 'current')

  await db.write()
  res.json(purchase)
})

router.post('/:purchaseId/confirm', async (req, res) => {
  const { db } = req
  const { purchaseId } = req.params
  const { operatorId, operatorName, remark } = req.body

  await db.read()
  const idx = db.data.purchaseOrders.findIndex(p => p.id === purchaseId)
  if (idx === -1) {
    return res.status(404).json({ error: '采购单不存在' })
  }

  const purchase = db.data.purchaseOrders[idx]
  if (!purchase.sampleRecord) {
    return res.status(400).json({ error: '尚未进行留样登记' })
  }

  const timestamp = now()
  purchase.sampleRecord.confirmedById = operatorId
  purchase.sampleRecord.confirmedByName = operatorName
  purchase.sampleRecord.confirmedAt = timestamp
  if (remark) {
    purchase.sampleRecord.remark = (purchase.sampleRecord.remark || '') + `\n班主任确认：${remark}`
  }

  purchase.status = 'sample_confirmed'
  purchase.currentHandlerId = undefined
  purchase.currentHandlerName = undefined
  purchase.currentHandlerRole = undefined
  purchase.updatedAt = timestamp

  const steps = purchase.processSteps
  updateStepStatus(steps, 'sample_confirmed', 'completed', timestamp, operatorName, remark)
  updateStepStatus(steps, 'completed', 'completed', timestamp, operatorName)

  await db.write()
  res.json(purchase)
})

export default router
