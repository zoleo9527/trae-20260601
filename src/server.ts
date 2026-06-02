import express from 'express';
import 'express-async-errors';
import waveRoutes from './routes/wave.routes';
import pickTaskRoutes from './routes/pickTask.routes';
import packageRoutes from './routes/package.routes';
import afterSalesRoutes from './routes/afterSales.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '仓库追溯系统服务运行中' });
});

app.use('/api/waves', waveRoutes);
app.use('/api/pick-tasks', pickTaskRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/after-sales', afterSalesRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API 文档:');
  console.log('  GET  /health - 健康检查');
  console.log('  波次管理:');
  console.log('    POST /api/waves - 创建波次');
  console.log('    GET  /api/waves - 波次列表');
  console.log('    GET  /api/waves/:waveId - 波次详情');
  console.log('    POST /api/waves/:waveId/start - 开始波次');
  console.log('    POST /api/waves/:waveId/complete - 完成波次');
  console.log('    GET  /api/waves/:waveId/traceability - 波次追溯');
  console.log('  拣货任务:');
  console.log('    GET  /api/pick-tasks/available - 可领取任务');
  console.log('    GET  /api/pick-tasks/my/:pickerId - 我的任务');
  console.log('    POST /api/pick-tasks/assign - 领取任务');
  console.log('    POST /api/pick-tasks/:taskId/start - 开始拣货');
  console.log('    POST /api/pick-tasks/:taskId/complete - 完成拣货');
  console.log('  包裹管理:');
  console.log('    POST /api/packages - 创建包裹');
  console.log('    GET  /api/packages - 包裹列表');
  console.log('    POST /api/packages/:packageId/review - 复核包裹');
  console.log('    POST /api/packages/:packageId/ship - 包裹出库');
  console.log('  售后追溯:');
  console.log('    POST /api/after-sales - 提交售后反馈');
  console.log('    GET  /api/after-sales - 售后列表');
  console.log('    POST /api/after-sales/:feedbackId/investigate - 开始调查');
  console.log('    GET  /api/after-sales/:feedbackId/trace - 追溯根源');
  console.log('    GET  /api/after-sales/:feedbackId/chain - 完整追溯链路');
});

export default app;
