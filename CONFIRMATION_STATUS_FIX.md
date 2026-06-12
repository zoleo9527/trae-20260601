# 客户确认状态映射错误修复

## 问题描述

在 `ConfirmationService.createConfirmation` 方法中，将 `currentStage` 设置为 `CONFIRMATION_IN_PROGRESS` 后，`confirmationInfo.confirmationStatus` 仍停留在 `'pending'`，导致状态不一致。

### 修复前
```typescript
record.confirmationInfo.confirmationStatus = 'pending';  // ❌ 错误
record.currentStage = WorkflowStage.CONFIRMATION_IN_PROGRESS;
```

### 修复后
```typescript
record.confirmationInfo.confirmationStatus = 'in_progress';  // ✅ 正确
record.currentStage = WorkflowStage.CONFIRMATION_IN_PROGRESS;
```

## 状态映射规则

| currentStage | confirmationStatus | record.status | 说明 |
|--------------|-------------------|---------------|------|
| DRAFT_CREATED | - | ACTIVE | 底稿创建中 |
| AWAITING_CONFIRMATION | pending | ACTIVE | 等待客户确认 |
| CONFIRMATION_IN_PROGRESS | in_progress | PENDING_CONFIRMATION | 确认进行中 |
| CONFIRMED | confirmed | COMPLETED | 已确认 |
| RETURNED | returned | PENDING_REVISION | 已退回 |

## 状态一致性保证

### createConfirmation
```typescript
record.confirmationInfo.confirmationStatus = 'in_progress';  // ✅
record.currentStage = WorkflowStage.CONFIRMATION_IN_PROGRESS;
record.status = RecordStatus.PENDING_CONFIRMATION;
```

### confirmRecord
```typescript
record.confirmationInfo.confirmationStatus = 'confirmed';  // ✅
record.currentStage = WorkflowStage.CONFIRMED;
record.status = RecordStatus.COMPLETED;
```

### returnRecord
```typescript
record.confirmationInfo.confirmationStatus = 'returned';  // ✅
record.currentStage = WorkflowStage.RETURNED;
record.status = RecordStatus.PENDING_REVISION;
```

## 种子数据验证

### record-001 (已退回)
- `currentStage`: `WorkflowStage.RETURNED` ✅
- `status`: `RecordStatus.PENDING_REVISION` ✅
- `confirmationStatus`: `'returned'` ✅

### record-002 (确认进行中)
- `currentStage`: `WorkflowStage.CONFIRMATION_IN_PROGRESS` ✅
- `status`: `RecordStatus.PENDING_CONFIRMATION` ✅
- `confirmationStatus`: `'in_progress'` ✅

### record-003 (已完成)
- `currentStage`: `WorkflowStage.CONFIRMED` ✅
- `status`: `RecordStatus.COMPLETED` ✅
- `confirmationStatus`: `'confirmed'` ✅

## 接口返回一致性

### records 接口
返回完整的 `record` 对象，包含：
- `currentStage`
- `status`
- `confirmationInfo.confirmationStatus`

### confirmations 接口
返回结构化的确认信息，直接使用 `record.confirmationInfo`，保证数据源一致。

## 修改文件

- `src/services/ConfirmationService.ts` - 修复 `createConfirmation` 方法中的状态映射

## 测试建议

```bash
# 1. 查看记录状态
curl http://localhost:3000/api/records/record-002

# 2. 对比 confirmations 接口
curl http://localhost:3000/api/confirmations/record-002

# 验证：两个接口返回的 currentStage、status、confirmationStatus 应该一致
```
