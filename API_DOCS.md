# 影院运营系统 API 文档

## 基础信息

- 服务地址: `http://localhost:3002`
- 接口前缀: `/api`
- 认证方式: Header 中传入 `x-user-key`

## 测试用户标识

| 用户角色 | x-user-key 值 | 说明 |
|---------|---------------|------|
| 排片经理 | schedule-manager | 负责排片管理、异常上报、换厅处理 |
| 票务主管 | ticket-supervisor | 负责退票审核、团体票核销 |
| 值班经理 | duty-manager | 拥有全部权限，负责异常关闭确认 |

---

## 一、用户与权限

### 1. 获取当前用户信息
**GET** `/api/auth/me`

**请求示例:**
```bash
curl -H "x-user-key: schedule-manager" http://localhost:3002/api/auth/me
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user": {
      "id": "user-schedule-001",
      "username": "schedule_mgr",
      "name": "张伟",
      "role": "schedule_manager"
    },
    "menus": [
      { "id": "schedule", "name": "排片管理", "path": "/schedule" },
      { "id": "exception-report", "name": "放映异常上报", "path": "/exception/report" },
      { "id": "exception-list", "name": "放映异常列表", "path": "/exception/list" },
      { "id": "hall-change", "name": "临时换厅处理", "path": "/exception/hall-change" }
    ]
  }
}
```

---

## 二、放映异常管理

### 2. 获取异常统计
**GET** `/api/exceptions/statistics`

**请求示例:**
```bash
curl -H "x-user-key: duty-manager" http://localhost:3002/api/exceptions/statistics
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 6,
    "byStatus": {
      "reported": 1,
      "processing": 1,
      "refund_initiated": 1,
      "resolved": 1,
      "closed": 2
    },
    "processing": 1,
    "pending": 1,
    "closed": 2,
    "stuck": 2
  }
}
```

### 3. 上报放映异常
**POST** `/api/exceptions`

**权限:** 排片经理、值班经理

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: schedule-manager" \
  -d '{
    "scheduleId": "sched-003",
    "type": "equipment_failure",
    "title": "放映机灯泡告警",
    "description": "放映机出现温度过高告警，需紧急处理",
    "currentHallId": "hall-001",
    "affectedTicketCount": 110
  }' \
  http://localhost:3002/api/exceptions
```

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleId | string | 是 | 排片ID |
| type | string | 是 | 异常类型: equipment_failure(设备故障), temp_hall_change(临时换厅), content_abnormal(内容异常), group_ticket_confusion(团体票核销混乱) |
| title | string | 是 | 异常标题 |
| description | string | 是 | 异常详细描述 |
| currentHallId | string | 否 | 当前影厅ID |
| affectedTicketCount | number | 否 | 受影响票数 |

**响应示例:**
```json
{
  "code": 200,
  "message": "异常上报成功",
  "data": {
    "id": "exc-uuid",
    "scheduleId": "sched-003",
    "type": "equipment_failure",
    "status": "reported",
    "title": "放映机灯泡告警",
    "description": "放映机出现温度过高告警，需紧急处理",
    "reportedBy": "user-schedule-001",
    "reportedAt": "2026-06-06T10:00:00.000Z",
    "currentHallId": "hall-001",
    "affectedTicketCount": 110
  }
}
```

### 4. 获取放映异常列表
**GET** `/api/exceptions`

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |
| status | string | 否 | 按状态筛选 |
| type | string | 否 | 按类型筛选 |
| scheduleId | string | 否 | 按排片ID筛选 |
| startDate | string | 否 | 上报开始时间 (yyyy-MM-dd) |
| endDate | string | 否 | 上报结束时间 (yyyy-MM-dd) |

**请求示例:**
```bash
curl -H "x-user-key: duty-manager" \
  "http://localhost:3002/api/exceptions?page=1&pageSize=10&status=processing&startDate=2026-06-01"
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "exc-003",
        "scheduleId": "sched-003",
        "type": "temp_hall_change",
        "status": "processing",
        "title": "临时换厅需求",
        "description": "因1号厅空调系统突发故障",
        "reportedBy": "user-schedule-001",
        "reportedAt": "2026-06-06 17:00:00",
        "currentHallId": "hall-001",
        "affectedTicketCount": 110,
        "handledBy": "user-schedule-001",
        "handledAt": "2026-06-06 17:10:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

