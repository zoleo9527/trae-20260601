# 人力派遣公司-用工需求与候选人匹配系统

## 项目概述

本系统实现了人力派遣公司的用工需求与候选人匹配管理，包括：
- 用工需求管理
- 候选人管理
- 匹配记录管理
- 退回/补录/复核流程
- 完整的状态追溯机制

## 核心特性

### 1. 主流程设计
```
用工需求创建 → 候选人推荐 → 匹配确认 → 入职/完成
     ↓              ↓           ↓
  退回/补录      退回/补录    退回/补录
     ↓              ↓           ↓
     └──────────── 复核 ←───────┘
```

### 2. 状态追溯机制
每个状态变化都记录：
- 状态变化前后
- 操作人及角色
- 时间戳
- 备注说明
- 附件（旧台账、现场记录、沟通截图）

### 3. 异常处理
- **退回**：当匹配不符合要求时退回
- **补录**：补充遗漏的信息
- **复核**：管理人员复核确认

### 4. 前后端分离
- 后端：Express + Prisma + SQLite
- 前端：Vue 3 + Element Plus

## 快速启动

### 后端启动

```bash
cd labor-dispatch/server

# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 初始化数据库
npx prisma db push

# 初始化数据（创建演示账号）
npm run seed

# 启动服务
npm run dev
```

服务将在 http://localhost:3001 启动

### 前端启动

```bash
cd labor-dispatch/client

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:5173 启动

### 演示账号

- **管理员**：admin / admin123
- **一线人员**：user / user123

## 数据库模型

### 核心表结构

1. **LaborDemand** - 用工需求
   - 基本信息、工作要求
   - 状态：待处理、处理中、匹配中、已完成、已取消

2. **Candidate** - 候选人
   - 基本信息、技能、工作经验
   - 状态：待匹配、匹配中、已推荐、已入职、已离职

3. **MatchingRecord** - 匹配记录
   - 用工需求与候选人的匹配关系
   - 状态：待确认、面试中、已入职、已拒绝、已取消

4. **StatusHistory** - 状态历史
   - 所有状态变化的完整追溯记录
   - 记录：状态变化、操作人、时间、备注

5. **ReturnRecord** - 退回/补录/复核记录
   - 异常处理的完整记录

6. **Attachment** - 附件
   - 支持旧台账、现场记录、沟通截图等

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户

### 用工需求
- `GET /api/labor-demands` - 列表
- `POST /api/labor-demands` - 创建
- `GET /api/labor-demands/:id` - 详情
- `PUT /api/labor-demands/:id` - 更新
- `PUT /api/labor-demands/:id/status` - 更新状态

### 候选人
- `GET /api/candidates` - 列表
- `POST /api/candidates` - 创建
- `GET /api/candidates/:id` - 详情
- `PUT /api/candidates/:id` - 更新
- `PUT /api/candidates/:id/status` - 更新状态

### 匹配记录
- `GET /api/matchings` - 列表
- `POST /api/matchings` - 创建匹配
- `GET /api/matchings/:id` - 详情
- `PUT /api/matchings/:id/confirm` - 确认
- `POST /api/matchings/:id/return` - 退回
- `POST /api/matchings/:id/supplement` - 补录
- `POST /api/matchings/:id/review` - 复核

### 退回/补录/复核
- `GET /api/return-records` - 列表
- `GET /api/return-records/:id` - 详情
- `PUT /api/return-records/:id/handle` - 处理

### 状态历史
- `GET /api/status-histories` - 列表（完整追溯）

### 仪表板
- `GET /api/dashboard/stats` - 统计数据
- `GET /api/dashboard/todo-list` - 待办列表

## 关键设计要点

### 1. 责任追溯
每次操作都记录：
- 谁做的
- 什么时候做的
- 做了什么
- 为什么做

### 2. 数据一致性
一线处理和管理回看基于同一份数据，确保：
- 状态实时同步
- 历史可追溯
- 信息完整不丢失

### 3. 异常处理流程
```
退回/补录/复核 → 创建ReturnRecord → 状态追溯 → 责任人处理
```

### 4. 附件管理
支持上传：
- 旧台账
- 现场记录
- 沟通截图
- 其他文件

所有附件都与状态历史关联，可追溯。
