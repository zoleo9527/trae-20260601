const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const formulaRouter = require('./routes/formula');
const batchingRouter = require('./routes/batching');
const qualityRouter = require('./routes/quality');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/formulas', formulaRouter);
app.use('/api/batching-plans', batchingRouter);
app.use('/api/quality', qualityRouter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

app.get('/api/docs', (_req, res) => {
  const yamlPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
  res.sendFile(yamlPath);
});

app.get('/api/handover', (_req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      serverPort: 3100,
      auth: {
        method: 'request-header',
        description: '当前通过请求头 x-user-role 和 x-user-id 模拟身份，后续接前端需替换为 JWT',
        headers: {
          'x-user-role': '角色标识',
          'x-user-id': '用户主键',
        },
      },
      roleEntries: [
        {
          role: 'formulation_engineer',
          label: '配方师',
          headerExample: { 'x-user-role': 'formulation_engineer', 'x-user-id': '1' },
          seedUser: { id: 1, name: '张配方' },
          endpoints: [
            'GET    /api/formulas                        — 配方列表',
            'POST   /api/formulas                        — 创建配方',
            'PATCH  /api/formulas/:id/submit             — 提交审批',
            'PATCH  /api/formulas/:id/review             — 交叉审核（禁止自审）',
            'POST   /api/formulas/:id/new-version        — 基于已有配方创建新版本',
            'GET    /api/formulas/history/:code          — 版本历史回看',
            'GET    /api/quality/complaints              — 查看投诉（关联配方调整）',
          ],
        },
        {
          role: 'production_leader',
          label: '生产班长',
          headerExample: { 'x-user-role': 'production_leader', 'x-user-id': '2' },
          seedUser: { id: 2, name: '王班长' },
          endpoints: [
            'GET    /api/batching-plans                  — 投料计划列表',
            'POST   /api/batching-plans                  — 创建投料计划',
            'PATCH  /api/batching-plans/:id/start        — 开工',
            'POST   /api/batching-plans/:planId/records  — 添加投料记录',
            'PATCH  /api/batching-plans/:id/complete     — 完工',
            'GET    /api/batching-plans/history/formula/:formulaId — 按配方回看投料历史',
            'GET    /api/quality/inspections/plan/:planId — 查看质检结果',
          ],
        },
        {
          role: 'quality_inspector',
          label: '质检员',
          headerExample: { 'x-user-role': 'quality_inspector', 'x-user-id': '3' },
          seedUser: { id: 3, name: '李质检' },
          endpoints: [
            'POST   /api/quality/inspections             — 创建质检记录',
            'GET    /api/quality/inspections/plan/:planId — 查看计划质检记录',
            'GET    /api/quality/complaints              — 投诉列表',
            'POST   /api/quality/complaints              — 登记投诉',
            'PATCH  /api/quality/complaints/:id/handle   — 开始处理',
            'PATCH  /api/quality/complaints/:id/resolve  — 结案',
            'GET    /api/quality/complaints/stats        — 投诉统计',
          ],
        },
      ],
      mockData: {
        seedScript: 'prisma/seed.js',
        database: 'prisma/dev.db',
        description: 'SQLite 文件数据库，重置命令: npm run db:reset && node prisma/seed.js',
        records: {
          users: 5,
          formulas: 5,
          batchingPlans: 3,
          batchingRecords: 7,
          inspectionRecords: 2,
          complaints: 3,
        },
      },
      errorCodes: [
        { code: 'AUTH_MISSING', statusCode: 401, message: '缺少身份信息' },
        { code: 'FORBIDDEN', statusCode: 403, message: '无权访问' },
        { code: 'SELF_REVIEW_FORBIDDEN', statusCode: 403, message: '禁止提交人自审' },
        { code: 'NOT_FOUND', statusCode: 404, message: '资源不存在' },
        { code: 'VALIDATION_ERROR', statusCode: 400, message: '参数校验失败' },
        { code: 'FORMULA_DRAFT_ONLY', statusCode: 409, message: '仅草稿状态可提交审批' },
        { code: 'FORMULA_PENDING_ONLY', statusCode: 409, message: '仅待审核状态可审核' },
        { code: 'FORMULA_APPROVED_ONLY', statusCode: 409, message: '仅已审批配方可创建投料计划' },
        { code: 'PLAN_STATUS_ERROR', statusCode: 409, message: '投料计划状态不允许此操作' },
        { code: 'INTERNAL_ERROR', statusCode: 500, message: '服务器内部错误' },
      ],
      pendingIntegrations: [
        {
          name: '前端鉴权',
          description: '当前 x-user-role / x-user-id 为明文请求头模拟，接前端后需替换为 JWT 登录流程',
          files: ['src/middleware/roleGuard.js'],
        },
        {
          name: '真实用户体系',
          description: '当前 User 表仅含 name/role/phone，需接入企业 SSO 或独立注册登录，含密码哈希、token 签发与刷新',
          files: ['prisma/schema.prisma'],
        },
        {
          name: 'ERP/MES 系统同步',
          description: '配方和投料计划需与工厂 ERP 双向同步，建议在 service 层增加消息队列或 HTTP 回调',
          files: ['src/services/formulaService.js', 'src/services/batchingService.js'],
        },
        {
          name: '投料偏差告警推送',
          description: 'deviationRate 超阈值（如 ±5%）时自动通知质检员和配方师，需加 WebSocket / 短信推送',
          files: ['src/services/batchingService.js'],
        },
        {
          name: '投诉与投料记录自动关联',
          description: '目前 complaint.batchCode 为手动填写，未自动关联 BatchingPlan.code，需在 createComplaint 中增加反查逻辑',
          files: ['src/services/qualityService.js'],
        },
        {
          name: '配方附件与质检照片',
          description: '配方附件、质检现场照片等文件存储尚未实现，需增加 FileUpload 模型 + 静态文件服务',
          files: ['prisma/schema.prisma'],
        },
        {
          name: '数据库切换 PostgreSQL',
          description: '当前 SQLite 仅用于开发，生产环境需修改 prisma/schema.prisma 的 datasource provider 为 postgresql',
          files: ['prisma/schema.prisma', 'prisma/.env'],
        },
      ],
    },
  });
});

app.use(errorHandler);

module.exports = app;
