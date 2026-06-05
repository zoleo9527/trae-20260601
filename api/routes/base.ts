import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/courses', (_req: Request, res: Response) => {
  const courses = db.prepare('SELECT * FROM courses').all()
  res.json({ success: true, data: courses })
})

router.get('/belayers', (_req: Request, res: Response) => {
  const belayers = db.prepare('SELECT * FROM belayers').all()
  res.json({ success: true, data: belayers })
})

router.get('/equipment-types', (_req: Request, res: Response) => {
  const types = db.prepare('SELECT DISTINCT equipment_type FROM equipment_issuances').all()
  res.json({ success: true, data: types.map((t: any) => t.equipment_type) })
})

export default router
