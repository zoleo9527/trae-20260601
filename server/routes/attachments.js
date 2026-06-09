const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请上传文件' });

  const { entity_type, entity_id, uploaded_by } = req.body;
  if (!entity_type || !entity_id) return res.status(400).json({ error: '需要提供entity_type和entity_id' });

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const result = db.prepare(
    `INSERT INTO attachments (entity_type, entity_id, file_name, file_path, file_size, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(entity_type, entity_id, req.file.originalname, req.file.filename, req.file.size, uploaded_by || null, now);

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(attachment);
});

router.get('/:entityType/:entityId', (req, res) => {
  const { entityType, entityId } = req.params;
  const list = db.prepare(
    `SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY uploaded_at DESC`
  ).all(entityType, entityId);
  res.json(list);
});

router.delete('/:id', (req, res) => {
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!attachment) return res.status(404).json({ error: '附件不存在' });

  const filePath = path.join(uploadDir, attachment.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
  res.json({ message: '附件已删除' });
});

module.exports = router;
