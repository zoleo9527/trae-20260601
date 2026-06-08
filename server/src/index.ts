import express from 'express';
import cors from 'cors';
import { authMiddleware } from './auth.js';
import complaintsRouter from './routes/complaints.js';
import rolesRouter from './routes/roles.js';
import { store } from './data-store.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/seed', (req, res) => {
  store.resetData();
  res.json({ message: '数据已重置为种子数据' });
});

app.use('/api', authMiddleware);
app.use('/api/complaints', complaintsRouter);
app.use('/api/roles', rolesRouter);

app.listen(PORT, () => {
  console.log(`🚀 投诉登记与补偿跟进服务已启动: http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🔄 重置数据: POST http://localhost:${PORT}/api/seed`);
  console.log(`👤 测试用户: op1(王计调), guide1(李导游), fleet1(张调度), supervisor1(赵主管)`);
});
