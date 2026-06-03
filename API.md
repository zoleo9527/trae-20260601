# 智能洗衣柜后端 API 文档

## 基础信息

- 基础地址: `http://localhost:3000/api`
- 响应格式: `{ code, message, data, timestamp }`
- 错误格式: `{ code, message, error?, timestamp }`

## 状态枚举

### 格口状态 (cell.status)
- `available` - 空闲可用
- `occupied` - 已占用（已分配格口，待投放）
- `delivered` - 已投放（待用户取件）
- `malfunction` - 故障
- `maintenance` - 维护中

### 订单状态 (order.status)
- `created` - 已创建（待分配格口）
- `cell_assigned` - 已分配格口（待配送员投放）
- `delivered` - 已投放（待用户取件）
- `picked_up` - 已取件（完成）
- `cancelled` - 已取消
- `timeout` - 超时未取

### 柜机状态 (cabinet.status)
- `online` - 在线
- `offline` - 离线
- `maintenance` - 维护中

### 远程开柜状态 (remote_open.status)
- `pending` - 待审批
- `approved` - 已批准
- `rejected` - 已拒绝
- `executed` - 已执行
- `failed` - 执行失败

### 异常类型 (exception.exceptionType)
- `door_stuck` - 柜门卡住
- `pickup_code_invalid` - 取件码无效
- `cell_occupied_error` - 格口占用异常
- `timeout_unpicked` - 超时未取
- `cabinet_offline` - 柜机离线
- `other` - 其他

---

## 1. 柜机管理

### 1.1 获取柜机列表
```
GET /api/cabinets?page=1&pageSize=20&status=online&keyword=阳光
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认20，最大100 |
| status | string | 否 | 柜机状态筛选 |
| keyword | string | 否 | 关键词搜索（编号/名称/位置） |

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 3,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 1,
        "cabinetNo": "CAB-001",
        "name": "阳光花园1号柜",
        "location": "北京市朝阳区阳光花园小区北门",
        "status": "online",
        "totalCells": 10,
        "availableCells": 8,
        "lastHeartbeat": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### 1.2 创建柜机
```
POST /api/cabinets
```

**请求体:**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cabinetNo | string | 是 | 柜机编号，唯一 |
| name | string | 是 | 柜机名称 |
| location | string | 是 | 安装位置 |
| status | string | 否 | 初始状态，默认offline |
| ipAddress | string | 否 | IP地址 |
| remark | string | 否 | 备注 |

### 1.3 获取柜机详情
```
GET /api/cabinets/:id
```

**响应包含:** 柜机基本信息 + 所有格口列表

### 1.4 更新柜机信息
```
PUT /api/cabinets/:id
```

### 1.5 更新柜机状态
```
PATCH /api/cabinets/:id/status
```

**请求体:**
```json
{
  "status": "online",
  "remark": "恢复在线"
}
```

### 1.6 柜机心跳上报
```
POST /api/cabinets/heartbeat
```

**请求体:**
```json
{
  "cabinetNo": "CAB-001",
  "ipAddress": "192.168.1.101"
}
```

### 1.7 柜机上传格口状态
```
POST /api/cabinets/status/upload
```

**请求体:**
```json
{
  "cabinetNo": "CAB-001",
  "cellStatuses": [
    { "cellNo": "A001", "status": "delivered", "lockStatus": true, "doorStatus": true },
    { "cellNo": "A002", "status": "available", "lockStatus": true, "doorStatus": true }
  ]
}
```

### 1.8 获取柜机实时状态
```
GET /api/cabinets/:id/status
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "cabinet": { ... },
    "cells": [ ... ],
    "statusSummary": {
      "total": 10,
      "available": 5,
      "occupied": 2,
      "delivered": 2,
      "malfunction": 1,
      "maintenance": 0
    }
  }
}
```

### 1.9 批量添加格口
```
POST /api/cabinets/:id/cells
```

**请求体:**
```json
{
  "cells": [
    { "cellNo": "A001", "size": "medium" },
    { "cellNo": "A002", "size": "small" }
  ]
}
```

### 1.10 获取柜地格口列表
```
GET /api/cabinets/:id/cells?page=1&pageSize=50&status=available
```

---

## 2. 格口管理

### 2.1 获取格口详情
```
GET /api/cells/:id
```

### 2.2 更新格口状态
```
PATCH /api/cells/:id/status
```

**请求体:**
```json
{
  "status": "maintenance",
  "remark": "定期维护"
}
```

### 2.3 更新格口硬件状态
```
PATCH /api/cells/:id/hardware
```

**请求体:**
```json
{
  "lockStatus": false,
  "doorStatus": false
}
```

---

## 3. 订单管理

### 3.1 获取订单列表
```
GET /api/orders?page=1&pageSize=20&status=delivered&userId=USER-1001
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| status | string | 否 | 订单状态筛选 |
| userId | string | 否 | 用户ID筛选 |
| cabinetId | int | 否 | 柜机ID筛选 |
| keyword | string | 否 | 关键词搜索（订单号/姓名/电话） |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 3.2 创建订单（用户下单）
```
POST /api/orders
```

