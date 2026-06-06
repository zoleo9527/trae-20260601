# 校园维修系统 API 请求示例

## 基础信息
- 服务地址: `http://localhost:3000`
- 认证方式: 通过请求头 `x-user-id` 传入用户ID

---

## 用户列表获取

```bash
curl -X GET http://localhost:3000/api/users
```

---

## 各角色待办查询

### 宿管待办
```bash
curl -X GET http://localhost:3000/api/orders/todo \
  -H "x-user-id: {宿管用户ID}" \
  -H "Content-Type: application/json"
```

### 维修师傅待办
```bash
curl -X GET http://localhost:3000/api/orders/todo \
  -H "x-user-id: {维修师傅用户ID}" \
  -H "Content-Type: application/json"
```

### 后勤主管待办
```bash
curl -X GET http://localhost:3000/api/orders/todo \
  -H "x-user-id: {后勤主管用户ID}" \
  -H "Content-Type: application/json"
```

---

## 工单完整流程

### 1. 宿管创建维修工单
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "x-user-id: {宿管用户ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "dormitory": "3号楼",
    "roomNumber": "201",
    "issueType": "水电维修",
    "description": "阳台水管漏水严重"
  }'
```

### 2. 后勤主管派单
```bash
curl -X POST http://localhost:3000/api/orders/{工单ID}/assign \
  -H "x-user-id: {后勤主管用户ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "assigneeId": "{维修师傅用户ID}",
    "remark": "紧急工单，请尽快处理"
  }'
```

### 3. 维修师傅登记材料
```bash
curl -X POST http://localhost:3000/api/orders/{工单ID}/materials \
  -H "x-user-id: {维修师傅用户ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "materials": [
      {
        "materialName": "PVC水管",
        "specification": "20mm",
        "quantity": 2,
        "unit": "米",
        "unitPrice": 15.00,
        "note": "优质PVC管"
      },
      {
        "materialName": "水管接头",
        "quantity": 3,
        "unit": "个",
        "unitPrice": 5.00
      },
      {
        "materialName": "防水胶带",
        "quantity": 1,
        "unit": "卷",
        "unitPrice": 8.00
      }
    ]
  }'
```

### 4. 维修师傅登记费用
```bash
curl -X POST http://localhost:3000/api/orders/{工单ID}/fees \
  -H "x-user-id: {维修师傅用户ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "fees": [
      {
        "feeType": "材料费",
        "amount": 53.00,
        "note": "水管30 + 接头15 + 胶带8"
      },
      {
        "feeType": "人工费",
        "amount": 60.00,
        "note": "维修时长约1.5小时"
      }
    ]
  }'
```

### 5. 补充备注
```bash
curl -X POST http://localhost:3000/api/orders/{工单ID}/note \
  -H "x-user-id: {任意用户ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "漏水点已修复，试水正常"
  }'
```

### 6. 后勤主管审核（通过）
```bash
curl -X POST http://localhost:3000/api/orders/{工单ID}/audit \
  -H "x-user-id: {后勤主管用户ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "auditResult": "APPROVED",
    "auditOpinion": "费用合理，材料使用正常"
  }'
```

### 7. 后勤主管审核（退回）
```bash
curl -X POST http://localhost:3000/api/orders/{工单ID}/audit \
  -H "x-user-id: {后勤主管用户ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "auditResult": "REJECTED",
    "returnReason": "人工费过高，请重新核实收费标准",
    "auditOpinion": "简单紧固螺丝，人工费不应超过50元"
  }'
```

---

## 工单查询

### 查询工单详情（含完整状态流转历史）
```bash
curl -X GET http://localhost:3000/api/orders/{工单ID} \
  -H "x-user-id: {任意用户ID}" \
  -H "Content-Type: application/json"
```

### 查询所有工单
```bash
curl -X GET http://localhost:3000/api/orders \
  -H "x-user-id: {任意用户ID}" \
  -H "Content-Type: application/json"
```

### 按状态筛选工单
```bash
curl -X GET "http://localhost:3000/api/orders?status=COMPLETED" \
  -H "x-user-id: {任意用户ID}" \
  -H "Content-Type: application/json"
```

### 按日期范围筛选工单
```bash
curl -X GET "http://localhost:3000/api/orders?startDate=2026-06-01&endDate=2026-06-30" \
  -H "x-user-id: {任意用户ID}" \
  -H "Content-Type: application/json"
```

---

## 状态流转说明

| 状态 | 说明 | 可执行操作 |
|------|------|-----------|
| CREATED | 待派单 | 后勤主管可派单 |
| ASSIGNED | 待维修 | 维修师傅可登记材料 |
| MATERIAL_REGISTERED | 材料已登记 | 维修师傅可登记费用 |
| FEE_REGISTERED | 费用已登记 | 后勤主管可审核 |
| RETURNED | 已退回 | 维修师傅可重新登记材料/费用 |
| COMPLETED | 已完成 | 流程结束 |

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 10001 | 参数错误 |
| 10002 | 缺少必要参数 |
| 10003 | 参数格式无效 |
| 20001 | 用户不存在 |
| 20002 | 用户角色无效 |
| 30001 | 维修工单不存在 |
| 30002 | 工单状态不支持该操作 |
| 60001 | 权限不足 |
| 60002 | 当前状态不允许该操作 |
| 99999 | 服务器内部错误 |
