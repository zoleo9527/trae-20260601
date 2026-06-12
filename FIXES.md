# 修复总结

## 已修复的问题

### 1. ✅ 模块引用路径错误

**问题**: `src/services` 下的所有服务文件中的模块引用路径错误。

**修复**:
- `DraftService.ts`: `'./types'` → `'../types'`, `'./dataStore'` → `'../dataStore'`
- `ConfirmationService.ts`: `'./types'` → `'../types'`, `'./dataStore'` → `'../dataStore'`
- `TodoService.ts`: `'./types'` → `'../types'`
- 移除了所有 `require()` 动态导入，改用静态导入
- 添加了 `dataStore` 的导入以支持直接访问

### 2. ✅ 种子数据初始化接入服务启动链路

**问题**: 种子数据未在服务启动时加载。

**修复**:
- 在 `server.ts` 中添加了 `initializeSeedData()` 函数
- 该函数在服务启动时被调用
- 包含完整的用户、客户、项目、记录和待办数据
- `TodoService.generateTodosFromRecords()` 在初始化时被调用

### 3. ✅ 客户确认回看中的上一环节结论字段

**问题**: 客户确认回看接口缺少上一环节结论字段。

**修复**:
- 在 `routes/confirmations.ts` 的 `GET /:recordId` 接口中添加了 `previousConclusion` 字段
- 该字段包含完整的申报底稿信息：
  - 税种、计税金额、税额
  - 申报结论（conclusions）
  - 适用政策（applicablePolicies）
  - 特殊调整项（specialAdjustments）
  - 计算过程（calculations）
  - 风险提示（riskNotes）
  - 原始凭证（sourceDocuments）
- 添加了 `workflowHistory` 字段以展示完整的流程历史

### 4. ✅ 提交、退回、确认时同步更新责任追溯和待办

**问题**: 操作时未同步更新责任追溯和待办。

**修复**:

#### DraftService (提交底稿)
```typescript
submitDraft(recordId: string, userId: string) {
  // ... 状态更新 ...

  // 添加责任追溯记录
  const responsibilityEntry: ResponsibilityEntry = {
    stage: WorkflowStage.AWAITING_CONFIRMATION,
    responsibleRole: UserRole.TAX_CONSULTANT,
    responsibleUserId: userId,
    action: '提交申报底稿',
    timestamp: now,
    isComplete: true,
    notes: `税务期间 ${record.taxPeriod} 的申报底稿已提交...`
  };

  record.responsibilityTrace.push(responsibilityEntry);
  saveRecord(record);

  // 同步更新待办
  todoService.handleStageChange(record, WorkflowStage.AWAITING_CONFIRMATION, previousStage);
}
```

#### ConfirmationService (退回底稿)
```typescript
returnRecord(recordId: string, returnData: ReturnRecordDTO) {
  // ... 状态更新 ...

  // 添加退回的责任追溯
  const responsibilityEntry: ResponsibilityEntry = {
    stage: WorkflowStage.RETURNED,
    responsibleRole: UserRole.CLIENT_FINANCE,
    responsibleUserId: returnData.returnedBy,
    action: '退回申报底稿',
    timestamp: now,
    isComplete: true,
    notes: `退回原因: ${returnData.returnReason.description}`
  };

  // 添加修订的责任追溯（待完成）
  const revisionEntry: ResponsibilityEntry = {
    stage: WorkflowStage.REVISION_IN_PROGRESS,
    responsibleRole: UserRole.TAX_CONSULTANT,
    responsibleUserId: record.draftInfo.taxConsultantId,
    action: '修订申报底稿',
    timestamp: now,
    isComplete: false,
    notes: `退回原因...`
  };

  record.responsibilityTrace.push(responsibilityEntry, revisionEntry);
  saveRecord(record);

  // 同步更新待办
  todoService.handleStageChange(record, WorkflowStage.RETURNED, WorkflowStage.CONFIRMATION_IN_PROGRESS);
}
```

