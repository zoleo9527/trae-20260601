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

  const now = new Date().toISOString()
  const updated: typeof data.checkinRecords = []

  for (const studentId of studentIds) {
    const existing = data.checkinRecords.find(
      (r) => r.courseId === courseId && r.studentId === studentId
    )
    if (existing) {
      existing.status = 'checked_in'
      existing.checkedInAt = now
      updated.push(existing)
    } else {
      const record = {
        id: generateId(),
        courseId,
        studentId,
        status: 'checked_in' as const,
        checkedInAt: now,
      }
      data.checkinRecords.push(record)
      updated.push(record)
    }
  }

  writeData(data)
  res.json({ success: true, data: updated })
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
