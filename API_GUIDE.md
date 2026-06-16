# 酒吧运营系统 - 核心功能说明

## 系统架构

### 数据模型关系

```
Reservation (订台预约)
├── StatusHistory (状态变更历史)
├── BeverageStorage (酒水寄存) [1:N]
├── IssueDetection (问题检测)
└── TodoItem (待办事项) [1:N]
    │
    ├── SingerSchedule (演出排班)
    │   └── StatusHistory
    │
    └── MinimumConsumption (低消确认) - 状态存储在 Reservation 表中
```

### 状态机设计

#### 预约状态流
```
pending → confirmed → in_progress → completed
   ↓         ↓            ↓
cancelled  cancelled    cancelled
   ↓
returned
```

#### 低消确认状态流
```
pending → confirmed
   ↓         ↓
rejected   modified → confirmed
```

#### 酒水寄存状态流
```
stored → retrieved
  ↓
unclear (异常状态)
  ↓
expired (可选)
```

#### 演出排班状态流
```
scheduled → confirmed → (演出进行中) → completed
    ↓
rescheduled
    ↓
cancelled
```

## 核心业务逻辑

### 1. 订台重复检测

**触发时机**: 创建或更新预约时

**检测逻辑**:
```typescript
// 1. 电话重复检查
phoneDuplicates = findByPhoneAndDate(customerPhone, reservationDate)
if (phoneDuplicates.length > 0) {
  // 生成 warning 级别问题
  createIssue({ type: 'duplicate_reservation', severity: 'warning' })
}

// 2. 桌台时间冲突检查
tableConflicts = findByTableTimeAndDate(tableNumber, reservationTime, reservationDate)
if (tableConflicts.length > 0) {
  // 生成 error 级别问题
  createIssue({ type: 'duplicate_reservation', severity: 'error' })
}
```

**API 示例**:
```bash
# 创建预约时自动检测
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "X-Staff-Id: <staff_id>" \
  -H "X-Staff-Role: reservation_staff" \
  -d '{
    "customerName": "张三",
    "customerPhone": "13900139000",
    "tableNumber": "A01",
    "reservationDate": "2024-01-15",
    "reservationTime": "20:00",
    "partySize": 5
  }'

# 响应包含检测结果
{
  "reservation": { ... },
  "duplicateCheck": {
    "hasDuplicate": true,
    "duplicates": [...],
    "conflictType": "table",
    "message": "检测到桌台 A01 在此时段已有预约"
  },
  "issues": [...]
}
```

### 2. 寄存酒说不清处理

**触发时机**: 吧台员工标记酒水状态为"说不清"

**处理流程**:
```typescript
async function markAsUnclear(storageId, barStaffId, reason) {
  // 1. 更新状态
  updateBeverageStorage(storageId, { status: 'unclear' })
  
  // 2. 记录状态变更
  recordStatusChange({
    entityType: 'beverage_storage',
    entityId: storageId,
    previousStatus: 'stored',
    newStatus: 'unclear',
    changedBy: barStaffId,
    changeReason: reason
  })
  
  // 3. 生成问题检测
  createIssue({
    reservationId: getReservationId(storageId),
    issueType: 'beverage_unclear',
    severity: 'warning',
    description: `寄存酒水无法确认`
  })
  
  // 4. 创建经理待办
  createTodo({
    assigneeRole: 'manager',
    title: '寄存酒待确认',
    description: reason,
    priority: 'medium'
  })
}
```

**API 示例**:
```bash
curl -X POST http://localhost:3000/api/beverage-storage/<storage_id>/unclear \
  -H "Content-Type: application/json" \
  -H "X-Bar-Staff-Id: <bar_staff_id>" \
  -d '{
    "reason": "无法确认酒水真伪，需要客户现场确认"
  }'
```

### 3. 演出改期冲突检测

**触发时机**: 演出排班改期时

