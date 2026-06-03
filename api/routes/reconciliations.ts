import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status } = req.query
  let rows
  if (status && status !== 'all') {
    if (status === 'pending') {
      rows = db.prepare(`
        SELECT r.*, e.name as event_name, e.client_name, e.event_date, e.venue
        FROM reconciliations r JOIN events e ON r.event_id = e.id
        WHERE r.all_confirmed = 0
        ORDER BY r.created_at DESC
      `).all()
    } else if (status === 'confirmed') {
      rows = db.prepare(`
        SELECT r.*, e.name as event_name, e.client_name, e.event_date, e.venue
        FROM reconciliations r JOIN events e ON r.event_id = e.id
        WHERE r.all_confirmed = 1
        ORDER BY r.created_at DESC
      `).all()
    } else {
      rows = db.prepare(`
        SELECT r.*, e.name as event_name, e.client_name, e.event_date, e.venue
        FROM reconciliations r JOIN events e ON r.event_id = e.id
        ORDER BY r.created_at DESC
      `).all()
    }
  } else {
    rows = db.prepare(`
      SELECT r.*, e.name as event_name, e.client_name, e.event_date, e.venue
      FROM reconciliations r JOIN events e ON r.event_id = e.id
      ORDER BY r.created_at DESC
    `).all()
  }

  const result = (rows as any[]).map((r: any) => {
    const items = db.prepare('SELECT * FROM reconciliation_items WHERE reconciliation_id = ?').all(r.id) as any[]
    const itemsWithConfirmations = items.map((item: any) => {
      const confirmations = db.prepare('SELECT * FROM reconciliation_confirmations WHERE item_id = ?').all(item.id)
      return { ...item, confirmations }
    })
    return { ...r, items: itemsWithConfirmations }
  })

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { eventId, createdBy } = req.body
  if (!eventId || !createdBy) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' })
    return
  }

  const existing = db.prepare('SELECT id FROM reconciliations WHERE event_id = ?').get(eventId)
  if (existing) {
    res.status(400).json({ success: false, error: 'Reconciliation already exists for this event' })
    return
  }

  const rId = uuidv4()
  db.prepare(
    `INSERT INTO reconciliations (id, event_id, all_confirmed, feedback_activated, created_by)
     VALUES (?, ?, 0, 0, ?)`
  ).run(rId, eventId, createdBy)

  const venueFee = event.venue === '大宴会厅' ? 5000 : event.venue === '多功能厅' ? 4000 : event.venue === 'VIP包间' ? 2000 : 1500
  const menuFee = event.tables * event.menu_price
  const extraFee = event.tables * 100
  const discount = -Math.round(menuFee * 0.02)

  const defaultItems = [
    { category: 'venue', description: '场地费', expected: venueFee },
    { category: 'menu', description: '餐饮费', expected: menuFee },
    { category: 'extra', description: '额外服务费', expected: extraFee },
    { category: 'discount', description: '折扣优惠', expected: discount },
  ]

  for (const item of defaultItems) {
    const itemId = uuidv4()
    db.prepare(
      `INSERT INTO reconciliation_items (id, reconciliation_id, category, description, expected_amount, actual_amount, difference, difference_note, status)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, '', 'pending')`
    ).run(itemId, rId, item.category, item.description, item.expected)

    for (const role of ['sales', 'hall', 'kitchen']) {
      db.prepare(
        `INSERT INTO reconciliation_confirmations (id, item_id, role, confirmed, name, confirmed_at)
         VALUES (?, ?, ?, 0, '', NULL)`
      ).run(uuidv4(), itemId, role)
    }
  }

  db.prepare("UPDATE events SET status = 'reconciling' WHERE id = ?").run(eventId)

  db.prepare(
    `INSERT INTO timeline_entries (id, event_id, type, title, description, performed_by, role, timestamp)
     VALUES (?, ?, 'reconciliation_created', '发起对账', ?, ?, 'sales', datetime('now'))`
  ).run(uuidv4(), eventId, `${event.name}对账已发起`, createdBy)

  const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(rId)
  res.json({ success: true, data: reconciliation })
})

router.get('/:id', (req: Request, res: Response): void => {
  const reconciliation = db.prepare(`
    SELECT r.*, e.name as event_name, e.client_name, e.event_date, e.venue
    FROM reconciliations r JOIN events e ON r.event_id = e.id
    WHERE r.id = ?
  `).get(req.params.id) as Record<string, any> | undefined
  if (!reconciliation) {
    res.status(404).json({ success: false, error: 'Reconciliation not found' })
    return
  }
  const items = db.prepare('SELECT * FROM reconciliation_items WHERE reconciliation_id = ?').all(req.params.id) as any[]
  const itemsWithConfirmations = items.map(item => {
    const confirmations = db.prepare('SELECT * FROM reconciliation_confirmations WHERE item_id = ?').all(item.id)
    return { ...item, confirmations }
  })
  res.json({ success: true, data: { ...reconciliation, items: itemsWithConfirmations } })
})

