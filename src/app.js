const express = require('express');
const { initDatabase, rebuildDatabase } = require('./db/init');
const { closeDb } = require('./db/connection');

const creditSalesRouter = require('./routes/credit-sales');
const paymentPlansRouter = require('./routes/payment-plans');
const collectionRecordsRouter = require('./routes/collection-records');
const partialPaymentsRouter = require('./routes/partial-payments');
const reconciliationsRouter = require('./routes/reconciliations');
const dashboardRouter = require('./routes/dashboard');
const farmersRouter = require('./routes/farmers');
const cropSeasonsRouter = require('./routes/crop-seasons');
const saleItemsRouter = require('./routes/sale-items');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

initDatabase();

app.get('/', (req, res) => {
  res.json({
    code: 0,
    message: '农资门店-回款催收与欠账对账 API',
    endpoints: {
      'GET /api/dashboard/overview': '总览看板（总欠款、逾期、按农户/商品/季节汇总）',
      'GET /api/dashboard/farmer/:id': '农户详情（含所有赊销单、回款、催收、对账）',
      'GET/POST /api/farmers': '农户管理',
      'GET/POST /api/crop-seasons': '作物季节管理',
      'GET/POST /api/credit-sales': '赊销单管理（支持按农户、季节、状态、商品类型筛选）',
      'GET /api/credit-sales/:id': '赊销单详情（含商品明细、回款计划、还款、催收、对账）',
      'PUT /api/credit-sales/:id': '更新赊销单状态/备注',
      'GET/POST /api/payment-plans': '回款计划管理',
      'GET /api/payment-plans/overdue-summary': '逾期汇总',
      'POST /api/payment-plans/refresh-overdue': '刷新逾期状态',
      'GET/POST /api/collection-records': '催收记录管理',
      'GET/POST /api/partial-payments': '部分还款管理（自动更新赊销单和回款计划状态）',
      'GET/POST /api/reconciliations': '对账确认管理',
      'POST /api/reconciliations/sale/:saleId/confirm-all': '批量三方确认对账',
      'GET /api/sale-items': '出库明细查询（支持按赊销单、确认状态筛选）',
      'PUT /api/sale-items/:id/warehouse-confirm': '仓管确认出库',
      'GET /api/users': '用户列表'
    }
  });
});

app.use('/api/credit-sales', creditSalesRouter);
app.use('/api/payment-plans', paymentPlansRouter);
app.use('/api/collection-records', collectionRecordsRouter);
app.use('/api/partial-payments', partialPaymentsRouter);
app.use('/api/reconciliations', reconciliationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/farmers', farmersRouter);
app.use('/api/crop-seasons', cropSeasonsRouter);
app.use('/api/sale-items', saleItemsRouter);
app.use('/api/users', usersRouter);

app.post('/api/admin/reset-db', (req, res) => {
  try {
    rebuildDatabase();
    const db = require('./db/connection').getDb();
    const farmers = db.prepare('SELECT id, name FROM farmers ORDER BY id').all();
    const sales = db.prepare('SELECT id, farmer_id, status, total_amount, paid_amount FROM credit_sales ORDER BY id').all();
    const payments = db.prepare('SELECT COUNT(*) as cnt FROM partial_payments').get();
    res.json({
      code: 0,
      message: '数据库已重建，脏数据已清除，恢复初始种子状态',
      data: { farmers, credit_sales: sales, partial_payment_count: payments.cnt }
    });
  } catch (e) {
    res.status(500).json({ code: 1, message: '数据库重建失败', detail: e.message });
  }
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ code: 1, message: '服务器内部错误', detail: err.message });
});

process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`农资门店API服务已启动: http://localhost:${PORT}`);
  console.log(`API文档: http://localhost:${PORT}/`);
});

module.exports = app;
