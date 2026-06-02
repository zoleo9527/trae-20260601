import { Router } from 'express'
import { auth } from '../auth'
import { getDb } from '../db'

const router = Router()

router.get('/overdue-repairs', auth(['supervisor']), (req, res) => {
  const db = getDb()
  const list = db.prepare(`
    SELECT r.*, e.name AS enterprise_name,
      w.id AS work_order_id, w.engineer_id, u.name AS engineer_name, w.status AS work_status
    FROM repair_orders r
    JOIN enterprises e ON r.enterprise_id=e.id
    LEFT JOIN work_orders w ON w.repair_order_id=r.id AND w.status NOT IN ('completed','reassigned')
    LEFT JOIN users u ON w.engineer_id=u.id
    WHERE r.status NOT IN ('completed','closed')
      AND r.deadline < datetime('now','localtime')
    ORDER BY r.urgency DESC, r.deadline ASC
  `).all()
  res.json(list)
})

router.get('/stats', auth(['supervisor']), (req, res) => {
  const db = getDb()
  const totalRepairs = db.prepare("SELECT COUNT(*) AS count FROM repair_orders").get() as any
  const pendingRepairs = db.prepare("SELECT COUNT(*) AS count FROM repair_orders WHERE status='pending'").get() as any
  const overdueRepairs = db.prepare("SELECT COUNT(*) AS count FROM repair_orders WHERE status NOT IN ('completed','closed') AND deadline < datetime('now','localtime')").get() as any
  const completedRepairs = db.prepare("SELECT COUNT(*) AS count FROM repair_orders WHERE status IN ('completed','closed')").get() as any
  const avgRating = db.prepare("SELECT ROUND(AVG(rating),2) AS avg FROM evaluations").get() as any
  const badEvals = db.prepare("SELECT COUNT(*) AS count FROM evaluations WHERE rating<=2").get() as any
  const pendingVisitors = db.prepare("SELECT COUNT(*) AS count FROM visitors WHERE status='pending'").get() as any
  const tempPasses = db.prepare("SELECT COUNT(*) AS count FROM access_records WHERE pass_type='temporary'").get() as any

  res.json({
    total_repairs: totalRepairs.count,
    pending_repairs: pendingRepairs.count,
    overdue_repairs: overdueRepairs.count,
    completed_repairs: completedRepairs.count,
    avg_rating: avgRating.avg,
    bad_evaluations: badEvals.count,
    pending_visitors: pendingVisitors.count,
    temporary_passes: tempPasses.count
  })
})

router.get('/bad-evaluations', auth(['supervisor']), (req, res) => {
  const db = getDb()
  const list = db.prepare(`
    SELECT ev.*, r.title AS repair_title, r.location, u.name AS rater_name,
      w.engineer_id, eu.name AS engineer_name
    FROM evaluations ev
    JOIN repair_orders r ON ev.repair_order_id=r.id
    JOIN users u ON ev.rater_id=u.id
    LEFT JOIN work_orders w ON w.repair_order_id=r.id AND w.status='completed'
    LEFT JOIN users eu ON w.engineer_id=eu.id
    WHERE ev.rating <= 2
    ORDER BY ev.rating ASC, ev.created_at DESC
  `).all()
  res.json(list)
})

export default router
