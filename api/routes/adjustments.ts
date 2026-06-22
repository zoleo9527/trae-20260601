import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status } = req.query

  let sql = `
    SELECT pa.*, i.name as inventoryName, c.name as customerName
    FROM price_adjustment pa
    LEFT JOIN inventory i ON pa.inventory_id = i.id
    LEFT JOIN customer c ON pa.customer_id = c.id
  `
  const params: string[] = []

  if (status && typeof status === 'string') {
    sql += ' WHERE pa.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY pa.created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/pending', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT pa.*, i.name as inventoryName, c.name as customerName
    FROM price_adjustment pa
    LEFT JOIN inventory i ON pa.inventory_id = i.id
    LEFT JOIN customer c ON pa.customer_id = c.id
    WHERE pa.status = 'pending'
    ORDER BY pa.created_at DESC
  `).all()
  res.json({ success: true, data: rows })
})

router.get('/reviewed', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT pa.*, i.name as inventoryName, c.name as customerName
    FROM price_adjustment pa
    LEFT JOIN inventory i ON pa.inventory_id = i.id
    LEFT JOIN customer c ON pa.customer_id = c.id
    WHERE pa.status IN ('approved', 'rejected')
    ORDER BY pa.reviewed_at DESC
  `).all()
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const row = db.prepare(`
    SELECT pa.*, i.name as inventoryName, i.category as inventoryCategory, i.grade as inventoryGrade, i.unit as inventoryUnit, i.quantity as inventoryQuantity, c.name as customerName, c.contact as customerContact
    FROM price_adjustment pa
    LEFT JOIN inventory i ON pa.inventory_id = i.id
    LEFT JOIN customer c ON pa.customer_id = c.id
    WHERE pa.id = ?
  `).get(req.params.id)

  if (!row) {
    res.status(404).json({ success: false, error: 'Adjustment not found' })
    return
  }

  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { inventory_id, original_price, new_price, adjustment_type, reason, requested_lock_days, customer_id, applicant_name } = req.body

  if (!inventory_id || original_price == null || new_price == null || !adjustment_type || !customer_id || !applicant_name) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const now = new Date().toISOString()
  const count = db.prepare('SELECT COUNT(*) as cnt FROM price_adjustment').get() as { cnt: number }
  const id = `adj-${String(count.cnt + 1).padStart(3, '0')}`

  db.prepare(`
    INSERT INTO price_adjustment (id, inventory_id, original_price, new_price, adjustment_type, reason, requested_lock_days, customer_id, applicant_name, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, inventory_id, original_price, new_price, adjustment_type, reason || null, requested_lock_days || null, customer_id, applicant_name, now, now)

  const row = db.prepare(`
    SELECT pa.*, i.name as inventoryName, c.name as customerName
    FROM price_adjustment pa
    LEFT JOIN inventory i ON pa.inventory_id = i.id
    LEFT JOIN customer c ON pa.customer_id = c.id
    WHERE pa.id = ?
  `).get(id)

  res.status(201).json({ success: true, data: row })
})

router.post('/:id/review', (req: Request, res: Response) => {
  const db = getDb()
  const { id } = req.params
  const { action, opinion, lockDays, reviewerName } = req.body

  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ success: false, error: 'Action must be "approve" or "reject"' })
    return
  }

  const adjustment = db.prepare('SELECT * FROM price_adjustment WHERE id = ?').get(id) as any
  if (!adjustment) {
    res.status(404).json({ success: false, error: 'Adjustment not found' })
    return
  }

  if (adjustment.status !== 'pending') {
    res.status(400).json({ success: false, error: 'Only pending adjustments can be reviewed' })
    return
  }

  const now = new Date().toISOString()
  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  db.prepare(`
    UPDATE price_adjustment
    SET status = ?, review_opinion = ?, reviewer_name = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(newStatus, opinion || null, reviewerName || null, now, now, id)

  if (action === 'approve') {
    const inventory = db.prepare('SELECT * FROM inventory WHERE id = ?').get(adjustment.inventory_id) as any
    const effectiveLockDays = lockDays || adjustment.requested_lock_days || 30
    const lockStartDate = new Date().toISOString().split('T')[0]
    const lockEndDate = new Date(Date.now() + effectiveLockDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const lockCount = db.prepare('SELECT COUNT(*) as cnt FROM price_lock').get() as { cnt: number }
    const lockId = `lock-${String(lockCount.cnt + 1).padStart(3, '0')}`

    db.prepare(`
      INSERT INTO price_lock (id, adjustment_id, inventory_id, locked_price, original_market_price, quantity, unit, customer_id, lock_start_date, lock_end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(lockId, id, adjustment.inventory_id, adjustment.new_price, adjustment.original_price, inventory.quantity, inventory.unit, adjustment.customer_id, lockStartDate, lockEndDate)

    const quoteCount = db.prepare('SELECT COUNT(*) as cnt FROM customer_quote').get() as { cnt: number }
    const quoteId = `quote-${String(quoteCount.cnt + 1).padStart(3, '0')}`
    const expiresAt = new Date(lockEndDate + 'T23:59:59.000Z').toISOString()

    db.prepare(`
      INSERT INTO customer_quote (id, customer_id, inventory_id, quoted_price, market_price, adjustment_type, status, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(quoteId, adjustment.customer_id, adjustment.inventory_id, adjustment.new_price, adjustment.original_price, adjustment.adjustment_type, now, expiresAt)
  }

  const row = db.prepare(`
    SELECT pa.*, i.name as inventoryName, c.name as customerName
    FROM price_adjustment pa
    LEFT JOIN inventory i ON pa.inventory_id = i.id
    LEFT JOIN customer c ON pa.customer_id = c.id
    WHERE pa.id = ?
  `).get(id)

  res.json({ success: true, data: row })
})

export default router