**处理流程**:
```typescript
async function reschedule(scheduleId, newDate, newStartTime, newEndTime, managerId, reason) {
  // 1. 检查时间冲突
  conflicts = findSingerConflicts(newDate, newStartTime, newEndTime, excludeId)
  if (conflicts.length > 0) {
    throw new Error('演出时间冲突')
  }
  
  // 2. 更新排班（记录原日期）
  updateSchedule(scheduleId, {
    performanceDate: newDate,
    originalDate: oldDate,  // 保存原日期用于通知
    status: 'rescheduled'
  })
  
  // 3. 查找受影响的预约
  affectedReservations = findReservationsByDate(oldDate)
  
  // 4. 为每个受影响预约生成问题和待办
  for (reservation of affectedReservations) {
    createIssue({
      reservationId: reservation.id,
      issueType: 'schedule_conflict',
      severity: 'warning',
      description: `演出改期: ${reason}`
    })
    
    createTodo({
      assigneeRole: 'manager',
      entityType: 'reservation',
      entityId: reservation.id,
      title: '演出变更通知',
      description: `演出从 ${oldDate} 改期至 ${newDate}`,
      priority: 'high'
    })
  }
}
```

**API 示例**:
```bash
curl -X POST http://localhost:3000/api/singer-schedules/<schedule_id>/reschedule \
  -H "Content-Type: application/json" \
  -H "X-Manager-Id: <manager_id>" \
  -d '{
    "newDate": "2024-01-16",
    "newStartTime": "20:00",
    "newEndTime": "22:00",
    "reason": "歌手档期冲突，需改期"
  }'
```

### 4. 备注传递机制

**核心设计**: 订台预约处理时的 `internalNotes` 会被保存，并在低消确认时可以被查看和使用。

```typescript
async function processReservation(reservationId, action, staffId, staffRole, notes, internalNotes) {
  // 1. 更新预约状态
  updateReservation(reservationId, {
    status: newStatus,
    internalNotes: internalNotes  // 保存内部备注
  })
  
  // 2. 如果是确认操作，创建低消待办
  if (action === 'confirm') {
    reservation = getReservation(reservationId)
    
    createTodo({
      assigneeRole: 'reservation_staff',
      entityType: 'minimum_consumption',
      entityId: reservationId,
      title: '低消待确认',
      description: `内部备注: ${internalNotes || reservation.internalNotes}`
    })
  }
  
  // 3. 记录状态变更
  recordStatusChange({
    entityType: 'reservation',
    entityId: reservationId,
    previousStatus: oldStatus,
    newStatus: newStatus,
    changedBy: staffId,
    changedByRole: staffRole,
    notes: notes,
    // internalNotes 存储在 reservation 表中
  })
}

async function getMinimumConsumption(reservationId) {
  reservation = getReservation(reservationId)
  
  return {
    reservationId,
    customerName: reservation.customerName,
    tableNumber: reservation.tableNumber,
    minimumConsumptionAmount: reservation.minimumConsumptionAmount,
    minimumConsumptionStatus: reservation.minimumConsumptionStatus,
    internalNotes: reservation.internalNotes,  // 可查看原始备注
    statusHistory: getStatusHistory('minimum_consumption', reservationId)
  }
}
```

**API 示例**:
```bash
# 处理预约（包含内部备注）
curl -X POST http://localhost:3000/api/reservations/<id>/process \
  -H "Content-Type: application/json" \
  -H "X-Staff-Id: <staff_id>" \
  -H "X-Staff-Role: manager" \
  -d '{
    "action": "confirm",
    "notes": "客户要求确认低消金额",
    "internalNotes": "VIP客户，希望低消2000，可协商"
  }'

# 低消确认时查看备注
curl http://localhost:3000/api/reservations/<id>/minimum-consumption

# 响应
{
  "reservationId": "<id>",
  "customerName": "张三",
  "tableNumber": "A01",
  "minimumConsumptionAmount": null,
  "minimumConsumptionStatus": "pending",
  "internalNotes": "VIP客户，希望低消2000，可协商",
  "statusHistory": [...]
}
```

### 5. 角色化待办系统

**待办分配规则**:

| 场景 | 分配角色 | 优先级 |
|------|---------|--------|
| 新建预约 | manager | 根据预约priority |
| 预约确认 | reservation_staff | medium |
| 低消待确认 | reservation_staff | 根据预约priority |
| 酒水说不清 | manager | medium |
| 演出变更 | manager | high |
| 问题未解决 | 对应负责人 | high |

