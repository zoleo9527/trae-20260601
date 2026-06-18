# 展教预约与排班管理系统 - API 文档

## 快速启动

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:push

# 初始化种子数据
npm run db:seed

# 启动服务
npm run dev
```

服务地址: http://localhost:3000

## Dashboard 首屏 API

**GET /api/dashboard**

返回今日待处理、超时、刚退回的记录。

```bash
curl http://localhost:3000/api/dashboard
```

响应示例：
```json
{
  "stats": {
    "todayPending": 2,
    "overdue": 1,
    "recentlyReturned": 1,
    "activeExhibitIssues": 2,
    "pendingSchedules": 1,
    "urgentMaterials": 1
  },
  "todayPendingReservations": [...],
  "overdueReservations": [...],
  "recentlyReturned": [...],
  "activeExhibitIssues": [...],
  "pendingSchedules": [...],
  "urgentMaterials": [...]
}
```

## 角色说明

| 角色 | 标识 | 权限 |
|------|------|------|
| 展教员 | EXHIBIT_EDUCATOR | 管理预约、执行排班、报告展项问题 |
| 设备工程师 | EQUIPMENT_ENGINEER | 处理展项停机、复盘追踪 |
| 活动老师 | ACTIVITY_TEACHER | 创建预约、处理材料问题 |
| 管理员 | ADMIN | 全部权限 |

请求头要求：
- `x-user-id`: 用户ID
- `x-user-role`: 用户角色

## 讲解预约 API

### 创建预约（自动检测撞档）
**POST /api/reservations**

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "x-user-id: <user_id>" \
  -H "x-user-role: ACTIVITY_TEACHER" \
  -d '{
    "visitorGroup": "北京市第三中学",
    "visitorCount": 45,
    "contactName": "王老师",
    "contactPhone": "13912340001",
    "exhibitName": "电磁奥秘",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:30:00Z"
  }'
```

### 确认预约（自动创建排班）
**PATCH /api/reservations/:id/confirm**

```bash
curl -X PATCH http://localhost:3000/api/reservations/:id/confirm \
  -H "x-user-id: <user_id>" \
  -H "x-user-role: EXHIBIT_EDUCATOR"
```

### 退回预约（必须提供原因）
**PATCH /api/reservations/:id/reject**

```bash
curl -X PATCH http://localhost:3000/api/reservations/:id/reject \
  -H "Content-Type: application/json" \
  -H "x-user-id: <user_id>" \
  -d '{"reason": "展项因维修暂停开放"}'
```

### 标记复盘（用于责任追踪）
**PATCH /api/reservations/:id/mark-review**

```bash
curl -X PATCH http://localhost:3000/api/reservations/:id/mark-review \
  -H "Content-Type: application/json" \
  -H "x-user-id: <user_id>" \
  -d '{"reviewReason": "超时未处理，需复盘"}'
```

## 展项问题 API

### 报告展项停机
**POST /api/exhibit-issues**

```bash
curl -X POST http://localhost:3000/api/exhibit-issues \
  -H "Content-Type: application/json" \
  -H "x-user-id: <user_id>" \
  -d '{
    "exhibitId": "EXHIBIT_001",
    "exhibitName": "电磁奥秘",
    "status": "SHUTDOWN_EMERGENCY",
    "cause": "设备短路",
    "deadline": "2024-01-16T18:00:00Z"
  }'
```

### 分配处理人
**PATCH /api/exhibit-issues/:id/assign-handler**

### 更新状态
**PATCH /api/exhibit-issues/:id/status**

### 添加复盘记录
**PATCH /api/exhibit-issues/:id/review**

## 人员排班 API

### 获取排班列表
**GET /api/schedules?date=2024-01-15&status=PENDING**

### 分配排班人员
**PATCH /api/schedules/:id/assign**

```bash
curl -X PATCH http://localhost:3000/api/schedules/:id/assign \
  -H "Content-Type: application/json" \
  -d '{"educatorId": "<educator_id>"}'
```

### 查询可用展教员
**GET /api/schedules/available-educators?startTime=...&endTime=...**

### 开始/完成排班
**PATCH /api/schedules/:id/start**
**PATCH /api/schedules/:id/complete**

## 审计日志 API

### 查询审计日志
**GET /api/audit?entityType=Reservation&reservationId=xxx**

### 查询某个预约的完整操作历史
**GET /api/audit/reservation/:id**

## 种子数据 API

**POST /api/seed** - 重置并初始化种子数据

## 关键设计说明

### 1. 流程可追踪
- 每个操作都会记录到审计日志
- 退回预约必须提供原因
- 支持复盘标记

### 2. 角色分离
- 展教员：执行讲解、管理预约
- 设备工程师：处理停机、追踪问题
- 活动老师：创建预约、处理材料

### 3. 自然衔接
- 预约确认后自动创建排班
- 排班完成自动更新预约状态
- 无需额外消息提醒

### 4. 问题聚焦
- 展项停机自动关联受影响预约
- 撞档检测自动化
- 超时自动标记

## 数据库管理

```bash
# 查看数据库
npm run db:studio
```
