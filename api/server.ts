import express from 'express'
import cors from 'cors'
import { initDatabase, insertSampleData, db } from './database.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(join(__dirname, '../uploads')))

app.get('/api/orders', (req, res) => {
  const { status, search } = req.query
  let query = 'SELECT * FROM orders ORDER BY created_at DESC'
  let params: any[] = []

  if (status && status !== 'all') {
    query = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC'
    params = [status]
  } else if (search) {
    query = 'SELECT * FROM orders WHERE customer_name LIKE ? OR phone LIKE ? OR device_model LIKE ? ORDER BY created_at DESC'
    params = [`%${search}%`, `%${search}%`, `%${search}%`]
  }

  try {
    const rows = db.prepare(query).all(...params)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    const notes = db.prepare('SELECT * FROM notes WHERE order_id = ? ORDER BY created_at DESC').all(id)
    const inspection = db.prepare('SELECT * FROM inspections WHERE order_id = ?').get(id)
    const warranty = db.prepare('SELECT * FROM warranties WHERE order_id = ?').get(id)
    const photos = db.prepare('SELECT * FROM inspection_photos WHERE order_id = ?').all(id)
    res.json({
      ...order,
      notes,
      inspection,
      warranty,
      photos
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders', (req, res) => {
  const { customer_name, phone, device_model, serial_number, issue_description, created_by } = req.body
  const id = `ORD-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  try {
    db.prepare(
      'INSERT INTO orders (id, customer_name, phone, device_model, serial_number, issue_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, customer_name, phone, device_model, serial_number, issue_description, 'pending', created_by, now, now)
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    res.status(201).json(order)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  try {
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id)
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    res.json(order)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params

  try {
    db.prepare('DELETE FROM spare_part_usages WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM inspection_photos WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM notes WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM warranties WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM inspections WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM orders WHERE order_id = ?').run(id)
    res.json({ message: 'Order deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/orders/:id/inspection', (req, res) => {
  const { id } = req.params
  try {
    const inspection = db.prepare('SELECT * FROM inspections WHERE order_id = ?').get(id)
    res.json(inspection)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders/:id/inspection', (req, res) => {
  const { id } = req.params
  const { technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description } = req.body
  const inspectId = `INS-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  try {
    const existing = db.prepare('SELECT * FROM inspections WHERE order_id = ?').get(id)
    if (existing) {
      db.prepare(
        'UPDATE inspections SET technician_id = ?, technician_name = ?, appearance_condition = ?, screen_condition = ?, battery_condition = ?, accessories = ?, description = ?, status = ?, created_at = ? WHERE order_id = ?'
      ).run(technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, 'approved', now, id)
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('warranty_pending', now, id)
      const inspection = db.prepare('SELECT * FROM inspections WHERE order_id = ?').get(id)
      res.json(inspection)
    } else {
      db.prepare(
        'INSERT INTO inspections (id, order_id, technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(inspectId, id, technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, 'approved', now)
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('warranty_pending', now, id)
      const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspectId)
      res.status(201).json(inspection)
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/orders/:id/warranty', (req, res) => {
  const { id } = req.params
  try {
    const warranty = db.prepare('SELECT * FROM warranties WHERE order_id = ?').get(id)
    res.json(warranty)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders/:id/warranty', (req, res) => {
  const { id } = req.params
  const { manager_id, manager_name, warranty_type, warranty_period, responsibility } = req.body
  const warrantyId = `WAR-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  try {
    const existing = db.prepare('SELECT * FROM warranties WHERE order_id = ?').get(id)
    if (existing) {
      db.prepare(
        'UPDATE warranties SET manager_id = ?, manager_name = ?, warranty_type = ?, warranty_period = ?, responsibility = ?, approved = ?, approved_at = ? WHERE order_id = ?'
      ).run(manager_id, manager_name, warranty_type, warranty_period, responsibility, 1, now, id)
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('repairing', now, id)
      const warranty = db.prepare('SELECT * FROM warranties WHERE order_id = ?').get(id)
      res.json(warranty)
    } else {
      db.prepare(
        'INSERT INTO warranties (id, order_id, manager_id, manager_name, warranty_type, warranty_period, responsibility, approved, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(warrantyId, id, manager_id, manager_name, warranty_type, warranty_period, responsibility, 1, now, now)
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('repairing', now, id)
      const warranty = db.prepare('SELECT * FROM warranties WHERE id = ?').get(warrantyId)
      res.status(201).json(warranty)
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders/:id/notes', (req, res) => {
  const { id } = req.params
  const { user_id, user_name, content } = req.body
  const noteId = `NT-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  try {
    db.prepare(
      'INSERT INTO notes (id, order_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(noteId, id, user_id, user_name, content, now)
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId)
    res.status(201).json(note)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/spare-parts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM spare_parts ORDER BY name').all()
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/spare-parts', (req, res) => {
  const { name, sku, quantity, location } = req.body
  const id = `SP-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  try {
    db.prepare(
      'INSERT INTO spare_parts (id, name, sku, quantity, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, sku, quantity || 0, location, now, now)
    const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id)
    res.status(201).json(part)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/spare-parts/:id', (req, res) => {
  const { id } = req.params
  const { name, sku, quantity, location } = req.body
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  try {
    db.prepare('UPDATE spare_parts SET name = ?, sku = ?, quantity = ?, location = ?, updated_at = ? WHERE id = ?').run(name, sku, quantity, location, now, id)
    const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id)
    res.json(part)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/spare-parts/:id', (req, res) => {
  const { id } = req.params

  try {
    db.prepare('DELETE FROM spare_part_usages WHERE spare_part_id = ?').run(id)
    db.prepare('DELETE FROM spare_parts WHERE id = ?').run(id)
    res.json({ message: 'Spare part deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/reset', (req, res) => {
  insertSampleData().then(() => {
    res.json({ message: 'Data reset completed' })
  }).catch((err: any) => {
    res.status(500).json({ error: err.message })
  })
})

initDatabase()
setTimeout(() => {
  insertSampleData()
}, 500)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})