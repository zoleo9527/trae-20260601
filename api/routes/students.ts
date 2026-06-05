import { Router, type Request, type Response } from 'express'
import { readData } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const data = readData()
  const { level } = req.query
  let result = data.students
  if (level && typeof level === 'string') {
    result = result.filter((s) => s.level === level)
  }
  res.json({ success: true, data: result })
})

export default router
