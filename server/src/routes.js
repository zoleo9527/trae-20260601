import { getDb } from './db.js'
import { seed } from './seed.js'
import { randomUUID } from 'crypto'

export function registerRoutes(app) {
  const db = getDb()

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/staff', (_req, res) => {
    const rows = db.prepare('SELECT id, name, role FROM staff').all()
    res.json(rows)
  })

  app.post('/api/staff/login', (req, res) => {
    const { id, password } = req.body
    const row = db.prepare('SELECT id, name, role FROM staff WHERE id = ? AND password = ?').get(id, password)
    if (!row) return res.status(401).json({ error: '工号或密码错误' })
    res.json(row)
  })

  app.get('/api/items', (req, res) => {
    const { role, status, staff_id } = req.query
    let sql = 'SELECT * FROM lost_items WHERE 1=1'
    const params = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (role === 'supervisor') {
      sql += ' AND status IN (?, ?, ?)'
      params.push('registered', 'disputed', 'claimed')
    } else if (role === 'cleaner') {
      if (staff_id) {
        sql += ' AND found_by_role = ? AND found_by = (SELECT name FROM staff WHERE id = ?)'
        params.push('cleaner', staff_id)
      } else {
        sql += ' AND found_by_role = ?'
        params.push('cleaner')
      }
    } else if (role === 'engineer') {
      sql += ' AND (found_by_role = ? OR exception_type IS NOT NULL)'
      params.push('engineer')
    }

    sql += ' ORDER BY found_at DESC'
    const rows = db.prepare(sql).all(...params)
    res.json(rows)
  })

  app.get('/api/items/todos', (req, res) => {
    const { role, staff_id } = req.query
    const todos = []

    if (role === 'supervisor') {
      const pending = db.prepare(
        "SELECT COUNT(*) AS count FROM lost_items WHERE status = 'registered'"
      ).get()
      const disputed = db.prepare(
        "SELECT COUNT(*) AS count FROM lost_items WHERE status = 'disputed'"
      ).get()
      const claimed = db.prepare(
        "SELECT COUNT(*) AS count FROM lost_items WHERE status = 'claimed'"
      ).get()
      if (pending.count > 0) todos.push({ type: 'review', label: `待审核遗留物 ${pending.count} 条`, count: pending.count })
      if (disputed.count > 0) todos.push({ type: 'dispute', label: `争议处理 ${disputed.count} 条`, count: disputed.count })
      if (claimed.count > 0) todos.push({ type: 'verify_claim', label: `待确认认领 ${claimed.count} 条`, count: claimed.count })
    } else if (role === 'cleaner') {
      let name = ''
      if (staff_id) {
        const row = db.prepare('SELECT name FROM staff WHERE id = ?').get(staff_id)
        name = row?.name || ''
      }
      const sql = name
        ? "SELECT COUNT(*) AS count FROM lost_items WHERE found_by_role = 'cleaner' AND found_by = ? AND status = 'registered'"
        : "SELECT COUNT(*) AS count FROM lost_items WHERE found_by_role = 'cleaner' AND status = 'registered'"
      const handover = name ? db.prepare(sql).get(name) : db.prepare(sql).get()
      if (handover.count > 0) todos.push({ type: 'handover', label: `待交接物品 ${handover.count} 条`, count: handover.count })
    } else if (role === 'engineer') {
      const maintenance = db.prepare(
        "SELECT COUNT(*) AS count FROM lost_items WHERE found_by_role = 'engineer' AND status = 'registered'"
      ).get()
      const exception = db.prepare(
        "SELECT COUNT(*) AS count FROM lost_items WHERE exception_type IS NOT NULL AND status IN ('registered', 'disputed')"
      ).get()
      if (maintenance.count > 0) todos.push({ type: 'pickup', label: `待取走物品 ${maintenance.count} 条`, count: maintenance.count })
      if (exception.count > 0) todos.push({ type: 'exception', label: `异常待处理 ${exception.count} 条`, count: exception.count })
    }

    res.json(todos)
  })

  app.get('/api/items/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: '记录不存在' })
    res.json(row)
  })

  app.post('/api/items', (req, res) => {
    const id = `li-${randomUUID().slice(0, 8)}`
    const now = new Date().toISOString()
    const {
      room_number, item_name, item_description = '', category = '普通物品',
      found_by, found_by_role = 'cleaner', location_detail = '',
      storage_location = '客房中心',
      exception_type = null, exception_note = null,
    } = req.body

    if (!room_number || !item_name || !found_by) {
      return res.status(400).json({ error: '房间号、物品名称、发现人必填' })
    }

    db.prepare(`
      INSERT INTO lost_items (
        id, room_number, item_name, item_description, category,
        found_by, found_by_role, found_at, location_detail, storage_location,
        status, exception_type, exception_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', ?, ?)
    `).run(id, room_number, item_name, item_description, category,
      found_by, found_by_role, now, location_detail, storage_location,
      exception_type, exception_note)

    const row = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(id)
    res.status(201).json(row)
  })

  app.patch('/api/items/:id/claim', (req, res) => {
    const { claimant_name, claimant_id_type, claimant_id_number,
            contact_phone, verified_by, supplementary_notes } = req.body

    if (!claimant_name || !claimant_id_type || !claimant_id_number) {
      return res.status(400).json({ error: '认领人姓名、证件类型、证件号必填' })
    }

    const now = new Date().toISOString()
    const changes = db.prepare(`
      UPDATE lost_items SET
        status = 'claimed',
        claimant_name = ?, claimant_id_type = ?, claimant_id_number = ?,
        contact_phone = ?, claim_at = ?, verified_by = ?,
        supplementary_notes = COALESCE(?, supplementary_notes),
        updated_at = ?
      WHERE id = ?
    `).run(claimant_name, claimant_id_type, claimant_id_number,
       contact_phone || null, now, verified_by || null,
       supplementary_notes || null, now, req.params.id)

    if (changes.changes === 0) return res.status(404).json({ error: '记录不存在' })

    const row = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(req.params.id)
    res.json(row)
  })

  app.patch('/api/items/:id/handle', (req, res) => {
    const { return_reason, supplementary_notes, handled_by, new_status } = req.body

    const status = new_status || 'returned'
    const now = new Date().toISOString()
    const changes = db.prepare(`
      UPDATE lost_items SET
        status = ?,
        return_reason = COALESCE(?, return_reason),
        supplementary_notes = COALESCE(?, supplementary_notes),
        handled_by = ?, handled_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(status, return_reason || null, supplementary_notes || null,
       handled_by || null, now, now, req.params.id)

    if (changes.changes === 0) return res.status(404).json({ error: '记录不存在' })

    const row = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(req.params.id)
    res.json(row)
  })

  app.patch('/api/items/:id/exception', (req, res) => {
    const { exception_type, exception_note } = req.body
    if (!exception_type) return res.status(400).json({ error: '异常类型必填' })

    const now = new Date().toISOString()
    const changes = db.prepare(`
      UPDATE lost_items SET
        status = 'disputed',
        exception_type = ?, exception_note = COALESCE(?, exception_note),
        updated_at = ?
      WHERE id = ?
    `).run(exception_type, exception_note || null, now, req.params.id)

    if (changes.changes === 0) return res.status(404).json({ error: '记录不存在' })

    const row = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(req.params.id)
    res.json(row)
  })

  app.delete('/api/items/:id', (req, res) => {
    const changes = db.prepare('DELETE FROM lost_items WHERE id = ?').run(req.params.id)
    if (changes.changes === 0) return res.status(404).json({ error: '记录不存在' })
    res.json({ ok: true })
  })

  app.post('/api/reset', (_req, res) => {
    db.prepare('DELETE FROM lost_items').run()
    seed()
    res.json({ ok: true, message: '数据已重置' })
  })
}
