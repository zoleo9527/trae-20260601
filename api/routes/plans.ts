import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/appointment/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { appointmentId } = req.params
  const plans = db.prepare('SELECT * FROM plans WHERE appointment_id = ? ORDER BY created_at DESC').all(appointmentId)

  plans.forEach((plan: any) => {
    plan.items = JSON.parse(plan.items)
    plan.changeLog = JSON.parse(plan.change_log || '[]')
  })

  res.json({ success: true, data: plans })
})

router.patch('/:id/confirm', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const user = (req as any).user
  const { id } = req.params

  const now = new Date().toISOString()
  db.prepare('UPDATE plans SET status = ?, confirmed_by = ?, confirmed_at = ? WHERE id = ?').run(
    'confirmed', user.userId, now, id
  )

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id) as any
  plan.items = JSON.parse(plan.items)
  plan.changeLog = JSON.parse(plan.change_log || '[]')

  res.json({ success: true, data: plan })
})

router.post('/confirmation-step/:stepId', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const user = (req as any).user
  const { stepId } = req.params
  const { note } = req.body

  const step = db.prepare('SELECT * FROM plan_confirmation_steps WHERE id = ?').get(stepId) as any
  if (!step) {
    res.status(404).json({ success: false, error: '步骤不存在' })
    return
  }

  if (step.role !== user.role) {
    res.status(403).json({ success: false, error: '无权操作此步骤' })
    return
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE plan_confirmation_steps SET status = ?, completed_by = ?, completed_at = ?, note = ? WHERE id = ?').run(
    'completed', user.userId, now, note || null, stepId
  )

  const nextStep = db.prepare('SELECT * FROM plan_confirmation_steps WHERE appointment_id = ? AND step = ?').get(
    step.appointment_id, step.step + 1
  ) as any

  if (nextStep) {
    db.prepare('UPDATE plan_confirmation_steps SET status = ? WHERE id = ?').run('current', nextStep.id)
  }

  const allSteps = db.prepare('SELECT * FROM plan_confirmation_steps WHERE appointment_id = ? ORDER BY step ASC').all(step.appointment_id)
  const allCompleted = allSteps.every((s: any) => s.status === 'completed')

  if (allCompleted) {
    db.prepare("UPDATE appointments SET status = 'completed', updated_at = ? WHERE id = ?").run(now, step.appointment_id)
  }

  const updatedSteps = db.prepare('SELECT * FROM plan_confirmation_steps WHERE appointment_id = ? ORDER BY step ASC').all(step.appointment_id)
  res.json({ success: true, data: { steps: updatedSteps, allCompleted } })
})

export default router