**请求体:**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |
| userName | string | 否 | 用户姓名 |
| userPhone | string | 否 | 用户电话 |
| laundryType | string | 否 | 洗衣类型 |
| weight | decimal | 否 | 重量(kg) |
| amount | decimal | 否 | 金额 |
| remark | string | 否 | 备注 |

**响应示例:**
```json
{
  "code": 201,
  "message": "订单创建成功",
  "data": {
    "id": 1,
    "orderNo": "LDJABC123DEF",
    "userId": "USER-1001",
    "status": "created",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 3.3 获取订单详情
```
GET /api/orders/:id
```

**响应包含:** 订单信息 + 柜机 + 格口 + 投递记录 + 取件码 + 超时提醒

### 3.4 分配格口
```
POST /api/orders/:id/assign-cell
```

**请求体:**
```json
{
  "cabinetId": 1,
  "preferredSize": "medium"
}
```

**说明:** 系统自动分配一个空闲格口，格口状态变为 `occupied`

### 3.5 配送员投放
```
POST /api/orders/:id/deliver
```

**请求体:**
```json
{
  "deliveryStaffId": "DS-001",
  "deliveryStaffName": "张配送",
  "itemCount": 1,
  "photoUrl": "https://...",
  "remark": "衣物完好"
}
```

**说明:** 
- 格口状态变为 `delivered`
- 订单状态变为 `delivered`
- 生成6位数字取件码
- 设置24小时超时时间
- 返回取件码

### 3.6 取件码取件
```
POST /api/orders/pickup-by-code
```

**请求体:**
```json
{
  "code": "123456",
  "userId": "USER-1001"
}
```

**说明:** 
- 验证取件码有效性和归属权
- 格口状态变为 `available`
- 订单状态变为 `picked_up`
- 取件码状态变为 `used`

### 3.7 订单ID取件
```
POST /api/orders/:id/pickup
```

**请求体:**
```json
{
  "userId": "USER-1001"
}
```

### 3.8 取消订单
```
POST /api/orders/:id/cancel
```

**请求体:**
```json
{
  "operatorId": "OP-001",
  "reason": "用户主动取消"
}
```

### 3.9 检查并处理超时订单
```
POST /api/orders/check-timeout
```

**说明:** 扫描所有已投放但超时的订单，标记为 timeout 状态，生成异常记录和超时提醒

---

## 4. 远程开柜管理

### 4.1 获取远程开柜申请列表
```
GET /api/remote-open?page=1&pageSize=20&status=pending
```

### 4.2 创建远程开柜申请
```
POST /api/remote-open
```

**请求体:**
```json
{
  "orderId": 1,
  "cellId": 5,
  "applicantId": "USER-1001",
  "applicantName": "张三",
  "applicantType": "user",
  "reason": "取件码丢失，需要远程开柜"
}
```

**约束:** 已取件 (picked_up) 和已取消 (cancelled) 的订单不能申请远程开柜

### 4.3 获取申请详情
```
GET /api/remote-open/:id
```

### 4.4 审批通过
```
POST /api/remote-open/:id/approve
```

**请求体:**
```json
{
  "approverId": "CS-001",
  "approverName": "李客服",
  "approvalRemark": "身份核实无误，同意开柜"
}
```

### 4.5 审批拒绝
```
POST /api/remote-open/:id/reject
```

### 4.6 执行远程开柜
```
POST /api/remote-open/:id/execute
```

**请求体:**
```json
{
  "success": true,
  "executionResult": "柜机已响应，门已打开"
}
```

### 4.7 客服直接远程开柜（快捷操作）
```
POST /api/remote-open/customer-service/open
```

**请求体:**
```json
{
  "cellId": 5,
  "operatorId": "CS-001",
  "operatorName": "李客服",
  "reason": "用户电话求助，直接开柜"
}
```

**说明:** 自动完成申请→审批→执行全流程，适合紧急情况

---

## 5. 异常管理

### 5.1 获取异常列表
```
GET /api/exceptions?page=1&pageSize=20&exceptionType=door_stuck&handled=false
```

### 5.2 获取异常统计
```
GET /api/exceptions/stats?cabinetId=1
```

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "total": 15,
    "unhandled": 3,
    "handled": 12,
    "byType": [
      { "exceptionType": "door_stuck", "count": 5 },
      { "exceptionType": "pickup_code_invalid", "count": 8 },
      { "exceptionType": "timeout_unpicked", "count": 2 }
    ]
  }
}
```

