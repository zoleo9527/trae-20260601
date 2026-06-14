const express = require('express');
const cors = require('cors');
const { initDatabase, saveDatabase, prepareResult, prepareOne, getLastInsertId } = require('./database');

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
    version_status_options: ['pending', 'in_review', 'approved', 'rejected'],
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
  const result = db.exec('SELECT * FROM manuscripts WHERE id = ?', [parseInt(req.params.id)]);
  const manuscript = prepareOne(result);
  
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }
  
  const versionsResult = db.exec('SELECT * FROM versions WHERE manuscript_id = ? ORDER BY upload_time DESC', [parseInt(req.params.id)]);
  const versions = prepareResult(versionsResult);
  
  const deliveriesResult = db.exec('SELECT dr.*, v.version_number, v.file_name FROM delivery_records dr LEFT JOIN versions v ON dr.version_id = v.id WHERE dr.manuscript_id = ? ORDER BY dr.delivery_time DESC', [parseInt(req.params.id)]);
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
  
  const id = getLastInsertId(db);
  const result = db.exec('SELECT * FROM manuscripts WHERE id = ?', [id]);
  const manuscript = prepareOne(result);
  res.status(201).json(manuscript);
});

app.put('/api/manuscripts/:id', (req, res) => {
  const { status, project_name, client_name } = req.body;
  
  let updates = [];
  let params = [];
  
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (project_name) {
    updates.push('project_name = ?');
    params.push(project_name);
  }
  if (client_name) {
    updates.push('client_name = ?');
    params.push(client_name);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(parseInt(req.params.id));
  
  db.run(`UPDATE manuscripts SET ${updates.join(', ')} WHERE id = ?`, params);
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM manuscripts WHERE id = ?', [parseInt(req.params.id)]);
  const manuscript = prepareOne(result);
  res.json(manuscript);
});

app.get('/api/versions', (req, res) => {
  const { manuscript_id, translator_id, is_final, review_status } = req.query;
  let sql = 'SELECT v.*, m.project_name, m.client_name FROM versions v LEFT JOIN manuscripts m ON v.manuscript_id = m.id WHERE 1=1';
  const params = [];
  
  if (manuscript_id) {
    sql += ' AND v.manuscript_id = ?';
    params.push(parseInt(manuscript_id));
  }
  if (translator_id) {
    sql += ' AND v.translator_id = ?';
    params.push(parseInt(translator_id));
  }
  if (is_final !== undefined) {
    sql += ' AND v.is_final = ?';
    params.push(is_final === 'true' ? 1 : 0);
  }
  if (review_status) {
    sql += ' AND v.review_status = ?';
    params.push(review_status);
  }
  
  sql += ' ORDER BY v.upload_time DESC';
  
  const result = db.exec(sql, params);
  const versions = prepareResult(result);
  res.json(versions);
});

app.get('/api/versions/:id', (req, res) => {
  const versionId = parseInt(req.params.id);
  const result = db.exec('SELECT v.*, m.project_name, m.client_name FROM versions v LEFT JOIN manuscripts m ON v.manuscript_id = m.id WHERE v.id = ?', [versionId]);
  const version = prepareOne(result);
  
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  
  const reviewCommentsResult = db.exec('SELECT * FROM review_comments WHERE version_id = ? ORDER BY created_at DESC', [versionId]);
  const reviewComments = prepareResult(reviewCommentsResult);
  
  const reworkRecordsResult = db.exec(`
    SELECT rr.*, v.version_number as rework_version_number, v.file_name as rework_file_name 
    FROM rework_records rr 
    LEFT JOIN versions v ON rr.rework_version_id = v.id 
    WHERE rr.version_id = ? 
    ORDER BY rr.created_at DESC
    LIMIT 1
  `, [versionId]);
  const reworkRecord = prepareOne(reworkRecordsResult);
  
  res.json({
    ...version,
    reviewComments,
    reworkRecord
  });
});

app.post('/api/versions', (req, res) => {
  const { manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes, review_status } = req.body;
  
  if (!manuscript_id || !version_number || !file_name || !translator_id || !translator_name) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  db.run(`
    INSERT INTO versions (manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes, review_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [manuscript_id, version_number, file_name, file_path, translator_id, translator_name, notes, review_status || 'pending']);
  
  saveDatabase(db);
  
  const id = getLastInsertId(db);
  const result = db.exec('SELECT * FROM versions WHERE id = ?', [id]);
  const version = prepareOne(result);
  res.status(201).json(version);
});

app.put('/api/versions/:id', (req, res) => {
  const { is_final, notes, review_status } = req.body;
  const versionId = parseInt(req.params.id);
  
  let updates = [];
  let params = [];
  
  if (is_final !== undefined) {
    updates.push('is_final = ?');
    params.push(is_final ? 1 : 0);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }
  if (review_status !== undefined) {
    updates.push('review_status = ?');
    params.push(review_status);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: '没有需要更新的字段' });
  }
  
  params.push(versionId);
  db.run(`UPDATE versions SET ${updates.join(', ')} WHERE id = ?`, params);
  saveDatabase(db);
  
  const result = db.exec('SELECT * FROM versions WHERE id = ?', [versionId]);
  const version = prepareOne(result);
  res.json(version);
});

app.post('/api/versions/:id/decide', (req, res) => {
  const { decision, reviewer_id, reviewer_name, rework_reason } = req.body;
  const versionId = parseInt(req.params.id);
  
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision 必须是 approved 或 rejected' });
  }
  
  const versionResult = db.exec('SELECT * FROM versions WHERE id = ?', [versionId]);
  const version = prepareOne(versionResult);
  
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  
  if (decision === 'approved') {
    db.run(`
      UPDATE rework_records 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
      WHERE version_id = ? AND status = 'pending'
    `, [versionId]);
    
    db.run(`
      UPDATE rework_records 
      SET status = 'completed', 
          rework_version_id = ?, 
          completed_at = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP
      WHERE version_id IN (
        SELECT id FROM versions 
        WHERE manuscript_id = ? AND review_status = 'rejected'
      ) AND status = 'pending'
    `, [versionId, version.manuscript_id]);
  } else if (decision === 'rejected') {
    if (!rework_reason) {
      return res.status(400).json({ error: '退回时必须提供 rework_reason' });
    }
    
    const pendingReworkResult = db.exec(`
      SELECT COUNT(*) as count 
      FROM rework_records 
      WHERE version_id = ? AND status = 'pending'
    `, [versionId]);
    const pendingCount = prepareOne(pendingReworkResult)?.count || 0;
    
    if (pendingCount === 0) {
      db.run(`
        INSERT INTO rework_records (version_id, reviewer_id, reviewer_name, rework_reason, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `, [versionId, reviewer_id, reviewer_name, rework_reason]);
    } else {
      db.run(`
        UPDATE rework_records 
        SET reviewer_id = ?, reviewer_name = ?, rework_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE version_id = ? AND status = 'pending'
      `, [reviewer_id, reviewer_name, rework_reason, versionId]);
    }
  }
  
  db.run('UPDATE versions SET review_status = ? WHERE id = ?', [decision, versionId]);
  saveDatabase(db);
  
  const updatedResult = db.exec(`
    SELECT v.*, m.project_name, m.client_name 
    FROM versions v 
    LEFT JOIN manuscripts m ON v.manuscript_id = m.id 
    WHERE v.id = ?
  `, [versionId]);
  const updatedVersion = prepareOne(updatedResult);
  
  const reworkRecordsResult = db.exec(`
    SELECT rr.*, rv.version_number as rework_version_number
    FROM rework_records rr 
    LEFT JOIN versions rv ON rr.rework_version_id = rv.id
    WHERE rr.version_id = ? 
    ORDER BY rr.created_at DESC
    LIMIT 1
  `, [versionId]);
  const latestReworkRecord = prepareOne(reworkRecordsResult);
  
  res.json({
    message: `版本已${decision === 'approved' ? '通过审校' : '被退回'}`,
    version: updatedVersion,
    rework_record: latestReworkRecord || null
  });
});

app.get('/api/review-comments', (req, res) => {
  const { version_id, comment_type, severity } = req.query;
  let sql = 'SELECT rc.*, v.version_number, v.manuscript_id FROM review_comments rc LEFT JOIN versions v ON rc.version_id = v.id WHERE 1=1';
  const params = [];
  
  if (version_id) {
    sql += ' AND rc.version_id = ?';
    params.push(parseInt(version_id));
  }
  if (comment_type) {
    sql += ' AND rc.comment_type = ?';
    params.push(comment_type);
  }
  if (severity) {
    sql += ' AND rc.severity = ?';
    params.push(severity);
  }
  
  sql += ' ORDER BY rc.created_at DESC';
  
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
  
  const id = getLastInsertId(db);
  const result = db.exec('SELECT * FROM review_comments WHERE id = ?', [id]);
  const comment = prepareOne(result);
  res.status(201).json(comment);
});

app.get('/api/rework-records', (req, res) => {
  const { version_id, status, manuscript_id } = req.query;
  let sql = `
    SELECT rr.*, v.version_number, v.manuscript_id, rv.version_number as rework_version_number, rv.file_name as rework_file_name
    FROM rework_records rr 
    LEFT JOIN versions v ON rr.version_id = v.id
    LEFT JOIN versions rv ON rr.rework_version_id = rv.id
    WHERE rr.id = (
      SELECT id FROM rework_records r2 
      WHERE r2.version_id = rr.version_id 
      ORDER BY r2.created_at DESC 
      LIMIT 1
    )
  `;
  const params = [];
  
  if (version_id) {
    sql += ' AND rr.version_id = ?';
    params.push(parseInt(version_id));
  }
  if (status) {
    sql += ' AND rr.status = ?';
    params.push(status);
  }
  if (manuscript_id) {
    sql += ' AND v.manuscript_id = ?';
    params.push(parseInt(manuscript_id));
  }
  
  sql += ' ORDER BY rr.created_at DESC';
  
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
  
  const id = getLastInsertId(db);
  const result = db.exec(`
    SELECT rr.*, v.version_number, v.manuscript_id
    FROM rework_records rr 
    LEFT JOIN versions v ON rr.version_id = v.id
    WHERE rr.id = ?
  `, [id]);
  const record = prepareOne(result);
  res.status(201).json(record);
});

app.put('/api/rework-records/:id', (req, res) => {
  const { status, rework_version_id } = req.body;
  const recordId = parseInt(req.params.id);
  
  const currentRecordResult = db.exec('SELECT * FROM rework_records WHERE id = ?', [recordId]);
  const currentRecord = prepareOne(currentRecordResult);
  
  if (!currentRecord) {
    return res.status(404).json({ error: '返工记录不存在' });
  }
  
  let completedAt = currentRecord.completed_at;
  if (status === 'completed' && !completedAt) {
    completedAt = new Date().toISOString();
    
    if (rework_version_id) {
      db.run(`
        UPDATE rework_records 
        SET status = 'completed', completed_at = ?, rework_version_id = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE version_id = ? AND status = 'pending' AND id != ?
      `, [completedAt, rework_version_id, currentRecord.version_id, recordId]);
    } else {
      db.run(`
        UPDATE rework_records 
        SET status = 'completed', completed_at = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE version_id = ? AND status = 'pending' AND id != ?
      `, [completedAt, currentRecord.version_id, recordId]);
    }
  }
  
  db.run('UPDATE rework_records SET status = ?, rework_version_id = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [status, rework_version_id, completedAt, recordId]);
  saveDatabase(db);
  
  const result = db.exec(`
    SELECT rr.*, v.version_number, v.manuscript_id, rv.version_number as rework_version_number, rv.file_name as rework_file_name
    FROM rework_records rr 
    LEFT JOIN versions v ON rr.version_id = v.id
    LEFT JOIN versions rv ON rr.rework_version_id = rv.id
    WHERE rr.id = ?
  `, [recordId]);
  const record = prepareOne(result);
  res.json(record);
});

app.get('/api/delivery-records', (req, res) => {
  const { manuscript_id, client_name, version_id } = req.query;
  let sql = `
    SELECT dr.*, v.version_number, v.file_name, v.review_status, m.project_name
    FROM delivery_records dr
    LEFT JOIN versions v ON dr.version_id = v.id
    LEFT JOIN manuscripts m ON dr.manuscript_id = m.id
    WHERE 1=1
  `;
  const params = [];
  
  if (manuscript_id) {
    sql += ' AND dr.manuscript_id = ?';
    params.push(parseInt(manuscript_id));
  }
  if (client_name) {
    sql += ' AND dr.client_name LIKE ?';
    params.push(`%${client_name}%`);
  }
  if (version_id) {
    sql += ' AND dr.version_id = ?';
    params.push(parseInt(version_id));
  }
  
  sql += ' ORDER BY dr.delivery_time DESC';
  
  const result = db.exec(sql, params);
  const records = prepareResult(result);
  res.json(records);
});

app.get('/api/delivery-records/:id', (req, res) => {
  const recordId = parseInt(req.params.id);
  const result = db.exec(`
    SELECT dr.*, v.version_number, v.file_name, v.review_status, v.translator_name, m.project_name
    FROM delivery_records dr
    LEFT JOIN versions v ON dr.version_id = v.id
    LEFT JOIN manuscripts m ON dr.manuscript_id = m.id
    WHERE dr.id = ?
  `, [recordId]);
  const record = prepareOne(result);
  
  if (!record) {
    return res.status(404).json({ error: '交付记录不存在' });
  }
  
  res.json(record);
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
  
  const id = getLastInsertId(db);
  const result = db.exec(`
    SELECT dr.*, v.version_number, v.file_name, v.review_status, m.project_name
    FROM delivery_records dr
    LEFT JOIN versions v ON dr.version_id = v.id
    LEFT JOIN manuscripts m ON dr.manuscript_id = m.id
    WHERE dr.id = ?
  `, [id]);
  const record = prepareOne(result);
  res.status(201).json(record);
});

app.put('/api/delivery-records/:id', (req, res) => {
  const { client_feedback } = req.body;
  const recordId = parseInt(req.params.id);
  
  const feedbackTime = client_feedback ? new Date().toISOString() : null;
  
  db.run('UPDATE delivery_records SET client_feedback = ?, feedback_time = ? WHERE id = ?', 
    [client_feedback, feedbackTime, recordId]);
  saveDatabase(db);
  
  const result = db.exec(`
    SELECT dr.*, v.version_number, v.file_name, v.review_status, m.project_name
    FROM delivery_records dr
    LEFT JOIN versions v ON dr.version_id = v.id
    LEFT JOIN manuscripts m ON dr.manuscript_id = m.id
    WHERE dr.id = ?
  `, [recordId]);
  const record = prepareOne(result);
  res.json(record);
});

app.get('/api/manuscripts/:id/history', (req, res) => {
  const manuscriptId = parseInt(req.params.id);
  const manuscriptResult = db.exec('SELECT * FROM manuscripts WHERE id = ?', [manuscriptId]);
  const manuscript = prepareOne(manuscriptResult);
  
  if (!manuscript) {
    return res.status(404).json({ error: '稿件不存在' });
  }
  
  const versionsResult = db.exec(`
    SELECT v.*, 
      (SELECT COUNT(*) FROM review_comments WHERE version_id = v.id) as comment_count,
      (SELECT COUNT(*) FROM rework_records WHERE version_id = v.id) as rework_count
    FROM versions v 
    WHERE v.manuscript_id = ? 
    ORDER BY v.upload_time ASC
  `, [manuscriptId]);
  const versions = prepareResult(versionsResult);
  
  const history = versions.map(version => {
    const versionId = version.id;
    
    const reviewCommentsResult = db.exec('SELECT * FROM review_comments WHERE version_id = ? ORDER BY created_at ASC', [versionId]);
    const reviewComments = prepareResult(reviewCommentsResult);
    
    const reworkRecordsResult = db.exec(`
      SELECT rr.*, rv.version_number as rework_version_number, rv.file_name as rework_file_name
      FROM rework_records rr 
      LEFT JOIN versions rv ON rr.rework_version_id = rv.id
      WHERE rr.version_id = ? 
      ORDER BY rr.created_at DESC
      LIMIT 1
    `, [versionId]);
    const reworkRecord = prepareOne(reworkRecordsResult);
    
    const deliveriesResult = db.exec(`
      SELECT dr.*, dr.client_feedback, dr.feedback_time
      FROM delivery_records dr
      WHERE dr.version_id = ?
    `, [versionId]);
    const deliveries = prepareResult(deliveriesResult);
    
    return {
      ...version,
      reviewComments,
      reworkRecord,
      deliveries
    };
  });
  
  const approvedVersionResult = db.exec(`
    SELECT v.*, m.project_name, m.client_name
    FROM versions v
    LEFT JOIN manuscripts m ON v.manuscript_id = m.id
    WHERE v.manuscript_id = ? AND v.review_status = 'approved' AND v.is_final = 1
    ORDER BY v.upload_time DESC
    LIMIT 1
  `, [manuscriptId]);
  const finalApprovedVersion = prepareOne(approvedVersionResult);
  
  const allDeliveriesResult = db.exec(`
    SELECT dr.*, v.version_number, v.review_status
    FROM delivery_records dr
    LEFT JOIN versions v ON dr.version_id = v.id
    WHERE dr.manuscript_id = ?
    ORDER BY dr.delivery_time DESC
  `, [manuscriptId]);
  const allDeliveries = prepareResult(allDeliveriesResult);
  
  res.json({
    manuscript,
    versionHistory: history,
    finalApprovedVersion,
    allDeliveries,
    summary: {
      totalVersions: versions.length,
      totalReworks: history.reduce((sum, v) => sum + (v.reworkRecord ? 1 : 0), 0),
      totalDeliveries: allDeliveries.length,
      hasApprovedVersion: !!finalApprovedVersion
    }
  });
});

startServer();