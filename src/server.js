import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { PrismaClient } from '@prisma/client';
import dashboardRouter from './routes/dashboard.js';
import reservationsRouter from './routes/reservations.js';
import schedulesRouter from './routes/schedules.js';
import exhibitIssuesRouter from './routes/exhibitIssues.js';
import materialIssuesRouter from './routes/materialIssues.js';
import auditRouter from './routes/audit.js';
import seedRouter from './routes/seed.js';
import usersRouter from './routes/users.js';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  next();
});

app.use('/api/dashboard', dashboardRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/exhibit-issues', exhibitIssuesRouter);
app.use('/api/material-issues', materialIssuesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/seed', seedRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`展教管理系统 API 运行在 http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/api/dashboard`);
});

export default app;
