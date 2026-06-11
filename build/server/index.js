import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, json } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, useLoaderData, Form, Link } from "@remix-run/react";
import * as isbotModule from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { v4 } from "uuid";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  let prohibitOutOfOrderStreaming = isBotRequest(request.headers.get("user-agent")) || remixContext.isSpaMode;
  return prohibitOutOfOrderStreaming ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function isBotRequest(userAgent) {
  if (!userAgent) {
    return false;
  }
  if ("isbot" in isbotModule && typeof isbotModule.isbot === "function") {
    return isbotModule.isbot(userAgent);
  }
  if ("default" in isbotModule && typeof isbotModule.default === "function") {
    return isbotModule.default(userAgent);
  }
  return false;
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "zh-CN", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
const TEST_RECORD_TRANSITIONS = [
  {
    from: "DRAFT",
    to: "SUBMITTED",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "提交测试记录",
    nextHolderRole: "PROJECT_MANAGER"
  },
  {
    from: "SUBMITTED",
    to: "UNDER_REVIEW",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "开始审核",
    nextHolderRole: "PROJECT_MANAGER"
  },
  {
    from: "UNDER_REVIEW",
    to: "ACCEPTED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "审核通过",
    nextHolderRole: "DOCUMENT_CLERK"
  },
  {
    from: "UNDER_REVIEW",
    to: "REJECTED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "审核退回",
    nextHolderRole: "CONSTRUCTION_TEAM",
    requiresRework: true
  },
  {
    from: "REJECTED",
    to: "SUBMITTED",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "重新提交（整改后）",
    nextHolderRole: "PROJECT_MANAGER"
  },
  {
    from: "ACCEPTED",
    to: "ARCHIVED",
    allowedRoles: ["DOCUMENT_CLERK"],
    action: "归档"
  },
  {
    from: "SUBMITTED",
    to: "DRAFT",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "退回草稿（补充材料）",
    nextHolderRole: "CONSTRUCTION_TEAM",
    requiresSupplement: true
  },
  {
    from: "REJECTED",
    to: "DRAFT",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "退回草稿（补充材料）",
    nextHolderRole: "CONSTRUCTION_TEAM",
    requiresSupplement: true
  }
];
const REWORK_ORDER_TRANSITIONS = [
  {
    from: "GENERATED",
    to: "ASSIGNED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "分配整改任务",
    nextHolderRole: "CONSTRUCTION_TEAM"
  },
  {
    from: "ASSIGNED",
    to: "RECTIFYING",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "开始整改",
    nextHolderRole: "CONSTRUCTION_TEAM"
  },
  {
    from: "RECTIFYING",
    to: "RESUBMITTED",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "提交整改结果",
    nextHolderRole: "PROJECT_MANAGER"
  },
  {
    from: "RESUBMITTED",
    to: "VERIFIED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "验证通过",
    nextHolderRole: "DOCUMENT_CLERK"
  },
  {
    from: "RESUBMITTED",
    to: "RECTIFYING",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "验证不通过，继续整改",
    nextHolderRole: "CONSTRUCTION_TEAM"
  },
  {
    from: "VERIFIED",
    to: "CLOSED",
    allowedRoles: ["DOCUMENT_CLERK"],
    action: "关闭整改单"
  }
];
const TEST_RECORD_MACHINE = {
  transitions: TEST_RECORD_TRANSITIONS
};
const REWORK_ORDER_MACHINE = {
  transitions: REWORK_ORDER_TRANSITIONS
};
function findTransition(config, fromStatus, toStatus, operatorRole) {
  const rule = config.transitions.find(
    (t) => t.from === fromStatus && t.to === toStatus
  );
  if (!rule) return null;
  if (!rule.allowedRoles.includes(operatorRole)) return null;
  return rule;
}
function getAvailableTransitions$1(config, currentStatus, operatorRole) {
  return config.transitions.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(operatorRole)
  );
}
function validateTransition(input, config) {
  const rule = findTransition(config, input.fromStatus, input.toStatus, input.operatorRole);
  if (!rule) {
    return {
      valid: false,
      rule: null,
      error: `不允许从 ${input.fromStatus} 转到 ${input.toStatus}，或角色 ${input.operatorRole} 无权执行此操作`
    };
  }
  return { valid: true, rule };
}
async function listTestRecords(projectId, filters) {
  const where = { projectId };
  if (filters == null ? void 0 : filters.status) where.status = filters.status;
  if (filters == null ? void 0 : filters.holderRole) where.currentHolderRole = filters.holderRole;
  return prisma.testRecord.findMany({
    where,
    include: {
      project: true,
      reworkOrders: {
        include: {
          stateTransitions: { orderBy: { createdAt: "desc" } },
          handoverLogs: { orderBy: { createdAt: "desc" } },
          attachments: { orderBy: { uploadedAt: "desc" } }
        },
        orderBy: { createdAt: "desc" }
      },
      stateTransitions: { orderBy: { createdAt: "desc" } },
      handoverLogs: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      materialRequisitions: true,
      cableRoutes: true
    },
    orderBy: { updatedAt: "desc" }
  });
}
async function getTestRecord(id) {
  return prisma.testRecord.findUnique({
    where: { id },
    include: {
      project: true,
      reworkOrders: {
        include: {
          stateTransitions: { orderBy: { createdAt: "desc" } },
          handoverLogs: { orderBy: { createdAt: "desc" } },
          attachments: { orderBy: { uploadedAt: "desc" } }
        },
        orderBy: { createdAt: "desc" }
      },
      stateTransitions: { orderBy: { createdAt: "asc" } },
      handoverLogs: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      materialRequisitions: true,
      cableRoutes: true
    }
  });
}
async function createTestRecord(data) {
  const count = await prisma.testRecord.count({ where: { projectId: data.projectId } });
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  const code = `${(project == null ? void 0 : project.code) ?? "UNK"}-TR-${String(count + 1).padStart(4, "0")}`;
  return prisma.testRecord.create({
    data: {
      projectId: data.projectId,
      code,
      testItem: data.testItem,
      testMethod: data.testMethod,
      testResult: data.testResult,
      conclusion: data.conclusion,
      status: "DRAFT",
      currentHolderRole: "CONSTRUCTION_TEAM",
      currentHolderId: data.holderId
    }
  });
}
async function transitionTestRecord(input) {
  const idempotencyKey = input.idempotencyKey || v4();
  const existing = await prisma.stateTransition.findUnique({
    where: { idempotencyKey }
  });
  if (existing) {
    return getTestRecord(input.testRecordId);
  }
  const validation = validateTransition(
    {
      entityId: input.testRecordId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      operatorRole: input.operatorRole,
      operatorId: input.operatorId,
      operatorName: input.operatorName
    },
    TEST_RECORD_MACHINE
  );
  if (!validation.valid || !validation.rule) {
    throw new Error(validation.error || "状态流转校验失败");
  }
  const rule = validation.rule;
  const updateData = { status: input.toStatus };
  if (rule.nextHolderRole) {
    updateData.currentHolderRole = rule.nextHolderRole;
  }
  if (input.receiverId && rule.nextHolderRole) {
    updateData.currentHolderId = input.receiverId;
  }
  return prisma.$transaction(async (tx) => {
    await tx.testRecord.update({
      where: { id: input.testRecordId },
      data: updateData
    });
    await tx.stateTransition.create({
      data: {
        entityType: "TEST_RECORD",
        entityId: input.testRecordId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        operatorRole: input.operatorRole,
        operatorId: input.operatorId,
        operatorName: input.operatorName,
        action: rule.action,
        remark: input.remark,
        idempotencyKey,
        testRecordId: input.testRecordId
      }
    });
    if (rule.nextHolderRole) {
      await tx.handoverLog.create({
        data: {
          entityType: "TEST_RECORD",
          entityId: input.testRecordId,
          fromRole: input.operatorRole,
          fromUserId: input.operatorId,
          fromUserName: input.operatorName,
          toRole: rule.nextHolderRole,
          toUserId: input.receiverId || "",
          toUserName: input.receiverName || "",
          handoverType: mapActionToHandoverType$1(rule.action),
          remark: input.remark,
          testRecordId: input.testRecordId
        }
      });
    }
    if (rule.requiresRework && input.toStatus === "REJECTED") {
      const reworkCount = await tx.reworkOrder.count({
        where: { testRecordId: input.testRecordId }
      });
      const testRecord = await tx.testRecord.findUnique({
        where: { id: input.testRecordId }
      });
      await tx.reworkOrder.create({
        data: {
          testRecordId: input.testRecordId,
          code: `${testRecord == null ? void 0 : testRecord.code}-RW-${String(reworkCount + 1).padStart(2, "0")}`,
          defectDesc: input.remark || "审核退回，需整改",
          rectifyMethod: "",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
          status: "GENERATED",
          currentHolderRole: "PROJECT_MANAGER",
          currentHolderId: input.operatorId
        }
      });
    }
    await tx.idempotencyRecord.create({
      data: {
        idempotencyKey,
        responseHash: input.testRecordId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
      }
    });
    return getTestRecord(input.testRecordId);
  });
}
async function supplementMaterial(input) {
  return prisma.$transaction(async (tx) => {
    await tx.handoverLog.create({
      data: {
        entityType: "TEST_RECORD",
        entityId: input.testRecordId,
        fromRole: input.operatorRole,
        fromUserId: input.operatorId,
        fromUserName: input.operatorName,
        toRole: input.operatorRole,
        toUserId: input.operatorId,
        toUserName: input.operatorName,
        handoverType: "SUPPLEMENT",
        remark: input.remark,
        testRecordId: input.testRecordId
      }
    });
    for (const file of input.files) {
      await tx.attachment.create({
        data: {
          entityType: "TEST_RECORD",
          entityId: input.testRecordId,
          category: input.category,
          fileName: file.fileName,
          filePath: file.filePath,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedBy: input.operatorId,
          uploadedByName: input.operatorName,
          testRecordId: input.testRecordId
        }
      });
    }
    return getTestRecord(input.testRecordId);
  });
}
function mapActionToHandoverType$1(action2) {
  if (action2.includes("重新提交")) return "RESUBMIT";
  if (action2.includes("提交")) return "SUBMIT";
  if (action2.includes("通过")) return "APPROVE";
  if (action2.includes("退回")) return "REJECT";
  if (action2.includes("整改")) return "RECTIFY";
  if (action2.includes("验证")) return "VERIFY";
  if (action2.includes("归档")) return "ARCHIVE";
  if (action2.includes("补充")) return "SUPPLEMENT";
  return "SUBMIT";
}
async function listReworkOrders(testRecordId) {
  return prisma.reworkOrder.findMany({
    where: { testRecordId },
    include: {
      testRecord: { select: { id: true, code: true, testItem: true } },
      stateTransitions: { orderBy: { createdAt: "desc" } },
      handoverLogs: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { uploadedAt: "desc" } }
    },
    orderBy: { createdAt: "desc" }
  });
}
async function getReworkOrder(id) {
  return prisma.reworkOrder.findUnique({
    where: { id },
    include: {
      testRecord: {
        include: {
          project: true,
          attachments: true,
          cableRoutes: true,
          materialRequisitions: true
        }
      },
      stateTransitions: { orderBy: { createdAt: "asc" } },
      handoverLogs: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } }
    }
  });
}
async function transitionReworkOrder(input) {
  const idempotencyKey = input.idempotencyKey || v4();
  const existing = await prisma.stateTransition.findUnique({
    where: { idempotencyKey }
  });
  if (existing) {
    return getReworkOrder(input.reworkOrderId);
  }
  const validation = validateTransition(
    {
      entityId: input.reworkOrderId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      operatorRole: input.operatorRole,
      operatorId: input.operatorId,
      operatorName: input.operatorName
    },
    REWORK_ORDER_MACHINE
  );
  if (!validation.valid || !validation.rule) {
    throw new Error(validation.error || "状态流转校验失败");
  }
  const rule = validation.rule;
  const updateData = { status: input.toStatus };
  if (rule.nextHolderRole) {
    updateData.currentHolderRole = rule.nextHolderRole;
  }
  if (input.receiverId && rule.nextHolderRole) {
    updateData.currentHolderId = input.receiverId;
  }
  if (input.rectifyMethod) {
    updateData.rectifyMethod = input.rectifyMethod;
  }
  return prisma.$transaction(async (tx) => {
    const order = await tx.reworkOrder.update({
      where: { id: input.reworkOrderId },
      data: updateData
    });
    await tx.stateTransition.create({
      data: {
        entityType: "REWORK_ORDER",
        entityId: input.reworkOrderId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        operatorRole: input.operatorRole,
        operatorId: input.operatorId,
        operatorName: input.operatorName,
        action: rule.action,
        remark: input.remark,
        idempotencyKey,
        reworkOrderId: input.reworkOrderId
      }
    });
    if (rule.nextHolderRole) {
      await tx.handoverLog.create({
        data: {
          entityType: "REWORK_ORDER",
          entityId: input.reworkOrderId,
          fromRole: input.operatorRole,
          fromUserId: input.operatorId,
          fromUserName: input.operatorName,
          toRole: rule.nextHolderRole,
          toUserId: input.receiverId || "",
          toUserName: input.receiverName || "",
          handoverType: mapActionToHandoverType(rule.action),
          remark: input.remark,
          reworkOrderId: input.reworkOrderId
        }
      });
    }
    await tx.idempotencyRecord.create({
      data: {
        idempotencyKey,
        responseHash: input.reworkOrderId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
      }
    });
    if (input.toStatus === "CLOSED") {
      const testRecord = await tx.testRecord.findUnique({
        where: { id: order.testRecordId }
      });
      if (testRecord && testRecord.status === "REJECTED") {
        const allReworkOrders = await tx.reworkOrder.findMany({
          where: { testRecordId: order.testRecordId }
        });
        const allClosed = allReworkOrders.every((ro) => ro.status === "CLOSED" || ro.id === input.reworkOrderId);
        if (allClosed) {
          await tx.testRecord.update({
            where: { id: order.testRecordId },
            data: { status: "DRAFT", currentHolderRole: "CONSTRUCTION_TEAM" }
          });
          await tx.stateTransition.create({
            data: {
              entityType: "TEST_RECORD",
              entityId: order.testRecordId,
              fromStatus: "REJECTED",
              toStatus: "DRAFT",
              operatorRole: "SYSTEM",
              operatorId: "system",
              operatorName: "系统",
              action: "整改完成自动回退到草稿",
              idempotencyKey: `${idempotencyKey}-auto-reset`,
              testRecordId: order.testRecordId
            }
          });
        }
      }
    }
    return getReworkOrder(input.reworkOrderId);
  });
}
async function supplementReworkAttachment(input) {
  return prisma.$transaction(async (tx) => {
    await tx.handoverLog.create({
      data: {
        entityType: "REWORK_ORDER",
        entityId: input.reworkOrderId,
        fromRole: input.operatorRole,
        fromUserId: input.operatorId,
        fromUserName: input.operatorName,
        toRole: input.operatorRole,
        toUserId: input.operatorId,
        toUserName: input.operatorName,
        handoverType: "SUPPLEMENT",
        remark: input.remark,
        reworkOrderId: input.reworkOrderId
      }
    });
    for (const file of input.files) {
      await tx.attachment.create({
        data: {
          entityType: "REWORK_ORDER",
          entityId: input.reworkOrderId,
          category: input.category,
          fileName: file.fileName,
          filePath: file.filePath,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedBy: input.operatorId,
          uploadedByName: input.operatorName,
          reworkOrderId: input.reworkOrderId
        }
      });
    }
    return getReworkOrder(input.reworkOrderId);
  });
}
function mapActionToHandoverType(action2) {
  if (action2.includes("分配")) return "SUBMIT";
  if (action2.includes("整改")) return "RECTIFY";
  if (action2.includes("重新提交") || action2.includes("提交整改")) return "RESUBMIT";
  if (action2.includes("验证通过")) return "VERIFY";
  if (action2.includes("验证不通过")) return "REJECT";
  if (action2.includes("关闭")) return "ARCHIVE";
  return "SUBMIT";
}
async function createUrgency(input) {
  return prisma.urgencyLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      urgentByRole: input.urgentByRole,
      urgentById: input.urgentById,
      urgentByName: input.urgentByName,
      urgentToRole: input.urgentToRole,
      urgentToId: input.urgentToId,
      urgentToName: input.urgentToName,
      reason: input.reason
    }
  });
}
async function listUrgencyLogs(entityType, entityId) {
  return prisma.urgencyLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" }
  });
}
async function getHandoverTimeline(testRecordId, reworkOrderId) {
  const logs = [];
  if (testRecordId) {
    const recordLogs = await prisma.handoverLog.findMany({
      where: { testRecordId },
      orderBy: { createdAt: "asc" }
    });
    logs.push(...recordLogs.map((l) => ({ ...l, source: "TEST_RECORD" })));
  }
  if (reworkOrderId) {
    const orderLogs = await prisma.handoverLog.findMany({
      where: { reworkOrderId },
      orderBy: { createdAt: "asc" }
    });
    logs.push(...orderLogs.map((l) => ({ ...l, source: "REWORK_ORDER" })));
  }
  logs.sort((a, b) => {
    const ta = a.createdAt;
    const tb = b.createdAt;
    return ta.getTime() - tb.getTime();
  });
  return logs;
}
async function checkIdempotency(idempotencyKey) {
  const existing = await prisma.idempotencyRecord.findUnique({
    where: { idempotencyKey }
  });
  if (!existing) return false;
  if (existing.expiresAt < /* @__PURE__ */ new Date()) {
    await prisma.idempotencyRecord.delete({ where: { idempotencyKey } });
    return false;
  }
  return true;
}
const ROLE_LABELS = {
  PROJECT_MANAGER: "项目负责人",
  CONSTRUCTION_TEAM: "施工班组",
  DOCUMENT_CLERK: "资料员"
};
const TEST_RECORD_STATUS_LABELS = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
  UNDER_REVIEW: "审核中",
  ACCEPTED: "已通过",
  REJECTED: "已退回",
  ARCHIVED: "已归档"
};
const REWORK_ORDER_STATUS_LABELS = {
  GENERATED: "已生成",
  ASSIGNED: "已分配",
  RECTIFYING: "整改中",
  RESUBMITTED: "已重新提交",
  VERIFIED: "已验证",
  CLOSED: "已关闭"
};
const HANDOVER_TYPE_LABELS = {
  SUBMIT: "提交",
  APPROVE: "审批通过",
  REJECT: "退回",
  RECTIFY: "整改",
  RESUBMIT: "重新提交",
  VERIFY: "验证",
  ARCHIVE: "归档",
  SUPPLEMENT: "补充材料"
};
const ATTACHMENT_CATEGORY_LABELS = {
  WIRING_DIAGRAM: "布线图",
  MATERIAL_REQUISITION: "材料领用单",
  SITE_PHOTO: "现场照片",
  COMPLETION_DOCUMENT: "竣工资料",
  OTHER: "其他"
};
async function loader$9({ params, request }) {
  const recordId = params.recordId;
  const record = await getTestRecord(recordId);
  if (!record) throw new Response("Not Found", { status: 404 });
  const url = new URL(request.url);
  const currentRole = url.searchParams.get("role") || "CONSTRUCTION_TEAM";
  const availableTransitions = getAvailableTransitions$1(TEST_RECORD_MACHINE, record.status, currentRole);
  const timeline = await getHandoverTimeline(recordId);
  return json({ record, availableTransitions, currentRole, timeline });
}
async function action$6({ request, params }) {
  const recordId = params.recordId;
  const formData = await request.formData();
  const op = formData.get("_action");
  switch (op) {
    case "transition": {
      const fromStatus = formData.get("fromStatus");
      const toStatus = formData.get("toStatus");
      const operatorRole = formData.get("operatorRole");
      const operatorId = formData.get("operatorId");
      const operatorName = formData.get("operatorName");
      const remark = formData.get("remark");
      const idempotencyKey = formData.get("idempotencyKey");
      await transitionTestRecord({
        testRecordId: recordId,
        fromStatus,
        toStatus,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        remark: remark || void 0,
        idempotencyKey: idempotencyKey || void 0
      });
      break;
    }
    case "supplement": {
      const operatorRole = formData.get("operatorRole");
      const operatorId = formData.get("operatorId");
      const operatorName = formData.get("operatorName");
      const category = formData.get("category");
      const remark = formData.get("remark");
      const fileName = formData.get("fileName");
      await supplementMaterial({
        testRecordId: recordId,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        category,
        files: [{ fileName, filePath: `/uploads/${fileName}`, fileSize: 0, mimeType: "application/octet-stream" }],
        remark: remark || void 0
      });
      break;
    }
    case "rework-transition": {
      const reworkOrderId = formData.get("reworkOrderId");
      const fromStatus = formData.get("fromStatus");
      const toStatus = formData.get("toStatus");
      const operatorRole = formData.get("operatorRole");
      const operatorId = formData.get("operatorId");
      const operatorName = formData.get("operatorName");
      const rectifyMethod = formData.get("rectifyMethod");
      const remark = formData.get("remark");
      await transitionReworkOrder({
        reworkOrderId,
        fromStatus,
        toStatus,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        rectifyMethod: rectifyMethod || void 0,
        remark: remark || void 0
      });
      break;
    }
    case "urge": {
      const urgentByRole = formData.get("urgentByRole");
      const urgentById = formData.get("urgentById");
      const urgentByName = formData.get("urgentByName");
      const urgentToRole = formData.get("urgentToRole");
      const urgentToId = formData.get("urgentToId");
      const urgentToName = formData.get("urgentToName");
      const reason = formData.get("reason");
      await createUrgency({
        entityType: "TEST_RECORD",
        entityId: recordId,
        urgentByRole,
        urgentById,
        urgentByName: urgentByName || "",
        urgentToRole,
        urgentToId,
        urgentToName: urgentToName || "",
        reason
      });
      break;
    }
  }
  return json({ ok: true });
}
const STATUS_COLORS$1 = {
  DRAFT: "#6c757d",
  SUBMITTED: "#0d6efd",
  UNDER_REVIEW: "#fd7e14",
  ACCEPTED: "#198754",
  REJECTED: "#dc3545",
  ARCHIVED: "#495057",
  GENERATED: "#dc3545",
  ASSIGNED: "#fd7e14",
  RECTIFYING: "#0d6efd",
  RESUBMITTED: "#6f42c1",
  VERIFIED: "#198754",
  CLOSED: "#495057"
};
function TestRecordDetail() {
  const { record, availableTransitions, currentRole, timeline } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: "2rem" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs("h1", { children: [
        record.code,
        " - 测试记录详情"
      ] }),
      /* @__PURE__ */ jsx(
        "span",
        {
          style: { padding: "0.3rem 0.8rem", borderRadius: 4, color: "#fff", background: STATUS_COLORS$1[record.status] || "#6c757d", fontSize: 14, fontWeight: 600 },
          children: TEST_RECORD_STATUS_LABELS[record.status] || record.status
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { margin: "0.5rem 0", fontSize: 14, color: "#666" }, children: [
      "当前持有人角色: ",
      /* @__PURE__ */ jsx("strong", { children: ROLE_LABELS[record.currentHolderRole] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }, children: [
      /* @__PURE__ */ jsx("h2", { children: "基本信息" }),
      /* @__PURE__ */ jsx("table", { style: { width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ jsxs("tbody", { children: [
        /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem 0", fontWeight: 600, width: 120 }, children: "测试项目" }),
          /* @__PURE__ */ jsx("td", { children: record.testItem })
        ] }),
        /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem 0", fontWeight: 600 }, children: "测试方法" }),
          /* @__PURE__ */ jsx("td", { children: record.testMethod })
        ] }),
        /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem 0", fontWeight: 600 }, children: "测试结果" }),
          /* @__PURE__ */ jsx("td", { children: record.testResult })
        ] }),
        /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem 0", fontWeight: 600 }, children: "结论" }),
          /* @__PURE__ */ jsx("td", { children: record.conclusion })
        ] }),
        /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem 0", fontWeight: 600 }, children: "创建时间" }),
          /* @__PURE__ */ jsx("td", { children: new Date(record.createdAt).toLocaleString("zh-CN") })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginTop: "1rem", padding: "1rem", border: "1px solid #0d6efd", borderRadius: 4, background: "#f0f7ff" }, children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        "操作面板（当前角色: ",
        ROLE_LABELS[currentRole],
        "）"
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("label", { style: { fontSize: 13 }, children: "切换角色: " }),
        ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"].map((role) => /* @__PURE__ */ jsx(
          "a",
          {
            href: `?role=${role}`,
            style: {
              marginLeft: "0.5rem",
              padding: "0.2rem 0.5rem",
              borderRadius: 4,
              textDecoration: "none",
              color: currentRole === role ? "#fff" : "#0d6efd",
              background: currentRole === role ? "#0d6efd" : "transparent",
              border: "1px solid #0d6efd",
              fontSize: 13
            },
            children: ROLE_LABELS[role]
          },
          role
        ))
      ] }),
      availableTransitions.length === 0 && /* @__PURE__ */ jsx("div", { style: { fontSize: 14, color: "#888" }, children: "当前角色无可用操作" }),
      availableTransitions.map((t) => /* @__PURE__ */ jsxs(Form, { method: "post", style: { margin: "0.5rem 0", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "transition" }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "fromStatus", value: t.from }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "toStatus", value: t.to }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorRole", value: currentRole }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorId", value: `${currentRole}-001` }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorName", value: ROLE_LABELS[currentRole] }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "idempotencyKey", value: `${record.id}-${t.from}-${t.to}-${Date.now()}` }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            style: {
              padding: "0.4rem 0.8rem",
              borderRadius: 4,
              border: "none",
              color: "#fff",
              background: STATUS_COLORS$1[t.to] || "#0d6efd",
              cursor: "pointer",
              fontSize: 13
            },
            children: t.action
          }
        ),
        /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: "#888" }, children: [
          TEST_RECORD_STATUS_LABELS[t.from],
          " → ",
          TEST_RECORD_STATUS_LABELS[t.to]
        ] }),
        /* @__PURE__ */ jsx("input", { name: "remark", placeholder: "备注（选填）", style: { fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #ccc", borderRadius: 4 } })
      ] }, `${t.from}-${t.to}`)),
      currentRole === "CONSTRUCTION_TEAM" && (record.status === "DRAFT" || record.status === "REJECTED") && /* @__PURE__ */ jsxs(Form, { method: "post", style: { margin: "0.5rem 0", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", borderTop: "1px solid #ccc", paddingTop: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "supplement" }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorRole", value: currentRole }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorId", value: `${currentRole}-001` }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorName", value: ROLE_LABELS[currentRole] }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600 }, children: "补充材料:" }),
        /* @__PURE__ */ jsx("select", { name: "category", style: { fontSize: 13, padding: "0.2rem" }, children: Object.entries(ATTACHMENT_CATEGORY_LABELS).map(([k, v]) => /* @__PURE__ */ jsx("option", { value: k, children: v }, k)) }),
        /* @__PURE__ */ jsx("input", { name: "fileName", placeholder: "文件名", required: true, style: { fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #ccc", borderRadius: 4 } }),
        /* @__PURE__ */ jsx("input", { name: "remark", placeholder: "补充说明", style: { fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #ccc", borderRadius: 4 } }),
        /* @__PURE__ */ jsx("button", { type: "submit", style: { padding: "0.4rem 0.8rem", borderRadius: 4, border: "none", color: "#fff", background: "#198754", cursor: "pointer", fontSize: 13 }, children: "提交补充" })
      ] }),
      (currentRole === "PROJECT_MANAGER" || currentRole === "DOCUMENT_CLERK") && /* @__PURE__ */ jsxs(Form, { method: "post", style: { margin: "0.5rem 0", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", borderTop: "1px solid #ccc", paddingTop: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "urge" }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "urgentByRole", value: currentRole }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "urgentById", value: `${currentRole}-001` }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "urgentByName", value: ROLE_LABELS[currentRole] }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "urgentToRole", value: "CONSTRUCTION_TEAM" }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "urgentToId", value: "CONSTRUCTION_TEAM-001" }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "urgentToName", value: "施工班组" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: "#dc3545" }, children: "催办:" }),
        /* @__PURE__ */ jsx("input", { name: "reason", placeholder: "催办原因", required: true, style: { fontSize: 13, padding: "0.2rem 0.5rem", border: "1px solid #dc3545", borderRadius: 4 } }),
        /* @__PURE__ */ jsx("button", { type: "submit", style: { padding: "0.4rem 0.8rem", borderRadius: 4, border: "1px solid #dc3545", background: "#fff", color: "#dc3545", cursor: "pointer", fontSize: 13 }, children: "催办" })
      ] })
    ] }),
    record.reworkOrders.length > 0 && /* @__PURE__ */ jsxs("section", { style: { marginTop: "1rem", padding: "1rem", border: "1px solid #dc3545", borderRadius: 4, background: "#fff5f5" }, children: [
      /* @__PURE__ */ jsx("h2", { children: "返工整改记录（嵌入详情，非独立菜单）" }),
      record.reworkOrders.map((ro) => {
        const reworkTransitions = getAvailableTransitions(REWORK_ORDER_MACHINE, ro.status, currentRole);
        return /* @__PURE__ */ jsxs("div", { style: { margin: "0.5rem 0", padding: "0.75rem", border: "1px solid #e0a0a0", borderRadius: 4, background: "#fff" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx("strong", { children: ro.code }),
            /* @__PURE__ */ jsx("span", { style: { padding: "0.2rem 0.5rem", borderRadius: 4, color: "#fff", fontSize: 12, background: STATUS_COLORS$1[ro.status] || "#6c757d" }, children: REWORK_ORDER_STATUS_LABELS[ro.status] || ro.status })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: "#666", marginTop: "0.3rem" }, children: [
            "缺陷描述: ",
            ro.defectDesc,
            " | 当前持有人: ",
            ROLE_LABELS[ro.currentHolderRole]
          ] }),
          ro.rectifyMethod && /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: "#666" }, children: [
            "整改方法: ",
            ro.rectifyMethod
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: "#888", marginTop: "0.2rem" }, children: [
            "截止: ",
            new Date(ro.deadline).toLocaleDateString("zh-CN"),
            " | 创建: ",
            new Date(ro.createdAt).toLocaleString("zh-CN")
          ] }),
          ro.stateTransitions.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: "0.5rem", fontSize: 12, color: "#888" }, children: [
            /* @__PURE__ */ jsx("strong", { children: "状态变更:" }),
            ro.stateTransitions.map((st) => /* @__PURE__ */ jsxs("div", { style: { marginLeft: "0.5rem" }, children: [
              REWORK_ORDER_STATUS_LABELS[st.fromStatus],
              " → ",
              REWORK_ORDER_STATUS_LABELS[st.toStatus],
              " ",
              "(",
              ROLE_LABELS[st.operatorRole],
              ": ",
              st.operatorName,
              " ",
              st.remark ? `备注: ${st.remark}` : "",
              ")"
            ] }, st.id))
          ] }),
          reworkTransitions.length > 0 && /* @__PURE__ */ jsx("div", { style: { marginTop: "0.5rem" }, children: reworkTransitions.map((rt) => /* @__PURE__ */ jsxs(Form, { method: "post", style: { display: "inline-flex", gap: "0.3rem", alignItems: "center", marginRight: "0.5rem" }, children: [
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "_action", value: "rework-transition" }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "reworkOrderId", value: ro.id }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "fromStatus", value: rt.from }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "toStatus", value: rt.to }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorRole", value: currentRole }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorId", value: `${currentRole}-001` }),
            /* @__PURE__ */ jsx("input", { type: "hidden", name: "operatorName", value: ROLE_LABELS[currentRole] }),
            rt.to === "RESUBMITTED" && /* @__PURE__ */ jsx("input", { name: "rectifyMethod", placeholder: "整改方法", style: { fontSize: 12, padding: "0.2rem 0.4rem", border: "1px solid #ccc", borderRadius: 4 } }),
            /* @__PURE__ */ jsx("input", { name: "remark", placeholder: "备注", style: { fontSize: 12, padding: "0.2rem 0.4rem", border: "1px solid #ccc", borderRadius: 4 } }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                style: { padding: "0.2rem 0.5rem", borderRadius: 4, border: "none", color: "#fff", background: STATUS_COLORS$1[rt.to] || "#0d6efd", cursor: "pointer", fontSize: 12 },
                children: rt.action
              }
            )
          ] }, `${rt.from}-${rt.to}`)) }),
          ro.attachments.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: "0.5rem", fontSize: 12 }, children: [
            /* @__PURE__ */ jsx("strong", { children: "附件:" }),
            ro.attachments.map((a) => /* @__PURE__ */ jsxs("span", { style: { marginLeft: "0.5rem", color: "#0066cc" }, children: [
              "[",
              ATTACHMENT_CATEGORY_LABELS[a.category],
              "] ",
              a.fileName
            ] }, a.id))
          ] })
        ] }, ro.id);
      })
    ] }),
    record.stateTransitions.length > 0 && /* @__PURE__ */ jsxs("section", { style: { marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }, children: [
      /* @__PURE__ */ jsx("h2", { children: "状态变更记录（数据驱动，非页面写死）" }),
      /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "2px solid #ddd" }, children: [
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "时间" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "操作" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "状态变更" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "操作人" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "备注" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: record.stateTransitions.map((st) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #eee" }, children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem" }, children: new Date(st.createdAt).toLocaleString("zh-CN") }),
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem" }, children: st.action }),
          /* @__PURE__ */ jsxs("td", { style: { padding: "0.3rem" }, children: [
            TEST_RECORD_STATUS_LABELS[st.fromStatus] || st.fromStatus,
            " → ",
            TEST_RECORD_STATUS_LABELS[st.toStatus] || st.toStatus
          ] }),
          /* @__PURE__ */ jsxs("td", { style: { padding: "0.3rem" }, children: [
            ROLE_LABELS[st.operatorRole],
            ": ",
            st.operatorName
          ] }),
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem", color: "#888" }, children: st.remark || "-" })
        ] }, st.id)) })
      ] })
    ] }),
    (record.attachments.length > 0 || record.materialRequisitions.length > 0 || record.cableRoutes.length > 0) && /* @__PURE__ */ jsxs("section", { style: { marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }, children: [
      /* @__PURE__ */ jsx("h2", { children: "交接材料" }),
      record.attachments.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginBottom: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("strong", { children: "附件:" }),
        record.attachments.map((a) => /* @__PURE__ */ jsxs("div", { style: { marginLeft: "1rem", fontSize: 13 }, children: [
          /* @__PURE__ */ jsxs("span", { style: { color: "#0066cc" }, children: [
            "[",
            ATTACHMENT_CATEGORY_LABELS[a.category],
            "]"
          ] }),
          " ",
          a.fileName,
          " - ",
          a.uploadedByName,
          " (",
          new Date(a.uploadedAt).toLocaleString("zh-CN"),
          ")"
        ] }, a.id))
      ] }),
      record.cableRoutes.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginBottom: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("strong", { children: "线缆走向:" }),
        record.cableRoutes.map((cr) => /* @__PURE__ */ jsxs("div", { style: { marginLeft: "1rem", fontSize: 13 }, children: [
          cr.routeName,
          ": ",
          cr.startPoint,
          " → ",
          cr.endPoint,
          " (",
          cr.cableType,
          ", ",
          cr.length,
          "m)"
        ] }, cr.id))
      ] }),
      record.materialRequisitions.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "材料领用:" }),
        record.materialRequisitions.map((mr) => /* @__PURE__ */ jsxs("div", { style: { marginLeft: "1rem", fontSize: 13 }, children: [
          mr.materialName,
          ": 计划 ",
          mr.plannedQty,
          mr.unit,
          " / 实际 ",
          mr.actualQty,
          mr.unit,
          mr.overQty > 0 && /* @__PURE__ */ jsxs("span", { style: { color: "#dc3545" }, children: [
            " (超领 ",
            mr.overQty,
            mr.unit,
            ")"
          ] })
        ] }, mr.id))
      ] })
    ] }),
    timeline.length > 0 && /* @__PURE__ */ jsxs("section", { style: { marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }, children: [
      /* @__PURE__ */ jsx("h2", { children: "交接时间线" }),
      timeline.map((log, idx) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.5rem", alignItems: "baseline", fontSize: 13, margin: "0.3rem 0" }, children: [
        /* @__PURE__ */ jsx("span", { style: { color: "#888", whiteSpace: "nowrap" }, children: new Date(log.createdAt).toLocaleString("zh-CN") }),
        /* @__PURE__ */ jsx("span", { style: { padding: "0.1rem 0.3rem", borderRadius: 3, background: "#e9ecef", fontSize: 12 }, children: log.source === "REWORK_ORDER" ? "整改" : "测试" }),
        /* @__PURE__ */ jsxs("span", { children: [
          ROLE_LABELS[log.fromRole],
          "(",
          String(log.fromUserName),
          ") → ",
          ROLE_LABELS[log.toRole],
          "(",
          String(log.toUserName),
          ")"
        ] }),
        /* @__PURE__ */ jsx("span", { style: { color: "#0066cc" }, children: HANDOVER_TYPE_LABELS[log.handoverType] }),
        Boolean(log.remark) && /* @__PURE__ */ jsxs("span", { style: { color: "#888" }, children: [
          "- ",
          String(log.remark)
        ] })
      ] }, idx))
    ] })
  ] });
}
function getAvailableTransitions(machine, status, role) {
  return machine.transitions.filter(
    (t) => t.from === status && t.allowedRoles.includes(role)
  );
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: TestRecordDetail,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
async function loader$8({ params }) {
  const projectId = params.projectId;
  const records = await listTestRecords(projectId);
  return json({ records, projectId });
}
const STATUS_COLORS = {
  DRAFT: "#6c757d",
  SUBMITTED: "#0d6efd",
  UNDER_REVIEW: "#fd7e14",
  ACCEPTED: "#198754",
  REJECTED: "#dc3545",
  ARCHIVED: "#495057"
};
function TestRecordList() {
  const { records, projectId } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: "2rem" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsx("h1", { children: "测试记录" }),
      /* @__PURE__ */ jsx(Link, { to: "/projects", style: { color: "#0066cc" }, children: "← 返回项目列表" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { margin: "1rem 0", padding: "0.75rem", background: "#e8f4f8", borderRadius: 4, fontSize: 14 }, children: [
      /* @__PURE__ */ jsx("strong", { children: "角色筛选：" }),
      [["PROJECT_MANAGER", "项目负责人"], ["CONSTRUCTION_TEAM", "施工班组"], ["DOCUMENT_CLERK", "资料员"]].map(([role, label]) => /* @__PURE__ */ jsx(
        Link,
        {
          to: `/projects/${projectId}/test-records?holderRole=${role}`,
          style: { marginLeft: "0.5rem", color: "#0066cc" },
          children: label
        },
        role
      ))
    ] }),
    records.length === 0 && /* @__PURE__ */ jsx("div", { style: { padding: "1rem", background: "#fff3cd", borderRadius: 4 }, children: "暂无测试记录" }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: records.map((r) => /* @__PURE__ */ jsxs(
      Link,
      {
        to: `/projects/${projectId}/test-records/${r.id}`,
        style: { padding: "1rem", border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", display: "flex", justifyContent: "space-between", alignItems: "center" },
        children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: r.code }),
            /* @__PURE__ */ jsx("span", { style: { marginLeft: "0.5rem" }, children: r.testItem })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: "#888" }, children: [
              "当前: ",
              ROLE_LABELS[r.currentHolderRole] || r.currentHolderRole
            ] }),
            /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  padding: "0.2rem 0.5rem",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: 12,
                  background: STATUS_COLORS[r.status] || "#6c757d"
                },
                children: TEST_RECORD_STATUS_LABELS[r.status] || r.status
              }
            ),
            r.reworkOrders.length > 0 && /* @__PURE__ */ jsxs("span", { style: { padding: "0.2rem 0.5rem", borderRadius: 4, color: "#fff", fontSize: 12, background: "#dc3545" }, children: [
              "整改 ",
              r.reworkOrders.length
            ] })
          ] })
        ]
      },
      r.id
    )) })
  ] });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: TestRecordList,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
