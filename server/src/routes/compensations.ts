import express from 'express'
import { db } from '../database/db'
import type { Compensation } from '../types'

export const compensationRouter = express.Router()

compensationRouter.get('/', (req, res) => {
  const complaintId = req.query.complaintId as string | undefined
  const isAbnormal = req.query.isAbnormal as string | undefined
  
  let query = 'SELECT * FROM compensations'
  const params: any[] = []

  if (complaintId) {
    query += ' WHERE complaintId = ?'
    params.push(complaintId)
  }

  if (isAbnormal) {
    query += complaintId ? ' AND' : ' WHERE'
    query += ' isAbnormal = ?'
    params.push(isAbnormal === 'true' ? 1 : 0)
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const compensations: Compensation[] = rows.map((row: any) => ({
      id: row.id,
      complaintId: row.complaintId,
      type: row.type,
      amount: row.amount,
      description: row.description,
      authorizedBy: row.authorizedBy,
      authorizedAt: row.authorizedAt,
      verifiedBy: row.verifiedBy || undefined,
      verifiedAt: row.verifiedAt || undefined,
      isAbnormal: row.isAbnormal === 1,
      abnormalReason: row.abnormalReason || undefined
    }))

    res.json(compensations)
  })
})

compensationRouter.post('/', (req, res) => {
  const { complaintId, type, amount, description, authorizedBy, isAbnormal, abnormalReason } = req.body
  
  const id = `K${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const query = `
    INSERT INTO compensations (id, complaintId, type, amount, description, authorizedBy, authorizedAt, isAbnormal, abnormalReason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  db.run(query, [id, complaintId, type, amount, description, authorizedBy, now, isAbnormal ? 1 : 0, abnormalReason || null], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    db.run('UPDATE complaints SET status = ?, updatedAt = ? WHERE id = ?', ['compensated', now, complaintId])

    res.status(201).json({
      id,
      complaintId,
      type,
      amount,
      description,
      authorizedBy,
      authorizedAt: now,
      isAbnormal,
      abnormalReason
    })
  })
})

compensationRouter.put('/:id/verify', (req, res) => {
  const { id } = req.params
  const { verifiedBy } = req.body
  
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  db.run('UPDATE compensations SET verifiedBy = ?, verifiedAt = ? WHERE id = ?', [verifiedBy, now, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '核销记录不存在' })
    }

    res.json({ id, verifiedBy, verifiedAt: now })
  })
})