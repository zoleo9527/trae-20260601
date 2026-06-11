import { prisma } from "~/db.server";
import { TEST_RECORD_MACHINE, validateTransition } from "~/models/state-machine";
import type { TransitionInput, Role } from "~/models/types";
import { v4 as uuidv4 } from "uuid";

export async function listTestRecords(projectId: string, filters?: { status?: string; holderRole?: string }) {
  const where: Record<string, unknown> = { projectId };
  if (filters?.status) where.status = filters.status;
  if (filters?.holderRole) where.currentHolderRole = filters.holderRole;

  return prisma.testRecord.findMany({
    where,
    include: {
      project: true,
      reworkOrders: {
        include: {
          stateTransitions: { orderBy: { createdAt: "desc" } },
          handoverLogs: { orderBy: { createdAt: "desc" } },
          attachments: { orderBy: { uploadedAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      stateTransitions: { orderBy: { createdAt: "desc" } },
      handoverLogs: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      materialRequisitions: true,
      cableRoutes: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTestRecord(id: string) {
  return prisma.testRecord.findUnique({
    where: { id },
    include: {
      project: true,
      reworkOrders: {
        include: {
          stateTransitions: { orderBy: { createdAt: "desc" } },
          handoverLogs: { orderBy: { createdAt: "desc" } },
          attachments: { orderBy: { uploadedAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      stateTransitions: { orderBy: { createdAt: "asc" } },
      handoverLogs: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      materialRequisitions: true,
      cableRoutes: true,
    },
  });
}

export async function createTestRecord(data: {
  projectId: string;
  testItem: string;
  testMethod: string;
  testResult: string;
  conclusion: string;
  holderId: string;
  holderName: string;
}) {
  const count = await prisma.testRecord.count({ where: { projectId: data.projectId } });
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  const code = `${project?.code ?? "UNK"}-TR-${String(count + 1).padStart(4, "0")}`;

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
      currentHolderId: data.holderId,
    },
  });
}

export async function transitionTestRecord(input: {
  testRecordId: string;
  fromStatus: string;
  toStatus: string;
  operatorRole: string;
  operatorId: string;
  operatorName: string;
  receiverId?: string;
  receiverName?: string;
  remark?: string;
  idempotencyKey?: string;
}) {
  const idempotencyKey = input.idempotencyKey || uuidv4();

  const existing = await prisma.stateTransition.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    return getTestRecord(input.testRecordId);
  }

  const validation = validateTransition(
    {
      entityId: input.testRecordId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      operatorRole: input.operatorRole as Role,
      operatorId: input.operatorId,
      operatorName: input.operatorName,
      idempotencyKey,
    },
    TEST_RECORD_MACHINE
  );

  if (!validation.valid || !validation.rule) {
    throw new Error(validation.error || "状态流转校验失败");
  }

  const rule = validation.rule;
  const updateData: Record<string, unknown> = { status: input.toStatus };

  if (rule.nextHolderRole) {
    updateData.currentHolderRole = rule.nextHolderRole;
  }
  if (input.receiverId && rule.nextHolderRole) {
    updateData.currentHolderId = input.receiverId;
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.testRecord.update({
      where: { id: input.testRecordId },
      data: updateData as Parameters<typeof tx.testRecord.update>[0]["data"],
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
        testRecordId: input.testRecordId,
      },
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
          handoverType: mapActionToHandoverType(rule.action),
          remark: input.remark,
          testRecordId: input.testRecordId,
        },
      });
    }

    if (rule.requiresRework && input.toStatus === "REJECTED") {
      const reworkCount = await tx.reworkOrder.count({
        where: { testRecordId: input.testRecordId },
      });
      const testRecord = await tx.testRecord.findUnique({
        where: { id: input.testRecordId },
      });
      await tx.reworkOrder.create({
        data: {
          testRecordId: input.testRecordId,
          code: `${testRecord?.code}-RW-${String(reworkCount + 1).padStart(2, "0")}`,
          defectDesc: input.remark || "审核退回，需整改",
          rectifyMethod: "",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "GENERATED",
          currentHolderRole: "PROJECT_MANAGER",
          currentHolderId: input.operatorId,
        },
      });
    }

    await tx.idempotencyRecord.create({
      data: {
        idempotencyKey,
        responseHash: input.testRecordId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return getTestRecord(input.testRecordId);
  });
}

export async function supplementMaterial(input: {
  testRecordId: string;
  operatorRole: string;
  operatorId: string;
  operatorName: string;
  category: string;
  files: Array<{ fileName: string; filePath: string; fileSize: number; mimeType: string }>;
  remark?: string;
}) {
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
        testRecordId: input.testRecordId,
      },
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
          testRecordId: input.testRecordId,
        },
      });
    }

    return getTestRecord(input.testRecordId);
  });
}

function mapActionToHandoverType(action: string): "SUBMIT" | "APPROVE" | "REJECT" | "RECTIFY" | "RESUBMIT" | "VERIFY" | "ARCHIVE" | "SUPPLEMENT" {
  if (action.includes("重新提交")) return "RESUBMIT";
  if (action.includes("提交")) return "SUBMIT";
  if (action.includes("通过")) return "APPROVE";
  if (action.includes("退回")) return "REJECT";
  if (action.includes("整改")) return "RECTIFY";
  if (action.includes("验证")) return "VERIFY";
  if (action.includes("归档")) return "ARCHIVE";
  if (action.includes("补充")) return "SUPPLEMENT";
  return "SUBMIT";
}
