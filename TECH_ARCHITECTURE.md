# 科技馆展教系统技术架构文档

## 1. 技术栈选型

### 1.1 前端框架
- **SvelteKit**：现代化的全栈框架，支持服务端渲染（SSR）
- **Svelte 5**：响应式编程，体验流畅
- **Vite**：快速构建和热更新

### 1.2 后端与数据
- **SvelteKit 服务端路由**：处理 API 请求
- **SQLite**：轻量级关系数据库，适合本地存储
- **better-sqlite3**：Node.js 原生 SQLite 驱动
- **Prisma**：ORM 工具，简化数据库操作（可选）

### 1.3 开发工具
- **TypeScript**：类型安全
- **CSS**：原生 CSS 或 TailwindCSS（可选）
- **pnpm/npm**：包管理

## 2. 项目结构设计

```
science-museum-app/
├── src/
│   ├── lib/
│   │   ├── components/          # UI 组件
│   │   │   ├── Header.svelte
│   │   │   ├── ExhibitCard.svelte
│   │   │   ├── InspectionForm.svelte
│   │   │   ├── FaultReportForm.svelte
│   │   │   └── OperationLog.svelte
│   │   ├── server/
│   │   │   ├── db.ts           # 数据库连接
│   │   │   ├── schema.ts       # 数据模型
│   │   │   └── queries.ts      # 数据库操作
│   │   ├── stores/
│   │   │   └── auth.ts         # 认证状态管理
│   │   └── utils/
│   │       └── helpers.ts      # 工具函数
│   ├── routes/
│   │   ├── +layout.svelte      # 根布局
│   │   ├── +page.svelte         # 首页（工作台）
│   │   ├── exhibits/
│   │   │   ├── +page.svelte     # 展项列表
│   │   │   ├── +page.server.ts  # 展项数据加载
│   │   │   └── [id]/
│   │   │       └── +page.svelte # 展项详情
│   │   ├── inspection/
│   │   │   ├── +page.svelte     # 巡检页面
│   │   │   ├── +page.server.ts  # 巡检数据操作
│   │   │   └── submit/
│   │   │       └── +page.server.ts # 提交巡检
│   │   ├── fault-reports/
│   │   │   ├── +page.svelte     # 故障报修列表
│   │   │   ├── +page.server.ts   # 故障数据加载
│   │   │   ├── [id]/
│   │   │   │   └── +page.svelte # 故障详情与处理
│   │   │   └── receive/
│   │   │       └── +page.server.ts # 接收故障
│   │   ├── api/
│   │   │   ├── exhibits/
│   │   │   │   └── +server.ts   # 展项 API
│   │   │   ├── inspections/
│   │   │   │   └── +server.ts   # 巡检 API
│   │   │   ├── faults/
│   │   │   │   └── +server.ts   # 故障 API
│   │   │   ├── reset/
│   │   │   │   └── +server.ts   # 数据重置 API
│   │   │   └── role-switch/
│   │   │       └── +server.ts   # 角色切换 API
│   │   └── login/
│   │       └── +page.svelte     # 登录页面
├── static/
│   └── favicon.ico
├── prisma/
│   └── schema.prisma            # Prisma 数据模型
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

## 3. 数据库设计

### 3.1 Prisma Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  role      String   // "exhibitor" | "engineer" | "teacher" | "admin"
  createdAt DateTime @default(now())

  inspections    Inspection[]
  faultReports   FaultReport[] @relation("Reporter")
  assignedFaults FaultReport[] @relation("Assignee")
  operationLogs  OperationLog[]
}

model Exhibit {
  id        String   @id @default(cuid())
  name      String
  location  String
  status    String   @default("normal") // "normal" | "inspecting" | "fault_pending" | "repairing"
  createdAt DateTime @default(now())

  inspections Inspection[]
  faultReports FaultReport[]
}

model Inspection {
  id         String   @id @default(cuid())
  exhibitId  String
  inspectorId String
  result     String   // "normal" | "abnormal"
  notes      String?
  createdAt  DateTime @default(now())

  exhibit Exhibit @relation(fields: [exhibitId], references: [id])
  inspector User @relation(fields: [inspectorId], references: [id])
}

model FaultReport {
  id          String    @id @default(cuid())
  exhibitId   String
  reporterId  String
  assigneeId  String?
  description String
  status      String    @default("pending") // "pending" | "processing" | "completed"
  repairNotes String?
  createdAt   DateTime  @default(now())
  receivedAt  DateTime?
  completedAt DateTime?

  exhibit  Exhibit @relation(fields: [exhibitId], references: [id])
  reporter User @relation("Reporter", fields: [reporterId], references: [id])
  assignee User? @relation("Assignee", fields: [assigneeId], references: [id])
  logs     OperationLog[]
}

model OperationLog {
  id         String   @id @default(cuid())
  type       String   // "inspection_submitted" | "fault_reported" | "fault_received" | "fault_processed" | "fault_completed"
  operatorId String
  targetId   String
  targetType String   // "inspection" | "fault_report"
  details    String?
  createdAt  DateTime @default(now())

  operator    User        @relation(fields: [operatorId], references: [id])
  faultReport FaultReport? @relation(fields: [targetId], references: [id])
}
```

