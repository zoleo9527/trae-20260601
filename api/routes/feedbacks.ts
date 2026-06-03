import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, search } = req.query
  let rows
  if (status && status !== 'all') {
    if (search) {
      rows = db.prepare(`
        SELECT f.*, e.name as event_name, e.client_name, e.event_date, e.venue
        FROM feedbacks f JOIN events e ON f.event_id = e.id
        WHERE f.status = ? AND (e.name LIKE ? OR e.client_name LIKE ?)
        ORDER BY f.completed_at DESC
      `).all(status as string, `%${search}%`, `%${search}%`)
    } else {
      rows = db.prepare(`
        SELECT f.*, e.name as event_name, e.client_name, e.event_date, e.venue
        FROM feedbacks f JOIN events e ON f.event_id = e.id
        WHERE f.status = ?
        ORDER BY f.completed_at DESC
      `).all(status as string)
    }
  } else {
    if (search) {
      rows = db.prepare(`
        SELECT f.*, e.name as event_name, e.client_name, e.event_date, e.venue
        FROM feedbacks f JOIN events e ON f.event_id = e.id
        WHERE e.name LIKE ? OR e.client_name LIKE ?
        ORDER BY f.completed_at DESC
      `).all(`%${search}%`, `%${search}%`)
    } else {
      rows = db.prepare(`
        SELECT f.*, e.name as event_name, e.client_name, e.event_date, e.venue
        FROM feedbacks f JOIN events e ON f.event_id = e.id
        ORDER BY f.completed_at DESC
      `).all()
    }
  }
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const feedback = db.prepare(`
    SELECT f.*, e.name as event_name, e.client_name, e.event_date, e.venue
    FROM feedbacks f JOIN events e ON f.event_id = e.id
    WHERE f.id = ?
  `).get(req.params.id) as Record<string, any> | undefined
  if (!feedback) {
    res.status(404).json({ success: false, error: 'Feedback not found' })
    return
  }
  const sections = db.prepare('SELECT * FROM feedback_sections WHERE feedback_id = ?').all(req.params.id)
  res.json({ success: true, data: { ...feedback, sections } })
})

router.put('/:id/sections/:role', (req: Request, res: Response): void => {
  const { id, role } = req.params
  const { content, rating, filledBy } = req.body
  if (content === undefined || rating === undefined || !filledBy) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const section = db.prepare('SELECT * FROM feedback_sections WHERE feedback_id = ? AND role = ?').get(id, role) as any
  if (!section) {
    res.status(404).json({ success: false, error: 'Section not found' })
    return
  }

  db.prepare(
    `UPDATE feedback_sections SET content = ?, rating = ?, filled_by = ?, filled_at = datetime('now')
     WHERE feedback_id = ? AND role = ?`
  ).run(content, rating, filledBy, id, role)

  const allSections = db.prepare('SELECT * FROM feedback_sections WHERE feedback_id = ?').all(id) as any[]
  const allFilled = allSections.every(s => s.filled_by !== '' && s.filled_at !== null)
  if (allFilled) {
    db.prepare("UPDATE feedbacks SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(id)
    const feedback = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as any
    db.prepare("UPDATE events SET status = 'completed' WHERE id = ?").run(feedback.event_id)

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(feedback.event_id) as any
    db.prepare(
      `INSERT INTO timeline_entries (id, event_id, type, title, description, performed_by, role, timestamp)
       VALUES (?, ?, 'feedback_completed', '反馈完成', ?, '系统', 'system', datetime('now'))`
    ).run(uuidv4(), feedback.event_id, `${event.name}客户反馈全部完成`)
  }

  const updatedSection = db.prepare('SELECT * FROM feedback_sections WHERE feedback_id = ? AND role = ?').get(id, role)
  res.json({ success: true, data: updatedSection })
})

export default router
