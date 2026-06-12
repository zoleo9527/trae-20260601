# 会计代账公司 - 税期申报与异常提醒系统

## 项目概述

围绕会计代账公司的核心业务场景，将**税期申报**与**异常提醒**作为两个独立模块设计，避免会计、客户经理、主管共用一张大表导致责任不清的问题。

每个模块都有独立的列表页、常用动作按钮和详情页，详情页可回看完整历史操作记录。税期申报的备注会自动同步到关联的异常提醒，解决"责任说不清、靠口头解释"的问题。

---

## 技术栈

- **后端**: Node.js + Express + SQLite (better-sqlite3)
- **前端**: React 18 + Vite + Ant Design 5
- **数据存储**: SQLite 本地文件（零配置）

---

## 快速开始

### 方式一：一键启动（推荐）

```bash
chmod +x start.sh
./start.sh
```

### 方式二：分步启动

**1. 安装依赖**

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client && npm install && cd ..
```

**2. 启动后端服务**

```bash
npm run server
```

后端服务运行在 http://localhost:3001

**3. 启动前端服务**

```bash
npm run client
```

前端页面运行在 http://localhost:5173

**4. 同时启动前后端**

```bash
npm run dev
```

---

## 功能模块

### 一、税期申报模块

**核心状态流转**：
```
待处理 → 处理中 → 已提交 → 审核通过 → 已完成
                ↓        ↓
              已退回 ←  (退回操作)
```

**常用动作**：
- 开始处理
- 提交申报
- 审核通过 / 退回
- 完成归档 / 重新打开

**特色功能**：
- 列表页按状态、税种、税期筛选
- 截止日期临近自动标红/标橙
- 退回申报时自动创建「退回异常」提醒
- 备注自动同步到关联异常提醒

### 二、异常提醒模块

**三种类型**（按用户需求设计）：
1. 🔶 **催收提醒** - 有人催，客户票据/资料未提交
2. 🔴 **退回异常** - 有人退，申报被税务局退回
3. 🔵 **补材料提醒** - 有人补，需要客户补充材料

**状态流转**：
```
待处理 → 处理中 → 已解决 → 已关闭
   ↑                      ↓
   └────── 重新打开 ──────┘
