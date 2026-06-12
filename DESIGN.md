# 税务咨询机构-申报底稿与客户确认工作流系统

## 1. 系统概述

### 1.1 设计目标
解决税务咨询机构在申报底稿与客户确认环节的沟通效率问题，减少来回确认的次数。

### 1.2 核心问题
- 旧台账、现场记录和沟通截图通常只记录结果，不记录决策过程
- 申报底稿与客户确认之间的责任说不清
- 各方（税务顾问、项目经理、客户财务）无法清晰地看到自己的待办

### 1.3 设计原则
- **信息集中**：申报底稿、客户确认、退回原因、补充备注在同一记录中
- **角色分离**：各方只看到自己的待办和相关信息
- **上下文完整**：客户确认需要的材料、备注和上一环节结论在同一工作面

## 2. 核心数据模型

### 2.1 统一记录结构 (WorkflowRecord)

```typescript
interface WorkflowRecord {
  // 基础信息
  id: string;                          // 记录ID
  projectId: string;                    // 项目ID
  clientId: string;                     // 客户ID
  taxPeriod: string;                    // 税务期间 (如: 2024Q1)
  createdAt: Date;
  updatedAt: Date;
  currentStage: WorkflowStage;         // 当前阶段
  status: RecordStatus;                // 记录状态

  // 申报底稿信息 (由税务顾问填写)
  draftInfo: {
    taxConsultantId: string;           // 负责税务顾问ID
    draftContent: DraftContent;        // 申报内容
    sourceDocuments: Document[];        // 依据的原始凭证
    calculations: Calculation[];        // 计算过程
    conclusions: Conclusion[];          // 申报结论
    attachments: Attachment[];         // 附件
    createdAt: Date;
    updatedAt: Date;
  };

  // 客户确认信息
  confirmationInfo: {
    clientFinanceId: string;           // 客户财务负责人ID
    requiredMaterials: Material[];      // 客户确认所需材料清单
    materialsStatus: MaterialStatus[];  // 材料准备状态
    confirmationStatus: ConfirmStatus; // 确认状态
    confirmationResult?: ConfirmResult; // 确认结果
    confirmedAt?: Date;
    deadline: Date;                     // 确认截止日期
  };

  // 退回原因 (如果客户退回)
  returnInfo?: {
    returnedBy: string;                // 退回人
    returnReason: ReturnReason;        // 退回原因
    specificIssues: Issue[];            // 具体问题点
    suggestedFixes: string[];          // 建议修改
    returnedAt: Date;
    expectedFixDeadline: Date;         // 期望完成时间
    isResponsibilityClear: boolean;    // 责任是否明确
    responsibilityNotes?: string;     // 责任说明
  };

  // 补充备注
  supplementaryNotes: Note[];

  // 流程历史
  workflowHistory: WorkflowEvent[];

  // 责任追溯
  responsibilityTrace: ResponsibilityEntry[];
}

interface DraftContent {
  taxType: string;                     // 税种
  taxableAmount: number;               // 计税金额
  taxAmount: number;                   // 税额
  applicablePolicies: Policy[];        // 适用政策
  specialAdjustments: Adjustment[];     // 特殊调整项
  riskNotes: string;                   // 风险提示
}

interface Material {
  id: string;
  name: string;                        // 材料名称
  description: string;                 // 材料说明
  required: boolean;                   // 是否必需
  source: 'client' | 'consultant';    // 材料来源
  status: 'pending' | 'provided' | 'waived';
  providedAt?: Date;
  attachmentUrl?: string;
}

interface ReturnReason {
  category: 'calculation_error' | 'missing_info' | 'policy_misapplication' |
            'document_issue' | 'other';
  description: string;
  priority: 'high' | 'medium' | 'low';
  relatedSection?: string;             // 关联的申报部分
  evidence?: Document[];               // 证据材料
}

interface Note {
  id: string;
  authorId: string;
  authorRole: UserRole;
  content: string;
  type: 'general' | 'technical' | 'client_communication' | 'internal';
  relatedTo?: string;                  // 关联的问题或环节
  createdAt: Date;
  isVisibleToClient: boolean;          // 是否对客户可见
}

interface WorkflowEvent {
  eventType: string;
  actorId: string;
  actorRole: UserRole;
  timestamp: Date;
  details: Record<string, any>;
  previousStage?: WorkflowStage;
  newStage?: WorkflowStage;
}

interface ResponsibilityEntry {
  stage: WorkflowStage;
  responsibleRole: UserRole;
  responsibleUserId?: string;
  action: string;
  timestamp: Date;
  isComplete: boolean;
  notes?: string;
}
```

### 2.2 角色定义

```typescript
enum UserRole {
  TAX_CONSULTANT = 'tax_consultant',       // 税务顾问
  PROJECT_MANAGER = 'project_manager',     // 项目经理
  CLIENT_FINANCE = 'client_finance'        // 客户财务
}
```

### 2.3 工作流阶段

