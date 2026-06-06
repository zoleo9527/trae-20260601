# 影院运营系统 API 文档

## 基础信息

- 服务地址: `http://localhost:3000`
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
curl -H "x-user-key: schedule-manager" http://localhost:3000/api/auth/me
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
curl -H "x-user-key: duty-manager" http://localhost:3000/api/exceptions/statistics
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
  http://localhost:3000/api/exceptions
```

**请求参数说明:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleId | string | 是 | 排片ID |
| type | string | 是 | 异常类型: temp_hall_change(临时换厅), equipment_failure(设备故障), group_ticket_confusion(团体票核销混乱), content_abnormal(内容异常) |
| title | string | 是 | 异常标题 |
| description | string | 是 | 异常描述 |
| currentHallId | string | 否 | 当前影厅ID |
| affectedTicketCount | number | 否 | 受影响票数 |

### 4. 获取异常列表（分页筛选）
**GET** `/api/exceptions`

**请求示例 - 全部异常列表:
```bash
curl -H "x-user-key: duty-manager" "http://localhost:3000/api/exceptions?page=1&pageSize=10"
```

**请求示例 - 按状态筛选(处理中):
```bash
curl -H "x-user-key: duty-manager" "http://localhost:3000/api/exceptions?status=processing"
```

**请求示例 - 按类型筛选(设备故障):
```bash
curl -H "x-user-key: duty-manager" "http://localhost:3000/api/exceptions?type=equipment_failure"
```

**筛选参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认1 |
| pageSize | number | 每页条数，默认10 |
| status | string | 状态: reported, processing, hall_changed, refund_initiated, resolved, closed |
| type | string | 异常类型 |
| scheduleId | string | 排片ID |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

### 5. 获取异常详情
**GET** `/api/exceptions/:id

**请求示例:**
```bash
curl -H "x-user-key: duty-manager" http://localhost:3000/api/exceptions/exc-003
```

### 6. 更新异常状态
**PUT** `/api/exceptions/:id/status`

**权限:** 排片经理、值班经理

**请求示例 - 从已上报转为处理中:**
```bash
curl -X PUT -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"status": "processing"}' \
  http://localhost:3000/api/exceptions/exc-004/status
```

**状态流转规则:**
- reported → processing, resolved
- processing → hall_changed, refund_initiated, resolved
- hall_changed → resolved, refund_initiated
- refund_initiated → resolved
- resolved → closed
- closed → (终态，不可转移

### 7. 执行临时换厅
**POST** `/api/exceptions/:id/hall-change`

**权限:** 排片经理、值班经理

**前置条件:** 异常状态必须为 processing

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: schedule-manager" \
  -d '{"targetHallId": "hall-005"}' \
  http://localhost:3000/api/exceptions/exc-003/hall-change
```

### 8. 发起退票流程
**POST** `/api/exceptions/:id/initiate-refund`

**权限:** 值班经理

**前置条件:** 异常状态必须为 processing 或 hall_changed

**请求示例:**
```bash
curl -X POST -H "x-user-key: duty-manager" \
  http://localhost:3000/api/exceptions/exc-003/initiate-refund
```

### 9. 关闭异常
**POST** `/api/exceptions/:id/close`

**权限:** 值班经理

**前置条件:** 异常状态必须为 resolved

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"resolution": "设备已修复，观众已全部妥善处理完毕"}' \
  http://localhost:3000/api/exceptions/exc-006/close
```

---

## 三、退票处理管理

### 10. 获取退票统计
**GET** `/api/refunds/statistics`

**请求示例:**
```bash
curl -H "x-user-key: ticket-supervisor" http://localhost:3000/api/refunds/statistics
```

### 11. 退票处理回看
**GET** `/api/refunds/review`

**权限:** 票务主管、值班经理

**请求示例:**
```bash
curl -H "x-user-key: ticket-supervisor" "http://localhost:3000/api/refunds/review?page=1&pageSize=20"
```

### 12. 创建退票申请
**POST** `/api/refunds`

**权限:** 票务主管、值班经理

**请求示例 - 关联异常的退票:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: ticket-supervisor" \
  -d '{
    "orderId": "ORD20260606008",
    "scheduleId": "sched-004",
    "exceptionId": "exc-005",
    "userId": "u008",
    "userName": "郑十",
    "phone": "13800138008",
    "ticketCount": 2,
    "totalAmount": 80.00,
    "reason": "screening_exception"
  }' \
  http://localhost:3000/api/refunds
