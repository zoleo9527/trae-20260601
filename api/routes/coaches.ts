import { Router, type Request, type Response } from 'express'
import { readData, getToday } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const data = readData()
  const today = getToday()
  const todayCourses = data.courses.filter((c) => c.date === today && c.status !== 'cancelled')

  const result = data.coaches.map((coach) => {
    const coachTodayCourses = todayCourses.filter((c) => c.coachId === coach.id)
    let status: 'on_duty' | 'off_duty' | 'on_course' = 'off_duty'
    if (coachTodayCourses.some((c) => c.status === 'in_progress')) {
      status = 'on_course'
    } else if (coachTodayCourses.length > 0) {
      status = 'on_duty'
    }
    return { ...coach, status }
  })

  res.json({ success: true, data: result })
})

export default router
