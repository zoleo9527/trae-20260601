import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import type { Role } from '../types.js'

const router = Router()

function getRoleInfo(): { role: Role; name: string } {
  const roleNames: Record<string, string> = { pm: '项目经理', captain: '施工队长', engineer: '售后工程师' }
  return { role: 'pm' as Role, name: roleNames['pm'] || '项目经理' }
}

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, project, date_from, date_to } = req.query

  let sql = `
    SELECT jt.*, p.name as project_name, p.location as project_location, p.status as project_status
    FROM joint_tests jt
    LEFT JOIN projects p ON jt.project_id = p.id
    WHERE 1=1
  `
  const params: any[] = []

  if (status) { sql += ' AND jt.status = ?'; params.push(status) }
  if (project) { sql += ' AND jt.project_id = ?'; params.push(project) }
  if (date_from) { sql += ' AND jt.planned_at >= ?'; params.push(date_from) }
  if (date_to) { sql += ' AND jt.planned_at <= ?'; params.push(date_to) }

  sql += ' ORDER BY jt.created_at DESC'
  const tests = db.prepare(sql).all(...params)
  const itemsStmt = db.prepare('SELECT * FROM test_items WHERE test_id = ? ORDER BY sort_order')
  const results = tests.map((t: any) => ({
    ...t,
    project: t.project_name ? { id: t.project_id, name: t.project_name, location: t.project_location, status: t.project_status } : null,
    items: itemsStmt.all(t.id),
  }))
  res.json({ success: true, data: results })
})
