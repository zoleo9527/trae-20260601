# 博物馆社教-讲师排班与教具准备系统 技术架构文档

## 1. 技术栈选型

### 1.1 前端技术栈
- **框架**：React 18 + TypeScript
- **路由**：React Router v6
- **状态管理**：Zustand（轻量级状态管理）
- **HTTP客户端**：Axios
- **UI组件库**：Tailwind CSS + 自定义组件
- **图标库**：Lucide React
- **日期处理**：Day.js
- **表单验证**：React Hook Form + Zod
- **构建工具**：Vite

### 1.2 后端技术栈
- **运行环境**：Node.js 18+
- **框架**：Express.js
- **语言**：TypeScript
- **数据存储**：JSON文件（模拟数据库）
- **API文档**：内联注释 + 接口文档

### 1.3 开发工具
- **包管理**：npm
- **代码规范**：ESLint + Prettier
- **类型检查**：TypeScript strict模式

---

## 2. 项目结构设计

### 2.1 整体目录结构

```
museum-education/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── api/                # API接口层
│   │   │   ├── schedule.ts     # 讲师排班API
│   │   │   ├── material.ts      # 物料清单API
│   │   │   ├── notification.ts  # 通知消息API
│   │   │   └── types.ts         # API类型定义
│   │   │
│   │   ├── components/          # UI组件
│   │   │   ├── common/          # 通用组件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── StatusTag.tsx
│   │   │   │   └── FileUpload.tsx
│   │   │   │
│   │   │   ├── layout/          # 布局组件
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   │
│   │   │   ├── schedule/        # 讲师排班模块
│   │   │   │   ├── ScheduleList.tsx
│   │   │   │   ├── ScheduleCard.tsx
│   │   │   │   ├── ScheduleDetail.tsx
│   │   │   │   ├── ScheduleForm.tsx
│   │   │   │   ├── ScheduleStatusFlow.tsx
│   │   │   │   ├── ScheduleChangeHistory.tsx
│   │   │   │   └── ScheduleAttachment.tsx
│   │   │   │
│   │   │   ├── material/        # 物料清单模块
│   │   │   │   ├── MaterialList.tsx
│   │   │   │   ├── MaterialCard.tsx
│   │   │   │   ├── MaterialDetail.tsx
│   │   │   │   ├── MaterialItem.tsx
│   │   │   │   ├── MaterialStatusFlow.tsx
│   │   │   │   └── MaterialHistory.tsx
│   │   │   │
│   │   │   └── notification/   # 通知消息模块
│   │   │       ├── NotificationCenter.tsx
│   │   │       ├── NotificationItem.tsx
│   │   │       └── NotificationBadge.tsx
│   │   │
│   │   ├── pages/              # 页面
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ScheduleListPage.tsx
│   │   │   ├── ScheduleDetailPage.tsx
│   │   │   ├── MaterialListPage.tsx
│   │   │   ├── MaterialDetailPage.tsx
│   │   │   ├── NotificationPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   │
│   │   ├── store/              # 状态管理
│   │   │   ├── scheduleStore.ts
│   │   │   ├── materialStore.ts
│   │   │   ├── notificationStore.ts
│   │   │   └── authStore.ts
│   │   │
│   │   ├── utils/              # 工具函数
│   │   │   ├── statusMachine.ts  # 状态机定义
│   │   │   ├── dateFormatter.ts
│   │   │   ├── notificationHelper.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── types/              # 类型定义
│   │   │   ├── schedule.types.ts
│   │   │   ├── material.types.ts
│   │   │   ├── notification.types.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── constants/          # 常量定义
│   │   │   ├── scheduleStatus.ts
│   │   │   ├── materialStatus.ts
│   │   │   └── notificationTypes.ts
│   │   │
│   │   ├── hooks/              # 自定义Hook
│   │   │   ├── useSchedule.ts
│   │   │   ├── useMaterial.ts
│   │   │   ├── useNotification.ts
│   │   │   └── useWorkflow.ts
│   │   │
│   │   ├── data/               # Mock数据
│   │   │   ├── mockSchedules.ts
│   │   │   ├── mockMaterials.ts
│   │   │   ├── mockNotifications.ts
│   │   │   └── mockUsers.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── routes/             # 路由
│   │   │   ├── schedule.routes.ts
│   │   │   ├── material.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── controllers/       # 控制器
│   │   │   ├── schedule.controller.ts
│   │   │   ├── material.controller.ts
│   │   │   └── notification.controller.ts
│   │   │
│   │   ├── services/         # 业务逻辑
│   │   │   ├── schedule.service.ts
│   │   │   ├── material.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── workflow.service.ts
│   │   │
│   │   ├── models/           # 数据模型
│   │   │   ├── schedule.model.ts
│   │   │   ├── material.model.ts
│   │   │   ├── notification.model.ts
│   │   │   └── status-transition.model.ts
│   │   │
│   │   ├── middleware/       # 中间件
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── error.middleware.ts
│   │   │
│   │   ├── utils/           # 工具函数
│   │   │   ├── dataStore.ts  # JSON文件存储
│   │   │   ├── statusMachine.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── data/            # 数据文件
│   │   │   ├── schedules.json
│   │   │   ├── materials.json
│   │   │   ├── notifications.json
│   │   │   ├── attachments.json
│   │   │   └── status-transitions.json
│   │   │
│   │   ├── types/           # 类型定义
│   │   │   └── index.ts
│   │   │
│   │   └── app.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── .trae/
│   ├── documents/
│   │   ├── PRD.md
│   │   └── TECHNICAL.md
│   │
│   └── rules/
│       ├── project_rules.md
│       └── api_standards.md
│
├── DELIVERY.md                 # 交付说明
└── README.md
```

