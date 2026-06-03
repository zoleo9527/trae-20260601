import { Router, type Request, type Response } from 'express'

const router = Router()

router.post('/login', (req: Request, res: Response): void => {
  const { role, name } = req.body
  if (!role || !name) {
    res.status(400).json({ success: false, error: 'Missing role or name' })
    return
  }
  res.json({ success: true, role, name })
})

export default router