function checkAndActivateFeedback(reconciliationId: string, eventId: string) {
  const items = db.prepare('SELECT id, status FROM reconciliation_items WHERE reconciliation_id = ?').all(reconciliationId) as any[]
  const allConfirmed = items.every(item => item.status === 'confirmed' || item.status === 'difference_confirmed')
  if (!allConfirmed) return

  db.prepare('UPDATE reconciliations SET all_confirmed = 1, feedback_activated = 1, feedback_activated_at = datetime(\'now\') WHERE id = ?').run(reconciliationId)
  db.prepare("UPDATE events SET status = 'feedback' WHERE id = ?").run(eventId)

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any

  const fId = uuidv4()
  db.prepare('INSERT INTO feedbacks (id, event_id, status) VALUES (?, ?, ?)').run(fId, eventId, 'pending')

  const deadline = new Date(Date.now() + 48 * 3600 * 1000).toISOString()
  for (const role of ['sales', 'hall', 'kitchen']) {
    db.prepare(
      `INSERT INTO feedback_sections (id, feedback_id, role, content, rating, filled_by, filled_at, deadline)
       VALUES (?, ?, ?, '', NULL, '', NULL, ?)`
    ).run(uuidv4(), fId, role, deadline)
  }

  db.prepare(
    `INSERT INTO timeline_entries (id, event_id, type, title, description, performed_by, role, timestamp)
     VALUES (?, ?, 'reconciliation_completed', '对账完成', ?, '系统', 'system', datetime('now'))`
  ).run(uuidv4(), eventId, `${event.name}对账全部确认，反馈已激活`)
}

router.put('/:id/items/:itemId/confirm', (req: Request, res: Response): void => {
  const { id, itemId } = req.params
  const { role, name } = req.body
  if (!role || !name) {
    res.status(400).json({ success: false, error: 'Missing role or name' })
    return
  }

  const item = db.prepare('SELECT * FROM reconciliation_items WHERE id = ? AND reconciliation_id = ?').get(itemId, id) as any
  if (!item) {
    res.status(404).json({ success: false, error: 'Item not found' })
    return
  }

  db.prepare(
    `UPDATE reconciliation_confirmations SET confirmed = 1, name = ?, confirmed_at = datetime('now')
     WHERE item_id = ? AND role = ?`
  ).run(name, itemId, role)

  const confirmations = db.prepare('SELECT * FROM reconciliation_confirmations WHERE item_id = ?').all(itemId) as any[]
  const allRoleConfirmed = confirmations.every(c => c.confirmed === 1)
  if (allRoleConfirmed) {
    if (item.status === 'difference') {
      db.prepare("UPDATE reconciliation_items SET status = 'difference_confirmed' WHERE id = ?").run(itemId)
    } else {
      db.prepare("UPDATE reconciliation_items SET status = 'confirmed', actual_amount = expected_amount, difference = 0 WHERE id = ?").run(itemId)
    }
  }

  const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(id) as any
  checkAndActivateFeedback(id, reconciliation.event_id)

  const updatedItem = db.prepare('SELECT * FROM reconciliation_items WHERE id = ?').get(itemId) as Record<string, any>
  const updatedConfirmations = db.prepare('SELECT * FROM reconciliation_confirmations WHERE item_id = ?').all(itemId)
  res.json({ success: true, data: { ...updatedItem, confirmations: updatedConfirmations } })
})

router.post('/batch-confirm', (req: Request, res: Response): void => {
  const { itemIds, reconciliationId, role, name } = req.body
  if (!itemIds || !Array.isArray(itemIds) || !reconciliationId || !role || !name) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(reconciliationId) as any
  if (!reconciliation) {
    res.status(404).json({ success: false, error: 'Reconciliation not found' })
    return
  }

  for (const itemId of itemIds) {
    db.prepare(
      `UPDATE reconciliation_confirmations SET confirmed = 1, name = ?, confirmed_at = datetime('now')
       WHERE item_id = ? AND role = ?`
    ).run(name, itemId, role)

    const item = db.prepare('SELECT * FROM reconciliation_items WHERE id = ?').get(itemId) as any
    const confirmations = db.prepare('SELECT * FROM reconciliation_confirmations WHERE item_id = ?').all(itemId) as any[]
    const allRoleConfirmed = confirmations.every(c => c.confirmed === 1)
    if (allRoleConfirmed) {
      if (item.status === 'difference') {
        db.prepare("UPDATE reconciliation_items SET status = 'difference_confirmed' WHERE id = ?").run(itemId)
      } else {
        db.prepare("UPDATE reconciliation_items SET status = 'confirmed', actual_amount = expected_amount, difference = 0 WHERE id = ?").run(itemId)
      }
    }
  }

  checkAndActivateFeedback(reconciliationId, reconciliation.event_id)

  res.json({ success: true, data: { confirmedCount: itemIds.length } })
})

router.put('/:id/items/:itemId/difference', (req: Request, res: Response): void => {
  const { id, itemId } = req.params
  const { actualAmount, differenceNote, role, name } = req.body
  if (actualAmount === undefined || !role || !name) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const item = db.prepare('SELECT * FROM reconciliation_items WHERE id = ? AND reconciliation_id = ?').get(itemId, id) as any
  if (!item) {
    res.status(404).json({ success: false, error: 'Item not found' })
    return
  }

  const difference = actualAmount - item.expected_amount
  db.prepare(
    `UPDATE reconciliation_items SET actual_amount = ?, difference = ?, difference_note = ?, status = 'difference' WHERE id = ?`
  ).run(actualAmount, difference, differenceNote || '', itemId)

  const reconciliation = db.prepare('SELECT * FROM reconciliations WHERE id = ?').get(id) as any
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(reconciliation.event_id) as any

  db.prepare(
    `INSERT INTO timeline_entries (id, event_id, type, title, description, performed_by, role, timestamp)
     VALUES (?, ?, 'difference_marked', '标注差异', ?, ?, ?, datetime('now'))`
  ).run(uuidv4(), reconciliation.event_id, `${event.name} - ${item.description}差异: ${difference}`, name, role)

  const updatedItem = db.prepare('SELECT * FROM reconciliation_items WHERE id = ?').get(itemId)
  res.json({ success: true, data: updatedItem })
})

export default router