**API 示例**:
```bash
# 订台客服查看自己的待办
curl http://localhost:3000/api/todos?role=reservation_staff&status=pending

# 吧台员工查看待办
curl http://localhost:3000/api/todos?role=bar_staff&status=pending

# 经理查看待办
curl http://localhost:3000/api/todos?role=manager&status=pending

# 响应
[
  {
    "id": "todo_uuid",
    "entityType": "minimum_consumption",
    "entityId": "reservation_uuid",
    "assigneeRole": "reservation_staff",
    "title": "低消待确认: 张三",
    "description": "VIP客户，希望低消2000，可协商",
    "priority": "high",
    "status": "pending",
    "dueDate": "2024-01-15T12:00:00Z",
    "createdAt": "2024-01-14T10:00:00Z"
  }
]
```

### 6. 状态变更全程记录

**记录内容**:
```typescript
{
  id: "history_uuid",
  entityType: "reservation", // reservation | minimum_consumption | beverage_storage | singer_schedule
  entityId: "entity_uuid",
  previousStatus: "pending",
  newStatus: "confirmed",
  changedBy: "staff_uuid",
  changedByRole: "manager",
  changeReason: "确认预约",
  notes: "客户确认到场时间",
  timestamp: "2024-01-15T10:30:00Z"
}
```

**API 示例**:
```bash
# 查看预约的所有状态变更
curl http://localhost:3000/api/reservations/<id>/status-history?entityType=reservation

# 查看低消确认的状态变更
curl http://localhost:3000/api/reservations/<id>/status-history?entityType=minimum_consumption

# 响应
[
  {
    "id": "history_uuid",
    "entityType": "reservation",
    "entityId": "<id>",
    "previousStatus": null,
    "newStatus": "pending",
    "changedBy": "<staff_id>",
    "changedByRole": "reservation_staff",
    "changeReason": "创建预约",
    "notes": null,
    "timestamp": "2024-01-14T09:00:00Z"
  },
  {
    "id": "history_uuid_2",
    "entityType": "reservation",
    "entityId": "<id>",
    "previousStatus": "pending",
    "newStatus": "confirmed",
    "changedBy": "<manager_id>",
    "changedByRole": "manager",
    "changeReason": "确认预约",
    "notes": "客户确认到场时间",
    "timestamp": "2024-01-14T10:30:00Z"
  }
]
```

## 验收接口清单

### 1. 低消确认回看接口
```http
GET /api/reservations/:id/minimum-consumption
```
**返回值**: 预约信息 + 低消状态 + 历史备注 + 状态变更记录

### 2. 状态变更记录接口
```http
GET /api/reservations/:id/status-history?entityType=reservation
GET /api/reservations/:id/status-history?entityType=minimum_consumption
```
**返回值**: 所有状态变更的时间线，包含操作人、原因、备注

### 3. 订台预约处理接口
```http
POST /api/reservations/:id/process
```
**功能**: 
- 确认/拒绝/退回预约
- 自动创建低消待办（确认时）
- 记录状态变更历史
- 传递内部备注

### 4. 详情查询接口
```http
GET /api/reservations/:id
```
**返回值**: 
- 预约基本信息
- 酒水寄存列表
- 状态变更历史
- 问题检测列表
- 相关待办事项

### 5. 问题检测接口
```http
GET /api/reservations/:id/issues
GET /api/issues?unresolvedOnly=true
```
**返回值**: 所有未解决的问题，支持按严重程度排序

### 6. 角色待办接口
```http
GET /api/todos?role=reservation_staff&status=pending
GET /api/todos?role=bar_staff&status=pending
GET /api/todos?role=manager&status=pending
```
**返回值**: 按角色过滤的待办列表

## 数据库查询示例

### 查看某预约的完整流程
```sql
-- 1. 预约基本信息
SELECT * FROM reservations WHERE id = '<id>';

-- 2. 状态变更历史
SELECT * FROM status_history 
WHERE entity_type = 'reservation' AND entity_id = '<id>'
ORDER BY timestamp DESC;

-- 3. 酒水寄存记录
SELECT * FROM beverage_storage WHERE reservation_id = '<id>';

-- 4. 问题检测
SELECT * FROM issue_detections WHERE reservation_id = '<id>';

-- 5. 相关待办
SELECT * FROM todo_items 
WHERE entity_type = 'reservation' AND entity_id = '<id>';
```

