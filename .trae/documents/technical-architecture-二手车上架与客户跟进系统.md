# 二手车商-上架定价与客户跟进系统 技术架构

## 1. 技术选型

**前端框架**：Nuxt 3 + Vue 3 Composition API
- 理由：用户明确接受 Nuxt 3 + Nitro 组合
- SSR 能力支持 SEO（未来可选）
- 文件路由系统简化页面管理

**样式方案**：Tailwind CSS
- 快速开发响应式界面
- 自定义主题支持品牌一致性

**数据层**：Mock Data（JSON 文件）
- 前端优先，快速原型
- 支持本地存储持久化
- 未来可无缝切换到真实后端 API

**图标库**：Heroicons（轻量级 SVG 图标）

---

## 2. 项目结构

```
├── nuxt.config.ts              # Nuxt 配置
├── app.vue                     # 根组件
├── pages/
│   ├── index.vue               # 首页/台账列表
│   ├── vehicle/
│   │   ├── [id].vue            # 车辆详情
│   │   └── pricing.vue         # 定价处理（独立页面）
│   └── followup/
│       └── [id].vue            # 跟进管理（独立页面）
├── components/
│   ├── VehicleCard.vue         # 车辆卡片组件
│   ├── StatusTimeline.vue      # 状态时间轴
│   ├── FollowupRecord.vue      # 跟进记录组件
│   ├── HandoverModal.vue       # 交接操作弹窗
│   ├── PricingForm.vue         # 定价表单
│   ├── FilterPanel.vue         # 筛选面板
│   └── StatusBadge.vue         # 状态标签
├── composables/
│   ├── useVehicles.ts          # 车辆数据管理
│   ├── useTimeline.ts          # 时间轴逻辑
│   └── useHandover.ts           # 交接流程逻辑
├── data/
│   ├── vehicles.json           # 车辆初始数据
│   ├── statuses.json           # 状态定义
│   └── users.json              # 用户/角色数据
├── types/
│   └── index.ts                # TypeScript 类型定义
└── utils/
    └── status.ts               # 状态流转工具函数
```

---

## 3. 数据模型

### 3.1 车辆主数据

```typescript
interface Vehicle {
  id: string;                    // 车辆唯一标识
  plate: string;                 // 车牌号
  model: string;                 // 车型
  brand: string;                 // 品牌
  year: number;                  // 年份
  mileage: number;               // 行驶里程（公里）
  purchasePrice: number;         // 收车价
  listedPrice: number;           // 上架定价
  status: VehicleStatus;         // 当前状态
  collector: User;               // 收车经理
  evaluator: User | null;         // 评估师
  financeStaff: User | null;     // 金融专员
  salesRep: User | null;         // 销售顾问
  timeline: TimelineEvent[];     // 状态时间轴
  followups: FollowupRecord[];   // 跟进记录
  attachments: Attachment[];     // 附件
  createdAt: string;             // 入库时间
  updatedAt: string;             // 更新时间
}
```

### 3.2 状态时间轴

```typescript
interface TimelineEvent {
  id: string;
  status: VehicleStatus;
  operator: User;
  time: string;
  remark: string;
  attachments?: Attachment[];
  type: 'status_change' | 'handover' | 'pricing';
}
```

### 3.3 跟进记录

```typescript
interface FollowupRecord {
  id: string;
  vehicleId: string;
  operator: User;
  time: string;
  method: 'phone' | 'wechat' | 'visit';
  customerInfo: string;
  content: string;
  nextFollowupTime: string | null;
  result: 'pending' | 'interested' | 'negotiating' | 'success' | 'failed';
  attachments?: Attachment[];
}
```

### 3.4 交接记录

```typescript
interface Handover {
  id: string;
  vehicleId: string;
  fromUser: User;
  toUser: User;
  time: string;
  remark: string;
  attachments?: Attachment[];
  vehicleStatus: VehicleStatus;
}
```

---

## 4. 核心页面路由

