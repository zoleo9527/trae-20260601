# 小贷公司借款申请与资料收集系统

## 系统概述

本系统是专为小贷公司设计的后端API服务，按照一线同事的实际处理顺序组织业务流程。系统支持三个独立的角色入口：客户经理、风控审核和贷后专员。

## 核心功能

### 1. 预警系统（提前标出）
- **资料造假预警**：风控审核时标记，自动触发预警
- **逾期提醒失效预警**：贷后专员监控逾期借款，超过48小时未催收自动预警
- **展期口径不统一预警**：系统自动检测历史展期与新申请的到期日期不一致

### 2. 业务流程（按一线同事处理顺序）

#### 客户经理入口
1. 发起借款申请
2. 收集客户资料（身份证、收入证明、银行流水等）
3. 幂等提交资料（防止重复提交）
4. 追踪申请进度

#### 风控审核入口
1. 审核借款申请
2. 审核风控资料
3. 标记资料造假（触发预警）
4. 风控评分和结论

#### 贷后专员入口
1. 监控借款状态
2. 处理逾期催收
3. 管理展期申请（展期口径不统一预警）
4. 记录催收情况

## 数据库模型

### 借款申请（LoanApplication）
- `id`: 主键
- `application_no`: 申请编号（唯一）
- `customer_id`: 客户ID
- `customer_name`: 客户姓名
- `loan_amount`: 借款金额
- `loan_term`: 借款期限（月）
- `interest_rate`: 利率（月）
- `status`: 当前状态
- `status_updated_at`: 状态更新时间
- `current_handler`: 当前责任人
- `disbursed_at`: 放款时间
- `due_date`: 到期日期
- `remark`: 备注
- `created_by`: 创建人
- `updated_by`: 更新人

### 资料收集（DocumentCollection）
- `id`: 主键
- `loan_application_id`: 借款申请ID
- `document_type`: 资料类型（id_card/income_proof/bank_statement/credit_report/other）
- `document_url`: 资料URL
- `upload_time`: 上传时间
- `uploaded_by`: 上传人
- `is_forged`: 是否造假
- `forgery_reason`: 造假说明
- `audit_status`: 审核状态（pending/approved/rejected/forged）
- `audited_by`: 审核人
- `audited_at`: 审核时间
- `remark`: 备注

### 风控审核（RiskAudit）
- `id`: 主键
- `loan_application_id`: 借款申请ID
- `risk_score`: 风控评分
- `risk_conclusion`: 风控结论
- `risk_suggestion`: 风控建议
- `auditor_id`: 审核人ID
- `audit_time`: 审核时间
- `is_forgery`: 是否发现造假
- `forgery_description`: 造假说明
- `remark`: 备注

### 催收记录（CollectionRecord）
- `id`: 主键
- `loan_application_id`: 借款申请ID
- `collection_method`: 催收方式
- `collection_time`: 催收时间
- `collection_officer_id`: 催收人员ID
- `collection_result`: 催收结果
- `remark`: 备注

### 展期记录（ExtensionRecord）
- `id`: 主键
- `loan_application_id`: 借款申请ID
- `extension_reason`: 展期原因
- `original_due_date`: 原到期日期
- `new_due_date`: 新到期日期
- `extension_amount`: 展期金额
- `extension_rate`: 展期利率
- `applicant_id`: 申请人
- `approval_status`: 审批状态
- `approved_by`: 审批人
- `approved_at`: 审批时间
- `remark`: 备注

### 预警记录（WarningRecord）
- `id`: 主键
- `loan_application_id`: 借款申请ID
- `warning_type`: 预警类型（forgery/overdue_remind/extension）
- `warning_content`: 预警内容
- `warning_time`: 预警时间
- `status`: 处理状态（pending/processing/resolved/ignored）
- `handler_id`: 处理人
- `handled_at`: 处理时间
- `remark`: 备注

### 审计日志（AuditLog）
- `id`: 主键
- `operation_type`: 操作类型
- `operator_id`: 操作人ID
- `operator_role`: 操作人角色
- `loan_application_id`: 关联借款申请ID
- `operation_desc`: 操作描述
- `before_data`: 操作前数据（JSON）
- `after_data`: 操作后数据（JSON）
- `ip_address`: IP地址
- `user_agent`: 用户代理
- `created_at`: 创建时间

