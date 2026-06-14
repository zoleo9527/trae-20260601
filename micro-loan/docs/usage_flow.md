# 小贷公司借款申请与资料收集系统 - 使用流程

## 系统使用流程

本系统按照一线同事的实际工作顺序设计，确保业务流程顺畅自然。

---

## 第一阶段：客户经理操作

### Step 1: 发起借款申请
**操作**: 创建新的借款申请

**触发条件**: 客户提出借款需求

**操作说明**:
1. 客户经理登录系统
2. 录入客户基本信息
3. 录入借款需求（金额、期限、利率）
4. 系统自动分配申请编号

**API调用**:
```bash
POST /api/v1/customer-manager/loans
```

**数据流向**:
- 借款申请创建成功
- 状态自动变为 `collecting`（资料收集中）
- 当前责任人设置为客户经理

---

### Step 2: 收集客户资料
**操作**: 上传客户资料

**触发条件**: 借款申请创建后

**操作说明**:
1. 客户经理收集客户资料
2. 上传身份证、收入证明等资料
3. 系统自动记录上传时间和上传人
4. 可以随时查看已上传的资料

**需要收集的资料**:
- [ ] 身份证
- [ ] 收入证明
- [ ] 银行流水
- [ ] 征信报告
- [ ] 其他辅助资料

**API调用**:
```bash
POST /api/v1/customer-manager/documents
```

**查询已上传资料**:
```bash
GET /api/v1/customer-manager/documents/loan/{loan_id}
```

**数据流向**:
- 资料上传成功
- 资料状态为 `pending`（待审核）
- 客户经理可以查看所有已上传的资料

---

### Step 3: 幂等提交资料
**操作**: 提交资料进行审核

**触发条件**: 所有资料收集完成

**操作说明**:
1. 客户经理确认所有资料已收集
2. 一键提交资料
3. 系统检查是否有造假资料
4. 如有造假，自动阻止提交
5. 如无问题，状态自动流转到风控审核

**重要特性**: **幂等提交**
- 防止重复提交
- 如果资料都已审核完成，提示无需重复提交
- 确保业务流程的可靠性

**API调用**:
```bash
POST /api/v1/customer-manager/documents/submit
```

**数据流向**:
- 提交成功后
- 借款申请状态变为 `risk_auditing`（风控审核中）
- 当前责任人转移给风控审核人员
- 客户经理可以通过查询了解审核进度

**注意事项**:
- ❌ 有造假资料时无法提交
- ❌ 有待审核资料时无法提交
- ✅ 只有所有资料审核通过后才能提交

---

## 第二阶段：风控审核操作

### Step 4: 审核借款申请
**操作**: 风控人员开始审核

**触发条件**: 收到借款申请

**操作说明**:
1. 风控审核登录系统
2. 查看待审核的借款申请列表
3. 查看借款申请详情和客户资料
4. 逐一审核每份资料

**API调用**:
```bash
GET /api/v1/risk-auditor/loans?status=risk_auditing
GET /api/v1/risk-auditor/loans/{id}/details
```

---

### Step 5: 审核客户资料
**操作**: 审核每份上传的资料

**触发条件**: 查看资料时

**操作说明**:
1. 查看资料原件或电子版
2. 判断资料真实性
3. 如果发现造假，标记并说明原因

**资料状态**:
- `pending`: 待审核
- `approved`: 审核通过
- `rejected`: 审核拒绝
- `forged`: 造假

**标记造假**:
```bash
POST /api/v1/risk-auditor/documents/review
{
  "document_id": 1,
  "is_forged": true,
  "forgery_reason": "身份证照片存在PS痕迹",
  "audit_status": "forged",
  "auditor_id": "R001"
}
```

**⚠️ 重要**: 标记造假会自动触发预警！

**数据流向**:
- 造假资料标记后
- 系统自动创建 `forgery` 类型预警
- 预警记录进入待处理队列
- 风控审核继续审核其他资料

---

### Step 6: 创建风控审核记录
**操作**: 完成风控评分和结论

**触发条件**: 所有资料审核完成

**操作说明**:
1. 根据资料审核情况
2. 给出风控评分（0-100）
3. 撰写风控结论
4. 提出风控建议
5. 决定是否发现造假

**API调用**:
```bash
POST /api/v1/risk-auditor/risk-audits
{
  "loan_application_id": 1,
  "risk_score": 85.5,
  "risk_conclusion": "风险可控，建议通过",
  "risk_suggestion": "可适当提高额度",
  "is_forgery": false,
  "auditor_id": "R001"
}
```

**数据流向**:
- 风控审核记录保存
- 如果发现造假，会创建预警

---

### Step 7: 更新借款状态
**操作**: 给出最终审核结果

**触发条件**: 风控审核完成

**操作说明**:
1. 根据风控评分和结论
2. 决定通过或拒绝
3. 更新借款申请状态
4. 添加审核意见

**通过**:
```bash
PUT /api/v1/risk-auditor/loans/status
{
  "loan_id": 1,
  "to_status": "approved",
  "operator_id": "R001",
  "remark": "风控审核通过"
}
```

**拒绝**:
```bash
PUT /api/v1/risk-auditor/loans/status
{
  "loan_id": 1,
  "to_status": "rejected",
  "operator_id": "R001",
  "remark": "资料造假，审核拒绝"
}
```

