# 退回后重新提交的状态同步修复

## 问题描述

退回后重新提交时，存在以下断点：

1. **上一条 REVISION_IN_PROGRESS 责任项未完成**
2. **confirmationInfo.confirmationStatus 未从 returned 恢复**
3. **退回信息未移至历史记录，仍显示在客户确认回看界面**
4. **待办生成和责任追溯不一致**

## 解决方案

### 1. 类型定义更新

#### 添加 `isResolved` 字段到 `ReturnInfo`

```typescript
export interface ReturnInfo {
  returnedBy: string;
  returnReason: ReturnReason;
  specificIssues: Issue[];
  suggestedFixes: string[];
  returnedAt: Date;
  expectedFixDeadline: Date;
  isResponsibilityClear: boolean;
  responsibilityNotes?: string;
  isResolved: boolean;           // 新增：标记退回是否已解决
  resolvedAt?: Date;              // 新增：解决时间
  resolvedBy?: string;           // 新增：解决人
}
```

#### 添加历史退回记录 `ReturnHistoryEntry`

```typescript
export interface ReturnHistoryEntry {
  returnInfo: ReturnInfo;
  resubmittedAt: Date;
  resubmittedBy: string;
  notes?: string;
}
```

#### 添加 `returnHistory` 字段到 `WorkflowRecord`

```typescript
export interface WorkflowRecord {
  // ... 其他字段 ...
  returnInfo?: ReturnInfo;           // 当前有效退回信息
  returnHistory: ReturnHistoryEntry[]; // 历史退回记录
  // ... 其他字段 ...
}
```

### 2. DraftService.submitDraft 核心逻辑

```typescript
submitDraft(recordId: string, userId: string): WorkflowRecord {
  const record = getRecordById(recordId);
  const now = new Date();
  const previousStage = record.currentStage;
  const isResubmission = previousStage === WorkflowStage.RETURNED ||
                         previousStage === WorkflowStage.REVISION_IN_PROGRESS;

  // 1. 处理退回信息
  if (isResubmission && record.returnInfo) {
    // 标记当前退回为已解决
    record.returnInfo.isResolved = true;
    record.returnInfo.resolvedAt = now;
    record.returnInfo.resolvedBy = userId;

    // 保存到历史记录
    const historyEntry: ReturnHistoryEntry = {
      returnInfo: { ...record.returnInfo },
      resubmittedAt: now,
      resubmittedBy: userId,
      notes: '重新提交申报底稿'
    };
    record.returnHistory.push(historyEntry);

    // 清除当前退回信息
    record.returnInfo = undefined;
  }

  // 2. 恢复确认状态
  if (record.confirmationInfo.confirmationStatus === 'returned') {
    record.confirmationInfo.confirmationStatus = 'pending';
  }

  // 3. 更新状态
  record.currentStage = WorkflowStage.AWAITING_CONFIRMATION;
  record.status = RecordStatus.PENDING_CONFIRMATION;
  record.updatedAt = now;

  // 4. 完成 REVISION_IN_PROGRESS 责任项
  const incompleteRevisionEntry = record.responsibilityTrace.find(
    e => e.stage === WorkflowStage.REVISION_IN_PROGRESS && !e.isComplete
  );
  if (incompleteRevisionEntry) {
    incompleteRevisionEntry.isComplete = true;
  }

  // 5. 添加流程事件
  const submitEvent: WorkflowEvent = {
    eventType: isResubmission ? 'DRAFT_RESUBMITTED' : 'DRAFT_SUBMITTED',
    actorId: userId,
    actorRole: UserRole.TAX_CONSULTANT,
    timestamp: now,
    details: {
      submittedAt: now,
      isResubmission,
      previousReturnInfo: isResubmission ? record.returnHistory[record.returnHistory.length - 1] : undefined
    },
    previousStage,
    newStage: WorkflowStage.AWAITING_CONFIRMATION
  };

  // 6. 添加责任追溯
  const responsibilityEntry: ResponsibilityEntry = {
    stage: WorkflowStage.AWAITING_CONFIRMATION,
    responsibleRole: UserRole.TAX_CONSULTANT,
    responsibleUserId: userId,
    action: isResubmission ? '重新提交申报底稿' : '提交申报底稿',
    timestamp: now,
    isComplete: true,
    notes: isResubmission
      ? `税务期间 ${record.taxPeriod} 的申报底稿已重新提交，之前的退回已解决`
      : `税务期间 ${record.taxPeriod} 的申报底稿已提交，等待客户确认`
  };

  record.workflowHistory.push(submitEvent);
  record.responsibilityTrace.push(responsibilityEntry);
  saveRecord(record);

  // 7. 同步更新待办
  todoService.handleStageChange(record, WorkflowStage.AWAITING_CONFIRMATION, previousStage);

  return record;
}
```

### 3. 客户确认回看接口更新

