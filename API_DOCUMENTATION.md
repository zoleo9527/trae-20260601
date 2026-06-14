# 典当行续当赎当与费用计算系统 - API接口文档

## 系统概述

本系统通过FastAPI实现真实的后端API入口，解决典当行续当赎当与费用计算过程中最容易扯皮的问题：
- 续当赎当和费用计算之间的责任划分不清
- 柜台评估师、库管、财务看到的信息不同但状态口径不一致
- 续当赎当到费用计算之间出现无人负责的空档

## API文档访问

启动服务后，可通过以下地址访问API文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 启动服务

```bash
pip install -r requirements.txt
python3 main.py
```

## API路由列表

### 1. 典当品管理

#### 1.1 创建典当品
```
POST /api/pawn/create
```

**请求参数:**
```json
{
  "customer_id": "string",
  "item_name": "string",
  "item_description": "string",
  "appraised_value": 15000.00,
  "loan_amount": 10000.00,
  "interest_rate": 0.36,
  "term_days": 180,
  "assessor_id": "string"
}
```

**返回结果:**
```json
{
  "pawn_item_id": "string",
  "status": "active",
  "start_date": "2024-06-14",
  "due_date": "2024-12-11",
  "created_at": "2024-06-14T10:00:00Z"
}
```

**责任划分:**
- 评估师负责初始评估
- 典当品创建后状态为 active
- 责任链记录评估师的责任

### 2. 续当处理

#### 2.1 创建续当申请
```
POST /api/renewal/create
```

**请求参数:**
```json
{
  "pawn_item_id": "string",
  "new_due_date": "2024-12-31",
  "operator_id": "string",
  "operator_role": "assessor|warehouse|finance|manager"
}
```

**返回结果:**
```json
{
  "renewal_id": "string",
  "pawn_item_id": "string",
  "original_due_date": "2024-06-30",
  "new_due_date": "2024-12-31",
  "status": "draft",
  "current_handler": "assessor",
  "created_at": "2024-06-14T10:00:00Z"
}
```

**状态迁移:**
- 典当品状态从 active/overdue 转换为 renewal_pending
- 续当记录状态为 draft
- 责任转移到续当处理

#### 2.2 提交评估师审核
```
POST /api/renewal/submit-assessor
```

**请求参数:**
```json
{
  "renewal_id": "string",
  "operator_id": "string",
  "operator_role": "assessor|warehouse|finance|manager"
}
```

**返回结果:**
```json
{
  "renewal_id": "string",
  "status": "pending_assessor",
  "current_handler": "assessor",
  "updated_at": "2024-06-14T10:05:00Z"
}
```

**状态迁移:**
- 续当记录状态从 draft 转换为 pending_assessor
- 责任转移到评估师

#### 2.3 评估师审核通过
```
POST /api/renewal/assessor-approve
```

**请求参数:**
```json
{
  "renewal_id": "string",
  "assessor_id": "string",
  "assessor_notes": "string"
}
```

**返回结果:**
```json
{
  "renewal_id": "string",
  "status": "pending_finance",
  "assessor_id": "string",
  "assessor_notes": "string",
  "current_handler": "finance",
  "updated_at": "2024-06-14T10:10:00Z"
}
```

**状态迁移:**
- 续当记录状态从 pending_assessor 转换为 pending_finance
- 责任转移到财务

#### 2.4 评估师审核拒绝
```
POST /api/renewal/assessor-reject
```

**请求参数:**
```json
{
  "renewal_id": "string",
  "assessor_id": "string",
  "reject_reason": "string"
}
```

**返回结果:**
```json
{
  "renewal_id": "string",
  "status": "rejected",
  "assessor_id": "string",
  "assessor_notes": "string",
  "updated_at": "2024-06-14T10:10:00Z"
}
```

**状态迁移:**
- 续当记录状态转换为 rejected
- 典当品状态回到 active
- 责任回到客户

#### 2.5 财务审核通过
```
POST /api/renewal/finance-approve
```

**请求参数:**
```json
{
  "renewal_id": "string",
  "finance_id": "string",
  "finance_notes": "string"
}
```