### 3.2 数据库初始化
- 应用启动时自动初始化数据库
- 支持数据重置（清空所有表）
- 预设种子数据（展教员、设备工程师、活动老师、管理员）

## 4. API 设计

### 4.1 展项管理
```
GET  /api/exhibits              # 获取展项列表
GET  /api/exhibits/:id          # 获取展项详情
POST /api/exhibits              # 创建展项（管理员）
```

### 4.2 巡检管理
```
GET  /api/inspections           # 获取巡检记录列表
POST /api/inspections            # 提交巡检记录
GET  /api/inspections/:id       # 获取巡检详情
```

### 4.3 故障报修
```
GET    /api/faults              # 获取故障报修列表
POST   /api/faults              # 提交故障报修
GET    /api/faults/:id          # 获取故障详情
PATCH  /api/faults/:id/receive  # 接收故障（工程师）
PATCH  /api/faults/:id/process  # 处理故障（工程师）
PATCH  /api/faults/:id/complete # 完成故障（工程师）
```

### 4.4 系统管理
```
POST /api/reset                 # 重置所有数据
POST /api/role-switch           # 切换用户角色
GET  /api/stats                 # 获取统计数据
```

## 5. 页面路由设计

### 5.1 页面结构
```
/                          # 首页（工作台）
├── 展示：待办事项、风险项、最近变更
├── 操作：根据角色显示快捷入口

/exhibits                  # 展项列表
├── 展示：所有展项卡片，支持筛选
└── 操作：查看展项详情、提交巡检

/exhibits/:id              # 展项详情
├── 展示：展项信息、历史巡检、故障记录
└── 操作：提交巡检、查看故障

/inspection                # 巡检页面
├── 展示：待巡检展项列表
└── 操作：提交巡检结果

/fault-reports             # 故障报修列表
├── 展示：所有故障报修工单
└── 操作：查看详情、接收、处理、完成

/fault-reports/:id         # 故障详情
├── 展示：故障信息、处理时间线、操作日志
└── 操作：接收、处理、完成（根据状态）

/login                     # 登录页面
└── 操作：输入用户名登录
```

## 6. 状态管理

### 6.1 Svelte Store
```typescript
// auth store
interface AuthState {
  user: User | null;
  currentRole: string;
  isLoggedIn: boolean;
}

// 持久化：使用 localStorage 存储当前用户
```

### 6.2 服务端状态
- 数据库为真实数据源
- 页面数据通过 SvelteKit 的 load 函数从服务端获取
- 避免数据只存储在页面内存中

## 7. 安全性考虑

### 7.1 简化认证
- 登录简化：输入用户名即可
- 预设用户表，避免注册流程
- 会话存储在 cookie 或 localStorage

### 7.2 权限控制
- 前端：根据当前角色显示/隐藏功能
- 后端：API 操作前验证权限
- 角色权限表：
  - 展教员：提交巡检、提交故障
  - 设备工程师：接收/处理/完成故障
  - 活动老师：查看、反馈
  - 管理员：所有操作 + 数据重置

### 7.3 数据安全
- SQLite 文件存储在应用目录
- 不提交到版本控制（.gitignore）
- 数据重置需要确认

## 8. 性能优化

### 8.1 首屏加载
- SvelteKit SSR：首屏数据预加载
- 组件懒加载：减少初始 bundle
- CSS 优化：移除未使用样式

### 8.2 数据查询
- 数据库索引：exhibit_id, status, created_at
- 分页查询：列表数据限制返回条数
- 缓存策略：高频查询使用服务端缓存

## 9. 开发与部署

### 9.1 开发环境
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 数据库初始化
pnpm db:push    # 同步 schema
pnpm db:seed    # 种子数据
```

### 9.2 生产构建
```bash
# 构建应用
pnpm build

# 启动生产服务器
pnpm preview
```

## 10. 测试策略

### 10.1 功能测试
- 展项 CRUD 操作
- 巡检提交流程
- 故障处理完整流程
- 角色权限验证

### 10.2 数据测试
- 数据持久化验证
- 数据重置功能
- 操作日志完整性

### 10.3 界面测试
- 首页数据展示
- 响应式布局
- 错误提示
