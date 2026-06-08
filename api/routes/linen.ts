import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

function logStatusChange(targetType: string, targetId: string, oldStatus: string | null, newStatus: string, operatorId: string, note: string | null) {
  db.prepare(`
    INSERT INTO linen_status_logs (id, target_type, target_id, old_status, new_status, operator_id, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), targetType, targetId, oldStatus, newStatus, operatorId, note, new Date().toISOString())
}

router.get('/workstation', (req: Request, res: Response): void => {
  const { floor, operatorId, dateFrom, dateTo, keyword } = req.query

  let reqSql = `
    SELECT lr.*, r.room_number, r.floor, u.name as operator_name
    FROM linen_requisitions lr
    JOIN rooms r ON lr.room_id = r.id
    JOIN users u ON lr.operator_id = u.id
    WHERE 1=1
  `
  const reqParams: unknown[] = []

  if (floor) { reqSql += ' AND r.floor = ?'; reqParams.push(Number(floor)) }
  if (operatorId) { reqSql += ' AND lr.operator_id = ?'; reqParams.push(operatorId) }
  if (dateFrom) { reqSql += ' AND lr.requisition_time >= ?'; reqParams.push(String(dateFrom)) }
  if (dateTo) { reqSql += ' AND lr.requisition_time <= ?'; reqParams.push(String(dateTo) + 'T23:59:59') }
  if (keyword) { reqSql += ' AND r.room_number LIKE ?'; reqParams.push(`%${keyword}%`) }

  reqSql += ' ORDER BY lr.requisition_time DESC'
  const requisitions = db.prepare(reqSql).all(...reqParams as any[]) as any[]

  const requisitionMap: Record<string, any> = {}
  for (const req of requisitions) {
    const items = db.prepare('SELECT * FROM linen_requisition_items WHERE requisition_id = ?').all(req.id)
    const returns = db.prepare(`
      SELECT lr.*, u.name as operator_name
      FROM linen_returns lr
      JOIN users u ON lr.operator_id = u.id
      WHERE lr.requisition_id = ?
      ORDER BY lr.return_time DESC
    `).all(req.id)

    const returnWithItems = returns.map((ret: any) => {
      const retItems = db.prepare('SELECT * FROM linen_return_items WHERE return_id = ?').all(ret.id)
      return { ...ret, items: retItems }
    })

    const losses = db.prepare(`
      SELECT ll.*, u.name as operator_name, u2.name as confirmer_name,
        mo.id as maintenance_order_id, mo.status as maintenance_status, mo.fault_type as maintenance_fault_type,
        u3.name as engineer_name
      FROM linen_losses ll
      JOIN users u ON ll.operator_id = u.id
      LEFT JOIN users u2 ON ll.confirmed_by = u2.id
      LEFT JOIN maintenance_orders mo ON ll.maintenance_order_id = mo.id
      LEFT JOIN users u3 ON mo.assigned_to = u3.id
      WHERE ll.requisition_id = ?
      ORDER BY ll.loss_date DESC
    `).all(req.id)

    const statusLogs = db.prepare(`
      SELECT lsl.*, u.name as operator_name
      FROM linen_status_logs lsl
      JOIN users u ON lsl.operator_id = u.id
      WHERE lsl.target_id = ?
      ORDER BY lsl.created_at ASC
    `).all(req.id)

    requisitionMap[req.id] = {
      ...req,
      items,
      returns: returnWithItems,
      losses,
      statusLogs,
    }
  }

  let lossSql = `
    SELECT ll.*, r.room_number, r.floor, u.name as operator_name, u2.name as confirmer_name,
      mo.id as maintenance_order_id, mo.status as maintenance_status, mo.fault_type as maintenance_fault_type,
      u3.name as engineer_name
    FROM linen_losses ll
    JOIN rooms r ON ll.room_id = r.id
    JOIN users u ON ll.operator_id = u.id
    LEFT JOIN users u2 ON ll.confirmed_by = u2.id
    LEFT JOIN maintenance_orders mo ON ll.maintenance_order_id = mo.id
    LEFT JOIN users u3 ON mo.assigned_to = u3.id
    WHERE ll.requisition_id IS NULL
  `
  const lossParams: unknown[] = []

  if (floor) { lossSql += ' AND r.floor = ?'; lossParams.push(Number(floor)) }
  if (operatorId) { lossSql += ' AND ll.operator_id = ?'; lossParams.push(operatorId) }
  if (dateFrom) { lossSql += ' AND ll.loss_date >= ?'; lossParams.push(String(dateFrom)) }
  if (dateTo) { lossSql += ' AND ll.loss_date <= ?'; lossParams.push(String(dateTo) + 'T23:59:59') }
  if (keyword) { lossSql += ' AND r.room_number LIKE ?'; lossParams.push(`%${keyword}%`) }

  lossSql += ' ORDER BY ll.loss_date DESC'
  const standaloneLosses = db.prepare(lossSql).all(...lossParams as any[])

  const pendingCount = (requisitions.filter((r: any) => r.status === 'pending') as any[]).length
  const fulfilledCount = (requisitions.filter((r: any) => r.status === 'fulfilled') as any[]).length
  const allLosses = [
    ...Object.values(requisitionMap).flatMap((r: any) => r.losses),
    ...standaloneLosses,
  ]
  const unconfirmedLossCount = allLosses.filter((l: any) => l.status === 'registered').length

  res.json({
    success: true,
    data: {
      requisitions: Object.values(requisitionMap),
      standaloneLosses,
      summary: {
        pending: pendingCount,
        fulfilled: fulfilledCount,
        returned: (requisitions.filter((r: any) => r.status === 'returned') as any[]).length,
        unconfirmedLoss: unconfirmedLossCount,
      },
    },
  })
})

router.get('/inventory', (req: Request, res: Response): void => {
  const { floor, category } = req.query

  let sql = `
    SELECT lr.room_id, r.room_number, r.floor,
      lri.category, lri.quantity as requisitioned,
      COALESCE(lri2.returned, 0) as returned,
      lri.quantity - COALESCE(lri2.returned, 0) as outstanding
    FROM linen_requisitions lr
    JOIN rooms r ON lr.room_id = r.id
    JOIN linen_requisition_items lri ON lr.id = lri.requisition_id
    LEFT JOIN (
      SELECT lrv.requisition_id, lri_cat.category as ret_cat, SUM(lri_cat.quantity) as returned
      FROM linen_returns lrv
      JOIN linen_return_items lri_cat ON lrv.id = lri_cat.return_id
      GROUP BY lrv.requisition_id, lri_cat.category
    ) lri2 ON lr.id = lri2.requisition_id AND lri.category = lri2.ret_cat
    WHERE 1=1
  `
  const params: unknown[] = []

  if (floor) {
    sql += ' AND r.floor = ?'
    params.push(Number(floor))
  }
  if (category) {
    sql += ' AND lri.category = ?'
    params.push(category)
  }

  sql += ' ORDER BY r.floor, r.room_number, lri.category'

  const data = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data })
})

router.post('/requisitions', (req: Request, res: Response): void => {
  const { roomId, operatorId, items, notes } = req.body

  if (!roomId || !operatorId || !items || !Array.isArray(items)) {
    res.status(400).json({ success: false, error: 'roomId, operatorId, and items array are required' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO linen_requisitions (id, room_id, operator_id, requisition_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, roomId, operatorId, now, 'pending', notes || null)

  const insertItem = db.prepare(`
    INSERT INTO linen_requisition_items (id, requisition_id, category, quantity)
    VALUES (?, ?, ?, ?)
  `)

  for (const item of items) {
    insertItem.run(uuidv4(), id, item.category, item.quantity)
  }

  logStatusChange('requisition', id, null, 'pending', operatorId, '提交领用申请')

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    roomId,
    'linen_requisition',
    `领用布草${items.length}项`,
    operatorId,
    now,
    JSON.stringify({ requisitionId: id, itemCount: items.length })
  )

  const requisition = db.prepare('SELECT * FROM linen_requisitions WHERE id = ?').get(id) as any
  const reqItems = db.prepare('SELECT * FROM linen_requisition_items WHERE requisition_id = ?').all(id)
  res.status(201).json({ success: true, data: { ...requisition, items: reqItems } })
})

router.patch('/requisitions/:id/status', (req: Request, res: Response): void => {
  const { status, operatorId, note } = req.body
  const requisition = db.prepare('SELECT * FROM linen_requisitions WHERE id = ?').get(req.params.id) as any

  if (!requisition) {
    res.status(404).json({ success: false, error: 'Requisition not found' })
    return
  }

  if (!status || !operatorId) {
    res.status(400).json({ success: false, error: 'status and operatorId are required' })
    return
  }

  const oldStatus = requisition.status
  db.prepare('UPDATE linen_requisitions SET status = ? WHERE id = ?').run(status, req.params.id)

  logStatusChange('requisition', req.params.id, oldStatus, status, operatorId, note || null)

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    requisition.room_id,
    'linen_requisition_update',
    `领用单状态变更为${status}`,
    operatorId,
    new Date().toISOString(),
    JSON.stringify({ requisitionId: req.params.id, oldStatus, newStatus: status })
  )

  const updated = db.prepare(`
    SELECT lr.*, r.room_number, u.name as operator_name
    FROM linen_requisitions lr
    JOIN rooms r ON lr.room_id = r.id
    JOIN users u ON lr.operator_id = u.id
    WHERE lr.id = ?
  `).get(req.params.id)
  const items = db.prepare('SELECT * FROM linen_requisition_items WHERE requisition_id = ?').all(req.params.id)

  res.json({ success: true, data: { ...(updated as any), items } })
})

router.get('/requisitions', (req: Request, res: Response): void => {
  const { date, operatorId, roomId } = req.query
  let sql = `
    SELECT lr.*, r.room_number, u.name as operator_name
    FROM linen_requisitions lr
    JOIN rooms r ON lr.room_id = r.id
    JOIN users u ON lr.operator_id = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (date) {
    sql += " AND DATE(lr.requisition_time) = ?"
    params.push(date)
  }
  if (operatorId) {
    sql += ' AND lr.operator_id = ?'
    params.push(operatorId)
  }
  if (roomId) {
    sql += ' AND lr.room_id = ?'
    params.push(roomId)
  }

  sql += ' ORDER BY lr.requisition_time DESC'
  const requisitions = db.prepare(sql).all(...params as any[])

  const result = requisitions.map((req: any) => {
    const items = db.prepare('SELECT * FROM linen_requisition_items WHERE requisition_id = ?').all(req.id)
    return { ...req, items }
  })

  res.json({ success: true, data: result })
})