**返回结果:**
```json
{
  "renewal_id": "string",
  "status": "approved",
  "finance_id": "string",
  "finance_notes": "string",
  "fee_calculation_id": "string",
  "renewal_fee": 2800.00,
  "updated_at": "2024-06-14T10:15:00Z"
}
```

**状态迁移:**
- 续当记录状态转换为 approved
- 典当品状态转换为 renewal_approved
- 典当品到期日期更新为新到期日期
- 费用计算结果回写到 renewal_fee
- 责任转移到结算

### 3. 赎当处理

#### 3.1 创建赎当申请
```
POST /api/redemption/create
```

**请求参数:**
```json
{
  "pawn_item_id": "string",
  "redemption_date": "2024-06-14",
  "operator_id": "string",
  "operator_role": "assessor|warehouse|finance|manager"
}
```

**返回结果:**
```json
{
  "redemption_id": "string",
  "pawn_item_id": "string",
  "redemption_date": "2024-06-14",
  "status": "draft",
  "current_handler": "finance",
  "created_at": "2024-06-14T10:00:00Z"
}
```

**状态迁移:**
- 典当品状态从 active/overdue/renewal_approved 转换为 redemption_pending
- 赎当记录状态为 draft
- 责任转移到赎当处理

#### 3.2 提交财务审核
```
POST /api/redemption/submit-finance
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "operator_id": "string",
  "operator_role": "assessor|warehouse|finance|manager"
}
```

**返回结果:**
```json
{
  "redemption_id": "string",
  "status": "pending_finance",
  "current_handler": "finance",
  "updated_at": "2024-06-14T10:05:00Z"
}
```

**状态迁移:**
- 赎当记录状态从 draft 转换为 pending_finance
- 责任转移到财务

#### 3.3 财务完成费用计算
```
POST /api/redemption/finance-complete
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "finance_id": "string",
  "finance_notes": "string"
}
```

**返回结果:**
```json
{
  "redemption_id": "string",
  "status": "pending_warehouse",
  "finance_id": "string",
  "finance_notes": "string",
  "fee_calculation_id": "string",
  "total_amount": 12800.00,
  "current_handler": "warehouse",
  "updated_at": "2024-06-14T10:10:00Z"
}
```

**状态迁移:**
- 赎当记录状态从 pending_finance 转换为 pending_warehouse
- 费用计算结果回写到 total_amount
- 责任转移到库管

#### 3.4 库管确认物品
```
POST /api/redemption/warehouse-confirm
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "warehouse_id": "string",
  "warehouse_notes": "string"
}
```

**返回结果:**
```json
{
  "redemption_id": "string",
  "status": "pending_customer",
  "warehouse_id": "string",
  "warehouse_notes": "string",
  "updated_at": "2024-06-14T10:15:00Z"
}
```

**状态迁移:**
- 赎当记录状态从 pending_warehouse 转换为 pending_customer
- 责任转移到客户确认

#### 3.5 客户确认赎当
```
POST /api/redemption/customer-confirm
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "operator_id": "string",
  "operator_role": "assessor|warehouse|finance|manager"
}
```

**返回结果:**
```json
{
  "redemption_id": "string",
  "status": "completed",
  "customer_confirmation": true,
  "updated_at": "2024-06-14T10:20:00Z"
}
```

**状态迁移:**
- 赎当记录状态转换为 completed
- 典当品状态转换为 redeemed
- 责任转移到结算

#### 3.6 提起赎当争议
```
POST /api/redemption/raise-dispute
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "dispute_reason": "string",
  "operator_id": "string",
  "operator_role": "assessor|warehouse|finance|manager"
}
```

**返回结果:**
```json
{
  "redemption_id": "string",
  "status": "disputed",
  "dispute_reason": "string",
  "updated_at": "2024-06-14T10:25:00Z"
}
```

**状态迁移:**
- 赎当记录状态转换为 disputed
- 典当品状态转换为 disputed
- 责任链暂停，等待争议解决

### 4. 费用计算

#### 4.1 计算费用
```
POST /api/fee/calculate
```

**请求参数:**
```json
{
  "pawn_item_id": "string",
  "calculation_date": "2024-06-14",
  "calculator_id": "string"
}
```