| 路由 | 页面 | 功能 |
|------|------|------|
| `/` | 台账列表页 | 车辆列表、筛选、搜索 |
| `/vehicle/:id` | 车辆详情页 | 基础信息、状态轴、交接记录、跟进历史 |
| `/vehicle/:id/pricing` | 定价处理页 | 提交/审核/确认定价流程 |
| `/vehicle/:id/followup` | 跟进管理页 | 添加跟进、查看跟进历史 |

---

## 5. 状态流转规则

### 5.1 状态定义

```typescript
enum VehicleStatus {
  '入库待评估' = 'pending_evaluation',
  '评估中' = 'evaluating',
  '待定价' = 'pending_pricing',
  '定价待确认' = 'pricing_pending',
  '已上架' = 'listed',
  '客户跟进中' = 'following',
  '已成交' = 'sold',
  '已下架' = 'unlisted'
}
```

### 5.2 状态权限矩阵

| 当前状态 | 可执行操作 | 操作后状态 | 操作人 |
|---------|----------|----------|--------|
| 入库待评估 | 提交评估 | 评估中 | 收车经理 |
| 评估中 | 完成评估 | 待定价 | 评估师 |
| 待定价 | 提交定价 | 定价待确认 | 收车经理 |
| 定价待确认 | 确认定价 | 已上架 | 金融专员 |
| 已上架 | 发起跟进 | 客户跟进中 | 销售顾问 |
| 客户跟进中 | 成交/失败 | 已成交/已下架 | 销售顾问 |

### 5.3 交接触发规则

- **评估交接**：入库待评估 → 评估中 时触发（收车经理→评估师）
- **定价交接**：评估完成 → 待定价 时触发（评估师→收车经理）
- **上架交接**：定价待确认 → 已上架 时触发（收车经理→金融专员）
- **跟进交接**：已上架 → 客户跟进中 时触发（金融专员→销售顾问）

---

## 6. Mock 数据初始化

### 6.1 数据量要求

- 车辆数据：5-8 辆（不同状态）
- 每辆车包含：完整时间轴 + 3-5 条跟进记录
- 用户数据：4 人（收车经理、评估师、金融专员、销售顾问各 1）

### 6.2 初始数据示例

**车辆示例 1**（刚入库）：
```json
{
  "id": "VEH-2024-001",
  "plate": "京A12345",
  "model": "宝马5系 2022款 530Li 尊享型",
  "brand": "宝马",
  "year": 2022,
  "mileage": 32000,
  "purchasePrice": 320000,
  "listedPrice": null,
  "status": "pending_evaluation",
  "collector": { "id": "U001", "name": "张伟", "role": "collector" },
  "evaluator": null,
  "financeStaff": null,
  "salesRep": null,
  "timeline": [
    {
      "id": "TL-001",
      "status": "pending_evaluation",
      "operator": { "id": "U001", "name": "张伟", "role": "collector" },
      "time": "2024-06-14 09:30",
      "remark": "客户置换，车况良好，无事故记录，已做初检",
      "type": "status_change"
    }
  ],
  "followups": [],
  "createdAt": "2024-06-14 09:30",
  "updatedAt": "2024-06-14 09:30"
}
```

