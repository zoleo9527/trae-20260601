import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const { role } = req.query as { role?: string }
    let sql = `
      SELECT s.id, s.name, s.role, s.station_id, st.name AS station_name
      FROM staff s
      LEFT JOIN stations st ON s.station_id = st.id
    `
    const params: any[] = []
    if (role) {
      sql += ' WHERE s.role = ?'
      params.push(role)
    }
    const staff = db.prepare(sql).all(...params)
    res.json({ success: true, data: staff })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/couriers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const staff = db.prepare(`
      SELECT s.id, s.name, s.role, s.station_id, st.name AS station_name
      FROM staff s
      LEFT JOIN stations st ON s.station_id = st.id
      WHERE s.role = 'courier'
    `).all()
    res.json({ success: true, data: staff })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/station-managers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const staff = db.prepare(`
      SELECT s.id, s.name, s.role, s.station_id, st.name AS station_name
      FROM staff s
      LEFT JOIN stations st ON s.station_id = st.id
      WHERE s.role = 'station_manager'
    `).all()
    res.json({ success: true, data: staff })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
