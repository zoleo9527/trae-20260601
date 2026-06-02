import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/today', (_req: Request, res: Response) => {
  const todayOrders = db.prepare(`
    SELECT status, COUNT(*) as count, SUM(total_amount) as revenue
    FROM orders WHERE date(created_at) = date('now', 'localtime')
    GROUP BY status
  `).all()

  const todaySummary = db.prepare(`
    SELECT COUNT(*) as total_orders,
           COALESCE(SUM(total_amount), 0) as total_revenue,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
           COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
           COUNT(CASE WHEN status = 'rework' THEN 1 END) as rework_count
    FROM orders WHERE date(created_at) = date('now', 'localtime')
  `).get()

  const lowPackages = db.prepare(`
    SELECT cp.*, c.name as customer_name, pt.name as package_name
    FROM customer_packages cp
    JOIN customers c ON c.id = cp.customer_id
    JOIN package_templates pt ON pt.id = cp.package_template_id
    WHERE cp.remaining_count <= 2
    ORDER BY cp.remaining_count ASC
  `).all()

  const expiringPackages = db.prepare(`
    SELECT cp.*, c.name as customer_name, pt.name as package_name
    FROM customer_packages cp
    JOIN customers c ON c.id = cp.customer_id
    JOIN package_templates pt ON pt.id = cp.package_template_id
    WHERE date(cp.expires_at) <= date('now', '+30 days')
    ORDER BY cp.expires_at ASC
  `).all()

  res.json({
    success: true,
    data: {
      summary: todaySummary,
      by_status: todayOrders,
      low_packages: lowPackages,
      expiring_packages: expiringPackages,
    },
  })
})

router.get('/rework-rate', (req: Request, res: Response) => {
  const { period } = req.query

  let dateFilter = ''
  if (period === '7d') {
    dateFilter = "AND date(o.created_at) >= date('now', '-7 days')"
  } else if (period === '30d') {
    dateFilter = "AND date(o.created_at) >= date('now', '-30 days')"
  }

  const overall = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN o.status = 'rework' OR o.is_rework = 1 THEN 1 ELSE 0 END) as rework_count,
      ROUND(
        SUM(CASE WHEN o.status = 'rework' OR o.is_rework = 1 THEN 1 ELSE 0 END) * 100.0 / MAX(COUNT(*), 1),
        2
      ) as rework_rate
    FROM orders o WHERE 1=1 ${dateFilter}
  `).get()

  const byEmployee = db.prepare(`
    SELECT e.name as employee_name, e.id as employee_id,
      COUNT(*) as total,
      SUM(CASE WHEN o.status = 'rework' OR o.is_rework = 1 THEN 1 ELSE 0 END) as rework_count,
      ROUND(
        SUM(CASE WHEN o.status = 'rework' OR o.is_rework = 1 THEN 1 ELSE 0 END) * 100.0 / MAX(COUNT(*), 1),
        2
      ) as rework_rate
    FROM orders o
    JOIN employees e ON e.id = o.employee_id
    WHERE 1=1 ${dateFilter}
    GROUP BY o.employee_id
    ORDER BY rework_rate DESC
  `).all()

  res.json({ success: true, data: { overall, by_employee: byEmployee } })
})

router.get('/package-consumption', (_req: Request, res: Response) => {
  const byTemplate = db.prepare(`
    SELECT pt.name, pt.id,
      COUNT(cp.id) as sold_count,
      SUM(cp.total_count) as total_items,
      SUM(cp.remaining_count) as remaining_items,
      ROUND(
        (SUM(cp.total_count) - SUM(cp.remaining_count)) * 100.0 / NULLIF(SUM(cp.total_count), 0),
        2
      ) as consumption_rate
    FROM package_templates pt
    LEFT JOIN customer_packages cp ON cp.package_template_id = pt.id
    GROUP BY pt.id
  `).all()

  const byServiceType = db.prepare(`
    SELECT pi.service_type,
      SUM(pi.count * cp_count.sold) as total_sold,
      COALESCE(usage.used, 0) as total_used,
      ROUND(
        COALESCE(usage.used, 0) * 100.0 / NULLIF(SUM(pi.count * cp_count.sold), 0),
        2
      ) as consumption_rate
    FROM package_items pi
    JOIN (
      SELECT package_template_id, COUNT(*) as sold
      FROM customer_packages
      GROUP BY package_template_id
    ) cp_count ON cp_count.package_template_id = pi.package_template_id
    LEFT JOIN (
      SELECT dr.service_type, SUM(dr.count) as used
      FROM deduction_records dr
      WHERE dr.type = 'usage'
      GROUP BY dr.service_type
    ) usage ON usage.service_type = pi.service_type
    GROUP BY pi.service_type
  `).all()

  res.json({ success: true, data: { by_template: byTemplate, by_service_type: byServiceType } })
})

router.get('/compensation', (_req: Request, res: Response) => {
  const records = db.prepare(`
    SELECT dr.*, c.name as customer_name, pt.name as package_name
    FROM deduction_records dr
    JOIN customer_packages cp ON cp.id = dr.customer_package_id
    JOIN customers c ON c.id = cp.customer_id
    JOIN package_templates pt ON pt.id = cp.package_template_id
    WHERE dr.type IN ('rework_refund', 'compensation')
    ORDER BY dr.created_at DESC
  `).all()

  const summary = db.prepare(`
    SELECT type, COUNT(*) as count, SUM(count) as total_count
    FROM deduction_records
    WHERE type IN ('rework_refund', 'compensation')
    GROUP BY type
  `).all()

  res.json({ success: true, data: { records, summary } })
})

export default router