**返回结果:**
```json
{
  "calculation_id": "string",
  "pawn_item_id": "string",
  "calculation_date": "2024-06-14",
  "principal": 10000.00,
  "interest_amount": 1800.00,
  "service_fee": 100.00,
  "storage_fee": 900.00,
  "penalty_fee": 0.00,
  "total_fee": 2800.00,
  "status": "draft",
  "calculator_id": "string",
  "created_at": "2024-06-14T10:00:00Z"
}
```

**费用计算规则:**
- 利息：本金 × 年利率 ÷ 365 × 天数
- 服务费：本金 × 1% + (天数-30) × 10元
- 保管费：评估价值 × 0.01% × 天数
- 滞纳金：本金 × 5% ÷ 30 × 逾期天数

#### 4.2 提交审核
```
POST /api/fee/submit-review
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "operator_id": "string"
}
```

**返回结果:**
```json
{
  "calculation_id": "string",
  "status": "pending_review",
  "updated_at": "2024-06-14T10:05:00Z"
}
```

**状态迁移:**
- 费用计算状态从 draft 转换为 pending_review

#### 4.3 审核通过
```
POST /api/fee/approve
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "reviewer_id": "string",
  "review_notes": "string"
}
```

**返回结果:**
```json
{
  "calculation_id": "string",
  "status": "approved",
  "reviewer_id": "string",
  "review_notes": "string",
  "updated_at": "2024-06-14T10:10:00Z"
}
```

**状态迁移:**
- 费用计算状态从 pending_review 转换为 approved
- 责任转移到结算

#### 4.4 提起争议
```
POST /api/fee/raise-dispute
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "dispute_reason": "string",
  "operator_id": "string",
  "operator_role": "assessor|warehouse|finance|manager"
}
```

**返回结果:**
```json
{
  "calculation_id": "string",
  "status": "disputed",
  "dispute_reason": "string",
  "updated_at": "2024-06-14T10:15:00Z"
}
```

**状态迁移:**
- 费用计算状态转换为 disputed

#### 4.5 解决争议
```
POST /api/fee/settle-dispute
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "settlement_notes": "string",
  "operator_id": "string"
}
```

**返回结果:**
```json
{
  "calculation_id": "string",
  "status": "settled",
  "updated_at": "2024-06-14T10:20:00Z"
}
```

**状态迁移:**
- 费用计算状态转换为 settled

#### 4.6 查看费用计算历史
```
GET /api/fee/history/{pawn_item_id}
```

**路径参数:**
- `pawn_item_id`: 典当品ID

**返回结果:**
```json
{
  "pawn_item_id": "string",
  "calculations": [
    {
      "calculation_id": "string",
      "calculation_date": "2024-06-14",
      "total_fee": 2800.00,
      "status": "approved",
      "created_at": "2024-06-14T10:00:00Z"
    }
  ]
}
```

#### 4.7 查看费用计算详情
```
GET /api/fee/details/{calculation_id}
```

**路径参数:**
- `calculation_id`: 费用计算ID

**返回结果:**
```json
{
  "calculation": {
    "calculation_id": "string",
    "pawn_item_id": "string",
    "calculation_date": "2024-06-14",
    "principal": 10000.00,
    "interest_amount": 1800.00,
    "service_fee": 100.00,
    "storage_fee": 900.00,
    "penalty_fee": 0.00,
    "total_fee": 2800.00,
    "status": "approved"
  },
  "pawn_item": {
    "id": "string",
    "item_name": "string",
    "loan_amount": 10000.00,
    "start_date": "2024-01-01",
    "due_date": "2024-06-30"
  },
  "responsibility_chains": [
    {
      "stage": "fee_calculation",
      "handler_id": "string",
      "handler_role": "finance",
      "start_time": "2024-06-14T10:00:00Z",
      "end_time": "2024-06-14T10:10:00Z"
    }
  ],
  "audit_trail": [
    {
      "action": "CREATE",
      "operator_id": "string",
      "timestamp": "2024-06-14T10:00:00Z"
    }
  ]
}
```

### 5. 审计日志查询

#### 5.1 查询审计日志
```
GET /api/audit/logs
```

