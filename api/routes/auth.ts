import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/employees', (_req: Request, res: Response) => {
  const employees = db.prepare('SELECT * FROM employees ORDER BY id').all()
  res.json({ success: true, data: employees })
})

router.post('/register', async (req: Request, res: Response): Promise<void> => {
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
})

export default router
