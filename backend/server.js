import express from 'express';
import cors from 'cors';

import * as schedules from './routes/schedules.js';
import * as deliveries from './routes/deliveries.js';
import * as projects from './routes/projects.js';
import * as timeline from './routes/timeline.js';
import * as common from './routes/common.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'MCN Backend is running', timestamp: new Date().toISOString() });
});

app.get('/api/talents', common.getTalents);
app.get('/api/brands', common.getBrands);
app.get('/api/todos', common.getTodos);
app.put('/api/todos/:id', common.updateTodo);
app.get('/api/risks', common.getRisks);
app.get('/api/recent-changes', common.getRecentChanges);

app.get('/api/schedules', schedules.getAllSchedules);
app.get('/api/schedules/:id', schedules.getScheduleById);
app.post('/api/schedules', schedules.createSchedule);
app.put('/api/schedules/:id', schedules.updateSchedule);
app.post('/api/schedules/:id/start', schedules.startShooting);
app.post('/api/schedules/:id/complete', schedules.completeShooting);

app.get('/api/deliveries', deliveries.getAllDeliveries);
app.get('/api/deliveries/:id', deliveries.getDeliveryById);
app.post('/api/deliveries', deliveries.createDelivery);
app.put('/api/deliveries/:id', deliveries.updateDelivery);
app.post('/api/deliveries/:id/submit', deliveries.submitDelivery);
app.post('/api/deliveries/:id/review', deliveries.reviewDelivery);

app.get('/api/projects', projects.getAllProjects);
app.get('/api/projects/:id', projects.getProjectById);
app.put('/api/projects/:id', projects.updateProject);
app.get('/api/projects/:id/schedules', projects.getProjectSchedules);
app.get('/api/projects/:id/deliveries', projects.getProjectDeliveries);

app.get('/api/projects/:projectId/timeline', timeline.getTimelineByProjectId);
app.post('/api/timeline', timeline.addTimelineEvent);
app.get('/api/projects/:projectId/scripts', timeline.getScriptVersions);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 1, message: '服务器内部错误', error: err.message });
});

app.listen(PORT, () => {
  console.log(`
  🚀 MCN Backend Server 已启动
  📍 本地地址: http://localhost:${PORT}
  📡 API 前缀: http://localhost:${PORT}/api
  💾 数据存储: backend/data/db.json
  `);
});