### 5. 获取放映异常详情
**GET** `/api/exceptions/:id`

**请求示例:**
```bash
curl -H "x-user-key: duty-manager" http://localhost:3002/api/exceptions/exc-005
```

### 6. 更新异常状态
**PUT** `/api/exceptions/:id/status`

**权限:** 排片经理、值班经理

**请求示例:**
```bash
curl -X PUT -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"status": "processing", "resolution": "已联系技术人员现场处理"}' \
  http://localhost:3002/api/exceptions/exc-004/status
```

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 目标状态 |
| resolution | string | 否 | 处理说明（可选，不传则保留原有值） |

### 7. 执行临时换厅
**POST** `/api/exceptions/:id/hall-change`

**权限:** 排片经理、值班经理

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: schedule-manager" \
  -d '{"targetHallId": "hall-005", "remark": "转移至VIP厅继续放映"}' \
  http://localhost:3002/api/exceptions/exc-003/hall-change
```

### 8. 发起异常退票
**POST** `/api/exceptions/:id/initiate-refund`

**权限:** 值班经理

**功能说明:** 
- 将异常状态更新为 `refund_initiated`
- 自动创建并关联待审核的退票记录
- 返回生成的退票列表，可直接进行后续审批

**请求示例:**
```bash
curl -X POST -H "x-user-key: duty-manager" \
  http://localhost:3002/api/exceptions/exc-004/initiate-refund
```

**响应示例:**
```json
{
  "code": 200,
  "message": "退票流程已发起，已生成待审核退票记录",
  "data": {
    "exception": {
      "id": "exc-004",
      "scheduleId": "sched-005",
      "status": "refund_initiated",
      "title": "IMAX厅音响系统异常"
    },
    "refunds": [
      {
        "id": "refund-uuid",
        "orderId": "ORD-EXC-004-1",
        "scheduleId": "sched-005",
        "exceptionId": "exc-004",
        "userName": "观众1",
        "phone": "138xxxxxxxx",
        "ticketCount": 2,
        "totalAmount": 90,
        "reason": "screening_exception",
        "status": "pending",
        "appliedAt": "2026-06-06T10:00:00.000Z"
      }
    ],
    "pendingCount": 3
  }
}
```

### 9. 关闭异常
**POST** `/api/exceptions/:id/close`

**权限:** 值班经理

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"resolution": "已确认所有观众妥善安置，设备恢复正常，异常关闭"}' \
  http://localhost:3002/api/exceptions/exc-006/close
```

---

## 三、退票管理

### 10. 获取退票统计
**GET** `/api/refunds/statistics`

**请求示例:**
```bash
curl -H "x-user-key: ticket-supervisor" http://localhost:3002/api/refunds/statistics
```

### 11. 提交退票申请
**POST** `/api/refunds`

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: ticket-supervisor" \
  -d '{
    "orderId": "ORD20260606088",
    "scheduleId": "sched-003",
    "exceptionId": "exc-003",
    "userId": "u008",
    "userName": "郑十",
    "phone": "13800138008",
    "ticketCount": 2,
    "totalAmount": 100,
    "reason": "user_request",
    "remark": "用户临时有事"
  }' \
  http://localhost:3002/api/refunds
```

### 12. 获取退票列表
**GET** `/api/refunds`

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |
| status | string | 否 | 按状态筛选: pending/approved/processed/rejected |
| reason | string | 否 | 按原因筛选: screening_exception/user_request/group_ticket_issue/other |
| scheduleId | string | 否 | 按排片ID筛选 |
| exceptionId | string | 否 | 按异常ID筛选 |
| startDate | string | 否 | 申请开始时间 |
| endDate | string | 否 | 申请结束时间 |
| keyword | string | 否 | 关键词搜索（用户名/手机号/订单号） |

**请求示例:**
```bash
curl -H "x-user-key: ticket-supervisor" \
  "http://localhost:3002/api/refunds?page=1&pageSize=10&status=pending&reason=screening_exception"
```

### 13. 获取退票详情
**GET** `/api/refunds/:id`

### 14. 审批通过退票
**POST** `/api/refunds/:id/approve`

**权限:** 票务主管、值班经理

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: ticket-supervisor" \
  -d '{"remark": "情况属实，同意退票"}' \
  http://localhost:3002/api/refunds/refund-003/approve
```

