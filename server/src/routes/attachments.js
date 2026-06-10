const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { logAudit } = require('../utils');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', (req, res) => {
  const { biz_type, biz_id } = req.query;
  let sql = 'SELECT * FROM attachments WHERE 1=1';
  const params = [];

  if (biz_type && biz_id) {
    sql += ' AND biz_type = ? AND biz_id = ?';
    params.push(biz_type, biz_id);
  }

  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/upload', upload.single('file'), (req, res) => {
  const { biz_type, biz_id } = req.body;

  if (!biz_type || !biz_id) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: '缺少业务类型或业务ID' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '未接收到文件' });
  }

  const stmt = db.prepare(`
    INSERT INTO attachments (biz_type, biz_id, file_name, file_path, file_size, file_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    biz_type,
    parseInt(biz_id),
    req.file.originalname,
    req.file.filename,
    req.file.size,
    req.file.mimetype,
    req.currentUser.id
  );

  logAudit(biz_type, parseInt(biz_id), '上传附件', req.currentUser, `上传附件：${req.file.originalname}`);

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(attachment);
});

router.post('/placeholder', (req, res) => {
  const { biz_type, biz_id, file_name, file_type, file_size, remark } = req.body;

  if (!biz_type || !biz_id || !file_name) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const stmt = db.prepare(`
    INSERT INTO attachments (biz_type, biz_id, file_name, file_path, file_size, file_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    biz_type,
    parseInt(biz_id),
    file_name,
    '',
    file_size || 0,
    file_type || 'placeholder',
    req.currentUser.id
  );

  logAudit(biz_type, parseInt(biz_id), '添加附件占位', req.currentUser, `附件占位：${file_name}`);

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(attachment);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
  if (!attachment) {
    return res.status(404).json({ error: '附件不存在' });
  }

  if (attachment.file_path) {
    const filePath = path.join(uploadDir, attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
  logAudit(attachment.biz_type, attachment.biz_id, '删除附件', req.currentUser, `删除附件：${attachment.file_name}`);

  res.json({ message: '删除成功' });
});

module.exports = router;
