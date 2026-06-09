import { getDB } from '../db.js'
import type {
  OutboundOrder,
  OutboundItem,
  TimelineEntry,
  ReviewSnapshot,
  ReviewSnapshotItem,
  CreateOutboundOrderRequest,
  SubmitOutboundOrderRequest,
  ReviewOutboundOrderRequest,
} from '../../shared/types.js'

interface OrderRow {
  id: string; order_no: string; customer_id: string; customer_name: string;
  customer_qual_expiry: string; status: string; submitted_by: string | null;
  submitted_at: string | null; reviewed_by: string | null; reviewed_at: string | null;
  created_at: string; updated_at: string;
}

interface ItemRow {
  id: string; order_id: string; consumable_name: string; batch_no: string;
  production_date: string; expiry_date: string; stock_qty: number;
  outbound_qty: number; review_status: string; abnormal_type: string | null;
  abnormal_note: string | null; created_at: string;
}

interface TimelineRow {
  id: string; order_id: string; action: string; operator: string;
  operator_role: string; detail: string; created_at: string;
}

interface SnapshotRow {
  id: string; order_id: string; reviewed_by: string; reviewed_at: string;
}

interface SnapshotItemRow {
  id: string; snapshot_id: string; item_id: string; consumable_name: string;
  batch_no: string; result: string; abnormal_type: string | null;
  abnormal_note: string | null;
}

