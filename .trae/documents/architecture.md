# 招标代理公司 - 投标报名与答疑澄清管理系统 技术架构文档

## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层 Frontend"
        A[React + Remix 应用]
        A1[页面组件]
        A2[状态管理]
        A3[路由控制]
    end
    
    subgraph "后端层 Backend"
        B[Remix Loaders/Actions]
        B1[业务逻辑层]
        B2[数据验证层]
        B3[权限控制层]
    end
    
    subgraph "数据层 Data"
        C[PostgreSQL 数据库]
        C1[投标报名表]
        C2[答疑澄清表]
        C3[操作日志表]
        C4[用户角色表]
    end
    
    A --> B
    B --> C
    A1 --> A2
    A2 --> A3
    B1 --> B2
    B2 --> B3
```

## 2. 技术栈说明

### 2.1 前端技术栈
- **框架**: Remix (React 全栈框架)
- **UI 库**: React 18
- **样式**: Tailwind CSS 3
- **状态管理**: Remix Loader/Action + React Context
- **表单处理**: Remix Form + Zod 验证
- **图标**: Heroicons
- **图表**: Recharts
- **字体**: Source Sans Pro, Inter, JetBrains Mono

### 2.2 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Remix (服务端)
- **数据库**: PostgreSQL 15
- **ORM**: Prisma
- **认证**: Remix Auth (基于 Session)
- **验证**: Zod

### 2.3 开发工具
- **包管理器**: pnpm
- **构建工具**: Vite (Remix 内置)
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript

## 3. 路由定义

| 路由路径 | 页面名称 | 功能描述 |
|---------|---------|---------|
| `/` | 工作台 | 重定向到 `/dashboard` |
| `/dashboard` | 工作台 | 待办事项、快捷操作、数据统计 |
| `/registrations` | 投标报名列表 | 显示所有投标报名记录 |
| `/registrations/:id` | 投标报名详情 | 显示单条报名详情和操作 |
| `/clarifications` | 答疑澄清列表 | 显示所有答疑澄清记录 |
| `/clarifications/:id` | 答疑澄清详情 | 显示单条澄清详情和操作 |
| `/logs` | 操作记录追溯 | 全局操作日志查询 |
| `/login` | 登录页 | 用户登录 |
| `/roles` | 角色管理 | 管理员管理角色（可选） |

## 4. API 定义

### 4.1 投标报名相关 API

#### 获取投标报名列表
```typescript
// GET /api/registrations
interface GetRegistrationsRequest {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  projectId?: string;
  bidderName?: string;
  startDate?: string;
  endDate?: string;
}

interface GetRegistrationsResponse {
  data: BidRegistration[];
  total: number;
  page: number;
  pageSize: number;
}

interface BidRegistration {
  id: string;
  projectId: string;
  projectName: string;
  bidderId: string;
  bidderName: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';
  currentHandler: string;
  currentHandlerRole: 'project_specialist' | 'review_secretary' | 'finance';
  createdAt: Date;
  updatedAt: Date;
  clarifications: Clarification[];
  operationLogs: OperationLog[];
}
```

#### 创建投标报名
```typescript
// POST /api/registrations
interface CreateRegistrationRequest {
  projectId: string;
  bidderId: string;
  bidderName: string;
  attachments?: string[];
}

interface CreateRegistrationResponse {
  id: string;
  message: string;
}
```

#### 更新投标报名状态
```typescript
// PATCH /api/registrations/:id/status
interface UpdateStatusRequest {
  status: 'reviewing' | 'approved' | 'rejected' | 'completed';
  handlerId: string;
  handlerRole: 'project_specialist' | 'review_secretary' | 'finance';
  note: string;
  rejectionReason?: string;
  supplementaryNote?: string;
}

interface UpdateStatusResponse {
  success: boolean;
  message: string;
}
```

#### 批量操作投标报名
```typescript
// POST /api/registrations/batch
interface BatchOperationRequest {
  registrationIds: string[];
  operation: 'approve' | 'reject' | 'assign';
  handlerId: string;
  handlerRole: string;
  note?: string;
  rejectionReason?: string;
  assignToUserId?: string;
}

interface BatchOperationResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  message: string;
}
```

### 4.2 答疑澄清相关 API

#### 获取答疑澄清列表
```typescript
// GET /api/clarifications
interface GetClarificationsRequest {
  page?: number;
  pageSize?: number;
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  projectId?: string;
  registrationId?: string;
}

