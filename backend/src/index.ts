import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { seedDatabase } from './data/seedData';

import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';
import viewingRoutes from './routes/viewings';
import quotationRoutes from './routes/quotations';
import contractRoutes from './routes/contracts';
import handoverRoutes from './routes/handover';
import depositRoutes from './routes/deposits';
import logRoutes from './routes/logs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/viewings', viewingRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/logs', logRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '写字楼租赁管理系统 API 服务正常运行',
  });
});

app.get('/api/system/info', (req, res) => {
  res.json({
    name: '写字楼租赁-租赁报价与合同流转系统',
    version: '1.0.0',
    description: '房源台账、看房记录、报价单、合同、物业交接、押金结算全流程管理',
    features: [
      '房源状态自动流转',
      '看房记录与反馈管理',
      '租赁报价审批流程',
      '合同起草、审核、签署',
      '物业交接单管理',
      '押金结算与退款',
      '全流程操作留痕',
      '流转回看功能',
    ],
    roles: [
      { id: 'rental_consultant', name: '租赁顾问', description: '预约看房、记录反馈、创建报价、起草合同、发起交接' },
      { id: 'operation_manager', name: '运营经理', description: '确认报价、审核合同、交接确认、扣除押金、处理争议' },
      { id: 'finance', name: '财务', description: '确认押金到账、执行押金退款' },
    ],
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'API 路径不存在' });
});

const startServer = async () => {
  await seedDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('  写字楼租赁管理系统 API 服务');
    console.log('========================================');
    console.log(`  服务地址: http://localhost:${PORT}`);
    console.log(`  健康检查: http://localhost:${PORT}/api/health`);
    console.log(`  系统信息: http://localhost:${PORT}/api/system/info`);
    console.log('');
    console.log('  演示账号:');
    console.log('    租赁顾问: consultant / 123456');
    console.log('    运营经理: manager / 123456');
    console.log('    财务:     finance / 123456');
    console.log('');
    console.log('  前端地址: http://localhost:5173');
    console.log('========================================');
    console.log('');
  });
};

startServer().catch((err) => {
  console.error('启动服务失败:', err);
  process.exit(1);
});

export default app;
