# 中央厨房 - 原料领用与过敏原复核 API

## 项目概述

基于 Go Fiber 框架实现的中央厨房原料领用与过敏原复核系统后端，采用 **采购主管 → 生产班长 → 门店督导** 的接力式工作流，确保原料从采购到生产使用的全链路可追溯。

### 核心设计理念

> **原料领用不是终点，过敏原复核也不是独立菜单**

系统将过敏原复核深度整合进原料领用流程：
```
采购主管创建采购单 → 确认收货
    ↓
生产班长创建领用单 → 领用原料 → 发起过敏原复核 → 提交复核结果
    ↓
门店督导确认复核结果 → 流程闭环
```

所有操作均留有操作日志，可完整追溯每一步的推进动作。

---

## 技术栈

- **框架**: Go Fiber v2
- **数据库**: SQLite (可无缝切换至 MySQL/PostgreSQL)
- **认证**: JWT (HS256)
- **密码加密**: bcrypt
- **ORM**: GORM

---

## 快速开始

### 启动服务

```bash
cd server
go build -o central-kitchen ./cmd/main.go
./central-kitchen
```

服务默认运行在 `http://localhost:8080`

### 默认账号 (密码均为 `pass123`)

| 用户名 | 角色 | 中文名 | 权限 |
|--------|------|--------|------|
| `procurement1` | procurement_manager | 张采购 | 采购主管：创建/审批采购单 |
| `production1` | production_foreman | 李班长 | 生产班长：创建领用单、领用原料、发起/提交过敏原复核 |
| `store1` | store_supervisor | 王督导 | 门店督导：确认过敏原复核结果 |

---

## API 接口总览

### 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录获取 token | 公开 |
| GET | `/api/auth/me` | 获取当前用户信息 | 已登录 |
| GET | `/api/auth/users` | 获取所有用户列表 | 已登录 |

### 采购单接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/purchase-orders` | 获取采购单列表 | 已登录 |
| GET | `/api/purchase-orders/:id` | 获取采购单详情 | 已登录 |
| GET | `/api/purchase-orders/:id/logs` | 获取采购单操作日志 | 已登录 |
| POST | `/api/purchase-orders` | 创建采购单 | 采购主管 |
| PATCH | `/api/purchase-orders/:id/status` | 更新采购单状态 | 采购主管 |

### 领用单接口 (核心流程)

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/requisitions` | 获取领用单列表 | 已登录 |
| GET | `/api/requisitions/:id` | 获取领用单详情 (含关联的复核单) | 已登录 |
| GET | `/api/requisitions/:id/logs` | 获取领用单操作日志 (推进轨迹) | 已登录 |
| POST | `/api/requisitions` | 创建领用单 | 生产班长 |
| POST | `/api/requisitions/:id/pick` | 原料领用 (确认实际领用数量) | 生产班长 |
| POST | `/api/requisitions/:id/initiate-allergen-review` | 发起过敏原复核 | 生产班长 (必须是领用人本人) |
| PATCH | `/api/requisitions/:id/status` | 更新领用单状态 | 已登录 |

### 过敏原复核接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/allergen-reviews` | 获取复核单列表 | 已登录 |
| GET | `/api/allergen-reviews/history` | 过敏原复核回看 (支持按领用单/日期筛选) | 已登录 |
| GET | `/api/allergen-reviews/:id` | 获取复核单详情 | 已登录 |
| GET | `/api/allergen-reviews/:id/logs` | 获取复核单操作日志 | 已登录 |
| GET | `/api/allergen-reviews/requisition/:requisitionId` | 按领用单查询复核单 | 已登录 |
| POST | `/api/allergen-reviews/:id/submit` | 提交过敏原复核结果 | 生产班长 (必须是发起人) |
| POST | `/api/allergen-reviews/:id/verify` | 门店督导确认复核结果 | 门店督导 |

### 其他接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 | 公开 |
| GET | `/api/error-codes` | 错误码列表 | 公开 |

---

## 状态流转

### 采购单状态

```
draft (草稿) → approved (已审批) → in_transit (运输中) → received (已收货)
                    ↓
                 rejected (已驳回)
```

### 领用单状态 (核心流程)

```
pending (待领用) → picked (已领用) → allergen_pending (待复核)
                                                        ↓
                              allergen_passed (复核通过) / allergen_failed (复核不通过)
                                                        ↓
                                                  completed (已完成)
```

### 过敏原复核单状态

```
pending (待填写) → passed (通过) → 门店督导确认后流程结束
                     ↓
                  failed (不通过)
```

---

## 错误码

| 错误码 | 类别 | 说明 |
|--------|------|------|
| `0` | - | 成功 |
| `10001` | 通用 | 参数错误 |
| `10002` | 通用 | 未授权 |
| `10003` | 通用 | 禁止访问 |
| `10004` | 通用 | 资源不存在 |
| `10005` | 通用 | 服务器内部错误 |
| `10006` | 通用 | 资源冲突 |
| `30001` | 采购单 | 采购单不存在 |
| `30002` | 采购单 | 采购单状态不支持该操作 |
| `40001` | 领用单 | 领用单不存在 |
| `40002` | 领用单 | 领用单状态不支持该操作 |
| `40004` | 领用单 | 采购单尚未收货 |
| `40005` | 领用单 | 库存不足 |
| `50001` | 复核单 | 复核单不存在 |
| `50002` | 复核单 | 复核单状态不支持该操作 |
| `50003` | 复核单 | 该领用单已存在复核单 |
| `50004` | 复核单 | 只有领用人本人才能发起复核 |
| `60001` | 权限 | 角色权限不足 |

---

## 核心数据结构

