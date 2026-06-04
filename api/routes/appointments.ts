import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const appointments = db.prepare(`
    SELECT a.*,
      c.name as consultant_name,
      ast.name as assistant_name,
      svc.name as service_name
    FROM appointments a
    LEFT JOIN users c ON a.consultant_id = c.id
    LEFT JOIN users ast ON a.assistant_id = ast.id
    LEFT JOIN users svc ON a.service_id = svc.id
    ORDER BY a.appointment_time ASC
  `).all()

  appointments.forEach((apt: any) => {
    apt.tags = JSON.parse(apt.tags)
  })

  res.json({ success: true, data: appointments })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { id } = req.params

  const appointment = db.prepare(`
    SELECT a.*,
      c.name as consultant_name,
      ast.name as assistant_name,
      svc.name as service_name
    FROM appointments a
    LEFT JOIN users c ON a.consultant_id = c.id
    LEFT JOIN users ast ON a.assistant_id = ast.id
    LEFT JOIN users svc ON a.service_id = svc.id
    WHERE a.id = ?
  `).get(id) as any

  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }

  const exceptions = db.prepare('SELECT * FROM exceptions WHERE appointment_id = ? ORDER BY created_at DESC').all(id)
  const plans = db.prepare('SELECT * FROM plans WHERE appointment_id = ? ORDER BY created_at DESC').all(id)
  const notes = db.prepare('SELECT * FROM consultation_notes WHERE appointment_id = ? ORDER BY created_at DESC').all(id)
  const visitRecords = db.prepare('SELECT * FROM visit_records WHERE appointment_id = ? ORDER BY created_at DESC').all(id)
  const steps = db.prepare('SELECT * FROM plan_confirmation_steps WHERE appointment_id = ? ORDER BY step ASC').all(id)
  const installmentPlan = db.prepare('SELECT * FROM installment_plans WHERE appointment_id = ?').get(id) as any

  let installmentItems: any[] = []
  if (installmentPlan) {
    installmentItems = db.prepare('SELECT * FROM installment_items WHERE plan_id = ? ORDER BY period ASC').all(installmentPlan.id)
  }

  plans.forEach((plan: any) => {
    plan.items = JSON.parse(plan.items)
    plan.changeLog = JSON.parse(plan.change_log || '[]')
  })

  exceptions.forEach((exc: any) => {
    exc.details = JSON.parse(exc.details)
    exc.patient_name = appointment.patient_name
  })

  appointment.tags = JSON.parse(appointment.tags)

  res.json({
    success: true,
    data: {
      appointment,
      exceptions,
      plans,
      consultationNotes: notes,
      visitRecords,
      confirmationSteps: steps,
      installmentPlan: installmentPlan ? { ...installmentPlan, items: installmentItems } : null,
    },
  })
})

router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ['pending', 'in_consultation', 'plan_submitted', 'plan_confirmed', 'in_service', 'completed']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态' })
    return
  }

  db.prepare('UPDATE appointments SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, id)

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id)
  res.json({ success: true, data: appointment })
})

export default router
