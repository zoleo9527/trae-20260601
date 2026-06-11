import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const addLog = (refType, refId, operatorName, action, detail = null) => {
  db.prepare(`
    INSERT INTO operation_logs (ref_type, ref_id, operator_name, action, detail)
    VALUES (?, ?, ?, ?, ?)
  `).run(refType, refId, operatorName, action, detail);
};

// ========== 统计数据 ==========
app.get('/api/stats', (req, res) => {
  const role = req.query.role || 'ops_supervisor';
  const userName = req.query.userName || '';

  let pendingRectCount = 0;
  let pendingReviewCount = 0;
  let riskCount = 0;
  let myTaskCount = 0;

  const rects = db.prepare('SELECT * FROM inspection_rectifications').all();
  const reviews = db.prepare('SELECT * FROM close_store_reviews').all();

  pendingRectCount = rects.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
  pendingReviewCount = reviews.filter(r => r.status === 'pending').length;

  const now = new Date();
  riskCount = rects.filter(r => {
    if (r.status === 'completed') return false;
    const deadline = new Date(r.deadline);
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 2 || r.severity === '紧急';
  }).length;

  if (role === 'store_manager' && userName) {
    myTaskCount = rects.filter(r => r.handler_name === userName && r.status !== 'completed').length;
  } else if (role === 'ops_supervisor') {
    myTaskCount = pendingReviewCount + rects.filter(r => r.severity === '紧急' && r.status !== 'completed').length;
  } else if (role === 'leasing_manager') {
    myTaskCount = riskCount;
  }

  const recentLogs = db.prepare(`
    SELECT * FROM operation_logs
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  res.json({
    pendingRectCount,
    pendingReviewCount,
    riskCount,
    myTaskCount,
    recentLogs,
  });
});

// ========== 巡店整改单 ==========
app.get('/api/rectifications', (req, res) => {
  const { status, severity, storeName, role, userName } = req.query;
  let sql = 'SELECT * FROM inspection_rectifications WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (severity && severity !== 'all') {
    sql += ' AND severity = ?';
    params.push(severity);
  }
  if (storeName) {
    sql += ' AND store_name LIKE ?';
    params.push(`%${storeName}%`);
  }
  if (role === 'store_manager' && userName) {
    sql += ' AND handler_name = ?';
    params.push(userName);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.get('/api/rectifications/:id', (req, res) => {
  const id = req.params.id;
  const rect = db.prepare('SELECT * FROM inspection_rectifications WHERE id = ?').get(id);
  if (!rect) {
    return res.status(404).json({ error: '整改单不存在' });
  }

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE ref_type = 'rectification' AND ref_id = ?
    ORDER BY uploaded_at DESC
  `).all(id);

  const logs = db.prepare(`
    SELECT * FROM operation_logs WHERE ref_type = 'rectification' AND ref_id = ?
    ORDER BY created_at DESC
  `).all(id);

  const comments = db.prepare(`
    SELECT * FROM comments WHERE ref_type = 'rectification' AND ref_id = ?
    ORDER BY created_at DESC
  `).all(id);

  const review = db.prepare(`
    SELECT * FROM close_store_reviews WHERE rectification_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(id);

  res.json({ ...rect, attachments, logs, comments, review });
});

app.post('/api/rectifications', (req, res) => {
  const {
    store_id, store_name, brand, inspector_name, inspection_date,
    category, severity, title, description, requirement, deadline,
    handler_name
  } = req.body;

  const result = db.prepare(`
    INSERT INTO inspection_rectifications (
      store_id, store_name, brand, inspector_name, inspection_date,
      category, severity, title, description, requirement, deadline,
      status, handler_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    store_id, store_name, brand, inspector_name, inspection_date,
    category, severity, title, description, requirement, deadline,
    handler_name
  );

  const id = result.lastInsertRowid;
  addLog('rectification', id, inspector_name || '系统', 'create', '创建巡店整改单');

  res.status(201).json({ id });
});

app.put('/api/rectifications/:id/status', (req, res) => {
  const id = req.params.id;
  const { status, operatorName, note } = req.body;

  const rect = db.prepare('SELECT * FROM inspection_rectifications WHERE id = ?').get(id);
  if (!rect) {
    return res.status(404).json({ error: '整改单不存在' });
  }

  db.prepare(`
    UPDATE inspection_rectifications
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, id);

  if (note && (status === 'in_progress' || status === 'pending_review')) {
    db.prepare(`
      UPDATE inspection_rectifications SET rectify_note = ? WHERE id = ?
    `).run(note, id);
  }

  if (status === 'pending_review') {
    db.prepare(`
      UPDATE inspection_rectifications SET rectify_date = date('now') WHERE id = ?
    `).run(id);

    const pendingReview = db.prepare(`
      SELECT * FROM close_store_reviews WHERE rectification_id = ? AND status = 'pending'
    `).get(id);

    if (!pendingReview) {
      const reviewResult = db.prepare(`
        INSERT INTO close_store_reviews (
          rectification_id, store_id, store_name, brand, status
        ) VALUES (?, ?, ?, ?, 'pending')
      `).run(id, rect.store_id, rect.store_name, rect.brand);

      addLog('review', reviewResult.lastInsertRowid, '系统', 'create', '由整改单自动生成复查单');
      addLog('rectification', id, '系统', 'create_review', `关联生成闭店复查单 #${reviewResult.lastInsertRowid}`);
    }
  }

  if (status === 'completed') {
    addLog('rectification', id, '系统', 'close', '整改单已结案');
  } else {
    addLog('rectification', id, operatorName || '系统', 'update_status', `状态更新为${status}`);
  }

  res.json({ success: true });
});

