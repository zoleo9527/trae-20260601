const express = require('express');
const cors = require('cors');
const { initDatabase, saveDatabase, prepareResult, prepareOne } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

let db;

async function startServer() {
  db = await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`翻译审校系统 API 服务已启动: http://localhost:${PORT}`);
    console.log(`API 文档: http://localhost:${PORT}/`);
  });
}

app.get('/', (req, res) => {
  res.json({ 
    message: '翻译公司审校返工与版本交付管理系统 API',
    endpoints: {
      manuscripts: '/api/manuscripts',
      versions: '/api/versions',
      reviewComments: '/api/review-comments',
      reworkRecords: '/api/rework-records',
      deliveryRecords: '/api/delivery-records'
    }
  });
});

app.get('/api/manuscripts', (req, res) => {
  const { status, client_name } = req.query;
  let sql = 'SELECT * FROM manuscripts WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (client_name) {
    sql += ' AND client_name LIKE ?';
    params.push(`%${client_name}%`);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = db.exec(sql, params);
  const manuscripts = prepareResult(result);
  res.json(manuscripts);
});

app.get('/api/manuscripts/:id', (req, res) => {
  const result = db.exec('SELECT * FROM manuscripts WHERE id = ?', [req.params.id]);
  const manuscript = prepareOne(result);
  
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }
  
  const versionsResult = db.exec('SELECT * FROM versions WHERE manuscript_id = ? ORDER BY upload_time DESC', [req.params.id]);
  const versions = prepareResult(versionsResult);
  
  const deliveriesResult = db.exec('SELECT * FROM delivery_records WHERE manuscript_id = ? ORDER BY delivery_time DESC', [req.params.id]);
  const deliveries = prepareResult(deliveriesResult);
  
  res.json({
    ...manuscript,
    versions,
    deliveries
  });
});

app.post('/api/manuscripts', (req, res) => {
  const { project_name, client_name, source_language, target_language, word_count, deadline } = req.body;
  
  if (!project_name || !client_name || !source_language || !target_language || !word_count || !deadline) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  db.run(`
    INSERT INTO manuscripts (project_name, client_name, source_language, target_language, word_count, deadline)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [project_name, client_name, source_language, target_language, word_count, deadline]);
  
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM manuscripts WHERE id = (SELECT MAX(id) FROM manuscripts)');
  const manuscript = prepareOne(result);
  res.status(201).json(manuscript);
});

app.put('/api/manuscripts/:id', (req, res) => {
  const { status } = req.body;
  
  db.run('UPDATE manuscripts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM manuscripts WHERE id = ?', [req.params.id]);
  const manuscript = prepareOne(result);
  res.json(manuscript);
});

app.get('/api/versions', (req, res) => {
  const { manuscript_id, translator_id, is_final } = req.query;
  let sql = 'SELECT * FROM versions WHERE 1=1';
  const params = [];
  
  if (manuscript_id) {
    sql += ' AND manuscript_id = ?';
    params.push(manuscript_id);
  }
  if (translator_id) {
    sql += ' AND translator_id = ?';
    params.push(translator_id);
  }
  if (is_final !== undefined) {
    sql += ' AND is_final = ?';
    params.push(is_final === 'true' ? 1 : 0);
  }
  
  sql += ' ORDER BY upload_time DESC';
  
  const result = db.exec(sql, params);
  const versions = prepareResult(result);
  res.json(versions);
});

app.get('/api/versions/:id', (req, res) => {
  const result = db.exec('SELECT * FROM versions WHERE id = ?', [req.params.id]);
  const version = prepareOne(result);
  
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  
  const reviewCommentsResult = db.exec('SELECT * FROM review_comments WHERE version_id = ? ORDER BY created_at DESC', [req.params.id]);
  const reviewComments = prepareResult(reviewCommentsResult);
  
  const reworkRecordsResult = db.exec('SELECT * FROM rework_records WHERE version_id = ? ORDER BY created_at DESC', [req.params.id]);
  const reworkRecords = prepareResult(reworkRecordsResult);
  
  res.json({
    ...version,
    reviewComments,
    reworkRecords
  });
});

app.post('/api/versions', (req, res) => {
  const { manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes } = req.body;
  
  if (!manuscript_id || !version_number || !file_name || !translator_id || !translator_name) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  db.run(`
    INSERT INTO versions (manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes]);
  
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM versions WHERE id = (SELECT MAX(id) FROM versions)');
  const version = prepareOne(result);
  res.status(201).json(version);
});

app.put('/api/versions/:id', (req, res) => {
  const { is_final, notes } = req.body;
  
  db.run('UPDATE versions SET is_final = ?, notes = ? WHERE id = ?', [is_final ? 1 : 0, notes, req.params.id]);
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM versions WHERE id = ?', [req.params.id]);
  const version = prepareOne(result);
  res.json(version);
});

