const express = require('express');
const { initDB } = require('./db');
const { errorHandler, ERROR_CODES } = require('./errors');

const registrationsRouter = require('./routes/registrations');
const ticketsRouter = require('./routes/tickets');
const usersRouter = require('./routes/users');

initDB();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'exam-admin-center',
      time: new Date().toISOString(),
    },
  });
});

app.get('/error-codes', (req, res) => {
  res.json({
    success: true,
    data: Object.fromEntries(
      Object.entries(ERROR_CODES).map(([key, val]) => [key, { ...val }])
    ),
  });
});

app.use('/api/registrations', registrationsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/users', usersRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'E0000',
      message: '接口不存在',
      details: { path: req.path, method: req.method },
    },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[exam-admin-center] 服务已启动 http://localhost:${PORT}`);
    console.log(`  GET  /health                           健康检查`);
    console.log(`  GET  /error-codes                      错误码列表`);
    console.log(`  GET  /api/users/me/todos               我的待办（需 X-User-Id/X-User-Role）`);
    console.log(`  POST /api/registrations                提交报名`);
    console.log(`  GET  /api/registrations                报名列表`);
    console.log(`  GET  /api/registrations/:id            报名详情（含 timeline、准考证信息）`);
    console.log(`  POST /api/registrations/:id/audit      审核（admin_staff，支持复审）`);
    console.log(`  POST /api/registrations/:id/supplement 补正/转派（tech_support/admin_staff）`);
    console.log(`  POST /api/registrations/:id/reopen     接回复审，pending_review→pending（admin_staff）`);
    console.log(`  POST /api/tickets                      生成准考证（admin_staff/invigilator）`);
    console.log(`  GET  /api/tickets/:id                  准考证详情`);
    console.log(`  GET  /api/tickets/by-registration/:id  按报名查准考证`);
  });
}

module.exports = app;
