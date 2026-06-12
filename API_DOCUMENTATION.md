# API 接口文档与请求示例

## 基础信息

- **Base URL**: `http://localhost:3000`
- **API 文档**: `http://localhost:3000/api-docs` (Swagger UI)
- **Content-Type**: `application/json`

## 通用请求头

```bash
Content-Type: application/json
X-User-Id: <用户ID>  # 用于记录操作人
```

---

## 1. 申报底稿管理

### 1.1 创建申报底稿

**Endpoint**: `POST /api/drafts`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{
    "projectId": "proj-001",
    "clientId": "client-001",
    "taxPeriod": "2024Q2",
    "taxConsultantId": "tc-001",
    "draftContent": {
      "taxType": "企业所得税",
      "taxableAmount": 6000000,
      "taxAmount": 1500000,
      "applicablePolicies": [
        {
          "id": "pol-new-001",
          "name": "企业所得税法",
          "code": "ECL-2024",
          "effectiveDate": "2024-01-01",
          "description": "企业所得税基本法规"
        }
      ],
      "specialAdjustments": [
        {
          "id": "adj-new-001",
          "type": "decrease",
          "amount": 600000,
          "reason": "研发费用加计扣除",
          "policyBasis": "研发费用加计扣除政策"
        }
      ],
      "riskNotes": "确保研发费用归集符合规定",
      "calculations": [
        {
          "id": "calc-new-001",
          "description": "应纳税所得额",
          "formula": "收入 - 成本 - 费用 - 加计扣除",
          "inputs": {
            "income": 12000000,
            "costs": 4000000,
            "expenses": 2000000,
            "rdDeduction": 600000
          },
          "result": 5400000
        }
      ],
      "conclusions": [
        {
          "id": "conc-new-001",
          "content": "应纳税所得额540万元，适用25%税率",
          "policyBasis": "企业所得税法第四条",
          "confidence": "high"
        }
      ],
      "sourceDocuments": []
    },
    "sourceDocuments": []
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "新生成的记录ID",
    "projectId": "proj-001",
    "clientId": "client-001",
    "taxPeriod": "2024Q2",
    "currentStage": "draft_created",
    "status": "active",
    "draftInfo": {
      "taxConsultantId": "tc-001",
      "draftContent": { ... },
      "createdAt": "2024-06-13T10:00:00.000Z",
      "updatedAt": "2024-06-13T10:00:00.000Z"
    },
    "confirmationInfo": { ... },
    "supplementaryNotes": [],
    "workflowHistory": [
      {
        "eventType": "DRAFT_CREATED",
        "actorId": "tc-001",
        "actorRole": "tax_consultant",
        "timestamp": "2024-06-13T10:00:00.000Z",
        "newStage": "draft_created"
      }
    ],
    "responsibilityTrace": [
      {
        "stage": "draft_created",
        "responsibleRole": "tax_consultant",
        "responsibleUserId": "tc-001",
        "action": "创建申报底稿",
        "timestamp": "2024-06-13T10:00:00.000Z",
        "isComplete": true
      }
    ]
  },
  "message": "申报底稿创建成功"
}
```

### 1.2 获取申报底稿详情

**Endpoint**: `GET /api/drafts/:id`

**请求示例**:

```bash
curl -X GET http://localhost:3000/api/drafts/record-001 \
  -H "X-User-Id: tc-001"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "record-001",
    "projectId": "proj-001",
    "clientId": "client-001",
    "taxPeriod": "2024Q1",
    "currentStage": "returned",
    "status": "pending_revision",
    "draftInfo": { ... },
    "confirmationInfo": { ... },
    "returnInfo": {
      "returnedBy": "cf-001",
      "returnReason": {
        "category": "calculation_error",
        "description": "研发费用归集金额有误",
        "priority": "high"
      },
      "specificIssues": [ ... ],
      "returnedAt": "2024-06-12T00:00:00.000Z",
      "isResponsibilityClear": true
    },
    "supplementaryNotes": [ ... ],
    "workflowHistory": [ ... ],
    "responsibilityTrace": [ ... ]
  }
}
```

### 1.3 更新申报底稿

**Endpoint**: `PUT /api/drafts/:id`

**请求示例**:

```bash
curl -X PUT http://localhost:3000/api/drafts/record-001 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{
    "draftContent": {
      "taxType": "企业所得税",
      "taxableAmount": 5800000,
      "taxAmount": 1450000,
      "applicablePolicies": [ ... ],
      "specialAdjustments": [
        {
          "id": "adj-001",
          "type": "decrease",
          "amount": 700000,
          "reason": "研发费用加计扣除（已补充完整）",
          "policyBasis": "研发费用加计扣除政策"
        }
      ],
      "riskNotes": "已补充研发人员工资明细",
      "calculations": [ ... ],
      "conclusions": [ ... ],
      "sourceDocuments": []
    },
    "sourceDocuments": [
      {
        "id": "doc-new-001",
        "name": "研发人员工资明细表.pdf",
        "type": "salary",
        "url": "/uploads/doc-new-001.pdf",
        "uploadedBy": "tc-001",
        "uploadedAt": "2024-06-13T10:00:00.000Z"
      }
    ]
  }'
