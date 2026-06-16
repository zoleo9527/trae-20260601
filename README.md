# 火锅店等位排号与桌台分配系统

一个完整的全栈系统，用于解决火锅店等位排号与桌台分配中的责任争议问题，所有操作都有完整的留痕记录。

## 功能特性

### 核心功能
- **等位排号管理**：前厅经理提交等位排号，记录顾客信息
- **桌台分配确认**：后厨主管确认桌台分配，写入独立分配记录
- **结账释放桌台**：收银员完成结账，桌台自动释放为可用状态
- **完整时间线**：排号详情展示基于真实数据的操作时间线
- **责任追溯**：所有操作自动记录，便于责任追踪

### 角色权限
| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 前厅经理 | manager | 123456 | 创建排号、取消排号 |
| 后厨主管 | chef | 123456 | 确认桌台分配 |
| 收银员 | cashier | 123456 | 完成结账、释放桌台 |
| 管理员 | admin | 123456 | 所有权限 |

### 状态流转
```
等待中 → 后厨主管确认分配 → 已入座 → 收银员结账 → 已完成（桌台释放）
        ↓
    前厅经理取消 → 已取消
```

## 技术栈

- **前端**: React 18 + Vite 6 + Tailwind CSS 3 + Lucide Icons + Zustand
- **后端**: Node.js + Express + TypeScript
- **数据库**: 内存数据库（本地开发使用）

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
```

### 访问地址
- 前端: http://localhost:5173/
- 后端 API: http://localhost:3002/api/

## API 接口

### 认证接口
- `POST /api/auth/login` - 用户登录

### 排号接口
- `GET /api/queues` - 获取排号列表
- `POST /api/queues` - 创建排号（仅前厅经理）
- `GET /api/queues/:id` - 获取排号详情
- `PUT /api/queues/:id` - 更新排号状态
- `POST /api/queues/:id/assign` - 分配桌台（仅后厨主管）

### 桌台接口
- `GET /api/tables` - 获取桌台列表
- `POST /api/tables` - 创建桌台
- `PUT /api/tables/:id` - 更新桌台状态

### 分配记录接口
- `GET /api/assignments` - 获取分配记录列表
- `POST /api/assignments` - 创建分配记录

### 日志接口
- `GET /api/logs` - 获取系统日志

## 注意事项

### 模拟实现功能
以下功能为模拟实现，仅提供界面展示：
- **导出功能**：界面按钮存在，但点击后仅提示"导出功能开发中"
- **附件功能**：界面支持上传附件展示，但实际未保存到持久化存储
- **通知功能**：界面显示通知入口，但实际消息推送未实现

### 数据存储
- 系统使用内存数据库，重启服务器后数据会重置
- 生产环境建议使用真实数据库（如 SQLite、MySQL、PostgreSQL）

## 项目结构

```
├── api/                    # 后端代码
│   ├── database/           # 数据库模块
│   ├── routes/             # API 路由
│   ├── services/           # 业务服务
│   ├── types/              # TypeScript 类型定义
│   ├── app.ts              # Express 应用配置
│   └── server.ts           # 服务器入口
├── src/                    # 前端代码
│   ├── components/         # React 组件
│   ├── pages/              # 页面组件
│   ├── api/                # API 调用层
│   ├── store/              # 状态管理
│   ├── types/              # TypeScript 类型定义
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # React 入口
├── public/                 # 静态资源
├── package.json            # 项目配置
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
└── tsconfig.json           # TypeScript 配置
```

## 开发说明

1. 前端使用 Vite 开发服务器，支持热更新
2. 后端使用 nodemon 自动重启
3. 所有接口使用 RESTful 风格
4. 前端使用 Zustand 进行状态管理

## License

MIT
