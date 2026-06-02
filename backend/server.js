const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDatabase } = require('./database');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

const app = express();
const PORT = 3001;
const JWT_SECRET = 'medical-tracking-secret-key';

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: '未授权访问' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token无效' });
    req.user = user;
    next();
  });
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, department: user.department }
  });
});

app.get('/api/users', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, department, created_at FROM users').all();
  res.json(users);
});

app.get('/api/departments', authenticateToken, (req, res) => {
  const depts = db.prepare('SELECT * FROM departments').all();
  res.json(depts);
});

app.get('/api/packages', authenticateToken, (req, res) => {
  const { status, type } = req.query;
  let sql = `
    SELECT p.*,
           (SELECT bp.batch_id 
            FROM batch_packages bp 
            JOIN sterilization_batches b ON bp.batch_id = b.id 
            WHERE bp.package_id = p.id 
            ORDER BY bp.id DESC 
            LIMIT 1) as current_batch_id,
           (SELECT b.batch_no 
            FROM batch_packages bp 
            JOIN sterilization_batches b ON bp.batch_id = b.id 
            WHERE bp.package_id = p.id 
            ORDER BY bp.id DESC 
            LIMIT 1) as current_batch_no
    FROM instrument_packages p
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND p.type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY p.updated_at DESC';
  const packages = db.prepare(sql).all(...params);
  res.json(packages);
});

app.get('/api/packages/:packageNo', authenticateToken, (req, res) => {
  const pkg = db.prepare(`
    SELECT p.*,
           (SELECT bp.batch_id 
            FROM batch_packages bp 
            JOIN sterilization_batches b ON bp.batch_id = b.id 
            WHERE bp.package_id = p.id 
            ORDER BY bp.id DESC 
            LIMIT 1) as current_batch_id,
           (SELECT b.batch_no 
            FROM batch_packages bp 
            JOIN sterilization_batches b ON bp.batch_id = b.id 
            WHERE bp.package_id = p.id 
            ORDER BY bp.id DESC 
            LIMIT 1) as current_batch_no,
           (SELECT GROUP_CONCAT(b.batch_no, ', ') 
            FROM batch_packages bp 
            JOIN sterilization_batches b ON bp.batch_id = b.id 
            WHERE bp.package_id = p.id) as batch_nos
    FROM instrument_packages p 
    WHERE p.package_no = ?
  `).get(req.params.packageNo);
  
  if (!pkg) return res.status(404).json({ error: '器械包不存在' });
  
  const records = db.prepare(`
    SELECT tr.*, u.name as operator_name, d.name as department_name
    FROM tracking_records tr
    LEFT JOIN users u ON tr.operator_id = u.id
    LEFT JOIN departments d ON tr.department_id = d.id
    WHERE tr.package_id = ?
    ORDER BY tr.id DESC
  `).all(pkg.id);
  
  const exceptions = db.prepare(`
    SELECT er.*, u.name as reporter_name, h.name as handler_name
    FROM exception_reports er
    LEFT JOIN users u ON er.reporter_id = u.id
    LEFT JOIN users h ON er.handler_id = h.id
    WHERE er.package_id = ?
    ORDER BY er.created_at DESC
  `).all(pkg.id);
  
  res.json({ package: pkg, tracking_records: records, exceptions });
});

app.post('/api/packages', authenticateToken, (req, res) => {
  const { package_no, name, type, instruments, instrument_count } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO instrument_packages (package_no, name, type, instruments, instrument_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(package_no, name, type, instruments, instrument_count);
    
    res.json({ id: result.lastInsertRowid, package_no });
  } catch (err) {
    res.status(400).json({ error: '包号已存在' });
  }
});

app.post('/api/packages/:packageNo/track', authenticateToken, (req, res) => {
  const { action, status, location, notes, department_id, batch_id } = req.body;
  const pkg = db.prepare('SELECT * FROM instrument_packages WHERE package_no = ?').get(req.params.packageNo);
  
  if (!pkg) return res.status(404).json({ error: '器械包不存在' });
  
  db.prepare(`
    INSERT INTO tracking_records (package_id, batch_id, action, status, operator_id, department_id, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(pkg.id, batch_id || null, action, status, req.user.id, department_id || null, location, notes);
  
  db.prepare(`
    UPDATE instrument_packages 
    SET status = ?, current_location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, location || pkg.current_location, pkg.id);
  
  res.json({ success: true });
});

app.get('/api/batches', authenticateToken, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT b.*, u.name as operator_name,
           (SELECT COUNT(*) FROM batch_packages WHERE batch_id = b.id) as package_count
    FROM sterilization_batches b
    LEFT JOIN users u ON b.operator_id = u.id
  `;
  const params = [];
  
  if (status) {
    sql += ' WHERE b.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY b.created_at DESC';
  const batches = db.prepare(sql).all(...params);
  res.json(batches);
});

app.get('/api/batches/:batchNo', authenticateToken, (req, res) => {
  const batch = db.prepare(`
    SELECT b.*, u.name as operator_name
    FROM sterilization_batches b
    LEFT JOIN users u ON b.operator_id = u.id
    WHERE b.batch_no = ?
  `).get(req.params.batchNo);
  
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  
  const packages = db.prepare(`
    SELECT p.*
    FROM batch_packages bp
    JOIN instrument_packages p ON bp.package_id = p.id
    WHERE bp.batch_id = ?
  `).all(batch.id);
  
  const recalls = db.prepare(`
    SELECT r.*, u.name as initiator_name
    FROM recall_tasks r
    LEFT JOIN users u ON r.initiator_id = u.id
    WHERE r.batch_id = ?
  `).all(batch.id);
  
  res.json({ batch, packages, recalls });
});

app.post('/api/batches', authenticateToken, (req, res) => {
  const { batch_no, sterilizer_id, program, temperature, duration } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO sterilization_batches (batch_no, sterilizer_id, program, temperature, duration, start_time, operator_id)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `).run(batch_no, sterilizer_id, program, temperature, duration, req.user.id);
    
    res.json({ id: result.lastInsertRowid, batch_no });
  } catch (err) {
    res.status(400).json({ error: '批次号已存在' });
  }
});

app.post('/api/batches/:batchNo/complete', authenticateToken, (req, res) => {
  const { bio_indicator_result } = req.body;
  
  db.prepare(`
    UPDATE sterilization_batches 
    SET status = 'completed', end_time = CURRENT_TIMESTAMP, bio_indicator_result = ?
    WHERE batch_no = ?
  `).run(bio_indicator_result, req.params.batchNo);
  
  const batch = db.prepare('SELECT * FROM sterilization_batches WHERE batch_no = ?').get(req.params.batchNo);
  
  const packages = db.prepare(`
    SELECT bp.package_id, p.package_no
    FROM batch_packages bp
    JOIN instrument_packages p ON bp.package_id = p.id
    WHERE batch_id = ?
  `).all(batch.id);
  
  const updatePkgStmt = db.prepare(`
    UPDATE instrument_packages SET status = 'sterilized', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  
  const insertTrackStmt = db.prepare(`
    INSERT INTO tracking_records (package_id, batch_id, action, status, operator_id, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  packages.forEach(p => {
    updatePkgStmt.run(p.package_id);
    insertTrackStmt.run(p.package_id, batch.id, '灭菌', 'sterilized', req.user.id, '灭菌室', `批次${batch.batch_no}`);
  });
  
  if (bio_indicator_result === 'pass') {
    packages.forEach(p => {
      insertTrackStmt.run(p.package_id, batch.id, '质检', 'qualified', req.user.id, '质检区', '生物指示检测合格');
    });
    db.prepare(`
      UPDATE instrument_packages SET status = 'qualified', updated_at = CURRENT_TIMESTAMP WHERE id IN (
        SELECT package_id FROM batch_packages WHERE batch_id = ?
      )
    `).run(batch.id);
  }
  
  res.json({ success: true });
});

app.post('/api/batches/:batchNo/packages', authenticateToken, (req, res) => {
  const { package_ids } = req.body;
  const batch = db.prepare('SELECT * FROM sterilization_batches WHERE batch_no = ?').get(req.params.batchNo);
  
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  if (batch.status === 'completed') return res.status(400).json({ error: '批次已完成灭菌，不可添加器械包' });
  
  const allowedStatuses = ['cleaned', 'packaged'];
  const rejected = [];
  const accepted = [];
  
  const pkgCheck = db.prepare('SELECT id, package_no, status FROM instrument_packages WHERE id = ?');
  const insertBatchPkg = db.prepare('INSERT OR IGNORE INTO batch_packages (batch_id, package_id) VALUES (?, ?)');
  const insertTrack = db.prepare(`
    INSERT INTO tracking_records (package_id, batch_id, action, status, operator_id, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updatePkg = db.prepare(`
    UPDATE instrument_packages SET status = 'packaged', current_location = '打包区', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  
  for (const id of package_ids) {
    const pkg = pkgCheck.get(id);
    if (!pkg) {
      rejected.push({ id, reason: '器械包不存在' });
    } else if (!allowedStatuses.includes(pkg.status)) {
      rejected.push({ id, package_no: pkg.package_no, reason: `当前状态为${pkg.status}，只允许cleaned或packaged入批` });
    } else {
      const result = insertBatchPkg.run(batch.id, id);
      if (result.changes > 0) {
        insertTrack.run(id, batch.id, '打包', 'packaged', req.user.id, '打包区', `加入批次${batch.batch_no}`);
        updatePkg.run(id);
      }
      accepted.push({ id, package_no: pkg.package_no });
    }
  }
  
  res.json({ success: true, accepted, rejected });
});

app.get('/api/exceptions', authenticateToken, (req, res) => {
  const { status, type } = req.query;
  let sql = `
    SELECT er.*, p.package_no, p.name as package_name,
           u.name as reporter_name, h.name as handler_name
    FROM exception_reports er
    JOIN instrument_packages p ON er.package_id = p.id
    LEFT JOIN users u ON er.reporter_id = u.id
    LEFT JOIN users h ON er.handler_id = h.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND er.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND er.type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY er.created_at DESC';
  const exceptions = db.prepare(sql).all(...params);
  res.json(exceptions);
});

app.post('/api/exceptions', authenticateToken, (req, res) => {
  const { package_no, type, description, missing_items } = req.body;
  const pkg = db.prepare('SELECT * FROM instrument_packages WHERE package_no = ?').get(package_no);
  
  if (!pkg) return res.status(404).json({ error: '器械包不存在' });
  
  const result = db.prepare(`
    INSERT INTO exception_reports (package_id, type, description, missing_items, reporter_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(pkg.id, type, description, missing_items || null, req.user.id);
  
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/exceptions/:id/resolve', authenticateToken, (req, res) => {
  const { resolution } = req.body;
  
  db.prepare(`
    UPDATE exception_reports 
    SET status = 'resolved', handler_id = ?, resolution = ?, resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, resolution, req.params.id);
  
  res.json({ success: true });
});

app.get('/api/recalls', authenticateToken, (req, res) => {
  const recalls = db.prepare(`
    SELECT r.*, b.batch_no, u.name as initiator_name,
           (SELECT COUNT(*) FROM recall_items WHERE recall_id = r.id) as total_items,
           (SELECT COUNT(*) FROM recall_items WHERE recall_id = r.id AND status = 'recovered') as recovered_items
    FROM recall_tasks r
    JOIN sterilization_batches b ON r.batch_id = b.id
    LEFT JOIN users u ON r.initiator_id = u.id
    ORDER BY r.created_at DESC
  `).all();
  
  res.json(recalls);
});

app.get('/api/recalls/:recallNo', authenticateToken, (req, res) => {
  const recall = db.prepare(`
    SELECT r.*, b.batch_no, b.sterilizer_id, b.program, u.name as initiator_name
    FROM recall_tasks r
    JOIN sterilization_batches b ON r.batch_id = b.id
    LEFT JOIN users u ON r.initiator_id = u.id
    WHERE r.recall_no = ?
  `).get(req.params.recallNo);
  
  if (!recall) return res.status(404).json({ error: '召回任务不存在' });
  
  const items = db.prepare(`
    SELECT ri.*, p.package_no, p.name as package_name, d.name as department_name
    FROM recall_items ri
    JOIN instrument_packages p ON ri.package_id = p.id
    LEFT JOIN departments d ON ri.department_id = d.id
    WHERE ri.recall_id = ?
  `).all(recall.id);
  
  res.json({ recall, items });
});

app.post('/api/recalls', authenticateToken, (req, res) => {
  const { batch_no, reason } = req.body;
  const batch = db.prepare('SELECT * FROM sterilization_batches WHERE batch_no = ?').get(batch_no);
  
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  
  const recallNo = 'RECALL' + Date.now();
  const result = db.prepare(`
    INSERT INTO recall_tasks (recall_no, batch_id, reason, initiator_id)
    VALUES (?, ?, ?, ?)
  `).run(recallNo, batch.id, reason, req.user.id);
  
  const packages = db.prepare(`
    SELECT 
      bp.package_id,
      p.package_no,
      (SELECT tr.department_id 
       FROM tracking_records tr 
       WHERE tr.package_id = bp.package_id 
         AND tr.batch_id = ?
         AND tr.department_id IS NOT NULL
       ORDER BY tr.id DESC 
       LIMIT 1) as department_id,
      (SELECT tr.status 
       FROM tracking_records tr 
       WHERE tr.package_id = bp.package_id 
         AND tr.batch_id = ?
       ORDER BY tr.id DESC 
       LIMIT 1) as latest_batch_status
    FROM batch_packages bp
    JOIN instrument_packages p ON bp.package_id = p.id
    WHERE bp.batch_id = ?
  `).all(batch.id, batch.id, batch.id);
  
  const stmt = db.prepare(`
    INSERT INTO recall_items (recall_id, package_id, department_id, status)
    VALUES (?, ?, ?, ?)
  `);
  
  const supplyStatuses = ['recycled', 'counted', 'cleaned', 'packaged', 'sterilized', 'qualified', 'available'];
  
  packages.forEach(p => {
    const recallStatus = supplyStatuses.includes(p.latest_batch_status) ? 'recovered' : 'pending';
    stmt.run(result.lastInsertRowid, p.package_id, p.department_id, recallStatus);
  });
  
  res.json({ id: result.lastInsertRowid, recall_no: recallNo });
});

app.put('/api/recalls/:recallNo/items/:packageId/recover', authenticateToken, (req, res) => {
  const recall = db.prepare('SELECT * FROM recall_tasks WHERE recall_no = ?').get(req.params.recallNo);
  
  db.prepare(`
    UPDATE recall_items 
    SET status = 'recovered', recovered_at = CURRENT_TIMESTAMP
    WHERE recall_id = ? AND package_id = ?
  `).run(recall.id, req.params.packageId);
  
  const remaining = db.prepare(`
    SELECT COUNT(*) as count FROM recall_items 
    WHERE recall_id = ? AND status = 'pending'
  `).get(recall.id);
  
  if (remaining.count === 0) {
    db.prepare(`
      UPDATE recall_tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(recall.id);
  }
  
  res.json({ success: true });
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalPackages = db.prepare('SELECT COUNT(*) as count FROM instrument_packages').get().count;
  const processingBatches = db.prepare("SELECT COUNT(*) as count FROM sterilization_batches WHERE status = 'processing'").get().count;
  const pendingExceptions = db.prepare("SELECT COUNT(*) as count FROM exception_reports WHERE status IN ('pending', 'processing')").get().count;
  const activeRecalls = db.prepare("SELECT COUNT(*) as count FROM recall_tasks WHERE status = 'active'").get().count;
  
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM instrument_packages 
    GROUP BY status
  `).all();
  
  const recentActivity = db.prepare(`
    SELECT tr.*, p.package_no, u.name as operator_name
    FROM tracking_records tr
    JOIN instrument_packages p ON tr.package_id = p.id
    LEFT JOIN users u ON tr.operator_id = u.id
    ORDER BY tr.created_at DESC
    LIMIT 10
  `).all();
  
  res.json({
    totalPackages,
    processingBatches,
    pendingExceptions,
    activeRecalls,
    statusStats,
    recentActivity
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('演示账号:');
  console.log('  管理员: admin / 123456');
  console.log('  护士: nurse_1 / 123456');
  console.log('  清洗员: cleaner_1 / 123456');
  console.log('  灭菌员: sterilizer_1 / 123456');
  console.log('  配送员: deliverer_1 / 123456');
  console.log('  质检员: inspector_1 / 123456');
});
