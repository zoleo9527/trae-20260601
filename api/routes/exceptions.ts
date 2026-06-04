import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/appointment/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { appointmentId } = req.params
  const exceptions = db.prepare('SELECT * FROM exceptions WHERE appointment_id = ? ORDER BY created_at DESC').all(appointmentId)

  exceptions.forEach((exc: any) => {
    exc.details = JSON.parse(exc.details)
  })

  res.json({ success: true, data: exceptions })
})

router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { id } = req.params
  const { status, resolveNote } = req.body
  const user = (req as any).user

  const exc = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id) as any
  if (!exc) {
    res.status(404).json({ success: false, error: '异常不存在' })
    return
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE exceptions SET status = ?, resolved_by = ?, resolved_at = ?, resolve_note = ? WHERE id = ?').run(
    status,
    status === 'resolved' ? user.userId : exc.resolved_by,
    status === 'resolved' ? now : exc.resolved_at,
    resolveNote || exc.resolve_note,
    id
  )

  const updated = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id) as any
  updated.details = JSON.parse(updated.details)

  res.json({ success: true, data: updated })
})

router.get('/open', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const exceptions = db.prepare(`
    SELECT e.*, a.patient_name
    FROM exceptions e
    JOIN appointments a ON e.appointment_id = a.id
    WHERE e.status IN ('open', 'processing')
    ORDER BY
      CASE e.severity
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      e.created_at DESC
  `).all()

  exceptions.forEach((exc: any) => {
    exc.details = JSON.parse(exc.details)
  })

  res.json({ success: true, data: exceptions })
})

export default router