---

## 3. 前后端边界设计

### 3.1 职责划分原则

**前端职责**
- UI渲染和用户交互
- 表单验证和用户体验优化
- 状态管理（仅前端UI状态）
- API调用和数据展示
- **不处理**：业务逻辑、数据持久化、跨模块通信

**后端职责**
- 业务逻辑处理
- 数据持久化
- 状态流转控制
- 跨模块通知触发
- 权限校验
- **不处理**：UI展示、用户交互细节

### 3.2 数据流向

```
┌─────────────┐
│   前端 UI    │◄──────────────┐
└──────┬──────┘               │
       │ 用户操作              │ 渲染
       ▼                      │
┌──────────────┐              │
│  API 调用    │              │
└──────┬───────┘              │
       │ HTTP请求              │
       ▼                      │
┌──────────────┐              │
│  后端控制器   │              │
└──────┬───────┘              │
       │ 业务逻辑              │
       ▼                      │
┌──────────────┐              │
│  业务服务层   │──────────────┤
└──────┬───────┘              │ 触发通知
       │ 数据操作              │
       ▼                      │
┌──────────────┐              │
│  数据存储层   │──────────────┘
└──────────────┘
```

---

## 4. API接口设计

### 4.1 讲师排班接口

#### 4.1.1 查询接口
```typescript
// 获取排班列表
GET /api/schedules
Query Parameters:
  - status?: ScheduleStatus           // 状态筛选
  - lecturerId?: string               // 讲师ID
  - startDate?: string                // 开始日期
  - endDate?: string                  // 结束日期
  - page?: number                     // 页码
  - pageSize?: number                 // 每页数量

Response:
{
  success: true,
  data: {
    items: ActivitySchedule[],
    total: number,
    page: number,
    pageSize: number
  }
}

// 获取排班详情
GET /api/schedules/:id

Response:
{
  success: true,
  data: ActivitySchedule
}

// 获取排班变更历史
GET /api/schedules/:id/changes

Response:
{
  success: true,
  data: ScheduleChange[]
}

// 获取排班附件列表
GET /api/schedules/:id/attachments

Response:
{
  success: true,
  data: Attachment[]
}
```

#### 4.1.2 操作接口
```typescript
// 创建排班
POST /api/schedules
Body: {
  courseId: string,
  courseName: string,
  scheduledAt: string,
  location: string,
  expectedParticipants: number,
  participantType: 'STUDENT' | 'ADULT' | 'FAMILY',
  lecturerId: string,
  lecturerName: string,
  lecturerPhone: string,
  lecturerEmail: string,
  lecturerRequirements?: string
}

Response:
{
  success: true,
  data: ActivitySchedule,
  message: '排班创建成功'
}

// 更新排班
PUT /api/schedules/:id
Body: {
  // 可更新字段
  scheduledAt?: string,
  location?: string,
  expectedParticipants?: number,
  lecturerId?: string,
  lecturerName?: string,
  lecturerPhone?: string,
  lecturerEmail?: string,
  lecturerRequirements?: string
}

Response:
{
  success: true,
  data: ActivitySchedule,
  message: '排班更新成功',
  notifications: Notification[]  // 返回需要发送的通知
}

// 状态流转
POST /api/schedules/:id/transition
Body: {
  action: 'CONFIRM' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'CANCEL',
  reason?: string,
  remarks?: string
}

Response:
{
  success: true,
  data: ActivitySchedule,
  notifications: Notification[],  // 自动触发相关通知
  relatedMaterialUpdated: boolean   // 指示是否更新了关联物料
}

// 上传附件
POST /api/schedules/:id/attachments
Body: FormData {
  file: File,
  category: '课件' | '教案' | '辅助材料'
}

Response:
{
  success: true,
  data: Attachment
}

// 删除排班
DELETE /api/schedules/:id

Response:
{
  success: true,
  message: '排班删除成功'
}
```

