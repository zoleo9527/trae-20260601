import express from 'express';
import db from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.get('/request/:requestId', (req, res) => {
  const { requestId } = req.params;
  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE request_id = ? ORDER BY uploaded_at DESC
  `).all(requestId);
  res.json(attachments);
});

router.get('/reissue/:reissueId', (req, res) => {
  const { reissueId } = req.params;
  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE reissue_id = ? ORDER BY uploaded_at DESC
  `).all(reissueId);
  res.json(attachments);
});

router.post('/request/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { file_name, file_type, file_size, placeholder, uploaded_by } = req.body;

  if (!file_name) {
    res.status(400).json({ error: '文件名不能为空' });
    return;
  }

  const id = generateId();
  const filePath = placeholder ? null : `/uploads/${id}_${file_name}`;

  db.prepare(`
    INSERT INTO attachments (id, request_id, file_name, file_type, file_size, file_path, placeholder, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `).run(id, requestId, file_name, file_type || null, file_size || null, filePath, placeholder ? 1 : 0, uploaded_by || null);

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
  res.status(201).json(attachment);
});

router.post('/reissue/:reissueId', (req, res) => {
  const { reissueId } = req.params;
  const { file_name, file_type, file_size, placeholder, uploaded_by } = req.body;

  if (!file_name) {
    res.status(400).json({ error: '文件名不能为空' });
    return;
  }

  const id = generateId();
  const filePath = placeholder ? null : `/uploads/${id}_${file_name}`;

  db.prepare(`
    INSERT INTO attachments (id, reissue_id, file_name, file_type, file_size, file_path, placeholder, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `).run(id, reissueId, file_name, file_type || null, file_size || null, filePath, placeholder ? 1 : 0, uploaded_by || null);

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
  res.status(201).json(attachment);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
  
  if (!attachment) {
    res.status(404).json({ error: '附件不存在' });
    return;
  }

  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
