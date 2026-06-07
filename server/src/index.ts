import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import inspectionRoutes from './routes/inspections.js';
import repairRoutes from './routes/repairs.js';
import machineRoutes from './routes/machines.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';

export const prisma = new PrismaClient();
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use('/api/inspections', inspectionRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});

export default app;
