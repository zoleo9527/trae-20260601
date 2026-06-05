import { Router, type Request, type Response } from 'express'
import { readData, writeData, generateId, getToday } from '../db.js'

const router = Router()

router.get('/students', (req: Request, res: Response): void => {
  const data = readData()
  const { courseId } = req.query
  if (!courseId || typeof courseId !== 'string') {
    res.status(400).json({ success: false, error: 'courseId query parameter is required' })
    return
  }

  const course = data.courses.find((c) => c.id === courseId)
  if (!course) {
    res.status(404).json({ success: false, error: 'Course not found' })
    return
  }

  const coach = data.coaches.find((ch) => ch.id === course.coachId)
  const checkins = data.checkinRecords.filter((r) => r.courseId === courseId)

  const result = checkins.map((r) => {
    const student = data.students.find((s) => s.id === r.studentId)
    return {
      id: r.id,
      studentId: r.studentId,
      studentName: student?.name || '未知学员',
      courseId: r.courseId,
      courseName: `${coach?.name || ''} ${course.date} ${course.startTime}-${course.endTime}`,
      status: r.status,
      checkinAt: r.checkedInAt,
    }
  })

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { courseId, studentIds } = req.body
  if (!courseId || !Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400).json({ success: false, error: 'courseId and studentIds (non-empty array) are required' })
    return
  }

  const data = readData()
  const course = data.courses.find((c) => c.id === courseId)
  if (!course) {
    res.status(404).json({ success: false, error: 'Course not found' })
    return
  }

  if (course.status !== 'in_progress') {
    res.status(400).json({ success: false, error: `课程当前状态为「${course.status}」，只有「可签到」状态的课程才能签到` })
    return
  }

  const now = new Date().toISOString()
  const updated: typeof data.checkinRecords = []
  const blocked: { studentId: string; reason: string }[] = []

  for (const studentId of studentIds) {
    const existing = data.checkinRecords.find(
      (r) => r.courseId === courseId && r.studentId === studentId
    )

    if (!existing) {
      blocked.push({ studentId, reason: '该学员未报名此课程' })
      continue
    }

    if (existing.status === 'checked_in') {
      continue
    }

    if (existing.status === 'no_show') {
      blocked.push({ studentId, reason: '该学员已被标记爽约' })
      continue
    }

    const courseRental = data.rentalRecords.find(
      (r) => r.studentId === studentId && r.courseId === courseId && r.status === 'active'
    )
    if (!courseRental) {
      const anyRental = data.rentalRecords.find(
        (r) => r.studentId === studentId && r.status === 'active'
      )
      const student = data.students.find((s) => s.id === studentId)
      if (anyRental) {
        blocked.push({ studentId, reason: `${student?.name || '该学员'}的租赁未关联当前课程，请先绑定课程租赁` })
      } else {
        blocked.push({ studentId, reason: `${student?.name || '该学员'}尚未租赁雪具` })
      }
      continue
    }

    existing.status = 'checked_in'
    existing.checkedInAt = now
    updated.push(existing)
  }

  if (updated.length > 0) {
    writeData(data)
  }

  res.json({ success: true, data: { checkedIn: updated, blocked } })
})

router.get('/history', (req: Request, res: Response): void => {
  const data = readData()
  const { date, courseId, studentId } = req.query
  let result = data.checkinRecords

  if (courseId && typeof courseId === 'string') {
    result = result.filter((r) => r.courseId === courseId)
  }
  if (studentId && typeof studentId === 'string') {
    result = result.filter((r) => r.studentId === studentId)
  }
  if (date && typeof date === 'string') {
    const courseIds = data.courses.filter((c) => c.date === date).map((c) => c.id)
    result = result.filter((r) => courseIds.includes(r.courseId))
  }

  const joined = result.map((r) => {
    const student = data.students.find((s) => s.id === r.studentId)
    const course = data.courses.find((c) => c.id === r.courseId)
    const coach = course ? data.coaches.find((ch) => ch.id === course.coachId) : undefined
    const matchedRental = data.rentalRecords.find(
      (rr) => rr.studentId === r.studentId && rr.courseId === r.courseId && (rr.status === 'active' || rr.status === 'returned')
    )
    const rentalEquipment = matchedRental ? data.equipment.find((e) => e.id === matchedRental.equipmentId) : undefined
    return {
      id: r.id,
      studentId: r.studentId,
      studentName: student?.name || '未知学员',
      courseId: r.courseId,
      courseName: course
        ? `${coach?.name || ''} ${course.date} ${course.startTime}-${course.endTime}`
        : r.courseId,
      status: r.status,
      checkinAt: r.checkedInAt,
      equipmentCode: rentalEquipment?.code,
      equipmentName: rentalEquipment?.name,
      rentalAbnormal: matchedRental?.abnormal,
    }
  })

  res.json({ success: true, data: joined })
})

router.get('/no-shows', (req: Request, res: Response): void => {
  const data = readData()
  const { date } = req.query

  let courseIds: string[] = []
  if (date && typeof date === 'string') {
    courseIds = data.courses.filter((c) => c.date === date).map((c) => c.id)
  } else {
    courseIds = data.courses.map((c) => c.id)
  }

  const noShowRecords = data.checkinRecords.filter(
    (r) => courseIds.includes(r.courseId) && r.status === 'no_show'
  )
  const noShowStudents = noShowRecords.map((r) => {
    const student = data.students.find((s) => s.id === r.studentId)
    const course = data.courses.find((c) => c.id === r.courseId)
    return {
      ...r,
      student,
      course,
    }
  })

  res.json({ success: true, data: noShowStudents })
})

router.get('/gaps', (req: Request, res: Response): void => {
  const data = readData()
  const today = getToday()
  const todayCourses = data.courses
    .filter((c) => c.date === today && c.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const gaps: { startTime: string; endTime: string; afterCourse: { coachName: string; date: string; startTime: string; endTime: string } | null; beforeCourse: { coachName: string; date: string; startTime: string; endTime: string } | null }[] = []

  for (let i = 0; i < todayCourses.length - 1; i++) {
    const current = todayCourses[i]
    const next = todayCourses[i + 1]
    if (current.endTime < next.startTime) {
      const currentCoach = data.coaches.find((ch) => ch.id === current.coachId)
      const nextCoach = data.coaches.find((ch) => ch.id === next.coachId)
      gaps.push({
        startTime: current.endTime,
        endTime: next.startTime,
        afterCourse: {
          coachName: currentCoach?.name || '未知教练',
          date: current.date,
          startTime: current.startTime,
          endTime: current.endTime,
        },
        beforeCourse: {
          coachName: nextCoach?.name || '未知教练',
          date: next.date,
          startTime: next.startTime,
          endTime: next.endTime,
        },
      })
    }
  }

  res.json({ success: true, data: gaps })
})

export default router