**查询参数:**
- `entity_type`: 实体类型 (可选)
- `entity_id`: 实体ID (可选)
- `operator_id`: 操作人ID (可选)
- `operator_role`: 操作人角色 (可选)
- `action`: 操作类型 (可选)
- `start_date`: 开始日期 (可选)
- `end_date`: 结束日期 (可选)

**返回结果:**
```json
{
  "logs": [
    {
      "id": "string",
      "entity_type": "FeeCalculation",
      "entity_id": "string",
      "action": "CREATE",
      "old_value": null,
      "new_value": "费用计算: 总费用=2800.00",
      "operator_id": "string",
      "operator_role": "finance",
      "timestamp": "2024-06-14T10:00:00Z",
      "notes": null
    }
  ]
}
```

#### 5.2 查询状态转换记录
```
GET /api/audit/transitions
```

**查询参数:**
- `entity_type`: 实体类型 (可选)
- `entity_id`: 实体ID (可选)
- `triggered_by`: 触发人ID (可选)
- `trigger_role`: 触发人角色 (可选)
- `from_status`: 原状态 (可选)
- `to_status`: 新状态 (可选)
- `start_date`: 开始日期 (可选)
- `end_date`: 结束日期 (可选)

**返回结果:**
```json
{
  "transitions": [
    {
      "id": "string",
      "entity_type": "PawnItem",
      "entity_id": "string",
      "from_status": "active",
      "to_status": "renewal_pending",
      "triggered_by": "string",
      "trigger_role": "assessor",
      "timestamp": "2024-06-14T10:00:00Z",
      "reason": "续当申请创建"
    }
  ]
}
```

#### 5.3 查询责任链
```
GET /api/audit/responsibility
```

**查询参数:**
- `pawn_item_id`: 典当品ID (可选)
- `stage`: 责任阶段 (可选)
- `handler_id`: 处理人ID (可选)
- `handler_role`: 处理人角色 (可选)
- `status`: 责任状态 (可选)

**返回结果:**
```json
{
  "chains": [
    {
      "id": "string",
      "pawn_item_id": "string",
      "stage": "fee_calculation",
      "handler_id": "string",
      "handler_role": "finance",
      "start_time": "2024-06-14T10:00:00Z",
      "end_time": "2024-06-14T10:10:00Z",
      "status": "completed",
      "notes": "费用计算审核通过"
    }
  ]
}
```

#### 5.4 获取实体审计追踪
```
GET /api/audit/trail/{entity_type}/{entity_id}
```

**路径参数:**
- `entity_type`: 实体类型
- `entity_id`: 实体ID

**返回结果:**
```json
{
  "entity_type": "FeeCalculation",
  "entity_id": "string",
  "audit_logs": [
    {
      "id": "string",
      "action": "CREATE",
      "old_value": null,
      "new_value": "费用计算: 总费用=2800.00",
      "operator_id": "string",
      "operator_role": "finance",
      "timestamp": "2024-06-14T10:00:00Z",
      "notes": null
    }
  ],
  "state_transitions": [
    {
      "id": "string",
      "from_status": "draft",
      "to_status": "pending_review",
      "triggered_by": "string",
      "trigger_role": "finance",
      "timestamp": "2024-06-14T10:05:00Z",
      "reason": "提交审核"
    }
  ]
}
```

#### 5.5 获取责任报告
```
GET /api/audit/responsibility-report/{pawn_item_id}
```

**路径参数:**
- `pawn_item_id`: 典当品ID

**返回结果:**
```json
{
  "pawn_item_id": "string",
  "responsibility_stages": {
    "appraisal": [
      {
        "handler_id": "string",
        "handler_role": "assessor",
        "start_time": "2024-01-01T09:00:00Z",
        "end_time": "2024-01-01T09:30:00Z",
        "duration_seconds": 1800,
        "status": "completed",
        "notes": "初始评估"
      }
    ],
    "fee_calculation": [
      {
        "handler_id": "string",
        "handler_role": "finance",
        "start_time": "2024-06-14T10:00:00Z",
        "end_time": "2024-06-14T10:10:00Z",
        "duration_seconds": 600,
        "status": "completed",
        "notes": "费用计算审核通过"
      }
    ]
  },
  "total_handlers": 2,
  "active_handlers": 0,
  "completed_handlers": 2
}
```