```typescript
enum WorkflowStage {
  DRAFT_CREATED = 'draft_created',         // 申报底稿已创建
  DRAFT_REVIEW = 'draft_review',            // 底稿审核中
  AWAITING_CONFIRMATION = 'awaiting_confirmation',  // 等待客户确认
  CONFIRMATION_IN_PROGRESS = 'confirmation_in_progress',  // 确认进行中
  CONFIRMED = 'confirmed',                 // 已确认
  RETURNED = 'returned',                   // 已退回
  REVISION_IN_PROGRESS = 'revision_in_progress',  // 修订中
  COMPLETED = 'completed'                   // 完成
}

enum RecordStatus {
  ACTIVE = 'active',
  PENDING_CONFIRMATION = 'pending_confirmation',
  PENDING_REVISION = 'pending_revision',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

## 3. 角色待办系统

### 3.1 税务顾问待办
- 待完成的申报底稿
- 待修订的退回记录
- 待补充的材料说明
- 待审核的修改确认

### 3.2 项目经理待办
- 待分配的申报任务
- 超时的确认记录
- 需要介入的退回争议
- 待审批的最终申报

### 3.3 客户财务待办
- 待确认的申报底稿
- 待准备的材料清单
- 待解答的疑问
- 待签字的确认函

## 4. API 设计

### 4.1 核心接口

#### 申报底稿管理
- `POST /api/drafts` - 创建申报底稿
- `GET /api/drafts/:id` - 获取底稿详情
- `PUT /api/drafts/:id` - 更新申报底稿
- `POST /api/drafts/:id/submit` - 提交底稿等待确认
- `GET /api/drafts` - 查询底稿列表 (支持多条件过滤)

#### 客户确认管理
- `POST /api/confirmations` - 创建确认任务
- `GET /api/confirmations/:recordId` - 获取确认详情
- `POST /api/confirmations/:recordId/provide-materials` - 提供材料
- `POST /api/confirmations/:recordId/confirm` - 确认申报
- `POST /api/confirmations/:recordId/return` - 退回申报

#### 待办管理
- `GET /api/todos/tax-consultant` - 获取税务顾问待办
- `GET /api/todos/project-manager` - 获取项目经理待办
- `GET /api/todos/client-finance` - 获取客户财务待办
- `PUT /api/todos/:id/complete` - 标记待办完成

#### 统一记录查询
- `GET /api/records/:id` - 获取完整记录
- `GET /api/records` - 查询记录列表
- `POST /api/records/:id/notes` - 添加备注
- `GET /api/records/:id/history` - 获取流程历史

### 4.2 请求示例

详见第6节接口文档

## 5. 服务层设计

### 5.1 核心服务

```typescript
// DraftService - 申报底稿服务
class DraftService {
  createDraft(data: CreateDraftDTO): Promise<WorkflowRecord>
  updateDraft(id: string, data: UpdateDraftDTO): Promise<WorkflowRecord>
  submitDraft(id: string): Promise<WorkflowRecord>
  getDraftById(id: string): Promise<WorkflowRecord>
  getDrafts(filters: DraftFilters): Promise<DraftList>
}

// ConfirmationService - 客户确认服务
class ConfirmationService {
  createConfirmation(recordId: string, data: CreateConfirmationDTO): Promise<WorkflowRecord>
  provideMaterials(recordId: string, materials: Material[]): Promise<WorkflowRecord>
  confirmRecord(recordId: string, result: ConfirmResult): Promise<WorkflowRecord>
  returnRecord(recordId: string, returnInfo: ReturnReason): Promise<WorkflowRecord>
  getConfirmationDetails(recordId: string): Promise<ConfirmationDetails>
}

// TodoService - 待办服务
class TodoService {
  getTaxConsultantTodos(consultantId: string): Promise<Todo[]>
  getProjectManagerTodos(managerId: string): Promise<Todo[]>
  getClientFinanceTodos(clientId: string, financeId: string): Promise<Todo[]>
  completeTodo(todoId: string): Promise<Todo>
}

// RecordService - 统一记录服务
class RecordService {
  getRecordById(id: string): Promise<WorkflowRecord>
  getRecords(filters: RecordFilters): Promise<RecordList>
  addNote(recordId: string, note: NoteDTO): Promise<Note>
  getRecordHistory(recordId: string): Promise<WorkflowEvent[]>
}

// ResponsibilityService - 责任追溯服务
class ResponsibilityService {
  addResponsibilityEntry(recordId: string, entry: ResponsibilityEntry): Promise<void>
  getResponsibilityTrace(recordId: string): Promise<ResponsibilityEntry[]>
  clarifyResponsibility(recordId: string, notes: string): Promise<void>
}
```

## 6. 接口文档与请求示例

详见后续接口文档文件

## 7. 技术简化说明

### 7.1 权限系统简化
- 当前版本使用简化的角色检查
- 未实现细粒度的资源级权限控制
- 未实现权限继承和委托机制
- 建议：后续版本可引入 RBAC 或 ABAC 系统

### 7.2 附件系统简化
- 附件仅存储 URL 引用
- 未实现文件上传、预览、版本控制
- 未实现附件与记录内容的关联
- 建议：后续版本可集成专业的文档管理系统

### 7.3 通知系统简化
- 当前版本未实现异步通知
- 未实现邮件、短信、站内信通知
- 未实现通知偏好设置
- 建议：后续版本可集成钉钉、企业微信等通知渠道

### 7.4 外部系统集成简化
- 未实现与税务申报系统的对接
- 未实现与财务系统的数据同步
- 未实现与客户系统的单点登录
- 建议：后续版本可考虑：
  - 金蝶、用友等财务系统集成
  - 电子税务局接口对接
  - 企业微信/钉钉 SSO 集成

## 8. 部署建议

### 8.1 技术栈建议
- 后端：Node.js + Express + TypeScript
- 数据库：PostgreSQL + Redis
- 文档：Swagger/OpenAPI 3.0
- 部署：Docker + Kubernetes

### 8.2 环境配置
- 开发环境：本地运行
- 测试环境：独立数据库
- 生产环境：多实例部署 + 负载均衡

## 9. 后续优化方向

1. **智能退回分类**：基于历史退回数据训练模型，自动识别退回原因类别
2. **责任追溯增强**：引入区块链技术，确保责任不可篡改
3. **数据可视化**：增加统计分析仪表板，帮助管理层了解流程效率
4. **移动端支持**：开发小程序或移动应用，方便外勤人员使用
5. **AI 辅助**：引入 AI 助手，自动检查申报底稿的合规性
