# 燃气维保站-停复气申请与客户回访系统

燃气维保站综合管理系统，解决安检表、隐患通知和换表记录之间缺少交接的问题，明确停复气申请和客户回访之间的责任边界。

## 核心功能

### 角色划分

| 角色 | 核心权限 |
|------|----------|
| **安检员** | 创建安检记录、发现安全隐患、填写安检报告 |
| **客服** | 创建停复气申请、处理客户回访、跟踪申请状态 |
| **维修师傅** | 处理隐患整改、执行换表操作、更新处理进度 |

### 主要模块

1. **燃气维保工作台** - 展示待处理统计、快捷入口、最近记录
2. **停复气申请管理** - 列表筛选、创建申请、审核处理、状态流转
3. **客户回访管理** - 回访任务分配、记录回访结果、查看回访历史
4. **安检记录管理** - 创建安检、记录检查项目、关联隐患通知
5. **隐患通知管理** - 隐患等级分类、处理进度跟踪、关联申请
6. **换表记录管理** - 换表信息记录、新旧表对比、关联申请

### 核心流程

**停复气申请流程**：
客户申请 → 客服审核 → 维修师傅执行 → 客户回访确认 → 完成

**客户回访流程**：
回访任务创建 → 客服拨打电话 → 记录回访结果 → 关联申请状态变更感知

**安检流程**：
安检员上门检查 → 记录检查项目 → 发现隐患自动生成通知 → 隐患处理后闭环

## 技术栈

- **前端**：Vue 3 + TypeScript + Vue Router + Tailwind CSS + Lucide Icons
- **后端**：Express 4 + TypeScript (ESM)
- **数据库**：SQLite (better-sqlite3)，单文件存储
- **构建工具**：Vite

## 启动方式

### 前置要求

- Node.js >= 18
- pnpm 或 npm

### 安装依赖

```bash
pnpm install
# 或
npm install
```

### 启动开发环境

```bash
# 同时启动前端和后端
pnpm dev
# 或
npm run dev
```

启动后：
- 前端地址：http://localhost:5173
- 后端地址：http://localhost:3001
- API 已通过 Vite 代理配置，前端可直接调用 `/api/*`

### 单独启动

```bash
# 仅启动前端
pnpm client:dev

# 仅启动后端
pnpm server:dev
```

### 生产构建

```bash
pnpm build
pnpm preview
```

## 数据重置方式

### 方式一：API 调用（推荐）

```bash
curl -X POST http://localhost:3001/api/reset
```

### 方式二：删除数据库文件

数据库文件位于 `data/app.db`，删除后重启服务会自动重新创建并填充种子数据：

```bash
rm -rf data/app.db
pnpm dev
```

重置后会恢复初始种子数据，包含：
- 5 个停复气申请（包含不同状态）
- 4 个客户回访记录
- 3 个安检记录
- 3 个隐患通知
- 2 个换表记录

## 模拟能力说明

以下功能为演示模拟，非真实生产实现：

### 1. 用户认证与角色切换（模拟）
- ❌ 无真实的用户名/密码登录
- ❌ 无 Token 认证机制
- ✅ 通过 `POST /api/role` 模拟角色切换，服务端存储当前选择的角色
- ✅ 前端根据当前角色显示/隐藏操作按钮

### 2. 文件附件上传（模拟）
- ❌ 无真实文件上传存储
- ✅ 前端 UI 预留上传入口，实际仅记录文本描述

### 3. 消息通知（模拟）
- ❌ 无真实的站内信、邮件、短信通知
- ✅ 通过操作日志和状态变更隐式传递信息
- ✅ 停复气申请状态变更后，客户回访列表可感知更新

### 4. 导出功能（模拟）
- ❌ 无真实的 Excel/PDF 导出
- ✅ UI 实现 CSV 格式导出，数据从前端直接生成下载

### 5. 批量操作（模拟）
- ✅ 支持批量选择、批量导出功能

### 6. 空状态处理（模拟）
- ✅ 所有列表页实现空状态展示，引导用户创建新记录

## 重点测试功能

