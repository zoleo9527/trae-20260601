import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import returnsRouter from './routes/returns.js';
import reissueRouter from './routes/reissue.js';
import ordersRouter from './routes/orders.js';
import warehouseRouter from './routes/warehouse.js';
import attachmentsRouter from './routes/attachments.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDb();

app.use('/api/returns', returnsRouter);
app.use('/api/reissue', reissueRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/warehouse', warehouseRouter);
app.use('/api/attachments', attachmentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '建材仓配-退换货与补发跟踪系统 API 运行正常' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  建材仓配-退换货与补发跟踪系统`);
  console.log(`  API 服务器运行在: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});

export default app;
