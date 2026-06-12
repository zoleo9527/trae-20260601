import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import { seedDatabase } from './data/seedData';
import authRouter from './routes/auth';
import projectsRouter from './routes/projects';
import arrangementsRouter from './routes/arrangements';
import signinRouter from './routes/signin';
import exceptionsRouter from './routes/exceptions';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/arrangements', arrangementsRouter);
app.use('/api/signin', signinRouter);
app.use('/api/exceptions', exceptionsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '招标代理公司-开评标安排与专家签到系统运行正常' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

const startServer = async () => {
  try {
    await initDatabase();
    console.log('数据库初始化完成');
    
    await seedDatabase();
    console.log('种子数据插入完成');
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log('API文档:');
      console.log('  GET  /api/health - 健康检查');
      console.log('  POST /api/auth/login - 登录');
      console.log('  GET  /api/projects - 项目列表');
      console.log('  GET  /api/projects/:id/analysis - 项目分析（核心接口）');
      console.log('  GET  /api/projects/:id/timeline - 项目时间线');
      console.log('  POST /api/exceptions/trigger-sample - 触发异常样例');
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
