import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import draftsRouter from './routes/drafts';
import confirmationsRouter from './routes/confirmations';
import todosRouter from './routes/todos';
import recordsRouter from './routes/records';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '税务咨询工作流系统 API',
      version: '1.0.0',
      description: `
税务咨询机构-申报底稿与客户确认工作流系统接口文档

## 核心功能
- **申报底稿管理**: 创建、更新、提交申报底稿
- **客户确认管理**: 材料提供、确认、退回
- **角色待办**: 税务顾问、项目经理、客户财务各自的待办列表
- **统一记录**: 申报底稿、客户确认、退回原因、补充备注在同一记录中
- **责任追溯**: 完整记录各环节的责任人

## 设计原则
- 信息集中：所有相关信息在同一记录中
- 角色分离：各方只看到自己的待办
- 上下文完整：客户确认时能看到底稿、备注和历史
      `,
      contact: {
        name: '税务咨询工作流系统'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '开发环境'
      }
    ],
    tags: [
      { name: '申报底稿', description: '申报底稿管理' },
      { name: '客户确认', description: '客户确认管理' },
      { name: '待办管理', description: '角色待办管理' },
      { name: '统一记录', description: '完整记录查询' }
    ]
  },
  apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '税务咨询工作流系统 API 文档'
}));

app.use('/api/drafts', draftsRouter);
app.use('/api/confirmations', confirmationsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/records', recordsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: '税务咨询工作流系统 API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      drafts: '/api/drafts',
      confirmations: '/api/confirmations',
      todos: '/api/todos',
      records: '/api/records'
    }
  });
});

app.listen(PORT, () => {
  console.log(`税务咨询工作流系统已启动: http://localhost:${PORT}`);
  console.log(`API 文档: http://localhost:${PORT}/api-docs`);
});

export default app;
