import express from 'express'
import { Response } from 'express'
import fs from 'fs'
import path from 'path'
import { db } from '../database'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = express.Router()

const uploadDir = path.join(__dirname, '../../uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

router.post('/coupons/:coupon_id/attachments', authMiddleware, (req: AuthRequest, res: Response) => {
  const { coupon_id } = req.params
  const { filename, file_type, file_size, base64_content } = req.body

  if (!filename || !base64_content) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_001',
        message: '文件名和内容不能为空',
      },
    })
  }

  const coupon = db.prepare('SELECT id FROM coupons WHERE id = ?').get(coupon_id)
  if (!coupon) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '促销券不存在',
      },
    })
  }

  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const filePath = `${coupon_id}_${Date.now()}_${sanitizedFilename}`
  const fullPath = path.join(uploadDir, filePath)
  
  const fileData = Buffer.from(base64_content, 'base64')
  
  fs.writeFileSync(fullPath, fileData)
  
  const result = db.prepare(`
    INSERT INTO attachments (coupon_id, filename, file_path, file_type, file_size)
    VALUES (?, ?, ?, ?, ?)
  `).run(coupon_id, filename, filePath, file_type, file_size)

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      coupon_id: parseInt(coupon_id),
      filename,
      file_path: filePath,
      file_type,
      file_size,
    },
  })
})

router.get('/coupons/:coupon_id/attachments', authMiddleware, (req: AuthRequest, res: Response) => {
  const { coupon_id } = req.params

  const attachments = db.prepare(`
    SELECT * FROM attachments
    WHERE coupon_id = ?
    ORDER BY created_at DESC
  `).all(coupon_id)

  res.json({
    success: true,
    data: attachments,
  })
})

router.get('/attachments/:id/download', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as any

  if (!attachment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '附件不存在',
      },
    })
  }

  const fullPath = path.join(uploadDir, attachment.file_path)

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '文件不存在',
      },
    })
  }

  const fileData = fs.readFileSync(fullPath)

  res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`)
  res.setHeader('Content-Length', attachment.file_size)

  res.send(fileData)
})

router.delete('/attachments/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as any

  if (!attachment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUSINESS_002',
        message: '附件不存在',
      },
    })
  }

  const fullPath = path.join(uploadDir, attachment.file_path)
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }

  db.prepare('DELETE FROM attachments WHERE id = ?').run(id)

  res.json({
    success: true,
    message: '附件已删除',
  })
})

export default router