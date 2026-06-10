import { Router } from 'express';
import { getDb } from '../db.js';
import path from 'path';

const router = Router();

router.post('/', (req, res) => {
  const db = getDb();
  const { target_type, target_id } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: '请选择文件' });
  if (!target_type || !target_id) return res.status(400).json({ error: '缺少目标类型或ID' });

  const userId = req.body.uploaded_by;
  if (!userId) return res.status(400).json({ error: '缺少上传者ID' });

  const r = db.prepare(`
    INSERT INTO attachments (target_type, target_id, filename, original_name, size, mime_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(target_type, target_id, file.filename, file.originalname, file.size, file.mimetype, userId);

  res.json({ id: r.lastInsertRowid, filename: file.filename, original_name: file.originalname });
});

router.get('/:targetType/:targetId', (req, res) => {
  const db = getDb();
  const attachments = db.prepare(`
    SELECT a.*, u.name as uploader_name
    FROM attachments a
    JOIN users u ON a.uploaded_by = u.id
    WHERE a.target_type = ? AND a.target_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.targetType, req.params.targetId);
  res.json({ attachments });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const att = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!att) return res.status(404).json({ error: '附件不存在' });

  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