### 4.2 物料清单接口

#### 4.2.1 查询接口
```typescript
// 获取物料清单列表
GET /api/materials
Query Parameters:
  - scheduleId?: string              // 关联排班ID
  - status?: MaterialStatus           // 状态筛选
  - preparedBy?: string               // 准备人
  - startDate?: string                // 开始日期
  - endDate?: string                  // 结束日期

Response:
{
  success: true,
  data: {
    items: MaterialList[],
    total: number
  }
}

// 获取物料清单详情
GET /api/materials/:id

Response:
{
  success: true,
  data: MaterialList
}

// 获取历史物料记录
GET /api/materials/history
Query Parameters:
  - startDate: string
  - endDate: string
  - courseType?: string

Response:
{
  success: true,
  data: MaterialList[]
}

// 获取物料使用报表
GET /api/materials/report
Query Parameters:
  - startDate: string
  - endDate: string

Response:
{
  success: true,
  data: {
    totalMaterials: number,
    byCategory: { category: string, count: number }[],
    bySchedule: { scheduleId: string, courseName: string, materialCount: number }[]
  }
}
```

#### 4.2.2 操作接口
```typescript
// 创建物料清单（由后端根据排班自动创建，或手动创建）
POST /api/materials
Body: {
  scheduleId: string,
  materials: {
    name: string,
    category: 'DEMO' | 'OPERATION' | 'DISPLAY',
    quantity: number,
    unit: string,
    remarks?: string
  }[]
}

Response:
{
  success: true,
  data: MaterialList
}

// 更新物料清单
PUT /api/materials/:id
Body: {
  materials?: MaterialItem[],         // 更新物料明细
  remarks?: string
}

Response:
{
  success: true,
  data: MaterialList
}

// 认领物料准备任务
POST /api/materials/:id/claim
Body: {
  preparedBy: string
}

Response:
{
  success: true,
  data: MaterialList,
  message: '已认领物料准备任务'
}

// 更新物料状态
POST /api/materials/:id/transition
Body: {
  action: 'START_PREPARE' | 'MARK_READY' | 'MARK_BLOCKED' | 'IN_USE' | 'RETURN',
  materialId?: string,                // 单个物料ID（可选）
  reason?: string,
  remarks?: string
}

Response:
{
  success: true,
  data: MaterialList,
  notifications: Notification[]      // 自动触发讲师通知
}

// 讲师确认物料
POST /api/materials/:id/acknowledge
Body: {
  acknowledged: boolean,
  remarks?: string
}

Response:
{
  success: true,
  data: MaterialList
}

// 上传物料照片
POST /api/materials/:id/attachments
Body: FormData {
  file: File,
  category: '照片'
}

Response:
{
  success: true,
  data: Attachment
}

// 报告物料异常
POST /api/materials/:id/report-issue
Body: {
  materialId: string,
  type: 'DAMAGED' | 'MISSING',
  description: string,
  photoUrls?: string[]
}

Response:
{
  success: true,
  data: IssueReport,
  notifications: Notification[]       // 通知主管审批
}
```

### 4.3 通知消息接口

#### 4.3.1 查询接口
```typescript
// 获取消息列表
GET /api/notifications
Query Parameters:
  - userId: string                   // 用户ID
  - type?: NotificationType           // 消息类型
  - read?: boolean                    // 已读/未读筛选
  - page?: number
  - pageSize?: number

Response:
{
  success: true,
  data: {
    items: Notification[],
    unreadCount: number,
    total: number
  }
}

// 获取未读消息数量
GET /api/notifications/unread-count
Query Parameters:
  - userId: string

Response:
{
  success: true,
  data: {
    count: number
  }
}

// 获取单个消息详情
GET /api/notifications/:id

Response:
{
  success: true,
  data: Notification
}
```