router.post('/returns', (req: Request, res: Response): void => {
  const { requisitionId, operatorId, items, notes } = req.body

  if (!requisitionId || !operatorId || !items || !Array.isArray(items)) {
    res.status(400).json({ success: false, error: 'requisitionId, operatorId, and items array are required' })
    return
  }

  const requisition = db.prepare('SELECT * FROM linen_requisitions WHERE id = ?').get(requisitionId) as any
  if (!requisition) {
    res.status(404).json({ success: false, error: 'Requisition not found' })
    return
  }

  const returnId = uuidv4()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO linen_returns (id, requisition_id, operator_id, return_time, verified_by, verified_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(returnId, requisitionId, operatorId, now, null, null, notes || null)

  const insertReturnItem = db.prepare(`
    INSERT INTO linen_return_items (id, return_id, category, quantity)
    VALUES (?, ?, ?, ?)
  `)

  for (const item of items) {
    insertReturnItem.run(uuidv4(), returnId, item.category, item.quantity)
  }

  const reqItems = db.prepare('SELECT * FROM linen_requisition_items WHERE requisition_id = ?').all(requisitionId) as any[]
  const discrepancies: { category: string; requisitioned: number; returned: number; difference: number }[] = []

  const insertLoss = db.prepare(`
    INSERT INTO linen_losses (id, room_id, requisition_id, operator_id, category, quantity, loss_type, description, status, confirmed_by, confirmed_at, loss_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const reqItem of reqItems) {
    const returnedItem = items.find((i: any) => i.category === reqItem.category)
    const returnedQty = returnedItem ? returnedItem.quantity : 0
    const diff = reqItem.quantity - returnedQty

    if (diff > 0) {
      discrepancies.push({
        category: reqItem.category,
        requisitioned: reqItem.quantity,
        returned: returnedQty,
        difference: diff,
      })

      const lossId = uuidv4()
      insertLoss.run(
        lossId,
        requisition.room_id,
        requisitionId,
        operatorId,
        reqItem.category,
        diff,
        'missing',
        `归还数量少于领用数量，差${diff}件`,
        'registered',
        null,
        null,
        now
      )

      logStatusChange('loss', lossId, null, 'registered', operatorId, `归还差额自动登记：${reqItem.category}少${diff}件`)
    }
  }

  const oldStatus = requisition.status
  db.prepare('UPDATE linen_requisitions SET status = ? WHERE id = ?').run('returned', requisitionId)

  logStatusChange('requisition', requisitionId, oldStatus, 'returned', operatorId, notes || '归还完成')

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    requisition.room_id,
    'linen_return',
    discrepancies.length > 0
      ? `归还布草，${discrepancies.length}项存在差额`
      : '归还布草，数量一致',
    operatorId,
    now,
    JSON.stringify({ returnId, requisitionId, discrepancyCount: discrepancies.length })
  )

  const returnRecord = db.prepare('SELECT * FROM linen_returns WHERE id = ?').get(returnId) as any
  const returnItems = db.prepare('SELECT * FROM linen_return_items WHERE return_id = ?').all(returnId)

  res.status(201).json({
    success: true,
    data: {
      ...returnRecord,
      items: returnItems,
      discrepancies,
    },
  })
})

router.patch('/returns/:id/verify', (req: Request, res: Response): void => {
  const { verifiedBy, notes } = req.body
  const returnRecord = db.prepare('SELECT * FROM linen_returns WHERE id = ?').get(req.params.id) as any

  if (!returnRecord) {
    res.status(404).json({ success: false, error: 'Return record not found' })
    return
  }

  if (!verifiedBy) {
    res.status(400).json({ success: false, error: 'verifiedBy is required' })
    return
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE linen_returns SET verified_by = ?, verified_at = ?, notes = ? WHERE id = ?')
    .run(verifiedBy, now, notes || returnRecord.notes, req.params.id)

  logStatusChange('return', req.params.id, 'pending', 'verified', verifiedBy, notes || '主管复核确认')

  const updated = db.prepare(`
    SELECT lr.*, u.name as operator_name, u2.name as verifier_name
    FROM linen_returns lr
    JOIN users u ON lr.operator_id = u.id
    LEFT JOIN users u2 ON lr.verified_by = u2.id
    WHERE lr.id = ?
  `).get(req.params.id)

  res.json({ success: true, data: updated })
})

router.post('/losses', (req: Request, res: Response): void => {
  const { roomId, operatorId, items, requisitionId } = req.body

  if (!roomId || !operatorId || !items || !Array.isArray(items)) {
    res.status(400).json({ success: false, error: 'roomId, operatorId, and items array are required' })
    return
  }

  const now = new Date().toISOString()
  const insertLoss = db.prepare(`
    INSERT INTO linen_losses (id, room_id, requisition_id, operator_id, category, quantity, loss_type, description, status, confirmed_by, confirmed_at, loss_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const losses: any[] = []
  for (const item of items) {
    const id = uuidv4()
    insertLoss.run(
      id,
      roomId,
      requisitionId || null,
      operatorId,
      item.category,
      item.quantity,
      item.type || item.lossType || 'wear',
      item.description || null,
      'registered',
      null,
      null,
      now
    )
    losses.push(db.prepare('SELECT * FROM linen_losses WHERE id = ?').get(id))

    logStatusChange('loss', id, null, 'registered', operatorId, item.description || '登记损耗')
  }

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    roomId,
    'linen_loss',
    `登记布草损耗${losses.length}项`,
    operatorId,
    now,
    JSON.stringify({ lossIds: losses.map((l: any) => l.id) })
  )

  res.status(201).json({ success: true, data: losses })
})

router.get('/losses', (req: Request, res: Response): void => {
  const { dateFrom, dateTo, floor, operatorId, status } = req.query
  let sql = `
    SELECT ll.*, r.room_number, r.floor, u.name as operator_name, u2.name as confirmer_name
    FROM linen_losses ll
    JOIN rooms r ON ll.room_id = r.id
    JOIN users u ON ll.operator_id = u.id
    LEFT JOIN users u2 ON ll.confirmed_by = u2.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (dateFrom) {
    sql += " AND ll.loss_date >= ?"
    params.push(dateFrom)
  }
  if (dateTo) {
    sql += " AND ll.loss_date <= ?"
    params.push(dateTo)
  }
  if (floor) {
    sql += ' AND r.floor = ?'
    params.push(Number(floor))
  }
  if (operatorId) {
    sql += ' AND ll.operator_id = ?'
    params.push(operatorId)
  }
  if (status) {
    sql += ' AND ll.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY ll.loss_date DESC'
  const losses = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data: losses })
})

router.patch('/losses/:id/confirm', (req: Request, res: Response): void => {
  const { confirmedBy, note } = req.body
  const loss = db.prepare('SELECT * FROM linen_losses WHERE id = ?').get(req.params.id) as any

  if (!loss) {
    res.status(404).json({ success: false, error: 'Loss record not found' })
    return
  }

  if (!confirmedBy) {
    res.status(400).json({ success: false, error: 'confirmedBy is required' })
    return
  }

  const now = new Date().toISOString()
  const oldStatus = loss.status
  const newStatus = 'confirmed'

  db.prepare('UPDATE linen_losses SET status = ?, confirmed_by = ?, confirmed_at = ? WHERE id = ?')
    .run(newStatus, confirmedBy, now, req.params.id)

  logStatusChange('loss', req.params.id, oldStatus, newStatus, confirmedBy, note || '主管确认损耗')

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    loss.room_id,
    'linen_loss_confirmed',
    `布草损耗已确认：${loss.category}×${loss.quantity}`,
    confirmedBy,
    now,
    JSON.stringify({ lossId: req.params.id, oldStatus, newStatus, note: note || null })
  )

  const updated = db.prepare(`
    SELECT ll.*, r.room_number, u.name as operator_name, u2.name as confirmer_name
    FROM linen_losses ll
    JOIN rooms r ON ll.room_id = r.id
    JOIN users u ON ll.operator_id = u.id
    LEFT JOIN users u2 ON ll.confirmed_by = u2.id
    WHERE ll.id = ?
  `).get(req.params.id)

  res.json({ success: true, data: updated })
})

router.patch('/losses/:id/replace', (req: Request, res: Response): void => {
  const { operatorId, note } = req.body
  const loss = db.prepare('SELECT * FROM linen_losses WHERE id = ?').get(req.params.id) as any

  if (!loss) {
    res.status(404).json({ success: false, error: 'Loss record not found' })
    return
  }

  const oldStatus = loss.status
  const newStatus = 'replaced'

  db.prepare('UPDATE linen_losses SET status = ? WHERE id = ?').run(newStatus, req.params.id)

  logStatusChange('loss', req.params.id, oldStatus, newStatus, operatorId, note || '已补发替换')

  const updated = db.prepare(`
    SELECT ll.*, r.room_number, u.name as operator_name, u2.name as confirmer_name
    FROM linen_losses ll
    JOIN rooms r ON ll.room_id = r.id
    JOIN users u ON ll.operator_id = u.id
    LEFT JOIN users u2 ON ll.confirmed_by = u2.id
    WHERE ll.id = ?
  `).get(req.params.id)

  res.json({ success: true, data: updated })
})

router.patch('/losses/:id/dispatch', (req: Request, res: Response): void => {
  const { operatorId, engineerId, note } = req.body
  const loss = db.prepare('SELECT * FROM linen_losses WHERE id = ?').get(req.params.id) as any

  if (!loss) {
    res.status(404).json({ success: false, error: 'Loss record not found' })
    return
  }

  if (loss.status !== 'confirmed') {
    res.status(400).json({ success: false, error: 'Only confirmed losses can be dispatched' })
    return
  }

  if (!operatorId) {
    res.status(400).json({ success: false, error: 'operatorId is required' })
    return
  }

  const now = new Date().toISOString()
  const orderId = uuidv4()
  const faultType = loss.loss_type === 'wear' ? 'linen_wear' : loss.loss_type === 'stain' ? 'linen_stain' : 'linen_damage'
  const description = note || `布草损耗派单：${loss.category || '布草'}${loss.loss_type === 'wear' ? '磨损' : loss.loss_type === 'stain' ? '污渍' : '损坏'}处理`

  db.prepare(`
    INSERT INTO maintenance_orders (id, room_id, reported_by, assigned_to, fault_type, description, priority, status, reported_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, loss.room_id, operatorId, engineerId || null, faultType, description, 'normal', engineerId ? 'assigned' : 'reported', now, null)

  db.prepare('UPDATE linen_losses SET status = ?, maintenance_order_id = ? WHERE id = ?')
    .run('dispatched', orderId, req.params.id)

  const oldStatus = loss.status
  logStatusChange('loss', req.params.id, oldStatus, 'dispatched', operatorId, `派单工程师${engineerId ? '：' + (db.prepare('SELECT name FROM users WHERE id = ?').get(engineerId) as any)?.name : ''}`)

  db.prepare(`
    INSERT INTO timeline_events (id, room_id, event_type, description, operator_id, event_time, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    loss.room_id,
    'linen_dispatched',
    `布草损耗派单工程师：${description}`,
    operatorId,
    now,
    JSON.stringify({ lossId: req.params.id, maintenanceOrderId: orderId, engineerId: engineerId || null })
  )

  const updated = db.prepare(`
    SELECT ll.*, r.room_number, u.name as operator_name, u2.name as confirmer_name,
      mo.id as maintenance_order_id, mo.status as maintenance_status, mo.fault_type as maintenance_fault_type,
      u3.name as engineer_name
    FROM linen_losses ll
    JOIN rooms r ON ll.room_id = r.id
    JOIN users u ON ll.operator_id = u.id
    LEFT JOIN users u2 ON ll.confirmed_by = u2.id
    LEFT JOIN maintenance_orders mo ON ll.maintenance_order_id = mo.id
    LEFT JOIN users u3 ON mo.assigned_to = u3.id
    WHERE ll.id = ?
  `).get(req.params.id)

  res.json({ success: true, data: updated })
})

router.get('/losses/recap', (req: Request, res: Response): void => {
  const { from, to } = req.query

  let dateFilter = ''
  const params: unknown[] = []

  if (from) {
    dateFilter += ' AND ll.loss_date >= ?'
    params.push(String(from))
  }
  if (to) {
    dateFilter += ' AND ll.loss_date <= ?'
    params.push(String(to) + 'T23:59:59')
  }

  const allLosses = db.prepare(`
    SELECT ll.category, ll.loss_type, ll.status, ll.quantity, ll.confirmed_by,
      u.name as confirmer_name
    FROM linen_losses ll
    LEFT JOIN users u ON ll.confirmed_by = u.id
    WHERE 1=1${dateFilter}
  `).all(...params as any[]) as any[]

  const statusKeys = ['registered', 'confirmed', 'dispatched', 'replaced'] as const

  const byCategory: Record<string, { total: number; registered: number; confirmed: number; dispatched: number; replaced: number }> = {}
  const byType: Record<string, { total: number; registered: number; confirmed: number; dispatched: number; replaced: number }> = {}
  const byOperator: Record<string, { total: number; registered: number; confirmed: number; dispatched: number; replaced: number }> = {}

  for (const loss of allLosses) {
    const statuses = { total: loss.quantity, registered: 0, confirmed: 0, dispatched: 0, replaced: 0 }
    statuses[loss.status as keyof typeof statuses] = loss.quantity

    if (!byCategory[loss.category]) byCategory[loss.category] = { total: 0, registered: 0, confirmed: 0, dispatched: 0, replaced: 0 }
    for (const k of ['total', ...statusKeys] as const) byCategory[loss.category][k] += statuses[k]

    if (!byType[loss.loss_type]) byType[loss.loss_type] = { total: 0, registered: 0, confirmed: 0, dispatched: 0, replaced: 0 }
    for (const k of ['total', ...statusKeys] as const) byType[loss.loss_type][k] += statuses[k]

    const opKey = loss.confirmer_name || '未确认'
    if (!byOperator[opKey]) byOperator[opKey] = { total: 0, registered: 0, confirmed: 0, dispatched: 0, replaced: 0 }
    for (const k of ['total', ...statusKeys] as const) byOperator[opKey][k] += statuses[k]
  }

  res.json({ success: true, data: { byCategory, byType, byOperator } })
})

router.get('/status-logs', (req: Request, res: Response): void => {
  const { targetType, targetId } = req.query

  let sql = `
    SELECT lsl.*, u.name as operator_name
    FROM linen_status_logs lsl
    JOIN users u ON lsl.operator_id = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (targetType) {
    sql += ' AND lsl.target_type = ?'
    params.push(targetType)
  }
  if (targetId) {
    sql += ' AND lsl.target_id = ?'
    params.push(targetId)
  }

  sql += ' ORDER BY lsl.created_at ASC'
  const logs = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data: logs })
})

export default router
