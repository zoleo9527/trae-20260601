# 中央厨房-菜品报量与生产排程系统

## 系统概述

本系统专为中央厨房设计，解决以下核心问题：
- ✅ **临时加单**：独立的加急单流程，优先处理
- ✅ **过敏原标识**：强制过敏原确认机制，避免漏写
- ✅ **责任追溯**：完整的操作日志记录，门店收货有据可查
- ✅ **时效管理**：状态流转全程追踪，超时预警

## 角色分离

### 🏪 门店督导
- **报量录入**：批量选择菜品、录入报量，强制确认过敏原
- **临时加单**：加急单单独录入，自动标记优先处理
- **历史记录**：查看报单历史和操作日志

### 👨‍🍳 生产班长
- **生产排程**：自动汇总报单生成生产计划，批量更新状态
- **生产看板**：可视化生产进度，加急单醒目提示
- **历史回看**：追溯历史生产数据和操作记录

### 📦 采购主管
- **报量汇总**：按菜品/门店多维度汇总报量数据
- **采购清单**：自动计算原材料需求量（含10%损耗）
- **历史记录**：查询采购历史数据

## 技术栈

- **前端**：Next.js + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes
- **数据库**：SQLite (better-sqlite3)
- **数据持久化**：本地文件存储

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run db:seed
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用系统。

## 数据管理

### 重置数据库

```bash
npm run db:reset
```

### 重新初始化数据

```bash
npm run db:reset && npm run db:seed
```

数据库文件位置：`data/central-kitchen.db`

## API 接口

### 门店管理
- `GET /api/stores` - 获取门店列表
- `POST /api/stores` - 新增门店

### 菜品管理
- `GET /api/dishes` - 获取菜品列表
- `POST /api/dishes` - 新增菜品

### 报单管理
- `GET /api/orders` - 查询报单列表（支持日期、门店、状态筛选）
- `POST /api/orders` - 新增单个报单
- `PUT /api/orders/:id` - 更新报单
- `DELETE /api/orders/:id` - 取消报单
- `POST /api/orders/batch` - 批量创建报单
- `PUT /api/orders/batch` - 批量更新报单状态

### 生产排程
- `GET /api/schedules` - 查询排程列表
- `POST /api/schedules` - 生成生产排程
- `PUT /api/schedules/:id` - 更新排程
- `PUT /api/schedules/batch` - 批量更新排程

### 操作日志
- `GET /api/logs` - 查询操作日志

## 模拟能力说明

以下功能为模拟实现，生产环境需要对接真实系统：

### 🔶 用户认证
- 当前：无登录，直接选择角色进入
- 生产环境建议：对接企业SSO或账号密码系统

### 🔶 配送管理
- 当前：未实现配送签收流程
- 生产环境建议：对接配送系统，支持电子签收

### 🔶 库存管理
- 当前：采购清单为估算值
- 生产环境建议：对接ERP系统，实时计算库存需求

### 🔶 消息通知
- 当前：无推送通知
- 生产环境建议：集成企业微信/钉钉/短信通知

### 🔶 报表导出
- 当前：仅支持采购清单打印
- 生产环境建议：支持Excel/PDF导出

## 数据库表结构

### stores（门店表）
- id, name, code, address, contact, created_at

### dishes（菜品表）
- id, name, code, category, allergens, unit, specification, production_time, is_active, created_at

### daily_orders（日报单表）
- id, order_date, store_id, dish_id, quantity, is_urgent, allergens_confirmation, special_instructions, status, created_by, created_at, updated_at

### production_schedules（生产排程表）
- id, schedule_date, dish_id, total_quantity, start_time, end_time, status, assigned_to, notes, created_at, updated_at

### production_batches（生产批次表）
- id, schedule_id, batch_number, quantity, status, started_at, completed_at, operator

### deliveries（配送表）
- id, delivery_date, store_id, order_id, dish_id, quantity, status, dispatched_at, received_at, received_by, receiver_signature, notes

### operation_logs（操作日志表）
- id, operation_type, entity_type, entity_id, old_value, new_value, operator, timestamp, notes

## 目录结构

```
├── src/
│   ├── components/       # 公共组件
│   ├── lib/             # 工具库（数据库等）
│   ├── pages/
│   │   ├── api/         # API接口
│   │   ├── supervisor/  # 门店督导页面
│   │   ├── production/  # 生产班长页面
│   │   ├── procurement/ # 采购主管页面
│   │   ├── _app.tsx
│   │   └── index.tsx
│   ├── styles/          # 样式文件
│   └── types/           # TypeScript类型定义
├── scripts/             # 数据库脚本
├── data/                # 数据库文件
└── README.md
```

## 注意事项

1. 过敏原确认为必填项，防止漏填
2. 加急单会在所有页面优先显示
3. 所有操作都会记录日志，便于追溯责任
4. 数据库文件需定期备份
5. 生产环境建议使用PostgreSQL/MySQL替代SQLite
