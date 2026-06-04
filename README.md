# 养老护理院 - 服药提醒与异常上报系统

前端原型，基于 Vite + React + TypeScript + TailwindCSS。解决服药提醒流向异常上报时的**责任断层**与**时效丢失**问题。

## 启动

```bash
npm install
npm run dev
```

## 核心交接断点处理

### 1. 服药提醒 → 异常上报（不可跳过）

- **问题**：原设计中标记异常仅弹出提示文案"请及时上报"，护工可跳过不上报
- **解决**：
  - 护工点击"标记异常"后，系统**自动创建异常上报草稿**（`markReminderAbnormal`）
  - 自动跳转至 `/caregiver/report?draft={reportId}`，草稿卡片**高亮显示**（琥珀色边框 + 脉冲动画）
  - 草稿区域显示"不可跳过，请完成后提交"责任提醒
  - 提交按钮**强制验证**：异常描述至少 10 字符，否则禁用
  - 侧边栏实时显示未完成草稿数量（红色徽章 + 底部提醒条）
  - 草稿未提交前，提醒状态保持为"异常上报"，持续可见

### 2. 驳回 → 补录（实质操作，非仅提示）

- **问题**：原设计中驳回仅在 toast 中显示原因，补录也仅为文案提示
- **解决**：
  - 驳回时必须填写驳回原因（`RejectModal` 强制验证非空）
  - 驳回原因**持久化存储**在上报单 `rejectionReason` 字段
  - 已驳回的上报单在列表中**直接显示驳回原因**（琥珀色背景块）
  - 驳回项旁边显示"补录"按钮，点击弹出补录表单
  - 补录内容写入 `supplementHistory` 数组，形成完整责任链
  - 补录后自动重新提交（状态从 rejected → supplemented → submitted）
  - 所有操作写入 `OperationLog`，全程可追溯

### 3. 超时未处理（自动升级）

- **问题**：服药提醒到期未处理无任何机制，责任不清
- **解决**：
  - 应用启动时自动开启超时检测（`startTimeoutChecker`）
  - 每分钟检测一次，超过计划时间 30 分钟未处理的提醒自动标记为"超时"
  - 自动创建异常上报草稿（`markReminderTimeout`），异常类型为"超时未处理"，严重程度为"高"
  - 超时状态标签带**脉冲动画**，护理主管概览台超时数字带脉冲效果
  - 操作日志记录"系统"作为操作人，明确自动升级机制

---

## 模拟接口说明（集中列表）

本项目为纯前端原型，所有接口通过 Zustand store 在内存中模拟，无真实后端。

### 服药提醒相关

| 模拟接口 | HTTP 方法 | Store 方法 | 说明 |
|----------|-----------|------------|------|
| `GET /api/reminders` | GET | `useAppStore(s => s.reminders)` | 获取服药提醒列表 |
| `POST /api/reminders/:id/confirm` | POST | `confirmReminder(id)` | 确认服药，状态变为 confirmed |
| `POST /api/reminders/:id/mark-abnormal` | POST | `markReminderAbnormal(id, note)` | 标记异常，自动创建上报草稿并返回 reportId |
| `POST /api/reminders/:id/timeout` | POST | `markReminderTimeout(id)` | 标记超时，自动创建高优先级上报 |
| `POST /api/reminders/check-timeouts` | POST | `checkAndMarkTimeouts()` | 批量检测超时提醒，返回新创建的上报ID列表 |

### 异常上报相关

| 模拟接口 | HTTP 方法 | Store 方法 | 说明 |
|----------|-----------|------------|------|
| `GET /api/reports` | GET | `useAppStore(s => s.reports)` | 获取异常上报列表 |
| `POST /api/reports` | POST | `createReportDraft(reminderId, type)` | 手动创建上报草稿 |
| `PUT /api/reports/:id/submit` | PUT | `submitReport(id)` | 提交上报，状态变为 submitted |
| `PUT /api/reports/:id/approve` | PUT | `approveReport(id)` | 审批通过，状态变为 approved |
| `PUT /api/reports/:id/reject` | PUT | `rejectReport(id, reason)` | 驳回，必填原因，状态变为 rejected |
| `POST /api/reports/:id/supplement` | POST | `supplementReport(id, content)` | 补录信息，写入 supplementHistory |
| `PUT /api/reports/:id/resubmit` | PUT | `resubmitReport(id)` | 补录后重新提交，状态变回 submitted |
| `PUT /api/reports/:id/family-notify` | PUT | `markFamilyNotified(id)` | 社工标记已通知家属 |
| `PUT /api/reports/:id/family-confirm` | PUT | `markFamilyConfirmed(id)` | 社工标记家属已确认 |
| `POST /api/reports/:id/attachments` | POST | `addAttachment(id, attachment)` | 上传附件（模拟） |
| `DELETE /api/reports/:id/attachments/:aid` | DELETE | `removeAttachment(id, aid)` | 删除附件（模拟） |

### 操作日志相关

| 模拟接口 | HTTP 方法 | Store 方法 | 说明 |
|----------|-----------|------------|------|
| `GET /api/logs?entityId=xxx` | GET | `getLogsForEntity(id)` | 获取指定实体的操作日志 |

### 定时任务相关

| 模拟接口 | HTTP 方法 | Store 方法 | 说明 |
|----------|-----------|------------|------|
| `POST /api/timeout-checker/start` | POST | `startTimeoutChecker()` | 启动超时检测定时器（每分钟执行） |
| `POST /api/timeout-checker/stop` | POST | `stopTimeoutChecker()` | 停止超时检测定时器 |

---

