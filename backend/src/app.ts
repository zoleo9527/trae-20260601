import express from 'express';
import cors from 'cors';
import { scheduleRoutes } from './routes/schedule.routes.js';
import { materialRoutes } from './routes/material.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/schedules', scheduleRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
  console.log('可用的API端点:');
  console.log('  - GET    /api/health');
  console.log('  - GET    /api/schedules');
  console.log('  - GET    /api/schedules/:id');
  console.log('  - POST   /api/schedules');
  console.log('  - PUT    /api/schedules/:id');
  console.log('  - POST   /api/schedules/:id/transition');
  console.log('  - GET    /api/materials');
  console.log('  - GET    /api/materials/:id');
  console.log('  - POST   /api/materials');
  console.log('  - POST   /api/materials/:id/transition');
  console.log('  - GET    /api/notifications');
  console.log('  - POST   /api/notifications/:id/read');
});
