import express from 'express';
import apiRouter from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'railway-freight-loading-plan' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: '内部服务错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚂 铁路货运站装车计划系统已启动 http://localhost:${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
  console.log(`   API 根路径: http://localhost:${PORT}/api`);
});

export default app;
