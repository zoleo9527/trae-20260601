"""
典当行续当赎当与费用计算系统 - API接口文档
"""

# API接口文档

## 1. 续当处理接口

### 1.1 创建续当申请
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

**责任划分:**
- 操作员创建续当申请，系统自动记录责任链
- 典当品状态从 `active` 或 `overdue` 转换为 `renewal_pending`
- 审计日志记录创建操作

### 1.2 提交评估师审核
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

**状态转换:**
- 续当记录状态从 `draft` 转换为 `pending_assessor`
- 当前处理人设置为评估师

### 1.3 评估师审核通过
```
POST /api/renewal/assessor-approve
```

**请求参数:**
```json
{
  "renewal_id": "string",
  "assessor_id": "string",
  "assessor_notes": "string",
  "operator_role": "assessor"
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

**责任划分:**
- 评估师审核通过后，责任转移到财务
- 系统记录评估师的审核意见和时间
- 状态转换为待财务审核

### 1.4 评估师审核拒绝
```
POST /api/renewal/assessor-reject
```

**请求参数:**
```json
{
  "renewal_id": "string",
  "assessor_id": "string",
  "reject_reason": "string",
  "operator_role": "assessor"
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

### 1.5 财务审核通过
```
POST /api/renewal/finance-approve
```

**请求参数:**
```json
{
  "renewal_id": "string",
  "finance_id": "string",
  "finance_notes": "string",
  "fee_calculation_id": "string",
  "operator_role": "finance"
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
  "updated_at": "2024-06-14T10:15:00Z"
}
```

**责任划分:**
- 财务审核通过后，关联费用计算记录
- 典当品状态更新为 `renewal_approved`
- 典当品到期日期更新为新到期日期
- 责任链记录财务审核完成

## 2. 赎当处理接口

### 2.1 创建赎当申请
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

**状态转换:**
- 典当品状态从 `active`/`overdue`/`renewal_approved` 转换为 `redemption_pending`

### 2.2 提交财务审核
```
POST /api/redemption/submit-finance
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "operator_id": "string",
  "operator_role": "finance"
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

### 2.3 财务完成费用计算
```
POST /api/redemption/finance-complete
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "finance_id": "string",
  "finance_notes": "string",
  "fee_calculation_id": "string",
  "operator_role": "finance"
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
  "current_handler": "warehouse",
  "updated_at": "2024-06-14T10:10:00Z"
}
```

**责任划分:**
- 财务完成费用计算后，责任转移到库管
- 关联费用计算记录
- 状态转换为待库管确认

### 2.4 库管确认物品
```
POST /api/redemption/warehouse-confirm
```

**请求参数:**
```json
{
  "redemption_id": "string",
  "warehouse_id": "string",
  "warehouse_notes": "string",
  "operator_role": "warehouse"
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

**责任划分:**
- 库管确认物品状态和位置
- 责任转移到客户确认环节

### 2.5 客户确认赎当
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

**状态转换:**
- 典当品状态更新为 `redeemed`
- 赎当流程完成

### 2.6 提起争议
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

**责任划分:**
- 典当品状态更新为 `disputed`
- 审计日志记录争议原因和操作人
- 系统生成争议证据报告

## 3. 费用计算接口

### 3.1 计算费用
```
POST /api/fee/calculate
```

**请求参数:**
```json
{
  "pawn_item_id": "string",
  "calculation_date": "2024-06-14",
  "calculator_id": "string",
  "operator_role": "finance"
}
```

**返回结果:**
```json
{
  "calculation_id": "string",
  "pawn_item_id": "string",
  "calculation_date": "2024-06-14",
  "principal": 10000.00,
  "interest_amount": 150.00,
  "service_fee": 100.00,
  "storage_fee": 50.00,
  "penalty_fee": 0.00,
  "total_fee": 300.00,
  "status": "draft",
  "calculator_id": "string",
  "created_at": "2024-06-14T10:00:00Z"
}
```

**费用计算规则:**
- 利息: 本金 × 年利率 ÷ 365 × 天数
- 服务费: 本金 × 1% + (天数-30) × 10元
- 保管费: 评估价值 × 0.01% × 天数
- 滞纳金: 本金 × 5% ÷ 30 × 逾期天数

### 3.2 提交审核
```
POST /api/fee/submit-review
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "operator_id": "string",
  "operator_role": "finance"
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

### 3.3 审核通过
```
POST /api/fee/approve
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "reviewer_id": "string",
  "reviewer_role": "finance|manager",
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

**责任划分:**
- 审核人确认费用计算准确性
- 责任链记录审核完成

### 3.4 提起争议
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

### 3.5 解决争议
```
POST /api/fee/settle-dispute
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "settlement_notes": "string",
  "operator_id": "string",
  "operator_role": "manager"
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

### 3.6 查看费用计算历史
```
GET /api/fee/history/{pawn_item_id}
```

**返回结果:**
```json
[
  {
    "calculation_id": "string",
    "calculation_date": "2024-06-14",
    "total_fee": 300.00,
    "status": "approved",
    "created_at": "2024-06-14T10:00:00Z"
  }
]
```

### 3.7 查看费用计算详情
```
GET /api/fee/details/{calculation_id}
```

**返回结果:**
```json
{
  "calculation": {
    "calculation_id": "string",
    "pawn_item_id": "string",
    "calculation_date": "2024-06-14",
    "principal": 10000.00,
    "interest_amount": 150.00,
    "service_fee": 100.00,
    "storage_fee": 50.00,
    "penalty_fee": 0.00,
    "total_fee": 300.00,
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

### 3.8 重新计算费用
```
POST /api/fee/recalculate
```

**请求参数:**
```json
{
  "calculation_id": "string",
  "new_calculation_date": "2024-06-15",
  "operator_id": "string",
  "operator_role": "finance",
  "reason": "string"
}
```

**返回结果:**
```json
{
  "new_calculation_id": "string",
  "calculation_date": "2024-06-15",
  "total_fee": 310.00,
  "status": "draft",
  "created_at": "2024-06-14T10:25:00Z"
}
```

## 4. 审计日志接口

### 4.1 查询审计日志
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
[
  {
    "id": "string",
    "entity_type": "FeeCalculation",
    "entity_id": "string",
    "action": "CREATE",
    "old_value": null,
    "new_value": "Fee calculation: total=300.00",
    "operator_id": "string",
    "operator_role": "finance",
    "timestamp": "2024-06-14T10:00:00Z",
    "notes": null
  }
]
```

### 4.2 查询状态转换记录
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
[
  {
    "id": "string",
    "entity_type": "PawnItem",
    "entity_id": "string",
    "from_status": "active",
    "to_status": "renewal_pending",
    "triggered_by": "string",
    "trigger_role": "assessor",
    "timestamp": "2024-06-14T10:00:00Z",
    "reason": "Redemption initiated"
  }
]
```

### 4.3 查询责任链
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
[
  {
    "id": "string",
    "pawn_item_id": "string",
    "stage": "fee_calculation",
    "handler_id": "string",
    "handler_role": "finance",
    "start_time": "2024-06-14T10:00:00Z",
    "end_time": "2024-06-14T10:10:00Z",
    "status": "completed",
    "notes": "Fee calculation approved"
  }
]
```

### 4.4 获取实体审计追踪
```
GET /api/audit/trail/{entity_type}/{entity_id}
```

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
      "new_value": "Fee calculation: total=300.00",
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
      "reason": "Submitted for review"
    }
  ]
}
```

### 4.5 获取责任报告
```
GET /api/audit/responsibility-report/{pawn_item_id}
```

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
        "notes": "Initial appraisal"
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
        "notes": "Fee calculation approved"
      }
    ]
  },
  "total_handlers": 2,
  "active_handlers": 0,
  "completed_handlers": 2
}
```

### 4.6 获取争议证据
```
GET /api/audit/dispute-evidence/{entity_type}/{entity_id}
```

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
      "details": "Interest calculation appears incorrect"
    }
  ],
  "timeline": [...]
}
```

