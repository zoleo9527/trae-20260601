export const API_DOCUMENTATION = {
  baseUrl: "/api",

  endpoints: {
    "GET /api/test-records": {
      description: "查询测试记录列表或单条记录",
      params: {
        projectId: { type: "string", required: true, description: "项目ID" },
        id: { type: "string", required: false, description: "传 id 则返回单条详情+可用流转" },
        status: { type: "enum", required: false, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "按状态筛选" },
        holderRole: { type: "enum", required: false, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "按当前持有人角色筛选" },
        role: { type: "enum", required: false, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "查详情时传此参数获取可用流转" },
      },
      response: {
        records: "Array<TestRecord>（列表模式）",
        record: "TestRecord & { reworkOrders, stateTransitions, handoverLogs, attachments, materialRequisitions, cableRoutes }（详情模式）",
        availableTransitions: "TransitionRule[]（详情+role模式）",
      },
    },

    "POST /api/test-records": {
      description: "创建测试记录 / 状态流转 / 补充材料",
      body: {
        create: {
          action: { value: "create", description: "操作类型" },
          projectId: { type: "string", required: true, description: "项目ID" },
          testItem: { type: "string", required: true, description: "测试项目" },
          testMethod: { type: "string", description: "测试方法" },
          testResult: { type: "string", description: "测试结果" },
          conclusion: { type: "string", description: "结论" },
          holderId: { type: "string", required: true, description: "持有人ID（施工班组）" },
        },
        transition: {
          action: { value: "transition", description: "操作类型" },
          testRecordId: { type: "string", required: true, description: "测试记录ID" },
          fromStatus: { type: "enum", required: true, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "当前状态" },
          toStatus: { type: "enum", required: true, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "目标状态" },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "操作人角色" },
          operatorId: { type: "string", required: true, description: "操作人ID" },
          operatorName: { type: "string", description: "操作人姓名" },
          remark: { type: "string", description: "备注" },
          idempotencyKey: { type: "string", description: "幂等键，相同key不重复执行" },
        },
        supplement: {
          action: { value: "supplement", description: "补充材料操作" },
          testRecordId: { type: "string", required: true, description: "测试记录ID" },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"] },
          operatorId: { type: "string", required: true },
          operatorName: { type: "string" },
          category: { type: "enum", required: true, enum: ["WIRING_DIAGRAM", "MATERIAL_REQUISITION", "SITE_PHOTO", "COMPLETION_DOCUMENT", "OTHER"], description: "材料类别" },
          files: { type: "Array<{fileName,filePath,fileSize,mimeType}>", required: true, description: "文件列表" },
          remark: { type: "string", description: "补充说明" },
        },
      },
      idempotent: "transition 操作支持 idempotencyKey，相同 key 的请求不会重复执行，直接返回上次结果",
    },

    "GET /api/rework-orders": {
      description: "查询返工整改单（非独立菜单，嵌入测试记录详情）",
      params: {
        id: { type: "string", description: "整改单ID，传则返回详情+可用流转" },
        testRecordId: { type: "string", description: "测试记录ID，传则返回该记录下所有整改单" },
        role: { type: "enum", enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "查详情时获取可用流转" },
      },
    },

    "POST /api/rework-orders": {
      description: "返工整改状态流转 / 补充材料",
      body: {
        transition: {
          action: { value: "transition", description: "状态流转操作" },
          reworkOrderId: { type: "string", required: true },
          fromStatus: { type: "enum", required: true, enum: ["GENERATED", "ASSIGNED", "RECTIFYING", "RESUBMITTED", "VERIFIED", "CLOSED"] },
          toStatus: { type: "enum", required: true, enum: ["GENERATED", "ASSIGNED", "RECTIFYING", "RESUBMITTED", "VERIFIED", "CLOSED"] },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"] },
          operatorId: { type: "string", required: true },
          operatorName: { type: "string" },
          rectifyMethod: { type: "string", description: "整改方法（RECTIFYING→RESUBMITTED时填写）" },
          remark: { type: "string" },
          idempotencyKey: { type: "string", description: "幂等键" },
        },
        supplement: {
          action: { value: "supplement", description: "补充整改材料" },
          reworkOrderId: { type: "string", required: true },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"] },
          operatorId: { type: "string", required: true },
          category: { type: "enum", required: true, enum: ["WIRING_DIAGRAM", "MATERIAL_REQUISITION", "SITE_PHOTO", "COMPLETION_DOCUMENT", "OTHER"] },
          files: { type: "Array<{fileName,filePath,fileSize,mimeType}>", required: true },
          remark: { type: "string" },
        },
      },
    },

    "GET /api/handover": {
      description: "查询催办日志 / 交接时间线",
      params: {
        entityType: { type: "enum", enum: ["TEST_RECORD", "REWORK_ORDER"], description: "实体类型" },
        entityId: { type: "string", description: "实体ID" },
        testRecordId: { type: "string", description: "测试记录ID（查交接时间线）" },
        reworkOrderId: { type: "string", description: "整改单ID（查交接时间线）" },
      },
    },

    "POST /api/handover": {
      description: "催办操作",
      body: {
        entityType: { type: "enum", required: true, enum: ["TEST_RECORD", "REWORK_ORDER"] },
        entityId: { type: "string", required: true },
        urgentByRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "催办人角色" },
        urgentById: { type: "string", required: true, description: "催办人ID" },
        urgentByName: { type: "string", description: "催办人姓名" },
        urgentToRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "被催办人角色" },
        urgentToId: { type: "string", required: true, description: "被催办人ID" },
        urgentToName: { type: "string", description: "被催办人姓名" },
        reason: { type: "string", required: true, description: "催办原因" },
      },
    },
  },

  stateMachine: {
    testRecord: {
      description: "测试记录状态机",
      flow: [
        "DRAFT → SUBMITTED（施工班组提交，交接给项目负责人）",
        "SUBMITTED → UNDER_REVIEW（项目负责人开始审核）",
        "UNDER_REVIEW → ACCEPTED（审核通过，交接给资料员归档）",
        "UNDER_REVIEW → REJECTED（审核退回，自动生成返工整改单，交接回施工班组）",
        "REJECTED → SUBMITTED（施工班组整改后重新提交）",
        "REJECTED → DRAFT（施工班组需要补充材料）",
        "SUBMITTED → DRAFT（项目负责人退回要求补充材料）",
        "ACCEPTED → ARCHIVED（资料员归档）",
      ],
      constraint: "每次状态变更写入 StateTransition（操作人、角色、时间、幂等键），需交接时同步写 HandoverLog",
    },
    reworkOrder: {
      description: "返工整改单状态机（非独立菜单，挂在测试记录下）",
      flow: [
        "GENERATED → ASSIGNED（项目负责人分配整改任务给施工班组）",
        "ASSIGNED → RECTIFYING（施工班组开始整改）",
        "RECTIFYING → RESUBMITTED（施工班组提交整改结果给项目负责人验证）",
        "RESUBMITTED → VERIFIED（项目负责人验证通过，交接给资料员）",
        "RESUBMITTED → RECTIFYING（验证不通过，退回继续整改）",
        "VERIFIED → CLOSED（资料员关闭整改单）",
      ],
      constraint: "整改单全部关闭后，关联测试记录自动从 REJECTED 回退到 DRAFT",
    },
  },

  idempotency: {
    description: "幂等提交机制",
    mechanism: "transition 操作可传 idempotencyKey，系统在 StateTransition 表中用 UNIQUE 约束保证同一 key 只执行一次。重复请求直接返回上次结果，不产生副作用",
    ttl: "IdempotencyRecord 记录 24 小时后过期，过期后 key 可复用",
  },

  roles: {
    PROJECT_MANAGER: { label: "项目负责人", responsibilities: "审核测试记录、分配/验证返工整改、催办" },
    CONSTRUCTION_TEAM: { label: "施工班组", responsibilities: "填写测试记录、提交/重新提交、整改、补充材料" },
    DOCUMENT_CLERK: { label: "资料员", responsibilities: "归档已通过记录、关闭整改单" },
  },
};

export type ApiDocumentation = typeof API_DOCUMENTATION;
