import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from '../db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = crypto.randomUUID() + ext
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG/PNG 格式图片'))
    }
  },
})

const router = Router()

router.post('/', upload.single('file'), (req: Request, res: Response): void => {
  const { entity_type, entity_id } = req.body

  if (!entity_type || !entity_id) {
    res.status(400).json({ success: false, error: '请提供关联实体信息' })
    return
  }

  if (!['inspection', 'anomaly'].includes(entity_type)) {
    res.status(400).json({ success: false, error: '无效的实体类型' })
    return
  }

  const count = db.prepare(
    'SELECT COUNT(*) as count FROM attachments WHERE entity_type = ? AND entity_id = ?'
  ).get(entity_type, Number(entity_id)) as { count: number }

  if (count.count >= 3) {
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    res.status(400).json({ success: false, error: '每条记录最多上传3张图片' })
    return
  }

  if (!req.file) {
    res.status(400).json({ success: false, error: '请选择文件' })
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const result = db.prepare(`
    INSERT INTO attachments (entity_type, entity_id, filename, original_name, size, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(entity_type, Number(entity_id), req.file.filename, req.file.originalname, req.file.size, now)

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      filename: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size,
    },
  })
})

export default router
