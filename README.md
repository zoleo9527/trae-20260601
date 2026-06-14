# 彩票门店活动物料与门店反馈管理系统

## 系统概述

本系统用于管理彩票门店的活动物料发放和门店反馈处理，核心目标是**直接暴露卡住的单子**，确保系统能回答三个关键问题：

1. **谁在处理**：店员、店长、片区管理员的责任链清晰可见
2. **卡在哪里**：活动物料的当前状态和处理进度一目了然
3. **为什么没完成**：门店反馈的卡住原因和处理记录完整追踪

## 核心功能

### 1. 活动物料管理
- 创建和发放活动物料
- 状态流转：待发放 → 已发放 → 已接收 → 使用中 → 已完成/卡住
- 当前处理人追踪
- 卡住原因记录

### 2. 门店反馈管理
- 提交和查看门店反馈
- 状态流转：待处理 → 处理中 → 已解决/已退回/已升级
- 处理记录完整追踪
- 解决方案和拒绝原因记录

### 3. 责任链管理
- 店员 → 店长 → 片区管理员三级责任链
- 自动升级机制
- 处理历史完整记录

### 4. 异常检测与提醒
- 自动检测卡住的单子（超过指定天数）
- 自动检测责任不清的项目（无明确处理人）
- 异样例直接触发提醒或退回

### 5. 导出功能
- 活动物料导出
- 门店反馈导出
- 卡住项目专项导出
- 支持后台异步处理

## 快速启动