#### 4.3.2 操作接口
```typescript
// 标记消息已读
POST /api/notifications/:id/read
Body: {
  userId: string
}

Response:
{
  success: true,
  message: '已标记为已读'
}

// 批量标记已读
POST /api/notifications/batch-read
Body: {
  userId: string,
  notificationIds: string[]
}

Response:
{
  success: true,
  message: '批量标记成功'
}

// 执行消息动作
POST /api/notifications/:id/action
Body: {
  userId: string,
  actionType: string,
  params?: any
}

Response:
{
  success: true,
  data: {
    action: string,
    result: any
  }
}

// 删除消息
DELETE /api/notifications/:id

Response:
{
  success: true,
  message: '消息删除成功'
}
```

### 4.4 状态流转接口

#### 4.4.1 查询接口
```typescript
// 获取状态流转历史
GET /api/status-transitions
Query Parameters:
  - entityType: 'SCHEDULE' | 'MATERIAL'
  - entityId: string

Response:
{
  success: true,
  data: StatusTransition[]
}
```

---

## 5. 状态机实现策略

### 5.1 前后端状态机分离

**后端状态机（权威）**
```typescript
// backend/src/utils/statusMachine.ts

export const ScheduleStatusMachine = {
  DRAFT: {
    label: '草稿',
    allowedTransitions: ['PENDING_CONFIRM'],
    onEnter: null,
    onExit: null
  },
  PENDING_CONFIRM: {
    label: '待社教老师确认',
    allowedTransitions: ['APPROVED', 'REJECTED'],
    onEnter: (schedule) => {
      // 通知社教老师
      notificationService.create({
        type: 'SCHEDULE_PENDING_CONFIRM',
        recipients: [schedule.createdBy],
        relatedScheduleId: schedule.id
      });
    },
    onExit: null
  },
  APPROVED: {
    label: '待活动主管审核',
    allowedTransitions: ['PUBLISHED', 'REJECTED'],
    onEnter: (schedule) => {
      // 通知活动主管
      notificationService.create({
        type: 'SCHEDULE_APPROVED',
        recipients: getActivityManagers(),
        relatedScheduleId: schedule.id
      });
    },
    onExit: null
  },
  PUBLISHED: {
    label: '已发布',
    allowedTransitions: ['CHANGED'],
    onEnter: (schedule) => {
      // 1. 自动创建物料清单
      materialService.createFromSchedule(schedule);
      // 2. 通知教具管理员
      notificationService.create({
        type: 'MATERIAL_CREATED',
        recipients: getMaterialManagers(),
        relatedScheduleId: schedule.id
      });
    },
    onExit: null
  },
  CHANGED: {
    label: '已变更',
    allowedTransitions: ['PUBLISHED'],
    onEnter: (schedule) => {
      // 1. 查找关联物料清单
      const material = materialService.findByScheduleId(schedule.id);
      if (material && material.status !== 'RETURNED') {
        // 2. 挂起物料准备
        materialService.updateStatus(material.id, 'BLOCKED');
        // 3. 通知教具管理员重新确认
        notificationService.create({
          type: 'MATERIAL_CHANGE_REQUIRED',
          recipients: [material.preparedBy],
          relatedScheduleId: schedule.id,
          relatedMaterialId: material.id
        });
      }
      // 4. 通知讲师
      notificationService.create({
        type: 'SCHEDULE_CHANGED',
        recipients: [schedule.lecturerId],
        relatedScheduleId: schedule.id
      });
    },
    onExit: null
  },
  REJECTED: {
    label: '已退回',
    allowedTransitions: ['PENDING_CONFIRM'],
    onEnter: (schedule) => {
      // 通知创建人
      notificationService.create({
        type: 'SCHEDULE_REJECTED',
        recipients: [schedule.createdBy],
        relatedScheduleId: schedule.id
      });
    },
    onExit: null
  }
};

export const MaterialStatusMachine = {
  NOT_STARTED: {
    label: '未开始',
    allowedTransitions: ['IN_PROGRESS']
  },
  IN_PROGRESS: {
    label: '准备中',
    allowedTransitions: ['READY', 'BLOCKED'],
    onEnter: (material) => {
      // 记录开始时间
      material.startedAt = new Date();
    }
  },
  BLOCKED: {
    label: '受阻',
    allowedTransitions: ['IN_PROGRESS'],
    onEnter: (material) => {
      // 通知主管
      notificationService.create({
        type: 'MATERIAL_BLOCKED',
        recipients: getActivityManagers(),
        relatedMaterialId: material.id
      });
    }
  },
  READY: {
    label: '已就绪',
    allowedTransitions: ['IN_USE', 'RETURNED'],
    onEnter: (material) => {
      // 通知讲师物料已就绪
      const schedule = scheduleService.findById(material.scheduleId);
      notificationService.create({
        type: 'MATERIAL_READY',
        recipients: [schedule.lecturerId],
        relatedMaterialId: material.id
      });
    }
  },
  IN_USE: {
    label: '使用中',
    allowedTransitions: ['RETURNED']
  },
  RETURNED: {
    label: '已归还',
    terminal: true,
    onEnter: (material) => {
      // 更新库存
      inventoryService.updateStock(material.materials);
    }
  }
};
```