#### ConfirmationService (确认底稿)
```typescript
confirmRecord(recordId: string, result: ConfirmResult, userId: string) {
  // ... 状态更新 ...

  // 添加责任追溯记录
  const responsibilityEntry: ResponsibilityEntry = {
    stage: WorkflowStage.CONFIRMED,
    responsibleRole: UserRole.CLIENT_FINANCE,
    responsibleUserId: userId,
    action: '确认申报底稿',
    timestamp: now,
    isComplete: true,
    notes: `客户代表: ${result.clientRepresentative}`
  };

  record.responsibilityTrace.push(responsibilityEntry);
  saveRecord(record);

  // 同步更新待办
  todoService.handleStageChange(record, WorkflowStage.CONFIRMED, record.currentStage);
}
```

#### TodoService (新增方法)
```typescript
handleStageChange(record: WorkflowRecord, newStage: WorkflowStage, previousStage: WorkflowStage) {
  // 删除该记录的所有现有待办
  this.removeTodosForRecord(record.id);

  // 根据新状态重新生成待办
  const now = new Date();
  this.generateTodosForRecord(record, now);
}

private removeTodosForRecord(recordId: string): void {
  const recordTodos = Array.from(dataStore.todos.values()).filter(t => t.recordId === recordId);
  recordTodos.forEach(todo => {
    dataStore.todos.delete(todo.id);
  });
}
```

### 5. ✅ Todo 类型错误修复

**问题**: `getProjectManagerTodos` 方法中创建的待办缺少 `createdAt` 和 `updatedAt` 属性。

**修复**: 添加了缺失的属性：
```typescript
{
  id: `pm-approval-${record.id}`,
  recordId: record.id,
  type: TodoType.APPROVAL_PENDING,
  // ... 其他属性 ...
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## 如何运行

### 1. 安装依赖

```bash
npm install
```

如果 npm install 失败，尝试：

```bash
# 方案 1: 使用 pnpm
pnpm install

# 方案 2: 使用 yarn
yarn install

# 方案 3: 单独安装
npm install express @types/express
npm install uuid @types/uuid
npm install swagger-jsdoc @types/swagger-jsdoc
npm install swagger-ui-express @types/swagger-ui-express
npm install ts-node typescript
```

### 2. 编译检查

```bash
npx tsc --noEmit
```

### 3. 启动服务

```bash
npm run dev
```

预期输出：
```
✅ 种子数据已加载:
   - 用户: 6 个
   - 客户: 3 个
   - 项目: 3 个
   - 记录: 3 条
   - 待办: X 条（由系统自动生成）

税务咨询工作流系统已启动: http://localhost:3000
API 文档: http://localhost:3000/api-docs
```

### 4. 测试 API

#### 查看税务顾问待办
```bash
curl http://localhost:3000/api/todos/tax-consultant/tc-001
```

#### 查看客户财务的统一工作面
```bash
curl http://localhost:3000/api/confirmations/record-001
```

#### 查看完整记录
```bash
curl http://localhost:3000/api/records/record-001?includeInternal=true
```

## 修复后的主链路

1. **服务启动** → 加载种子数据 → 生成初始待办
2. **提交底稿** → 更新状态 → 添加责任追溯 → 同步待办
3. **退回底稿** → 更新状态 → 添加责任追溯（退回+修订） → 同步待办
4. **确认底稿** → 更新状态 → 添加责任追溯 → 同步待办
5. **客户确认回看** → 返回上一环节结论 + 底稿摘要 + 确认状态 + 退回原因 + 补充备注 + 责任追溯

## 待办系统现在会：

1. **自动生成**：根据记录状态自动生成各角色的待办
2. **自动清理**：状态变更时删除旧待办，生成新待办
3. **角色分离**：
   - 税务顾问：待提交、待修订
   - 项目经理：待审批、超时处理
   - 客户财务：待确认、待准备材料

## 责任追溯现在会：

1. **自动记录**：每个操作都记录在 `responsibilityTrace` 中
2. **包含信息**：
   - 责任人（responsibleUserId）
   - 责任角色（responsibleRole）
   - 具体动作（action）
   - 完成状态（isComplete）
   - 时间戳（timestamp）
   - 备注说明（notes）

3. **退回时特别处理**：
   - 记录退回原因
   - 自动标记下一环节（修订）的责任
   - 判断责任是否清晰