interface GetClarificationsResponse {
  data: Clarification[];
  total: number;
  page: number;
  pageSize: number;
}

interface Clarification {
  id: string;
  registrationId: string;
  projectName: string;
  question: string;
  answer: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  createdBy: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  history: ClarificationVersion[];
}
```

#### 创建答疑澄清
```typescript
// POST /api/clarifications
interface CreateClarificationRequest {
  registrationId: string;
  question: string;
  answer: string;
  attachments?: string[];
}

interface CreateClarificationResponse {
  id: string;
  message: string;
}
```

#### 更新答疑澄清
```typescript
// PATCH /api/clarifications/:id
interface UpdateClarificationRequest {
  question?: string;
  answer?: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  note?: string;
}

interface UpdateClarificationResponse {
  success: boolean;
  message: string;
}
```

#### 获取答疑澄清历史版本
```typescript
// GET /api/clarifications/:id/history
interface GetClarificationHistoryResponse {
  versions: ClarificationVersion[];
}

interface ClarificationVersion {
  id: string;
  clarificationId: string;
  version: number;
  question: string;
  answer: string;
  changedBy: string;
  changedAt: Date;
  changeNote: string;
}
```

### 4.3 操作日志相关 API

#### 获取操作日志
```typescript
// GET /api/logs
interface GetLogsRequest {
  page?: number;
  pageSize?: number;
  entityType?: 'registration' | 'clarification';
  entityId?: string;
  operatorId?: string;
  operationType?: string;
  startDate?: string;
  endDate?: string;
}

