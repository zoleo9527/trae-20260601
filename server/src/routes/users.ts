import express from 'express'
import { db } from '../database/db'
import type { User } from '../types'

export const userRouter = express.Router()

userRouter.get('/', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const users: User[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      phone: row.phone
    }))

    res.json(users)
  })
})

userRouter.get('/:id', (req, res) => {
  const { id } = req.params

  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!row) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const user: User = {
      id: row.id,
      name: row.name,
      role: row.role,
      phone: row.phone
    }

    res.json(user)
  })
})