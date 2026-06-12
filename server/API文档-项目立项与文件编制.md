# 招标代理公司项目立项与文件编制 API 服务层

## 一、核心设计理念

### 1.1 解决一线最常见的三个麻烦

本服务层聚焦招标代理公司一线业务中最容易出现的问题，确保每个环节都有明确的责任人，信息口径统一，过程可追溯。

**责任断层问题**：项目立项与文件编制之间经常出现无人负责的空档，本系统通过明确的项目状态机和自动化的文档创建机制，确保项目立项通过后自动进入文件编制阶段，消除责任空档。

**状态不一致问题**：项目专员、评审秘书、财务人员往往因为信息渠道不同，看到的数据口径不一致。本系统提供统一的数据源，所有角色通过相同的 API 获取数据，确保看到的项目状态完全一致。

**过程黑盒问题**：传统系统中只记录最终结果，不记录变更原因，导致追溯困难。本系统强制要求每次状态变更必须提供 reason 字段，记录完整的变更历史。

### 1.2 状态流转设计

项目立项阶段包含五种状态：草稿（draft）、待初审（initial_review）、待复审（re_review）、立项通过（approved）、已驳回（rejected）。文件编制阶段包含五种状态：待编制（pending）、编制中（drafting）、待审核（review）、已发布（published）、已驳回（rejected）。两个阶段通过立项通过状态自动连接，立项通过后系统自动创建对应的文档记录，状态流转设计确保了责任链的完整性。

## 二、项目立项 API

### 2.1 创建项目立项

创建新项目时需要提供完整的基本信息，系统会自动设置状态为草稿，并创建初始的状态历史记录。

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "XX单位办公楼装修招标",
    "client": "XX单位",
    "budget": 5000000,
    "biddingType": "公开招标",
    "handler": "张三",
    "documentHandler": "李四",
    "reason": "委托单位已完成内部审批流程，项目资金已落实，需要通过招标选择装修施工单位。"
  }'
```

响应示例：

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "XX单位办公楼装修招标",
    "client": "XX单位",
    "budget": 5000000,
    "biddingType": "公开招标",
    "status": "draft",
    "handler": "张三",
    "documentHandler": "李四",
    "reason": "委托单位已完成内部审批流程...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### 2.2 查询项目列表（分页筛选）

支持按状态和处理人筛选，可以指定分页参数，便于前端实现列表展示和分页导航。

```bash
# 查询所有待初审项目
curl "http://localhost:3001/api/projects?status=initial_review&page=1&pageSize=10"

# 查询张三负责的所有项目
curl "http://localhost:3001/api/projects?handler=张三&page=1&pageSize=20"

# 查询已立项通过的项目
curl "http://localhost:3001/api/projects?status=approved&page=1&pageSize=10"
```

响应示例包含分页信息：

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "XX单位办公楼装修招标",
      "status": "initial_review",
      "handler": "张三",
      "documentHandler": "李四"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2.3 查询项目详情（含状态历史）

获取单个项目的完整信息，包括基本信息、当前状态和完整的状态变更历史，便于追溯项目从创建到当前状态的全过程。

```bash
curl http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000
```

状态历史响应示例：

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "XX单位办公楼装修招标",
    "status": "initial_review",
    "handler": "张三",
    "documentHandler": "李四",
    "reason": "委托单位已完成内部审批流程...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "statusHistory": [
      {
        "id": "history-001",
        "fromStatus": null,
        "toStatus": "draft",
        "changedBy": "张三",
        "reason": "创建项目",
        "createdAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": "history-002",
        "fromStatus": "draft",
        "toStatus": "initial_review",
        "changedBy": "张三",
        "reason": "完成项目基本信息，准备提交初审",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 2.4 更新项目状态

状态变更是核心功能，每次变更必须提供变更原因，确保过程可追溯。系统会自动验证状态流转是否合规，不合法的流转会被拒绝。

```bash
# 项目专员提交初审
curl -X PATCH http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: 张三" \
  -d '{
    "status": "initial_review",
    "reason": "完成项目基本信息录入，提交至评审秘书进行初审"
  }'

