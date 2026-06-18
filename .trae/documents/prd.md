# 博物馆社教-讲师排班与教具准备系统 PRD

## 1. 产品概述

### 1.1 产品定位
博物馆社会教育（社教）活动的核心业务流程管理系统，专注于讲师排班与教具准备的协同管理，解决多角色、多部门间的责任划分不清、状态流转不透明的问题。

### 1.2 核心价值
- **可视化推进**：提供清晰的任务看板和状态流转，而非简单的查询入口
- **责任追溯**：明确社教老师、志愿者、活动主管的处理节奏和责任边界
- **实时感知**：讲师排班变更时，教具准备模块自动感知并触发相应流程
- **状态可控**：附件、临时状态统一管理，避免散落在业务逻辑中

### 1.3 目标用户
| 角色 | 职责 | 核心诉求 |
|------|------|---------|
| 社教老师 | 负责课程内容设计和教学执行 | 需要明确知道讲师排班状态、物料准备进度 |
| 志愿者 | 协助活动执行和物料管理 | 需要清晰的任务清单和完成标准 |
| 活动主管 | 统筹协调、审批把关 | 需要全局视图、异常预警和处理决策 |
| 教具管理员 | 负责教具的保管、准备和回收 | 需要与讲师排班联动的任务触发机制 |

---

## 2. 业务流程架构

### 2.1 主流程：社教活动全生命周期

```
[活动策划] → [课程设计] → [讲师排班] ↔ [教具准备] → [活动执行] → [活动复盘]
    ↓            ↓            ↓              ↓              ↓
[志愿者招募] [内容审核]  [排班确认]      [物料清单]      [满意度收集]
```

### 2.2 核心子流程

#### 2.2.1 讲师排班流程
```
讲师排班申请 → 社教老师确认 → 活动主管审核 → 排班发布 → [触发教具准备]
```

#### 2.2.2 教具准备流程
```
接收排班通知 → 生成物料清单 → 教具管理员认领 → 准备中 → 已就绪 → [反馈讲师]
```

### 2.3 跨模块感知机制
**关键场景：讲师排班变更**
- 触发条件：讲师排班时间变更、讲师更换、课程内容调整
- 通知链路：讲师排班模块 → 消息中心 → 教具准备模块
- 响应动作：
  - 自动挂起未开始的物料准备任务
  - 生成变更影响分析（哪些物料需要调整）
  - 通知相关教具管理员重新确认

---

## 3. 功能模块设计

### 3.1 讲师排班管理模块

#### 3.1.1 排班列表
- **状态维度**：全部、待确认、已确认、已发布、已变更
- **信息展示**：
  - 课程名称、时间、地点、讲师
  - 预计参与人数
  - 关联教具清单状态（未准备/准备中/已就绪）
- **操作入口**：
  - 新建排班
  - 查看详情
  - 编辑（需记录变更原因）
  - 撤回/取消

#### 3.1.2 排班详情页
- **基础信息区**
  - 课程基本信息（名称、目标、时间、地点）
  - 参与对象（学生/成人/亲子等）
  - 预计人数

- **讲师信息区**
  - 讲师姓名、联系方式
  - 讲师简介
  - 历史授课评分
  - 特殊要求（设备、场地布置）

- **状态流转区**
  ```
  [草稿] → [待社教老师确认] → [待活动主管审核] → [已发布]
                    ↓                 ↓
              [已退回]           [已退回]
                    ↓                 ↓
              [修改后重提]      [修改后重提]
  ```

- **变更历史区**
  - 记录所有变更操作
  - 包含变更人、变更时间、变更内容
  - 标注是否已通知相关方

- **附件占位区**
  - 课件上传
  - 教案文档
  - 辅助材料
  - **统一管理**：附件与状态分离存储，避免散落在临时字段

### 3.2 教具准备管理模块

