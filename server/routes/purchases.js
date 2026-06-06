import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const now = () => new Date().toISOString().replace('T', ' ').substring(0, 19)

router.get('/', async (req, res) => {
  const { db } = req
  await db.read()
  res.json(db.data.purchaseOrders)
})

router.get('/:id', async (req, res) => {
  const { db } = req
  await db.read()
  const purchase = db.data.purchaseOrders.find(p => p.id === req.params.id)
  if (!purchase) {
    return res.status(404).json({ error: '采购单不存在' })
  }
  res.json(purchase)
})

router.post('/', async (req, res) => {
  const { db } = req
  await db.read()
  
  const newOrder = {
    id: uuidv4(),
    ...req.body,
    createdAt: now(),
    updatedAt: now(),
    resubmitCount: 0,
    acceptanceRecords: [],
    exceptions: [],
    processSteps: [
      { key: 'purchase_created', label: '采购员下单', role: 'purchaser', status: 'completed', timestamp: now(), operatorName: req.body.purchaserName || '采购员' },
      { key: 'acceptance_pending', label: '待管理员验收', role: 'admin', status: 'current' },
      { key: 'supplement_requested', label: '要求补充材料', role: 'admin', status: 'pending' },
      { key: 'supplement_submitted', label: '采购员补录重提', role: 'purchaser', status: 'pending' },
      { key: 'sample_pending', label: '待留样登记', role: 'admin', status: 'pending' },
      { key: 'sample_completed', label: '留样完成', role: 'admin', status: 'pending' },
      { key: 'sample_confirmed', label: '班主任确认', role: 'teacher', status: 'pending' },
      { key: 'completed', label: '流程完成', role: 'admin', status: 'pending' },
    ]
  }
  
  db.data.purchaseOrders.unshift(newOrder)
  await db.write()
  res.status(201).json(newOrder)
})

router.put('/:id', async (req, res) => {
  const { db } = req
  await db.read()
  
  const idx = db.data.purchaseOrders.findIndex(p => p.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ error: '采购单不存在' })
  }
  
  db.data.purchaseOrders[idx] = {
    ...db.data.purchaseOrders[idx],
    ...req.body,
    updatedAt: now()
  }
  
  await db.write()
  res.json(db.data.purchaseOrders[idx])
})

const updateStepStatus = (steps, key, status, timestamp, operatorName, remark) => {
  const step = steps.find(s => s.key === key)
  if (step) {
    step.status = status
    if (timestamp) step.timestamp = timestamp
    if (operatorName) step.operatorName = operatorName
    if (remark) step.remark = remark
  }
}

export { router as default, updateStepStatus, now }
