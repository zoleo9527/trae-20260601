import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/login', (req, res) => {
  const { name, password } = req.body
  const db = getDb()

  const user = db.prepare('SELECT * FROM users WHERE name = ? AND password = ?').get(name, password)
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, name: user.name })).toString('base64')

  res.json({ user: { id: user.id, name: user.name, role: user.role }, token })
})

router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }

  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString())
    const db = getDb()
    const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(payload.id)
    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'token 无效' })
  }
})

router.get('/users', (req, res) => {
  const db = getDb()
  const users = db.prepare('SELECT id, name, role FROM users ORDER BY role, id').all()
  res.json({ users })
})

export default router