```

### 13. 获取退票列表（分页筛选）
**GET** `/api/refunds`

**请求示例 - 待审核退票:**
```bash
curl -H "x-user-key: ticket-supervisor" "http://localhost:3000/api/refunds?status=pending"
```

**请求示例 - 关键字搜索:**
```bash
curl -H "x-user-key: ticket-supervisor" "http://localhost:3000/api/refunds?keyword=张三"
```

**筛选参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页条数 |
| status | string | 状态: pending, approved, rejected, processed, failed |
| reason | string | 原因: screening_exception, user_request, group_ticket_issue |
| scheduleId | string | 排片ID |
| exceptionId | string | 异常ID |
| keyword | string | 搜索关键字(用户名/手机号/订单号) |

### 14. 获取退票详情
**GET** `/api/refunds/:id`

### 15. 审批通过退票
**POST** `/api/refunds/:id/approve`

**权限:** 票务主管、值班经理

**前置条件:** 状态为 pending

**请求示例:**
```bash
curl -X POST -H "x-user-key: ticket-supervisor" \
  http://localhost:3000/api/refunds/refund-003/approve
```

### 16. 驳回退票
**POST** `/api/refunds/:id/reject`

**权限:** 票务主管、值班经理

**请求示例:**
```bash
curl -X POST -H "Content-Type: application/json" -H "x-user-key: ticket-supervisor" \
  -d '{"rejectReason": "影片已正常放映超过30分钟，不符合退票政策"}' \
  http://localhost:3000/api/refunds/refund-005/reject
```

### 17. 执行退款
**POST** `/api/refunds/:id/process`

**权限:** 票务主管、值班经理

**前置条件:** 状态为 approved

**请求示例:**
```bash
curl -X POST -H "x-user-key: ticket-supervisor" \
  http://localhost:3000/api/refunds/refund-004/process
```

### 18. 查询某异常关联的所有退票
**GET** `/api/refunds/by-exception/:exceptionId`

**请求示例:**
```bash
curl -H "x-user-key: ticket-supervisor" http://localhost:3000/api/refunds/by-exception/exc-005
```

---

## 四、主链路完整流程示例

### 流程: 设备故障 → 上报 → 处理 → 换厅 → 退票 → 关闭

```bash
# 1. 排片经理上报异常
curl -X POST -H "Content-Type: application/json" -H "x-user-key: schedule-manager" \
  -d '{
    "scheduleId": "sched-003",
    "type": "equipment_failure",
    "title": "1号厅空调故障",
    "description": "空调突然停止制冷，室内温度上升",
    "currentHallId": "hall-001",
    "affectedTicketCount": 110
  }' \
  http://localhost:3000/api/exceptions

# 2. 值班经理接收，转为处理中
curl -X PUT -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"status": "processing"}' \
  http://localhost:3000/api/exceptions/<exceptionId>/status

# 3. 排片经理执行换厅到5号厅
curl -X POST -H "Content-Type: application/json" -H "x-user-key: schedule-manager" \
  -d '{"targetHallId": "hall-005"}' \
  http://localhost:3000/api/exceptions/<exceptionId>/hall-change

# 4. 值班经理发起退票流程（部分观众不愿意换厅）
curl -X POST -H "x-user-key: duty-manager" \
  http://localhost:3000/api/exceptions/<exceptionId>/initiate-refund

# 5. 票务主管审核退票
curl -X POST -H "x-user-key: ticket-supervisor" \
  http://localhost:3000/api/refunds/<refundId>/approve

# 6. 执行退款
curl -X POST -H "x-user-key: ticket-supervisor" \
  http://localhost:3000/api/refunds/<refundId>/process

# 7. 异常标记为已解决
curl -X PUT -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"status": "resolved", "resolution": "换厅成功，部分退票已完成退款"}' \
  http://localhost:3000/api/exceptions/<exceptionId>/status

# 8. 值班经理关闭异常
curl -X POST -H "Content-Type: application/json" -H "x-user-key: duty-manager" \
  -d '{"resolution": "全部处理完毕，无后续问题"}' \
  http://localhost:3000/api/exceptions/<exceptionId>/close
```

---

## 五、测试数据说明

### 放映异常记录 (6条)

| ID | 类型 | 状态 | 说明 |
|----|------|------|------|
| exc-001 | 设备故障 | closed(已关闭) | ✅ 正常关闭，换厅+退票完成 |
| exc-002 | 团体票混乱 | closed(已关闭) | ✅ 正常关闭，核销问题已处理 |
| exc-003 | 临时换厅 | processing(处理中) | ⚠️ 卡住，等待换厅处理 |
| exc-004 | 设备故障 | reported(已上报) | ⚠️ 卡住，无人接单处理 |
| exc-005 | 内容异常 | refund_initiated(退票中) | 🔄 退票流程进行中 |
| exc-006 | 设备故障 | resolved(已解决) | ⏳ 待值班经理关闭 |

### 退票记录 (7条)

| ID | 状态 | 关联异常 |
|----|------|----------|
| refund-001 | processed(已处理) | exc-001 |
| refund-002 | processed(已处理) | exc-001 |
| refund-003 | pending(待审核) | exc-005 |
| refund-004 | approved(已审批) | exc-005 |
| refund-005 | pending(待审核) | - |
| refund-006 | rejected(已驳回) | exc-002 |
| refund-007 | pending(待审核) | exc-005 |