```

**特色功能**：
- 顶部卡片按类型统计，点击快速筛选
- 优先级标识（紧急/高/普通/低）
- 详情页显示关联申报信息
- 备注与税期申报双向联动
- 完整操作日志时间线

### 三、详情页历史回看

两个模块的详情页均包含：
- 完整的**操作日志时间线**
- 每次状态变更的前后对比
- 操作人、操作时间、备注说明
- 关联数据快速跳转

### 四、工作台

- 核心数据统计卡片
- 最新异常提醒列表
- 近期申报动态

---

## 核心设计亮点

### 1. 备注贯穿机制

税期申报的 `current_remark` 与异常提醒的 `related_remark` 双向联动：

- 修改税期申报备注 → 自动同步到所有关联的**进行中**异常提醒
- 修改异常提醒描述 → 自动同步到关联的税期申报备注
- 所有同步操作都会在操作日志中留痕

**解决的问题**：不需要去翻沟通记录、票据、申报日历，责任和进度在系统里一目了然。

### 2. 模块分离设计

不搞"一张大表打天下"，而是：
- **税期申报列表**：会计的主战场，关注申报进度
- **异常提醒列表**：客户经理/主管的主战场，关注待处理问题
- 两者通过关联字段打通，详情页可互相跳转

### 3. 操作日志留痕

所有状态变更、备注修改、创建操作都写入 `operation_logs` 表，支持：
- 按业务类型（税期申报/异常提醒）筛选
- 显示旧状态 → 新状态的变化
- 记录操作人和操作时间
- 留存备注快照

---

## 简化点说明

以下模块为了演示目的做了简化，生产环境需要完善：

### 🔐 权限系统（简化）

**当前实现**：
- 用户表有 `role` 字段（accountant / manager / supervisor）
- 前端顶部显示当前角色
- 默认以"张会计"身份操作

**生产环境需要补充**：
- 登录认证（JWT / OAuth）
- 接口权限校验（中间件）
- 角色权限矩阵配置
  - 会计：只能操作自己负责的客户申报
  - 客户经理：可创建异常、指派处理人
  - 主管：全部权限，可审核退回
- 数据权限隔离（按负责人过滤）

### 📎 附件系统（简化）

**当前实现**：
- 数据库有 `attachments` 表结构
- 前端未实现上传和展示功能

**生产环境需要补充**：
- 文件上传接口（multer / 云存储 SDK）
- 文件类型/大小校验
- 附件列表展示与预览
- 附件与操作日志关联
- OSS/七牛云等对象存储集成

### 🔔 通知系统（简化）

**当前实现**：
- 无主动推送，靠用户主动刷新查看
- 异常创建时不会通知处理人

**生产环境需要补充**：
- 站内信 / 消息中心
- 企业微信 / 钉钉 / 飞书机器人推送
- 短信 / 邮件通知
- 通知模板配置
- 已读未读状态

### 🌐 外部系统对接（简化）

**当前实现**：
- 所有数据为模拟种子数据
- 申报提交、退回等操作为状态模拟

**生产环境需要补充**：
- 电子税务局 API 对接（实际申报提交）
- 发票勾选认证平台对接
- 银行流水自动获取
- 工商信息查询接口
- 社保/公积金系统对接

---

## API 接口列表

### 税期申报
- `GET /api/tax-filings` - 列表（支持筛选+分页）
- `GET /api/tax-filings/:id` - 详情（含日志+关联异常）
- `POST /api/tax-filings` - 创建
- `PUT /api/tax-filings/:id/status` - 更新状态
- `PUT /api/tax-filings/:id/remark` - 更新备注（联动异常）
- `POST /api/tax-filings/:id/action/:actionType` - 快捷操作

### 异常提醒
- `GET /api/exceptions` - 列表（支持筛选+分页）
- `GET /api/exceptions/stats` - 统计数据
- `GET /api/exceptions/:id` - 详情（含日志）
- `POST /api/exceptions` - 创建
- `PUT /api/exceptions/:id/status` - 更新状态
- `PUT /api/exceptions/:id/remark` - 更新描述（联动申报）
- `POST /api/exceptions/:id/action/:actionType` - 快捷操作

### 其他
- `GET /api/users` - 用户列表
- `GET /api/customers` - 客户列表
- `GET /api/stats` - 总统计
- `GET /api/logs` - 操作日志

---

## 目录结构

```
.
├── package.json              # 根 package
├── start.sh                  # 一键启动脚本
├── data/                     # SQLite 数据库文件目录
│   └── app.db
├── server/                   # 后端代码
│   ├── index.js              # 入口
│   ├── db.js                 # 数据库初始化
│   ├── seed.js               # 种子数据
│   └── routes/
│       ├── taxFilings.js     # 税期申报接口
│       ├── exceptions.js     # 异常提醒接口
│       ├── customers.js      # 客户接口
│       ├── users.js          # 用户接口
│       └── logs.js           # 日志接口
└── client/                   # 前端代码
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js            # API 封装
        ├── index.css
        └── pages/
            ├── Dashboard.jsx          # 工作台
            ├── TaxFilings.jsx         # 税期申报列表
            ├── TaxFilingDetail.jsx    # 税期申报详情
            ├── Exceptions.jsx         # 异常提醒列表
            └── ExceptionDetail.jsx    # 异常提醒详情
```

---

## 数据模型

### users 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 姓名 |
| role | TEXT | 角色(accountant/manager/supervisor) |

### customers 客户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 客户简称 |
| company_name | TEXT | 公司全称 |
| tax_type | TEXT | 纳税人类型 |
| accountant_id | INTEGER | 负责会计 |
| manager_id | INTEGER | 客户经理 |

### tax_filings 税期申报表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| customer_id | INTEGER | 客户ID |
| period | TEXT | 税期(如2026-05) |
| tax_type | TEXT | 税种 |
| status | TEXT | 状态 |
| current_remark | TEXT | 当前备注 |
| due_date | DATE | 截止日期 |

### exceptions 异常提醒表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| customer_id | INTEGER | 客户ID |
| tax_filing_id | INTEGER | 关联申报ID |
| type | TEXT | 类型(urge/reject/supplement) |
| status | TEXT | 状态 |
| title | TEXT | 标题 |
| description | TEXT | 详细描述 |
| priority | TEXT | 优先级 |
| related_remark | TEXT | 关联申报备注 |
| assigned_to | INTEGER | 指派给谁 |

### operation_logs 操作日志表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| ref_type | TEXT | 关联类型(tax_filing/exception) |
| ref_id | INTEGER | 关联ID |
| action | TEXT | 操作描述 |
| old_status | TEXT | 旧状态 |
| new_status | TEXT | 新状态 |
| remark | TEXT | 备注快照 |
| operator_name | TEXT | 操作人 |

---

## 种子数据

首次启动会自动初始化种子数据：

- 4 个用户（2会计 + 1经理 + 1主管）
- 8 个客户
- 13 条税期申报记录（覆盖各种状态）
- 6 条异常提醒（催收/退回/补材料各2条，覆盖各状态）
- 14 条操作日志

清空数据：删除 `data/app.db` 文件，重启服务即可重新初始化。
