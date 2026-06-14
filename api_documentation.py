"""
典当行续当赎当与费用计算系统 - API接口文档（Python注释形式）
与实际路由完全一致的接口说明
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
- 操作员创建续当申请，系统自动结束上一活跃责任人，创建续当处理责任链
- 典当品状态从 active/overdue 转换为 renewal_pending
- 续当记录 current_handler 设置为 ASSESSOR
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

**责任划分:**
- 系统自动结束上一活跃责任人，创建评估师审核责任链
- 续当记录状态从 draft 转换为 pending_assessor
- 续当记录 current_handler 设置为 ASSESSOR

### 1.3 评估师审核通过
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

**责任划分:**
- 系统自动结束上一活跃责任人，创建费用计算责任链（记在 finance 名下）
- 续当记录状态从 pending_assessor 转换为 pending_finance
- 续当记录 current_handler 设置为 FINANCE
- 典当品状态保持 renewal_pending

### 1.4 评估师审核拒绝
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

**责任划分:**
- 系统自动结束上一活跃责任人
- 续当记录状态转换为 rejected
- 典当品状态回到 active

### 1.5 财务审核通过
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

**责任划分:**
- 系统自动结束上一活跃责任人（费用计算责任链）
- 自动计算续当费用，费用计算审批不创建结算责任链
- 续当费用回写到 renewal_fee
- 续当记录状态转换为 approved
- 典当品状态转换为 renewal_approved
- 典当品到期日期更新为新到期日期
- 创建结算责任链

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

**责任划分:**
- 操作员创建赎当申请，系统自动结束上一活跃责任人，创建赎当处理责任链
- 典当品状态从 active/overdue/renewal_approved 转换为 redemption_pending
- 赎当记录 current_handler 设置为 FINANCE

### 2.2 提交财务审核
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

**责任划分:**
- 系统自动结束上一活跃责任人，创建赎当处理责任链
- 赎当记录状态从 draft 转换为 pending_finance
- 赎当记录 current_handler 设置为 FINANCE

### 2.3 财务完成费用计算
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

**责任划分:**
- 系统自动结束上一活跃责任人（赎当处理责任链）
- 自动计算赎当费用，费用计算审批不创建结算责任链
- 赎当总金额 = 本金(loan_amount) + 利息 + 服务费 + 保管费 + 滞纳金
- 赎当总金额回写到 total_amount
- 赎当记录状态从 pending_finance 转换为 pending_warehouse
- 赎当记录 current_handler 设置为 WAREHOUSE
- 创建赎当处理责任链（费用计算完成）

### 2.4 库管确认物品
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

**责任划分:**
- 系统自动结束上一活跃责任人，创建库管保管责任链
- 赎当记录状态从 pending_warehouse 转换为 pending_customer
- 赎当记录 current_handler 设置为 WAREHOUSE
- 典当品状态保持 redemption_pending

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

**责任划分:**
- 系统自动结束上一活跃责任人，创建结算责任链
- 赎当记录状态转换为 completed
- 典当品状态转换为 redeemed

### 2.6 提起赎当争议
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
- 赎当记录状态转换为 disputed
- 典当品状态转换为 disputed
- 责任链暂停，等待争议解决

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

**责任划分:**
- 创建费用计算责任链（active）

### 3.2 提交审核
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

### 3.3 审核通过
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

**责任划分:**
- 系统自动结束上一活跃责任人（费用计算责任链）
- 创建结算责任链（可选，默认创建）
- 费用计算状态从 pending_review 转换为 approved

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

**状态迁移:**
- 费用计算状态转换为 disputed

### 3.5 解决争议
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

**责任划分:**
- 系统自动结束上一活跃责任人，创建结算责任链
- 费用计算状态转换为 settled

### 3.6 查看费用计算历史
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

### 3.7 查看费用计算详情
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
      "end_time": "2024-06-14T10:10:00Z",
      "status": "completed"
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

### 4.4 获取实体审计追踪
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

### 4.5 获取责任报告
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
  "completed_handlers": 2,
  "current_active_handlers": []
}
```

**责任报告说明:**
- `current_active_handlers`: 只返回当前活跃的处理人，确保责任报告不会残留多条 active 处理人
- `active_handlers`: 当前活跃的责任链数量（应该为 0 或 1）
- `completed_handlers`: 已完成的责任链数量

### 4.6 获取争议证据
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

## 5. 责任链收口机制说明

### 5.1 续当流程责任链收口
1. 创建续当申请：结束上一活跃责任人，创建续当处理责任链
2. 提交评估师审核：结束上一活跃责任人，创建评估师审核责任链
3. 评估师审核通过：结束上一活跃责任人，创建费用计算责任链（记在 finance 名下）
4. 财务审核通过：
   - 结束上一活跃责任人（费用计算责任链）
   - 自动计算续当费用，费用计算审批不创建结算责任链
   - 创建结算责任链

### 5.2 赎当流程责任链收口
1. 创建赎当申请：结束上一活跃责任人，创建赎当处理责任链
2. 提交财务审核：结束上一活跃责任人，创建赎当处理责任链
3. 财务完成费用计算：
   - 结束上一活跃责任人（赎当处理责任链）
   - 自动计算赎当费用，费用计算审批不创建结算责任链
   - 创建赎当处理责任链（费用计算完成）
4. 库管确认物品：结束上一活跃责任人，创建库管保管责任链
5. 客户确认赎当：结束上一活跃责任人，创建结算责任链

### 5.3 费用计算审批责任链收口
- 费用计算审批时，默认创建结算责任链
- 在续当和赎当流程中，费用计算审批不创建结算责任链（create_settlement_chain=False）
- 由后续业务节点统一创建结算责任链，避免责任链重复

## 6. current_handler 与 PawnItem 状态联动说明

### 6.1 续当流程
- 创建续当申请：current_handler = ASSESSOR，PawnItem.status = renewal_pending
- 提交评估师审核：current_handler = ASSESSOR，PawnItem.status = renewal_pending
- 评估师审核通过：current_handler = FINANCE，PawnItem.status = renewal_pending
- 财务审核通过：续当记录状态 = approved，PawnItem.status = renewal_approved

### 6.2 赎当流程
- 创建赎当申请：current_handler = FINANCE，PawnItem.status = redemption_pending
- 提交财务审核：current_handler = FINANCE，PawnItem.status = redemption_pending
- 财务完成费用计算：current_handler = WAREHOUSE，PawnItem.status = redemption_pending
- 库管确认物品：current_handler = WAREHOUSE，PawnItem.status = redemption_pending
- 客户确认赎当：赎当记录状态 = completed，PawnItem.status = redeemed

## 7. 费用计算结果回写说明

### 7.1 续当费用回写
- 财务审核通过续当申请时，费用计算结果自动回写到 `renewal_fee`
- 续当费用 = 利息 + 服务费 + 保管费 + 滞纳金
- 审计日志记录回写操作

### 7.2 赎当费用回写
- 财务完成赎当费用计算时，赎当总金额自动回写到 `total_amount`
- 赎当总金额 = 本金(loan_amount) + 利息 + 服务费 + 保管费 + 滞纳金
- 审计日志记录回写操作，包含本金和费用明细