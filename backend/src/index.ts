import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import { idempotencyMiddleware, cleanupExpiredIdempotencyKeys } from './middleware/idempotency';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

initDatabase();

app.use(cors());
app.use(express.json());
app.use(idempotencyMiddleware);

app.use('/api', routes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

setInterval(() => {
  try {
    cleanupExpiredIdempotencyKeys();
  } catch (e) {
    console.error('清理过期幂等键失败:', e);
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`水产养殖场病害处理与用药追溯系统后端已启动`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API 前缀: http://localhost:${PORT}/api`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
});
