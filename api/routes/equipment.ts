import { Router, type Request, type Response } from 'express'
import { readData, writeData, generateId } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const data = readData()
  const { status } = req.query
  let equipment = data.equipment
  if (status && typeof status === 'string') {
    equipment = equipment.filter((e) => e.status === status)
  }

  const result = equipment.map((e) => {
    const activeRental = data.rentalRecords.find(
      (r) => r.equipmentId === e.id && r.status === 'active'
    )
    const student = activeRental
      ? data.students.find((s) => s.id === activeRental.studentId)
      : undefined
    return {
      ...e,
      currentRentalId: activeRental?.id,
      studentName: student?.name,
      abnormal: activeRental?.abnormal,
    }
  })

  res.json({ success: true, data: result })
})

router.post('/rent', (req: Request, res: Response): void => {
  const { equipmentId, studentId, courseId } = req.body
  if (!equipmentId || !studentId) {
    res.status(400).json({ success: false, error: 'equipmentId and studentId are required' })
    return
  }

  const data = readData()
  const equipment = data.equipment.find((e) => e.id === equipmentId)
  if (!equipment) {
    res.status(404).json({ success: false, error: 'Equipment not found' })
    return
  }
  if (equipment.status !== 'available') {
    res.status(400).json({ success: false, error: 'Equipment is not available' })
    return
  }

  const student = data.students.find((s) => s.id === studentId)
  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' })
    return
  }

  if (courseId) {
    const course = data.courses.find((c) => c.id === courseId)
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' })
      return
    }
    if (course.status === 'completed' || course.status === 'cancelled') {
      res.status(400).json({ success: false, error: `课程当前状态为「${course.status}」，不可绑定租赁` })
      return
    }
    const enrolled = data.checkinRecords.some(
      (r) => r.courseId === courseId && r.studentId === studentId
    )
    if (!enrolled) {
      res.status(400).json({ success: false, error: '该学员未报名此课程，不可绑定课程租赁' })
      return
    }
  }

  equipment.status = 'rented'
  const rental = {
    id: generateId(),
    equipmentId,
    studentId,
    courseId: courseId || undefined,
    rentedAt: new Date().toISOString(),
    status: 'active' as const,
  }
  data.rentalRecords.push(rental)
  writeData(data)

  res.json({ success: true, data: rental })
})

router.post('/return', (req: Request, res: Response): void => {
  const { rentalId, abnormal } = req.body
  if (!rentalId) {
    res.status(400).json({ success: false, error: 'rentalId is required' })
    return
  }

  const data = readData()
  const rental = data.rentalRecords.find((r) => r.id === rentalId)
  if (!rental) {
    res.status(404).json({ success: false, error: 'Rental record not found' })
    return
  }
  if (rental.status !== 'active') {
    res.status(400).json({ success: false, error: 'Rental is not active' })
    return
  }

  const equipment = data.equipment.find((e) => e.id === rental.equipmentId)
  if (!equipment) {
    res.status(404).json({ success: false, error: 'Equipment not found' })
    return
  }

  if (abnormal) {
    equipment.status = 'maintenance'
    rental.abnormal = abnormal
  } else {
    equipment.status = 'available'
  }

  rental.status = 'returned'
  rental.returnedAt = new Date().toISOString()
  writeData(data)

  res.json({ success: true, data: rental })
})

router.get('/rentals', (req: Request, res: Response): void => {
  const data = readData()
  const { status, courseId, studentId } = req.query
  let result = data.rentalRecords

  if (status && typeof status === 'string') {
    result = result.filter((r) => r.status === status)
  }
  if (courseId && typeof courseId === 'string') {
    result = result.filter((r) => r.courseId === courseId)
  }
  if (studentId && typeof studentId === 'string') {
    result = result.filter((r) => r.studentId === studentId)
  }

  const joined = result.map((r) => {
    const student = data.students.find((s) => s.id === r.studentId)
    const equipment = data.equipment.find((e) => e.id === r.equipmentId)
    const course = r.courseId ? data.courses.find((c) => c.id === r.courseId) : undefined
    const coach = course ? data.coaches.find((ch) => ch.id === course.coachId) : undefined
    return {
      ...r,
      studentName: student?.name,
      equipmentCode: equipment?.code,
      equipmentName: equipment?.name,
      courseName: course ? `${coach?.name || ''} ${course.date} ${course.startTime}-${course.endTime}` : undefined,
      status: r.abnormal ? 'abnormal' : r.status,
    }
  })

  res.json({ success: true, data: joined })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status } = req.body
  if (!status) {
    res.status(400).json({ success: false, error: 'status is required' })
    return
  }

  const validStatuses = ['available', 'rented', 'maintenance']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `status must be one of: ${validStatuses.join(', ')}` })
    return
  }

  const data = readData()
  const equipment = data.equipment.find((e) => e.id === id)
  if (!equipment) {
    res.status(404).json({ success: false, error: 'Equipment not found' })
    return
  }

  equipment.status = status
  writeData(data)

  res.json({ success: true, data: equipment })
})

export default router