## 导出能力说明（集中列表）

原型中导出功能为模拟实现，位于 `src/utils/export.ts`，使用 Blob + URL.createObjectURL 触发浏览器下载。

### 导出接口

| 功能 | 触发位置 | 导出格式 | 实现方法 |
|------|----------|----------|----------|
| 异常上报导出 | 护理主管概览台、审批台 | CSV（UTF-8 BOM） | `exportReportsToCSV(reports)` |
| 操作日志导出 | 护理主管概览台 | CSV（UTF-8 BOM） | `exportLogsToCSV(logs)` |

### CSV 字段说明

**异常上报导出字段**：上报ID、老人姓名、床位号、异常类型、严重程度、状态、上报人、提交时间、审批人、审批时间、驳回原因、是否涉及家属、已通知家属、家属已确认、异常描述

**操作日志导出字段**：日志ID、实体类型、实体ID、操作类型、操作人、操作角色、操作时间、详情

---

## 附件能力说明（集中列表）

原型中附件功能为模拟实现，位于 `src/utils/attachment.ts`。

### 附件接口

| 功能 | 触发位置 | 说明 |
|------|----------|------|
| 上传附件 | 异常上报详情抽屉 | 点击"上传附件"按钮选择文件，支持多文件 |
| 查看附件列表 | 异常上报详情抽屉 | 显示文件名、大小、上传人、上传时间 |
| 删除附件 | 异常上报详情抽屉 | 点击删除图标移除附件 |

### 实现说明

- 选择文件后仅在前端内存中记录文件名、大小、类型，**不会真实上传**到服务器
- 附件数据存储在 `AnomalyReport.attachments` 数组中，刷新页面后丢失
- 附件操作写入操作日志（`add_attachment` / `remove_attachment`）
- 如需对接真实文件存储（如 OSS、S3），替换 `src/utils/attachment.ts` 中的模拟逻辑即可

### 类型定义

```typescript
interface Attachment {
  id: string           // 附件ID，前端生成
  name: string         // 文件名
  size: number         // 文件大小（字节）
  type: string         // MIME类型
  uploadedAt: string   // 上传时间（ISO）
  uploadedBy: string   // 上传人姓名
}
```

---

## 角色与权限（入口分离）

| 角色 | 入口卡片 | 路由前缀 | 核心权限 | 侧边栏导航 |
|------|----------|----------|----------|------------|
| 护理主管 | 左侧蓝色卡片（盾牌图标） | `/supervisor` | 查看全院服药/异常数据、审批或驳回异常上报、超时未处理监控、导出数据 | 概览台、审批台 |
| 责任护工 | 中间青色卡片（心跳图标） | `/caregiver` | 接收并处理服药提醒、确认服药、标记异常、提交异常上报、对驳回记录补录重提 | 提醒台、上报台 |
| 社工 | 右侧紫色卡片（用户图标） | `/social-worker` | 查看与家属相关的异常记录、标记家属通知状态、**不可操作临床流程** | 沟通台 |

---

## 状态标签设计（全可点击）

所有状态标签均支持点击，点击后打开对应详情抽屉（`ReportDetailDrawer`）。

| 状态 | 标签文案 | 颜色 | 点击效果 |
|------|----------|------|----------|
| pending | 待处理 | zinc 灰 | 查看提醒详情 |
| confirmed | 已确认 | 青色 | 查看确认记录 |
| abnormal | 异常上报 | 琥珀色 | 跳转上报详情 |
| timeout | 超时 | 红色（脉冲动画） | 查看超时详情 |
| draft | 草稿 | zinc 灰 | 查看草稿内容 |
| submitted | 审批中 | 蓝色 | 查看上报单 |
| approved | 已通过 | 绿色 | 查看审批记录 |
| rejected | 已驳回 | 红色 | 查看驳回原因 + 补录入口 |
| supplemented | 已补录 | 紫色 | 查看补录历史 |

---

## 核心流程（责任链完整）

1. **服药提醒处理**：护工在提醒台按时段查看提醒 → 点击"确认服药"或"标记异常"
2. **异常上报衔接**：点击"标记异常"→ 选择异常类型 → 系统自动创建上报草稿 → **强制跳转**上报台
3. **上报提交**：在上报台填写异常描述（≥10字符）、选择严重程度、勾选是否涉及家属 → 提交
4. **审批流程**：护理主管在审批台查看 → 通过 / 驳回（驳回**必须填写原因**）
5. **驳回补录**：护工在上报台看到驳回原因 → 点击"补录"填写补充信息 → 自动重新提交
6. **家属沟通**：涉及家属的异常审批通过后 → 社工在沟通台标记"已通知家属"/"家属已确认"
7. **超时自动升级**：提醒超过 30 分钟未处理 → 系统自动标记超时 → 自动创建高优先级上报 → 推送至护理主管

---

## 代码参考

- 状态管理：[store/index.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/store/index.ts)
- 类型定义：[types/index.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/types/index.ts)
- Mock 数据：[mock/data.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/mock/data.ts)
- 导出工具：[utils/export.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/utils/export.ts)
- 附件工具：[utils/attachment.ts](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/utils/attachment.ts)
- 状态标签：[components/StatusTag.tsx](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/components/StatusTag.tsx)
- 驳回弹窗：[components/RejectModal.tsx](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/components/RejectModal.tsx)
- 补录弹窗：[components/SupplementModal.tsx](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/components/SupplementModal.tsx)
- 上报详情：[components/ReportDetailDrawer.tsx](file:///Users/zhangliu/Documents/private/model-test/trae-20260601-3/src/components/ReportDetailDrawer.tsx)