**前端状态机（用于UI展示）**
```typescript
// frontend/src/utils/statusMachine.ts

export const ScheduleStatusConfig = {
  DRAFT: { label: '草稿', color: 'gray', icon: FileText },
  PENDING_CONFIRM: { label: '待确认', color: 'blue', icon: Clock },
  APPROVED: { label: '待审核', color: 'orange', icon: AlertCircle },
  PUBLISHED: { label: '已发布', color: 'green', icon: CheckCircle },
  CHANGED: { label: '已变更', color: 'yellow', icon: AlertTriangle },
  REJECTED: { label: '已退回', color: 'red', icon: XCircle }
};

export const MaterialStatusConfig = {
  NOT_STARTED: { label: '未开始', color: 'gray', icon: Circle },
  IN_PROGRESS: { label: '准备中', color: 'blue', icon: Loader },
  BLOCKED: { label: '受阻', color: 'red', icon: AlertTriangle },
  READY: { label: '已就绪', color: 'green', icon: CheckCircle },
  IN_USE: { label: '使用中', color: 'purple', icon: Package },
  RETURNED: { label: '已归还', color: 'gray', icon: Archive }
};

// 前端状态流转UI
export const ScheduleStatusFlow = [
  { status: 'DRAFT', label: '草稿', next: ['PENDING_CONFIRM'] },
  { status: 'PENDING_CONFIRM', label: '待社教老师确认', next: ['APPROVED', 'REJECTED'] },
  { status: 'APPROVED', label: '待活动主管审核', next: ['PUBLISHED', 'REJECTED'] },
  { status: 'PUBLISHED', label: '已发布', next: ['CHANGED'] },
  { status: 'CHANGED', label: '已变更', next: ['PUBLISHED'] },
  { status: 'REJECTED', label: '已退回', next: ['PENDING_CONFIRM'] }
];
```

### 5.2 状态流转执行流程

```typescript
// 后端：状态流转控制器
export async function transitionSchedule(req: Request, res: Response) {
  const { id } = req.params;
  const { action, reason, remarks } = req.body;

  try {
    const schedule = await scheduleService.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: '排班不存在' });
    }

    // 获取目标状态
    const actionToStatus = {
      'CONFIRM': 'PENDING_CONFIRM',
      'APPROVE': 'APPROVED',
      'REJECT': 'REJECTED',
      'PUBLISH': 'PUBLISHED',
      'CANCEL': 'REJECTED'
    };

    const targetStatus = actionToStatus[action];
    if (!targetStatus) {
      return res.status(400).json({ success: false, message: '无效的操作' });
    }

    // 验证状态流转合法性
    const machine = ScheduleStatusMachine[schedule.status];
    if (!machine.allowedTransitions.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `不能从 ${machine.label} 转换到 ${ScheduleStatusMachine[targetStatus].label}`
      });
    }

    // 执行状态流转
    const oldStatus = schedule.status;
    schedule.status = targetStatus;
    schedule.updatedAt = new Date();

    // 记录状态流转历史
    await statusTransitionService.create({
      entityType: 'SCHEDULE',
      entityId: id,
      fromStatus: oldStatus,
      toStatus: targetStatus,
      operator: req.body.userId,
      reason,
      remarks
    });

    // 保存更新
    await scheduleService.update(id, schedule);

    // 执行状态Enter钩子（可能触发通知）
    const statusConfig = ScheduleStatusMachine[targetStatus];
    let notifications = [];
    if (statusConfig.onEnter) {
      notifications = await statusConfig.onEnter(schedule);
    }

    // 检查是否需要更新关联物料
    let relatedMaterialUpdated = false;
    if (targetStatus === 'PUBLISHED') {
      // 自动创建物料清单
      await materialService.createFromSchedule(schedule);
      relatedMaterialUpdated = true;
    } else if (targetStatus === 'CHANGED') {
      // 挂起关联物料
      const material = await materialService.findByScheduleId(id);
      if (material) {
        await materialService.updateStatus(material.id, 'BLOCKED');
        relatedMaterialUpdated = true;
      }
    }

    res.json({
      success: true,
      data: schedule,
      notifications,
      relatedMaterialUpdated
    });

  } catch (error) {
    console.error('状态流转失败:', error);
    res.status(500).json({ success: false, message: '状态流转失败' });
  }
}
```

