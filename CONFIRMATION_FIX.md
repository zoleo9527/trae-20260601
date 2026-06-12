# 客户确认任务创建后的同步断点修复

## 问题描述

在创建客户确认任务时存在以下同步断点：

1. **未添加责任追溯记录**：创建确认任务后，没有记录谁负责这次确认任务
2. **未触发待办重建**：分派客户财务后，没有立即生成客户财务的待办
3. **未检查前置状态**：可以从未提交底稿直接进入 `confirmation_in_progress` 状态
4. **状态不一致**：records 和 confirmations 接口返回的阶段和状态可能不同步

## 解决方案

### 1. 添加状态前置检查

```typescript
createConfirmation(recordId: string, data: CreateConfirmationDTO): WorkflowRecord {
  const record = getRecordById(recordId);

  if (!record) {
    throw new Error('记录不存在');
  }

  // 禁止未提交底稿直接进入确认状态
  if (record.currentStage !== WorkflowStage.AWAITING_CONFIRMATION) {
    throw new Error(
      `无法创建客户确认任务：底稿当前阶段为 ${record.currentStage}，必须先提交底稿`
    );
  }

  // ... 后续逻辑
}
```

### 2. 添加责任追溯记录

```typescript
const responsibilityEntry: ResponsibilityEntry = {
  stage: WorkflowStage.CONFIRMATION_IN_PROGRESS,
  responsibleRole: UserRole.CLIENT_FINANCE,
  responsibleUserId: data.clientFinanceId,
  action: '客户确认任务已分派',
  timestamp: now,
  isComplete: false,
  notes: `需要准备 ${data.requiredMaterials.length} 项材料，截止日期：${record.confirmationInfo.deadline}`
};

record.responsibilityTrace.push(responsibilityEntry);
```

### 3. 同步更新状态

```typescript
record.currentStage = WorkflowStage.CONFIRMATION_IN_PROGRESS;
record.status = RecordStatus.PENDING_CONFIRMATION;  // 同步更新 record status
```

### 4. 触发待办重建

```typescript
saveRecord(record);

// 触发待办重建，为客户财务生成待办
todoService.handleStageChange(record, WorkflowStage.CONFIRMATION_IN_PROGRESS, previousStage);
```

## provideMaterials 方法同步更新

### 添加材料时的责任追溯

```typescript
provideMaterials(recordId: string, materials: Material[], userId: string): WorkflowRecord {
  const record = getRecordById(recordId);

  // ... 材料更新逻辑 ...

  const providedCount = materials.filter(m => m.status === 'provided').length;
  const responsibilityEntry: ResponsibilityEntry = {
    stage: WorkflowStage.CONFIRMATION_IN_PROGRESS,
    responsibleRole: UserRole.CLIENT_FINANCE,
    responsibleUserId: userId,
    action: '客户提供材料',
    timestamp: now,
    isComplete: false,
    notes: `已提供 ${providedCount} 项材料`
  };

  record.workflowHistory.push(materialEvent);
  record.responsibilityTrace.push(responsibilityEntry);
  saveRecord(record);

  // 触发待办更新
  todoService.handleStageChange(record, record.currentStage, record.currentStage);

  return record;
}
```

## 状态流转规则

### 合法的状态流转

```
DRAFT_CREATED → AWAITING_CONFIRMATION → CONFIRMATION_IN_PROGRESS → CONFIRMED
                                    ↓
                                 RETURNED → REVISION_IN_PROGRESS → AWAITING_CONFIRMATION
```

### 不允许的流转

- `DRAFT_CREATED` → `CONFIRMATION_IN_PROGRESS` ❌
- `CONFIRMED` → `CONFIRMATION_IN_PROGRESS` ❌
- `CONFIRMATION_IN_PROGRESS` → `DRAFT_CREATED` ❌

## 统一 records 与 confirmations 返回

### records 接口
返回完整的 `record` 对象，包含：
- `currentStage` - 当前工作流阶段
- `status` - 记录状态
- `confirmationInfo.confirmationStatus` - 确认状态

### confirmations 接口
返回结构化的确认信息：
- `currentStage` - 与 record 一致
- `confirmationInfo` - 与 record 一致
- `previousConclusion` - 上一环节结论
- `currentReturnInfo` - 当前退回（如有）
- `returnHistory` - 历史退回记录

### 同步保证

