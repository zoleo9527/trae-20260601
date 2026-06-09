import { Router, type Request, type Response } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { getSession } from './session.js'
import type { Purchase, PurchaseItem, PurchaseFlowLog, QualificationStatus, PurchaseWithItems } from '../types.js'

function generateRequestNo(): string {
  const d = new Date()
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const prefix = `CG${datePart}`

  const last = db.prepare(
    "SELECT request_no FROM purchases WHERE request_no LIKE ? ORDER BY request_no DESC LIMIT 1"
  ).get(`${prefix}%`) as { request_no: string } | undefined

  let seq = 1
  if (last) {
    seq = parseInt(last.request_no.slice(-3), 10) + 1
  }

  return `${prefix}${String(seq).padStart(3, '0')}`
}

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, customer_name, created_by, date_from, date_to, page = '1', page_size = '20' } = req.query as {
    status?: string
    customer_name?: string
    created_by?: string
    date_from?: string
    date_to?: string
    page?: string
    page_size?: string
  }

  const conditions: string[] = []
  const params: Record<string, string> = {}

  if (status) {
    conditions.push('p.status = @status')
    params.status = status
  }
  if (customer_name) {
    conditions.push('p.customer_name LIKE @customer_name')
    params.customer_name = `%${customer_name}%`
  }
  if (created_by) {
    conditions.push('p.created_by LIKE @created_by')
    params.created_by = `%${created_by}%`
  }
  if (date_from) {
    conditions.push('p.created_at >= @date_from')
    params.date_from = date_from
  }
  if (date_to) {
    conditions.push('p.created_at <= @date_to')
    params.date_to = date_to + 'T23:59:59'
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM purchases p ${whereClause}`).get(params) as { count: number }
  const total = totalRow.count

  const p = parseInt(page, 10)
  const ps = parseInt(page_size, 10)
  const offset = (p - 1) * ps

  const list = db.prepare(
    `SELECT p.* FROM purchases p ${whereClause} ORDER BY p.created_at DESC LIMIT @limit OFFSET @offset`
  ).all({ ...params, limit: ps, offset }) as Purchase[]

  res.json({
    success: true,
    data: { list, total, page: p, page_size: ps },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }

  const items = db.prepare(
    'SELECT * FROM purchase_items WHERE purchase_id = ?'
  ).all(purchase.id) as PurchaseItem[]

  const logs = db.prepare(
    'SELECT * FROM purchase_flow_logs WHERE purchase_id = ? ORDER BY created_at DESC'
  ).all(purchase.id) as PurchaseFlowLog[]

  res.json({ success: true, data: { ...purchase, items, logs } })
})

router.post('/', (req: Request, res: Response): void => {
  const session = getSession()
  const { customer_name, qualification_id, items } = req.body as {
    customer_name: string
    qualification_id: string
    items: Array<{
      product_name: string
      specification: string
      quantity: number
      unit_price: number
    }>
  }

  if (!customer_name || !qualification_id || !items || items.length === 0) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const qual = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(qualification_id) as { status: QualificationStatus } | undefined
  if (!qual) {
    res.status(400).json({ success: false, error: '关联资质不存在' })
    return
  }

  if (qual.status === 'expired' || qual.status === 'rejected') {
    res.status(400).json({ success: false, error: '客户资质异常，请先处理资质' })
    return
  }

  let qualificationFlag: string | null = null
  if (qual.status === 'expiring_soon') {
    qualificationFlag = 'warning'
  } else if (qual.status === 'pending') {
    qualificationFlag = 'info'
  }

  const total_amount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  const id = uuid()
  const request_no = generateRequestNo()
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  const insertPurchase = db.transaction(() => {
    db.prepare(`
      INSERT INTO purchases (id, request_no, customer_name, qualification_id, qualification_status, total_amount, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
    `).run(id, request_no, customer_name, qualification_id, qual.status, total_amount, session.name, now, now)

    const insertItem = db.prepare(`
      INSERT INTO purchase_items (id, purchase_id, product_name, specification, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    for (const item of items) {
      insertItem.run(uuid(), id, item.product_name, item.specification, item.quantity, item.unit_price)
    }

    db.prepare(`
      INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
      VALUES (?, ?, 'create', ?, 'sales_clerk', '创建采购申请', ?)
    `).run(uuid(), id, session.name, now)

    if (qualificationFlag === 'warning') {
      db.prepare(`
        INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
        VALUES (?, ?, 'qualification_warning', ?, 'director', '关联资质即将到期，请提醒客户续期', ?)
      `).run(uuid(), id, '系统', now)
    } else if (qualificationFlag === 'info') {
      db.prepare(`
        INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
        VALUES (?, ?, 'qualification_info', ?, 'director', '关联资质尚未审核', ?)
      `).run(uuid(), id, '系统', now)
    }
  })

  insertPurchase()

  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as Purchase
  const purchaseItems = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(id) as PurchaseItem[]

  res.status(201).json({
    success: true,
    data: { ...purchase, items: purchaseItems, qualification_flag: qualificationFlag },
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }

  if (purchase.status !== 'draft') {
    res.status(400).json({ success: false, error: '只有草稿状态可编辑' })
    return
  }

  const { customer_name, qualification_id, items } = req.body as {
    customer_name?: string
    qualification_id?: string
    items?: Array<{
      product_name: string
      specification: string
      quantity: number
      unit_price: number
    }>
  }

  const qid = qualification_id ?? purchase.qualification_id
  const qual = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(qid) as { status: QualificationStatus } | undefined
  if (!qual) {
    res.status(400).json({ success: false, error: '关联资质不存在' })
    return
  }
  if (qual.status === 'expired' || qual.status === 'rejected') {
    res.status(400).json({ success: false, error: '客户资质异常，请先处理资质' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  const updatePurchase = db.transaction(() => {
    let total_amount = purchase.total_amount
    if (items && items.length > 0) {
      db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(req.params.id)
      const insertItem = db.prepare(`
        INSERT INTO purchase_items (id, purchase_id, product_name, specification, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      total_amount = 0
      for (const item of items) {
        insertItem.run(uuid(), req.params.id, item.product_name, item.specification, item.quantity, item.unit_price)
        total_amount += item.quantity * item.unit_price
      }
    }

    const cname = customer_name ?? purchase.customer_name
    db.prepare(`
      UPDATE purchases
      SET customer_name = ?, qualification_id = ?, qualification_status = ?, total_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(cname, qid, qual.status, total_amount, now, req.params.id)
  })

  updatePurchase()

  const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase
  const updatedItems = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(req.params.id) as PurchaseItem[]

  res.json({ success: true, data: { ...updated, items: updatedItems } })
})

router.post('/:id/submit', (req: Request, res: Response): void => {
  const session = getSession()
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }
  if (purchase.status !== 'draft') {
    res.status(400).json({ success: false, error: '只有草稿状态可提交' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.prepare("UPDATE purchases SET status = 'pending_review', updated_at = ? WHERE id = ?").run(now, req.params.id)
  db.prepare(`
    INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
    VALUES (?, ?, 'submit', ?, 'sales_clerk', '提交采购申请', ?)
  `).run(uuid(), req.params.id, session.name, now)

  const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase
  res.json({ success: true, data: updated })
})

router.post('/:id/approve', (req: Request, res: Response): void => {
  const session = getSession()
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }
  if (purchase.status !== 'pending_review') {
    res.status(400).json({ success: false, error: '只有待审核状态可审批' })
    return
  }

  const { note } = req.body as { note?: string }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.prepare("UPDATE purchases SET status = 'approved', reviewed_by = ?, updated_at = ? WHERE id = ?")
    .run(session.name, now, req.params.id)
  db.prepare(`
    INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
    VALUES (?, ?, 'approve', ?, 'director', ?, ?)
  `).run(uuid(), req.params.id, session.name, note ?? '审核通过', now)

  const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase
  res.json({ success: true, data: updated })
})

router.post('/:id/reject', (req: Request, res: Response): void => {
  const session = getSession()
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }
  if (purchase.status !== 'pending_review') {
    res.status(400).json({ success: false, error: '只有待审核状态可驳回' })
    return
  }

  const { note } = req.body as { note?: string }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.prepare("UPDATE purchases SET status = 'rejected', reviewed_by = ?, updated_at = ? WHERE id = ?")
    .run(session.name, now, req.params.id)
  db.prepare(`
    INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
    VALUES (?, ?, 'reject', ?, 'director', ?, ?)
  `).run(uuid(), req.params.id, session.name, note ?? '审核驳回', now)

  const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase
  res.json({ success: true, data: updated })
})

router.post('/:id/confirm-out', (req: Request, res: Response): void => {
  const session = getSession()
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }
  if (purchase.status !== 'approved') {
    res.status(400).json({ success: false, error: '只有已审核状态可确认出库' })
    return
  }

  const { note } = req.body as { note?: string }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.prepare("UPDATE purchases SET status = 'confirmed_out', updated_at = ? WHERE id = ?").run(now, req.params.id)
  db.prepare(`
    INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
    VALUES (?, ?, 'confirm_out', ?, 'warehouse', ?, ?)
  `).run(uuid(), req.params.id, session.name, note ?? '确认出库', now)

  const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase
  res.json({ success: true, data: updated })
})

router.post('/:id/ship', (req: Request, res: Response): void => {
  const session = getSession()
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }
  if (purchase.status !== 'confirmed_out') {
    res.status(400).json({ success: false, error: '只有已出库状态可发货' })
    return
  }

  const { note } = req.body as { note?: string }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.prepare("UPDATE purchases SET status = 'shipped', updated_at = ? WHERE id = ?").run(now, req.params.id)
  db.prepare(`
    INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
    VALUES (?, ?, 'ship', ?, 'after_sales', ?, ?)
  `).run(uuid(), req.params.id, session.name, note ?? '已发货', now)

  const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase
  res.json({ success: true, data: updated })
})

router.post('/:id/complete', (req: Request, res: Response): void => {
  const session = getSession()
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }
  if (purchase.status !== 'shipped') {
    res.status(400).json({ success: false, error: '只有已发货状态可完成' })
    return
  }

  const { note } = req.body as { note?: string }
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  db.prepare("UPDATE purchases SET status = 'completed', updated_at = ? WHERE id = ?").run(now, req.params.id)
  db.prepare(`
    INSERT INTO purchase_flow_logs (id, purchase_id, action, operator, role, note, created_at)
    VALUES (?, ?, 'complete', ?, 'after_sales', ?, ?)
  `).run(uuid(), req.params.id, session.name, note ?? '客户已签收，订单完成', now)

  const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase
  res.json({ success: true, data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id) as Purchase | undefined
  if (!purchase) {
    res.status(404).json({ success: false, error: '采购单不存在' })
    return
  }
  if (purchase.status !== 'draft') {
    res.status(400).json({ success: false, error: '只有草稿状态可删除' })
    return
  }

  const deletePurchase = db.transaction(() => {
    db.prepare('DELETE FROM purchase_flow_logs WHERE purchase_id = ?').run(req.params.id)
    db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(req.params.id)
    db.prepare('DELETE FROM purchases WHERE id = ?').run(req.params.id)
  })

  deletePurchase()
  res.json({ success: true, data: null })
})

export default router
