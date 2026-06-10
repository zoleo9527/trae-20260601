## 1. 架构设计

```mermaid
graph TB
    "浏览器" --> "Vue3 前端应用"
    "Vue3 前端应用" --> "Vue Router 路由层"
    "Vue3 前端应用" --> "Pinia 状态管理"
    "Vue3 前端应用" --> "Mock 数据层"
    "Vue3 前端应用" --> "Tailwind CSS 样式层"
    "Pinia 状态管理" --> "角色状态 Store"
    "Pinia 状态管理" --> "年检资料 Store"
    "Pinia 状态管理" --> "整改闭环 Store"
    "Pinia 状态管理" --> "异常提醒 Store"
```

## 2. 技术说明

- **前端**：Vue3 + TypeScript + Vite + Tailwind CSS
- **初始化工具**：vite-init (vue-ts 模板)
- **后端**：无（纯前端原型，使用 Mock 数据）
- **数据库**：无（内存数据 + Pinia 持久化）
- **路由**：Vue Router 4
- **状态管理**：Pinia
- **图标**：Lucide Vue Next

## 3. 路由定义

| 路由 | 用途 | 权限 |
|------|------|------|
| `/` | 首页仪表盘 | 全部角色 |
| `/inspection` | 年检资料列表 | 全部角色 |
| `/inspection/:id` | 年检资料详情 | 全部角色 |
| `/rectification` | 整改闭环列表 | 全部角色 |
| `/rectification/:id` | 整改闭环详情 | 全部角色 |
| `/alerts` | 异常提醒中心 | 全部角色 |

## 4. 数据模型

### 4.1 年检资料数据模型

```typescript
interface InspectionRecord {
  id: string
  elevatorId: string
  elevatorLocation: string
  inspectionDate: string
  status: 'pending_submit' | 'pending_review' | 'approved' | 'rejected'
  technicianId: string
  technicianName: string
  reviewerId?: string
  reviewerName?: string
  judgmentBasis: string
  reviewBasis?: string
  attachments: string[]
  rejectReason?: string
  createdAt: string
  updatedAt: string
}
```

### 4.2 整改任务数据模型

```typescript
interface RectificationTask {
  id: string
  sourceType: 'fault_call' | 'inspection_reject' | 'routine_check'
  sourceId: string
  elevatorId: string
  elevatorLocation: string
  description: string
  status: 'created' | 'in_progress' | 'pending_acceptance' | 'closed'
  responsiblePerson: string
  responsibleRole: 'technician' | 'supervisor'
  createdBy: string
  createdRole: 'customer_service' | 'supervisor'
  executionBasis?: string
  acceptanceBasis?: string
  closureBasis?: string
  deadline: string
  createdAt: string
  updatedAt: string
  timeline: TimelineEvent[]
}

interface TimelineEvent {
  timestamp: string
  action: string
  operator: string
  operatorRole: string
  basis: string
  remark?: string
}
```

### 4.3 异常通知数据模型

```typescript
interface AlertNotification {
  id: string
  type: 'overdue_inspection' | 'overdue_rectification' | 'inspection_rejected' | 'fault_escalation'
  level: 'urgent' | 'normal'
  title: string
  description: string
  targetRole: 'technician' | 'customer_service' | 'supervisor'
  relatedId: string
  relatedType: 'inspection' | 'rectification'
  isRead: boolean
  createdAt: string
}
```

### 4.4 角色数据模型

```typescript
type UserRole = 'technician' | 'customer_service' | 'supervisor'

interface RoleConfig {
  role: UserRole
  label: string
  quickActions: QuickAction[]
  todoFilters: string[]
}

interface QuickAction {
  label: string
  route: string
  icon: string
}
```

## 5. 角色视图差异设计

| 功能区域 | 维保技师 | 客服 | 项目主管 |
|----------|----------|------|----------|
| 首页待办 | 待提交年检资料、待执行整改 | 待派发工单、待跟进异常 | 待审核年检、待验收整改 |
| 快捷入口 | 录入年检资料、提交整改完工 | 创建异常工单、派发任务 | 审核年检资料、闭环确认 |
| 年检资料 | 可录入/修改/提交 | 仅查看 | 可审核通过/驳回 |
| 整改闭环 | 可执行/提交完工 | 可创建/派发 | 可验收/闭环确认 |
| 异常提醒 | 接收执行类通知 | 接收派发类通知 | 接收审批类通知 |
