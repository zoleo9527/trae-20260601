export const API_DOCUMENTATION = {
  baseUrl: "/api",

  endpoints: {
    "GET /api/projects": {
      description: "查询项目列表或单个项目",
      params: {
        id: { type: "string", required: false, description: "项目ID，传则返回单个项目详情" },
      },
      response: {
        projects: "Array<Project>（列表模式）",
        project: "Project & { _count }（详情模式）",
      },
    },

    "POST /api/projects": {
      description: "创建项目",
      body: {
        create: {
          action: { value: "create", description: "操作类型" },
          name: { type: "string", required: true, description: "项目名称" },
          code: { type: "string", required: true, description: "项目编码（唯一）" },
          address: { type: "string", required: false, description: "项目地址" },
        },
      },
    },

    "GET /api/test-records": {
      description: "查询测试记录列表或单条记录（含整改明细与交接明细）",
      params: {
        projectId: { type: "string", required: true, description: "项目ID" },
        id: { type: "string", required: false, description: "传 id 则返回单条详情+可用流转+整改明细+交接明细" },
        status: { type: "enum", required: false, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "按状态筛选" },
        holderRole: { type: "enum", required: false, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "按当前持有人角色筛选" },
        role: { type: "enum", required: false, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "查详情时传此参数获取可用流转" },
      },
      response: {
        records: "Array<TestRecord>（列表模式）",
        record: "TestRecord & { reworkOrders, stateTransitions, handoverLogs, attachments, materialRequisitions, cableRoutes }（详情模式）",
        availableTransitions: "TransitionRule[]（详情+role模式）",
        reworkDetail: "Array<{id,code,status,defectDesc,rectifyMethod,deadline,currentHolderRole,currentHolderId,stateTransitions,handoverLogs,attachments}>",
        handoverDetail: "Array<{id,fromRole,fromUserId,fromUserName,toRole,toUserId,toUserName,handoverType,remark,createdAt}>",
        timeline: "Array<HandoverLog & {source: 'TEST_RECORD' | 'REWORK_ORDER'}>（测试记录+关联整改单的交接时间线，按时间升序合并）",
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
          holderName: { type: "string", required: false, description: "持有人姓名" },
        },
        transition: {
          action: { value: "transition", description: "操作类型" },
          testRecordId: { type: "string", required: true, description: "测试记录ID" },
          fromStatus: { type: "enum", required: true, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "当前状态" },
          toStatus: { type: "enum", required: true, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "目标状态" },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "操作人角色" },
          operatorId: { type: "string", required: true, description: "操作人ID" },
          operatorName: { type: "string", description: "操作人姓名" },
          receiverId: { type: "string", required: "有 nextHolderRole 时必填", description: "交接接收人ID（状态流转存在 nextHolderRole 时必须填写，用于落库 currentHolderId 和 HandoverLog.toUserId）" },
          receiverName: { type: "string", required: "有 nextHolderRole 时必填", description: "交接接收人姓名" },
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
      response: {
        record: "完整 TestRecord（含 reworkOrders, handoverLogs, stateTransitions, attachments 等）",
        timeline: "Array<HandoverLog & {source}>",
      },
      idempotent: "transition 操作支持 idempotencyKey，相同 key 的请求不会重复执行，直接返回上次结果",
    },

    "GET /api/rework-orders": {
      description: "查询返工整改单（非独立菜单，嵌入测试记录详情），含整改明细与交接明细",
      params: {
        id: { type: "string", description: "整改单ID，传则返回详情+可用流转+整改明细+交接明细" },
        testRecordId: { type: "string", description: "测试记录ID，传则返回该记录下所有整改单" },
        role: { type: "enum", enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "查详情时获取可用流转" },
      },
      response: {
        order: "ReworkOrder & { testRecord, stateTransitions, handoverLogs, attachments }",
        availableTransitions: "TransitionRule[]",
        reworkDetail: "{id,code,status,defectDesc,rectifyMethod,deadline,currentHolderRole,currentHolderId,stateTransitions,handoverLogs,attachments}",
        timeline: "Array<HandoverLog & {source}>",
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
          receiverId: { type: "string", required: "有 nextHolderRole 时必填", description: "交接接收人ID（状态流转存在 nextHolderRole 时必须填写）" },
          receiverName: { type: "string", required: "有 nextHolderRole 时必填", description: "交接接收人姓名" },
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
      response: {
        order: "完整 ReworkOrder（含 stateTransitions, handoverLogs, attachments）",
        timeline: "Array<HandoverLog & {source}>",
      },
    },

    "GET /api/material-requisitions": {
      description: "查询材料领用单",
      params: {
        projectId: { type: "string", description: "项目ID（与id二选一）" },
        testRecordId: { type: "string", description: "测试记录ID（可选，配合projectId筛选）" },
        id: { type: "string", description: "领用单ID（与projectId二选一）" },
        overOnly: { type: "boolean", description: "只返回超领记录（需配合projectId）" },
      },
    },

    "POST /api/material-requisitions": {
      description: "创建/审批/退回材料领用单",
      body: {
        create: {
          action: { value: "create", description: "创建领用单" },
          projectId: { type: "string", required: true, description: "项目ID" },
          testRecordId: { type: "string", description: "关联测试记录ID" },
          materialName: { type: "string", required: true, description: "材料名称" },
          unit: { type: "string", required: true, description: "单位" },
          plannedQty: { type: "number", required: true, description: "计划数量" },
          applicantId: { type: "string", required: true, description: "申请人ID" },
          applicantName: { type: "string", required: true, description: "申请人姓名" },
        },
        approve: {
          action: { value: "approve", description: "审批通过（自动计算超领）" },
          id: { type: "string", required: true, description: "领用单ID" },
          actualQty: { type: "number", required: true, description: "实际领用数量" },
          approvedById: { type: "string", required: true, description: "审批人ID" },
          approvedByName: { type: "string", required: true, description: "审批人姓名" },
        },
        reject: {
          action: { value: "reject", description: "驳回领用单" },
          id: { type: "string", required: true },
          approvedById: { type: "string", required: true },
          approvedByName: { type: "string", required: true },
        },
        return: {
          action: { value: "return", description: "退回领用单" },
          id: { type: "string", required: true },
          approvedById: { type: "string", required: true },
          approvedByName: { type: "string", required: true },
        },
      },
    },

    "GET /api/cable-routes": {
      description: "查询线缆走向",
      params: {
        projectId: { type: "string", required: true, description: "项目ID" },
        testRecordId: { type: "string", description: "测试记录ID（可选筛选）" },
      },
    },

    "POST /api/cable-routes": {
      description: "创建/更新线缆走向",
      body: {
        create: {
          action: { value: "create", description: "创建线缆走向" },
          projectId: { type: "string", required: true, description: "项目ID" },
          testRecordId: { type: "string", description: "关联测试记录ID" },
          routeName: { type: "string", required: true, description: "路由名称" },
          startPoint: { type: "string", required: true, description: "起点" },
          endPoint: { type: "string", required: true, description: "终点" },
          cableType: { type: "string", required: true, description: "线缆型号" },
          length: { type: "number", required: true, description: "长度（米）" },
          description: { type: "string", description: "备注说明" },
        },
        update: {
          action: { value: "update", description: "更新线缆走向" },
          id: { type: "string", required: true, description: "线缆走向ID" },
          routeName: { type: "string" },
          startPoint: { type: "string" },
          endPoint: { type: "string" },
          cableType: { type: "string" },
          length: { type: "number" },
          description: { type: "string" },
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
      constraint: "每次状态变更写入 StateTransition（操作人、角色、时间、幂等键、关联 testRecordId），需交接时同步写 HandoverLog（含 receiverId/receiverName）",
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
      constraint: "整改单全部关闭后，关联测试记录自动从 REJECTED 回退到 DRAFT；StateTransition 关联 reworkOrderId；HandoverLog 含 receiverId/receiverName",
    },
  },

  idempotency: {
    description: "幂等提交机制",
    mechanism: "transition 操作可传 idempotencyKey，系统在 StateTransition 表中用 UNIQUE 约束保证同一 key 只执行一次。重复请求直接返回上次结果（含完整 record + timeline），不产生副作用",
    ttl: "IdempotencyRecord 记录 24 小时后过期，过期后 key 可复用",
  },

  dataIntegrity: {
    currentHolderId: "状态流转规则存在 nextHolderRole 时，receiverId/receiverName 必填，同时更新 TestRecord/ReworkOrder 的 currentHolderId 为 receiverId",
    handoverReceiver: "HandoverLog 的 toUserId/toUserName 由 transition 接口的 receiverId/receiverName 强制写入，存在 nextHolderRole 的流转不再留空",
    stateTransitionRelation: "StateTransition 通过 testRecordId/reworkOrderId 外键直接关联到对应记录，不再只存 entityType+entityId 泛化字段",
    reworkDetailResponse: "GET 详情接口返回 reworkDetail（整改明细）、handoverDetail（交接明细）和 timeline（合并时间线）；POST transition/supplement 返回完整 record/order + timeline",
    testRecordTimeline: "测试记录接口的 timeline 自动合并其下所有整改单的交接日志，按时间升序排列，source 字段区分来源",
  },

  roles: {
    PROJECT_MANAGER: { label: "项目负责人", responsibilities: "审核测试记录、分配/验证返工整改、催办" },
    CONSTRUCTION_TEAM: { label: "施工班组", responsibilities: "填写测试记录、提交/重新提交、整改、补充材料" },
    DOCUMENT_CLERK: { label: "资料员", responsibilities: "归档已通过记录、关闭整改单" },
  },
};

export type ApiDocumentation = typeof API_DOCUMENTATION;