---

## 6. 跨模块感知机制实现

### 6.1 事件驱动架构

```typescript
// backend/src/services/workflow.service.ts

export class WorkflowService {
  private eventEmitter = new EventEmitter();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 监听排班变更事件
    this.eventEmitter.on('schedule.changed', async (data: {
      schedule: ActivitySchedule;
      oldSchedule: Partial<ActivitySchedule>;
      changedFields: string[];
    }) => {
      const { schedule, changedFields } = data;

      // 1. 检查是否影响物料准备
      const impactFields = ['scheduledAt', 'location', 'lecturerId', 'expectedParticipants'];
      const hasMaterialImpact = changedFields.some(field => impactFields.includes(field));

      if (hasMaterialImpact) {
        // 2. 查找关联物料清单
        const material = await this.materialService.findByScheduleId(schedule.id);

        if (material && material.status !== 'RETURNED') {
          // 3. 挂起物料准备
          await this.materialService.updateStatus(material.id, 'BLOCKED', {
            reason: `排班变更：${changedFields.join(', ')}`
          });

          // 4. 发送通知给教具管理员
          await this.notificationService.create({
            type: 'MATERIAL_CHANGE_REQUIRED',
            title: '讲师排班已变更，请重新确认物料',
            content: `课程【${schedule.courseName}】的排班信息已变更，请检查物料准备是否需要调整`,
            recipients: [material.preparedBy],
            relatedScheduleId: schedule.id,
            relatedMaterialId: material.id,
            priority: 'HIGH',
            actions: [
              { type: 'VIEW_SCHEDULE', label: '查看排班' },
              { type: 'VIEW_MATERIAL', label: '查看物料' },
              { type: 'RECONFIRM', label: '重新确认物料' }
            ]
          });

          // 5. 发送通知给讲师
          await this.notificationService.create({
            type: 'SCHEDULE_CHANGED',
            title: '您的排班已变更',
            content: `课程【${schedule.courseName}】的排班信息已变更，物料管理员将重新确认物料准备情况`,
            recipients: [schedule.lecturerId],
            relatedScheduleId: schedule.id,
            priority: 'HIGH',
            actions: [
              { type: 'VIEW_SCHEDULE', label: '查看排班详情' },
              { type: 'VIEW_MATERIAL', label: '查看物料准备' }
            ]
          });
        }
      }
    });

    // 监听物料就绪事件
    this.eventEmitter.on('material.ready', async (data: {
      material: MaterialList;
    }) => {
      const { material } = data;

      // 查找关联排班
      const schedule = await this.scheduleService.findById(material.scheduleId);

      if (schedule) {
        // 通知讲师物料已就绪
        await this.notificationService.create({
          type: 'MATERIAL_READY',
          title: '物料已准备就绪',
          content: `课程【${schedule.courseName}】的物料已准备就绪，请确认是否符合要求`,
          recipients: [schedule.lecturerId],
          relatedScheduleId: schedule.id,
          relatedMaterialId: material.id,
          priority: 'MEDIUM',
          actions: [
            { type: 'VIEW_MATERIAL', label: '查看物料清单' },
            { type: 'ACKNOWLEDGE', label: '确认物料' }
          ]
        });
      }
    });

    // 监听物料受阻事件
    this.eventEmitter.on('material.blocked', async (data: {
      material: MaterialList;
      reason: string;
    }) => {
      const { material, reason } = data;

      // 通知活动主管
      const managers = await this.userService.getByRole('ACTIVITY_MANAGER');

      await this.notificationService.create({
        type: 'MATERIAL_BLOCKED',
        title: '物料准备受阻',
        content: `课程物料准备遇到问题：${reason}`,
        recipients: managers.map(m => m.id),
        relatedMaterialId: material.id,
        priority: 'HIGH',
        actions: [
          { type: 'VIEW_MATERIAL', label: '查看详情' },
          { type: 'HANDLE_ISSUE', label: '处理问题' }
        ]
      });
    });
  }

  // 触发排班变更事件
  async onScheduleChanged(scheduleId: string, oldData: Partial<ActivitySchedule>, newData: ActivitySchedule) {
    const changedFields = Object.keys(newData).filter(
      key => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
    );

    this.eventEmitter.emit('schedule.changed', {
      schedule: newData,
      oldSchedule: oldData,
      changedFields
    });
  }

  // 触发物料就绪事件
  async onMaterialReady(materialId: string) {
    const material = await this.materialService.findById(materialId);
    this.eventEmitter.emit('material.ready', { material });
  }

  // 触发物料受阻事件
  async onMaterialBlocked(materialId: string, reason: string) {
    const material = await this.materialService.findById(materialId);
    this.eventEmitter.emit('material.blocked', { material, reason });
  }
}
```