```typescript
router.get('/:recordId', (req, res) => {
  res.json({
    success: true,
    data: {
      recordId: record.id,
      taxPeriod: record.taxPeriod,
      currentStage: record.currentStage,
      confirmationInfo: record.confirmationInfo,

      // 上一环节结论
      previousConclusion: {
        taxType: record.draftInfo.draftContent.taxType,
        taxableAmount: record.draftInfo.draftContent.taxableAmount,
        taxAmount: record.draftInfo.draftContent.taxAmount,
        conclusions: record.draftInfo.draftContent.conclusions,
        applicablePolicies: record.draftInfo.draftContent.applicablePolicies,
        specialAdjustments: record.draftInfo.draftContent.specialAdjustments,
        calculations: record.draftInfo.draftContent.calculations,
        riskNotes: record.draftInfo.draftContent.riskNotes,
        sourceDocuments: record.draftInfo.sourceDocuments
      },

      // 当前有效退回信息（只有未解决的才显示）
      currentReturnInfo: record.returnInfo,

      // 是否有历史退回记录
      hasReturnHistory: record.returnHistory && record.returnHistory.length > 0,

      // 历史退回记录列表
      returnHistory: record.returnHistory || [],

      // 补充备注
      supplementaryNotes: record.supplementaryNotes.filter(n => n.isVisibleToClient),

      // 责任追溯
      responsibilityTrace: record.responsibilityTrace,

      // 流程历史
      workflowHistory: record.workflowHistory
    },
    message: '在同一工作面展示：上一环节结论 + 底稿摘要 + 确认状态 + 当前退回（如有） + 历史退回记录 + 补充备注 + 责任追溯'
  });
});
```

### 4. 待办生成逻辑

待办生成逻辑保持不变，`AWAITING_CONFIRMATION` 状态会为客户财务生成待办：

```typescript
case WorkflowStage.AWAITING_CONFIRMATION:
case WorkflowStage.CONFIRMATION_IN_PROGRESS:
  if (record.confirmationInfo.clientFinanceId) {
    // 为客户财务生成待办
    this.createTodoIfNotExists({
      recordId: record.id,
      type: TodoType.CONFIRMATION_PENDING,
      title: '待确认申报底稿',
      description: `税务期间 ${record.taxPeriod} 的申报底稿待确认`,
      assigneeId: record.confirmationInfo.clientFinanceId,
      assigneeRole: UserRole.CLIENT_FINANCE,
      priority: 'medium',
      dueDate: record.confirmationInfo.deadline
    });
  }
  break;
```

## 重提后的状态流转

### 重提前（退回状态）
```
currentStage: WorkflowStage.RETURNED
status: RecordStatus.PENDING_REVISION
confirmationInfo.confirmationStatus: 'returned'
returnInfo: { ...未解决的退回信息, isResolved: false }
returnHistory: []
```

### 重提后（待确认状态）
```
currentStage: WorkflowStage.AWAITING_CONFIRMATION
status: RecordStatus.PENDING_CONFIRMATION
confirmationInfo.confirmationStatus: 'pending'
returnInfo: undefined
returnHistory: [{ ...已解决的退回信息, isResolved: true }]
responsibilityTrace: [..., { stage: 'REVISION_IN_PROGRESS', isComplete: true }]
```

## 三方待办一致性

### 税务顾问待办
- 重提后：不再显示"待修订退回的申报底稿"
- 可能显示：新提交的底稿的"待完成"（如果是从头创建）

### 项目经理待办
- 重提后：如果之前有超时的退回争议，重新提交后不再显示"待介入的退回争议"
- 可能显示：待审批（如果底稿已确认）

### 客户财务待办
- 重提后：显示"待确认申报底稿"
- 可能显示："待准备确认材料"（如果有未准备的材料）

## 测试用例

### 测试1：正常提交
```bash
# 创建新底稿
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{ ... }'

# 提交底稿
curl -X POST http://localhost:3000/api/drafts/{newRecordId}/submit \
  -H "X-User-Id: tc-001"

# 验证状态
curl http://localhost:3000/api/records/{newRecordId}
```

### 测试2：退回后重新提交
```bash
# 退回底稿（假设 record-001 处于确认中状态）
curl -X POST http://localhost:3000/api/confirmations/record-001/return \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-001" \
  -d '{
    "returnedBy": "cf-001",
    "returnReason": {
      "category": "calculation_error",
      "description": "测试退回原因",
      "priority": "high"
    },
    "specificIssues": [...],
    "suggestedFixes": [...],
    "expectedFixDeadline": "2024-06-20"
  }'

# 验证退回状态
curl http://localhost:3000/api/records/record-001
# 预期: currentStage: RETURNED, returnInfo存在, isResolved: false

# 重新提交底稿
curl -X POST http://localhost:3000/api/drafts/record-001/submit \
  -H "X-User-Id: tc-001"

# 验证重提状态
curl http://localhost:3000/api/records/record-001
# 预期:
# - currentStage: AWAITING_CONFIRMATION
# - confirmationInfo.confirmationStatus: 'pending'
# - returnInfo: undefined
# - returnHistory: [{ returnInfo: {...}, resubmittedAt: ... }]
# - responsibilityTrace 中 REVISION_IN_PROGRESS 的 isComplete: true

# 验证客户确认回看
curl http://localhost:3000/api/confirmations/record-001
# 预期:
# - currentReturnInfo: undefined (不显示旧退回)
# - hasReturnHistory: true
# - returnHistory: [{ ...退回信息... }]
```

### 测试3：待办一致性
```bash
# 税务顾问待办（重提后不应有修订待办）
curl http://localhost:3000/api/todos/tax-consultant/tc-001
# 预期: 不包含 record-001 的 DRAFT_REVISION 待办

# 客户财务待办（重提后应有确认待办）
curl http://localhost:3000/api/todos/client-finance/client-001/cf-001
# 预期: 包含 record-001 的 CONFIRMATION_PENDING 待办
```

## 修改文件清单

- `src/types.ts` - 添加 `isResolved`, `resolvedAt`, `resolvedBy` 字段，添加 `ReturnHistoryEntry` 接口
- `src/services/DraftService.ts` - 更新 `submitDraft` 方法处理重提逻辑
- `src/services/ConfirmationService.ts` - 在退回时设置 `isResolved: false`
- `src/routes/confirmations.ts` - 区分当前退回和历史退回
- `src/server.ts` - 更新种子数据添加新字段