interface GetLogsResponse {
  data: OperationLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface OperationLog {
  id: string;
  entityType: 'registration' | 'clarification';
  entityId: string;
  operationType: 'create' | 'update_status' | 'reject' | 'approve' | 'assign' | 'clarify';
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  previousStatus?: string;
  newStatus?: string;
  note: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
```

### 4.4 用户和角色相关 API

#### 获取当前用户信息
```typescript
// GET /api/auth/me
interface GetCurrentUserResponse {
  id: string;
  username: string;
  name: string;
  role: 'project_specialist' | 'review_secretary' | 'finance' | 'admin';
  permissions: string[];
}
```

#### 切换角色（管理员功能）
```typescript
// POST /api/auth/switch-role
interface SwitchRoleRequest {
  targetRole: 'project_specialist' | 'review_secretary' | 'finance';
}

interface SwitchRoleResponse {
  success: boolean;
  message: string;
}
```

#### 获取待办事项
```typescript
// GET /api/todos
interface GetTodosRequest {
  role: 'project_specialist' | 'review_secretary' | 'finance';
}

interface GetTodosResponse {
  registrations: {
    pending: number;
    reviewing: number;
    approved: number;
  };
  clarifications: {
    draft: number;
    pending_review: number;
    approved: number;
  };
}
```

## 5. 服务器架构图

```mermaid
graph LR
    A[客户端 Browser] --> B[Remix Server]
    B --> C[Loader/Action Layer]
    C --> D[Service Layer]
    D --> E[Repository Layer]
    E --> F[PostgreSQL DB]
    
    subgraph "Remix Server"
        C
        D
        E
    end
    
    subgraph "Authentication"
        G[Session Store]
        H[Auth Middleware]
    end
    
    B --> G
    C --> H
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    User ||--o{ BidRegistration : creates
    User ||--o{ Clarification : creates
    User ||--o{ OperationLog : generates
    BidRegistration ||--o{ Clarification : has
    BidRegistration ||--o{ OperationLog : tracks
    BidRegistration ||--o{ RejectionReason : has
    Clarification ||--o{ ClarificationVersion : has
    Clarification ||--o{ OperationLog : tracks
    
    User {
        string id PK
        string username
        string name
        string role
        datetime createdAt
        datetime updatedAt
    }
    
    BidRegistration {
        string id PK
        string projectId
        string projectName
        string bidderId
        string bidderName
        string status
        string currentHandlerId
        string currentHandlerRole
        datetime createdAt
        datetime updatedAt
    }
    
    Clarification {
        string id PK
        string registrationId FK
        string question
        string answer
        string status
        string createdById
        string reviewedById
        int version
        datetime createdAt
        datetime updatedAt
    }
    
    ClarificationVersion {
        string id PK
        string clarificationId FK
        int version
        string question
        string answer
        string changedById
        string changeNote
        datetime changedAt
    }
    
    OperationLog {
        string id PK
        string entityType
        string entityId
        string operationType
        string operatorId
        string operatorName
        string operatorRole
        string previousStatus
        string newStatus
        text note
        json metadata
        datetime createdAt
    }
    
    RejectionReason {
        string id PK
        string registrationId FK
        string reason
        text supplementaryNote
        string rejectedById
        datetime rejectedAt
    }
```

### 6.2 数据定义语言 (DDL)

```sql
-- 用户表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('project_specialist', 'review_secretary', 'finance', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投标报名表
CREATE TABLE bid_registrations (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    bidder_id VARCHAR(36) NOT NULL,
    bidder_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'completed')),
    current_handler_id VARCHAR(36),
    current_handler_role VARCHAR(20) CHECK (current_handler_role IN ('project_specialist', 'review_secretary', 'finance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_handler FOREIGN KEY (current_handler_id) REFERENCES users(id)
);

-- 答疑澄清表
CREATE TABLE clarifications (
    id VARCHAR(36) PRIMARY KEY,
    registration_id VARCHAR(36) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published')),
    created_by_id VARCHAR(36) NOT NULL,
    reviewed_by_id VARCHAR(36),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_registration FOREIGN KEY (registration_id) REFERENCES bid_registrations(id),
    CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) REFERENCES users(id),
    CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
);

-- 答疑澄清版本历史表
CREATE TABLE clarification_versions (
    id VARCHAR(36) PRIMARY KEY,
    clarification_id VARCHAR(36) NOT NULL,
    version INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    changed_by_id VARCHAR(36) NOT NULL,
    change_note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clarification FOREIGN KEY (clarification_id) REFERENCES clarifications(id),
    CONSTRAINT fk_changed_by FOREIGN KEY (changed_by_id) REFERENCES users(id)
);

-- 操作日志表
CREATE TABLE operation_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('registration', 'clarification')),
    entity_id VARCHAR(36) NOT NULL,
    operation_type VARCHAR(30) NOT NULL CHECK (operation_type IN ('create', 'update_status', 'reject', 'approve', 'assign', 'clarify', 'batch_approve', 'batch_reject')),
    operator_id VARCHAR(36) NOT NULL,
    operator_name VARCHAR(100) NOT NULL,
    operator_role VARCHAR(20) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    note TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_operator FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 退回原因表
CREATE TABLE rejection_reasons (
    id VARCHAR(36) PRIMARY KEY,
    registration_id VARCHAR(36) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    supplementary_note TEXT,
    rejected_by_id VARCHAR(36) NOT NULL,
    rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rejection_registration FOREIGN KEY (registration_id) REFERENCES bid_registrations(id),
    CONSTRAINT fk_rejected_by FOREIGN KEY (rejected_by_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_registrations_status ON bid_registrations(status);
CREATE INDEX idx_registrations_handler ON bid_registrations(current_handler_id, current_handler_role);
CREATE INDEX idx_registrations_created ON bid_registrations(created_at);
CREATE INDEX idx_clarifications_status ON clarifications(status);
CREATE INDEX idx_clarifications_registration ON clarifications(registration_id);
CREATE INDEX idx_logs_entity ON operation_logs(entity_type, entity_id);
CREATE INDEX idx_logs_operator ON operation_logs(operator_id);
CREATE INDEX idx_logs_created ON operation_logs(created_at);

-- 初始数据：创建默认用户
INSERT INTO users (id, username, name, role, password_hash) VALUES
    ('user-001', 'specialist1', '张专员', 'project_specialist', '$2a$10$...'),
    ('user-002', 'secretary1', '李秘书', 'review_secretary', '$2a$10$...'),
    ('user-003', 'finance1', '王财务', 'finance', '$2a$10$...'),
    ('user-004', 'admin1', '系统管理员', 'admin', '$2a$10$...');
```

## 7. 关键技术实现

### 7.1 状态管理策略

使用 Remix 的 Loader 和 Action 进行服务端状态管理，结合 React Context 进行客户端状态管理：

- **服务端状态**：通过 Loader 加载数据，通过 Action 提交修改
- **客户端状态**：使用 React Context 管理用户信息、角色切换、选中记录等
- **表单状态**：使用 Remix Form + Zod 进行表单验证和提交

### 7.2 权限控制实现

```typescript
// 权限中间件示例
const rolePermissions = {
  project_specialist: ['view_registrations', 'process_registrations', 'create_clarifications'],
  review_secretary: ['view_registrations', 'review_clarifications', 'reject_registrations'],
  finance: ['view_registrations', 'confirm_payment', 'export_reports'],
  admin: ['all']
};

function checkPermission(userRole: string, permission: string): boolean {
  if (rolePermissions[userRole].includes('all')) return true;
  return rolePermissions[userRole].includes(permission);
}
```

### 7.3 操作日志记录策略

所有关键操作都会自动记录到 `operation_logs` 表：

- 使用数据库触发器或应用层拦截器自动记录
- 记录操作前后的状态变化
- 记录操作人、操作时间、操作类型、备注
- 支持元数据存储（JSONB 字段）

### 7.4 批量操作实现

```typescript
// 批量操作事务示例
async function batchApproveRegistrations(
  registrationIds: string[],
  handlerId: string,
  handlerRole: string,
  note: string
) {
  return await prisma.$transaction(async (tx) => {
    const results = [];
    for (const id of registrationIds) {
      // 1. 更新状态
      const registration = await tx.bidRegistration.update({
        where: { id },
        data: {
          status: 'approved',
          currentHandlerId: handlerId,
          currentHandlerRole: handlerRole,
          updatedAt: new Date()
        }
      });
      
      // 2. 记录操作日志
      await tx.operationLog.create({
        data: {
          entityType: 'registration',
          entityId: id,
          operationType: 'batch_approve',
          operatorId: handlerId,
          operatorName: '', // 从上下文获取
          operatorRole: handlerRole,
          previousStatus: registration.status,
          newStatus: 'approved',
          note: note
        }
      });
      
      results.push(registration);
    }
    return results;
  });
}
```

### 7.5 角色切换实现

```typescript
// 角色切换逻辑
async function switchUserRole(userId: string, targetRole: string) {
  // 1. 验证用户是否有权限切换到目标角色
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.role !== 'admin') {
    throw new Error('只有管理员可以切换角色');
  }
  
  // 2. 更新 Session 中的当前角色
  session.set('currentRole', targetRole);
  
  // 3. 返回新的权限列表
  return {
    role: targetRole,
    permissions: rolePermissions[targetRole]
  };
}
```

## 8. 部署架构

```mermaid
graph TB
    A[用户浏览器] --> B[CDN]
    B --> C[Remix Server]
    C --> D[PostgreSQL]
    C --> E[Session Store Redis]
    
    subgraph "Production Environment"
        C
        D
        E
    end
```

### 8.1 部署建议

- **前端**：使用 Vercel 或 Cloudflare Pages 部署 Remix 应用
- **数据库**：使用 PostgreSQL 云服务（如 Supabase、Neon、AWS RDS）
- **Session 存储**：使用 Redis 存储会话（可选，也可以使用数据库存储）
- **文件存储**：使用对象存储服务（如 AWS S3、Cloudflare R2）存储附件

### 8.2 环境变量配置

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bid_management"
SESSION_SECRET="your-session-secret"
REDIS_URL="redis://localhost:6379" # 可选
```

## 9. 性能优化策略

### 9.1 数据库优化

- 为常用查询字段创建索引
- 使用分页查询避免大量数据加载
- 使用数据库连接池

### 9.2 前端优化

- 使用 Remix 的自动代码分割
- 图片懒加载
- 列表虚拟化（大量数据时）
- 使用 React.memo 减少不必要的重渲染

### 9.3 缓存策略

- 使用 Remix 的缓存头控制
- 对静态资源使用 CDN 缓存
- 对常用数据使用客户端缓存

## 10. 安全措施

### 10.1 认证与授权

- 使用 Session-based 认证
- 密码使用 bcrypt 加密存储
- 基于角色的访问控制（RBAC）

### 10.2 数据安全

- 所有 API 使用 HTTPS
- 敏感数据加密存储
- SQL 注入防护（使用 Prisma ORM）
- XSS 防护（React 自动转义）

### 10.3 操作审计

- 所有操作记录到 `operation_logs` 表
- 操作日志不可删除或修改
- 支持按时间、操作人、操作类型查询