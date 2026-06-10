## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层 (Vue3 SPA)"
        A["角色入口页 RoleEntry"]
        B["销售内勤工作台 SalesDesk"]
        C["种植员工作台 GrowerDesk"]
        D["包装主管工作台 PackerDesk"]
        E["历史记录与回看 HistoryView"]
        F["全局状态管理 Pinia Store"]
        G["路由层 Vue Router"]
    end
    subgraph "数据层 (Mock)"
        H["订单 Mock Orders"]
        I["棚区 Mock Shelters"]
        J["操作日志 Mock Logs"]
        K["卡住记录 Mock StuckRecords"]
    end
    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
    G --> F
    F --> H
    F --> I
    F --> J
    F --> K
```

## 2. 技术选型

- **前端框架**：Vue@3.4 + TypeScript@5.0
- **构建工具**：Vite@5.0
- **UI组件库**：Element Plus@2.4（表格、抽屉、标签、时间线、看板等）
- **状态管理**：Pinia@2.1（订单/棚区/日志全局状态）
- **路由**：Vue Router@4.3
- **样式方案**：Tailwind CSS@3.4 + CSS 变量（主题色、状态色）
- **图标**：@element-plus/icons-vue + 自定义SVG业务图标
- **数据方案**：本地Mock数据（TS模块定义）+ Pinia持久化状态

## 3. 路由定义

| 路由路径 | 页面名称 | 页面说明 |
|----------|----------|----------|
| `/` | 角色选择入口 | 三角色卡片选择 + 全局卡住提醒横幅 |
| `/sales` | 销售内勤工作台 | 订单处理流水 + 详情抽屉 + 快捷操作 |
| `/grower` | 种植员工作台 | 采切排期时间轴 + 棚区状态看板 + 采切操作 |
| `/packer` | 包装主管工作台 | 待包装队列看板 + 规格核对 + 破损物流 |
| `/history` | 历史记录与回看 | 全流程筛选 + 卡住记录专区 + 流程时间线 |

## 4. 数据模型

### 4.1 数据模型ER图

```mermaid
erDiagram
    CUSTOMER_ORDER ||--o{ ORDER_ITEM : "包含"
    CUSTOMER_ORDER ||--o{ OPERATION_LOG : "产生"
    CUSTOMER_ORDER ||--o| STUCK_RECORD : "可能卡住"
    CUSTOMER_ORDER ||--o| HARVEST_PLAN : "生成"
    HARVEST_PLAN }o--|| SHELTER : "属于"
    CUSTOMER_ORDER {
        string id PK "订单号"
        string customerName "客户名"
        string phone "联系电话"
        string deliveryDate "配送日期"
        string address "配送地址"
        string status "订单状态"
        number totalAmount "总金额"
        string specNote "包装要求"
        string createdAt "创建时间"
        string updatedAt "更新时间"
        string operator "当前处理人角色"
    }
    ORDER_ITEM {
        string id PK
        string orderId FK
        string flowerType "花卉品种"
        string color "颜色"
        number quantity "数量(扎)"
        number stemsPerBunch "每扎枝数"
        string shelterId "来源棚区"
        string remark "备注"
    }
    SHELTER {
        string id PK "棚区号"
        string flowerType "种植品种"
        string color "色系"
        number maturity "成熟度0-100"
        string status "状态:待成熟/可采切/已采切/异常"
        number availableQty "可采量(扎)"
        string forecastDate "预测可采日期"
        string actualDate "实际可采日期"
    }
    HARVEST_PLAN {
        string id PK
        string orderId FK
        string shelterId FK
        string planDate "计划采切日期"
        number planQty "计划采切量"
        number actualQty "实际采切量"
        string status "待采/采切中/已完成/异常"
        string operator "种植员"
    }
    OPERATION_LOG {
        string id PK
        string orderId FK
        string role "操作角色"
        string operatorName "操作人"
        string action "操作动作"
        string detail "详情"
        string timestamp "时间戳"
    }
    STUCK_RECORD {
        string id PK
        string orderId FK
        string stuckType "卡住类型"
        string reason "原因描述"
        string stuckAt "卡住时间"
        string resolvedAt "恢复时间(null表示未恢复)"
        string resolver "处理人"
        string resolution "处理措施"
    }
```

### 4.2 核心类型定义

```typescript
// 订单状态
type OrderStatus = 'PENDING_CONFIRM' | 'CONFIRMED' | 'HARVESTING' | 'PACKING' | 'COMPLETED' | 'STUCK';

// 卡住类型
type StuckType = 'FORECAST_DEVIATION' | 'PACKAGE_DAMAGE' | 'CUSTOMER_CHANGE' | 'OTHER';

// 订单
interface CustomerOrder {
  id: string;
  customerName: string;
  phone: string;
  deliveryDate: string;
  address: string;
  status: OrderStatus;
  totalAmount: number;
  specNote: string;
  createdAt: string;
  updatedAt: string;
  operator: 'SALES' | 'GROWER' | 'PACKER';
  items: OrderItem[];
  harvestPlan?: HarvestPlan;
  stuckRecord?: StuckRecord;
}

interface OrderItem {
  id: string;
  orderId: string;
  flowerType: string;
  color: string;
  quantity: number;
  stemsPerBunch: number;
  shelterId: string;
  remark: string;
}

interface Shelter {
  id: string;
  flowerType: string;
  color: string;
  maturity: number;
  status: 'IMMATURE' | 'READY' | 'HARVESTED' | 'ABNORMAL';
  availableQty: number;
  forecastDate: string;
  actualDate?: string;
}

interface HarvestPlan {
  id: string;
  orderId: string;
  shelterId: string;
  planDate: string;
  planQty: number;
  actualQty?: number;
  status: 'PENDING' | 'HARVESTING' | 'DONE' | 'ABNORMAL';
  operator: string;
}

interface OperationLog {
  id: string;
  orderId: string;
  role: 'SALES' | 'GROWER' | 'PACKER' | 'SYSTEM';
  operatorName: string;
  action: string;
  detail: string;
  timestamp: string;
}

interface StuckRecord {
  id: string;
  orderId: string;
  stuckType: StuckType;
  reason: string;
  stuckAt: string;
  resolvedAt?: string;
  resolver?: string;
  resolution?: string;
}
```

### 4.3 状态流转规则

```
PENDING_CONFIRM →(销售内勤确认订单)→ CONFIRMED →(系统自动生成采切排期)→ HARVESTING
HARVESTING →(种植员完成采切)→ PACKING →(包装主管发货)→ COMPLETED
任意状态 →(触发异常)→ STUCK →(处理后恢复)→ 回到卡住前状态
```

## 5. 目录结构

```
frontend/
├── src/
│   ├── main.ts                # 入口
│   ├── App.vue
│   ├── router/index.ts        # 路由配置
│   ├── stores/
│   │   ├── orders.ts          # 订单状态Store
│   │   ├── shelters.ts        # 棚区Store
│   │   └── ui.ts              # UI状态(抽屉、通知)
│   ├── mock/
│   │   ├── orders.ts          # 订单Mock(含正常/卡住)
│   │   ├── shelters.ts        # 棚区Mock
│   │   └── logs.ts            # 操作日志Mock
│   ├── types/
│   │   └── index.ts           # 类型定义
│   ├── views/
│   │   ├── RoleEntry.vue      # 角色入口
│   │   ├── SalesDesk.vue      # 销售内勤工作台
│   │   ├── GrowerDesk.vue     # 种植员工作台
│   │   ├── PackerDesk.vue     # 包装主管工作台
│   │   └── HistoryView.vue    # 历史记录回看
│   ├── components/
│   │   ├── common/
│   │   │   ├── StuckBanner.vue    # 顶部卡住提醒横幅
│   │   │   ├── RoleSwitcher.vue   # 角色快速切换
│   │   │   └── StatusTag.vue      # 通用状态标签
│   │   ├── sales/
│   │   │   ├── OrderListTable.vue # 订单流水表
│   │   │   └── OrderDetailDrawer.vue  # 订单详情抽屉
│   │   ├── grower/
│   │   │   ├── HarvestTimeline.vue    # 采切排期时间轴
│   │   │   └── ShelterKanban.vue      # 棚区状态看板
│   │   ├── packer/
│   │   │   ├── PackingQueue.vue       # 待包装看板
│   │   │   └── SpecCheckList.vue      # 规格核对清单
│   │   └── history/
│   │       ├── LogFilterBar.vue       # 筛选器
│   │       ├── StuckRecordPanel.vue   # 卡住记录专区
│   │       └── OrderTimeline.vue      # 流程时间线回放
│   ├── styles/
│   │   ├── main.scss
│   │   └── variables.scss         # CSS变量(主题色)
│   └── utils/
│       ├── date.ts                # 日期工具
│       └── flow.ts                # 状态流转逻辑
```
