const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  credentials: true,
  origin: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(pair => {
    const [k, v] = pair.trim().split('=');
    if (k) cookies[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return cookies;
}

app.use((req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  let userId = parseInt(cookies.current_user_id) || 1;

  const user = db.prepare('SELECT id, username, name, role, phone FROM users WHERE id = ?').get(userId);
  if (user) {
    req.currentUser = user;
  } else {
    req.currentUser = db.prepare('SELECT id, username, name, role, phone FROM users WHERE id = 1').get();
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '观光果园系统服务正常' });
});

app.use('/api/users', require('./routes/users'));
app.use('/api/fruits', require('./routes/fruits'));
app.use('/api/receptions', require('./routes/receptions'));
app.use('/api/guide-tasks', require('./routes/guideTasks'));
app.use('/api/warehouse-transfers', require('./routes/warehouseTransfers'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
