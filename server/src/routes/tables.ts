import express from 'express'
import { db } from '../database/db'
import type { Table } from '../types'

export const tableRouter = express.Router()

tableRouter.get('/', (req, res) => {
  db.all('SELECT * FROM tables', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const tables: Table[] = rows.map((row: any) => ({
      id: row.id,
      number: row.number,
      area: row.area,
      capacity: row.capacity,
      status: row.status
    }))

    res.json(tables)
  })
})

tableRouter.get('/:id', (req, res) => {
  const { id } = req.params

  db.get('SELECT * FROM tables WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!row) {
      return res.status(404).json({ error: '桌台不存在' })
    }

    const table: Table = {
      id: row.id,
      number: row.number,
      area: row.area,
      capacity: row.capacity,
      status: row.status
    }

    res.json(table)
  })
})

tableRouter.post('/', (req, res) => {
  const { number, area, capacity, status } = req.body
  
  const id = `T${String(Date.now()).slice(-3)}`

  db.run('INSERT INTO tables (id, number, area, capacity, status) VALUES (?, ?, ?, ?, ?)', [id, number, area, capacity, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.status(201).json({ id, number, area, capacity, status })
  })
})

tableRouter.put('/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body

  db.run('UPDATE tables SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '桌台不存在' })
    }

    res.json({ id, status })
  })
})