### 角色切换
1. 首页选择不同角色进入
2. 侧边栏底部点击"切换角色"可返回角色选择页
3. 验证不同角色看到的工作台数据和操作按钮权限差异

### 停复气申请处理
1. 客服可新建停复气申请
2. 审核申请（通过/拒绝）
3. 维修师傅执行申请
4. 申请状态变更后，客户回访列表可感知

### 客户回访回看
1. 回访详情页查看回访记录
2. 查看关联的停复气申请
3. 记录回访结果

### 安检记录管理
1. 创建安检记录，填写检查项目
2. 标记合格/不合格项
3. 自动计算检查结果

### 隐患通知管理
1. 查看隐患列表，按等级和状态筛选
2. 标记隐患为已处理
3. 查看处理建议

### 换表记录管理
1. 创建换表记录
2. 记录新旧表信息对比
3. 关联停复气申请

## 项目结构

```
├── api/                    # 后端代码
│   ├── routes/            # API 路由
│   │   ├── auth.ts
│   │   ├── role.ts
│   │   ├── tests.ts       # 联调测试接口
│   │   ├── issues.ts      # 问题整改接口
│   │   ├── logs.ts        # 操作日志接口
│   │   ├── stats.ts       # 统计数据接口
│   │   └── gas.ts         # 燃气维保接口
│   ├── app.ts             # Express 应用
│   ├── db.ts              # 数据库连接和重置
│   ├── seed.ts            # 种子数据
│   └── types.ts           # TypeScript 类型定义
├── src/                    # 前端代码
│   ├── api/               # API 请求封装
│   │   └── gas.ts         # 燃气维保 API
│   ├── components/        # 通用组件
│   │   ├── Sidebar.vue
│   │   ├── StatusTag.vue
│   │   ├── Timeline.vue
│   │   └── IssueProgressTimeline.vue
│   ├── layouts/           # 布局组件
│   │   └── MainLayout.vue
│   ├── pages/             # 页面组件
│   │   ├── RoleSelect.vue
│   │   ├── Dashboard.vue
│   │   ├── GasHome.vue          # 燃气维保工作台
│   │   ├── ApplicationList.vue  # 停复气申请列表
│   │   ├── ApplicationDetail.vue
│   │   ├── ApplicationNew.vue
│   │   ├── VisitList.vue        # 客户回访列表
│   │   ├── VisitDetail.vue
│   │   ├── VisitNew.vue
│   │   ├── SafetyCheckList.vue  # 安检记录列表
│   │   ├── SafetyCheckDetail.vue
│   │   ├── SafetyCheckNew.vue
│   │   ├── HiddenDangerList.vue # 隐患通知列表
│   │   ├── HiddenDangerDetail.vue
│   │   ├── MeterChangeList.vue  # 换表记录列表
│   │   ├── MeterChangeDetail.vue
│   │   ├── MeterChangeNew.vue
│   │   └── ...其他页面
│   ├── router/            # 路由配置
│   ├── stores/            # 状态管理
│   │   └── role.ts
│   ├── types/             # TypeScript 类型定义
│   │   └── gas.ts         # 燃气维保类型
│   └── App.vue
├── data/                   # SQLite 数据库文件（运行时生成）
├── package.json
├── vite.config.ts
└── README.md
```

## API 接口

### 燃气维保接口

#### 停复气申请
- `GET /api/gas/applications` - 获取申请列表
- `GET /api/gas/applications/:id` - 获取申请详情
- `POST /api/gas/applications` - 创建申请
- `PUT /api/gas/applications/:id` - 更新申请
- `PUT /api/gas/applications/:id/approve` - 审核通过
- `PUT /api/gas/applications/:id/reject` - 审核拒绝
- `PUT /api/gas/applications/:id/complete` - 完成申请

#### 客户回访
- `GET /api/gas/visits` - 获取回访列表
- `GET /api/gas/visits/:id` - 获取回访详情
- `POST /api/gas/visits` - 创建回访
- `PUT /api/gas/visits/:id/complete` - 完成回访