**车辆示例 2**（客户跟进中）：
```json
{
  "id": "VEH-2024-002",
  "plate": "沪B67890",
  "model": "奔驰E级 2023款 E300L 豪华型",
  "brand": "奔驰",
  "year": 2023,
  "mileage": 15000,
  "purchasePrice": 420000,
  "listedPrice": 458000,
  "status": "following",
  "collector": { "id": "U001", "name": "张伟", "role": "collector" },
  "evaluator": { "id": "U002", "name": "李明", "role": "evaluator" },
  "financeStaff": { "id": "U003", "name": "王芳", "role": "finance" },
  "salesRep": { "id": "U004", "name": "赵强", "role": "sales" },
  "timeline": [
    {
      "id": "TL-002-1",
      "status": "pending_evaluation",
      "operator": { "id": "U001", "name": "张伟" },
      "time": "2024-06-10 10:00",
      "remark": "个人一手车，车况优秀",
      "type": "status_change"
    },
    {
      "id": "TL-002-2",
      "status": "evaluating",
      "operator": { "id": "U001", "name": "张伟" },
      "toUser": { "id": "U002", "name": "李明" },
      "time": "2024-06-10 10:15",
      "remark": "交接给评估师进行专业检测",
      "type": "handover"
    },
    {
      "id": "TL-002-3",
      "status": "evaluating",
      "operator": { "id": "U002", "name": "李明" },
      "time": "2024-06-10 15:30",
      "remark": "评估完成：外观良好，内饰干净，发动机无异响，底盘无异常。轻微左后轮毂划痕。检测报告显示无重大事故、火烧、水泡。",
      "type": "status_change"
    },
    {
      "id": "TL-002-4",
      "status": "pending_pricing",
      "operator": { "id": "U002", "name": "李明" },
      "toUser": { "id": "U001", "name": "张伟" },
      "time": "2024-06-10 16:00",
      "remark": "评估完成，交接给收车经理进行定价",
      "type": "handover"
    },
    {
      "id": "TL-002-5",
      "status": "pending_pricing",
      "operator": { "id": "U001", "name": "张伟" },
      "time": "2024-06-11 09:00",
      "remark": "提交定价建议：收车价42万，预期售价45.8万，金融方案建议走奔驰金融贴息",
      "type": "pricing",
      "data": { "purchasePrice": 420000, "suggestedPrice": 458000 }
    },
    {
      "id": "TL-002-6",
      "status": "pricing_pending",
      "operator": { "id": "U001", "name": "张伟" },
      "toUser": { "id": "U003", "name": "王芳" },
      "time": "2024-06-11 09:10",
      "remark": "定价提交，移交金融专员审核",
      "type": "handover"
    },
    {
      "id": "TL-002-7",
      "status": "pricing_pending",
      "operator": { "id": "U003", "name": "王芳" },
      "time": "2024-06-11 14:00",
      "remark": "金融方案确认：首付30%可做，贴息政策确认，可给客户再优惠5000元",
      "type": "pricing",
      "data": { "finalPrice": 453000 }
    },
    {
      "id": "TL-002-8",
      "status": "listed",
      "operator": { "id": "U003", "name": "王芳" },
      "time": "2024-06-11 14:30",
      "remark": "确认上架定价：45.3万，金融方案已准备好",
      "type": "status_change"
    },
    {
      "id": "TL-002-9",
      "status": "listed",
      "operator": { "id": "U003", "name": "王芳" },
      "toUser": { "id": "U004", "name": "赵强" },
      "time": "2024-06-11 15:00",
      "remark": "车辆上架，移交销售顾问进行客户跟进",
      "type": "handover"
    },
    {
      "id": "TL-002-10",
      "status": "following",
      "operator": { "id": "U004", "name": "赵强" },
      "time": "2024-06-11 15:30",
      "remark": "开始客户跟进，目标客群：企业高管置换",
      "type": "status_change"
    }
  ],
  "followups": [
    {
      "id": "FU-002-1",
      "vehicleId": "VEH-2024-002",
      "operator": { "id": "U004", "name": "赵强" },
      "time": "2024-06-12 10:00",
      "method": "phone",
      "customerInfo": "李先生 138****8888",
      "content": "首次联系，客户表示对车型感兴趣，但价格超出预算5万。客户现有车辆可参与置换评估。已约下周二到店看车。",
      "nextFollowupTime": "2024-06-18 14:00",
      "result": "interested",
      "attachments": []
    },
    {
      "id": "FU-002-2",
      "vehicleId": "VEH-2024-002",
      "operator": { "id": "U004", "name": "赵强" },
      "time": "2024-06-18 14:30",
      "method": "visit",
      "customerInfo": "李先生",
      "content": "客户到店看车，对车况非常满意。现场评估了客户的旧车（奥迪A4L 2020款），残值约18万。综合考虑后，客户对含置换的总价敏感。正在和金融专员协商更优方案。",
      "nextFollowupTime": "2024-06-20 10:00",
      "result": "negotiating",
      "attachments": []
    },
    {
      "id": "FU-002-3",
      "vehicleId": "VEH-2024-002",
      "operator": { "id": "U004", "name": "赵强" },
      "time": "2024-06-20 11:00",
      "method": "wechat",
      "customerInfo": "李先生",
      "content": "发送了新的金融方案：首付25%+置换补贴+3年0息。客户表示方案可以接受，但希望再送一次保养。已向领导申请。",
      "nextFollowupTime": "2024-06-21 09:00",
      "result": "negotiating",
      "attachments": []
    }
  ],
  "createdAt": "2024-06-10 10:00",
  "updatedAt": "2024-06-20 11:00"
}
```

