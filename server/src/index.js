const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./db');
const bus = require('./eventBus');
const slotService = require('./services/slotService');
const statusService = require('./services/statusService');

const gateRoutes = require('./routes/gate');
const yardRoutes = require('./routes/yard');
const customerRoutes = require('./routes/customer');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = 3100;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/gate', gateRoutes);
app.use('/api/yard', yardRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

bus.on(bus.CONTAINER_STATUS_CHANGED, (event) => {
  statusService.recordChange(
    event.container_no,
    event.fromStatus,
    event.toStatus,
    event.changedBy,
    event.reason,
    event.detail || ''
  );
});

bus.on(bus.FEE_DISPUTED, (event) => {
  console.log(`[EVENT] 费用争议: 集装箱 ${event.container_no}, 原因: ${event.reason}`);
});

bus.on(bus.INSPECTION_MISSED, (event) => {
  console.log(`[EVENT] 查验遗漏: 集装箱 ${event.container_no}, 类型: ${event.plan_type}, 原因: ${event.reason}`);
});

slotService.setupEventListeners();

initDatabase();

app.listen(PORT, () => {
  console.log(`[SERVER] 港口堆场管理系统已启动: http://localhost:${PORT}`);
  console.log(`[SERVER] API 路由:`);
  console.log(`  POST   /api/gate/entry          - 登记入场`);
  console.log(`  PUT    /api/gate/entry/:id       - 修改入场`);
  console.log(`  GET    /api/gate/entries         - 查询入场列表`);
  console.log(`  GET    /api/gate/entry/:id       - 查询入场详情`);
  console.log(`  GET    /api/yard/slots           - 查询位图`);
  console.log(`  POST   /api/yard/allocate        - 分配位`);
  console.log(`  PUT    /api/yard/reallocate/:id  - 重新分配`);
  console.log(`  GET    /api/yard/allocation-history/:containerNo - 分配历史`);
  console.log(`  GET    /api/yard/misplaced       - 错位列表`);
  console.log(`  POST   /api/yard/fix-misplaced/:id - 纠正错位`);
  console.log(`  GET    /api/customer/overdue-fees      - 逾期费用`);
  console.log(`  POST   /api/customer/fee-dispute      - 发起争议`);
  console.log(`  PUT    /api/customer/fee-dispute/:id   - 解决争议`);
  console.log(`  GET    /api/customer/inspection-plans  - 查验计划`);
  console.log(`  POST   /api/customer/notify-inspection/:id - 通知查验`);
  console.log(`  GET    /api/customer/missed-notifications  - 遗漏通知`);
  console.log(`  GET    /api/dashboard/stats      - 统计概览`);
  console.log(`  GET    /api/dashboard/recent-alerts - 最近告警`);
  console.log(`  POST   /api/export/create        - 创建导出`);
  console.log(`  GET    /api/export/tasks         - 导出任务`);
  console.log(`  GET    /api/export/download/:id  - 下载导出`);
});
