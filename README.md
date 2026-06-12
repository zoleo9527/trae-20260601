# 税务咨询工作流系统

## 项目简介

这是一个针对税务咨询机构的申报底稿与客户确认工作流系统，旨在解决以下核心问题：

1. **信息不透明**: 旧台账、现场记录和沟通截图只记录结果，不记录决策过程
2. **责任不清**: 申报底稿与客户确认之间的责任归属不明确
3. **沟通效率低**: 各方来回确认次数多，特别是在忙的时候

## 核心特性

### 🎯 统一记录结构
- 申报底稿、客户确认、退回原因、补充备注在同一条记录中
- 完整保留决策过程和责任追溯

### 👥 角色待办系统
- **税务顾问**: 待完成/修订的申报底稿
- **项目经理**: 待审批、超时处理
- **客户财务**: 待确认的材料和申报

### 📋 统一工作面
- 客户确认时可在同一界面查看：
  - 申报底稿摘要
  - 所需材料清单
  - 退回原因（如有）
  - 补充备注和上下文

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 运行种子数据

```bash
npm run seed
```

### 启动开发服务器

```bash
npm run dev
```

### 访问系统

- API 服务: http://localhost:3000
- API 文档 (Swagger UI): http://localhost:3000/api-docs

## 项目结构

```
├── src/
│   ├── types.ts              # TypeScript 类型定义
│   ├── dataStore.ts          # 内存数据存储
│   ├── server.ts             # Express 服务器入口
│   ├── seed.ts               # 种子数据
│   ├── services/             # 服务层
│   │   ├── DraftService.ts           # 申报底稿服务
│   │   ├── ConfirmationService.ts   # 客户确认服务
│   │   ├── TodoService.ts            # 待办服务
│   │   ├── RecordService.ts          # 统一记录服务
│   │   └── ResponsibilityService.ts  # 责任追溯服务
│   └── routes/               # API 路由
│       ├── drafts.ts         # 申报底稿路由
│       ├── confirmations.ts  # 客户确认路由
│       ├── todos.ts          # 待办路由
│       └── records.ts        # 统一记录路由
├── package.json
├── tsconfig.json
├── DESIGN.md                 # 系统设计文档
├── API_DOCUMENTATION.md      # API 接口文档
└── SIMPLIFICATIONS.md        # 技术简化说明
```

## 测试账号

系统预设了以下测试账号：

| 用户ID | 姓名 | 角色 | 邮箱 |
|--------|------|------|------|
| tc-001 | 张税务 | 税务顾问 | zhangtax@example.com |
| tc-002 | 李税务 | 税务顾问 | litax@example.com |
| pm-001 | 王经理 | 项目经理 | wangpm@example.com |
| cf-001 | 陈财务 | 客户财务 | chenfinance@example.com |
| cf-002 | 赵财务 | 客户财务 | zhaofinance@example.com |
| cf-003 | 孙财务 | 客户财务 | sunfinance@example.com |

## 测试数据

种子数据包含：
- 3 个客户公司
- 3 个项目
- 3 条工作流记录（分别处于不同状态）
  - `record-001`: 已退回待修订（包含完整的退回原因和问题点）
  - `record-002`: 确认进行中
  - `record-003`: 已完成确认

## API 接口

### 1. 申报底稿管理

```bash
# 创建申报底稿
POST /api/drafts

# 获取底稿详情
GET /api/drafts/:id

# 更新申报底稿
PUT /api/drafts/:id

# 提交底稿
POST /api/drafts/:id/submit
```

### 2. 客户确认管理

```bash
# 创建确认任务
POST /api/confirmations/:recordId

# 获取确认详情（统一工作面）
GET /api/confirmations/:recordId

# 提供材料
POST /api/confirmations/:recordId/provide-materials

# 确认申报
POST /api/confirmations/:recordId/confirm

# 退回申报
POST /api/confirmations/:recordId/return
```

### 3. 待办管理

```bash
# 税务顾问待办
GET /api/todos/tax-consultant/:consultantId

# 项目经理待办
GET /api/todos/project-manager/:managerId

# 客户财务待办
GET /api/todos/client-finance/:clientId/:financeId

# 标记待办完成
PUT /api/todos/:todoId/complete
```

### 4. 统一记录查询

```bash
# 获取完整记录
GET /api/records/:id

# 查询记录列表
GET /api/records

# 添加备注
POST /api/records/:id/notes

# 获取流程历史
GET /api/records/:id/history

# 获取责任追溯
GET /api/records/:id/responsibility

# 明确责任归属
POST /api/records/:id/responsibility/clarify
```

详细请求示例请参考 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 核心场景示例

### 场景 1: 税务顾问提交申报底稿

```bash
# 1. 创建申报底稿
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{ ... }'

# 2. 提交底稿
curl -X POST http://localhost:3000/api/drafts/{id}/submit \
  -H "X-User-Id: tc-001"
```

### 场景 2: 客户财务确认底稿

```bash
# 1. 查看待确认记录
curl http://localhost:3000/api/records?clientId=client-001&status=pending_confirmation

# 2. 在统一工作面查看详情
curl http://localhost:3000/api/confirmations/{recordId}

# 3. 提供材料
curl -X POST http://localhost:3000/api/confirmations/{recordId}/provide-materials \
  -d '{ "materials": [...] }'

# 4. 确认或退回
curl -X POST http://localhost:3000/api/confirmations/{recordId}/confirm \
  -d '{ "isApproved": true, ... }'
```

### 场景 3: 处理退回的底稿

```bash
# 1. 查看待办
curl http://localhost:3000/api/todos/tax-consultant/tc-001

# 2. 获取退回记录详情
curl http://localhost:3000/api/records/{recordId}

# 3. 更新底稿
curl -X PUT http://localhost:3000/api/drafts/{recordId} \
  -d '{ "draftContent": { ...修正内容... } }'

# 4. 重新提交
curl -X POST http://localhost:3000/api/drafts/{recordId}/submit
```

## 设计亮点

### 1. 信息集中
所有相关信息（申报底稿、确认状态、退回原因、备注）在同一条记录中，减少信息碎片化。

### 2. 责任追溯
每次操作都记录在 `responsibilityTrace` 中，包括：
- 责任人
- 责任角色
- 具体动作
- 完成状态
- 时间戳

### 3. 退回责任明确
退回时记录：
- 退回原因类别
- 具体问题点
- 建议修改方案
- 责任是否明确

### 4. 统一工作面
客户确认接口返回完整上下文，无需多次调用即可获取所有必要信息。

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **语言**: TypeScript
- **文档**: Swagger/OpenAPI 3.0
- **存储**: 内存存储（生产环境建议使用 PostgreSQL）

## 文档

- [系统设计文档](DESIGN.md) - 完整的设计思路和数据模型
- [API 接口文档](API_DOCUMENTATION.md) - 详细的接口说明和请求示例
- [技术简化说明](SIMPLIFICATIONS.md) - 生产环境需要增强的部分

## 生产环境建议

详见 [SIMPLIFICATIONS.md](SIMPLIFICATIONS.md)，主要增强方向：

1. **权限系统**: JWT + RBAC
2. **附件系统**: OSS/S3 集成
3. **通知系统**: 邮件、企业微信/钉钉
4. **外部集成**: 财务系统、电子税务局

## License

MIT