```

### 1.4 提交申报底稿

**Endpoint**: `POST /api/drafts/:id/submit`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/drafts/record-001/submit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001"
```

**响应示例**:

```json
{
  "success": true,
  "data": { ... },
  "message": "申报底稿已提交，等待客户确认"
}
```

---

## 2. 客户确认管理

### 2.1 创建客户确认任务

**Endpoint**: `POST /api/confirmations/:recordId`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/confirmations/record-002 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: pm-001" \
  -d '{
    "clientFinanceId": "cf-002",
    "requiredMaterials": [
      {
        "id": "mat-003",
        "name": "增值税专用发票",
        "description": "本期取得的增值税专用发票抵扣联",
        "required": true,
        "source": "client",
        "status": "pending"
      },
      {
        "id": "mat-004",
        "name": "银行回单",
        "description": "本期银行收款回单",
        "required": true,
        "source": "client",
        "status": "pending"
      }
    ],
    "deadline": "2024-06-20T00:00:00.000Z"
  }'
```

### 2.2 获取客户确认详情（同个工作面）

**Endpoint**: `GET /api/confirmations/:recordId`

**核心设计**: 在同一个接口返回：
- 底稿摘要（申报内容、计算过程、结论）
- 确认状态（材料准备、确认进度）
- 退回原因（如有）
- 补充备注（上下文信息）

**请求示例**:

```bash
curl -X GET http://localhost:3000/api/confirmations/record-001 \
  -H "X-User-Id: cf-001"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "recordId": "record-001",
    "taxPeriod": "2024Q1",
    "currentStage": "returned",
    "confirmationInfo": {
      "clientFinanceId": "cf-001",
      "requiredMaterials": [
        {
          "id": "mat-001",
          "name": "银行对账单",
          "status": "provided"
        },
        {
          "id": "mat-002",
          "name": "研发项目立项文件",
          "status": "pending"
        }
      ],
      "confirmationStatus": "returned",
      "deadline": "2024-06-15T00:00:00.000Z"
    },
    "draftSummary": {
      "taxType": "企业所得税",
      "taxableAmount": 5000000,
      "taxAmount": 1250000,
      "conclusions": [
        {
          "content": "本年度应纳税所得额为450万元",
          "confidence": "high"
        }
      ],
      "riskNotes": "注意研发费用归集的完整性"
    },
    "returnInfo": {
      "returnedBy": "cf-001",
      "returnReason": {
        "category": "calculation_error",
        "description": "研发费用归集金额有误"
      },
      "specificIssues": [
        {
          "title": "研发人员工资归集不全",
          "severity": "high"
        }
      ],
      "responsibilityNotes": "研发费用归集属于税务顾问责任"
    },
    "supplementaryNotes": [
      {
        "authorRole": "tax_consultant",
        "content": "已完成研发费用的初步归集",
        "type": "technical"
      },
      {
        "authorRole": "client_finance",
        "content": "请尽快补充材料",
        "type": "client_communication"
      }
    ],
    "responsibilityTrace": [
      {
        "stage": "returned",
        "responsibleRole": "client_finance",
        "action": "退回申报底稿",
        "isComplete": true
      },
      {
        "stage": "revision_in_progress",
        "responsibleRole": "tax_consultant",
        "action": "修订申报底稿",
        "isComplete": false
      }
    ]
  },
  "message": "在同一工作面展示：底稿摘要 + 确认状态 + 退回原因（如有） + 补充备注"
}
```

### 2.3 提供材料

**Endpoint**: `POST /api/confirmations/:recordId/provide-materials`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/confirmations/record-001/provide-materials \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-001" \
  -d '{
    "materials": [
      {
        "id": "mat-002",
        "name": "研发项目立项文件",
        "description": "研发项目立项书和预算文件",
        "required": true,
        "source": "client",
        "status": "provided",
        "providedAt": "2024-06-13T10:00:00.000Z",
        "attachmentUrl": "/uploads/mat-002.pdf"
      }
    ]
  }'
```

