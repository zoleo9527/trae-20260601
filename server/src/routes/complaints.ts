import express from 'express'
import { db } from '../database/db'
import type { Complaint, Compensation, Followup, ComplaintStatus } from '../types'

export const complaintRouter = express.Router()

complaintRouter.get('/', (req, res) => {
  const status = req.query.status as string | undefined
  
  let query = `
    SELECT c.*, 
           comp.id as comp_id, comp.type as comp_type, comp.amount as comp_amount, 
           comp.description as comp_description, comp.authorizedBy as comp_authorizedBy,
           comp.authorizedAt as comp_authorizedAt, comp.verifiedBy as comp_verifiedBy,
           comp.verifiedAt as comp_verifiedAt, comp.isAbnormal as comp_isAbnormal,
           comp.abnormalReason as comp_abnormalReason,
           f.followupBy, f.followupResult, f.followupNote, f.followupAt
    FROM complaints c
    LEFT JOIN compensations comp ON c.id = comp.complaintId
    LEFT JOIN followups f ON c.id = f.complaintId
  `
  
  if (status) {
    query += ` WHERE c.status = ?`
  }

  db.all(query, status ? [status] : [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    
    const complaints: (Complaint & { compensate?: Compensation; followup?: Followup })[] = rows.map((row: any) => {
      const complaint: Complaint = {
        id: row.id,
        tableNumber: row.tableNumber,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        complaintType: row.complaintType,
        complaintReason: row.complaintReason,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        managerName: row.managerName,
        tableArea: row.tableArea
      }

      if (row.comp_id) {
        complaint.compensate = {
          id: row.comp_id,
          complaintId: row.id,
          type: row.comp_type,
          amount: row.comp_amount,
          description: row.comp_description,
          authorizedBy: row.comp_authorizedBy,
          authorizedAt: row.comp_authorizedAt,
          verifiedBy: row.comp_verifiedBy || undefined,
          verifiedAt: row.comp_verifiedAt || undefined,
          isAbnormal: row.comp_isAbnormal === 1,
          abnormalReason: row.comp_abnormalReason || undefined
        }
      }

      if (row.followupBy) {
        complaint.followup = {
          followupBy: row.followupBy,
          followupResult: row.followupResult,
          followupNote: row.followupNote,
          followupAt: row.followupAt
        }
      }

      return complaint
    })

    res.json(complaints)
  })
})

complaintRouter.get('/:id', (req, res) => {
  const { id } = req.params
  
  const query = `
    SELECT c.*, 
           comp.id as comp_id, comp.type as comp_type, comp.amount as comp_amount, 
           comp.description as comp_description, comp.authorizedBy as comp_authorizedBy,
           comp.authorizedAt as comp_authorizedAt, comp.verifiedBy as comp_verifiedBy,
           comp.verifiedAt as comp_verifiedAt, comp.isAbnormal as comp_isAbnormal,
           comp.abnormalReason as comp_abnormalReason,
           f.followupBy, f.followupResult, f.followupNote, f.followupAt
    FROM complaints c
    LEFT JOIN compensations comp ON c.id = comp.complaintId
    LEFT JOIN followups f ON c.id = f.complaintId
    WHERE c.id = ?
  `

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    
    if (!row) {
      return res.status(404).json({ error: '投诉记录不存在' })
    }

    const complaint: Complaint & { compensate?: Compensation; followup?: Followup } = {
      id: row.id,
      tableNumber: row.tableNumber,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      complaintType: row.complaintType,
      complaintReason: row.complaintReason,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      managerName: row.managerName,
      tableArea: row.tableArea
    }

    if (row.comp_id) {
      complaint.compensate = {
        id: row.comp_id,
        complaintId: row.id,
        type: row.comp_type,
        amount: row.comp_amount,
        description: row.comp_description,
        authorizedBy: row.comp_authorizedBy,
        authorizedAt: row.comp_authorizedAt,
        verifiedBy: row.comp_verifiedBy || undefined,
        verifiedAt: row.comp_verifiedAt || undefined,
        isAbnormal: row.comp_isAbnormal === 1,
        abnormalReason: row.comp_abnormalReason || undefined
      }
    }

    if (row.followupBy) {
      complaint.followup = {
        followupBy: row.followupBy,
        followupResult: row.followupResult,
        followupNote: row.followupNote,
        followupAt: row.followupAt
      }
    }

    res.json(complaint)
  })
})

complaintRouter.post('/', (req, res) => {
  const { tableNumber, customerName, customerPhone, complaintType, complaintReason, managerName, tableArea } = req.body
  
  const id = `C${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const query = `
    INSERT INTO complaints (id, tableNumber, customerName, customerPhone, complaintType, complaintReason, status, createdAt, updatedAt, managerName, tableArea)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
  `

  db.run(query, [id, tableNumber, customerName, customerPhone, complaintType, complaintReason, now, now, managerName, tableArea], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.status(201).json({
      id,
      tableNumber,
      customerName,
      customerPhone,
      complaintType,
      complaintReason,
      status: 'pending' as ComplaintStatus,
      createdAt: now,
      updatedAt: now,
      managerName,
      tableArea
    })
  })
})

complaintRouter.put('/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  db.run('UPDATE complaints SET status = ?, updatedAt = ? WHERE id = ?', [status, now, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '投诉记录不存在' })
    }

    res.json({ id, status, updatedAt: now })
  })
})

complaintRouter.put('/:id/followup', (req, res) => {
  const { id } = req.params
  const { followupBy, followupResult, followupNote } = req.body
  
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  db.run(`
    INSERT OR REPLACE INTO followups (complaintId, followupBy, followupResult, followupNote, followupAt)
    VALUES (?, ?, ?, ?, ?)
  `, [id, followupBy, followupResult, followupNote, now], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const newStatus = followupResult === 'resolved' ? 'resolved' : 'followup'
    
    db.run('UPDATE complaints SET status = ?, updatedAt = ? WHERE id = ?', [newStatus, now, id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.json({ 
        id, 
        status: newStatus, 
        updatedAt: now,
        followup: {
          followupBy,
          followupResult,
          followupNote,
          followupAt: now
        }
      })
    })
  })
})

complaintRouter.delete('/:id', (req, res) => {
  const { id } = req.params

  db.run('DELETE FROM complaints WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '投诉记录不存在' })
    }

    res.json({ message: '投诉记录已删除' })
  })
})