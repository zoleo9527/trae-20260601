import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { customerId } = req.query

  let sql = `
    SELECT cq.*, 
           i.name as inventoryName, i.category as inventoryCategory, i.grade as inventoryGrade, i.unit as inventoryUnit,
           c.name as customerName, c.contact as customerContact
    FROM customer_quote cq
    LEFT JOIN inventory i ON cq.inventory_id = i.id
    LEFT JOIN customer c ON cq.customer_id = c.id
  `
  const params: string[] = []

  if (customerId && typeof customerId === 'string') {
    sql += ' WHERE cq.customer_id = ?'
    params.push(customerId)
  }

  sql += ' ORDER BY cq.created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const row = db.prepare(`
    SELECT cq.*, i.name as inventoryName, i.category as inventoryCategory, i.grade as inventoryGrade, i.unit as inventoryUnit, c.name as customerName, c.contact as customerContact
    FROM customer_quote cq
    LEFT JOIN inventory i ON cq.inventory_id = i.id
    LEFT JOIN customer c ON cq.customer_id = c.id
    WHERE cq.id = ?
  `).get(req.params.id)

  if (!row) {
    res.status(404).json({ success: false, error: 'Quote not found' })
    return
  }

  res.json({ success: true, data: row })
})

export default router