所有状态变更操作都会：
1. 同步更新 `currentStage`
2. 同步更新 `status`
3. 同步更新 `confirmationInfo.confirmationStatus`
4. 添加流程历史记录
5. 添加责任追溯记录
6. 触发待办重建

## 待办生成规则

### AWAITING_CONFIRMATION 阶段
- **税务顾问待办**：无
- **客户财务待办**：`CONFIRMATION_PENDING` - 待确认申报底稿

### CONFIRMATION_IN_PROGRESS 阶段
- **客户财务待办**：
  - `CONFIRMATION_PENDING` - 待确认申报底稿
  - `MATERIAL_PREPARATION` - 待准备材料（如有未准备的必需材料）

### RETURNED 阶段
- **税务顾问待办**：`DRAFT_REVISION` - 待修订退回的申报底稿

### CONFIRMED 阶段
- **项目经理待办**：`APPROVAL_PENDING` - 待审批最终申报

## 测试用例

### 测试 1：正常创建确认任务

```bash
# 1. 确保底稿已提交（处于 AWAITING_CONFIRMATION 状态）
curl http://localhost:3000/api/records/record-002
# 预期: currentStage: "awaiting_confirmation"

# 2. 创建确认任务
curl -X POST http://localhost:3000/api/confirmations/record-002 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: pm-001" \
  -d '{
    "clientFinanceId": "cf-002",
    "requiredMaterials": [
      {
        "id": "mat-new-001",
        "name": "增值税专用发票",
        "description": "本期取得的增值税专用发票抵扣联",
        "required": true,
        "source": "client",
        "status": "pending"
      }
    ],
    "deadline": "2024-06-20T00:00:00.000Z"
  }'

# 3. 验证状态
curl http://localhost:3000/api/records/record-002
# 预期:
# - currentStage: "confirmation_in_progress"
# - status: "pending_confirmation"
# - confirmationInfo.confirmationStatus: "pending"
# - confirmationInfo.clientFinanceId: "cf-002"

# 4. 验证责任追溯
curl http://localhost:3000/api/records/record-002/responsibility
# 预期: 包含新的 CONFIRMATION_IN_PROGRESS 责任项

# 5. 验证客户财务待办
curl http://localhost:3000/api/todos/client-finance/client-002/cf-002
# 预期: 包含 record-002 的待办
```

### 测试 2：禁止未提交底稿创建确认任务

```bash
# 1. 创建新底稿（处于 DRAFT_CREATED 状态）
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: tc-001" \
  -d '{ ... }'

# 2. 直接创建确认任务（应该失败）
curl -X POST http://localhost:3000/api/confirmations/{newRecordId} \
  -H "Content-Type: application/json" \
  -H "X-User-Id: pm-001" \
  -d '{
    "clientFinanceId": "cf-001",
    "requiredMaterials": [...]
  }'

# 预期返回错误:
# {
#   "success": false,
#   "error": "无法创建客户确认任务：底稿当前阶段为 draft_created，必须先提交底稿"
# }
```

### 测试 3：提供材料触发待办更新

```bash
# 1. 提供材料
curl -X POST http://localhost:3000/api/confirmations/record-002/provide-materials \
  -H "Content-Type: application/json" \
  -H "X-User-Id: cf-002" \
  -d '{
    "materials": [
      {
        "id": "mat-new-001",
        "name": "增值税专用发票",
        "status": "provided",
        "providedAt": "2024-06-13T10:00:00.000Z"
      }
    ]
  }'

# 2. 验证责任追溯
curl http://localhost:3000/api/records/record-002/responsibility
# 预期: 包含 "客户提供材料" 责任项

# 3. 验证待办更新
curl http://localhost:3000/api/todos/client-finance/client-002/cf-002
# 预期: 材料待办可能已完成或更新
```

## 修改文件清单

- `src/services/ConfirmationService.ts` - 更新 `createConfirmation` 和 `provideMaterials` 方法
- `src/services/TodoService.ts` - 确保待办生成逻辑正确（无需修改）
- `src/server.ts` - 更新种子数据（无需修改，逻辑已同步）
- `src/seed.ts` - 更新种子数据（无需修改，逻辑已同步）

## 注意事项

1. **前置状态必须检查**：所有状态变更操作都应检查当前阶段是否符合预期
2. **状态必须同步**：修改 `currentStage` 时必须同时修改 `status`
3. **责任追溯必须完整**：每次操作都应添加责任追溯记录
4. **待办必须重建**：状态变更后必须触发待办重建以确保一致性
