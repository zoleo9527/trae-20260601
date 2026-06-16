# 酒吧运营系统

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 初始化数据库和种子数据
```bash
npm run seed
```

### 3. 启动开发服务器
```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

## API 端点

### 预约管理

#### 创建预约
```http
POST /api/reservations
Content-Type: application/json
X-Staff-Id: <staff_id>
X-Staff-Role: <role>

{
  "customerName": "张三",
  "customerPhone": "13900139000",
  "tableNumber": "A01",
  "reservationDate": "2024-01-15",
  "reservationTime": "20:00",
  "partySize": 5,
  "notes": "庆祝生日",
  "internalNotes": "VIP客户",
  "priority": "high"
}
```

#### 获取预约列表
```http
GET /api/reservations?status=pending&date=2024-01-15
```

#### 获取预约详情
```http
GET /api/reservations/:id
```

#### 处理预约（确认/拒绝/退回）
```http
POST /api/reservations/:id/process
Content-Type: application/json
X-Staff-Id: <staff_id>
X-Staff-Role: <role>

{
  "action": "confirm", // confirm | reject | return
  "notes": "确认备注",
  "internalNotes": "内部备注（会传递到低消确认）"
}
```

### 低消确认

#### 获取低消信息
```http
GET /api/reservations/:id/minimum-consumption
```

#### 更新低消信息
```http
PUT /api/reservations/:id/minimum-consumption
Content-Type: application/json
X-Staff-Id: <staff_id>
X-Staff-Role: <role>

{
  "amount": 2000,
  "status": "confirmed", // pending | confirmed | rejected | modified
  "notes": "确认备注"
}
```

### 待办事项

#### 获取待办列表（按角色）
```http
GET /api/todos?role=reservation_staff&status=pending
```

#### 更新待办状态
```http
PATCH /api/todos/:id/status
Content-Type: application/json

{
  "status": "completed" // pending | in_progress | completed | cancelled
}
```

### 演出排班

#### 创建演出排班
```http
POST /api/singer-schedules
X-Manager-Id: <manager_id>

{
  "singerName": "李歌手",
  "performanceDate": "2024-01-15",
  "startTime": "20:00",
  "endTime": "22:00",
  "notes": "民谣之夜"
}
```

#### 检查演出冲突
```http
GET /api/singer-schedules/check-conflicts?date=2024-01-15&startTime=20:00&endTime=22:00
```

#### 演出改期
```http
POST /api/singer-schedules/:id/reschedule
X-Manager-Id: <manager_id>

{
  "newDate": "2024-01-16",
  "newStartTime": "20:00",
  "newEndTime": "22:00",
  "reason": "歌手时间冲突"
}
```

### 酒水寄存

#### 创建寄存记录
```http
POST /api/beverage-storage
X-Bar-Staff-Id: <bar_staff_id>

{
  "reservationId": "<reservation_id>",
  "beverageName": "威士忌",
  "quantity": 2,
  "storageDate": "2024-01-15",
  "notes": "客户自带"
}
```

#### 标记为说不清
```http
POST /api/beverage-storage/:id/unclear
X-Bar-Staff-Id: <bar_staff_id>

{
  "reason": "无法确认酒水真伪"
}
```

### 问题检测

#### 获取所有未解决问题
```http
GET /api/issues?unresolvedOnly=true
```

#### 获取预约相关问题
```http
GET /api/issues/reservation/:reservationId
```

#### 标记问题为已解决
```http
POST /api/issues/:id/resolve
X-Staff-Id: <staff_id>
```

### 状态历史

#### 获取状态变更历史
```http
GET /api/reservations/:id/status-history?entityType=reservation
```

## 角色说明

- **reservation_staff**: 订台客服，处理预约确认和低消确认
- **bar_staff**: 吧台员工，管理酒水寄存
- **manager**: 现场经理，管理演出排班，处理冲突和异常

## 核心功能

### 1. 重复预约检测
系统自动检测同一电话或同一桌台的重复预约，并生成警告。

### 2. 演出冲突检测
创建或修改演出排班时，系统自动检查时间冲突。

### 3. 酒水状态追踪
寄存酒水状态异常时（如"说不清"），系统自动生成待办事项。

### 4. 状态变更全程记录
每一次状态变更都会记录：操作人、操作时间、变更原因、备注。

### 5. 角色化待办
系统根据角色自动分配待办事项，确保每个人看到自己的任务。

### 6. 备注传递
预约处理时的内部备注会自动传递到低消确认流程。

## 数据库

SQLite 数据库存储在 `data/bar_operations.db`