### 2.4 确认申报底稿

**Endpoint**: `POST /api/confirmations/:recordId/confirm`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/confirmations/record-002/confirm \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-002" \
  -d '{
    "isApproved": true,
    "approvedItems": [
      "应纳税所得额",
      "税额计算",
      "进项税额抵扣"
    ],
    "concerns": [],
    "clientRepresentative": "赵财务",
    "confirmedAt": "2024-06-13T10:00:00.000Z"
  }'
```

### 2.5 退回申报底稿

**Endpoint**: `POST /api/confirmations/:recordId/return`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/confirmations/record-002/return \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-002" \
  -d '{
    "returnedBy": "cf-002",
    "returnReason": {
      "category": "missing_info",
      "description": "银行回单未提供，无法核实收款情况",
      "priority": "high",
      "relatedSection": "sourceDocuments"
    },
    "specificIssues": [
      {
        "id": "issue-new-001",
        "title": "缺少银行收款回单",
        "description": "2月份的银行收款回单未提供",
        "location": "sourceDocuments",
        "severity": "high"
      }
    ],
    "suggestedFixes": [
      "补充2月份银行收款回单",
      "核对收款金额与发票一致性"
    ],
    "expectedFixDeadline": "2024-06-15T00:00:00.000Z"
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": { ... },
  "message": "申报底稿已退回",
  "responsibilityNote": "退回原因已记录，责任归属明确"
}
```

---

## 3. 待办管理

### 3.1 获取税务顾问待办

**Endpoint**: `GET /api/todos/tax-consultant/:consultantId`

**请求示例**:

```bash
curl -X GET http://localhost:3000/api/todos/tax-consultant/tc-001 \
  -H "X-User-Id: tc-001"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": "todo-001",
        "recordId": "record-001",
        "type": "draft_revision",
        "title": "待修订退回的申报底稿",
        "description": "退回原因: 研发费用归集金额有误",
        "assigneeId": "tc-001",
        "assigneeRole": "tax_consultant",
        "status": "pending",
        "priority": "high",
        "dueDate": "2024-06-14T00:00:00.000Z"
      }
    ],
    "summary": {
      "total": 1,
      "highPriority": 1,
      "mediumPriority": 0,
      "lowPriority": 0
    }
  },
  "message": "税务顾问待办列表"
}
```

### 3.2 获取项目经理待办

**Endpoint**: `GET /api/todos/project-manager/:managerId`

**请求示例**:

```bash
curl -X GET http://localhost:3000/api/todos/project-manager/pm-001 \
  -H "X-User-Id: pm-001"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": "pm-approval-record-001",
        "recordId": "record-001",
        "type": "approval_pending",
        "title": "待审批最终申报",
        "description": "税务期间 2024Q1 的申报已确认",
        "assigneeId": "pm-001",
        "assigneeRole": "project_manager",
        "status": "pending",
        "priority": "medium"
      }
    ],
    "summary": {
      "total": 1,
      "pendingApprovals": 1,
      "overdueHandling": 0
    }
  },
  "message": "项目经理待办列表"
}
```

### 3.3 获取客户财务待办

**Endpoint**: `GET /api/todos/client-finance/:clientId/:financeId`

**请求示例**:

```bash
curl -X GET http://localhost:3000/api/todos/client-finance/client-001/cf-001 \
  -H "X-User-Id: cf-001"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": "todo-002",
        "recordId": "record-001",
        "type": "material_preparation",
        "title": "待准备确认材料",
        "description": "有 1 项必需材料待准备",
        "assigneeId": "cf-001",
        "assigneeRole": "client_finance",
        "status": "pending",
        "priority": "high",
        "dueDate": "2024-06-15T00:00:00.000Z"
      }
    ],
    "summary": {
      "total": 1,
      "pendingConfirmations": 0,
      "pendingMaterials": 1
    }
  },
  "message": "客户财务待办列表"
}
```

### 3.4 标记待办完成

**Endpoint**: `PUT /api/todos/:todoId/complete`

**请求示例**:

```bash
curl -X PUT http://localhost:3000/api/todos/todo-001/complete \
  -H "X-User-Id: tc-001"
```

---

## 4. 统一记录查询

### 4.1 获取完整记录

**Endpoint**: `GET /api/records/:id`

**请求示例**:

