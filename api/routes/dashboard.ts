import { Router, type Request, type Response } from 'express'
import { readData, getToday } from '../db.js'

const router = Router()

function getAlerts(role: string) {
  const data = readData()
  const today = getToday()
  const alerts: { type: string; message: string; severity: string }[] = []

  if (role === 'rental') {
    const activeRentals = data.rentalRecords.filter((r) => r.status === 'active')
    const mismatches = data.rentalRecords.filter((r) => r.abnormal)
    if (mismatches.length > 0) {
      alerts.push({ type: 'mismatch', message: `${mismatches.length} 条归还异常记录`, severity: 'orange' })
    }
    if (activeRentals.length > 0) {
      alerts.push({ type: 'active_rentals', message: `${activeRentals.length} 个设备仍在租赁中`, severity: 'yellow' })
    }
    const maintenanceEquip = data.equipment.filter((e) => e.status === 'maintenance')
    if (maintenanceEquip.length > 0) {
      alerts.push({ type: 'maintenance', message: `${maintenanceEquip.length} 个设备维护中`, severity: 'orange' })
    }
  }

  if (role === 'coach_supervisor') {
    const todayCourses = data.courses.filter((c) => c.date === today)
    const pendingCourses = todayCourses.filter((c) => c.status === 'pending')
    const noShows = data.checkinRecords.filter((r) => {
      const course = data.courses.find((c) => c.id === r.courseId)
      return course && course.date === today && r.status === 'no_show'
    })
    if (pendingCourses.length > 0) {
      alerts.push({ type: 'pending_courses', message: `${pendingCourses.length} 节课程待确认开课`, severity: 'orange' })
    }
    if (noShows.length > 0) {
      alerts.push({ type: 'no_show', message: `${noShows.length} 名学员未到`, severity: 'red' })
    }
    const unconfirmed = todayCourses.filter((c) => c.status !== 'cancelled' && !c.confirmedByCoachAt)
    if (unconfirmed.length > 0) {
      alerts.push({ type: 'unconfirmed', message: `${unconfirmed.length} 节课程教练未确认`, severity: 'orange' })
    }
  }

  if (role === 'safety_patrol') {
    const missingAttachments = data.rescueRecords.filter(
      (r) => !r.attachments || r.attachments.length === 0 || r.attachments.some((a) => a.isPlaceholder)
    )
    if (missingAttachments.length > 0) {
      alerts.push({ type: 'missing_attachments', message: `${missingAttachments.length} 条救援记录缺少附件`, severity: 'orange' })
    }
    const highSeverity = data.rescueRecords.filter((r) => r.severity === 'severe')
    if (highSeverity.length > 0) {
      alerts.push({ type: 'high_severity', message: `${highSeverity.length} 条严重救援记录`, severity: 'red' })
    }
  }

  return alerts
}

router.get('/', (req: Request, res: Response): void => {
  const { role } = req.query
  if (!role || typeof role !== 'string') {
    res.status(400).json({ success: false, error: 'role query parameter is required' })
    return
  }

  const data = readData()
  const today = getToday()
  const alerts = getAlerts(role)

  const rentedCount = data.equipment.filter((e) => e.status === 'rented').length
  const activeRentals = data.rentalRecords.filter((r) => r.status === 'active').length
  const mismatchCount = data.rentalRecords.filter((r) => r.abnormal).length
  const todayCourses = data.courses.filter((c) => c.date === today).length
  const pendingCourses = data.courses.filter((c) => c.date === today && c.status === 'pending').length
  const noShowCount = data.checkinRecords.filter((r) => {
    const course = data.courses.find((c) => c.id === r.courseId)
    return course && course.date === today && r.status === 'no_show'
  }).length
  const rescueCount = data.rescueRecords.length
  const missingAttachmentCount = data.rescueRecords.filter(
    (r) => !r.attachments || r.attachments.length === 0 || r.attachments.some((a) => a.isPlaceholder)
  ).length

  const stats = {
    rentedCount,
    activeRentals,
    mismatchCount,
    todayCourses,
    pendingCourses,
    noShowCount,
    rescueCount,
    missingAttachmentCount,
  }

  res.json({ success: true, data: { stats, alerts } })
})

router.get('/alerts', (req: Request, res: Response): void => {
  const { role } = req.query
  if (!role || typeof role !== 'string') {
    res.status(400).json({ success: false, error: 'role query parameter is required' })
    return
  }

  const alerts = getAlerts(role)
  res.json({ success: true, data: alerts })
})

export default router
