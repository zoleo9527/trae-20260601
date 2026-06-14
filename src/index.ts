import express, { Application, Request, Response } from 'express';
import { userRoutes } from './routes/user.routes';
import { applicationRoutes } from './routes/application.routes';
import { paymentRoutes } from './routes/payment.routes';
import { certificateRoutes } from './routes/certificate.routes';
import { handoverRoutes } from './routes/handover.routes';
import { seedData } from './seed';
import { db } from './database';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toLocaleString('zh-CN')}] ${req.method} ${req.path} - User: ${req.headers['x-user-id'] || 'anonymous'}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    users: db.getUsers().length,
    applications: db.getApplications().length,
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: '公证处窗口-缴费登记与出证安排系统',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      applications: '/api/applications',
      payments: '/api/payments',
      certificates: '/api/certificates',
      handover: '/api/handover/todo',
    },
    documentation: '请使用 x-user-id 请求头进行身份认证',
    testAccounts: {
      WINDOW_STAFF: 'WIN001 (张晓明)',
      NOTARY: 'NOT001 (王公正)',
      ARCHIVIST: 'ARC001 (刘档案)',
    },
  });
});

app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/handover', handoverRoutes);

app.use((err: Error, req: Request, res: Response) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
  });
});

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method,
  });
});

function startServer() {
  seedData();
  console.log('\n' + '='.repeat(60));
  console.log('公证处窗口-缴费登记与出证安排系统');
  console.log('='.repeat(60));
  console.log(`\n服务器运行在: http://localhost:${PORT}`);
  console.log(`\n测试账号 (请在 Header 中设置 x-user-id):`);
  console.log('  窗口人员: WIN001 (张晓明)');
  console.log('  公证员:   NOT001 (王公正)');
  console.log('  档案员:   ARC001 (刘档案)');
  console.log('\n主要接口:');
  console.log('  GET  /health - 健康检查');
  console.log('  GET  /api/applications - 获取所有申请');
  console.log('  GET  /api/applications?stuck=true - 获取卡住的申请');
  console.log('  POST /api/payments/register - 提交缴费登记 (窗口人员)');
  console.log('  POST /api/payments/confirm - 确认缴费 (公证员)');
  console.log('  POST /api/certificates/arrange - 安排出证 (档案员)');
  console.log('  POST /api/certificates/issue - 发证 (档案员)');
  console.log('  GET  /api/certificates/:id/review - 流程回看');
  console.log('  GET  /api/applications/:id/logs - 操作日志');
  console.log('  GET  /api/handover/todo - 交接待办总览');
  console.log('  GET  /api/handover/todo?role=WINDOW_STAFF - 按角色查待办');
  console.log('\n' + '='.repeat(60) + '\n');

  app.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

export { app, startServer };