### 状态历史（StatusHistory）
- `id`: 主键
- `loan_application_id`: 借款申请ID
- `from_status`: 原状态
- `to_status`: 新状态
- `changed_by`: 变更人
- `changed_at`: 变更时间
- `remark`: 备注

## API接口文档

### 客户经理入口 `/api/v1/customer-manager`

#### 创建借款申请
- **POST** `/api/v1/customer-manager/loans`
- **Body**:
```json
{
  "customer_id": "C001",
  "customer_name": "张三",
  "loan_amount": 50000,
  "loan_term": 12,
  "interest_rate": 0.02,
  "operator_id": "M001",
  "operator_role": "customer_manager"
}
```

#### 查询借款申请
- **GET** `/api/v1/customer-manager/loans/:id`

#### 查询借款申请详情（含所有关联数据）
- **GET** `/api/v1/customer-manager/loans/:id/details`

#### 列出借款申请
- **GET** `/api/v1/customer-manager/loans?page=1&page_size=10&status=collecting&handler=M001`

#### 更新借款状态
- **PUT** `/api/v1/customer-manager/loans/status`
- **Body**:
```json
{
  "loan_id": 1,
  "to_status": "risk_auditing",
  "operator_id": "M001",
  "operator_role": "customer_manager",
  "remark": "资料收集完成，提交审核"
}
```

#### 上传资料
- **POST** `/api/v1/customer-manager/documents`
- **Body**:
```json
{
  "loan_application_id": 1,
  "document_type": "id_card",
  "document_url": "https://example.com/doc/123.jpg",
  "operator_id": "M001",
  "operator_role": "customer_manager"
}
```

#### 查询资料
- **GET** `/api/v1/customer-manager/documents/:id`
- **GET** `/api/v1/customer-manager/documents/loan/:loan_id`

#### 幂等提交资料
- **POST** `/api/v1/customer-manager/documents/submit`
- **Body**:
```json
{
  "loan_application_id": 1,
  "operator_id": "M001",
  "operator_role": "customer_manager",
  "remark": "资料收集完成，转入风控审核"
}
```
- **说明**: 资料提交后，`current_handler` 将设置为 `RISK_AUDITING_NODE`，表示已转交风控审核节点。审计日志会记录责任人从客户经理转到风控节点的完整信息。

### 风控审核入口 `/api/v1/risk-auditor`

#### 查询借款申请
- **GET** `/api/v1/risk-auditor/loans/:id`
- **GET** `/api/v1/risk-auditor/loans/:id/details`
- **GET** `/api/v1/risk-auditor/loans?page=1&page_size=10&status=risk_auditing`

#### 创建风控审核
- **POST** `/api/v1/risk-auditor/risk-audits`
- **Body**:
```json
{
  "loan_application_id": 1,
  "risk_score": 85.5,
  "risk_conclusion": "风险可控，建议通过",
  "risk_suggestion": "可适当提高额度",
  "is_forgery": false,
  "forgery_description": "",
  "remark": "审核通过",
  "auditor_id": "R001",
  "operator_role": "risk_auditor"
}
```

#### 查询风控审核记录
- **GET** `/api/v1/risk-auditor/risk-audits/loan/:loan_id`
- **GET** `/api/v1/risk-auditor/risk-audits/loan/:loan_id/latest`

#### 更新借款状态（风控审核专用）
- **PUT** `/api/v1/risk-auditor/loans/status`
- **Body**:
```json
{
  "loan_id": 1,
  "to_status": "approved",
  "auditor_id": "R001",
  "auditor_role": "risk_auditor",
  "remark": "风控审核通过",
  "risk_audit_id": 1
}
```
- **说明**: 风控审核完成后更新借款申请状态，支持转换为 `approved`（通过）或 `rejected`（拒绝）。自动记录状态变化、责任人、时间点和备注到借款记录、状态历史和审计日志。

#### 审核资料
- **POST** `/api/v1/risk-auditor/documents/review`
- **Body**:
```json
{
  "document_id": 1,
  "is_forged": true,
  "forgery_reason": "身份证照片存在PS痕迹",
  "audit_status": "forged",
  "remark": "发现造假",
  "auditor_id": "R001",
  "auditor_role": "risk_auditor"
}
```

#### 查询资料
- **GET** `/api/v1/risk-auditor/documents/:id`
- **GET** `/api/v1/risk-auditor/documents/loan/:loan_id`