### 操作日志 (Action Log)

所有资源的每一次状态变更都会记录操作日志，包含：
- `action_type`: 操作类型 (create/update/pick/verify/review 等)
- `action_name`: 操作名称 (中文，如 "创建领用单"、"原料领用")
- `description`: 详细描述
- `old_status` / `new_status`: 状态变更前后
- `performed_by`: 操作人
- `created_at`: 操作时间
- `metadata`: 操作相关的结构化数据

### 推进轨迹示例

```json
[
  {
    "action_name": "创建领用单",
    "performed_by_user": {"name": "李班长"},
    "created_at": "2026-06-03T11:30:19",
    "description": "创建领用单 REQ-20260603-0001，生产线：A线-面包生产区"
  },
  {
    "action_name": "原料领用",
    "old_status": "pending",
    "new_status": "picked",
    "description": "完成原料领用，共 3 项物料"
  },
  {
    "action_name": "发起过敏原复核",
    "old_status": "picked",
    "new_status": "allergen_pending",
    "description": "生产班长发起过敏原复核，等待门店督导确认"
  },
  {
    "action_name": "过敏原复核完成",
    "old_status": "allergen_pending",
    "new_status": "allergen_passed",
    "description": "复核结果：通过，等待门店督导确认"
  },
  {
    "action_name": "门店督导确认",
    "old_status": "allergen_passed",
    "new_status": "completed",
    "description": "过敏原复核通过，流程闭环"
  }
]
```

---

## 实现说明与简化声明

### ✅ 已完整实现

1. **接力式工作流**: 采购主管 → 生产班长 → 门店督导 的角色权限隔离和状态流转
2. **操作轨迹**: 每一步推进动作都有完整的操作日志，支持回看
3. **过敏原复核整合**: 复核不是独立菜单，而是领用流程的必经环节
4. **状态机校验**: 所有状态变更都有严格的前置校验，防止非法跳转
5. **角色权限控制**: 基于角色的接口访问控制 (RBAC)
6. **完整的错误码体系**: 分类明确的错误码，方便前端处理
7. **JWT 认证**: 无状态的身份认证

### ⚠️ 简化实现 (需后续增强)

#### 1. 第三方通知 (轻量实现)

- **当前实现**: 无主动通知机制，依赖用户主动查询状态
- **缺失能力**: 微信/企业微信/钉钉机器人推送、邮件通知、短信通知
- **建议**: 后续可接入 `Server酱`、企业微信机器人等，在状态变更时触发通知

#### 2. 附件上传 (未实现)

- **当前实现**: 过敏原复核仅支持文本字段填写 (检查项、结论、整改措施)
- **缺失能力**: 照片上传、PDF 质检报告上传、批量导入
- **建议**: 后续可接入 OSS/MinIO 实现文件存储，字段增加 `attachments` 数组

#### 3. 真实账号体系 (简化实现)

- **当前实现**: 
  - 内置 3 个测试账号，启动时自动创建
  - 密码使用 bcrypt 加密存储
  - 支持 JWT 登录
- **缺失能力**:
  - 用户注册/注销
  - 密码重置/修改
  - 多租户/多门店支持
  - 更细粒度的权限控制 (数据权限、操作权限分离)
  - 账号锁定/解锁
  - 登录日志审计
- **建议**: 后续可对接企业 SSO (OAuth2/LDAP) 或实现完整的用户管理模块

### 🔧 架构说明

- **数据库**: 当前使用 SQLite (文件存储在 `./data/central_kitchen.db`)，生产环境建议切换为 MySQL 8.0+，只需修改 `database.go` 中的驱动和 DSN
- **并发控制**: SQLite 使用 WAL 模式 + 单连接，避免锁问题；生产环境 MySQL 可支持更高并发
- **事务保证**: 所有涉及多表更新的操作都使用数据库事务，确保数据一致性
- **可扩展性**:  handler → service → model 三层架构，便于后续扩展

---

## 前端对接建议

### 页面结构 (参考)

1. **首页/工作台**: 展示待办事项 (待我审批、待我复核、待我确认)
2. **采购单管理**: 采购单列表、详情、创建、状态变更
3. **原料领用**: 领用单列表、创建、领用操作
4. **过敏原复核**: 待复核列表、复核填写、复核确认
5. **历史追溯**: 按时间/批次/物料查询历史记录，查看完整推进轨迹

### 关键交互点

- 领用单详情页必须展示 **完整的推进时间线** (操作日志)
- 过敏原复核表单必须与领用单物料一一对应，不能独立存在
- 状态变更时需要二次确认，避免误操作

---

## 文件结构

```
server/
├── cmd/
│   └── main.go                    # 程序入口
├── internal/
│   ├── models/
│   │   └── models.go              # 数据模型定义
│   ├── database/
│   │   └── database.go            # 数据库初始化与种子数据
│   ├── errcode/
│   │   └── errcode.go             # 错误码定义
│   ├── middleware/
│   │   └── auth.go                # 认证与权限中间件
│   ├── service/
│   │   └── actionlog.go           # 操作日志服务
│   ├── utils/
│   │   └── response/
│   │       └── response.go        # 统一响应格式
│   ├── handler/
│   │   ├── auth.go                # 认证接口
│   │   ├── purchase.go            # 采购单接口
│   │   ├── requisition.go         # 领用单接口
│   │   └── allergen.go            # 过敏原复核接口
│   └── routes/
│       └── routes.go              # 路由注册
├── test_api.py                    # 完整流程测试脚本
├── test_workflow.sh              # Shell 版本测试脚本
├── .env                           # 环境变量
├── go.mod
└── IMPLEMENTATION_NOTES.md       # 本文档
```
