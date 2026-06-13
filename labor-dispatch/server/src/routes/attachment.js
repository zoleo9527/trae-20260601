import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }
    const decoded = jwt.verify(token, 'labor-dispatch-secret-key');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: '未授权' });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { entityType, entityId, statusHistoryId, attachmentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }

    const attachment = await req.prisma.attachment.create({
      data: {
        entityType,
        entityId,
        statusHistoryId: statusHistoryId || null,
        attachmentType: attachmentType || '其他',
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: req.userId
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(attachment);
  } catch (error) {
    console.error('上传附件错误:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { entityType, entityId, attachmentType, page = 1, pageSize = 50 } = req.query;

    const where = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (attachmentType) {
      where.attachmentType = attachmentType;
    }

    const [total, attachments] = await Promise.all([
      req.prisma.attachment.count({ where }),
      req.prisma.attachment.findMany({
        where,
        include: {
          uploadedBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize)
      })
    ]);

    res.json({
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      data: attachments
    });
  } catch (error) {
    console.error('获取附件列表错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await req.prisma.attachment.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(attachment);
  } catch (error) {
    console.error('获取附件详情错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await req.prisma.attachment.findUnique({ where: { id } });

    if (!attachment) {
      return res.status(404).json({ error: '未找到' });
    }

    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    await req.prisma.attachment.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除附件错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