### 15. 驳回退票
**POST** `/api/refunds/:id/reject`

**权限:** 票务主管、值班经理

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: ticket-supervisor" \
  -d '{"rejectReason": "影片已开场超过30分钟，不符合退票条件"}' \
  http://localhost:3002/api/refunds/refund-005/reject
```

### 16. 执行退款
**POST** `/api/refunds/:id/process`

**权限:** 票务主管、值班经理

**请求示例:**
```bash
curl -X POST -H "x-user-key: ticket-supervisor" \
  http://localhost:3002/api/refunds/refund-004/process
```

### 17. 查询异常关联的退票记录
**GET** `/api/refunds/by-exception/:exceptionId`

### 18. 退票处理回看
**GET** `/api/refunds/review`

**功能说明:** 查看已完成的退票记录（含已处理、已驳回、已失败），支持多条件筛选

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20 |
| startDate | string | 否 | 申请开始时间 |
| endDate | string | 否 | 申请结束时间 |
| reason | string | 否 | 按退票原因筛选 |

**请求示例:**
```bash
curl -H "x-user-key: ticket-supervisor" \
  "http://localhost:3002/api/refunds/review?page=1&pageSize=10&reason=screening_exception&startDate=2026-06-01"
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "refund-001",
        "orderId": "ORD20260606001",
        "scheduleId": "sched-001",
        "exceptionId": "exc-001",
        "userName": "张三",
        "phone": "13800138001",
        "ticketCount": 2,
        "totalAmount": 98,
        "reason": "screening_exception",
        "status": "processed",
        "appliedAt": "2026-06-06 09:35:00",
        "approvedBy": "user-ticket-001",
        "approvedAt": "2026-06-06 09:40:00",
        "processedAt": "2026-06-06 09:45:00",
        "movieName": "流浪地球3",
        "startTime": "2026-06-06 10:00:00"
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## 四、状态流转说明

### 放映异常状态流转

```
reported (已上报)
    ↓
processing (处理中)
    ↓        ↓
hall_changed (换厅完成)  →  refund_initiated (退票中)
    ↓        ↓
resolved (已解决)
    ↓
closed (已关闭)
```

| 状态 | 说明 | 可操作角色 |
|------|------|-----------|
| reported | 已上报，待处理 | 排片经理、值班经理 |
| processing | 处理中 | 排片经理、值班经理 |
| hall_changed | 已完成换厅 | 排片经理、值班经理 |
| refund_initiated | 退票流程进行中 | 值班经理 |
| resolved | 问题已解决，待关闭 | 值班经理 |
| closed | 异常已关闭 | 值班经理 |

### 退票状态流转

```
pending (待审核)
    ↓      ↓
approved (已审批)  rejected (已驳回)
    ↓
processed (已退款)
```

---

## 五、主链路完整流程示例

### 场景：设备故障 → 上报异常 → 发起退票 → 审核退票 → 执行退款 → 关闭异常

```bash
# 1. 排片经理上报放映异常
curl -X POST -H "Content-Type: application/json" -H "x-user-key: schedule-manager" \
  -d '{
    "scheduleId": "sched-003",
    "type": "equipment_failure",
    "title": "放映机突发故障",
    "description": "放映机无法启动，需紧急处理",
    "currentHallId": "hall-001",
    "affectedTicketCount": 110
  }' \
  http://localhost:3002/api/exceptions

# 2. 值班经理领取处理（状态变为 processing）
curl -X PUT -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"status": "processing"}' \
  http://localhost:3002/api/exceptions/{exc-id}/status

# 3. 值班经理发起退票流程（自动生成待审核退票记录）
curl -X POST -H "x-user-key: duty-manager" \
  http://localhost:3002/api/exceptions/{exc-id}/initiate-refund

# 4. 票务主管审核退票
curl -X POST -H "Content-Type: application/json" -H "x-user-key: ticket-supervisor" \
  -d '{"remark": "情况属实"}' \
  http://localhost:3002/api/refunds/{refund-id}/approve

# 5. 执行退款
curl -X POST -H "x-user-key: ticket-supervisor" \
  http://localhost:3002/api/refunds/{refund-id}/process

# 6. 值班经理关闭异常
curl -X POST -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"resolution": "设备已修复，所有退票已处理完成"}' \
  http://localhost:3002/api/exceptions/{exc-id}/close
```