#### 3.2.1 物料清单管理
- **清单状态**：未领取、准备中、已就绪、部分就绪、已归还
- **清单信息**：
  - 关联的讲师排班ID
  - 物料类别（演示类、操作类、展示类）
  - 具体物料明细
  - 预计使用时间

- **回看功能**
  - 支持按时间范围查询历史物料使用记录
  - 支持按课程类型统计物料消耗
  - 支持导出报表

#### 3.2.2 教具领取与归还
- **领取流程**
  ```
  查看待领取清单 → 认领任务 → 开始准备 → 确认就绪 → 通知讲师
  ```

- **归还流程**
  ```
  活动结束 → 提交归还清单 → 教具管理员验收 → 确认归还 → 更新库存
  ```

- **异常处理**
  - 物料损坏：拍照留证 → 提交损坏报告 → 主管审批
  - 物料丢失：触发赔偿流程 → 记录日志

### 3.3 工作流引擎模块

#### 3.3.1 状态机定义
```typescript
// 讲师排班状态机
states: {
  DRAFT: { label: '草稿', allowedTransitions: ['PENDING_CONFIRM'] },
  PENDING_CONFIRM: { label: '待社教老师确认', allowedTransitions: ['APPROVED', 'REJECTED'] },
  APPROVED: { label: '待活动主管审核', allowedTransitions: ['PUBLISHED', 'REJECTED'] },
  PUBLISHED: { label: '已发布', allowedTransitions: ['CHANGED'] },
  CHANGED: { label: '已变更', allowedTransitions: ['PUBLISHED'] },
  REJECTED: { label: '已退回', allowedTransitions: ['PENDING_CONFIRM'] }
}

// 教具准备状态机
states: {
  NOT_STARTED: { label: '未开始', allowedTransitions: ['IN_PROGRESS'] },
  IN_PROGRESS: { label: '准备中', allowedTransitions: ['READY', 'BLOCKED'] },
  BLOCKED: { label: '受阻', allowedTransitions: ['IN_PROGRESS'] },
  READY: { label: '已就绪', allowedTransitions: ['IN_USE', 'RETURNED'] },
  IN_USE: { label: '使用中', allowedTransitions: ['RETURNED'] },
  RETURNED: { label: '已归还', terminal: true }
}
```

#### 3.3.2 触发规则引擎
- **时间触发**：活动前24h未就绪 → 自动提醒
- **事件触发**：讲师排班变更 → 自动触发教具准备重新确认
- **条件触发**：参与人数>50人 → 自动增加物料数量建议

### 3.4 通知感知模块

#### 3.4.1 消息中心
- **消息类型**
  - 排班变更通知（发给：社教老师、教具管理员）
  - 物料就绪通知（发给：对应讲师）
  - 异常告警通知（发给：活动主管）
  - 任务提醒通知（发给：任务负责人）

- **消息格式**
  ```json
  {
    "id": "msg_xxx",
    "type": "SCHEDULE_CHANGED",
    "title": "讲师排班已变更",
    "content": "【课程名称】的讲师排班已变更，原讲师：张三 → 新讲师：李四",
    "relatedScheduleId": "sch_xxx",
    "relatedMaterialId": "mat_xxx",
    "priority": "HIGH",
    "createdAt": "2026-06-18 10:00:00",
    "read": false,
    "actions": [
      { "type": "VIEW_SCHEDULE", "label": "查看排班" },
      { "type": "VIEW_MATERIAL", "label": "查看物料" },
      { "type": "RECONFIRM", "label": "重新确认物料" }
    ]
  }
  ```

#### 3.4.2 感知规则
- 讲师更换 → 通知教具管理员：该排班物料清单需要重新确认
- 活动时间变更 → 通知教具管理员：物料准备时间是否需要调整
- 课程内容调整 → 通知教具管理员：检查物料清单是否需要更新

---

## 4. 数据模型设计

### 4.1 核心实体