#### 安检记录
- `GET /api/gas/safety-checks` - 获取安检列表
- `GET /api/gas/safety-checks/:id` - 获取安检详情
- `POST /api/gas/safety-checks` - 创建安检记录

#### 隐患通知
- `GET /api/gas/hidden-dangers` - 获取隐患列表
- `GET /api/gas/hidden-dangers/:id` - 获取隐患详情
- `PUT /api/gas/hidden-dangers/:id` - 更新隐患状态

#### 换表记录
- `GET /api/gas/meter-changes` - 获取换表列表
- `GET /api/gas/meter-changes/:id` - 获取换表详情
- `POST /api/gas/meter-changes` - 创建换表记录

#### 统计数据
- `GET /api/gas/stats` - 获取燃气维保工作台统计数据

### 其他接口

#### 角色
- `GET /api/role` - 获取当前角色
- `POST /api/role` - 设置当前角色 `{ role: "safety_inspector" | "customer_service" | "repair_technician" }`

#### 联调测试
- `GET /api/tests?status=&project=&date_from=&date_to=` - 获取测试列表
- `GET /api/tests/:id` - 获取测试详情
- `POST /api/tests` - 创建测试
- `PUT /api/tests/:id/execute` - 执行测试项
- `PUT /api/tests/:id/complete` - 完成测试
- `POST /api/tests/:id/convert-to-issue` - 未通过项转问题整改

#### 问题整改
- `GET /api/issues?status=&assignee=&severity=` - 获取问题列表
- `GET /api/issues/:id` - 获取问题详情
- `POST /api/issues` - 创建问题
- `PUT /api/issues/:id/assign` - 指派责任人
- `PUT /api/issues/:id/progress` - 更新整改进度
- `PUT /api/issues/:id/complete` - 提交整改完成
- `PUT /api/issues/:id/verify` - 验证整改结果

#### 其他
- `GET /api/stats` - 获取工作台统计数据
- `GET /api/logs?entity_type=&entity_id=` - 获取操作日志
- `POST /api/reset` - 重置数据库

## 数据模型

### 停复气申请 (GasApplication)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 申请编号 |
| customer_name | string | 客户名称 |
| customer_phone | string | 联系电话 |
| address | string | 地址 |
| type | string | 申请类型 (stop/resume) |
| reason | string | 申请原因 |
| status | string | 状态 (pending/approved/executing/completed/canceled) |
| apply_time | string | 申请时间 |
| approver | string | 审核人 |
| executor | string | 执行人 |
| execute_time | string | 执行时间 |

### 客户回访 (CustomerVisit)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 回访编号 |
| application_id | string | 关联申请编号 |
| customer_name | string | 客户名称 |
| customer_phone | string | 联系电话 |
| type | string | 回访类型 |
| status | string | 状态 (pending/completed) |
| result | string | 回访结果 |
| remark | string | 备注 |
| visit_time | string | 回访时间 |
| visitor | string | 回访人 |

### 安检记录 (SafetyCheck)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 安检编号 |
| customer_name | string | 客户名称 |
| address | string | 地址 |
| inspector | string | 安检员 |
| check_date | string | 检查日期 |
| items | array | 检查项目列表 |
| overall_result | string | 总体结果 (passed/failed) |

### 隐患通知 (HiddenDanger)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 隐患编号 |
| customer_name | string | 客户名称 |
| address | string | 地址 |
| level | string | 等级 (critical/major/minor) |
| status | string | 状态 (pending/in_progress/completed) |
| description | string | 隐患描述 |
| created_at | string | 创建时间 |
| rectified_by | string | 处理人 |
| verify_result | string | 验证结果 |

### 换表记录 (MeterChange)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 换表编号 |
| customer_name | string | 客户名称 |
| address | string | 地址 |
| technician | string | 维修师傅 |
| change_date | string | 换表日期 |
| old_meter_number | string | 原表号 |
| new_meter_number | string | 新表号 |
| meter_type | string | 表型 |
| old_meter_reading | string | 原表读数 |
| new_meter_reading | string | 新表读数 |