async function createMaterialRequisition(data) {
  return prisma.materialRequisition.create({
    data: {
      projectId: data.projectId,
      testRecordId: data.testRecordId,
      materialName: data.materialName,
      unit: data.unit,
      plannedQty: data.plannedQty,
      status: "PENDING",
      applicantId: data.applicantId,
      applicantName: data.applicantName
    }
  });
}
async function approveMaterialRequisition(id, actualQty, approvedById, approvedByName) {
  const requisition = await prisma.materialRequisition.findUnique({ where: { id } });
  if (!requisition) throw new Error("材料领用单不存在");
  const overQty = Math.max(0, actualQty - requisition.plannedQty);
  return prisma.materialRequisition.update({
    where: { id },
    data: {
      actualQty,
      overQty,
      status: "APPROVED",
      approvedById,
      approvedByName
    }
  });
}
async function rejectMaterialRequisition(id, approvedById, approvedByName) {
  return prisma.materialRequisition.update({
    where: { id },
    data: {
      status: "REJECTED",
      approvedById,
      approvedByName
    }
  });
}
async function returnMaterialRequisition(id, approvedById, approvedByName) {
  return prisma.materialRequisition.update({
    where: { id },
    data: {
      status: "RETURNED",
      approvedById,
      approvedByName
    }
  });
}
async function listOverRequisitions(projectId) {
  return prisma.materialRequisition.findMany({
    where: { projectId, overQty: { gt: 0 } },
    orderBy: { overQty: "desc" }
  });
}
async function loader$7({ request }) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const testRecordId = url.searchParams.get("testRecordId");
  const id = url.searchParams.get("id");
  if (id) {
    const requisition = await prisma.materialRequisition.findUnique({ where: { id } });
    if (!requisition) return json({ error: "材料领用单不存在" }, { status: 404 });
    return json({ requisition });
  }
  if (projectId) {
    const overOnly = url.searchParams.get("overOnly") === "true";
    if (overOnly) {
      const requisitions2 = await listOverRequisitions(projectId);
      return json({ requisitions: requisitions2 });
    }
    const where = { projectId };
    if (testRecordId) where.testRecordId = testRecordId;
    const requisitions = await prisma.materialRequisition.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
    return json({ requisitions });
  }
  return json({ error: "projectId 或 id 必填" }, { status: 400 });
}
async function action$5({ request }) {
  const body = await request.json();
  const { action: op } = body;
  switch (op) {
    case "create": {
      const { projectId, testRecordId, materialName, unit, plannedQty, applicantId, applicantName } = body;
      if (!projectId || !materialName || !unit || plannedQty === void 0 || !applicantId || !applicantName) {
        return json({ error: "projectId, materialName, unit, plannedQty, applicantId, applicantName 必填" }, { status: 400 });
      }
      const requisition = await createMaterialRequisition({
        projectId,
        testRecordId,
        materialName,
        unit,
        plannedQty,
        applicantId,
        applicantName
      });
      return json({ requisition }, { status: 201 });
    }
    case "approve": {
      const { id, actualQty, approvedById, approvedByName } = body;
      if (!id || actualQty === void 0 || !approvedById || !approvedByName) {
        return json({ error: "id, actualQty, approvedById, approvedByName 必填" }, { status: 400 });
      }
      const requisition = await approveMaterialRequisition(id, actualQty, approvedById, approvedByName);
      return json({ requisition });
    }
    case "reject": {
      const { id, approvedById, approvedByName } = body;
      if (!id || !approvedById || !approvedByName) {
        return json({ error: "id, approvedById, approvedByName 必填" }, { status: 400 });
      }
      const requisition = await rejectMaterialRequisition(id, approvedById, approvedByName);
      return json({ requisition });
    }
    case "return": {
      const { id, approvedById, approvedByName } = body;
      if (!id || !approvedById || !approvedByName) {
        return json({ error: "id, approvedById, approvedByName 必填" }, { status: 400 });
      }
      const requisition = await returnMaterialRequisition(id, approvedById, approvedByName);
      return json({ requisition });
    }
    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function loader$6({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const testRecordId = url.searchParams.get("testRecordId");
  if (id) {
    const order = await getReworkOrder(id);
    if (!order) return json({ error: "返工整改单不存在" }, { status: 404 });
    const operatorRole = url.searchParams.get("role");
    const availableTransitions = operatorRole ? getAvailableTransitions$1(REWORK_ORDER_MACHINE, order.status, operatorRole) : [];
    const timeline = await getHandoverTimeline(void 0, id);
    return json({
      order,
      availableTransitions,
      reworkDetail: {
        id: order.id,
        code: order.code,
        status: order.status,
        defectDesc: order.defectDesc,
        rectifyMethod: order.rectifyMethod,
        deadline: order.deadline,
        currentHolderRole: order.currentHolderRole,
        currentHolderId: order.currentHolderId,
        stateTransitions: order.stateTransitions.map((st) => ({
          id: st.id,
          fromStatus: st.fromStatus,
          toStatus: st.toStatus,
          operatorRole: st.operatorRole,
          operatorId: st.operatorId,
          operatorName: st.operatorName,
          action: st.action,
          remark: st.remark,
          createdAt: st.createdAt
        })),
        handoverLogs: order.handoverLogs.map((hl) => ({
          id: hl.id,
          fromRole: hl.fromRole,
          fromUserId: hl.fromUserId,
          fromUserName: hl.fromUserName,
          toRole: hl.toRole,
          toUserId: hl.toUserId,
          toUserName: hl.toUserName,
          handoverType: hl.handoverType,
          remark: hl.remark,
          createdAt: hl.createdAt
        })),
        attachments: order.attachments
      },
      timeline
    });
  }
  if (testRecordId) {
    const orders = await listReworkOrders(testRecordId);
    return json({ orders });
  }
  return json({ error: "id 或 testRecordId 必填" }, { status: 400 });
}
async function action$4({ request }) {
  const body = await request.json();
  const { action: op } = body;
  switch (op) {
    case "transition": {
      const { reworkOrderId, fromStatus, toStatus, operatorRole, operatorId, operatorName, receiverId, receiverName, rectifyMethod, remark, idempotencyKey } = body;
      if (!reworkOrderId || !fromStatus || !toStatus || !operatorRole || !operatorId) {
        return json({ error: "reworkOrderId, fromStatus, toStatus, operatorRole, operatorId 必填" }, { status: 400 });
      }
      if (idempotencyKey) {
        const isDuplicate = await checkIdempotency(idempotencyKey);
        if (isDuplicate) {
          const existing = await getReworkOrder(reworkOrderId);
          const timeline = await getHandoverTimeline(void 0, reworkOrderId);
          return json({ order: existing, timeline, idempotent: true });
        }
      }
      try {
        const order = await transitionReworkOrder({
          reworkOrderId,
          fromStatus,
          toStatus,
          operatorRole,
          operatorId,
          operatorName: operatorName || "",
          receiverId: receiverId || void 0,
          receiverName: receiverName || void 0,
          rectifyMethod,
          remark,
          idempotencyKey
        });
        const timeline = await getHandoverTimeline(void 0, reworkOrderId);
        return json({ order, timeline });
      } catch (e) {
        const message = e instanceof Error ? e.message : "状态流转失败";
        return json({ error: message }, { status: 422 });
      }
    }
    case "supplement": {
      const { reworkOrderId, operatorRole, operatorId, operatorName, category, files, remark } = body;
      if (!reworkOrderId || !operatorRole || !operatorId || !category || !(files == null ? void 0 : files.length)) {
        return json({ error: "reworkOrderId, operatorRole, operatorId, category, files 必填" }, { status: 400 });
      }
      const order = await supplementReworkAttachment({
        reworkOrderId,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        category,
        files,
        remark
      });
      const timeline = await getHandoverTimeline(void 0, reworkOrderId);
      return json({ order, timeline });
    }
    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
async function createCableRoute(data) {
  return prisma.cableRoute.create({ data });
}
async function listCableRoutes(projectId, testRecordId) {
  const where = { projectId };
  if (testRecordId) where.testRecordId = testRecordId;
  return prisma.cableRoute.findMany({ where, orderBy: { createdAt: "desc" } });
}
async function updateCableRoute(id, data) {
  return prisma.cableRoute.update({ where: { id }, data });
}
async function loader$5({ request }) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return json({ error: "projectId 必填" }, { status: 400 });
  }
  const testRecordId = url.searchParams.get("testRecordId") || void 0;
  const routes2 = await listCableRoutes(projectId, testRecordId);
  return json({ routes: routes2 });
}
async function action$3({ request }) {
  const body = await request.json();
  const { action: op } = body;
  switch (op) {
    case "create": {
      const { projectId, testRecordId, routeName, startPoint, endPoint, cableType, length, description } = body;
      if (!projectId || !routeName || !startPoint || !endPoint || !cableType || length === void 0) {
        return json({ error: "projectId, routeName, startPoint, endPoint, cableType, length 必填" }, { status: 400 });
      }
      const route = await createCableRoute({
        projectId,
        testRecordId,
        routeName,
        startPoint,
        endPoint,
        cableType,
        length,
        description
      });
      return json({ route }, { status: 201 });
    }
    case "update": {
      const { id, routeName, startPoint, endPoint, cableType, length, description } = body;
      if (!id) {
        return json({ error: "id 必填" }, { status: 400 });
      }
      const route = await updateCableRoute(id, {
        routeName,
        startPoint,
        endPoint,
        cableType,
        length,
        description
      });
      return json({ route });
    }
    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({ request }) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return json({ error: "projectId 必填" }, { status: 400 });
  }
  const id = url.searchParams.get("id");
  if (id) {
    const record = await getTestRecord(id);
    if (!record) return json({ error: "测试记录不存在" }, { status: 404 });
    const operatorRole = url.searchParams.get("role");
    const availableTransitions = operatorRole ? getAvailableTransitions$1(TEST_RECORD_MACHINE, record.status, operatorRole) : [];
    const timeline = await getHandoverTimeline(id);
    return json({
      record,
      availableTransitions,
      reworkDetail: record.reworkOrders.map((ro) => ({
        id: ro.id,
        code: ro.code,
        status: ro.status,
        defectDesc: ro.defectDesc,
        rectifyMethod: ro.rectifyMethod,
        deadline: ro.deadline,
        currentHolderRole: ro.currentHolderRole,
        currentHolderId: ro.currentHolderId,
        stateTransitions: ro.stateTransitions,
        handoverLogs: ro.handoverLogs,
        attachments: ro.attachments
      })),
      handoverDetail: record.handoverLogs.map((hl) => ({
        id: hl.id,
        fromRole: hl.fromRole,
        fromUserId: hl.fromUserId,
        fromUserName: hl.fromUserName,
        toRole: hl.toRole,
        toUserId: hl.toUserId,
        toUserName: hl.toUserName,
        handoverType: hl.handoverType,
        remark: hl.remark,
        createdAt: hl.createdAt
      })),
      timeline
    });
  }
  const status = url.searchParams.get("status");
  const holderRole = url.searchParams.get("holderRole");
  const records = await listTestRecords(projectId, {
    status: status || void 0,
    holderRole: holderRole || void 0
  });
  return json({ records });
}
async function action$2({ request }) {
  const body = await request.json();
  const { action: op } = body;
  switch (op) {
    case "create": {
      const { projectId, testItem, testMethod, testResult, conclusion, holderId, holderName } = body;
      if (!projectId || !testItem || !holderId) {
        return json({ error: "projectId, testItem, holderId 必填" }, { status: 400 });
      }
      const record = await createTestRecord({
        projectId,
        testItem,
        testMethod: testMethod || "",
        testResult: testResult || "",
        conclusion: conclusion || "",
        holderId
      });
      return json({ record }, { status: 201 });
    }
    case "transition": {
      const { testRecordId, fromStatus, toStatus, operatorRole, operatorId, operatorName, receiverId, receiverName, remark, idempotencyKey } = body;
      if (!testRecordId || !fromStatus || !toStatus || !operatorRole || !operatorId) {
        return json({ error: "testRecordId, fromStatus, toStatus, operatorRole, operatorId 必填" }, { status: 400 });
      }
      if (idempotencyKey) {
        const isDuplicate = await checkIdempotency(idempotencyKey);
        if (isDuplicate) {
          const existing = await getTestRecord(testRecordId);
          const timeline = await getHandoverTimeline(testRecordId);
          return json({ record: existing, timeline, idempotent: true });
        }
      }
      try {
        const record = await transitionTestRecord({
          testRecordId,
          fromStatus,
          toStatus,
          operatorRole,
          operatorId,
          operatorName: operatorName || "",
          receiverId: receiverId || void 0,
          receiverName: receiverName || void 0,
          remark,
          idempotencyKey
        });
        const timeline = await getHandoverTimeline(testRecordId);
        return json({ record, timeline });
      } catch (e) {
        const message = e instanceof Error ? e.message : "状态流转失败";
        return json({ error: message }, { status: 422 });
      }
    }
    case "supplement": {
      const { testRecordId, operatorRole, operatorId, operatorName, category, files, remark } = body;
      if (!testRecordId || !operatorRole || !operatorId || !category || !(files == null ? void 0 : files.length)) {
        return json({ error: "testRecordId, operatorRole, operatorId, category, files 必填" }, { status: 400 });
      }
      const record = await supplementMaterial({
        testRecordId,
        operatorRole,
        operatorId,
        operatorName: operatorName || "",
        category,
        files,
        remark
      });
      const timeline = await getHandoverTimeline(testRecordId);
      return json({ record, timeline });
    }
    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({ request }) {
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (entityType && entityId) {
    const logs = await listUrgencyLogs(entityType, entityId);
    return json({ urgencyLogs: logs });
  }
  const testRecordId = url.searchParams.get("testRecordId");
  const reworkOrderId = url.searchParams.get("reworkOrderId");
  if (testRecordId || reworkOrderId) {
    const timeline = await getHandoverTimeline(testRecordId || void 0, reworkOrderId || void 0);
    return json({ timeline });
  }
  return json({ error: "entityType+entityId 或 testRecordId/reworkOrderId 必填" }, { status: 400 });
}
async function action$1({ request }) {
  const body = await request.json();
  const { urgentByRole, urgentById, urgentByName, urgentToRole, urgentToId, urgentToName, reason, entityType, entityId } = body;
  if (!entityType || !entityId || !urgentByRole || !urgentById || !urgentToRole || !urgentToId || !reason) {
    return json({ error: "entityType, entityId, urgentByRole, urgentById, urgentToRole, urgentToId, reason 必填" }, { status: 400 });
  }
  const log = await createUrgency({
    entityType,
    entityId,
    urgentByRole,
    urgentById,
    urgentByName: urgentByName || "",
    urgentToRole,
    urgentToId,
    urgentToName: urgentToName || "",
    reason
  });
  return json({ urgencyLog: log }, { status: 201 });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { testRecords: true, materialRequisitions: true, cableRoutes: true } }
      }
    });
    if (!project) return json({ error: "项目不存在" }, { status: 404 });
    return json({ project });
  }
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { testRecords: true, materialRequisitions: true, cableRoutes: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return json({ projects });
}
async function action({ request }) {
  const body = await request.json();
  const { action: op } = body;
  switch (op) {
    case "create": {
      const { name, code, address } = body;
      if (!name || !code) {
        return json({ error: "name, code 必填" }, { status: 400 });
      }
      const existing = await prisma.project.findUnique({ where: { code } });
      if (existing) {
        return json({ error: `项目编码 ${code} 已存在` }, { status: 409 });
      }
      const project = await prisma.project.create({
        data: { name, code, address: address || null }
      });
      return json({ project }, { status: 201 });
    }
    default:
      return json({ error: `不支持的操作: ${op}` }, { status: 400 });
  }
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const API_DOCUMENTATION = {
  baseUrl: "/api",
  endpoints: {
    "GET /api/projects": {
      description: "查询项目列表或单个项目",
      params: {
        id: { type: "string", required: false, description: "项目ID，传则返回单个项目详情" }
      },
      response: {
        projects: "Array<Project>（列表模式）",
        project: "Project & { _count }（详情模式）"
      }
    },
    "POST /api/projects": {
      description: "创建项目",
      body: {
        create: {
          action: { value: "create", description: "操作类型" },
          name: { type: "string", required: true, description: "项目名称" },
          code: { type: "string", required: true, description: "项目编码（唯一）" },
          address: { type: "string", required: false, description: "项目地址" }
        }
      }
    },
    "GET /api/test-records": {
      description: "查询测试记录列表或单条记录（含整改明细与交接明细）",
      params: {
        projectId: { type: "string", required: true, description: "项目ID" },
        id: { type: "string", required: false, description: "传 id 则返回单条详情+可用流转+整改明细+交接明细" },
        status: { type: "enum", required: false, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "按状态筛选" },
        holderRole: { type: "enum", required: false, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "按当前持有人角色筛选" },
        role: { type: "enum", required: false, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "查详情时传此参数获取可用流转" }
      },
      response: {
        records: "Array<TestRecord>（列表模式）",
        record: "TestRecord & { reworkOrders, stateTransitions, handoverLogs, attachments, materialRequisitions, cableRoutes }（详情模式）",
        availableTransitions: "TransitionRule[]（详情+role模式）",
        reworkDetail: "Array<{id,code,status,defectDesc,rectifyMethod,deadline,currentHolderRole,currentHolderId,stateTransitions,handoverLogs,attachments}>",
        handoverDetail: "Array<{id,fromRole,fromUserId,fromUserName,toRole,toUserId,toUserName,handoverType,remark,createdAt}>",
        timeline: "Array<HandoverLog & {source}>（合并测试记录+整改单的交接时间线）"
      }
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
          holderName: { type: "string", required: false, description: "持有人姓名" }
        },
        transition: {
          action: { value: "transition", description: "操作类型" },
          testRecordId: { type: "string", required: true, description: "测试记录ID" },
          fromStatus: { type: "enum", required: true, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "当前状态" },
          toStatus: { type: "enum", required: true, enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ARCHIVED"], description: "目标状态" },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "操作人角色" },
          operatorId: { type: "string", required: true, description: "操作人ID" },
          operatorName: { type: "string", description: "操作人姓名" },
          receiverId: { type: "string", required: false, description: "交接接收人ID（有 nextHolderRole 时填写）" },
          receiverName: { type: "string", required: false, description: "交接接收人姓名" },
          remark: { type: "string", description: "备注" },
          idempotencyKey: { type: "string", description: "幂等键，相同key不重复执行" }
        },
        supplement: {
          action: { value: "supplement", description: "补充材料操作" },
          testRecordId: { type: "string", required: true, description: "测试记录ID" },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"] },
          operatorId: { type: "string", required: true },
          operatorName: { type: "string" },
          category: { type: "enum", required: true, enum: ["WIRING_DIAGRAM", "MATERIAL_REQUISITION", "SITE_PHOTO", "COMPLETION_DOCUMENT", "OTHER"], description: "材料类别" },
          files: { type: "Array<{fileName,filePath,fileSize,mimeType}>", required: true, description: "文件列表" },
          remark: { type: "string", description: "补充说明" }
        }
      },
      response: {
        record: "完整 TestRecord（含 reworkOrders, handoverLogs, stateTransitions, attachments 等）",
        timeline: "Array<HandoverLog & {source}>"
      },
      idempotent: "transition 操作支持 idempotencyKey，相同 key 的请求不会重复执行，直接返回上次结果"
    },
    "GET /api/rework-orders": {
      description: "查询返工整改单（非独立菜单，嵌入测试记录详情），含整改明细与交接明细",
      params: {
        id: { type: "string", description: "整改单ID，传则返回详情+可用流转+整改明细+交接明细" },
        testRecordId: { type: "string", description: "测试记录ID，传则返回该记录下所有整改单" },
        role: { type: "enum", enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"], description: "查详情时获取可用流转" }
      },
      response: {
        order: "ReworkOrder & { testRecord, stateTransitions, handoverLogs, attachments }",
        availableTransitions: "TransitionRule[]",
        reworkDetail: "{id,code,status,defectDesc,rectifyMethod,deadline,currentHolderRole,currentHolderId,stateTransitions,handoverLogs,attachments}",
        timeline: "Array<HandoverLog & {source}>"
      }
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
          receiverId: { type: "string", required: false, description: "交接接收人ID" },
          receiverName: { type: "string", required: false, description: "交接接收人姓名" },
          rectifyMethod: { type: "string", description: "整改方法（RECTIFYING→RESUBMITTED时填写）" },
          remark: { type: "string" },
          idempotencyKey: { type: "string", description: "幂等键" }
        },
        supplement: {
          action: { value: "supplement", description: "补充整改材料" },
          reworkOrderId: { type: "string", required: true },
          operatorRole: { type: "enum", required: true, enum: ["PROJECT_MANAGER", "CONSTRUCTION_TEAM", "DOCUMENT_CLERK"] },
          operatorId: { type: "string", required: true },
          category: { type: "enum", required: true, enum: ["WIRING_DIAGRAM", "MATERIAL_REQUISITION", "SITE_PHOTO", "COMPLETION_DOCUMENT", "OTHER"] },
          files: { type: "Array<{fileName,filePath,fileSize,mimeType}>", required: true },
          remark: { type: "string" }
        }
      },
      response: {
        order: "完整 ReworkOrder（含 stateTransitions, handoverLogs, attachments）",
        timeline: "Array<HandoverLog & {source}>"
      }
    },
    "GET /api/material-requisitions": {
      description: "查询材料领用单",
      params: {
        projectId: { type: "string", description: "项目ID（与id二选一）" },
        testRecordId: { type: "string", description: "测试记录ID（可选，配合projectId筛选）" },
        id: { type: "string", description: "领用单ID（与projectId二选一）" },
        overOnly: { type: "boolean", description: "只返回超领记录（需配合projectId）" }
      }
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
          applicantName: { type: "string", required: true, description: "申请人姓名" }
        },
        approve: {
          action: { value: "approve", description: "审批通过（自动计算超领）" },
          id: { type: "string", required: true, description: "领用单ID" },
          actualQty: { type: "number", required: true, description: "实际领用数量" },
          approvedById: { type: "string", required: true, description: "审批人ID" },
          approvedByName: { type: "string", required: true, description: "审批人姓名" }
        },
        reject: {
          action: { value: "reject", description: "驳回领用单" },
          id: { type: "string", required: true },
          approvedById: { type: "string", required: true },
          approvedByName: { type: "string", required: true }
        },
        return: {
          action: { value: "return", description: "退回领用单" },
          id: { type: "string", required: true },
          approvedById: { type: "string", required: true },
          approvedByName: { type: "string", required: true }
        }
      }
    },
    "GET /api/cable-routes": {
      description: "查询线缆走向",
      params: {
        projectId: { type: "string", required: true, description: "项目ID" },
        testRecordId: { type: "string", description: "测试记录ID（可选筛选）" }
      }
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
          description: { type: "string", description: "备注说明" }
        },
        update: {
          action: { value: "update", description: "更新线缆走向" },
          id: { type: "string", required: true, description: "线缆走向ID" },
          routeName: { type: "string" },
          startPoint: { type: "string" },
          endPoint: { type: "string" },
          cableType: { type: "string" },
          length: { type: "number" },
          description: { type: "string" }
        }
      }
    },
    "GET /api/handover": {
      description: "查询催办日志 / 交接时间线",
      params: {
        entityType: { type: "enum", enum: ["TEST_RECORD", "REWORK_ORDER"], description: "实体类型" },
        entityId: { type: "string", description: "实体ID" },
        testRecordId: { type: "string", description: "测试记录ID（查交接时间线）" },
        reworkOrderId: { type: "string", description: "整改单ID（查交接时间线）" }
      }
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
        reason: { type: "string", required: true, description: "催办原因" }
      }
    }
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
        "ACCEPTED → ARCHIVED（资料员归档）"
      ],
      constraint: "每次状态变更写入 StateTransition（操作人、角色、时间、幂等键、关联 testRecordId），需交接时同步写 HandoverLog（含 receiverId/receiverName）"
    },
    reworkOrder: {
      description: "返工整改单状态机（非独立菜单，挂在测试记录下）",
      flow: [
        "GENERATED → ASSIGNED（项目负责人分配整改任务给施工班组）",
        "ASSIGNED → RECTIFYING（施工班组开始整改）",
        "RECTIFYING → RESUBMITTED（施工班组提交整改结果给项目负责人验证）",
        "RESUBMITTED → VERIFIED（项目负责人验证通过，交接给资料员）",
        "RESUBMITTED → RECTIFYING（验证不通过，退回继续整改）",
        "VERIFIED → CLOSED（资料员关闭整改单）"
      ],
      constraint: "整改单全部关闭后，关联测试记录自动从 REJECTED 回退到 DRAFT；StateTransition 关联 reworkOrderId；HandoverLog 含 receiverId/receiverName"
    }
  },
  idempotency: {
    description: "幂等提交机制",
    mechanism: "transition 操作可传 idempotencyKey，系统在 StateTransition 表中用 UNIQUE 约束保证同一 key 只执行一次。重复请求直接返回上次结果（含完整 record + timeline），不产生副作用",
    ttl: "IdempotencyRecord 记录 24 小时后过期，过期后 key 可复用"
  },
  dataIntegrity: {
    currentHolderId: "状态流转时，若传了 receiverId 且规则有 nextHolderRole，则更新 TestRecord/ReworkOrder 的 currentHolderId",
    handoverReceiver: "HandoverLog 的 toUserId/toUserName 由 transition 接口的 receiverId/receiverName 写入，不再留空",
    stateTransitionRelation: "StateTransition 通过 testRecordId/reworkOrderId 外键直接关联到对应记录，不再只存 entityType+entityId 泛化字段",
    reworkDetailResponse: "GET 接口返回 reworkDetail（整改明细）和 handoverDetail（交接明细）字段，POST transition/supplement 返回完整 record + timeline"
  },
  roles: {
    PROJECT_MANAGER: { label: "项目负责人", responsibilities: "审核测试记录、分配/验证返工整改、催办" },
    CONSTRUCTION_TEAM: { label: "施工班组", responsibilities: "填写测试记录、提交/重新提交、整改、补充材料" },
    DOCUMENT_CLERK: { label: "资料员", responsibilities: "归档已通过记录、关闭整改单" }
  }
};
async function loader$1() {
  return json({ docs: API_DOCUMENTATION });
}
function ApiDocs() {
  const { docs } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: "2rem" }, children: [
    /* @__PURE__ */ jsx("h1", { children: "接口文档" }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { children: "角色定义" }),
      /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14 }, children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "2px solid #333" }, children: [
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "角色" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "标签" }),
          /* @__PURE__ */ jsx("th", { style: { textAlign: "left", padding: "0.3rem" }, children: "职责" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: Object.entries(docs.roles).map(([key, val]) => /* @__PURE__ */ jsxs("tr", { style: { borderBottom: "1px solid #eee" }, children: [
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem" }, children: /* @__PURE__ */ jsx("code", { children: key }) }),
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem" }, children: val.label }),
          /* @__PURE__ */ jsx("td", { style: { padding: "0.3rem" }, children: val.responsibilities })
        ] }, key)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { children: "接口列表" }),
      Object.entries(docs.endpoints).map(([path, spec]) => /* @__PURE__ */ jsxs("div", { style: { margin: "1rem 0", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }, children: [
        /* @__PURE__ */ jsx("h3", { children: /* @__PURE__ */ jsx("code", { children: path }) }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: "#666" }, children: spec.description }),
        "params" in spec && spec.params && /* @__PURE__ */ jsxs("div", { style: { fontSize: 13 }, children: [
          /* @__PURE__ */ jsx("strong", { children: "参数:" }),
          /* @__PURE__ */ jsx("ul", { style: { margin: "0.3rem 0" }, children: Object.entries(spec.params).map(([k, v]) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("code", { children: k }),
            " (",
            v.type,
            v.required ? ", 必填" : "",
            "): ",
            v.description
          ] }, k)) })
        ] }),
        "response" in spec && spec.response && /* @__PURE__ */ jsxs("div", { style: { fontSize: 13 }, children: [
          /* @__PURE__ */ jsx("strong", { children: "响应:" }),
          /* @__PURE__ */ jsx("ul", { style: { margin: "0.3rem 0" }, children: Object.entries(spec.response).map(([k, v]) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("code", { children: k }),
            ": ",
            v
          ] }, k)) })
        ] }),
        "idempotent" in spec && spec.idempotent && /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: "#198754", marginTop: "0.3rem" }, children: [
          /* @__PURE__ */ jsx("strong", { children: "幂等:" }),
          " ",
          spec.idempotent
        ] })
      ] }, path))
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { children: "状态机" }),
      Object.entries(docs.stateMachine).map(([key, machine]) => /* @__PURE__ */ jsxs("div", { style: { margin: "1rem 0", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }, children: [
        /* @__PURE__ */ jsx("h3", { children: machine.description }),
        /* @__PURE__ */ jsx("ul", { style: { fontSize: 13 }, children: machine.flow.map((step, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("code", { children: step }) }, i)) }),
        /* @__PURE__ */ jsxs("p", { style: { fontSize: 13, color: "#dc3545" }, children: [
          /* @__PURE__ */ jsx("strong", { children: "约束:" }),
          " ",
          machine.constraint
        ] })
      ] }, key))
    ] }),
    /* @__PURE__ */ jsxs("section", { style: { marginBottom: "2rem" }, children: [
      /* @__PURE__ */ jsx("h2", { children: "幂等提交机制" }),
      /* @__PURE__ */ jsxs("div", { style: { fontSize: 14 }, children: [
        /* @__PURE__ */ jsx("p", { children: docs.idempotency.description }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "机制:" }),
          " ",
          docs.idempotency.mechanism
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { children: "TTL:" }),
          " ",
          docs.idempotency.ttl
        ] })
      ] })
    ] })
  ] });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ApiDocs,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader() {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { testRecords: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return json({ projects });
}
function ProjectList() {
  const { projects } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: "2rem" }, children: [
    /* @__PURE__ */ jsx("h1", { children: "项目列表" }),
    /* @__PURE__ */ jsx(Link, { to: "/", style: { color: "#0066cc" }, children: "← 返回首页" }),
    projects.length === 0 && /* @__PURE__ */ jsx("div", { style: { marginTop: "1rem", padding: "1rem", background: "#fff3cd", borderRadius: 4 }, children: "暂无项目，请先通过 API 创建项目" }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }, children: projects.map((p) => /* @__PURE__ */ jsxs(
      Link,
      {
        to: `/projects/${p.id}/test-records`,
        style: { padding: "1rem", border: "1px solid #ddd", borderRadius: 4, textDecoration: "none", color: "#333", display: "block" },
        children: [
          /* @__PURE__ */ jsx("strong", { children: p.name }),
          " ",
          /* @__PURE__ */ jsxs("span", { style: { color: "#666" }, children: [
            "(",
            p.code,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("span", { style: { marginLeft: "1rem", color: "#888", fontSize: 14 }, children: [
            "测试记录: ",
            p._count.testRecords
          ] }),
          p.address && /* @__PURE__ */ jsxs("span", { style: { marginLeft: "1rem", color: "#888", fontSize: 14 }, children: [
            "地址: ",
            p.address
          ] })
        ]
      },
      p.id
    )) })
  ] });
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ProjectList,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const meta = () => {
  return [{ title: "弱电施工队 - 测试记录与返工整改" }];
};
function Index() {
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "system-ui, sans-serif", lineHeight: 1.6, maxWidth: 960, margin: "0 auto", padding: "2rem" }, children: [
    /* @__PURE__ */ jsx("h1", { children: "弱电施工队 - 测试记录与返工整改" }),
    /* @__PURE__ */ jsx("p", { children: "项目负责人 → 施工班组 → 资料员 三方接力" }),
    /* @__PURE__ */ jsxs("nav", { style: { display: "flex", gap: "1rem", marginTop: "1rem" }, children: [
      /* @__PURE__ */ jsx(Link, { to: "/projects", style: { padding: "0.5rem 1rem", border: "1px solid #333", borderRadius: 4, textDecoration: "none", color: "#333" }, children: "项目列表" }),
      /* @__PURE__ */ jsx(Link, { to: "/api-docs", style: { padding: "0.5rem 1rem", border: "1px solid #333", borderRadius: 4, textDecoration: "none", color: "#333" }, children: "接口文档" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: 4 }, children: [
      /* @__PURE__ */ jsx("h2", { children: "状态流转说明" }),
      /* @__PURE__ */ jsx("h3", { children: "测试记录" }),
      /* @__PURE__ */ jsx("pre", { style: { fontSize: 14, overflow: "auto" }, children: `
草稿(DRAFT) → 已提交(SUBMITTED) → 审核中(UNDER_REVIEW) → 已通过(ACCEPTED) → 已归档(ARCHIVED)
                                      ↓
                                  已退回(REJECTED) → 已提交(SUBMITTED) [整改后重新提交]
                                      ↓
                                  草稿(DRAFT) [补充材料]

施工班组: 创建/提交/整改/补充材料
项目负责人: 审核/退回/分配整改/验证
资料员: 归档/关闭整改单
        ` }),
      /* @__PURE__ */ jsx("h3", { children: "返工整改（嵌入测试记录详情，非独立菜单）" }),
      /* @__PURE__ */ jsx("pre", { style: { fontSize: 14, overflow: "auto" }, children: `
已生成(GENERATED) → 已分配(ASSIGNED) → 整改中(RECTIFYING) → 已重新提交(RESUBMITTED)
                                                             ↓
                                                        已验证(VERIFIED) → 已关闭(CLOSED)
                                                             ↓
                                                        整改中(RECTIFYING) [验证不通过退回]

全部整改单关闭后，测试记录自动从 REJECTED → DRAFT
        ` })
    ] })
  ] });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BrrAn8-d.js", "imports": ["/assets/components-COoCAsbi.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-Bpc9RdDu.js", "imports": ["/assets/components-COoCAsbi.js"], "css": [] }, "routes/projects.$projectId.test-records.$recordId": { "id": "routes/projects.$projectId.test-records.$recordId", "parentId": "routes/projects.$projectId.test-records", "path": ":recordId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/projects._projectId.test-records._recordId-BH-gP8xf.js", "imports": ["/assets/components-COoCAsbi.js", "/assets/types-DQolXieJ.js"], "css": [] }, "routes/projects.$projectId.test-records": { "id": "routes/projects.$projectId.test-records", "parentId": "routes/projects", "path": ":projectId/test-records", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/projects._projectId.test-records-BIdDIoby.js", "imports": ["/assets/components-COoCAsbi.js", "/assets/types-DQolXieJ.js"], "css": [] }, "routes/api.material-requisitions": { "id": "routes/api.material-requisitions", "parentId": "root", "path": "api/material-requisitions", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.material-requisitions-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.rework-orders": { "id": "routes/api.rework-orders", "parentId": "root", "path": "api/rework-orders", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.rework-orders-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.cable-routes": { "id": "routes/api.cable-routes", "parentId": "root", "path": "api/cable-routes", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.cable-routes-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.test-records": { "id": "routes/api.test-records", "parentId": "root", "path": "api/test-records", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.test-records-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.handover": { "id": "routes/api.handover", "parentId": "root", "path": "api/handover", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.handover-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.projects": { "id": "routes/api.projects", "parentId": "root", "path": "api/projects", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.projects-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api-docs": { "id": "routes/api-docs", "parentId": "root", "path": "api-docs", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api-docs-CzdEkt_o.js", "imports": ["/assets/components-COoCAsbi.js"], "css": [] }, "routes/projects": { "id": "routes/projects", "parentId": "root", "path": "projects", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/projects-CMyos6XF.js", "imports": ["/assets/components-COoCAsbi.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-BnuunTcy.js", "imports": ["/assets/components-COoCAsbi.js"], "css": [] } }, "url": "/assets/manifest-b96217eb.js", "version": "b96217eb" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/projects.$projectId.test-records.$recordId": {
    id: "routes/projects.$projectId.test-records.$recordId",
    parentId: "routes/projects.$projectId.test-records",
    path: ":recordId",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/projects.$projectId.test-records": {
    id: "routes/projects.$projectId.test-records",
    parentId: "routes/projects",
    path: ":projectId/test-records",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/api.material-requisitions": {
    id: "routes/api.material-requisitions",
    parentId: "root",
    path: "api/material-requisitions",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/api.rework-orders": {
    id: "routes/api.rework-orders",
    parentId: "root",
    path: "api/rework-orders",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/api.cable-routes": {
    id: "routes/api.cable-routes",
    parentId: "root",
    path: "api/cable-routes",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/api.test-records": {
    id: "routes/api.test-records",
    parentId: "root",
    path: "api/test-records",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/api.handover": {
    id: "routes/api.handover",
    parentId: "root",
    path: "api/handover",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/api.projects": {
    id: "routes/api.projects",
    parentId: "root",
    path: "api/projects",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/api-docs": {
    id: "routes/api-docs",
    parentId: "root",
    path: "api-docs",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/projects": {
    id: "routes/projects",
    parentId: "root",
    path: "projects",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route11
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
