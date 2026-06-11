const express = require('express');
const cors = require('cors');
const { authRouter, authenticateToken, requireRole } = require('./middleware/auth');
const { surveysRouter } = require('./routes/surveys');
const { plansRouter } = require('./routes/plans');
const { auditRouter } = require('./routes/audit');
const { initDatabase } = require('./data/database');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

initDatabase();

app.use('/api/auth', authRouter);
app.use('/api/surveys', authenticateToken, surveysRouter);
app.use('/api/plans', authenticateToken, plansRouter);
app.use('/api/audit', authenticateToken, requireRole('PROJECT_MANAGER'), auditRouter);

app.get('/api/users', authenticateToken, (req, res) => {
  const users = db.users.map(u => ({
    id: u.id,
    username: u.username,
    realName: u.realName,
    role: u.role,
    phone: u.phone,
    department: u.department
  }));
  res.json({ success: true, message: '获取成功', data: users });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`🚀 安防工程商管理系统后端已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}/api`);
  console.log(`👤 测试账号: pm / leader / engineer，密码均为 123456`);
});
