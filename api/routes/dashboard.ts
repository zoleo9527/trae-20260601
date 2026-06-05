import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const pendingBookings = db.prepare(`SELECT b.*, c.name as course_name, bl.name as belayer_name FROM bookings b LEFT JOIN courses c ON b.course_id = c.id LEFT JOIN belayers bl ON b.belayer_id = bl.id WHERE b.status IN ('pending', 'confirmed', 'in_progress')`).all()
  const unreturnedEquipment = db.prepare('SELECT * FROM equipment_issuances WHERE returned_at IS NULL').all()
  const openAnomalies = db.prepare("SELECT * FROM anomalies WHERE status = 'open'").all()

  const recentCompletedBookings = db.prepare(`SELECT b.*, c.name as course_name, bl.name as belayer_name FROM bookings b LEFT JOIN courses c ON b.course_id = c.id LEFT JOIN belayers bl ON b.belayer_id = bl.id WHERE b.status = 'completed' AND b.updated_at >= datetime('now','localtime', '-24 hours')`).all()
  const recentReturnedEquipment = db.prepare("SELECT * FROM equipment_issuances WHERE returned_at IS NOT NULL AND returned_at >= datetime('now','localtime', '-24 hours')").all()

  const shiftTodos = db.prepare("SELECT * FROM shift_todos ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, created_at DESC").all()

  const recentCompleted = [
    ...recentCompletedBookings.map((b: any) => ({ ...b, _type: 'booking' as const })),
    ...recentReturnedEquipment.map((e: any) => ({ ...e, _type: 'equipment' as const })),
  ]

  res.json({
    success: true,
    data: {
      pending_bookings: pendingBookings.length,
      unreturned_equipment: unreturnedEquipment.length,
      open_anomalies: openAnomalies.length,
      open_anomaly_list: openAnomalies,
      pending_todo_list: shiftTodos.filter((t: any) => t.status === 'pending'),
      recent_completed: recentCompleted,
    },
  })
})

export default router
