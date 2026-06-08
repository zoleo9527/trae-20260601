import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/linen-loss', (req: Request, res: Response): void => {
  const { groupBy, dateFrom, dateTo } = req.query
  const group = groupBy || 'category'

  let selectField = ''
  let groupField = ''

  if (group === 'floor') {
    selectField = 'r.floor as group_key, r.floor as floor'
    groupField = 'r.floor'
  } else if (group === 'operator') {
    selectField = 'u.id as user_id, u.name as operator_name, u.name as group_key'
    groupField = 'u.id'
  } else {
    selectField = 'll.category as group_key, ll.category as category'
    groupField = 'll.category'
  }

  let sql = `
    SELECT ${selectField}, SUM(ll.quantity) as total_quantity, COUNT(*) as loss_count
    FROM linen_losses ll
    JOIN rooms r ON ll.room_id = r.id
    JOIN users u ON ll.operator_id = u.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (dateFrom) {
    sql += ' AND ll.loss_date >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    sql += ' AND ll.loss_date <= ?'
    params.push(dateTo)
  }

  sql += ` GROUP BY ${groupField} ORDER BY total_quantity DESC`
  const data = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data })
})

router.get('/inspection-miss', (req: Request, res: Response): void => {
  const { groupBy, dateFrom, dateTo } = req.query
  const group = groupBy || 'operator'

  let selectField = ''
  let groupField = ''

  if (group === 'operator') {
    selectField = 'u.id as user_id, u.name as operator_name, u.name as group_key'
    groupField = 'u.id'
  } else if (group === 'floor') {
    selectField = 'r.floor as group_key, r.floor as floor'
    groupField = 'r.floor'
  } else {
    selectField = 'ii.item_name as group_key, ii.item_name as item_name'
    groupField = 'ii.item_name'
  }

  let sql = `
    SELECT ${selectField}, COUNT(*) as miss_count
    FROM inspection_items ii
    JOIN inspections i ON ii.inspection_id = i.id
    JOIN users u ON i.inspector_id = u.id
    JOIN rooms r ON i.room_id = r.id
    WHERE ii.is_missed = 1
  `
  const params: unknown[] = []

  if (dateFrom) {
    sql += ' AND i.scheduled_at >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    sql += ' AND i.scheduled_at <= ?'
    params.push(dateTo)
  }

  sql += ` GROUP BY ${groupField} ORDER BY miss_count DESC`
  const data = db.prepare(sql).all(...params as any[])
  res.json({ success: true, data })
})

router.get('/maintenance-response', (req: Request, res: Response): void => {
  const { dateFrom, dateTo } = req.query

  let sql = `
    SELECT mo.status, COUNT(*) as count
    FROM maintenance_orders mo
    WHERE 1=1
  `
  const params: unknown[] = []

  if (dateFrom) {
    sql += ' AND mo.reported_at >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    sql += ' AND mo.reported_at <= ?'
    params.push(dateTo)
  }

  sql += ' GROUP BY mo.status'
  const statusCounts = db.prepare(sql).all(...params as any[])

  let avgSql = `
    SELECT AVG(julianday(mo.completed_at) - julianday(mo.reported_at)) * 24 as avg_response_hours,
      COUNT(*) as completed_count
    FROM maintenance_orders mo
    WHERE mo.completed_at IS NOT NULL
  `
  const avgParams: unknown[] = []

  if (dateFrom) {
    avgSql += ' AND mo.reported_at >= ?'
    avgParams.push(dateFrom)
  }
  if (dateTo) {
    avgSql += ' AND mo.reported_at <= ?'
    avgParams.push(dateTo)
  }

  const avgResult = db.prepare(avgSql).get(...avgParams as any[]) as any

  res.json({
    success: true,
    data: {
      statusCounts,
      avgResponseHours: avgResult.avg_response_hours ? Math.round(avgResult.avg_response_hours * 100) / 100 : null,
      completedCount: avgResult.completed_count,
    },
  })
})

export default router