### 4.7 导出审计日志
```
GET /api/audit/export
```

**查询参数:**
- `start_date`: 开始日期 (可选)
- `end_date`: 结束日期 (可选)
- `entity_type`: 实体类型 (可选)

**返回结果:**
```json
[
  {
    "id": "string",
    "entity_type": "string",
    "entity_id": "string",
    "action": "string",
    "old_value": "string",
    "new_value": "string",
    "operator_id": "string",
    "operator_role": "string",
    "timestamp": "string",
    "notes": "string"
  }
]
```

### 4.8 获取统计数据
```
GET /api/audit/statistics
```

**查询参数:**
- `start_date`: 开始日期 (可选)
- `end_date`: 结束日期 (可选)

**返回结果:**
```json
{
  "total_operations": 100,
  "total_transitions": 50,
  "action_breakdown": {
    "CREATE": 30,
    "APPROVE": 20,
    "DISPUTE": 5
  },
  "operator_breakdown": {
    "user_001": 40,
    "user_002": 30
  },
  "role_breakdown": {
    "assessor": 30,
    "finance": 50,
    "warehouse": 20
  },
  "status_transition_breakdown": {
    "draft -> pending_review": 20,
    "pending_review -> approved": 15
  },
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-06-14"
  }
}
```

## 5. 状态约束说明

### 5.1 典当品状态转换规则
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

### 5.2 续当记录状态转换规则
```
draft -> pending_assessor
pending_assessor -> pending_finance | rejected
pending_finance -> approved | rejected
approved -> cancelled
rejected -> draft | cancelled
```

### 5.3 赎当记录状态转换规则
```
draft -> pending_finance
pending_finance -> pending_warehouse | disputed
pending_warehouse -> pending_customer | disputed
pending_customer -> completed | disputed
completed -> (终态)
disputed -> pending_finance | cancelled
```

### 5.4 费用计算状态转换规则
```
draft -> pending_review
pending_review -> approved | disputed
approved -> settled
disputed -> pending_review | settled
```

## 6. 责任划分说明

### 6.1 责任阶段
- **appraisal**: 评估师负责典当品评估
- **warehouse_custody**: 库管负责典当品保管
- **fee_calculation**: 财务负责费用计算
- **renewal_processing**: 续当处理责任
- **redemption_processing**: 赎当处理责任
- **settlement**: 结算责任

### 6.2 责任转移规则
1. 每个操作都会记录责任链
2. 责任转移时必须明确交接人
3. 责任链记录开始时间和结束时间
4. 争议状态下责任链暂停

### 6.3 状态一致性保证
1. 典当品状态与续当/赎当状态联动
2. 费用计算状态与续当/赎当状态关联
3. 所有状态转换必须符合约束规则
4. 状态转换记录在审计日志中