# 公证处窗口系统 - 卷宗归档与领取确认

## 系统概述

本系统重点解决真实场景中"卷宗归档和领取确认之间责任说不清"的问题，通过完整记录处理过程、责任传递和历史说明，让流程可追踪、可追责。

## 核心改进

### 1. 三个角色入口分开设计

- **窗口人员工作台**：负责启动归档、完成归档、转移至领取确认
- **公证员工作台**：负责审核归档材料、发起的正通知、查看处理历史
- **档案员工作台**：负责接收卷宗、确认领取、处理超期卷宗

每个入口只显示该角色相关的数据和操作，避免职责混淆。

### 2. 责任链追踪

从卷宗归档到领取确认的整个过程，系统会记录完整责任链：

```typescript
interface ResponsibilityRecord {
  role: OperatorRole;
  operatorId: string;
  operatorName: string;
  assignedAt: Date;
  handoverReason?: string;    // 交接原因
  handoverFrom?: string;      // 从谁那里接手
  handoverTo?: string;        // 移交给谁
}
```

每次状态转换时，责任链会新增一条记录，确保任何时候都能追溯到当前责任人和历史责任人。

### 3. 归档到领取的自然衔接

从卷宗归档切到领取确认时，系统自动携带以下信息：

```typescript
interface CollectionContext {
  archiveContext: ArchiveContext;           // 归档信息
  handoverRecord: HandoverRecord;           // 交接记录
  responsibilityChain: ResponsibilityRecord[]; // 责任链
  recentHistory: OperationLog[];            // 最近5条操作记录
  pendingCorrections?: string[];           // 待处理补正
}
```

档案员在领取确认页面可以看到完整的归档上下文，包括：
- 归档位置和归档原因
- 归档时的公证审核意见
- 交接过程中的补正历史
- 完整责任链

### 4. 操作日志与上下文快照

每次操作都会记录当时的状态快照：

```typescript
interface OperationLog {
  action: ActionType;
  fromStatus?: FileStatus;
  toStatus: FileStatus;
  reason?: string;
  timestamp: Date;
  responsibilityChainSnapshot?: ResponsibilityRecord[];  // 当时的完整责任链
  contextSnapshot?: {
    archiveInfo?: string;           // 当时的归档说明
    correctionHistory?: string[];   // 当时的补正历史
  };
}
```

这样即使后续多次交接，也能回溯到当时的情况。

### 5. 流程断裂场景测试

系统内置了3个典型的不完美场景，可以直接触发提醒来测试系统响应：

**场景1：归档完成但未及时转移**
- 问题：窗口人员完成了归档，但忘记点击"转移至领取确认"
- 触发：创建高优先级提醒，要求立即转移

**场景2：补正通知发送给了错误的人**
- 问题：窗口人员换班后，责任人未更新
- 触发：重新发送补正通知给正确的处理人

**场景3：领取确认时丢失了归档说明**
- 问题：归档时的说明只在本地便签中
- 触发：紧急提醒，结合归档上下文联系申请人

## API 设计

### 核心端点

1. **卷宗管理**
   - `GET /api/files` - 获取卷宗列表（支持按状态/角色筛选）
   - `GET /api/files/:fileId` - 获取卷宗详情
   - `POST /api/files/:fileId/archive/start` - 启动归档
   - `POST /api/files/:fileId/archive/complete` - 完成归档
   - `POST /api/files/:fileId/transfer-to-collection` - 转移至领取

2. **领取确认**
   - `GET /api/files/:fileId/collection-context` - 获取领取上下文（快速版）
   - `GET /api/files/:fileId/collection-context/detailed` - 获取领取上下文（完整版）
   - `POST /api/files/:fileId/collection/confirm` - 确认领取

3. **提醒系统**
   - `GET /api/files/reminders/my` - 获取我的提醒（带优先级统计）
   - `POST /api/files/reminders/:reminderId/acknowledge` - 确认提醒
   - `GET /api/files/scenarios/imperfect` - 获取流程断裂场景
   - `POST /api/files/scenarios/:scenarioId/trigger-reminder` - 触发场景提醒

4. **日志与交接**
   - `GET /api/files/logs` - 获取操作日志
   - `GET /api/files/handover/pending` - 获取待确认交接
   - `POST /api/files/handover/:handoverId/acknowledge` - 确认交接

## 数据模型

### FileRecord（卷宗）

```typescript
{
  id: string;
  appointmentNumber: string;
  currentStatus: FileStatus;
  responsiblePerson?: ResponsibilityRecord;      // 当前责任人
  responsibilityChain: ResponsibilityRecord[];    // 完整责任链
  archiveInfo?: ArchiveContext;                   // 归档信息
  collectionInfo?: CollectionInfo;               // 领取信息
  correctionHistory: CorrectionRecord[];         // 补正历史
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;                              // 领取截止日期
}
```

### Reminder（提醒）

```typescript
{
  id: string;
  fileId: string;
  type: 'ARCHIVE_DEADLINE' | 'COLLECTION_DEADLINE' | 'RESPONSIBILITY_TRANSFER' | 'CORRECTION_PENDING' | 'HANDOVER_PENDING' | 'EXPIRATION_WARNING';
  recipientId: string;
  recipientName?: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actionRequired?: string;                        // 要求的操作
  createdAt: Date;
  acknowledged: boolean;
}
```

## 运行说明

### 后端

```bash
cd api
npm install
npm start
```

后端会在 `http://localhost:8080` 运行。

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端会在 `http://localhost:3000` 运行，并代理 `/api` 请求到后端。

## 测试账号

登录页面提供三个测试账号：

1. **陈窗口** - 窗口人员
2. **刘公证员** - 公证员
3. **李档案** - 档案员

## 关键设计决策

1. **为什么分开三个入口？**
   - 不同角色的职责不同，界面和数据应该按角色隔离
   - 避免权限混乱，让每个角色只看到自己该处理的事项

2. **为什么要记录责任链快照？**
   - 真实场景中，人员会换班、调岗
   - 通过快照可以回溯任何历史节点的责任人

3. **为什么要在领取确认时携带归档上下文？**
   - 避免"档案员领取时不知道为什么要归档"
   - 归档说明、补正历史等信息必须传递给下一环节

4. **为什么不把所有状态做成完美闭环？**
   - 真实场景中会有疏漏
   - 系统应该能检测并提醒这些疏漏，而不是假装一切完美

## 待改进方向

1. 添加 WebSocket 实时推送提醒
2. 实现定期扫描超期卷宗的定时任务
3. 添加导出操作日志的功能
4. 实现批量转移、批量确认功能
5. 添加权限细分（如高级公证员可以审核所有卷宗）

## 总结

这个实现的核心不是"好看"，而是"能追踪"：

- ✅ 每次操作都记录责任人、时间、原因
- ✅ 状态转换时自动携带历史上下文
- ✅ 交接过程有明确记录和确认机制
- ✅ 支持回溯任何历史节点的处理情况
- ✅ 提供流程断裂场景的提醒测试

这样即使出了问题，也能清楚地知道"是谁、在什么时候、做了什么决定、为什么"。
