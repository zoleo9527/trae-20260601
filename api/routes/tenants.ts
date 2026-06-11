import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import type { Tenant } from '../types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const tenants = db.prepare('SELECT * FROM tenants ORDER BY id').all() as Tenant[]
  res.json({ success: true, data: tenants })
})

export default router
