# 社区食堂订餐管理系统

面向社区食堂工作人员的 Web 前端原型，用于管理老人订餐、补贴资格、出餐核销、临时退餐等日常业务。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router
- **图标**: Lucide React

## 功能特性

### 左侧导航
- **今天** - 查看今日所有订单（早/午/晚餐分组展示）
- **明天** - 查看明日预订订单
- **异常订单** - 集中展示补贴过期、重复订餐、退餐申请等异常
- **搜索** - 按姓名、地址、菜品搜索

### 订单卡片
- 显示老人姓名、补贴类型、餐类、菜品、订单状态
- 异常标签高亮：补贴过期、重复订餐、退餐申请、已出餐退餐
- 勾选框支持批量选择
- 点击查看详情

### 订单详情（右侧面板）
- 个人信息：姓名、电话、送餐地址
- 订餐信息：餐类、菜品、补贴类型、订单状态
- 核销状态时间线
- 异常提示（补贴过期、重复订餐、已出餐退餐）
- 备注信息
- 退餐申请 / 撤回退餐操作

### 常用操作入口
1. **批量核销** - 勾选订单后底部出现操作栏，一键批量核销
2. **补贴异常提示** - 顶部常驻异常提醒，异常订单红色高亮
3. **临时加餐登记** - 右上角明显按钮，弹窗快速录入

### 退餐管理
- 支持待出餐、已出餐、已核销订单退餐
- 已出餐退餐需二次确认，提示费用结算风险
- 退餐原因选择：不想吃、住院、家属取消、其他

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

启动后访问 `http://localhost:5173`

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产构建

```bash
npm run preview
```

### 5. 类型检查

```bash
npm run check
```

### 6. 代码检查

```bash
npm run lint
```

## Mock 数据说明

### 数据位置
Mock 数据位于 [src/data/mockOrders.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/data/mockOrders.ts)

### 数据结构
每条订单包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 订单编号 |
| `elderName` | string | 老人姓名 |
| `mealType` | string | 餐类：breakfast/lunch/dinner |
| `dishName` | string | 菜品名称 |
| `subsidyType` | string | 补贴类型：low_income/disabled/over80/veteran/none |
| `subsidyExpired` | boolean | 补贴是否过期 |
| `deliveryAddress` | string | 送餐地址 |
| `status` | string | 订单状态：pending/served/verified/cancelled/refund_requested |
| `orderDate` | string | 订餐日期（YYYY-MM-DD） |
| `isTemporary` | boolean | 是否为临时加餐 |
| `note` | string | 备注 |
| `duplicateOrder` | boolean | 是否为重复订单 |
| `verifiedAt` | string | 核销时间 |
| `refundReason` | string | 退餐原因 |
| `isServedRefund` | boolean | 是否为已出餐后退餐 |
| `phone` | string | 联系电话 |

### 业务场景覆盖
Mock 数据已包含以下真实业务场景：

1. **重复订餐** - 李建国（ORD-002、ORD-003）同一天午餐重复下单
2. **补贴资格过期** - 张秀英（ORD-004）残疾补贴过期，周明远（ORD-009、ORD-112）低保补贴过期
3. **已出餐家属退餐** - 赵德明（ORD-005）餐已出但家属来电要求退餐
4. **住院退餐** - 马国强（ORD-011）本人住院申请退餐
5. **临时加餐** - 陈桂花（ORD-006）邻居代订的临时加餐
6. **正常订单** - 包含各状态（待出餐、已出餐、已核销）的正常订单
7. **明日预订** - ORD-101 至 ORD-112 为明天的预订订单
8. **特殊饮食要求** - 孙桂兰（ORD-008）少盐，郑美华（ORD-015）糖尿病饮食

### 修改数据
如需调整 mock 数据，直接编辑 [src/data/mockOrders.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/data/mockOrders.ts) 文件即可，刷新页面后生效。

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── AddMealModal.tsx      # 临时加餐弹窗
│   ├── BatchVerifyBar.tsx    # 批量核销底部操作栏
│   ├── Empty.tsx             # 空状态组件
│   ├── OrderCard.tsx         # 订单卡片
│   ├── OrderDetail.tsx       # 订单详情面板
│   ├── OrderList.tsx         # 订单列表
│   ├── RefundModal.tsx       # 退餐弹窗
│   └── Sidebar.tsx           # 左侧导航栏
├── data/                # 数据目录
│   └── mockOrders.ts         # Mock 订单数据
├── hooks/               # 自定义 Hooks
│   └── useTheme.ts
├── lib/                 # 工具库
│   └── utils.ts
├── pages/               # 页面组件
│   └── Home.tsx              # 主页面
├── store/               # 状态管理
│   └── useOrderStore.ts      # 订单状态 Store
├── types/               # 类型定义
│   └── index.ts
├── App.tsx              # 应用入口
├── main.tsx             # 渲染入口
└── index.css            # 全局样式
```

## 状态管理

使用 Zustand 进行状态管理，核心 Store 位于 [src/store/useOrderStore.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/store/useOrderStore.ts)，包含：

- 订单数据管理
- 视图模式切换（今天/明天/异常）
- 批量选择与核销
- 临时加餐添加
- 退餐申请与撤回
- 搜索过滤
