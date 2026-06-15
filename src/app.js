const express = require('express');
const bodyParser = require('body-parser');

const projectsRouter = require('./routes/projects');
const drawingsRouter = require('./routes/drawings');
const schedulesRouter = require('./routes/schedules');
const recordsRouter = require('./routes/records');
const usersRouter = require('./routes/users');

const { initializeData } = require('./data/init');

const app = express();
const PORT = 3005;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initializeData();

app.use((req, res, next) => {
  req.timestamp = new Date().toISOString();
  console.log(`[${req.timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/projects', projectsRouter);
app.use('/api/drawings', drawingsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/records', recordsRouter);
app.use('/api/users', usersRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sign-factory-workflow', time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || 'UNKNOWN_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`标识制作厂工作流系统已启动`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`========================================`);
  console.log(`内置测试账号:`);
  console.log(`  项目专员: USER_001 (王明)`);
  console.log(`  制作师傅: USER_002 (李刚)`);
  console.log(`  安装负责人: USER_003 (张伟)`);
  console.log(`========================================`);
});

module.exports = app;