function mapOrder(r: OrderRow): OutboundOrder {
  return {
    id: r.id, orderNo: r.order_no, customerId: r.customer_id,
    customerName: r.customer_name, customerQualExpiry: r.customer_qual_expiry,
    status: r.status as OutboundOrder['status'], submittedBy: r.submitted_by,
    submittedAt: r.submitted_at, reviewedBy: r.reviewed_by, reviewedAt: r.reviewed_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function mapItem(r: ItemRow): OutboundItem {
  return {
    id: r.id, orderId: r.order_id, consumableName: r.consumable_name,
    batchNo: r.batch_no, productionDate: r.production_date, expiryDate: r.expiry_date,
    stockQty: r.stock_qty, outboundQty: r.outbound_qty,
    reviewStatus: r.review_status as OutboundItem['reviewStatus'],
    abnormalType: r.abnormal_type, abnormalNote: r.abnormal_note, createdAt: r.created_at,
  }
}

function mapTimeline(r: TimelineRow): TimelineEntry {
  return {
    id: r.id, orderId: r.order_id, action: r.action, operator: r.operator,
    operatorRole: r.operator_role, detail: r.detail, createdAt: r.created_at,
  }
}

function mapSnapshot(r: SnapshotRow, items: ReviewSnapshotItem[]): ReviewSnapshot {
  return {
    id: r.id, orderId: r.order_id, reviewedBy: r.reviewed_by,
    reviewAt: r.reviewed_at, items,
  }
}

function mapSnapshotItem(r: SnapshotItemRow): ReviewSnapshotItem {
  return {
    id: r.id, snapshotId: r.snapshot_id, itemId: r.item_id,
    consumableName: r.consumable_name, batchNo: r.batch_no,
    result: r.result as ReviewSnapshotItem['result'],
    abnormalType: r.abnormal_type, abnormalNote: r.abnormal_note,
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function checkIdempotency(key: string): { statusCode: number; body: string } | null {
  const db = getDB()
  const row = db.prepare('SELECT response_body, status_code FROM idempotency_keys WHERE key = ?').get(key) as { response_body: string; status_code: number } | undefined
  if (row) {
    return { statusCode: row.status_code, body: row.response_body }
  }
  return null
}

function storeIdempotency(key: string, statusCode: number, body: string): void {
  const db = getDB()
  db.prepare('INSERT INTO idempotency_keys (key, response_body, status_code, created_at) VALUES (?, ?, ?, datetime(\'now\'))').run(key, body, statusCode)
}

function addTimeline(orderId: string, action: string, operator: string, operatorRole: string, detail: string): void {
  const db = getDB()
  db.prepare(
    'INSERT INTO timeline_entries (id, order_id, action, operator, operator_role, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).run(generateId('tl'), orderId, action, operator, operatorRole, detail)
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_submit: ['pending_review'],
  pending_review: ['reviewing'],
  reviewing: ['completed', 'has_issue'],
  has_issue: ['closed', 'pending_review', 'completed'],
  completed: [],
  closed: [],
}

function validateTransition(current: string, target: string): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false
}

export function createOrder(req: CreateOutboundOrderRequest): { order: OutboundOrder; items: OutboundItem[] } {
  const db = getDB()

  const cached = checkIdempotency(req.idempotencyKey)
  if (cached) {
    return JSON.parse(cached.body)
  }

  const existing = db.prepare('SELECT id FROM outbound_orders WHERE order_no = ?').get(req.orderNo) as { id: string } | undefined
  if (existing) {
    const orderRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(existing.id) as OrderRow
    const itemRows = db.prepare('SELECT * FROM outbound_items WHERE order_id = ?').all(existing.id) as ItemRow[]
    const result = { order: mapOrder(orderRow), items: itemRows.map(mapItem) }
    storeIdempotency(req.idempotencyKey, 200, JSON.stringify(result))
    return result
  }

  const now = new Date().toISOString()
  const orderId = generateId('ord')
  const order: OutboundOrder = {
    id: orderId,
    orderNo: req.orderNo,
    customerId: req.customerId,
    customerName: req.customerName,
    customerQualExpiry: req.customerQualExpiry,
    status: 'pending_submit',
    submittedBy: null,
    submittedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const items: OutboundItem[] = req.items.map((item) => ({
    id: generateId('item'),
    orderId,
    consumableName: item.consumableName,
    batchNo: item.batchNo,
    productionDate: item.productionDate,
    expiryDate: item.expiryDate,
    stockQty: item.stockQty,
    outboundQty: item.outboundQty,
    reviewStatus: 'pending',
    abnormalType: null,
    abnormalNote: null,
    createdAt: now,
  }))

  const insertItem = db.prepare(
    'INSERT INTO outbound_items (id, order_id, consumable_name, batch_no, production_date, expiry_date, stock_qty, outbound_qty, review_status, abnormal_type, abnormal_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const transaction = db.transaction(() => {
    db.prepare(
      'INSERT INTO outbound_orders (id, order_no, customer_id, customer_name, customer_qual_expiry, status, submitted_by, submitted_at, reviewed_by, reviewed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(order.id, order.orderNo, order.customerId, order.customerName, order.customerQualExpiry, order.status, order.submittedBy, order.submittedAt, order.reviewedBy, order.reviewedAt, order.createdAt, order.updatedAt)

    for (const item of items) {
      insertItem.run(item.id, item.orderId, item.consumableName, item.batchNo, item.productionDate, item.expiryDate, item.stockQty, item.outboundQty, item.reviewStatus, item.abnormalType, item.abnormalNote, item.createdAt)
    }

    addTimeline(orderId, 'create', '系统', '系统', `创建出库单 ${req.orderNo}，客户：${req.customerName}`)
  })

  transaction()

  const result = { order, items }
  storeIdempotency(req.idempotencyKey, 200, JSON.stringify(result))
  return result
}

export function listOrders(status?: string): OutboundOrder[] {
  const db = getDB()
  if (status) {
    const rows = db.prepare('SELECT * FROM outbound_orders WHERE status = ? ORDER BY created_at DESC').all(status) as OrderRow[]
    return rows.map(mapOrder)
  }
  const rows = db.prepare('SELECT * FROM outbound_orders ORDER BY created_at DESC').all() as OrderRow[]
  return rows.map(mapOrder)
}

export function getOrderDetail(id: string): {
  order: OutboundOrder;
  items: OutboundItem[];
  timeline: TimelineEntry[];
  reviewSnapshots: ReviewSnapshot[];
} | null {
  const db = getDB()
  const orderRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(id) as OrderRow | undefined
  if (!orderRow) return null

  const itemRows = db.prepare('SELECT * FROM outbound_items WHERE order_id = ?').all(id) as ItemRow[]
  const timelineRows = db.prepare('SELECT * FROM timeline_entries WHERE order_id = ? ORDER BY created_at ASC').all(id) as TimelineRow[]

  const snapshotRows = db.prepare('SELECT * FROM review_snapshots WHERE order_id = ? ORDER BY reviewed_at DESC').all(id) as SnapshotRow[]
  const reviewSnapshots: ReviewSnapshot[] = snapshotRows.map((snap) => {
    const siRows = db.prepare('SELECT * FROM review_snapshot_items WHERE snapshot_id = ?').all(snap.id) as SnapshotItemRow[]
    return mapSnapshot(snap, siRows.map(mapSnapshotItem))
  })

  return {
    order: mapOrder(orderRow),
    items: itemRows.map(mapItem),
    timeline: timelineRows.map(mapTimeline),
    reviewSnapshots,
  }
}

export function submitOrder(id: string, req: SubmitOutboundOrderRequest): OutboundOrder {
  const db = getDB()

  const cached = checkIdempotency(req.idempotencyKey)
  if (cached) {
    return JSON.parse(cached.body)
  }

  const orderRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(id) as OrderRow | undefined
  if (!orderRow) throw new Error('出库单不存在')
  const order = mapOrder(orderRow)
  if (!validateTransition(order.status, 'pending_review')) {
    throw new Error(`当前状态 ${order.status} 不允许提交，仅 pending_submit 状态可提交`)
  }

  const now = new Date().toISOString()
  let warnings = ''

  const qualExpiry = new Date(order.customerQualExpiry)
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  if (qualExpiry < new Date()) {
    warnings += `客户资质已过期（${order.customerQualExpiry}）`
  } else if (qualExpiry <= thirtyDaysLater) {
    const daysLeft = Math.ceil((qualExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    warnings += `客户资质即将过期（${order.customerQualExpiry}，剩余${daysLeft}天）`
  }

  const itemRows = db.prepare('SELECT * FROM outbound_items WHERE order_id = ?').all(id) as ItemRow[]
  const nearExpiryItems: string[] = []
  for (const ir of itemRows) {
    const item = mapItem(ir)
    const expiryDate = new Date(item.expiryDate)
    if (expiryDate < new Date()) {
      nearExpiryItems.push(`${item.consumableName}(${item.batchNo})已过期`)
    } else if (expiryDate <= ninetyDaysLater()) {
      nearExpiryItems.push(`${item.consumableName}(${item.batchNo})临期预警`)
    }
  }

  if (nearExpiryItems.length > 0) {
    if (warnings) warnings += '，'
    warnings += nearExpiryItems.join('、')
  }

  let detail = `销售内勤${req.submittedBy}提交出库单`
  if (warnings) {
    detail += `，系统警告：${warnings}`
  } else {
    detail += `，客户资质有效期至${order.customerQualExpiry}，资质正常`
  }

  const transaction = db.transaction(() => {
    db.prepare(
      'UPDATE outbound_orders SET status = ?, submitted_by = ?, submitted_at = ?, updated_at = ? WHERE id = ?'
    ).run('pending_review', req.submittedBy, now, now, id)

    addTimeline(id, 'submit', req.submittedBy, '销售内勤', detail)
  })

  transaction()

  const updatedRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(id) as OrderRow
  const updated = mapOrder(updatedRow)
  storeIdempotency(req.idempotencyKey, 200, JSON.stringify(updated))
  return updated
}

function ninetyDaysLater(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 90)
  return d
}

export function reviewOrder(id: string, req: ReviewOutboundOrderRequest): OutboundOrder {
  const db = getDB()

  const cached = checkIdempotency(req.idempotencyKey)
  if (cached) {
    return JSON.parse(cached.body)
  }

  const orderRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(id) as OrderRow | undefined
  if (!orderRow) throw new Error('出库单不存在')
  const order = mapOrder(orderRow)
  if (!validateTransition(order.status, 'reviewing')) {
    if (order.status !== 'reviewing') {
      throw new Error(`当前状态 ${order.status} 不允许复核，仅 pending_review 状态可开始复核`)
    }
  }

  const incompleteItems = req.reviewItems.filter(
    (item) => item.result === 'abnormal' && !item.abnormalType
  )
  if (incompleteItems.length > 0) {
    throw new Error(`异常项缺少异常类型：${incompleteItems.map((i) => i.itemId).join(', ')}`)
  }

  const now = new Date().toISOString()
  const hasAbnormal = req.reviewItems.some((item) => item.result === 'abnormal')

  const transaction = db.transaction(() => {
    if (order.status === 'pending_review') {
      db.prepare(
        'UPDATE outbound_orders SET status = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?'
      ).run('reviewing', req.reviewedBy, now, now, id)
      addTimeline(id, 'start_review', req.reviewedBy, '仓库员', `仓库员${req.reviewedBy}开始复核出库单`)
    }

    const snapshotId = generateId('snap')
    db.prepare(
      'INSERT INTO review_snapshots (id, order_id, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?)'
    ).run(snapshotId, id, req.reviewedBy, now)

    const insertSnapshotItem = db.prepare(
      'INSERT INTO review_snapshot_items (id, snapshot_id, item_id, consumable_name, batch_no, result, abnormal_type, abnormal_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )

    const updateItem = db.prepare(
      'UPDATE outbound_items SET review_status = ?, abnormal_type = ?, abnormal_note = ? WHERE id = ?'
    )

    const insertBatchIssue = db.prepare(
      'INSERT INTO batch_issues (id, order_id, item_id, abnormal_type, abnormal_note, process_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    const abnormalItems: string[] = []

    for (const ri of req.reviewItems) {
      const ir = db.prepare('SELECT * FROM outbound_items WHERE id = ?').get(ri.itemId) as ItemRow | undefined
      if (!ir) continue
      const item = mapItem(ir)

      const abnormalType = ri.result === 'abnormal' ? (ri.abnormalType ?? null) : null
      const abnormalNote = ri.result === 'abnormal' ? (ri.abnormalNote ?? null) : null

      insertSnapshotItem.run(
        generateId('si'), snapshotId, ri.itemId, item.consumableName, item.batchNo,
        ri.result, abnormalType, abnormalNote
      )

      updateItem.run(ri.result, abnormalType, abnormalNote, ri.itemId)

      if (ri.result === 'abnormal' && ri.abnormalType) {
        abnormalItems.push(`${item.consumableName}(${item.batchNo})`)
        insertBatchIssue.run(
          generateId('bi'), id, ri.itemId, ri.abnormalType,
          ri.abnormalNote ?? `${item.consumableName}(${item.batchNo})${abnormalTypeLabel(ri.abnormalType)}`,
          'pending', now
        )
      }
    }

    if (hasAbnormal) {
      db.prepare(
        'UPDATE outbound_orders SET status = ?, updated_at = ? WHERE id = ?'
      ).run('has_issue', now, id)
      addTimeline(id, 'review_abnormal', req.reviewedBy, '仓库员',
        `复核发现异常：${abnormalItems.join('、')}，出库单标记为异常`
      )
    } else {
      db.prepare(
        'UPDATE outbound_orders SET status = ?, updated_at = ? WHERE id = ?'
      ).run('completed', now, id)
      addTimeline(id, 'complete_review', req.reviewedBy, '仓库员',
        `复核完成，全部耗材批号正常，出库单已完成`
      )
      addTimeline(id, 'complete', req.reviewedBy, '仓库员',
        `出库完成，${req.reviewItems.length}项耗材全部正常出库`
      )
    }
  })

  transaction()

  const updatedRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(id) as OrderRow
  const updated = mapOrder(updatedRow)
  storeIdempotency(req.idempotencyKey, 200, JSON.stringify(updated))
  return updated
}

function abnormalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    batch_error: '批号错误',
    near_expiry: '临期',
    expired: '已过期',
    qual_expired: '资质过期',
  }
  return labels[type] ?? type
}

export function transitionOrderToPendingReview(orderId: string): void {
  const db = getDB()
  const orderRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(orderId) as OrderRow | undefined
  if (!orderRow) return
  const order = mapOrder(orderRow)

  if (!validateTransition(order.status, 'pending_review')) {
    throw new Error(`当前状态 ${order.status} 不允许转换到 pending_review`)
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE outbound_orders SET status = ?, updated_at = ? WHERE id = ?').run('pending_review', now, orderId)

  const itemRows = db.prepare('SELECT * FROM outbound_items WHERE order_id = ? AND review_status = \'abnormal\'').all(orderId) as ItemRow[]
  for (const ir of itemRows) {
    db.prepare('UPDATE outbound_items SET review_status = ?, abnormal_type = ?, abnormal_note = ? WHERE id = ?').run('pending', null, null, ir.id)
  }
}

export function transitionOrderToClosed(orderId: string): void {
  const db = getDB()
  const orderRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(orderId) as OrderRow | undefined
  if (!orderRow) return
  const order = mapOrder(orderRow)

  if (!validateTransition(order.status, 'closed')) {
    throw new Error(`当前状态 ${order.status} 不允许转换到 closed`)
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE outbound_orders SET status = ?, updated_at = ? WHERE id = ?').run('closed', now, orderId)
}

export function transitionOrderToCompleted(orderId: string): void {
  const db = getDB()
  const orderRow = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(orderId) as OrderRow | undefined
  if (!orderRow) return
  const order = mapOrder(orderRow)

  if (!validateTransition(order.status, 'completed')) {
    throw new Error(`当前状态 ${order.status} 不允许转换到 completed`)
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE outbound_orders SET status = ?, updated_at = ? WHERE id = ?').run('completed', now, orderId)
}
