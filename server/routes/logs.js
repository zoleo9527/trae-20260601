import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }
  try {
    req.user = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString())
    next()
  } catch {
    res.status(401).json({ error: 'token 无效' })
  }
}

router.use(authMiddleware)

router.get('/', (req, res) => {
  const db = getDb()
  const { entity_type, entity_id, entity_code } = req.query

  const conditions = []
  const params = []

  if (entity_type) {
    conditions.push('entity_type = ?')
    params.push(entity_type)
  }
  if (entity_id) {
    conditions.push('entity_id = ?')
    params.push(entity_id)
  }
  if (entity_code) {
    conditions.push('entity_code LIKE ?')
    params.push(`%${entity_code}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const logs = db.prepare(`
    SELECT * FROM status_logs ${whereClause} ORDER BY created_at DESC LIMIT 200
  `).all(...params)

  res.json({ logs })
})

router.get('/timeline/:entity_type/:entity_id', (req, res) => {
  const db = getDb()
  const { entity_type, entity_id } = req.params

  const logs = db.prepare(`
    SELECT * FROM status_logs
    WHERE entity_type = ? AND entity_id = ?
    ORDER BY created_at ASC
  `).all(entity_type, entity_id)

  res.json({ logs })
})

export default router