# 评审秘书初审通过，进入复审
curl -X PATCH http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: 王五" \
  -d '{
    "status": "re_review",
    "reason": "初审通过，项目资料完整，建议进入复审"
  }'

# 评审秘书复审通过，项目立项完成
curl -X PATCH http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: 王五" \
  -d '{
    "status": "approved",
    "reason": "复审通过，项目立项完成，系统将自动创建文件编制任务"
  }'
```

当项目立项通过时，系统会自动创建对应的文档记录，状态为待编制，处理人为 documentHandler 字段指定的人员，确保文件编制工作立即有人负责。

### 2.5 状态流转规则

系统定义了严格的状态流转规则，防止非法操作。草稿状态只能流转到待初审；待初审可以流转到待复审或驳回草稿；待复审可以流转到立项通过或驳回初审；立项通过为终态；已驳回可以重新提交到草稿。这种设计确保了项目必须经过完整的审批流程才能最终立项，同时在任意环节被驳回后可以从头开始。

```bash
# 尝试非法状态流转（从草稿直接到立项通过）会被拒绝
curl -X PATCH http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: 张三" \
  -d '{
    "status": "approved",
    "reason": "跳过审批流程"
  }'
```

## 三、文件编制 API

### 3.1 查询文件列表

获取所有文件编制任务，可以按项目或状态筛选，支持跨项目查看所有文件。

```bash
# 查询所有文件
curl "http://localhost:3001/api/documents"

# 查询指定项目的文件
curl "http://localhost:3001/api/documents?projectId=550e8400-e29b-41d4-a716-446655440000"

# 查询待审核的文件（评审秘书视角）
curl "http://localhost:3001/api/documents?status=review"
```

### 3.2 查询文件详情（含答疑记录和评标安排）

获取文件的完整信息，包括从项目继承的基本信息、答疑记录和评标安排。这是文件编制的核心数据集合。

```bash
curl http://localhost:3001/api/documents/doc-id-001
```

响应示例：

```json
{
  "success": true,
  "data": {
    "id": "doc-id-001",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "projectName": "XX单位办公楼装修招标",
    "status": "drafting",
    "content": "# 招标文件\n\n## 1. 招标范围\n\n本项目包括以下内容...\n\n## 2. 投标人资格要求\n\n...",
    "handler": "李四",
    "qaRecords": [
      {
        "id": "qa-001",
        "question": "招标文件第5条关于工期要求如何理解？",
        "answer": "工期要求为中标后60日历天内完成，具体以合同约定为准。",
        "answeredBy": "李四",
        "answeredAt": "2024-01-16T14:30:00.000Z"
      }
    ],
    "evaluation": {
      "id": "eval-001",
      "documentId": "doc-id-001",
      "scheduledAt": "2024-01-25T09:00:00.000Z",
      "location": "评标室A",
      "evaluators": ["评委甲", "评委乙", "评委丙", "评委丁", "评委戊"],
      "status": "pending"
    },
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-16T15:00:00.000Z",
    "publishedAt": null
  }
}
```

### 3.3 更新文件内容

文件编制负责人可以更新文件内容，编辑操作会更新时间戳，便于追踪最后修改时间。

```bash
curl -X PATCH http://localhost:3001/api/documents/doc-id-001 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# 招标文件\n\n## 1. 招标范围\n\n本项目包括办公楼室内装修、机电安装等内容...\n\n## 2. 投标人资格要求\n\n具有建筑装饰装修工程专业承包二级及以上资质...\n\n## 3. 评标办法\n\n采用综合评分法，技术标占60分，商务标占40分...",
    "handler": "李四"
  }'
