import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../db.js'

const router = Router()

interface OrderRow {
  id: string
  order_no: string
  customer_name: string
  patient_name: string
  product_type: string
  material_status: string
  current_stage: string
  current_handler: string
  priority: string
  delivery_date: string
  status: string
  time_in_stage: number
  created_at: string
  updated_at: string
}

interface AnomalyRow {
  id: string
  order_id: string
  type: string
  description: string
  detected_at: string
  resolved_at: string | null
  resolved_by: string | null
}

interface MaterialRow {
  id: string
  order_id: string
  name: string
  specification: string
  quantity: number
  status: string
}

function mapOrder(row: OrderRow) {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name,
    patientName: row.patient_name,
    productType: row.product_type,
    materialStatus: row.material_status,
    currentStage: row.current_stage,
    currentHandler: row.current_handler,
    priority: row.priority,
    deliveryDate: row.delivery_date,
    status: row.status,
    timeInStage: row.time_in_stage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAnomaly(row: AnomalyRow) {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    description: row.description,
    detectedAt: row.detected_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  }
}

function mapMaterial(row: MaterialRow) {
  return {
    id: row.id,
    orderId: row.order_id,
    name: row.name,
    specification: row.specification,
    quantity: row.quantity,
    status: row.status,
  }
}

router.get('/', (req: Request, res: Response) => {
  const db = getDb()

  const conditions: string[] = []
  const params: unknown[] = []

  const { status, stage, anomalyType, customerName, handlerRole } = req.query

  if (status) {
    conditions.push('o.status = ?')
    params.push(status)
  }
  if (stage) {
    conditions.push('o.current_stage = ?')
    params.push(stage)
  }
  if (customerName) {
    conditions.push('o.customer_name LIKE ?')
    params.push(`%${customerName}%`)
  }
  if (handlerRole) {
    conditions.push('o.current_handler = ?')
    params.push(handlerRole)
  }
  if (anomalyType) {
    conditions.push('EXISTS (SELECT 1 FROM anomalies a WHERE a.order_id = o.id AND a.type = ? AND a.resolved_at IS NULL)')
    params.push(anomalyType)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const orders = db.prepare(`
    SELECT o.* FROM orders o ${where} ORDER BY
      CASE WHEN EXISTS (SELECT 1 FROM anomalies a WHERE a.order_id = o.id AND a.resolved_at IS NULL) THEN 0 ELSE 1 END,
      o.updated_at DESC
  `).all(...params) as OrderRow[]

  const orderIds = orders.map(o => o.id)

  const anomaliesMap = new Map<string, AnomalyRow[]>()
  const materialsMap = new Map<string, MaterialRow[]>()
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',')
    const anomalies = db.prepare(
      `SELECT * FROM anomalies WHERE order_id IN (${placeholders})`
    ).all(...orderIds) as AnomalyRow[]

    for (const a of anomalies) {
      const list = anomaliesMap.get(a.order_id) || []
      list.push(a)
      anomaliesMap.set(a.order_id, list)
    }

    const materials = db.prepare(
      `SELECT * FROM material_items WHERE order_id IN (${placeholders})`
    ).all(...orderIds) as MaterialRow[]

    for (const m of materials) {
      const list = materialsMap.get(m.order_id) || []
      list.push(m)
      materialsMap.set(m.order_id, list)
    }
  }

  const result = orders.map(o => {
    const materials = (materialsMap.get(o.id) || []).map(mapMaterial)
    const missingMaterials = materials.filter(m => m.status === 'missing').map(m => m.name)
    return {
      ...mapOrder(o),
      materials,
      missingMaterials,
      anomalies: (anomaliesMap.get(o.id) || []).map(mapAnomaly),
    }
  })

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined
  if (!order) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const anomalies = db.prepare('SELECT * FROM anomalies WHERE order_id = ?').all(order.id) as AnomalyRow[]
  const materials = db.prepare('SELECT * FROM material_items WHERE order_id = ?').all(order.id) as MaterialRow[]
  const handoffs = db.prepare('SELECT * FROM handoff_records WHERE order_id = ? ORDER BY created_at ASC').all(order.id) as Array<{
    id: string
    order_id: string
    from_role: string
    to_role: string
    action: string
    reason: string
    details: string
    created_at: string
  }>

  const mappedMaterials = materials.map(mapMaterial)
  const missingMaterials = mappedMaterials.filter(m => m.status === 'missing').map(m => m.name)

  res.json({
    success: true,
    data: {
      ...mapOrder(order),
      anomalies: anomalies.map(mapAnomaly),
      materials: mappedMaterials,
      missingMaterials,
      handoffs: handoffs.map(h => ({
        id: h.id,
        orderId: h.order_id,
        fromRole: h.from_role,
        toRole: h.to_role,
        action: h.action,
        reason: h.reason,
        details: JSON.parse(h.details || '{}'),
        createdAt: h.created_at,
      })),
    },
  })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')

  const {
    orderNo,
    customerName,
    patientName,
    productType,
    materialStatus = 'complete',
    currentStage = 'reception',
    currentHandler = 'receptionist',
    priority = 'normal',
    deliveryDate,
    status = 'pending',
    timeInStage = 0,
    materials = [],
  } = req.body

  if (!orderNo || !customerName || !patientName || !productType || !deliveryDate) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_no, customer_name, patient_name, product_type, material_status, current_stage, current_handler, priority, delivery_date, status, time_in_stage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMaterial = db.prepare(`
    INSERT INTO material_items (id, order_id, name, specification, quantity, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    insertOrder.run(id, orderNo, customerName, patientName, productType, materialStatus, currentStage, currentHandler, priority, deliveryDate, status, timeInStage, now, now)

    for (const m of materials as Array<{ name: string; specification: string; quantity?: number; status?: string }>) {
      insertMaterial.run(randomUUID(), id, m.name, m.specification, m.quantity || 1, m.status || 'available')
    }
  })

  transaction()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow
  const mats = db.prepare('SELECT * FROM material_items WHERE order_id = ?').all(id) as MaterialRow[]

  res.status(201).json({
    success: true,
    data: {
      ...mapOrder(order),
      materials: mats.map(mapMaterial),
    },
  })
})

router.patch('/:id', (req: Request, res: Response) => {
  const db = getDb()

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined
  if (!existing) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const allowedFields = [
    'customerName:customer_name',
    'patientName:patient_name',
    'productType:product_type',
    'materialStatus:material_status',
    'currentStage:current_stage',
    'currentHandler:current_handler',
    'priority:priority',
    'deliveryDate:delivery_date',
    'status:status',
    'timeInStage:time_in_stage',
  ] as const

  const updates: string[] = []
  const params: unknown[] = []

  for (const [bodyKey, dbKey] of allowedFields.map(f => f.split(':') as [string, string])) {
    if (req.body[bodyKey] !== undefined) {
      updates.push(`${dbKey} = ?`)
      params.push(req.body[bodyKey])
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '没有可更新的字段' })
    return
  }

  updates.push("updated_at = datetime('now')")
  params.push(req.params.id)

  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow
  res.json({ success: true, data: mapOrder(order) })
})

export default router
