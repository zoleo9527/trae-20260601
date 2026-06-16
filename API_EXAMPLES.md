# 餐饮连锁门店外卖差评与补偿处理系统 - API 请求示例

## 一、门店管理

### 1.1 创建门店
```bash
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "storeCode": "SH001",
    "storeName": "上海陆家嘴店",
    "region": "上海",
    "address": "上海市浦东新区陆家嘴环路1000号",
    "managerName": "李明",
    "managerPhone": "13800138001",
    "supervisorName": "王强",
    "supervisorPhone": "13900139001"
  }'
```

### 1.2 查询门店列表
```bash
curl -X GET "http://localhost:3000/api/stores?region=上海"
```

---

## 二、外卖差评处理

### 2.1 创建差评记录
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "x-operator-name: 张三" \
  -d '{
    "source": "meituan",
    "orderId": "MT202401010001",
    "customerName": "陈女士",
    "customerPhone": "13700137001",
    "content": "菜品不新鲜，配送超时30分钟，非常不满意！",
    "level": "critical",
    "type": "food_quality",
    "orderAmount": 68.00,
    "storeCode": "SH001"
  }'
```

### 2.2 查询差评列表
```bash
curl -X GET "http://localhost:3000/api/reviews?status=pending&level=critical"
```

### 2.3 分配处理人
```bash
curl -X POST http://localhost:3000/api/reviews/{reviewId}/assign \
  -H "Content-Type: application/json" \
  -H "x-operator-role: region_supervisor" \
  -H "x-operator-name: 王强" \
  -d '{
    "handlerRole": "store_manager",
    "handlerName": "李明"
  }'
```

### 2.4 更新差评状态
```bash
curl -X PUT http://localhost:3000/api/reviews/{reviewId} \
  -H "Content-Type: application/json" \
  -H "x-operator-role: store_manager" \
  -H "x-operator-name: 李明" \
  -d '{
    "status": "processing",
    "internalNotes": "已联系顾客，顾客要求退款处理"
  }'
```

### 2.5 解决差评
```bash
curl -X POST http://localhost:3000/api/reviews/{reviewId}/resolve \
  -H "Content-Type: application/json" \
  -H "x-operator-role: store_manager" \
  -H "x-operator-name: 李明" \
  -d '{
    "notes": "已完成退款，顾客表示满意"
  }'
```

### 2.6 关闭差评
```bash
curl -X POST http://localhost:3000/api/reviews/{reviewId}/close \
  -H "x-operator-role: region_supervisor" \
  -H "x-operator-name: 王强"
```

---

## 三、补偿处理

### 3.1 创建补偿申请
```bash
curl -X POST http://localhost:3000/api/compensations \
  -H "Content-Type: application/json" \
  -H "x-operator-role: store_manager" \
  -H "x-operator-name: 李明" \
  -d '{
    "reviewId": "{reviewId}",
    "type": "refund",
    "amount": 68.00,
    "reason": "菜品不新鲜，配送超时，全额退款"
  }'
```

### 3.2 审核补偿申请（通过）
```bash
curl -X POST http://localhost:3000/api/compensations/{compensationId}/approve \
  -H "Content-Type: application/json" \
  -H "x-operator-role: region_supervisor" \
  -H "x-operator-name: 王强" \
  -d '{
    "approver": "region_supervisor",
    "approverName": "王强"
  }'
```

### 3.3 审核补偿申请（拒绝）
```bash
curl -X POST http://localhost:3000/api/compensations/{compensationId}/reject \
  -H "Content-Type: application/json" \
  -H "x-operator-role: region_supervisor" \
  -H "x-operator-name: 王强" \
  -d '{
    "rejectReason": "补偿金额过高，建议协商部分退款"
  }'
```

### 3.4 处理补偿支付
```bash
curl -X POST http://localhost:3000/api/compensations/{compensationId}/process \
  -H "Content-Type: application/json" \
  -H "x-operator-role: finance" \
  -H "x-operator-name: 赵财务" \
  -d '{
    "paymentTransactionId": "TXN202401010001"
  }'
```

### 3.5 完成补偿
```bash
curl -X POST http://localhost:3000/api/compensations/{compensationId}/complete \
  -H "x-operator-role: finance" \
  -H "x-operator-name: 赵财务"
```

---

## 四、审计日志

### 4.1 查询指定目标的审计日志
```bash
curl -X GET http://localhost:3000/api/audit/target/{targetId}
```

### 4.2 查询指定模块的审计日志
```bash
curl -X GET http://localhost:3000/api/audit/module/review
```

### 4.3 查询指定操作人的审计日志
```bash
curl -X GET http://localhost:3000/api/audit/operator/李明
```

### 4.4 查询指定日期范围的审计日志
```bash
curl -X GET "http://localhost:3000/api/audit/date-range?startDate=2024-01-01&endDate=2024-01-31"
```

---

## 五、错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 操作成功 |
| 10000 | 未知错误 |
| 10001 | 参数校验失败 |
| 10002 | 未授权访问 |
| 10003 | 禁止访问 |
| 10004 | 资源不存在 |
| 10005 | 重复记录 |
| 20001 | 差评记录不存在 |
| 20002 | 差评状态无效 |
| 20003 | 差评已解决 |
| 20004 | 差评已有补偿记录 |
| 30001 | 补偿记录不存在 |
| 30002 | 补偿状态无效 |
| 30003 | 补偿已审核通过 |
| 30004 | 补偿已被拒绝 |
| 30005 | 补偿已完成 |
| 40001 | 门店不存在 |
| 40002 | 门店已停用 |
| 50001 | 审计日志记录失败 |
| 90001 | 数据库操作失败 |

---

## 六、业务查询示例

### 6.1 查询待处理差评（店长视角）
```bash
curl -X GET "http://localhost:3000/api/reviews?currentHandler=store_manager&status=processing"
```

### 6.2 查询待审核补偿（区域督导视角）
```bash
curl -X GET "http://localhost:3000/api/compensations?status=pending"
```

### 6.3 查询卡壳的差评（阻塞原因）
```bash
curl -X GET http://localhost:3000/api/reviews/blocked
```

### 6.4 查询未完成的补偿
```bash
curl -X GET http://localhost:3000/api/compensations/uncompleted
```
