# 二手车检测报告与整备计划管理系统

## 系统概述

这是一个基于 Remix + PostgreSQL 的二手车检测报告与整备计划管理系统，实现了收车经理→评估师→金融专员的接力式工作流程。所有状态变化、责任人、时间点和备注都持久化到数据库中，确保责任可追溯。

## 核心特性

### 1. 接力式工作流程
- **收车经理**：负责车辆入库、预算审批、状态确认
- **评估师**：负责车辆检测、创建整备任务、任务执行
- **金融专员**：负责贷款申请、资料管理、金融审批

### 2. 状态追踪与审计
- 所有状态变更自动记录到 `status_history` 表
- 所有操作自动记录到 `operation_records` 表
- 时间线自动生成，展示完整操作历史

### 3. 检测报告管理
- 支持检测项目分类（外观、内饰、机械、电气、底盘）
- 事故标注功能，记录事故位置、严重程度、核实状态
- 综合评分和关键问题标识

### 4. 整备计划管理
- 任务创建、状态更新、成本追踪
- 成本变更历史记录
- 预算预警和超预算提醒

### 5. 金融资料管理
- 贷款申请和资料文件管理
- 提醒功能和逾期状态
- 完整的资料追踪记录

## 数据库架构

### 核心表结构

```sql
-- 用户表
users (id, name, role, phone, created_at)

-- 车辆表
vehicles (id, license_plate, brand, model, year, mileage, color, 
          purchase_price, estimated_value, status, 
          manager_id, assessor_id, finance_id,
          current_assignee_id, current_assignee_role,
          created_at, updated_at)

-- 状态历史表
status_history (id, vehicle_id, status, changed_by, changed_by_name, 
                changed_at, note)

-- 检测报告表
inspection_reports (id, vehicle_id, inspector_id, overall_score, 
                    conclusion, recommendations, has_accident_records, 
                    accident_count, critical_issues, created_at, updated_at)

-- 检测项目表
inspection_items (id, report_id, category, name, description, status, 
                   score, note, inspector_id, inspected_at, is_accident)

-- 事故标注表
accident_annotations (id, report_id, item_id, severity, description, 
                      location, annotated_by, annotated_at, 
                      verified_by, verified_at, note)

-- 整备任务表
preparation_tasks (id, vehicle_id, title, description, cost, 
                   estimated_cost, estimated_hours, actual_hours, 
                   status, assignee_id, assignee_name, due_date, 
                   completed_at, note, created_by, created_by_name,
                   created_at, updated_at)

-- 任务成本历史表
task_cost_history (id, task_id, cost, changed_by, changed_by_name, 
                   changed_at, reason)

-- 时间线事件表
timeline_events (id, vehicle_id, type, title, description, 
                 actor_id, actor_name, created_at, metadata)

-- 金融记录表
finance_records (id, vehicle_id, type, document_name, status, 
                 assignee_id, assignee_name, due_date, 
                 reminded_count, last_reminded_at, note, 
                 created_by, created_by_name, updated_at)

-- 操作记录表（审计）
operation_records (id, vehicle_id, type, action, 
                   previous_value, new_value, 
                   actor_id, actor_name, actor_role, 
                   created_at, note, metadata)

-- 成本预算表
cost_budgets (vehicle_id, estimated_budget, actual_cost, 
              warning_threshold, overrun_threshold, 
              last_updated_by, last_updated_at)

-- 状态转换配置表
status_transition_configs (id, from_status, to_status, 
                           required_role, allowed_roles, 
                           required_fields, auto_notify_roles, 
                           timeout_hours, description)
```

## 安装与配置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/used_car_inspection?schema=public"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 创建数据库迁移
npm run db:migrate

# 导入种子数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

## API 接口

### 车辆列表
- **GET** `/api/vehicles` - 获取车辆列表（支持筛选）
  - 参数：`search`, `status`, `role`, `managerId`

### 车辆详情
- **GET** `/api/vehicles/:id` - 获取车辆详情
- **POST** `/api/vehicles/:id` - 执行操作
  - `updateStatus`: 更新车辆状态
  - `createTask`: 创建整备任务
  - `updateTaskStatus`: 更新任务状态
  - `updateTaskCost`: 更新任务成本
  - `createFinanceRecord`: 创建金融记录
  - `updateFinanceStatus`: 更新金融记录状态

### 用户列表
- **GET** `/api/users` - 获取用户列表
  - 参数：`role`（可选）

## 状态流转规则

```
pending → inspected (评估师完成检测)
inspected → preparing (经理确认预算)
preparing → completed (所有任务完成且成本确认)
pending → cancelled (经理取消收购)
```

## 数据持久化要点

### 状态变更记录
每次状态变更都会自动记录：
- 变更前的状态
- 变更后的状态
- 操作人ID和姓名
- 操作人角色
- 变更时间
- 备注说明

### 操作审计记录
所有关键操作都会记录到 `operation_records` 表：
- 操作类型（status_change, task, finance等）
- 操作动作
- 变更前后的值
- 操作人信息
- 操作时间
- 详细备注
- 元数据（JSON格式）

### 时间线自动生成
系统自动从以下来源生成时间线：
- 状态历史记录
- 检测报告生成
- 任务创建和完成
- 金融记录创建和更新
- 操作审计记录

## 技术栈

- **前端框架**: Remix (React)
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **样式**: Tailwind CSS
- **日期处理**: date-fns
- **语言**: TypeScript

## 开发命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck

# 数据库管理
npm run db:generate  # 生成 Prisma 客户端
npm run db:migrate   # 创建迁移
npm run db:seed      # 导入种子数据
npm run db:studio    # 打开 Prisma Studio
```

## 注意事项

1. **数据完整性**: 所有状态变更和操作都会自动记录，确保责任可追溯
2. **接力流程**: 每个角色只能执行其权限范围内的操作
3. **成本追踪**: 任务成本变更会记录完整历史，防止预算争议
4. **事故标注**: 检测报告中的事故信息需要核实，确保信息准确
5. **金融资料**: 资料缺失和逾期状态自动标识，便于跟进

## 未来扩展

- 用户权限管理系统
- 消息通知功能
- 数据导出功能
- 统计报表功能
- 移动端适配