---

## 7. 核心组件设计

### 7.1 VehicleCard（车辆卡片）

**显示信息**：
- 车牌号、车型、品牌
- 当前状态（颜色标签）
- 责任人（当前接手人）
- 最新跟进摘要（如有）
- 入库时间

**交互**：
- 点击进入详情页
- 悬停显示快捷操作（查看详情、发起交接）

### 7.2 StatusTimeline（状态时间轴）

**显示**：
- 垂直时间轴，节点表示状态
- 每个节点：时间、状态、操作人、备注
- 不同类型用不同图标区分（状态变更/交接/定价）
- 支持折叠/展开详情

**交互**：
- 点击节点展开详情
- 交接节点可查看交接双方
- 定价节点可查看定价详情

### 7.3 FilterPanel（筛选面板）

**筛选条件**：
- 状态：多选
- 收车经理：单选
- 评估师：单选
- 金融专员：单选
- 品牌：单选/多选
- 时间范围：入库时间

**排序**：
- 入库时间（升序/降序）
- 上架时间
- 收车价

---

## 8. 关键技术实现

### 8.1 状态流转控制

```typescript
// composables/useStatusTransition.ts
export const useStatusTransition = () => {
  const statusConfig = {
    pending_evaluation: {
      canTransitionTo: ['evaluating'],
      requiredRole: 'collector',
      action: '提交评估'
    },
    evaluating: {
      canTransitionTo: ['pending_pricing'],
      requiredRole: 'evaluator',
      action: '完成评估'
    },
    // ... 其他状态配置
  };

  const canTransition = (currentStatus: string, targetStatus: string, userRole: string) => {
    const config = statusConfig[currentStatus];
    return config?.canTransitionTo.includes(targetStatus) && config.requiredRole === userRole;
  };

  return { statusConfig, canTransition };
};
```

### 8.2 交接流程

```typescript
// composables/useHandover.ts
export const useHandover = () => {
  const createHandover = async (vehicleId: string, toUser: User, remark: string) => {
    const handover: Handover = {
      id: generateId(),
      vehicleId,
      fromUser: currentUser.value,
      toUser,
      time: new Date().toISOString(),
      remark,
      vehicleStatus: getCurrentStatus(vehicleId)
    };

    // 更新时间轴
    await addTimelineEvent(vehicleId, {
      ...handover,
      type: 'handover'
    });

    // 更新车辆责任人
    await updateVehicleAssignee(vehicleId, toUser);
  };

  return { createHandover };
};
```

### 8.3 数据持久化

```typescript
// composables/useVehicles.ts
export const useVehicles = () => {
  const vehicles = ref<Vehicle[]>([]);

  // 从 localStorage 加载
  const loadVehicles = () => {
    const stored = localStorage.getItem('vehicles');
    if (stored) {
      vehicles.value = JSON.parse(stored);
    } else {
      // 加载初始数据
      vehicles.value = await import('../data/vehicles.json');
    }
  };

  // 保存到 localStorage
  const saveVehicles = () => {
    localStorage.setItem('vehicles', JSON.stringify(vehicles.value));
  };

  return { vehicles, loadVehicles, saveVehicles };
};
```

---

## 9. 性能优化

- **列表虚拟滚动**：车辆数量多时使用虚拟列表
- **状态缓存**：使用 `useAsyncData` 缓存状态配置
- **懒加载**：详情页组件按需加载
- **图片优化**：使用 Nuxt Image 组件

---

## 10. 未来扩展方向

1. **后端 API**：切换到 Nitro + PostgreSQL
2. **权限系统**：基于角色的访问控制（RBAC）
3. **消息通知**：站内信、微信通知
4. **数据分析**：成交率、跟进转化率统计
5. **移动端**：微信小程序适配