app.get('/api/review-comments', (req, res) => {
  const { version_id, comment_type, severity } = req.query;
  let sql = 'SELECT * FROM review_comments WHERE 1=1';
  const params = [];
  
  if (version_id) {
    sql += ' AND version_id = ?';
    params.push(version_id);
  }
  if (comment_type) {
    sql += ' AND comment_type = ?';
    params.push(comment_type);
  }
  if (severity) {
    sql += ' AND severity = ?';
    params.push(severity);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = db.exec(sql, params);
  const comments = prepareResult(result);
  res.json(comments);
});

app.post('/api/review-comments', (req, res) => {
  const { version_id, reviewer_id, reviewer_name, comment_type, position, original_text, suggested_text, comment_text, severity } = req.body;
  
  if (!version_id || !reviewer_id || !reviewer_name || !comment_type || !comment_text) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  db.run(`
    INSERT INTO review_comments (version_id, reviewer_id, reviewer_name, comment_type, position, original_text, suggested_text, comment_text, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [version_id, reviewer_id, reviewer_name, comment_type, position, original_text, suggested_text, comment_text, severity || 'normal']);
  
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM review_comments WHERE id = (SELECT MAX(id) FROM review_comments)');
  const comment = prepareOne(result);
  res.status(201).json(comment);
});

app.get('/api/rework-records', (req, res) => {
  const { version_id, status } = req.query;
  let sql = 'SELECT * FROM rework_records WHERE 1=1';
  const params = [];
  
  if (version_id) {
    sql += ' AND version_id = ?';
    params.push(version_id);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = db.exec(sql, params);
  const records = prepareResult(result);
  res.json(records);
});

app.post('/api/rework-records', (req, res) => {
  const { version_id, reviewer_id, reviewer_name, rework_reason } = req.body;
  
  if (!version_id || !reviewer_id || !reviewer_name || !rework_reason) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  db.run(`
    INSERT INTO rework_records (version_id, reviewer_id, reviewer_name, rework_reason)
    VALUES (?, ?, ?, ?)
  `, [version_id, reviewer_id, reviewer_name, rework_reason]);
  
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM rework_records WHERE id = (SELECT MAX(id) FROM rework_records)');
  const record = prepareOne(result);
  res.status(201).json(record);
});

app.put('/api/rework-records/:id', (req, res) => {
  const { status, rework_version_id } = req.body;
  
  let completedAt = null;
  if (status === 'completed') {
    completedAt = new Date().toISOString();
  }
  
  db.run('UPDATE rework_records SET status = ?, rework_version_id = ?, completed_at = ? WHERE id = ?', [status, rework_version_id, completedAt, req.params.id]);
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM rework_records WHERE id = ?', [req.params.id]);
  const record = prepareOne(result);
  res.json(record);
});

app.get('/api/delivery-records', (req, res) => {
  const { manuscript_id, client_name } = req.query;
  let sql = 'SELECT * FROM delivery_records WHERE 1=1';
  const params = [];
  
  if (manuscript_id) {
    sql += ' AND manuscript_id = ?';
    params.push(manuscript_id);
  }
  if (client_name) {
    sql += ' AND client_name LIKE ?';
    params.push(`%${client_name}%`);
  }
  
  sql += ' ORDER BY delivery_time DESC';
  
  const result = db.exec(sql, params);
  const records = prepareResult(result);
  res.json(records);
});

app.get('/api/delivery-records/:id', (req, res) => {
  const result = db.exec('SELECT * FROM delivery_records WHERE id = ?', [req.params.id]);
  const record = prepareOne(result);
  
  if (!record) {
    return res.status(404).json({ error: '交付记录不存在' });
  }
  
  const versionResult = db.exec('SELECT * FROM versions WHERE id = ?', [record.version_id]);
  const version = prepareOne(versionResult);
  
  const manuscriptResult = db.exec('SELECT * FROM manuscripts WHERE id = ?', [record.manuscript_id]);
  const manuscript = prepareOne(manuscriptResult);
  
  res.json({
    ...record,
    version,
    manuscript
  });
});

app.post('/api/delivery-records', (req, res) => {
  const { manuscript_id, version_id, client_name, delivery_method, recipient, notes } = req.body;
  
  if (!manuscript_id || !version_id || !client_name) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  db.run(`
    INSERT INTO delivery_records (manuscript_id, version_id, client_name, delivery_method, recipient, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [manuscript_id, version_id, client_name, delivery_method, recipient, notes]);
  
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM delivery_records WHERE id = (SELECT MAX(id) FROM delivery_records)');
  const record = prepareOne(result);
  res.status(201).json(record);
});

app.put('/api/delivery-records/:id', (req, res) => {
  const { client_feedback } = req.body;
  
  const feedbackTime = client_feedback ? new Date().toISOString() : null;
  
  db.run('UPDATE delivery_records SET client_feedback = ?, feedback_time = ? WHERE id = ?', [client_feedback, feedbackTime, req.params.id]);
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM delivery_records WHERE id = ?', [req.params.id]);
  const record = prepareOne(result);
  res.json(record);
});

app.get('/api/manuscripts/:id/history', (req, res) => {
  const result = db.exec('SELECT * FROM manuscripts WHERE id = ?', [req.params.id]);
  const manuscript = prepareOne(result);
  
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }
  
  const versionsResult = db.exec('SELECT * FROM versions WHERE manuscript_id = ? ORDER BY upload_time ASC', [req.params.id]);
  const versions = prepareResult(versionsResult);
  
  const history = versions.map(version => {
    const reviewCommentsResult = db.exec('SELECT * FROM review_comments WHERE version_id = ?', [version.id]);
    const reviewComments = prepareResult(reviewCommentsResult);
    
    const reworkRecordsResult = db.exec('SELECT * FROM rework_records WHERE version_id = ?', [version.id]);
    const reworkRecords = prepareResult(reworkRecordsResult);
    
    const deliveriesResult = db.exec('SELECT * FROM delivery_records WHERE version_id = ?', [version.id]);
    const deliveries = prepareResult(deliveriesResult);
    
    return {
      ...version,
      reviewComments,
      reworkRecords,
      deliveries
    };
  });
  
  res.json({
    manuscript,
    history
  });
});

startServer();