#### 5.6 获取争议证据
```
GET /api/audit/dispute-evidence/{entity_type}/{entity_id}
```

**路径参数:**
- `entity_type`: 实体类型
- `entity_id`: 实体ID

**返回结果:**
```json
{
  "entity_type": "FeeCalculation",
  "entity_id": "string",
  "audit_trail": {
    "audit_logs": [...],
    "state_transitions": [...]
  },
  "dispute_records": [
    {
      "action": "DISPUTE",
      "timestamp": "2024-06-14T10:15:00Z",
      "operator_id": "string",
      "operator_role": "assessor",
      "details": "利息计算偏高"
    }
  ],
  "timeline": [...]
}
```

## 状态约束说明

### 典当品状态转换规则
```
pending -> appraised
appraised -> approved | closed
approved -> active
active -> renewal_pending | redemption_pending | overdue
renewal_pending -> renewal_approved | active | disputed
renewal_approved -> active
redemption_pending -> redemption_approved | disputed
redemption_approved -> redeemed
overdue -> renewal_pending | redemption_pending | disputed
disputed -> active | redeemed | closed
redeemed -> closed
```

### 续当记录状态转换规则
```
draft -> pending_assessor
pending_assessor -> pending_finance | rejected
pending_finance -> approved | rejected
approved -> cancelled
rejected -> draft | cancelled
```

### 赎当记录状态转换规则
```
draft -> pending_finance
pending_finance -> pending_warehouse | disputed
pending_warehouse -> pending_customer | disputed
pending_customer -> completed | disputed
completed -> (终态)
disputed -> pending_finance | cancelled
```

### 费用计算状态转换规则
```
draft -> pending_review
pending_review -> approved | disputed
approved -> settled
disputed -> pending_review | settled
```

## 责任划分说明

### 责任阶段
- **appraisal**: 评估师负责典当品评估
- **warehouse_custody**: 库管负责典当品保管
- **fee_calculation**: 财务负责费用计算
- **renewal_processing**: 续当处理责任
- **redemption_processing**: 赎当处理责任
- **settlement**: 结算责任

### 责任转移规则
1. 每个操作都会记录责任链
2. 责任转移时必须明确交接人
3. 责任链记录开始时间和结束时间
4. 争议状态下责任链暂停

### 状态一致性保证
1. 典当品状态与续当/赎当状态联动
2. 费用计算状态与续当/赎当状态关联
3. 所有状态转换必须符合约束规则
4. 状态转换记录在审计日志中

## 费用计算结果回写

### 续当费用回写
- 财务审核通过续当申请时，费用计算结果自动回写到 `renewal_fee`
- 续当费用 = 利息 + 服务费 + 保管费 + 滞纳金

### 赎当费用回写
- 财务完成赎当费用计算时，费用计算结果自动回写到 `total_amount`
- 赎当总金额 = 本金 + 利息 + 服务费 + 保管费 + 滞纳金

## 统一状态迁移和责任链交接

### 状态迁移统一机制
- 所有状态迁移通过 `UnifiedBusinessService` 统一处理
- 状态迁移前必须验证约束规则
- 状态迁移后自动记录审计日志和状态转换记录

### 责任链交接统一机制
- 每个操作自动记录责任链
- 责任转移时自动记录交接时间和交接人
- 责任链状态与典当品状态联动
- 争议状态下责任链暂停

## 系统优势

1. **真实路由**: 所有接口都是真实的FastAPI路由，可直接调用
2. **责任清晰**: 每个操作都有明确的责任人，责任转移有记录
3. **状态一致**: 典当品、续当、赎当、费用计算状态联动，符合约束规则
4. **可追溯**: 所有操作都有审计日志，状态转换有记录，责任链可追溯
5. **费用回写**: 费用计算结果自动回写到 renewal_fee 和 total_amount
6. **无空档**: 续当赎当到费用计算之间责任明确，不会出现无人负责的情况
7. **自动文档**: FastAPI自动生成Swagger UI和ReDoc文档