app.post('/api/rectifications/:id/comments', (req, res) => {
  const id = req.params.id;
  const { authorName, content } = req.body;

  db.prepare(`
    INSERT INTO comments (ref_type, ref_id, author_name, content)
    VALUES ('rectification', ?, ?, ?)
  `).run(id, authorName, content);

  addLog('rectification', id, authorName, 'comment', content);

  res.status(201).json({ success: true });
});

// ========== 闭店复查单 ==========
app.get('/api/reviews', (req, res) => {
  const { status, role, userName } = req.query;
  let sql = 'SELECT * FROM close_store_reviews WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.get('/api/reviews/:id', (req, res) => {
  const id = req.params.id;
  const review = db.prepare('SELECT * FROM close_store_reviews WHERE id = ?').get(id);
  if (!review) {
    return res.status(404).json({ error: '复查单不存在' });
  }

  const rectification = db.prepare(`
    SELECT * FROM inspection_rectifications WHERE id = ?
  `).get(review.rectification_id);

  const rectAttachments = db.prepare(`
    SELECT * FROM attachments WHERE ref_type = 'rectification' AND ref_id = ?
    ORDER BY uploaded_at DESC
  `).all(review.rectification_id);

  const attachments = db.prepare(`
    SELECT * FROM attachments WHERE ref_type = 'review' AND ref_id = ?
    ORDER BY uploaded_at DESC
  `).all(id);

  const logs = db.prepare(`
    SELECT * FROM operation_logs WHERE ref_type = 'review' AND ref_id = ?
    ORDER BY created_at DESC
  `).all(id);

  const rectLogs = db.prepare(`
    SELECT * FROM operation_logs WHERE ref_type = 'rectification' AND ref_id = ?
    ORDER BY created_at DESC
  `).all(review.rectification_id);

  const comments = db.prepare(`
    SELECT * FROM comments WHERE ref_type = 'review' AND ref_id = ?
    ORDER BY created_at DESC
  `).all(id);

  res.json({
    ...review,
    rectification,
    rectAttachments,
    attachments,
    logs,
    rectLogs,
    comments,
  });
});

app.put('/api/reviews/:id', (req, res) => {
  const id = req.params.id;
  const { result, reviewNote, reviewerName } = req.body;

  const review = db.prepare('SELECT * FROM close_store_reviews WHERE id = ?').get(id);
  if (!review) {
    return res.status(404).json({ error: '复查单不存在' });
  }

  db.prepare(`
    UPDATE close_store_reviews
    SET result = ?, review_note = ?, reviewer_name = ?, review_date = date('now'),
        status = 'completed', updated_at = datetime('now')
    WHERE id = ?
  `).run(result, reviewNote, reviewerName, id);

  addLog('review', id, reviewerName, 'review', `复查${result === 'passed' ? '通过' : '未通过'}`);

  if (result === 'passed') {
    db.prepare(`
      UPDATE inspection_rectifications
      SET status = 'completed', updated_at = datetime('now')
      WHERE id = ?
    `).run(review.rectification_id);

    addLog('rectification', review.rectification_id, '系统', 'close', '复查通过，整改单已结案');
  } else {
    db.prepare(`
      UPDATE inspection_rectifications
      SET status = 'in_progress', updated_at = datetime('now')
      WHERE id = ?
    `).run(review.rectification_id);

    addLog('rectification', review.rectification_id, '系统', 'reopen', '复查未通过，整改单重新打开');
  }

  res.json({ success: true });
});

app.post('/api/reviews/:id/comments', (req, res) => {
  const id = req.params.id;
  const { authorName, content } = req.body;

  db.prepare(`
    INSERT INTO comments (ref_type, ref_id, author_name, content)
    VALUES ('review', ?, ?, ?)
  `).run(id, authorName, content);

  addLog('review', id, authorName, 'comment', content);

  res.status(201).json({ success: true });
});

// ========== 附件 ==========
app.post('/api/attachments', (req, res) => {
  const { refType, refId, fileName, fileType, fileSize, uploaderName } = req.body;

  const result = db.prepare(`
    INSERT INTO attachments (ref_type, ref_id, file_name, file_type, file_size, uploader_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(refType, refId, fileName, fileType, fileSize, uploaderName);

  addLog(refType, refId, uploaderName, 'upload', `上传附件：${fileName}`);

  res.status(201).json({ id: result.lastInsertRowid });
});

// ========== 操作日志 ==========
app.get('/api/logs', (req, res) => {
  const { refType, refId, limit = 50 } = req.query;
  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  const params = [];

  if (refType) {
    sql += ' AND ref_type = ?';
    params.push(refType);
  }
  if (refId) {
    sql += ' AND ref_id = ?';
    params.push(refId);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// ========== 店铺 ==========
app.get('/api/stores', (req, res) => {
  const stores = db.prepare('SELECT * FROM stores ORDER BY id').all();
  res.json(stores);
});

// ========== 用户 ==========
app.get('/api/users', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT * FROM users';
  const params = [];
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  const users = db.prepare(sql).all(...params);
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
