# 充电桩运营后台管理系统

一个完整的充电桩运营后台全栈应用，涵盖设备故障、抢修派单、订单影响、电费分账全链路管理。

## 功能特性

- **站点管理**：站点地图/列表、站点详情、设备状态监控
- **故障管理**：故障详情、工单时间线、受影响订单追踪
- **工单管理**：抢修派单、状态流转、维修超时预警
- **订单管理**：订单查询、退款处理
- **投诉处理**：用户投诉受理、处理记录
- **分账管理**：电费分账、调整记录、对账异议处理

## 技术栈

- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **后端**：Node.js + Express + TypeScript
- **状态管理**：Zustand
- **图表**：Recharts
- **图标**：Lucide React
- **认证**：JWT

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务

```bash
npm run dev
```

该命令会同时启动：
- 前端服务：http://localhost:5173
- 后端API服务：http://localhost:3001

### 单独启动

```bash
# 仅启动前端
npm run client:dev

# 仅启动后端
npm run server:dev
```

## 演示账号

系统提供4种角色的演示账号，密码均为 `123456`：

| 用户名 | 角色 | 权限说明 |
|--------|------|----------|
| `admin` | 运营管理员 | 全部功能权限 |
| `service` | 客服人员 | 站点、故障、工单、订单、投诉 |
| `maintenance` | 维修人员 | 故障、工单 |
| `finance` | 财务人员 | 订单、分账 |

## 演示数据说明

系统预置了丰富的演示数据，包含以下场景：

### 1. 离线桩
- **亦庄开发区站**：3号桩、4号桩、5号桩设备离线
- **影响**：关联故障 f1、f2、f3，工单 wo1、wo2、wo3

### 2. 充电中断
- **订单**：ord3、ord4、ord5、ord6 为充电中断状态
- **原因**：设备故障导致用户充电中途停止
- **关联**：对应故障和投诉记录

### 3. 维修超时
- **工单 wo1**：3号桩通信故障维修超时
- **工单 wo4**：5号桩充电枪故障维修超时
- **状态**：标记为 timeout，已超过承诺的2小时响应时间

### 4. 场地方对账异议
- **dispute1**：亦庄开发区站 2024-01 分账异议
- **dispute2**：望京SOHO站 2024-01 分账异议
- **dispute3**：总部基地站 2024-01 分账异议
- **状态**：待处理，财务可同意调整或驳回

## 数据重置

由于使用内存存储，数据重置方式如下：

### 方式一：重启后端服务

```bash
# 停止后端服务（Ctrl+C）后重新启动
npm run server:dev
```

### 方式二：调用重置API

```bash
curl http://localhost:3001/api/reset
```

或在浏览器访问：http://localhost:3001/api/reset

## 项目结构

```
.
├── api/                    # 后端代码
│   ├── data/              # Mock数据
│   │   └── mockData.ts
│   ├── routes/            # API路由
│   │   ├── auth.ts
│   │   ├── stations.ts
│   │   ├── faults.ts
│   │   ├── workorders.ts
│   │   ├── orders.ts
│   │   ├── complaints.ts
│   │   ├── settlements.ts
│   │   └── stats.ts
│   ├── app.ts             # Express应用
│   ├── server.ts          # 服务器启动
│   └── index.ts           # 入口文件
├── src/                   # 前端代码
│   ├── components/        # 组件
│   │   ├── Layout.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StationMap.tsx
│   ├── pages/            # 页面
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Stations.tsx
│   │   ├── StationDetail.tsx
│   │   ├── Faults.tsx
│   │   ├── FaultDetail.tsx
│   │   ├── WorkOrders.tsx
│   │   ├── WorkOrderDetail.tsx
│   │   ├── Orders.tsx
│   │   ├── OrderDetail.tsx
│   │   ├── Complaints.tsx
│   │   ├── ComplaintDetail.tsx
│   │   └── Settlements.tsx
│   ├── store/            # 状态管理
│   │   └── authStore.ts
│   ├── lib/              # 工具库
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── shared/               # 共享类型
│   └── types.ts
└── package.json
```

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/logout` - 登出

### 站点
- `GET /api/stations` - 站点列表
- `GET /api/stations/:id` - 站点详情
- `GET /api/stations/:id/devices` - 站点设备

### 故障
- `GET /api/faults` - 故障列表
- `GET /api/faults/:id` - 故障详情
- `GET /api/faults/:id/timeline` - 故障时间线
- `GET /api/faults/:id/orders` - 受影响订单

### 工单
- `GET /api/workorders` - 工单列表
- `GET /api/workorders/:id` - 工单详情
- `PUT /api/workorders/:id/status` - 更新工单状态

### 订单
- `GET /api/orders` - 订单列表
- `GET /api/orders/:id` - 订单详情
- `POST /api/orders/:id/refund` - 订单退款

### 投诉
- `GET /api/complaints` - 投诉列表
- `GET /api/complaints/:id` - 投诉详情
- `PUT /api/complaints/:id` - 处理投诉

### 分账
- `GET /api/settlements/overview` - 分账概览
- `GET /api/settlements` - 分账明细
- `GET /api/settlements/adjustments` - 调整记录
- `GET /api/settlements/disputes` - 对账异议
- `PUT /api/settlements/disputes/:id` - 处理异议

### 统计
- `GET /api/stats/dashboard` - 仪表盘数据
- `GET /api/stats/trends` - 趋势数据

## 核心流程

### 故障处理流程
1. 设备离线/异常 → 自动生成故障记录
2. 运营查看故障 → 创建抢修工单
3. 维修商接单 → 到达现场 → 维修完成
4. 确认设备恢复 → 故障闭环

### 投诉处理流程
1. 用户充电中断/异常 → 提交投诉
2. 客服受理 → 关联故障/订单
3. 核实情况 → 退款/补偿
4. 回复用户 → 投诉闭环

### 分账流程
1. 订单完成 → 自动分账计算
2. 场地方对账 → 提交异议（如有）
3. 财务审核 → 同意调整/驳回
4. 生成结算单 → 完成付款

## 开发说明

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

### 类型检查

```bash
npm run check
```

## 注意事项

1. 本系统使用内存存储，重启服务后数据会重置
2. 所有密码均为演示用 `123456`，生产环境请使用强密码
3. JWT Secret 为演示用途，生产环境请配置环境变量
