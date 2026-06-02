import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { role } = req.query
  let sql = 'SELECT * FROM employees WHERE 1=1'
  const params: string[] = []

  if (role) {
    sql += ' AND role = ?'
    params.push(role as string)
  }

  sql += ' ORDER BY id'
  const employees = db.prepare(sql).all(...params)
  res.json({ success: true, data: employees })
})

router.get('/technicians', (_req: Request, res: Response) => {
  const technicians = db.prepare("SELECT * FROM employees WHERE role = 'technician' ORDER BY id").all()
  res.json({ success: true, data: technicians })
})

router.get('/inspectors', (_req: Request, res: Response) => {
  const inspectors = db.prepare("SELECT * FROM employees WHERE role = 'inspector' ORDER BY id").all()
  res.json({ success: true, data: inspectors })
})

router.get('/:id', (req: Request, res: Response) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id)
  if (!employee) {
    return res.status(404).json({ success: false, error: '员工不存在' })
  }
  res.json({ success: true, data: employee })
})

export default router
