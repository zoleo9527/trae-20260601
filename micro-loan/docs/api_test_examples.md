# API 测试示例

## 1. 客户经理操作流程

### 1.1 创建借款申请
```bash
curl -X POST http://localhost:8080/api/v1/customer-manager/loans \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "C001",
    "customer_name": "张三",
    "loan_amount": 50000,
    "loan_term": 12,
    "interest_rate": 0.02,
    "operator_id": "M001",
    "operator_role": "customer_manager"
  }'
```

### 1.2 上传身份证资料
```bash
curl -X POST http://localhost:8080/api/v1/customer-manager/documents \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "document_type": "id_card",
    "document_url": "https://example.com/docs/id_card_001.jpg",
    "operator_id": "M001",
    "operator_role": "customer_manager"
  }'
```

### 1.3 上传收入证明
```bash
curl -X POST http://localhost:8080/api/v1/customer-manager/documents \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "document_type": "income_proof",
    "document_url": "https://example.com/docs/income_001.jpg",
    "operator_id": "M001",
    "operator_role": "customer_manager"
  }'
```

### 1.4 查看已上传的资料
```bash
curl -X GET http://localhost:8080/api/v1/customer-manager/documents/loan/1
```

### 1.5 幂等提交资料（所有资料收集完成后）
```bash
curl -X POST http://localhost:8080/api/v1/customer-manager/documents/submit \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "operator_id": "M001",
    "operator_role": "customer_manager"
  }'
```

## 2. 风控审核操作流程

### 2.1 查看待审核的借款申请
```bash
curl -X GET "http://localhost:8080/api/v1/risk-auditor/loans?page=1&page_size=10&status=risk_auditing"
```

### 2.2 查看借款申请详情
```bash
curl -X GET http://localhost:8080/api/v1/risk-auditor/loans/1/details
```

### 2.3 审核身份证资料（发现造假）
```bash
curl -X POST http://localhost:8080/api/v1/risk-auditor/documents/review \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": 1,
    "is_forged": true,
    "forgery_reason": "身份证照片存在PS痕迹",
    "audit_status": "forged",
    "remark": "发现造假",
    "auditor_id": "R001",
    "auditor_role": "risk_auditor"
  }'
```

### 2.4 创建风控审核记录
```bash
curl -X POST http://localhost:8080/api/v1/risk-auditor/risk-audits \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "risk_score": 85.5,
    "risk_conclusion": "发现资料造假，风险较高",
    "risk_suggestion": "建议拒绝",
    "is_forgery": true,
    "forgery_description": "身份证造假",
    "remark": "审核不通过",
    "auditor_id": "R001",
    "operator_role": "risk_auditor"
  }'
```

### 2.5 更新借款状态为拒绝
```bash
curl -X PUT http://localhost:8080/api/v1/risk-auditor/loans/status \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": 1,
    "to_status": "rejected",
    "operator_id": "R001",
    "operator_role": "risk_auditor",
    "remark": "资料造假，审核拒绝"
  }'
```

## 3. 贷后专员操作流程

### 3.1 查看已放款的借款
```bash
curl -X GET "http://localhost:8080/api/v1/post-loan-officer/loans?page=1&page_size=10&status=disbursed"
```

### 3.2 查看已逾期的借款
```bash
curl -X GET "http://localhost:8080/api/v1/post-loan-officer/loans?page=1&page_size=10&status=overdue"
```

### 3.3 创建催收记录
```bash
curl -X POST http://localhost:8080/api/v1/post-loan-officer/collections \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "collection_method": "电话催收",
    "collection_result": "客户承诺3天内还款",
    "remark": "客户态度良好",
    "officer_id": "P001",
    "operator_role": "post_loan_officer"
  }'
```

### 3.4 申请展期
```bash
curl -X POST http://localhost:8080/api/v1/post-loan-officer/extensions \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "extension_reason": "客户资金周转困难",
    "extension_amount": 5000,
    "extension_rate": 0.025,
    "new_due_date": "2025-12-31",
    "applicant_id": "P001",
    "operator_role": "post_loan_officer"
  }'
```

### 3.5 审批展期
```bash
curl -X PUT http://localhost:8080/api/v1/post-loan-officer/extensions/approve \
  -H "Content-Type: application/json" \
  -d '{
    "extension_id": 1,
    "approved": true,
    "approved_by_id": "P002",
    "remark": "批准展期",
    "operator_role": "post_loan_officer"
  }'
```

### 3.6 检查逾期提醒
```bash
curl -X POST http://localhost:8080/api/v1/post-loan-officer/overdue-check \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "officer_id": "P001",
    "operator_role": "post_loan_officer"
  }'
```

## 4. 预警管理

### 4.1 查看所有待处理的预警
```bash
curl -X GET http://localhost:8080/api/v1/post-loan-officer/warnings/pending
```

### 4.2 查看资料造假预警
```bash
curl -X GET http://localhost:8080/api/v1/post-loan-officer/warnings/type/forgery
```

### 4.3 查看逾期提醒失效预警
```bash
curl -X GET http://localhost:8080/api/v1/post-loan-officer/warnings/type/overdue_remind
```

### 4.4 查看展期口径不统一预警
```bash
curl -X GET http://localhost:8080/api/v1/post-loan-officer/warnings/type/extension
```

### 4.5 处理预警
```bash
curl -X POST http://localhost:8080/api/v1/post-loan-officer/warnings/handle \
  -H "Content-Type: application/json" \
  -d '{
    "warning_id": 1,
    "status": "resolved",
    "handler_id": "P001",
    "operator_role": "post_loan_officer",
    "remark": "已联系客户确认，资料真实有效"
  }'
```

## 5. 审计日志

### 5.1 查看所有审计日志
```bash
curl -X GET "http://localhost:8080/api/v1/audit-logs?page=1&page_size=10"
```

### 5.2 查看特定操作的审计日志
```bash
curl -X GET "http://localhost:8080/api/v1/audit-logs?operation_type=CREATE_LOAN"
```

### 5.3 查看特定人员的审计日志
```bash
curl -X GET "http://localhost:8080/api/v1/audit-logs?operator_id=M001"
```

### 5.4 查看借款申请的操作历史
```bash
curl -X GET http://localhost:8080/api/v1/audit-logs/loan/1
```

## 6. 健康检查

```bash
curl -X GET http://localhost:8080/health
```

## 响应示例

### 成功响应
```json
{
  "message": "操作成功",
  "data": {
    // 实际数据
  }
}
```

### 分页响应
```json
{
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 10
  }
}
```

### 错误响应
```json
{
  "error": "错误信息"
}
```
