import express from 'express'
import cors from 'cors'
import { initDatabase, insertSampleData, db, validateStatusTransition, getOrderById, getSparePartById } from './database.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(join(__dirname, '../uploads')))

const uploadsDir = join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const USER_MAP: Record<string, string> = {
  'tech-001': '维修师-刘强',
  'tech-002': '维修师-陈刚',
  'mgr-001': '店长-张伟',
  'front-001': '前台-王芳',
  'front-002': '前台-李明'
}

const getUserName = (userId: string): string => {
  return USER_MAP[userId] || `用户-${userId}`
}

const generateSampleImages = () => {
  const sampleImages = [
    { filename: 'ORD-001-1.svg', text: 'iPhone 15 Pro 屏幕竖线问题', color: '87CEEB' },
    { filename: 'ORD-001-2.svg', text: '设备外观良好', color: '98FB98' },
    { filename: 'ORD-002-1.svg', text: '华为电池鼓包检测', color: 'FFB6C1' },
    { filename: 'ORD-004-1.svg', text: 'OPPO充电接口氧化', color: 'DDA0DD' }
  ]
  
  sampleImages.forEach(img => {
    const filePath = join(uploadsDir, img.filename)
    if (!fs.existsSync(filePath)) {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#${img.color}"/>
  <rect x="20" y="20" width="360" height="300" fill="white" rx="10"/>
  <text x="200" y="170" text-anchor="middle" font-size="24" fill="#333" font-family="Arial">质检照片</text>
  <text x="200" y="210" text-anchor="middle" font-size="16" fill="#666" font-family="Arial">${img.text}</text>
  <rect x="20" y="340" width="360" height="40" fill="#333" rx="0 0 10 10"/>
  <text x="200" y="367" text-anchor="middle" font-size="14" fill="white" font-family="Arial">Sample Image</text>
</svg>`
      const buffer = Buffer.from(svgContent, 'utf-8')
      fs.writeFileSync(filePath, buffer)
    }
  })
}
generateSampleImages()

const saveBase64Image = (base64Data: string, orderId: string, index: number): string => {
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 image')
  }
  
  const ext = matches[1]
  const imageData = matches[2]
  const filename = `${orderId}-${Date.now()}-${index}.${ext}`
  const filePath = join(uploadsDir, filename)
  
  fs.writeFileSync(filePath, imageData, { encoding: 'base64' })
  return `/uploads/${filename}`
}

const addNote = (orderId: string, userId: string, userName: string, content: string) => {
  const noteId = `NT-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  db.prepare('INSERT INTO notes (id, order_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(noteId, orderId, userId, userName, content, now)
}

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
    const usages = db.prepare('SELECT * FROM spare_part_usages WHERE order_id = ?').all(id)
    res.json({
      ...order,
      notes,
      inspection,
      warranty,
      photos,
      usages
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
    const order = getOrderById(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    const validation = validateStatusTransition(order.status, status)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message })
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id)
    
    const statusLabels: Record<string, string> = {
      inspection_pending: '接单',
      warranty_pending: '提交质检报告',
      repairing: '确认售后保修',
      completed: '完成维修'
    }
    addNote(id, 'system', '系统', `【系统自动】工单状态变更：${statusLabels[status] || status}`)
    
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    res.json(updatedOrder)
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
  const { technician_id, appearance_condition, screen_condition, battery_condition, accessories, description, photos } = req.body
  const inspectId = `INS-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  if (!technician_id) {
    return res.status(400).json({ error: '缺少维修师ID' })
  }

  const technician_name = getUserName(technician_id)

  try {
    const order = getOrderById(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const validation = validateStatusTransition(order.status, 'warranty_pending')
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message })
    }

    const existing = db.prepare('SELECT * FROM inspections WHERE order_id = ?').get(id)
    if (existing) {
      db.prepare(
        'UPDATE inspections SET technician_id = ?, technician_name = ?, appearance_condition = ?, screen_condition = ?, battery_condition = ?, accessories = ?, description = ?, status = ?, created_at = ? WHERE order_id = ?'
      ).run(technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, 'approved', now, id)
    } else {
      db.prepare(
        'INSERT INTO inspections (id, order_id, technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(inspectId, id, technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, 'approved', now)
    }
    
    if (photos && Array.isArray(photos)) {
      photos.forEach((photo: { base64: string; description: string }, index: number) => {
        const filePath = saveBase64Image(photo.base64, id, index)
        const photoId = `PH-${String(Date.now()).slice(-3)}-${index}`
        db.prepare('INSERT INTO inspection_photos (id, order_id, file_path, description, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(photoId, id, filePath, photo.description, now)
      })
    }
    
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('warranty_pending', now, id)
    
    const autoNoteContent = `【系统自动】提交质检报告：外观${appearance_condition}，屏幕${screen_condition}，电池${battery_condition}`
    addNote(id, technician_id, technician_name, autoNoteContent)
    
    const inspection = db.prepare('SELECT * FROM inspections WHERE order_id = ?').get(id)
    res.json(inspection)
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
  const { manager_id, warranty_type, warranty_period, responsibility } = req.body
  const warrantyId = `WAR-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  if (!manager_id) {
    return res.status(400).json({ error: '缺少店长ID' })
  }

  const manager_name = getUserName(manager_id)

  try {
    const order = getOrderById(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const validation = validateStatusTransition(order.status, 'repairing')
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message })
    }

    const existing = db.prepare('SELECT * FROM warranties WHERE order_id = ?').get(id)
    if (existing) {
      db.prepare(
        'UPDATE warranties SET manager_id = ?, manager_name = ?, warranty_type = ?, warranty_period = ?, responsibility = ?, approved = ?, approved_at = ? WHERE order_id = ?'
      ).run(manager_id, manager_name, warranty_type, warranty_period, responsibility, 1, now, id)
    } else {
      db.prepare(
        'INSERT INTO warranties (id, order_id, manager_id, manager_name, warranty_type, warranty_period, responsibility, approved, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(warrantyId, id, manager_id, manager_name, warranty_type, warranty_period, responsibility, 1, now, now)
    }
    
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('repairing', now, id)
    
    const autoNoteContent = `【系统自动】确认售后保修：${warranty_type}，${warranty_period}天，${responsibility}`
    addNote(id, manager_id, manager_name, autoNoteContent)
    
    const warranty = db.prepare('SELECT * FROM warranties WHERE order_id = ?').get(id)
    res.json(warranty)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders/:id/notes', (req, res) => {
  const { id } = req.params
  const { user_id, content } = req.body
  const noteId = `NT-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  if (!user_id) {
    return res.status(400).json({ error: '缺少用户ID' })
  }

  const user_name = getUserName(user_id)

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

app.post('/api/orders/:id/spare-parts', (req, res) => {
  const { id } = req.params
  const { spare_part_id, quantity, used_by } = req.body
  const usageId = `SU-${String(Date.now()).slice(-3)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  if (!used_by) {
    return res.status(400).json({ error: '缺少用户ID' })
  }

  const used_by_name = getUserName(used_by)

  try {
    const order = getOrderById(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.status !== 'repairing') {
      return res.status(400).json({ error: '只有维修中的工单才能领用备件' })
    }

    const part = getSparePartById(spare_part_id)
    if (!part) {
      return res.status(404).json({ error: '备件不存在' })
    }

    if (part.quantity < quantity) {
      return res.status(400).json({ error: `库存不足：${part.name} 当前库存 ${part.quantity}，需要 ${quantity}` })
    }

    const result = db.prepare(
      'INSERT INTO spare_part_usages (id, order_id, spare_part_id, quantity, used_by, used_by_name, used_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(usageId, id, spare_part_id, quantity, used_by, used_by_name, now)
    
    const noteContent = `领用备件：${part.name} x${quantity}`
    addNote(id, used_by, used_by_name, noteContent)
    
    res.json(result)
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