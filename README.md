# 叉车维保商系统 - 设备档案与保养计划

基于 React + Express 构建的叉车维保管理系统，专注于状态变化感知和异常处理。

## 功能特性

### 核心模块

1. **仪表盘** - 实时监控设备状态和保养进度
2. **设备档案** - 管理叉车设备信息，支持编辑和删除
3. **保养计划** - 创建、查看和执行保养计划
4. **配件库存** - 管理配件库存和发放记录
5. **操作日志** - 记录系统所有操作记录
6. **异常处理** - 跟踪和处理系统异常事件

### 状态变化感知

- **保养漏做** - 自动检测逾期未执行的保养计划
- **配件错发** - 记录配件发放错误并生成异常
- **设备停机** - 标记设备停机状态并触发紧急维修流程

### 角色处理节奏

| 角色 | 职责 |
|------|------|
| 维保主管 | 创建保养计划、分配任务、处理异常 |
| 现场技师 | 执行保养计划、上报设备异常、紧急维修 |
| 仓管 | 管理库存、发放配件、处理库存预警 |

### 联动机制

设备档案被改动后，关联的保养计划会自动同步更新：
- 设备编号变更 → 保养计划同步更新
- 设备型号变更 → 保养计划同步更新  
- 负责人变更 → 保养计划同步更新

## 启动方式

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 启动开发服务器

```bash
# 同时启动后端和前端
npm start
```

或者分别启动：

```bash
# 启动后端 (端口 5000)
npm run server

# 启动前端 (端口 5173)
npm run client
```

### 访问地址

- 前端: http://localhost:5173
- 后端 API: http://localhost:5001/api

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 维保主管 | manager | 123456 |
| 现场技师 | liming | 123456 |
| 仓管 | warehouse | 123456 |

## 数据重置

如需重置数据到初始状态：

```bash
npm run reset-data
```

执行后需要重启服务器使更改生效。

## 项目结构

```
.
├── server/                    # 后端服务
│   ├── data/
│   │   └── mockData.js        # 模拟数据
│   ├── scripts/
│   │   └── resetData.js       # 数据重置脚本
│   └── server.js              # Express 服务入口
├── client/                    # 前端应用
│   ├── src/
│   │   ├── api/               # API 调用
│   │   ├── components/        # React 组件
│   │   ├── store/             # 状态管理
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── App.tsx            # 主应用组件
│   │   ├── main.tsx           # 入口文件
│   │   └── index.css          # 全局样式
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── package.json
└── README.md
```

## 模拟能力说明

以下功能目前为模拟实现：

1. **用户认证** - 用户名密码验证，无真实权限系统
2. **数据持久化** - 数据存储在内存中，重启服务器后会丢失（除非执行重置）
3. **邮件通知** - 异常触发时无实际邮件发送
4. **实时推送** - 状态变化无 WebSocket 实时推送，需手动刷新页面
5. **报表导出** - 暂无报表导出功能

## API 接口

### 设备管理
- `GET /api/equipment` - 获取设备列表
- `GET /api/equipment/:id` - 获取单个设备
- `POST /api/equipment` - 创建设备
- `PUT /api/equipment/:id` - 更新设备
- `DELETE /api/equipment/:id` - 删除设备
- `POST /api/equipment/:id/down` - 设备停机
- `POST /api/equipment/:id/repair` - 设备维修完成

### 保养计划
- `GET /api/maintenance-plans` - 获取保养计划列表
- `GET /api/maintenance-plans/:id` - 获取单个计划
- `POST /api/maintenance-plans` - 创建保养计划
- `PUT /api/maintenance-plans/:id` - 更新保养计划

### 配件库存
- `GET /api/parts` - 获取配件列表
- `GET /api/parts/:id` - 获取单个配件
- `POST /api/parts` - 新增配件
- `PUT /api/parts/:id` - 更新配件
- `POST /api/parts/:id/issue` - 发放配件

### 日志与异常
- `GET /api/logs` - 获取操作日志
- `GET /api/exceptions` - 获取异常列表
- `POST /api/exceptions` - 创建异常记录
- `PUT /api/exceptions/:id` - 更新异常状态

### 系统
- `POST /api/login` - 用户登录
- `GET /api/users` - 获取用户列表
- `POST /api/check-overdue` - 检查逾期保养

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS 3
- **图标**: Lucide React
- **后端**: Express 4
- **HTTP 客户端**: Axios

## 开发说明

### 前端开发

```bash
cd client
npm run dev    # 开发模式
npm run build  # 生产构建
npm run lint   # 代码检查
```

### 后端开发

后端使用 Express 框架，数据存储在内存中。修改 `server/data/mockData.js` 可更新初始数据。

## 许可证

MIT