```bash
# 安装依赖
pip install -r requirements.txt

# 初始化测试数据
python -m app.init_data

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问：
- API文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

## 测试账号

系统预置了以下测试账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 片区管理员 | admin1 | admin123 | 城东片区管理员 |
| 片区管理员 | admin2 | admin123 | 城西片区管理员 |
| 店长 | manager1 | manager123 | 幸福路彩票店店长 |
| 店长 | manager2 | manager123 | 人民广场彩票店店长 |
| 店长 | manager3 | manager123 | 科技园彩票店店长 |
| 店员 | clerk1 | clerk123 | 幸福路彩票店店员 |
| 店员 | clerk2 | clerk123 | 人民广场彩票店店员 |
| 店员 | clerk3 | clerk123 | 科技园彩票店店员 |

## API接口说明

### 基础数据管理

#### 创建片区
```
POST /areas/
{
  "name": "城东片区",
  "description": "城东区域所有门店"
}
```

#### 创建门店
```
POST /stores/
{
  "name": "幸福路彩票店",
  "code": "STORE001",
  "area_id": 1,
  "address": "幸福路123号",
  "contact_phone": "13800138001"
}
```

#### 创建用户
```
POST /users/
{
  "username": "clerk1",
  "password": "clerk123",
  "real_name": "周店员",
  "role": "clerk",
  "store_id": 1,
  "phone": "13900139006"
}
```

### 活动物料管理

#### 创建活动物料
```
POST /materials/
{
  "name": "春节促销海报",
  "code": "MAT001",
  "description": "2024年春节促销活动海报",
  "quantity": 10,
  "store_id": 1,
  "expected_complete_date": "2024-02-15"
}
```

#### 查询活动物料
```
GET /materials/?store_id=1&status=distributed
```

#### 变更物料状态
```
POST /materials/{material_id}/status
{
  "to_status": "distributed",
  "notes": "已发放至门店",
  "handler_id": 1
}
```

#### 查询卡住的物料
```
GET /materials/stuck/list?days=3
```

#### 查询无处理人的物料
```
GET /materials/no-handler/list
```

### 门店反馈管理

#### 创建门店反馈
```
POST /feedbacks/
{
  "material_id": 1,
  "store_id": 1,
  "title": "海报展示位置问题",
  "content": "店内空间有限，海报展示位置不够显眼",
  "feedback_type": "建议",
  "priority": 2
}
```

#### 查询门店反馈
```
GET /feedbacks/?store_id=1&status=processing
```

#### 变更反馈状态
```
POST /feedbacks/{feedback_id}/status
{
  "to_status": "resolved",
  "notes": "已申请增加展示架",
  "handler_id": 1
}
```

#### 查询卡住的反馈
```
GET /feedbacks/stuck/list?days=3
```

#### 查询无处理人的反馈
```
GET /feedbacks/no-handler/list
```

### 责任链管理

#### 查询物料责任链
```
GET /responsibility/material/{material_id}
```

返回示例：
```json
{
  "material_id": 1,
  "item_type": "material",
  "item_name": "春节促销海报",
  "current_handler": {
    "id": 6,
    "real_name": "周店员",
    "role": "clerk"
  },
  "handler_role": "clerk",
  "current_status": "in_use",
  "stuck_at": null,
  "reason_not_completed": null,
  "escalation_path": [
    {
      "handler_name": "张管理员",
      "handler_role": "area_admin",
      "action": "发放物料",
      "from_status": "pending",
      "to_status": "distributed",
      "notes": "已发放至幸福路彩票店",
      "created_at": "2024-01-20T10:00:00"
    },
    {
      "handler_name": "周店员",
      "handler_role": "clerk",
      "action": "确认接收",
      "from_status": "distributed",
      "to_status": "received",
      "notes": "物料已接收，数量正确",
      "created_at": "2024-01-21T09:00:00"
    }
  ]
}
```

#### 查询反馈责任链
```
GET /responsibility/feedback/{feedback_id}
```

#### 升级处理人
```
POST /responsibility/material/{material_id}/escalate
POST /responsibility/feedback/{feedback_id}/escalate
```

### 异常提醒管理

#### 查询未处理提醒
```
GET /alerts/?unhandled_only=true
```

#### 处理提醒
```
POST /alerts/{alert_id}/handle
```

#### 手动触发异常检测
```
POST /alerts/check-stuck?days=3
```

### 导出任务管理

#### 创建导出任务
```
POST /exports/
{
  "task_type": "materials",
  "parameters": "{\"store_id\": 1, \"status\": \"distributed\"}"
}
```

支持的导出类型：
- `materials`: 活动物料导出
- `feedbacks`: 门店反馈导出
- `stuck_items`: 卡住项目导出

#### 查询导出任务状态
```
GET /exports/{task_id}
```

#### 下载导出文件
```
GET /exports/{task_id}/download
```

#### 重试导出任务
```
POST /exports/{task_id}/retry
```

## 异常处理流程

### 1. 卡住物料处理流程

当物料状态为 `stuck` 且超过指定天数时：

1. 系统自动创建 `STUCK` 类型提醒
2. 提醒内容包含物料名称、编号、卡住天数
3. 管理员查看提醒后可：
   - 查看责任链，了解谁在处理、卡在哪里
   - 升级处理人（店员 → 店长 → 片区管理员）
   - 标记提醒为已处理

### 2. 责任不清处理流程

当物料或反馈处于处理中状态但无明确处理人时：

1. 系统自动创建 `UNCLEAR_RESPONSIBILITY` 类型提醒
2. 提醒级别为 `ERROR`
3. 管理员需立即指定处理人

### 3. 门店反馈退回流程

当反馈无法解决时：

1. 处理人将状态改为 `rejected`
2. 记录拒绝原因
3. 系统自动创建提醒通知相关人员

## 数据模型说明

### 用户角色
- `clerk`: 店员 - 处理基础反馈和物料接收
- `store_manager`: 店长 - 处理店员无法处理的问题
- `area_admin`: 片区管理员 - 处理店长无法处理的问题

### 物料状态
- `pending`: 待发放
- `distributed`: 已发放
- `received`: 已接收
- `in_use`: 使用中
- `completed`: 已完成
- `stuck`: 卡住/异常

### 反馈状态
- `pending`: 待处理
- `processing`: 处理中
- `resolved`: 已解决
- `rejected`: 已退回
- `escalated`: 已升级

### 提醒类型
- `timeout`: 超时提醒
- `stuck`: 卡住提醒
- `unclear_responsibility`: 责任不清提醒
- `escalation_needed`: 需升级提醒

### 提醒级别
- `info`: 信息级别
- `warning`: 警告级别
- `error`: 错误级别

## 技术栈

- **后端框架**: FastAPI
- **数据库**: SQLite (可切换到 PostgreSQL/MySQL)
- **ORM**: SQLAlchemy
- **数据验证**: Pydantic
- **导出**: OpenPyXL
- **认证**: JWT (可扩展)

## 扩展建议

1. **认证增强**: 当前使用简化认证，建议集成完整JWT认证
2. **数据库升级**: 生产环境建议使用 PostgreSQL 或 MySQL
3. **前端界面**: 可开发配套的Web管理界面
4. **消息推送**: 可集成短信、邮件推送提醒
5. **定时任务**: 可添加定时任务自动检测异常
6. **数据分析**: 可添加统计报表和数据分析功能