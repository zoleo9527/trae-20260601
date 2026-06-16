import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'
import { authMiddleware, AuthRequest } from '../middlewares/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  },
})

const router = Router()

router.post('/upload', authMiddleware, (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_001',
          message: err.message || '文件上传失败',
        },
      })
    }

    const { coupon_id } = req.body
    const file = req.file

    if (!file || !coupon_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_002',
          message: '文件或券ID不能为空',
        },
      })
    }

    const result = db.prepare(`
      INSERT INTO attachments (coupon_id, filename, file_path, file_type, file_size)
      VALUES (?, ?, ?, ?, ?)
    `).run(coupon_id, file.originalname, file.filename, file.mimetype, file.size)

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid)

    res.json({
      success: true,
      data: attachment,
    })
  })
})

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as any

  if (!attachment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  res.json({
    success: true,
    data: attachment,
  })
})

router.get('/:id/preview', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as any

  if (!attachment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '数据不存在',
      },
    })
  }

  const filePath = path.join(uploadDir, attachment.file_path)
  res.sendFile(filePath)
})

export default router