#### 4.1.1 ActivitySchedule（讲师排班）
```typescript
interface ActivitySchedule {
  id: string;
  courseId: string;                    // 关联课程ID
  courseName: string;                  // 课程名称
  scheduledAt: Date;                   // 计划时间
  location: string;                    // 活动地点
  expectedParticipants: number;         // 预计参与人数
  participantType: 'STUDENT' | 'ADULT' | 'FAMILY'; // 参与对象类型

  // 讲师信息
  lecturerId: string;
  lecturerName: string;
  lecturerPhone: string;
  lecturerEmail: string;

  // 状态流转
  status: ScheduleStatus;
  statusHistory: StatusTransition[];   // 状态历史记录

  // 变更管理
  changeHistory: ScheduleChange[];     // 变更历史

  // 附件管理（统一存储）
  attachments: Attachment[];            // 附件列表
 课件: string;                         // 课件文件ID
  教案: string;                         // 教案文件ID

  // 关联
  materialListId: string;              // 关联物料清单ID
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type ScheduleStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'APPROVED' | 'PUBLISHED' | 'CHANGED' | 'REJECTED';
```

#### 4.1.2 MaterialList（物料清单）
```typescript
interface MaterialList {
  id: string;
  scheduleId: string;                  // 关联讲师排班ID
  scheduleSnapshot: {                   // 排班快照（用于感知变更）
    lecturerName: string;
    scheduledAt: Date;
    location: string;
    expectedParticipants: number;
  };

  status: MaterialStatus;
  statusHistory: StatusTransition[];

  materials: MaterialItem[];
  preparedBy: string;                  // 准备人
  preparedAt: Date;                    // 准备完成时间

  isAcknowledged: boolean;              // 讲师是否已确认物料
  acknowledgedAt: Date;

  // 附件管理
  attachments: Attachment[];            // 物料清单附件
  照片: string;                         // 物料照片

  createdAt: Date;
  updatedAt: Date;
}

type MaterialStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'READY' | 'IN_USE' | 'RETURNED';

interface MaterialItem {
  id: string;
  name: string;
  category: 'DEMO' | 'OPERATION' | 'DISPLAY';
  quantity: number;
  unit: string;
  remarks: string;
  status: 'PENDING' | 'PREPARED' | 'DAMAGED' | 'MISSING';
}
```

#### 4.1.3 Notification（通知消息）
```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;

  // 发送目标
  recipients: string[];                 // 用户ID列表
  roles?: Role[];                      // 或按角色发送

  // 关联业务对象
  relatedScheduleId?: string;
  relatedMaterialId?: string;

  // 优先级
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  // 动作
  actions: NotificationAction[];

  // 阅读状态
  readBy: string[];

  createdAt: Date;
  expiresAt: Date;
}

type NotificationType =
  | 'SCHEDULE_CREATED'
  | 'SCHEDULE_CHANGED'
  | 'SCHEDULE_APPROVED'
  | 'SCHEDULE_PUBLISHED'
  | 'SCHEDULE_REJECTED'
  | 'MATERIAL_READY'
  | 'MATERIAL_BLOCKED'
  | 'MATERIAL_CHANGE_REQUIRED'
  | 'ACTIVITY_REMINDER';
```

#### 4.1.4 StatusTransition（状态流转记录）
```typescript
interface StatusTransition {
  id: string;
  entityType: 'SCHEDULE' | 'MATERIAL';
  entityId: string;
  fromStatus: string;
  toStatus: string;
  operator: string;                     // 操作人
  reason?: string;                      // 变更原因
  remarks?: string;                     // 备注
  createdAt: Date;
}
```

#### 4.1.5 Attachment（附件管理）
```typescript
interface Attachment {
  id: string;
  entityType: 'SCHEDULE' | 'MATERIAL';
  entityId: string;
  category: string;                     // 分类：课件、教案、照片等
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}
```

---

## 5. 权限设计

### 5.1 角色权限矩阵