```

### 3.4 添加答疑记录

答疑记录是文件编制过程中的重要环节，记录潜在投标人的问题和代理公司的解答，便于后续追溯和审计。

```bash
curl -X POST http://localhost:3001/api/documents/doc-id-001/qa-records \
  -H "Content-Type: application/json" \
  -d '{
    "question": "招标文件第8条资质要求中，关于项目经理的要求是什么？",
    "answer": "项目经理须具有建筑工程专业二级及以上注册建造师资格，并具有5年以上施工现场管理经验。",
    "answeredBy": "李四"
  }'
```

### 3.5 安排评标

在文件发布前需要安排评标的时间、地点和评委，系统会记录完整的评标信息。

```bash
curl -X POST http://localhost:3001/api/documents/doc-id-001/evaluation \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledAt": "2024-01-25T09:00:00Z",
    "location": "评标室A",
    "evaluators": ["评委甲", "评委乙", "评委丙", "评委丁", "评委戊"]
  }'
```

### 3.6 更新文件状态

文件的状态流转需要遵循预定义的规则，待编制可以进入编制中，编制中可以进入待审核或退回待编制，待审核可以进入已发布或退回编制中，已发布为终态不可修改。

```bash
# 文件编制完成，提交审核
curl -X PATCH http://localhost:3001/api/documents/doc-id-001/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: 李四" \
  -d '{
    "status": "review",
    "reason": "招标文件编制完成，已添加答疑记录和评标安排，提交评审秘书审核"
  }'

# 评审秘书审核通过，发布文件
curl -X PATCH http://localhost:3001/api/documents/doc-id-001/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: 王五" \
  -d '{
    "status": "published",
    "reason": "审核通过，文件内容完整，答疑记录清晰，评标安排合理"
  }'
