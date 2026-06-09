import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/stats', (_req: Request, res: Response): void => {
  const totalQualifications = (db.prepare('SELECT COUNT(*) as count FROM qualifications').get() as { count: number }).count
  const pendingQualifications = (db.prepare("SELECT COUNT(*) as count FROM qualifications WHERE status = 'pending'").get() as { count: number }).count
  const expiringQualifications = (db.prepare("SELECT COUNT(*) as count FROM qualifications WHERE status = 'expiring_soon'").get() as { count: number }).count
  const expiredQualifications = (db.prepare("SELECT COUNT(*) as count FROM qualifications WHERE status = 'expired'").get() as { count: number }).count
  const approvedQualifications = (db.prepare("SELECT COUNT(*) as count FROM qualifications WHERE status = 'approved'").get() as { count: number }).count

  const totalPurchases = (db.prepare('SELECT COUNT(*) as count FROM purchases').get() as { count: number }).count
  const pendingReviewPurchases = (db.prepare("SELECT COUNT(*) as count FROM purchases WHERE status = 'pending_review'").get() as { count: number }).count
  const approvedPurchases = (db.prepare("SELECT COUNT(*) as count FROM purchases WHERE status = 'approved'").get() as { count: number }).count
  const shippedPurchases = (db.prepare("SELECT COUNT(*) as count FROM purchases WHERE status = 'shipped'").get() as { count: number }).count
  const completedPurchases = (db.prepare("SELECT COUNT(*) as count FROM purchases WHERE status = 'completed'").get() as { count: number }).count

  const totalAmount = (db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases').get() as { total: number }).total
  const completedAmount = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE status = 'completed'").get() as { total: number }).total

  res.json({
    success: true,
    data: {
      qualifications: {
        total: totalQualifications,
        pending: pendingQualifications,
        expiring_soon: expiringQualifications,
        expired: expiredQualifications,
        approved: approvedQualifications,
      },
      purchases: {
        total: totalPurchases,
        pending_review: pendingReviewPurchases,
        approved: approvedPurchases,
        shipped: shippedPurchases,
        completed: completedPurchases,
        total_amount: totalAmount,
        completed_amount: completedAmount,
      },
    },
  })
})

router.get('/alerts', (_req: Request, res: Response): void => {
  const expiringQualifications = db.prepare(`
    SELECT * FROM qualifications
    WHERE status = 'expiring_soon'
    ORDER BY expire_date ASC
  `).all()

  const expiredQualifications = db.prepare(`
    SELECT * FROM qualifications
    WHERE status = 'expired'
    ORDER BY expire_date ASC
  `).all()

  const pendingReviewPurchases = db.prepare(`
    SELECT * FROM purchases
    WHERE status = 'pending_review'
    ORDER BY created_at ASC
  `).all()

  const purchasesWithExpiringQualification = db.prepare(`
    SELECT p.* FROM purchases p
    JOIN qualifications q ON p.qualification_id = q.id
    WHERE q.status = 'expiring_soon' AND p.status NOT IN ('completed', 'shipped')
    ORDER BY p.created_at DESC
  `).all()

  res.json({
    success: true,
    data: {
      expiring_qualifications: expiringQualifications,
      expired_qualifications: expiredQualifications,
      pending_review_purchases: pendingReviewPurchases,
      purchases_with_expiring_qualification: purchasesWithExpiringQualification,
    },
  })
})

router.get('/recent-activities', (req: Request, res: Response): void => {
  const limit = parseInt(req.query.limit as string, 10) || 20

  const qualLogs = db.prepare(`
    SELECT l.*, q.customer_name
    FROM qualification_review_logs l
    JOIN qualifications q ON l.qualification_id = q.id
    ORDER BY l.created_at DESC
    LIMIT ?
  `).all(limit) as Array<Record<string, unknown>>

  const purchaseLogs = db.prepare(`
    SELECT l.*, p.request_no, p.customer_name as purchase_customer
    FROM purchase_flow_logs l
    JOIN purchases p ON l.purchase_id = p.id
    ORDER BY l.created_at DESC
    LIMIT ?
  `).all(limit) as Array<Record<string, unknown>>

  const allLogs: Array<Record<string, unknown>> = [
    ...qualLogs.map(l => ({ ...l, type: 'qualification' })),
    ...purchaseLogs.map(l => ({ ...l, type: 'purchase' })),
  ].sort((a, b) => {
    const ta = String(a['created_at'] || '')
    const tb = String(b['created_at'] || '')
    return tb.localeCompare(ta)
  }).slice(0, limit)

  res.json({ success: true, data: allLogs })
})

export default router
