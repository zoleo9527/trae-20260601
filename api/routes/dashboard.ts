import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

router.get('/:role', (req: Request, res: Response): void => {
  const { role } = req.params

  const pendingReconciliationItems = db.prepare(`
    SELECT ri.id
    FROM reconciliation_items ri
    JOIN reconciliations r ON ri.reconciliation_id = r.id
    JOIN reconciliation_confirmations rc ON rc.item_id = ri.id
    WHERE r.all_confirmed = 0 AND rc.role = ? AND rc.confirmed = 0
  `).all(role) as any[]

  const inProgressReconciliationItems = db.prepare(`
    SELECT DISTINCT ri.id
    FROM reconciliation_items ri
    JOIN reconciliations r ON ri.reconciliation_id = r.id
    JOIN reconciliation_confirmations rc ON rc.item_id = ri.id
    WHERE r.all_confirmed = 0 AND ri.status = 'difference'
  `).all() as any[]

  const completedReconciliationItems = db.prepare(`
    SELECT ri.id
    FROM reconciliation_items ri
    JOIN reconciliations r ON ri.reconciliation_id = r.id
    JOIN reconciliation_confirmations rc ON rc.item_id = ri.id
    WHERE r.all_confirmed = 1 AND rc.role = ? AND rc.confirmed = 1
  `).all(role) as any[]

  const pendingFeedbackSections = db.prepare(`
    SELECT fs.id
    FROM feedback_sections fs
    JOIN feedbacks f ON fs.feedback_id = f.id
    WHERE f.status = 'pending' AND fs.role = ? AND fs.filled_by = ''
  `).all(role) as any[]

  const overdueFeedbackSections = db.prepare(`
    SELECT fs.id
    FROM feedback_sections fs
    JOIN feedbacks f ON fs.feedback_id = f.id
    WHERE f.status = 'pending' AND fs.role = ? AND fs.filled_by = '' AND fs.deadline < datetime('now')
  `).all(role) as any[]

  const recentItems = db.prepare(`
    SELECT te.*, e.name as event_name
    FROM timeline_entries te
    JOIN events e ON te.event_id = e.id
    WHERE te.role = ? OR te.role = 'system'
    ORDER BY te.timestamp DESC
    LIMIT 5
  `).all(role)

  res.json({
    success: true,
    data: {
      pendingReconciliationCount: pendingReconciliationItems.length,
      inProgressReconciliationCount: inProgressReconciliationItems.length,
      completedReconciliationCount: completedReconciliationItems.length,
      pendingFeedbackCount: pendingFeedbackSections.length,
      overdueFeedbackCount: overdueFeedbackSections.length,
      recentItems,
    },
  })
})

export default router
