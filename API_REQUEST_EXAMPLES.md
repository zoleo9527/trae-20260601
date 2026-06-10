# 蛋品分级与装箱发货系统 - API 请求示例

## 基础信息

- 服务地址: `http://localhost:3000`
- API文档: `http://localhost:3000/api-docs`
- 数据库: MySQL (需提前配置)

## 预置用户

系统启动时会自动初始化以下测试用户：

| 用户ID | 姓名 | 角色 | 说明 |
|--------|------|------|------|
| breeder001 | 张饲养 | breeder | 饲养员 |
| breeder002 | 李饲养 | breeder | 饲养员 |
| sorter001 | 王分拣 | sorter | 分拣员 |
| sorter002 | 赵分拣 | sorter | 分拣员 |
| manager001 | 刘场长 | manager | 场长 |

---

## 一、蛋品分级接口

### 1.1 提交蛋品分级记录 (饲养员)

**请求**:
```bash
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -d '{
    "batchNumber": "B20240115001",
    "grade": "A",
    "quantity": 1000,
    "weight": 50.5,
    "breederId": "breeder001"
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "batchNumber": "B20240115001",
    "grade": "A",
    "quantity": 1000,
    "weight": 50.5,
    "breederId": "breeder001",
    "breederName": "张饲养",
    "sorterId": null,
    "sorterName": null,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 1.2 确认蛋品分级 (分拣员)

**请求**:
```bash
curl -X PUT http://localhost:3000/api/grades/{recordId}/verify \
  -H "Content-Type: application/json" \
  -d '{
    "sorterId": "sorter001"
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "batchNumber": "B20240115001",
    "grade": "A",
    "quantity": 1000,
    "weight": 50.5,
    "breederId": "breeder001",
    "breederName": "张饲养",
    "sorterId": "sorter001",
    "sorterName": "王分拣",
    "status": "verified",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 1.3 查询蛋品分级列表 (分页)

**请求**:
```bash
curl -X GET "http://localhost:3000/api/grades?page=1&pageSize=10&status=verified&grade=A"
```

**参数说明**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认1 |
| pageSize | number | 每页数量，默认10 |
| batchNumber | string | 批次号模糊查询 |
| grade | string | 等级筛选 (A/B/C) |
| status | string | 状态筛选 (pending/verified/packed) |
| breederId | string | 饲养员ID筛选 |
| sorterId | string | 分拣员ID筛选 |
| startDate | string | 开始日期 (YYYY-MM-DD) |
| endDate | string | 结束日期 (YYYY-MM-DD) |

**响应**:
```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 1.4 查询单个蛋品分级记录

**请求**:
```bash
curl -X GET http://localhost:3000/api/grades/{recordId}
```

### 1.5 查询操作日志

**请求**:
```bash
curl -X GET http://localhost:3000/api/grades/{recordId}/logs
```

---

## 二、装箱发货接口

### 2.1 确认装箱发货 (场长)

**请求**:
```bash
curl -X POST http://localhost:3000/api/packings \
  -H "Content-Type: application/json" \
  -d '{
    "eggGradeRecordId": "xxx",
    "boxCount": 10,
    "eggsPerBox": 100,
    "destination": "北京朝阳区批发市场",
    "transporter": "顺丰冷链",
    "managerId": "manager001"
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "yyy",
    "eggGradeRecordId": "xxx",
    "batchNumber": "B20240115001",
    "boxCount": 10,
    "eggsPerBox": 100,
    "totalEggs": 1000,
    "destination": "北京朝阳区批发市场",
    "transporter": "顺丰冷链",
    "managerId": "manager001",
    "managerName": "刘场长",
    "sortedById": "sorter001",
    "sortedByName": "王分拣",
    "status": "confirmed",
    "createdAt": "2024-01-15T12:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

### 2.2 执行发货

**请求**:
```bash
curl -X PUT http://localhost:3000/api/packings/{packingId}/ship \
  -H "Content-Type: application/json" \
  -d '{
    "operatorId": "manager001"
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "yyy",
    "batchNumber": "B20240115001",
    "status": "shipped",
    ...
  }
}
```

### 2.3 查询装箱记录列表 (分页)

**请求**:
```bash
curl -X GET "http://localhost:3000/api/packings?page=1&pageSize=10&status=confirmed"
```

**参数说明**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认1 |
| pageSize | number | 每页数量，默认10 |
| batchNumber | string | 批次号模糊查询 |
| destination | string | 目的地模糊查询 |
| status | string | 状态筛选 (confirmed/shipped) |
| managerId | string | 场长ID筛选 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

### 2.4 查询单个装箱记录

**请求**:
```bash
curl -X GET http://localhost:3000/api/packings/{packingId}
```

### 2.5 查询装箱操作日志

**请求**:
```bash
curl -X GET http://localhost:3000/api/packings/{packingId}/logs
```

---

## 三、用户管理接口

### 3.1 查询所有用户

**请求**:
```bash
curl -X GET http://localhost:3000/api/users
```

### 3.2 按角色查询用户

**请求**:
```bash
curl -X GET "http://localhost:3000/api/users?role=breeder"
```

**角色选项**: breeder / sorter / manager

### 3.3 查询单个用户

**请求**:
```bash
curl -X GET http://localhost:3000/api/users/{userId}
```

---

## 四、健康检查

**请求**:
```bash
curl -X GET http://localhost:3000/health
```

**响应**:
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 五、完整业务流程示例

```bash
# 1. 饲养员提交蛋品分级
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -d '{"batchNumber":"B20240115001","grade":"A","quantity":1000,"weight":50.5,"breederId":"breeder001"}'

# 2. 分拣员确认分级
curl -X PUT http://localhost:3000/api/grades/{gradeId}/verify \
  -H "Content-Type: application/json" \
  -d '{"sorterId":"sorter001"}'

# 3. 场长确认装箱
curl -X POST http://localhost:3000/api/packings \
  -H "Content-Type: application/json" \
  -d '{"eggGradeRecordId":"{gradeId}","boxCount":10,"eggsPerBox":100,"destination":"北京","transporter":"顺丰","managerId":"manager001"}'

# 4. 执行发货
curl -X PUT http://localhost:3000/api/packings/{packingId}/ship \
  -H "Content-Type: application/json" \
  -d '{"operatorId":"manager001"}'

# 5. 查看操作日志
curl -X GET http://localhost:3000/api/grades/{gradeId}/logs
curl -X GET http://localhost:3000/api/packings/{packingId}/logs
```