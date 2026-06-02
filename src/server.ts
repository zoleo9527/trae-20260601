import express from 'express';
import groupPointRoutes from './routes/groupPointRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import afterSaleRoutes from './routes/afterSaleRoutes.js';
import adjustmentRoutes from './routes/adjustmentRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', groupPointRoutes);
app.use('/api', orderRoutes);
app.use('/api', batchRoutes);
app.use('/api', afterSaleRoutes);
app.use('/api', adjustmentRoutes);
app.use('/api', settlementRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 社区团购结算系统 API 服务已启动: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 API 端点:');
  console.log('   GET  /api/health - 健康检查');
  console.log('');
  console.log('📍 团点管理:');
  console.log('   POST /api/group-points - 创建团点');
  console.log('   GET  /api/group-points - 团点列表');
  console.log('   GET  /api/group-points/:id - 团点详情');
  console.log('   GET  /api/leaders - 团长列表');
  console.log('   PUT  /api/leaders/:id - 更新团长');
  console.log('');
  console.log('📦 订单管理:');
  console.log('   POST /api/orders - 创建订单');
  console.log('   GET  /api/orders - 订单列表');
  console.log('   GET  /api/orders/:id - 订单详情');
  console.log('   POST /api/orders/:id/fulfill - 履约订单');
  console.log('');
  console.log('🚚 履约批次:');
  console.log('   POST /api/batches - 创建批次（运营）');
  console.log('   GET  /api/batches - 批次列表');
  console.log('   GET  /api/batches/:id - 批次详情');
  console.log('   POST /api/batches/:id/delivered - 标记配送');
  console.log('');
  console.log('🔧 售后管理:');
  console.log('   POST /api/after-sales - 创建售后（客服）');
  console.log('   GET  /api/after-sales - 售后列表');
  console.log('   POST /api/after-sales/:id/handle - 处理售后');
  console.log('');
  console.log('💵 补差记录:');
  console.log('   POST /api/adjustments - 创建补差');
  console.log('   GET  /api/adjustments - 补差列表');
  console.log('   POST /api/adjustments/:id/handle - 处理补差');
  console.log('');
  console.log('💰 佣金结算:');
  console.log('   POST /api/settlements - 创建结算单（运营）');
  console.log('   GET  /api/settlements - 结算单列表');
  console.log('   GET  /api/settlements/:id - 结算单详情（含明细）');
  console.log('   POST /api/settlements/:id/submit - 提交审核');
  console.log('   POST /api/settlements/:id/lock - 锁定结算（财务）');
  console.log('   POST /api/settlements/:id/paid - 标记已支付');
  console.log('   GET  /api/leaders/:leaderId/settlements/:id - 团长查看明细');
  console.log('');
});

export default app;
