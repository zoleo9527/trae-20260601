# 驾校运营-学时确认与费用结算系统

针对驾校运营中的学时确认与费用结算场景，解决练车排不上、考试名额漏抢、补考费用说不清等异常问题。

## 核心特性

### 1. 多角色待办中心
- **招生顾问**：待确认练车、待结算费用、异常协调
- **教练**：待确认练车计划、待审核学时、异常说明
- **考试专员**：待预约考试、待录入成绩、待处理补考

### 2. 异常流程优先
- 练车排不上：场地满/教练请假/学员时间冲突
- 考试名额漏抢：预约失败或取消的记录追踪
- 补考费用说不清：完整费用链展示

### 3. 状态流转追踪
每个状态变更都记录：
- 变更时间（精确到分钟）
- 变更责任人（角色+姓名）
- 变更原因（必填）
- 备注说明（可选）

## 技术栈

- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **后端**：Express + Prisma ORM
- **数据库**：PostgreSQL
- **状态管理**：Zustand

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
确保 PostgreSQL 已安装并运行，然后创建数据库：
```bash
createdb driving_school
```

编辑 `.env` 文件：
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/driving_school?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
```

### 3. 初始化数据库
```bash
npm run db:generate  # 生成 Prisma Client
npm run db:push       # 创建数据库表
npm run db:seed       # 初始化测试数据
```

### 4. 启动开发服务器
```bash
npm run dev
```

前端：http://localhost:5173
后端：http://localhost:3001

### 5. 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| advisor1 | password123 | 招生顾问 |
| coach1 | password123 | 教练 |
| examiner1 | password123 | 考试专员 |

## 主要功能

### 1. 工作台（待办中心）
- 查看所有待办事项
- 紧急待办高亮显示
- 按类型分类（练车/费用/考试）

### 2. 学员管理
- 学员列表（支持搜索和筛选）
- 学员详情（学时、费用、考试、流转记录）

### 3. 学时确认
- 状态流转：预约 → 教练确认 → 录入学时 → 学员确认 → 完成
- 异常标记：记录排不上等原因

### 4. 费用结算
- 费用类型：报名费、学时费、补考费、补训费、退款
- 状态流转：待确认 → 已确认 → 已支付 → 已结算
- 退款流程：发起退款 → 待审核 → 已退款

### 5. 筛选与查询
- 按学员姓名/电话搜索
- 按状态筛选
- 按时间范围筛选

## 项目结构

```
├── api/                      # 后端代码
│   ├── routes/              # API 路由
│   │   ├── auth.ts          # 认证接口
│   │   ├── todos.ts         # 待办接口
│   │   ├── training.ts      # 学时接口
│   │   ├── payments.ts      # 费用接口
│   │   ├── exams.ts         # 考试接口
│   │   ├── students.ts      # 学员接口
│   │   └── statusLogs.ts    # 状态日志接口
│   ├── services/            # 业务逻辑
│   │   ├── authService.ts   # 认证服务
│   │   ├── todoService.ts   # 待办服务
│   │   ├── trainingService.ts
│   │   ├── paymentService.ts
│   │   ├── examService.ts
│   │   └── statusLogService.ts
│   ├── middleware/          # 中间件
│   │   └── auth.ts          # 认证中间件
│   └── lib/
│       └── prisma.ts        # Prisma 客户端
├── prisma/
│   ├── schema.prisma        # 数据库 Schema
│   └── seed.ts              # 测试数据种子
└── src/                      # 前端代码
    ├── api/
    │   └── client.ts         # API 客户端
    ├── components/          # React 组件
    │   ├── Common.tsx       # 通用组件
    │   ├── Layout.tsx       # 布局组件
    │   ├── StatusTimeline.tsx # 状态时间轴
    │   └── TodoCard.tsx     # 待办卡片
    ├── pages/               # 页面组件
    │   ├── Home.tsx         # 工作台
    │   ├── Login.tsx        # 登录页
    │   ├── Students.tsx     # 学员列表
    │   ├── StudentDetail.tsx # 学员详情
    │   ├── TrainingDetail.tsx # 学时详情
    │   └── PaymentDetail.tsx # 费用详情
    └── stores/             # 状态管理
        └── authStore.ts     # 认证状态
```

## 数据库表

- `users`：用户表（招生顾问、教练、考试专员、管理员）
- `students`：学员表
- `training_hours`：学时记录表
- `payments`：费用记录表
- `exam_bookings`：考试预约表
- `status_logs`：状态流转记录表

## API 端点

### 认证
- POST `/api/auth/login` - 登录
- POST `/api/auth/logout` - 登出

### 待办
- GET `/api/todos` - 获取待办列表

### 学时
- GET `/api/training` - 获取学时列表
- GET `/api/training/:id` - 获取学时详情
- POST `/api/training/:id/confirm` - 确认学时
- POST `/api/training/:id/exception` - 标记异常

### 费用
- GET `/api/payments` - 获取费用列表
- GET `/api/payments/:id` - 获取费用详情
- GET `/api/payments/student/:studentId` - 获取学员费用
- POST `/api/payments/:id/settle` - 结算费用

### 考试
- GET `/api/exams` - 获取考试列表
- GET `/api/exams/:id` - 获取考试详情
- POST `/api/exams/:id/book` - 预约考试
- POST `/api/exams/:id/score` - 录入成绩

### 学员
- GET `/api/students` - 获取学员列表
- GET `/api/students/:id` - 获取学员详情

### 状态日志
- GET `/api/status-logs/:entityType/:entityId` - 获取状态流转记录
