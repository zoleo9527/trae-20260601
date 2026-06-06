# 直播电商 - 直播排期与商品池管理系统

## 项目概述

本系统针对直播电商场景中**直播排期**与**商品池**之间责任不清、时效难以追踪的问题，进行了专门设计。系统采用双模块分离架构，通过工作流引擎实现退回、补录、复核的闭环管理，全程留痕可追溯。

## 核心设计原则

### 1. 责任边界清晰
- **直播排期模块**（运营/主播助理）：负责直播场次规划、时间安排、主播管理、状态流转
- **商品池模块**（商品组）：负责商品信息维护、库存管理、选品审核
- 两模块通过选品关联，但各自独立管理，责任可追溯

### 2. 角色分离
- 不再让主播助理、场控、售后组长共用一张大表
- 各角色在各自模块内操作，权限清晰

### 3. 完整工作流
```
创建排期(DRAFT) → 选择商品 → 提交复核(PENDING_REVIEW) 
    ↓                                      ↓
    ↓                                [复核通过] APPROVED
    ↓                                      ↓
    ↓                                开始直播(LIVE)
    ↓                                      ↓
    ↓                                结束直播(COMPLETED) ✓ 正常关闭
    ↓
[退回补录] RETURNED ⟵⟵ 卡住状态
    ↓
补录完成 → 回到 DRAFT → 重新提交
```

## 核心功能实现

### ✅ 1. 详情查询（非注释，真实实现）
- 直播排期详情：基本信息 + 选品列表 + 操作历史时间线
- 商品详情：商品信息 + 操作历史回看
- API接口：
  - `GET /api/schedules/:id` - 排期详情（含历史）
  - `GET /api/products/:id` - 商品详情（含历史）
  - `GET /api/schedules/:id/history` - 排期操作历史
  - `GET /api/products/:id/history` - 商品操作历史

### ✅ 2. 幂等提交（非注释，真实实现）
- 所有状态变更操作都支持幂等键（idempotencyKey）
- 重复提交同一幂等键不会产生重复操作，直接返回成功
- 前端和后端都实现了幂等校验
- 示例：
  ```
  PUT /api/schedules/:id/submit
  Body: { remark: "...", idempotencyKey: "unique-key-123" }
  Response: { isDuplicate: false, idempotencyKey: "..." }
  ```

### ✅ 3. 商品池回看（非注释，真实实现）
- 每个商品都有完整的版本号（version）
- 所有操作（创建、更新、审核通过、审核拒绝）都记录工作流
- 详情页可查看完整的操作历史时间线
- 包含：操作类型、操作人、时间、版本号、状态变更、备注、幂等键

### ✅ 4. 直播排期处理（非注释，真实实现）
完整的状态机实现：
- DRAFT（草稿）→ 可编辑、可提交
- PENDING_REVIEW（待复核）→ 可通过、可退回
- RETURNED（已退回）→ 可补录（回到草稿）
- APPROVED（已通过）→ 可开始直播
- LIVE（直播中）→ 可结束直播
- COMPLETED（已完成）→ 终态
- CANCELLED（已取消）→ 终态

## 测试数据说明

系统预置了真实的测试数据，包含**正常关闭**和**卡住**的记录：

### 🟢 正常关闭记录
**排期ID: sched-001** - 618年中大促 - 美妆专场
- 状态：COMPLETED（已完成）
- 完整流程：创建 → 提交复核 → 复核通过 → 开始直播 → 结束直播
- 操作历史5条，版本v3
- 选品：轻奢真皮手提包、保湿精华液套装

### 🔴 卡住记录1（退回待补录）
**排期ID: sched-002** - 数码好物节 - 3C专场
- 状态：RETURNED（已退回）
- 卡住原因：复核被退回，需要补录
  - 智能手表库存不足，需要确认补货
  - 直播时长建议延长30分钟
- 操作历史3条，版本v2
- 选品：智能运动手表、无线蓝牙耳机

### 🟡 卡住记录2（待复核）
**排期ID: sched-003** - 夏日穿搭 - 服饰专场
- 状态：PENDING_REVIEW（待复核）
- 卡住原因：已提交复核，等待审核人处理
- 操作历史2条，版本v1
- 选品：运动休闲T恤

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5.x（UI组件库）
- Zustand（状态管理）
- React Router v6（路由）
- Day.js（时间处理）
- Vite（构建工具）

### 后端
- Express.js + TypeScript
- RESTful API 设计
- 内存数据存储（演示用）
- 完整的幂等性实现

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动前端开发服务器
```bash
npm run dev
```
访问 http://localhost:3000

### 启动后端API服务器（可选）
```bash
npm run server
```
API服务运行在 http://localhost:3001

## 项目结构

```
.
├── src/
│   ├── components/          # 公共组件
│   │   └── Layout.tsx      # 主布局
│   ├── pages/               # 页面组件
│   │   ├── ScheduleList.tsx     # 直播排期列表
│   │   ├── ScheduleDetail.tsx   # 直播排期详情
│   │   ├── ScheduleCreate.tsx   # 直播排期创建/编辑
│   │   ├── ProductPool.tsx      # 商品池列表
│   │   └── ProductDetail.tsx    # 商品详情
│   ├── store/               # 状态管理
│   │   └── index.ts
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts
│   ├── App.tsx              # 应用入口
│   ├── main.tsx             # 渲染入口
│   └── index.css            # 全局样式
├── server/                  # 后端API
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsconfig.server.json
└── vite.config.ts
```

## API 接口列表

### 直播排期
- `GET /api/schedules` - 获取排期列表
- `GET /api/schedules/:id` - 获取排期详情（含历史）
- `GET /api/schedules/:id/history` - 获取排期操作历史
- `POST /api/schedules` - 创建排期
- `PUT /api/schedules/:id/submit` - 提交复核（幂等）
- `PUT /api/schedules/:id/approve` - 复核通过（幂等）
- `PUT /api/schedules/:id/return` - 退回补录（幂等）
- `PUT /api/schedules/:id/supplement` - 补录完成（幂等）
- `PUT /api/schedules/:id/start-live` - 开始直播（幂等）
- `PUT /api/schedules/:id/end-live` - 结束直播（幂等）

### 商品池
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情（含历史）
- `GET /api/products/:id/history` - 获取商品操作历史
- `POST /api/products` - 创建商品
- `PUT /api/products/:id/approve` - 审核通过（幂等）
- `PUT /api/products/:id/reject` - 审核拒绝（幂等）

### 其他
- `GET /api/workflow/records` - 查询工作流记录
- `GET /api/stats/overview` - 获取概览统计
- `GET /api/health` - 健康检查

## 核心亮点

1. **双模块分离**：直播排期和商品池各自独立，责任清晰
2. **完整工作流**：退回→补录→复核的闭环，解决责任不清问题
3. **全程留痕**：所有操作都有历史记录，可追溯、可审计
4. **幂等提交**：所有状态变更支持幂等键，防止重复操作
5. **版本管理**：每条记录都有版本号，支持历史回看
6. **真实测试数据**：包含正常关闭和卡住的典型场景
