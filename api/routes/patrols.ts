import { Router, type Request, type Response } from 'express'
import { readData } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const data = readData()
  res.json({ success: true, data: data.patrols })
})

export default router