### 查看某角色的所有待办
```sql
SELECT t.*, r.customer_name, r.table_number
FROM todo_items t
JOIN reservations r ON t.entity_id = r.id
WHERE t.assignee_role = 'manager'
AND t.status = 'pending'
ORDER BY 
  CASE t.priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    WHEN 'low' THEN 4 
  END,
  t.created_at ASC;
```

### 查看所有未解决的问题
```sql
SELECT i.*, r.customer_name, r.table_number
FROM issue_detections i
JOIN reservations r ON i.reservation_id = r.id
WHERE i.resolved = 0
ORDER BY 
  CASE i.severity 
    WHEN 'critical' THEN 1 
    WHEN 'error' THEN 2 
    WHEN 'warning' THEN 3 
  END,
  i.created_at DESC;
```

## 测试场景

### 场景1: 完整预约流程
```bash
# 1. 创建预约
RESERVATION_ID=$(curl -s -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "X-Staff-Id: <staff_id>" \
  -H "X-Staff-Role: reservation_staff" \
  -d '{...}' | jq -r '.reservation.id')

# 2. 查看预约详情
curl http://localhost:3000/api/reservations/$RESERVATION_ID

# 3. 经理处理预约
curl -X POST http://localhost:3000/api/reservations/$RESERVATION_ID/process \
  -H "Content-Type: application/json" \
  -H "X-Staff-Id: <manager_id>" \
  -H "X-Staff-Role: manager" \
  -d '{"action": "confirm", "internalNotes": "VIP客户"}'

# 4. 订台客服确认低消
curl -X PUT http://localhost:3000/api/reservations/$RESERVATION_ID/minimum-consumption \
  -H "Content-Type: application/json" \
  -H "X-Staff-Id: <staff_id>" \
  -H "X-Staff-Role: reservation_staff" \
  -d '{"amount": 2000, "status": "confirmed"}'

# 5. 查看状态历史
curl http://localhost:3000/api/reservations/$RESERVATION_ID/status-history

# 6. 查看低消确认
curl http://localhost:3000/api/reservations/$RESERVATION_ID/minimum-consumption
```

### 场景2: 重复预约检测
```bash
# 创建第一个预约
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "X-Staff-Id: <staff_id>" \
  -H "X-Staff-Role: reservation_staff" \
  -d '{
    "customerName": "张三",
    "customerPhone": "13900139000",
    "tableNumber": "A01",
    "reservationDate": "2024-01-15",
    "reservationTime": "20:00",
    "partySize": 5
  }'

# 创建第二个预约（相同电话）
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "X-Staff-Id: <staff_id>" \
  -H "X-Staff-Role: reservation_staff" \
  -d '{
    "customerName": "张三",
    "customerPhone": "13900139000",
    "tableNumber": "B02",
    "reservationDate": "2024-01-15",
    "reservationTime": "21:00",
    "partySize": 3
  }'

# 响应将包含 duplicateCheck.hasDuplicate = true
```

### 场景3: 演出改期影响
```bash
# 创建演出排班
SCHEDULE_ID=$(curl -s -X POST http://localhost:3000/api/singer-schedules \
  -H "X-Manager-Id: <manager_id>" \
  -d '{...}' | jq -r '.id')

# 改期（将触发受影响预约的提醒）
curl -X POST http://localhost:3000/api/singer-schedules/$SCHEDULE_ID/reschedule \
  -H "Content-Type: application/json" \
  -H "X-Manager-Id: <manager_id>" \
  -d '{
    "newDate": "2024-01-16",
    "newStartTime": "20:00",
    "newEndTime": "22:00",
    "reason": "歌手档期调整"
  }'

# 查看生成的问题和待办
curl http://localhost:3000/api/issues?unresolvedOnly=true
curl http://localhost:3000/api/todos?role=manager
```

## 性能优化建议

1. **索引优化**: 已在数据库初始化时创建关键索引
2. **分页查询**: 大量数据时建议添加分页
3. **缓存策略**: 高频查询可考虑添加缓存层
4. **异步处理**: 问题检测和待办创建可考虑异步队列