### 6.2 前端感知机制

```typescript
// frontend/src/store/notificationStore.ts

import { create } from 'zustand';
import { notificationApi } from '../api/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  executeAction: (id: string, actionType: string, params?: any) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const currentUser = getCurrentUser();
      const response = await notificationApi.getList({
        userId: currentUser.id,
        pageSize: 20
      });

      set({
        notifications: response.data.items,
        unreadCount: response.data.unreadCount,
        isLoading: false
      });

      // 轮询检查新通知（每30秒）
      setTimeout(() => {
        get().fetchNotifications();
      }, 30000);

    } catch (error) {
      console.error('获取通知失败:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const currentUser = getCurrentUser();
      await notificationApi.markAsRead(id, { userId: currentUser.id });

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  },

  executeAction: async (id: string, actionType: string, params?: any) => {
    try {
      const currentUser = getCurrentUser();
      const response = await notificationApi.executeAction(id, {
        userId: currentUser.id,
        actionType,
        params
      });

      // 根据动作类型刷新相关数据
      switch (actionType) {
        case 'RECONFIRM':
          // 刷新物料数据
          await materialStore.getState().fetchMaterial(params.materialId);
          break;
        case 'ACKNOWLEDGE':
          // 标记物料已确认
          await materialStore.getState().acknowledgeMaterial(params.materialId);
          break;
        default:
          break;
      }

      // 标记为已读
      await get().markAsRead(id);

      return response;

    } catch (error) {
      console.error('执行动作失败:', error);
      throw error;
    }
  }
}));

// frontend/src/components/notification/NotificationItem.tsx

export function NotificationItem({ notification, onAction }) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleAction = async (action: NotificationAction) => {
    setIsExecuting(true);
    try {
      await notificationStore.getState().executeAction(
        notification.id,
        action.type,
        {
          scheduleId: notification.relatedScheduleId,
          materialId: notification.relatedMaterialId
        }
      );
      onAction?.();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all',
        !notification.read && 'bg-blue-50 border-l-4 border-blue-500'
      )}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />

        <div className="flex-1">
          <h4 className="font-medium">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.content}</p>

          <div className="flex gap-2 mt-3">
            {notification.actions.map(action => (
              <Button
                key={action.type}
                size="small"
                loading={isExecuting}
                onClick={() => handleAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {formatTime(notification.createdAt)}
        </div>
      </div>
    </Card>
  );
}
```

---

## 7. 附件管理策略

### 7.1 统一附件表设计

**不分散**：附件不存储在业务表临时字段，统一存储在附件表，通过 entityType + entityId 关联。

```typescript
// backend/src/models/attachment.model.ts

interface Attachment {
  id: string;
  entityType: 'SCHEDULE' | 'MATERIAL';
  entityId: string;
  category: string;                     // 分类标识
  fileName: string;
  fileUrl: string;                      // 文件存储路径
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// 预定义的分类
const AttachmentCategories = {
  SCHEDULE: {
    '课件': 'COURSEWARE',
    '教案': 'LESSON_PLAN',
    '辅助材料': 'AUXILIARY'
  },
  MATERIAL: {
    '照片': 'PHOTO',
    '清单文档': 'LIST_DOCUMENT',
    '其他': 'OTHER'
  }
};
```

### 7.2 前端附件组件