```

## 四、状态历史查询

### 4.1 查询项目的所有状态变更

```bash
curl "http://localhost:3001/api/status-history?entityType=project&entityId=550e8400-e29b-41d4-a716-446655440000"
```

### 4.2 查询文件的所有状态变更

```bash
curl "http://localhost:3001/api/status-history?entityType=document&entityId=doc-id-001"
```

### 4.3 查询所有项目的状态变更记录

```bash
curl "http://localhost:3001/api/status-history?entityType=project"
```

## 五、错误码体系

系统定义了清晰的错误码体系，便于前端进行错误处理和用户提示。

PROJECT_001 表示项目不存在，通常是因为项目 ID 有误或已被删除，建议用户刷新列表或检查项目 ID。PROJECT_002 表示状态流转不合规，常见原因包括跳过了中间审批环节或从终态进行状态变更，建议用户查看当前项目状态和允许的流转路径。PROJECT_003 表示缺少必填字段，通常是因为必填字段为空，建议用户检查表单填写是否完整。DOCUMENT_001 表示文档不存在，与项目不存在类似，可能是 ID 有误。DOCUMENT_002 是一个多含义错误码，可能表示文档已发布无法编辑、状态流转不合规或缺少必填字段，需要根据错误消息具体判断。AUTH_001 和 AUTH_002 分别表示未登录和权限不足，在实际部署时需要配合认证系统使用。

```json
{
  "success": false,
  "error": {
    "code": "PROJECT_002",
    "message": "状态流转不合规：当前状态为 draft，只能流转到 initial_review"
  }
}
```

## 六、统一数据看板

### 6.1 获取统计数据

提供统一的数据统计接口，返回项目状态统计、文档状态统计和待处理任务列表，便于前端构建统一工作台。

```bash
curl http://localhost:3001/api/stats
```

响应示例：

```json
{
  "success": true,
  "data": {
    "projectStats": {
      "draft": 5,
      "initial_review": 3,
      "re_review": 2,
      "approved": 15,
      "rejected": 1
    },
    "documentStats": {
      "pending": 10,
      "drafting": 8,
      "review": 5,
      "published": 25,
      "rejected": 2
    },
    "pendingTasks": [
      {
        "id": "task-001",
        "type": "project",
        "title": "YY学校智慧教室设备采购",
        "status": "initial_review"
      },
      {
        "id": "task-002",
        "type": "document",
        "title": "XX单位办公楼装修招标",
        "status": "drafting"
      }
    ]
  }
}
```

## 七、简化点说明

### 7.1 权限简化

当前实现采用基于角色的粗粒度权限控制，主要区分三个角色：项目专员负责发起立项和跟进文件编制；评审秘书负责审核立项申请和文件内容；财务人员负责费用确认和保证金管理。系统未实现数据级别的权限隔离，即同一个项目的信息所有角色都可以查看。未实现字段级别的权限控制，所有有权限访问项目的人员都可以查看和编辑所有字段。在实际生产环境中，如果需要更细粒度的权限控制，可以在路由层添加角色检查中间件。

### 7.2 附件简化

当前系统支持基本的附件上传下载功能，但不做版本管理。每次上传会覆盖之前的附件，不保留历史版本。不提供在线预览功能，只能下载后查看。附件存储使用本地文件系统，路径为 uploads 目录，在生产环境中建议使用对象存储服务如七牛云、阿里云 OSS 或 AWS S3。附件相关的 API 包括上传附件（需要 multipart/form-data 格式）和下载附件（通过静态文件服务）。

### 7.3 通知简化

当前系统不提供外部通知功能，只在数据库中记录状态变更信息。消息通知采用站内消息模式，存储在数据库中，通过查询接口获取。未实现邮件推送、短信推送或微信推送等外部通知渠道。未实现实时推送机制，前端需要通过轮询或手动刷新获取最新状态。如果需要通知功能，建议在状态变更时调用外部通知服务，发送邮件或短信。

### 7.4 外部系统简化

系统预留了接口定义，但未实现与外部系统的真实集成。委托单位系统对接预留了委托单位信息录入接口，但不做真实的项目对接。财务系统对接预留了费用确认接口，但不做真实的财务凭证同步。评标专家库对接预留了评委选择接口，但不做真实的专家库对接。单点登录预留了用户认证接口，但使用简单的用户 ID 头信息，不做真实的 SSO 集成。在实际部署时，需要根据具体的业务需求和网络环境，实现与这些外部系统的对接。

## 八、服务层验收要点

验收服务层时应该关注以下几个方面：项目立项处理能够正确创建项目、查询列表、查询详情、更新状态，且状态流转符合定义的规则，立项通过后自动创建文档记录。分页筛选能够正确处理分页参数，返回正确的总数和分页数据，支持按状态和处理人筛选。文件编制回看能够查询文件列表、查询文件详情包含答疑记录和评标安排、添加答疑记录、安排评标、查询状态历史追溯变更过程。错误码能够正确返回各种错误场景的错误码和消息，状态流转验证能够拒绝不合规的流转操作。

## 九、快速启动

服务层已经完整实现，可以通过以下步骤快速启动和测试。首先安装依赖，在 server 目录下执行 npm install。然后启动服务器，执行 npm start，服务器会在 http://localhost:3001 上运行。系统会自动初始化数据库并插入测试数据。测试接口可以使用上面提供的 curl 命令进行测试，或使用 Postman、Apifox 等工具导入 API 定义进行测试。

## 十、数据初始化

系统首次启动时会自动创建以下测试数据：三个项目分别是 XX 单位办公楼装修招标（已立项通过，负责人张三，文件负责人李四）、YY 学校智慧教室设备采购（待初审，负责人张三，文件负责人王五）、ZZ 医院信息系统升级（草稿，负责人李四，文件负责人王五）。XX 单位办公楼装修招标项目已自动创建对应的文档，处于编制中状态，包含一条答疑记录和评标安排。这些测试数据可以用于快速验证系统功能和前端开发调试。
