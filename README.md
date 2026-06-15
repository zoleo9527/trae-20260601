# 叉车维保商系统 - 设备档案与保养计划

基于 React + Express 构建的叉车维保管理系统，专注于状态变化感知和异常处理。

## 功能特性

### 核心模块

1. **仪表盘** - 实时监控设备状态和保养进度
2. **设备档案** - 管理叉车设备信息，支持编辑、停机上报、维修完成
3. **保养计划** - 创建、查看和执行保养计划，支持变更提醒和回看记录
4. **配件库存** - 管理配件库存和发放记录，支持错发登记
5. **操作日志** - 记录系统所有操作记录
6. **异常处理** - 跟踪和处理系统异常事件（抽屉式详情面板）

### 状态变化感知

- **保养漏做** - 自动检测逾期未执行的保养计划，生成逾期预警异常
- **配件错发** - 登记配件发放错误并生成异常，支持追回重发处理
- **设备停机** - 现场技师上报设备停机，触发紧急维修流程，维修完成后自动解决

### 角色处理节奏

| 角色 | 可见页面 | 可执行动作 |
|------|----------|------------|
| 维保主管 | 所有页面 | 创建/编辑设备档案、创建保养计划、处理所有异常 |
| 现场技师 | 设备档案、保养计划、异常处理、仪表盘 | 执行保养、上报停机、维修完成、确认设备变更 |
| 仓管 | 配件库存、异常处理、仪表盘 | 发放配件、登记错发、处理库存异常 |

### 联动机制

设备档案被改动后，关联的保养计划会自动同步更新并生成变更提醒：
- 设备编号变更 → 保养计划同步更新 + 变更提醒
- 设备型号变更 → 保养计划同步更新 + 变更提醒
- 负责人变更 → 保养计划同步更新 + 变更提醒

负责技师可在保养计划页面查看变更详情并确认，确认后异常自动解决。

### 处理链路

1. **保养漏做处理链路**
   - 系统自动检测逾期计划 → 生成异常 → 异常处理页面显示
   - 现场技师执行保养 → 标记完成 → 异常自动解决 → 操作日志记录

2. **配件错发处理链路**
   - 仓管登记错发 → 生成异常 → 异常处理页面显示
   - 仓管追回重发 → 填写处理说明 → 标记解决 → 操作日志记录

3. **设备停机处理链路**
   - 现场技师上报停机 → 设备状态变更 → 生成异常
   - 现场技师维修完成 → 设备恢复运行 → 异常自动解决 → 操作日志记录

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
# 启动后端 (端口 5001)
npm run server

# 启动前端 (端口 5173)
npm run client
```

### 访问地址

- 前端: http://localhost:5173
- 后端 API: http://localhost:5001/api

## 测试账号

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|----------|
| 维保主管 | manager | 123456 | 可查看所有页面，创建/编辑设备档案、保养计划，处理所有异常 |
| 现场技师 | liming | 123456 | 可查看设备档案、保养计划、异常处理，执行保养、上报停机、维修完成 |
| 仓管 | warehouse | 123456 | 可查看配件库存、异常处理，发放配件、登记错发、处理库存异常 |

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
│   │   │   ├── Login.tsx      # 登录组件
│   │   │   ├── Layout.tsx     # 布局组件（含角色权限控制）
│   │   │   ├── Dashboard.tsx  # 仪表盘
│   │   │   ├── EquipmentList.tsx  # 设备档案（含停机上报、维修完成）
│   │   │   ├── MaintenancePlans.tsx  # 保养计划（含变更提醒、回看记录）
│   │   │   ├── PartsInventory.tsx  # 配件库存（含错发登记）
│   │   │   ├── OperationLogs.tsx  # 操作日志
│   │   │   └── Exceptions.tsx  # 异常处理（抽屉式详情）
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

1. **用户认证** - 用户名密码验证，无真实权限系统（但前端有角色权限控制）
2. **数据持久化** - 数据存储在内存中，重启服务器后会丢失（除非执行重置）
3. **邮件通知** - 异常触发时无实际邮件发送
4. **实时推送** - 状态变化无 WebSocket 实时推送，需手动刷新页面
5. **报表导出** - 暂无报表导出功能

## API 接口

### 设备管理
- `GET /api/equipment` - 获取设备列表
- `GET /api/equipment/:id` - 获取单个设备
- `POST /api/equipment` - 创建设备
- `PUT /api/equipment/:id` - 更新设备（自动触发变更提醒）
- `DELETE /api/equipment/:id` - 删除设备
- `POST /api/equipment/:id/report-down` - 上报设备停机
- `POST /api/equipment/:id/repair-complete` - 设备维修完成

### 保养计划
- `GET /api/maintenance-plans` - 获取保养计划列表
- `GET /api/maintenance-plans/:id` - 获取单个计划
- `POST /api/maintenance-plans` - 创建保养计划
- `PUT /api/maintenance-plans/:id` - 更新保养计划
- `POST /api/maintenance-plans/:id/acknowledge-change` - 确认设备变更

### 配件库存
- `GET /api/parts` - 获取配件列表
- `GET /api/parts/:id` - 获取单个配件
- `POST /api/parts` - 新增配件
- `PUT /api/parts/:id` - 更新配件
- `POST /api/parts/:id/issue` - 发放配件
- `POST /api/parts/:id/report-wrong-delivery` - 登记配件错发
- `POST /api/parts/wrong-delivery/resolve` - 处理配件错发

### 日志与异常
- `GET /api/logs` - 获取操作日志
- `GET /api/exceptions` - 获取异常列表
- `GET /api/exceptions/:id` - 获取单个异常
- `POST /api/exceptions` - 创建异常记录
- `PUT /api/exceptions/:id` - 更新异常状态

### 变更记录
- `GET /api/equipment-change-records` - 获取设备变更记录列表
- `GET /api/equipment-change-records/:id` - 获取单个变更记录
- `GET /api/maintenance-change-records` - 获取保养计划确认记录

### 系统
- `POST /api/login` - 用户登录
- `GET /api/users` - 获取用户列表
- `POST /api/check-overdue` - 检查逾期保养
- `GET /api/overdue-warnings` - 获取逾期预警

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