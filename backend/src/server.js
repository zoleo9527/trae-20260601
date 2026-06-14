const express = require('express');
const { initDB } = require('./db');
const { errorHandler, ERROR_CODES } = require('./errors');

const usersRouter = require('./routes/users');
const studentsRouter = require('./routes/students');
const examBookingsRouter = require('./routes/examBookings');
const makeupExamsRouter = require('./routes/makeupExams');
const examSessionsRouter = require('./routes/examSessions');
const coachSchedulesRouter = require('./routes/coachSchedules');
const feesRouter = require('./routes/fees');
const dashboardRouter = require('./routes/dashboard');
const logsRouter = require('./routes/logs');

initDB();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, X-User-Role');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'driving-school-exam-system',
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

app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/exam-bookings', examBookingsRouter);
app.use('/api/makeup-exams', makeupExamsRouter);
app.use('/api/exam-sessions', examSessionsRouter);
app.use('/api/coach', coachSchedulesRouter);
app.use('/api/fees', feesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/logs', logsRouter);

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

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[driving-school-exam-system] 服务已启动 http://localhost:${PORT}`);
    console.log(`  GET  /health                           健康检查`);
    console.log(`  GET  /error-codes                      错误码列表`);
    console.log(`  GET  /api/dashboard                    工作台数据（需 X-User-Id/X-User-Role）`);
    console.log(`  GET  /api/users/me/todos               我的待办（需 X-User-Id/X-User-Role）`);
    console.log(``);
    console.log(`  === 学员档案 ===`);
    console.log(`  POST /api/students                     新增学员（admission_consultant）`);
    console.log(`  GET  /api/students                     学员列表`);
    console.log(`  GET  /api/students/:id                 学员详情`);
    console.log(`  PUT  /api/students/:id                 更新学员`);
    console.log(``);
    console.log(`  === 考试预约 ===`);
    console.log(`  POST /api/exam-bookings                提交考试预约`);
    console.log(`  GET  /api/exam-bookings                预约列表`);
    console.log(`  GET  /api/exam-bookings/:id            预约详情`);
    console.log(`  POST /api/exam-bookings/:id/approve    审核通过（exam_specialist）`);
    console.log(`  POST /api/exam-bookings/:id/reject     审核拒绝（exam_specialist）`);
    console.log(`  POST /api/exam-bookings/:id/book-session  预约场次`);
    console.log(`  POST /api/exam-bookings/:id/record-result  录入成绩`);
    console.log(``);
    console.log(`  === 补考跟进 ===`);
    console.log(`  GET  /api/makeup-exams                 补考列表`);
    console.log(`  GET  /api/makeup-exams/:id             补考详情`);
    console.log(`  GET  /api/makeup-exams/:id/review      补考回看`);
    console.log(`  POST /api/makeup-exams/:id/record-payment  登记缴费（admission_consultant）`);
    console.log(`  POST /api/makeup-exams/:id/book-exam   预约补考（exam_specialist）`);
    console.log(``);
    console.log(`  === 考试场次 ===`);
    console.log(`  POST /api/exam-sessions                发布场次（exam_specialist）`);
    console.log(`  GET  /api/exam-sessions                场次列表`);
    console.log(`  GET  /api/exam-sessions/available      可预约场次`);
    console.log(``);
    console.log(`  === 教练排班 ===`);
    console.log(`  GET  /api/coach/coaches                教练列表`);
    console.log(`  POST /api/coach/schedules              发布排班（coach）`);
    console.log(`  GET  /api/coach/schedules              排班列表`);
    console.log(`  POST /api/coach/schedules/:id/book     预约练车（admission_consultant）`);
    console.log(``);
    console.log(`  使用示例用户ID（用于请求头 X-User-Id）：`);
    console.log(`  运行 npm run seed 查看生成的用户ID`);
  });
}

module.exports = app;
