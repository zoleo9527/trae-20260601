import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function updateLockStatuses(db: ReturnType<typeof getDb>): void {
  const today = new Date().toISOString().split('T')[0]
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  db.prepare(`
    UPDATE price_lock
    SET status = 'expired'
    WHERE lock_end_date < ? AND status != 'expired'
  `).run(today)

  db.prepare(`
    UPDATE price_lock
    SET status = 'expiring_soon'
    WHERE lock_end_date >= ? AND lock_end_date <= ? AND status = 'active'
  `).run(today, threeDaysLater)
}

function addRemainingDays(rows: any[]): any[] {
  const today = new Date()
  return rows.map((row: any) => {
    const endDate = new Date(row.lock_end_date)
    const diffMs = endDate.getTime() - today.getTime()
    const remainingDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
    return { ...row, remainingDays }
  })
}

router.get('/', (_req: Request, res: Response) => {
  const db = getDb()
  updateLockStatuses(db)

  const rows = db.prepare(`
    SELECT pl.*, i.name as inventoryName, c.name as customerName
    FROM price_lock pl
    LEFT JOIN inventory i ON pl.inventory_id = i.id
    LEFT JOIN customer c ON pl.customer_id = c.id
    ORDER BY pl.lock_end_date ASC
  `).all()

  res.json({ success: true, data: addRemainingDays(rows) })
})

router.get('/expiring', (_req: Request, res: Response) => {
  const db = getDb()
  updateLockStatuses(db)

  const rows = db.prepare(`
    SELECT pl.*, i.name as inventoryName, c.name as customerName
    FROM price_lock pl
    LEFT JOIN inventory i ON pl.inventory_id = i.id
    LEFT JOIN customer c ON pl.customer_id = c.id
    WHERE pl.status = 'expiring_soon'
    ORDER BY pl.lock_end_date ASC
  `).all()

  res.json({ success: true, data: addRemainingDays(rows) })
})

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const lock = db.prepare('SELECT * FROM price_lock WHERE id = ?').get(req.params.id) as any

  if (!lock) {
    res.status(404).json({ success: false, error: 'Price lock not found' })
    return
  }

  db.prepare('UPDATE price_lock SET status = ? WHERE id = ?').run('expired', req.params.id)

  res.json({ success: true, data: { id: req.params.id, status: 'expired' } })
})

export default router
