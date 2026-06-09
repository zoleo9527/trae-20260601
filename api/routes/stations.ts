import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const stations = db.prepare(`
      SELECT st.id, st.name, st.manager_id, s.name AS manager_name
      FROM stations st
      LEFT JOIN staff s ON st.manager_id = s.id
    `).all()
    res.json({ success: true, data: stations })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