### 贷后专员入口 `/api/v1/post-loan-officer`

#### 查询借款申请
- **GET** `/api/v1/post-loan-officer/loans/:id`
- **GET** `/api/v1/post-loan-officer/loans/:id/details`
- **GET** `/api/v1/post-loan-officer/loans?page=1&page_size=10&status=overdue`

#### 更新借款状态
- **PUT** `/api/v1/post-loan-officer/loans/status`

#### 创建催收记录
- **POST** `/api/v1/post-loan-officer/collections`
- **Body**:
```json
{
  "loan_application_id": 1,
  "collection_method": "电话催收",
  "collection_result": "客户承诺3天内还款",
  "remark": "",
  "officer_id": "P001",
  "operator_role": "post_loan_officer"
}
```

#### 查询催收记录
- **GET** `/api/v1/post-loan-officer/collections/loan/:loan_id`

#### 申请展期
- **POST** `/api/v1/post-loan-officer/extensions`
- **Body**:
```json
{
  "loan_application_id": 1,
  "extension_reason": "客户资金周转困难",
  "extension_amount": 10000,
  "extension_rate": 0.025,
  "new_due_date": "2025-12-31",
  "applicant_id": "P001",
  "operator_role": "post_loan_officer"
}
```

#### 审批展期
- **PUT** `/api/v1/post-loan-officer/extensions/approve`
- **Body**:
```json
{
  "extension_id": 1,
  "approved": true,
  "approved_by_id": "P002",
  "remark": "批准展期",
  "operator_role": "post_loan_officer"
}
```

#### 查询展期记录
- **GET** `/api/v1/post-loan-officer/extensions/loan/:loan_id`

#### 检查逾期提醒
- **POST** `/api/v1/post-loan-officer/overdue-check`
- **Body**:
```json
{
  "loan_application_id": 1,
  "officer_id": "P001",
  "operator_role": "post_loan_officer"
}
```

#### 处理预警
- **POST** `/api/v1/post-loan-officer/warnings/handle`
- **Body**:
```json
{
  "warning_id": 1,
  "status": "resolved",
  "handler_id": "P001",
  "operator_role": "post_loan_officer",
  "remark": "已联系客户确认"
}
```

#### 查询预警
- **GET** `/api/v1/post-loan-officer/warnings/loan/:loan_id`
- **GET** `/api/v1/post-loan-officer/warnings/pending`
- **GET** `/api/v1/post-loan-officer/warnings/type/:type` (type: forgery/overdue_remind/extension)

### 审计日志 `/api/v1/audit-logs`

#### 列出审计日志
- **GET** `/api/v1/audit-logs?page=1&page_size=10&operator_id=M001&operation_type=CREATE_LOAN`

#### 查询借款申请的审计日志
- **GET** `/api/v1/audit-logs/loan/:loan_id`

### 健康检查

- **GET** `/health`

## 状态流转

```
pending → collecting → risk_auditing → approved → disbursed
                                    ↓
                                  rejected

disbursed → overdue → extension → overdue/settled
           ↓                      ↓
         settled               settled
```

## 角色类型

- `customer_manager`: 客户经理
- `risk_auditor`: 风控审核
- `post_loan_officer`: 贷后专员

## 预警类型

- `forgery`: 资料造假预警
- `overdue_remind`: 逾期提醒失效预警
- `extension`: 展期口径不统一预警

## 运行指南

### 环境要求
- Go 1.21+
- MySQL 5.7+

### 配置环境变量
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=password
export DB_NAME=micro_loan
export SERVER_PORT=8080
```

### 安装依赖
```bash
cd micro-loan
go mod download
```

### 运行服务
```bash
go run cmd/main.go
```

## 数据库字段说明

所有关键字段（状态、责任人、时间点、备注）都已存储在数据库中：

- **状态变化**：通过 `status_history` 表记录每次状态变更
- **责任人**：`current_handler` 字段追踪当前负责人
- **时间点**：`status_updated_at`, `upload_time`, `audit_time` 等字段记录所有关键时间
- **备注**：`remark` 字段支持在每个操作中添加说明

这样的设计确保：
1. 数据可追溯，所有变更都有记录
2. 支持审计和回溯
3. 方便前端展示完整的历史信息
4. 不依赖页面刷新保留数据