**数据流向**:
- 状态更新后
- 自动记录状态变更历史
- 自动记录审计日志
- 流程结束或进入下一阶段

---

## 第三阶段：贷后管理操作

### Step 8: 放款后监控
**操作**: 监控已放款借款

**触发条件**: 借款已放款

**操作说明**:
1. 贷后专员定期查看已放款借款
2. 监控到期日期
3. 关注逾期情况

**API调用**:
```bash
GET /api/v1/post-loan-officer/loans?status=disbursed
```

---

### Step 9: 处理逾期
**操作**: 管理逾期借款

**触发条件**: 借款到期未还

**操作说明**:
1. 系统自动检测逾期（到期日期早于当前日期）
2. 贷后专员更新状态为逾期
3. 开始催收流程

**更新状态**:
```bash
PUT /api/v1/post-loan-officer/loans/status
{
  "loan_id": 1,
  "to_status": "overdue",
  "operator_id": "P001",
  "remark": "借款逾期"
}
```

---

### Step 10: 创建催收记录
**操作**: 记录催收情况

**触发条件**: 进行催收时

**操作说明**:
1. 记录催收方式（电话、上门等）
2. 记录催收时间
3. 记录催收结果
4. 记录备注信息

**API调用**:
```bash
POST /api/v1/post-loan-officer/collections
{
  "loan_application_id": 1,
  "collection_method": "电话催收",
  "collection_result": "客户承诺3天内还款",
  "officer_id": "P001"
}
```

---

### Step 11: 逾期提醒失效检测
**操作**: 检查逾期提醒是否失效

**触发条件**: 定期检查

**操作说明**:
1. 贷后专员主动发起检查
2. 系统检测是否逾期超过24小时
3. 检测是否48小时未催收
4. 如有问题，自动创建预警

**API调用**:
```bash
POST /api/v1/post-loan-officer/overdue-check
{
  "loan_application_id": 1,
  "officer_id": "P001"
}
```

**⚠️ 重要**: 逾期提醒失效会自动触发预警！

---

### Step 12: 管理展期
**操作**: 处理展期申请

**触发条件**: 客户申请展期

**操作说明**:
1. 客户或贷后专员发起展期申请
2. 填写展期原因、新到期日期等
3. 系统检测是否与历史展期一致
4. 审批展期申请

**申请展期**:
```bash
POST /api/v1/post-loan-officer/extensions
{
  "loan_application_id": 1,
  "extension_reason": "客户资金周转困难",
  "new_due_date": "2025-12-31",
  "applicant_id": "P001"
}
```

**⚠️ 重要**: 展期口径不统一会自动触发预警！

**审批展期**:
```bash
PUT /api/v1/post-loan-officer/extensions/approve
{
  "extension_id": 1,
  "approved": true,
  "approved_by_id": "P002"
}
```

---

## 第四阶段：预警管理

### 预警处理流程

#### 查看待处理预警
```bash
GET /api/v1/post-loan-officer/warnings/pending
```

#### 按类型查看预警
```bash
# 资料造假预警
GET /api/v1/post-loan-officer/warnings/type/forgery

# 逾期提醒失效预警
GET /api/v1/post-loan-officer/warnings/type/overdue_remind

# 展期口径不统一预警
GET /api/v1/post-loan-officer/warnings/type/extension
```

#### 处理预警
```bash
POST /api/v1/post-loan-officer/warnings/handle
{
  "warning_id": 1,
  "status": "resolved",
  "handler_id": "P001",
  "remark": "已核实，资料真实有效"
}
```

---

## 第五阶段：审计追踪

### 查看操作历史

#### 查看借款申请的所有操作
```bash
GET /api/v1/audit-logs/loan/{loan_id}
```

#### 查看特定人员的操作
```bash
GET /api/v1/audit-logs?operator_id=M001
```

#### 查看特定类型的操作
```bash
GET /api/v1/audit-logs?operation_type=CREATE_LOAN
```

---

## 状态流转总结

```
客户经理                    风控审核                  贷后专员
  │                          │                        │
  ├─ Create Loan ────────────>│                        │
  │                          │                        │
  ├─ Upload Documents ───────>│                        │
  │                          │                        │
  ├─ Idempotent Submit ─────>│                        │
  │                          │                        │
  │                     Review Documents              │
  │                     Create Risk Audit              │
  │                     Update Status                  │
  │                          │                        │
  │                     (Approved/Rejected)           │
  │                          │                        │
  │                          │              Monitor Disbursed
  │                          │              Update to Overdue
  │                          │              Create Collection
  │                          │              Overdue Check
  │                          │              Extension Apply
  │                          │              Handle Warnings
  │                          │                        │
```

---

## 关键特性

### 1. 幂等性
- 资料提交支持幂等操作
- 防止重复提交
- 确保数据一致性

### 2. 自动预警
- 资料造假：自动预警
- 逾期提醒失效：自动预警
- 展期口径不统一：自动预警

### 3. 数据追溯
- 状态变化完整记录
- 操作日志完整保留
- 支持审计和回溯

### 4. 角色隔离
- 客户经理入口
- 风控审核入口
- 贷后专员入口
- 职责清晰

### 5. 自然衔接
- 借款申请完成后，资料收集自然接上
- 无需额外消息提醒
- 系统自动推进流程
