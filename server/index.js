const express = require('express');
const cors = require('cors');
const { authRouter, authenticateToken, requireRole } = require('./middleware/auth');
const { surveysRouter } = require('./routes/surveys');
const { plansRouter } = require('./routes/plans');
const { auditRouter } = require('./routes/audit');
const { initDatabase, db, successResponse } = require('./data/database');

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

app.get('/api/dashboard/stuck', authenticateToken, (req, res) => {
  const isManager = ['PROJECT_MANAGER', 'CONSTRUCTION_LEADER'].includes(req.user.role);
  const userId = req.user.id;

  const canView = (item) => {
    if (isManager) return true;
    return item.assignedTo && item.assignedTo.id === userId;
  };

  const stuckSurveys = db.surveys.filter(s => s.stuck && canView(s));
  const stuckPlans = db.plans.filter(p => p.stuck && canView(p));

  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const potentialStuckSurveys = db.surveys.filter(s => 
    ['IN_PROGRESS', 'REVIEWING'].includes(s.status) && 
    new Date(s.updatedAt) < new Date(threshold) && 
    !s.stuck &&
    canView(s)
  );
  const potentialStuckPlans = db.plans.filter(p => 
    ['IN_PROGRESS', 'CUSTOMER_REVIEWING', 'REVISED'].includes(p.status) && 
    new Date(p.updatedAt) < new Date(threshold) && 
    !p.stuck &&
    canView(p)
  );

  const formatStuckItem = (item, type) => ({
    id: item.id,
    type,
    projectName: item.projectName,
    projectCode: item.projectCode,
    status: item.status,
    stuckReason: item.stuckReason,
    stuckAt: item.stuckAt,
    updatedAt: item.updatedAt,
    assignedTo: item.assignedTo?.username,
    assignedToName: item.assignedTo?.realName,
    stuckHours: item.stuckAt ? Math.floor((Date.now() - new Date(item.stuckAt)) / (1000 * 60 * 60)) : 0
  });

  successResponse(res, {
    totalStuckSurveys: stuckSurveys.length,
    totalStuckPlans: stuckPlans.length,
    stuckSurveys: stuckSurveys.map(s => formatStuckItem(s, 'SURVEY')),
    stuckPlans: stuckPlans.map(p => formatStuckItem(p, 'PLAN')),
    potentialStuckSurveys: potentialStuckSurveys.length,
    potentialStuckPlans: potentialStuckPlans.length
  });
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
