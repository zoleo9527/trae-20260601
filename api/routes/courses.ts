import { Router, type Request, type Response } from 'express'
import { readData, writeData, generateId } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const data = readData()
  const { date, coachId } = req.query
  let result = data.courses
  if (date && typeof date === 'string') {
    result = result.filter((c) => c.date === date)
  }
  if (coachId && typeof coachId === 'string') {
    result = result.filter((c) => c.coachId === coachId)
  }

  const joined = result.map((c) => {
    const coach = data.coaches.find((ch) => ch.id === c.coachId)
    const currentStudents = data.checkinRecords.filter(
      (r) => r.courseId === c.id && r.status !== 'no_show'
    ).length
    return {
      ...c,
      coachName: coach?.name || '未知教练',
      currentStudents,
    }
  })

  res.json({ success: true, data: joined })
})

router.post('/', (req: Request, res: Response): void => {
  const { coachId, date, startTime, endTime, maxStudents } = req.body
  if (!coachId || !date || !startTime || !endTime || !maxStudents) {
    res.status(400).json({ success: false, error: 'coachId, date, startTime, endTime, maxStudents are required' })
    return
  }

  const data = readData()
  const coach = data.coaches.find((c) => c.id === coachId)
  if (!coach) {
    res.status(404).json({ success: false, error: 'Coach not found' })
    return
  }

  const course = {
    id: generateId(),
    coachId,
    date,
    startTime,
    endTime,
    maxStudents,
    status: 'pending' as const,
  }
  data.courses.push(course)
  writeData(data)

  res.json({ success: true, data: course })
})

router.patch('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, cancelReason } = req.body

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `status must be one of: ${validStatuses.join(', ')}` })
    return
  }

  const data = readData()
  const course = data.courses.find((c) => c.id === id)
  if (!course) {
    res.status(404).json({ success: false, error: 'Course not found' })
    return
  }

  if (status) course.status = status
  if (cancelReason) course.cancelReason = cancelReason

  if (status === 'completed') {
    const pendingCheckins = data.checkinRecords.filter(
      (r) => r.courseId === id && r.status === 'pending'
    )
    for (const checkin of pendingCheckins) {
      checkin.status = 'no_show'
    }
  }

  writeData(data)

  const coach = data.coaches.find((ch) => ch.id === course.coachId)
  const currentStudents = data.checkinRecords.filter(
    (r) => r.courseId === id && r.status !== 'no_show'
  ).length
  res.json({ success: true, data: { ...course, coachName: coach?.name || '未知教练', currentStudents } })
})

router.post('/:id/enroll', (req: Request, res: Response): void => {
  const { id } = req.params
  const { studentIds } = req.body
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400).json({ success: false, error: 'studentIds (non-empty array) is required' })
    return
  }

  const data = readData()
  const course = data.courses.find((c) => c.id === id)
  if (!course) {
    res.status(404).json({ success: false, error: 'Course not found' })
    return
  }

  if (course.status === 'cancelled') {
    res.status(400).json({ success: false, error: 'Cannot enroll in a cancelled course' })
    return
  }

  const existingCheckins = data.checkinRecords.filter((r) => r.courseId === id)
  const existingStudentIds = new Set(existingCheckins.map((r) => r.studentId))
  const currentCount = existingCheckins.length

  if (currentCount + studentIds.length > course.maxStudents) {
    res.status(400).json({ success: false, error: `Exceeds max students limit (${course.maxStudents})` })
    return
  }

  const newCheckins = []
  for (const studentId of studentIds) {
    if (existingStudentIds.has(studentId)) continue
    const student = data.students.find((s) => s.id === studentId)
    if (!student) continue
    const record = {
      id: generateId(),
      courseId: id,
      studentId,
      status: 'pending' as const,
    }
    data.checkinRecords.push(record)
    newCheckins.push(record)
  }

  writeData(data)
  res.json({ success: true, data: { enrolled: newCheckins.length, totalStudents: currentCount + newCheckins.length } })
})

router.post('/:id/confirm', (req: Request, res: Response): void => {
  const { id } = req.params

  const data = readData()
  const course = data.courses.find((c) => c.id === id)
  if (!course) {
    res.status(404).json({ success: false, error: 'Course not found' })
    return
  }

  course.confirmedByCoachAt = new Date().toISOString()
  writeData(data)

  res.json({ success: true, data: course })
})

export default router