| 功能 | 社教老师 | 志愿者 | 活动主管 | 教具管理员 |
|------|----------|--------|----------|------------|
| 查看所有排班 | ✓ | ✓（本部门） | ✓ | ✓（关联） |
| 创建排班 | ✓ | ✗ | ✓ | ✗ |
| 编辑排班 | ✓（本人创建） | ✗ | ✓ | ✗ |
| 确认排班 | ✓ | ✗ | ✗ | ✗ |
| 审核排班 | ✗ | ✗ | ✓ | ✗ |
| 发布排班 | ✗ | ✗ | ✓ | ✗ |
| 查看物料清单 | ✓ | ✓ | ✓ | ✓ |
| 领取物料 | ✓ | ✓ | ✗ | ✓ |
| 确认物料就绪 | ✗ | ✗ | ✗ | ✓ |
| 管理库存 | ✗ | ✗ | ✗ | ✓ |
| 接收变更通知 | ✓ | ✓ | ✓ | ✓ |

---

## 6. 验收标准

### 6.1 功能验收

#### 6.1.1 讲师排班模块
- [ ] 可以创建新的讲师排班
- [ ] 可以查看所有状态的排班列表
- [ ] 可以编辑排班信息
- [ ] 状态流转符合定义的状态机
- [ ] 变更后自动通知相关方
- [ ] 变更历史完整记录
- [ ] 附件统一管理，不散落在临时字段

#### 6.1.2 教具准备模块
- [ ] 排班发布后自动创建物料清单
- [ ] 可以查看待准备的物料清单
- [ ] 可以认领准备任务
- [ ] 可以更新物料状态
- [ ] 物料就绪后通知讲师
- [ ] 支持历史物料记录回看
- [ ] 教具损坏/丢失有完整的处理流程

#### 6.1.3 通知感知模块
- [ ] 讲师排班变更后，教具管理员能收到通知
- [ ] 物料就绪后，对应讲师能收到通知
- [ ] 活动前24小时有提醒
- [ ] 支持消息已读/未读状态

### 6.2 非功能验收
- [ ] 前后端边界清晰，API接口文档完整
- [ ] 状态流转有完整的历史记录
- [ ] 异常情况有友好的错误提示
- [ ] 页面加载时间 < 2秒
- [ ] 支持移动端查看

---

## 7. 边界说明（当前版本）

### 7.1 未接入的真实外部系统
1. **真实短信/邮件通知**：当前使用系统内消息通知，未接入短信、邮件通道
2. **真实用户认证系统**：使用模拟用户数据，未对接博物馆统一的身份认证
3. **真实物料库存系统**：使用本地模拟数据，未对接实物库存管理
4. **真实排课系统**：讲师信息为手动维护，未对接排课系统
5. **真实短信/邮件**：通知仅在系统内显示，未发送外部通知

### 7.2 模拟数据
- 用户列表：社教老师3人、志愿者5人、活动主管2人、教具管理员2人
- 课程库：预设10个常见博物馆社教课程
- 物料库：预设50种常用教具

---

## 8. UI设计方向

### 8.1 视觉风格
- **定位**：B端管理后台，强调效率和信息密度
- **风格**：简洁专业，避免过度装饰
- **色调**：博物馆主题，深蓝色为主色调，搭配金色点缀
- **布局**：左侧导航 + 右侧内容区，支持多标签页

### 8.2 核心页面
1. **仪表盘**：全局视图，展示待处理任务、异常告警
2. **讲师排班列表**：卡片式展示，状态标签清晰
3. **排班详情页**：TAB页切换，信息分区明确
4. **物料清单页**：列表+详情，支持快速操作
5. **消息中心**：时间线展示，支持快捷操作

---

## 9. 版本规划

### 9.1 MVP版本（本期）
- 核心链路：讲师排班 + 教具准备 + 状态流转 + 通知感知
- 基础角色权限
- Mock数据驱动

### 9.2 后续迭代
- 对接真实用户认证
- 对接短信/邮件通知
- 报表统计功能
- 移动端适配