```typescript
// frontend/src/components/common/FileUpload.tsx

interface FileUploadProps {
  entityType: 'SCHEDULE' | 'MATERIAL';
  entityId: string;
  category: string;
  files: Attachment[];
  onUpload?: (file: Attachment) => void;
  onDelete?: (id: string) => void;
}

export function ScheduleAttachment({
  entityType,
  entityId,
  files
}: FileUploadProps) {
  const categories = AttachmentCategories[entityType];

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([label, value]) => {
        const categoryFiles = files.filter(f => f.category === value);

        return (
          <div key={value}>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">{label}</label>
              <Upload
                accept={getAcceptTypes(value)}
                beforeUpload={handleUpload}
              >
                <Button size="small" icon={<UploadIcon />}>
                  上传
                </Button>
              </Upload>
            </div>

            {categoryFiles.length > 0 ? (
              <List
                dataSource={categoryFiles}
                renderItem={file => (
                  <List.Item
                    actions={[
                      <Button
                        key="download"
                        type="link"
                        onClick={() => downloadFile(file)}
                      >
                        下载
                      </Button>,
                      <Button
                        key="delete"
                        type="link"
                        danger
                        onClick={() => deleteFile(file.id)}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileIcon type={file.mimeType} />}
                      title={file.fileName}
                      description={formatFileSize(file.fileSize)}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无附件" />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## 8. 数据持久化策略

### 8.1 JSON文件存储

```typescript
// backend/src/utils/dataStore.ts

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../data');

export class DataStore {
  private cache: Map<string, any> = new Map();

  async read<T>(filename: string): Promise<T> {
    if (this.cache.has(filename)) {
      return this.cache.get(filename);
    }

    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);

    this.cache.set(filename, parsed);
    return parsed as T;
  }

  async write<T>(filename: string, data: T): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    this.cache.set(filename, data);
  }

  async update<T>(
    filename: string,
    predicate: (item: T) => boolean,
    updater: (item: T) => T
  ): Promise<T | null> {
    const data = await this.read<T[]>(filename);
    const index = data.findIndex(predicate);

    if (index === -1) return null;

    data[index] = updater(data[index]);
    await this.write(filename, data);

    return data[index];
  }

  async find<T>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<T | null> {
    const data = await this.read<T[]>(filename);
    return data.find(predicate) || null;
  }

  async findAll<T>(
    filename: string,
    predicate?: (item: T) => boolean
  ): Promise<T[]> {
    const data = await this.read<T[]>(filename);
    return predicate ? data.filter(predicate) : data;
  }

  async create<T extends { id: string }>(
    filename: string,
    item: T
  ): Promise<T> {
    const data = await this.read<T[]>(filename);
    data.push(item);
    await this.write(filename, data);
    return item;
  }

  async delete<T>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<boolean> {
    const data = await this.read<T[]>(filename);
    const index = data.findIndex(predicate);

    if (index === -1) return false;

    data.splice(index, 1);
    await this.write(filename, data);
    return true;
  }
}

export const dataStore = new DataStore();
```

---

## 9. 错误处理策略

### 9.1 统一错误响应格式

```typescript
// backend/src/middleware/error.middleware.ts

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // 未知错误
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  });
};
```

### 9.2 前端错误处理

```typescript
// frontend/src/utils/errorHandler.ts

import { message } from 'antd';

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function handleApiError(error: ApiError) {
  const errorMessages = {
    'SCHEDULE_NOT_FOUND': '排班不存在',
    'MATERIAL_NOT_FOUND': '物料清单不存在',
    'INVALID_STATUS_TRANSITION': '无效的状态流转',
    'UNAUTHORIZED': '无权限操作',
    'VALIDATION_ERROR': '数据验证失败'
  };

  const displayMessage = errorMessages[error.error.code] || error.error.message;

  message.error({
    content: displayMessage,
    description: error.error.details?.message
  });

  return error;
}
```

---

## 10. 性能优化策略

### 10.1 前端优化

- **路由懒加载**：使用 React.lazy 进行页面级代码分割
- **状态缓存**：Zustand store 合理分片，避免全局状态过大
- **列表虚拟化**：长列表使用 react-window
- **请求缓存**：React Query 管理请求状态和缓存

### 10.2 后端优化

- **内存缓存**：DataStore 实现了简单的内存缓存
- **分页查询**：所有列表接口支持分页
- **索引优化**：JSON 数据按常用查询字段组织

---

## 11. 部署说明

### 11.1 开发环境
```bash
# 启动后端
cd backend
npm install
npm run dev

# 启动前端
cd frontend
npm install
npm run dev
```

### 11.2 环境变量
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3001/api

# backend/.env
PORT=3001
DATA_DIR=./src/data
```

### 11.3 CORS配置
后端已配置允许前端开发服务器访问：
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```
