# 乳品配送站 - 晨配签到与异常补送系统

全栈可追溯的乳品配送站管理系统，聚焦晨配签到与异常补送的责任交接留痕。

## 技术栈

- **后端**: Node.js + Express + SQLite (better-sqlite3)
- **前端**: React 18 + TypeScript + Vite + React Router
- **认证**: JWT
- **时间处理**: dayjs

## 核心业务流程

### 晨配签到流程（有前后顺序）
1. **配送员/文员** 创建签到记录（草稿）
2. **配送员/文员** 提交签到（填写已签单数、异常数）→ 状态：已提交
3. **站点文员** 确认签到 → 状态：已确认

### 异常补送流程（有前后顺序）
1. **任意角色** 上报异常（漏送/破损/错送/客户不在/其他）
2. **文员/配送员/客服** 安排补送（重新配送/退款/换货）
3. **配送员** 标记补送已配送
4. **文员/客服** 确认补送完成 → 流程闭环

### 所有操作均留痕
- 操作人、时间、动作均记录
- 订单详情页有完整时间线
- 签到详情页有完整时间线

## 演示账号

| 用户名 | 密码 | 角色 | 权限说明 |
|--------|------|------|----------|
| clerk | 123456 | 站点文员 | 全部权限，包含签到确认、补送确认 |
| courier1 | 123456 | 配送员李 | 创建/提交签到、上报异常、标记补送配送 |
| courier2 | 123456 | 配送员王 | 同上 |
| cs | 123456 | 客服 | 查看、上报异常、安排补送、确认补送 |

## 启动方式

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 初始化数据库（首次启动或重置时）

```bash
cd server
npm run init-db
```

### 3. 启动后端服务

```bash
cd server
npm start
# 或开发模式：npm run dev
```
后端服务运行在: http://localhost:3001

### 4. 启动前端服务（新终端）

```bash
cd client
npm run dev
```
前端服务运行在: http://localhost:5173

## 数据重置方式

```bash
cd server
npm run reset-db
```
该命令会删除现有数据库并重新初始化所有种子数据。

数据库文件位置: `server/data/dairy.db`

## 功能模块

### 1. 仪表盘
- 今日订单统计（总单、已签、异常、待处理异常、待配送补送）
- 今日各路线概览
- 今日晨配签到列表

### 2. 订单管理
- 按日期、状态筛选订单
- 查看订单详情
- 订单详情包含：基本信息、异常记录、补送记录、完整时间线
- 支持在订单详情页上报异常

### 3. 晨配签到
- 按日期、状态筛选签到记录
- 创建签到（选择日期、路线、配送员）
- 提交签到（填写已签数、异常数、备注）
- 文员确认签到
- 签到详情：基本信息、关联订单、关联异常、完整时间线

### 4. 异常管理
- 按状态、类型筛选异常
- 查看异常关联订单
- 待处理异常可直接安排补送

### 5. 补送管理
- 按状态筛选补送记录
- 配送员标记补送已配送
- 文员/客服确认补送完成

## 哪些能力是模拟的

1. **订奶名单生成**: 目前种子数据是静态生成的，没有真实的订户管理和订单自动生成功能
2. **回瓶记录**: 系统中暂未实现回瓶记录模块
3. **路线表**: 路线数据是静态配置的，没有路线规划和优化功能
4. **短信/消息通知**: 异常上报、补送完成等节点没有真实的消息推送
5. **支付/退款**: 补送中的"退款"只是状态标记，没有真实支付对接
6. **图片上传**: 异常上报暂不支持上传照片凭证
7. **地理位置**: 没有配送员定位和签到位置校验
8. **打印功能**: 暂不支持签到表、配送单打印

## API 接口

所有接口均以 `/api` 为前缀，需要 JWT 认证（登录接口除外）。

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户

### 订单
- `GET /api/orders` - 订单列表
- `GET /api/orders/:id` - 订单详情
- `PUT /api/orders/:id/status` - 更新订单状态
- `GET /api/orders/summary/daily` - 每日汇总

### 晨配签到
- `GET /api/checkins` - 签到列表
- `GET /api/checkins/:id` - 签到详情
- `POST /api/checkins` - 创建签到
- `PUT /api/checkins/:id/submit` - 提交签到
- `PUT /api/checkins/:id/confirm` - 确认签到

### 异常
- `GET /api/exceptions` - 异常列表
- `GET /api/exceptions/:id` - 异常详情
- `POST /api/exceptions` - 上报异常
- `PUT /api/exceptions/:id/status` - 更新异常状态

### 补送
- `GET /api/replenishments` - 补送列表
- `GET /api/replenishments/:id` - 补送详情
- `POST /api/replenishments` - 创建补送
- `PUT /api/replenishments/:id/deliver` - 标记配送
- `PUT /api/replenishments/:id/confirm` - 确认补送

### 时间线
- `GET /api/timeline/order/:orderId` - 订单时间线
- `GET /api/timeline/checkin/:checkinId` - 签到时间线

## 项目目录结构

```
.
├── server/                 # 后端服务
│   ├── src/
│   │   ├── index.js       # 入口文件
│   │   ├── db.js          # 数据库连接
│   │   ├── initDB.js      # 数据库初始化脚本
│   │   ├── resetDB.js     # 数据库重置脚本
│   │   ├── middleware/    # 中间件（认证）
│   │   ├── routes/        # API 路由
│   │   └── utils/         # 工具函数（操作日志）
│   ├── data/              # SQLite 数据库文件目录
│   └── package.json
├── client/                # 前端应用
│   ├── src/
│   │   ├── main.tsx       # 入口
│   │   ├── App.tsx        # 路由配置
│   │   ├── api/           # API 封装
│   │   ├── context/       # React Context（认证）
│   │   ├── pages/         # 页面组件
│   │   ├── types/         # TypeScript 类型定义
│   │   └── styles.css     # 全局样式
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## 设计原则

1. **责任可追溯**: 每个关键操作都记录操作人、时间、内容
2. **角色有边界**: 不同角色有严格的权限控制，操作顺序不能跳步
3. **时间线优先**: 详情页以时间线形式展示完整处理过程
4. **数据真实落地**: 所有数据持久化到 SQLite，非内存模拟
