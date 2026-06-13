import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import laborDemandRoutes from './routes/laborDemand.js';
import candidateRoutes from './routes/candidate.js';
import matchingRoutes from './routes/matching.js';
import statusHistoryRoutes from './routes/statusHistory.js';
import returnRecordRoutes from './routes/returnRecord.js';
import attachmentRoutes from './routes/attachment.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/labor-demands', laborDemandRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/matchings', matchingRoutes);
app.use('/api/status-histories', statusHistoryRoutes);
app.use('/api/return-records', returnRecordRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`人力派遣公司管理系统运行在 http://localhost:${PORT}`);
});
