import express from 'express';
import { initializeDatabase } from './database/connection';
import { seedDatabase } from './database/seed';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'cinema-operation-system'
    }
  });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

function startServer() {
  try {
    initializeDatabase();
    seedDatabase();
    console.log('数据初始化完成');
    
    app.listen(PORT, () => {
      console.log(`服务已启动: http://localhost:${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('测试用户 Header:');
      console.log('  排片经理: x-user-key: schedule-manager');
      console.log('  票务主管: x-user-key: ticket-supervisor');
      console.log('  值班经理: x-user-key: duty-manager');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();