```bash
curl -X GET "http://localhost:3000/api/records/record-001?includeInternal=true" \
  -H "X-User-Id: pm-001"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    ...完整记录内容...,
    "notes": [ ...所有备注... ],
    "history": [ ...流程历史... ],
    "responsibilityTrace": [ ...责任追溯... ],
    "responsibilitySummary": {
      "total": 4,
      "completed": 3,
      "pending": 1,
      "byRole": {
        "tax_consultant": 2,
        "project_manager": 0,
        "client_finance": 2
      }
    }
  },
  "message": "完整记录包含：申报底稿 + 客户确认 + 退回原因 + 补充备注"
}
```

### 4.2 查询记录列表

**Endpoint**: `GET /api/records`

**请求示例**:

```bash
curl -X GET "http://localhost:3000/api/records?clientId=client-001&status=pending_revision" \
  -H "X-User-Id: tc-001"
```

### 4.3 添加备注

**Endpoint**: `POST /api/records/:id/notes`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/records/record-001/notes \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{
    "authorId": "tc-001",
    "authorRole": "tax_consultant",
    "content": "已联系客户HR部门获取研发人员工资明细，预计明天提供",
    "type": "technical",
    "relatedTo": "issue-001",
    "isVisibleToClient": true
  }'
```

### 4.4 获取流程历史

**Endpoint**: `GET /api/records/:id/history`

**请求示例**:

```bash
curl -X GET http://localhost:3000/api/records/record-001/history \
  -H "X-User-Id: pm-001"
```

### 4.5 获取责任追溯

**Endpoint**: `GET /api/records/:id/responsibility`

**请求示例**:

```bash
curl -X GET http://localhost:3000/api/records/record-001/responsibility \
  -H "X-User-Id: pm-001"
```

### 4.6 明确责任归属

**Endpoint**: `POST /api/records/:id/responsibility/clarify`

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/records/record-001/responsibility/clarify \
  -H "Content-Type: application/json" \
  -H "X-User-Id: pm-001" \
  -d '{
    "notes": "经核实，研发人员工资明细缺失属于客户方责任，已催促客户提供",
    "clarifiedBy": "pm-001"
  }'
```

---

## 5. 使用流程示例

### 场景1：税务顾问创建并提交申报底稿

```bash
# 1. 创建申报底稿
DRAFT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{ ... }')

# 2. 获取新创建的记录ID
RECORD_ID=$(echo $DRAFT_RESPONSE | jq -r '.data.id')

# 3. 更新底稿内容（如需要）
curl -X PUT "http://localhost:3000/api/drafts/${RECORD_ID}" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{ ... }'

# 4. 提交底稿
curl -X POST "http://localhost:3000/api/drafts/${RECORD_ID}/submit" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001"

# 5. 查看自己的待办
curl -X GET http://localhost:3000/api/todos/tax-consultant/tc-001
```

### 场景2：客户财务确认申报底稿

```bash
# 1. 查看待确认的记录
curl -X GET "http://localhost:3000/api/records?clientId=client-001&status=pending_confirmation"

# 2. 在统一工作面查看详情（底稿 + 材料 + 备注）
curl -X GET http://localhost:3000/api/confirmations/record-001

# 3. 提供所需材料
curl -X POST http://localhost:3000/api/confirmations/record-001/provide-materials \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-001" \
  -d '{ "materials": [ ... ] }'

# 4. 确认或退回
# 确认：
curl -X POST http://localhost:3000/api/confirmations/record-001/confirm \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-001" \
  -d '{ "isApproved": true, "approvedItems": [...], "concerns": [], "clientRepresentative": "陈财务" }'

# 或退回：
curl -X POST http://localhost:3000/api/confirmations/record-001/return \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-001" \
  -d '{ "returnedBy": "cf-001", "returnReason": { ... }, ... }'
```

### 场景3：处理退回的申报底稿

```bash
# 1. 税务顾问查看自己的待办
curl -X GET http://localhost:3000/api/todos/tax-consultant/tc-001

# 2. 获取退回记录的完整信息
curl -X GET http://localhost:3000/api/records/record-001

# 3. 添加技术备注说明处理方案
curl -X POST http://localhost:3000/api/records/record-001/notes \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{ "authorId": "tc-001", "authorRole": "tax_consultant", "content": "处理方案：...", "type": "technical" }'

# 4. 更新申报底稿
curl -X PUT http://localhost:3000/api/drafts/record-001 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{ "draftContent": { ...修正后的内容... } }'

# 5. 重新提交
curl -X POST http://localhost:3000/api/drafts/record-001/submit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001"

# 6. 标记待办完成
curl -X PUT http://localhost:3000/api/todos/todo-001/complete
```
