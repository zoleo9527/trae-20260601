import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const items: any[] = []

  const pendingItems = db.prepare(`
    SELECT ri.*, r.event_id, e.name as event_name, e.client_name, e.event_date
    FROM reconciliation_items ri
    JOIN reconciliations r ON ri.reconciliation_id = r.id
    JOIN events e ON r.event_id = e.id
    WHERE r.all_confirmed = 0 AND ri.status = 'pending'
  `).all() as any[]

  for (const item of pendingItems) {
    const confirmations = db.prepare('SELECT * FROM reconciliation_confirmations WHERE item_id = ?').all(item.id) as any[]
    for (const c of confirmations) {
      if (!c.confirmed) {
        items.push({
          type: 'reconciliation',
          itemId: item.id,
          eventName: item.event_name,
          category: item.category,
          description: item.description,
          role: c.role,
          name: c.name,
          deadline: null,
          remainingHours: null,
        })
      }
    }
  }

  const differenceItems = db.prepare(`
    SELECT ri.*, r.event_id, e.name as event_name, e.client_name, e.event_date
    FROM reconciliation_items ri
    JOIN reconciliations r ON ri.reconciliation_id = r.id
    JOIN events e ON r.event_id = e.id
    WHERE ri.status = 'difference'
  `).all() as any[]

  for (const item of differenceItems) {
    const confirmations = db.prepare('SELECT * FROM reconciliation_confirmations WHERE item_id = ?').all(item.id) as any[]
    for (const c of confirmations) {
      if (!c.confirmed) {
        items.push({
          type: 'reconciliation_difference',
          itemId: item.id,
          eventName: item.event_name,
          category: item.category,
          description: item.description,
          role: c.role,
          name: c.name,
          deadline: null,
          remainingHours: null,
        })
      }
    }
  }

  const unfilledSections = db.prepare(`
    SELECT fs.*, f.event_id, e.name as event_name, e.client_name, e.event_date
    FROM feedback_sections fs
    JOIN feedbacks f ON fs.feedback_id = f.id
    JOIN events e ON f.event_id = e.id
    WHERE f.status = 'pending' AND fs.filled_by = ''
  `).all() as any[]

  for (const section of unfilledSections) {
    const deadlineDate = new Date(section.deadline)
    const now = new Date()
    const remainingMs = deadlineDate.getTime() - now.getTime()
    const remainingHours = Math.round(remainingMs / (1000 * 60 * 60) * 10) / 10

    items.push({
      type: 'feedback',
      sectionId: section.id,
      eventName: section.event_name,
      role: section.role,
      name: section.filled_by,
      deadline: section.deadline,
      remainingHours,
    })
  }

  res.json({ success: true, data: items })
})

export default router