### 5.3 创建异常记录
```
POST /api/exceptions
```

**请求体:**
```json
{
  "exceptionType": "door_stuck",
  "cabinetId": 1,
  "cellId": 5,
  "orderId": 10,
  "userId": "USER-1001",
  "description": "柜门无法打开",
  "detail": "输入取件码后无反应"
}
```

### 5.4 获取异常详情
```
GET /api/exceptions/:id
```

### 5.5 处理异常
```
POST /api/exceptions/:id/handle
```

**请求体:**
```json
{
  "handledBy": "CS-001",
  "handleResult": "已联系维修人员，预计2小时内到达"
}
```

### 5.6 上报柜门卡住
```
POST /api/exceptions/report/door-stuck
```

**请求体:**
```json
{
  "cellId": 5,
  "userId": "USER-1001",
  "description": "取件码输入后门不弹开"
}
```

### 5.7 上报取件码无效
```
POST /api/exceptions/report/pickup-code-invalid
```

**请求体:**
```json
{
  "orderId": 10,
  "userId": "USER-1001",
  "code": "123456",
  "description": "提示取件码已过期"
}
```

---

## 6. 超时提醒管理

### 6.1 获取超时提醒列表
```
GET /api/timeout-reminders?page=1&pageSize=20&status=pending
```

### 6.2 获取待发送提醒
```
GET /api/timeout-reminders/pending
```

### 6.3 标记为已发送
```
POST /api/timeout-reminders/:id/mark-sent
```

### 6.4 标记为已确认
```
POST /api/timeout-reminders/:id/acknowledge
```

---

## 统一响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1704067200000
}
```

### 错误响应
```json
{
  "code": 500,
  "message": "格口已被占用",
  "error": "Error: 格口已被占用\n    at ...",
  "timestamp": 1704067200000
}
```

---

## 核心业务流程

### 用户下单流程
1. `POST /api/orders` - 创建订单（状态: created）
2. `POST /api/orders/:id/assign-cell` - 分配格口（状态: cell_assigned，格口: occupied）
3. `POST /api/orders/:id/deliver` - 配送员投放（状态: delivered，格口: delivered，生成取件码）
4. `POST /api/orders/pickup-by-code` - 用户取件（状态: picked_up，格口: available）

### 客服处理异常流程
1. 用户上报异常: `POST /api/exceptions/report/door-stuck`
2. 客服查询未处理异常: `GET /api/exceptions?handled=false`
3. 客服远程开柜: `POST /api/remote-open/customer-service/open`
4. 标记异常已处理: `POST /api/exceptions/:id/handle`

### 超时处理流程
1. 定时任务: `POST /api/orders/check-timeout`
2. 查询待发送提醒: `GET /api/timeout-reminders/pending`
3. 发送短信通知后: `POST /api/timeout-reminders/:id/mark-sent`

---

## 状态机约束

### 格口状态流转
- available → occupied / maintenance / malfunction
- occupied → delivered / available / malfunction
- delivered → available / malfunction
- malfunction → available / maintenance
- maintenance → available / malfunction

### 订单状态流转
- created → cell_assigned / cancelled
- cell_assigned → delivered / cancelled
- delivered → picked_up / timeout
- picked_up → （终止状态，不可再开柜）
- cancelled → （终止状态）
- timeout → picked_up

### 远程开柜状态流转
- pending → approved / rejected
- approved → executed / failed
- rejected → （终止状态）
- executed → （终止状态）
- failed → （终止状态）
