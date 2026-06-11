import { prisma } from "~/db.server";
import { REWORK_ORDER_MACHINE, validateTransition } from "~/models/state-machine";
import type { Role } from "~/models/types";
import { v4 as uuidv4 } from "uuid";

export async function listReworkOrders(testRecordId: string) {
  return prisma.reworkOrder.findMany({
    where: { testRecordId },
    include: {
      testRecord: { select: { id: true, code: true, testItem: true } },
      stateTransitions: { orderBy: { createdAt: "desc" } },
      handoverLogs: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReworkOrder(id: string) {
  return prisma.reworkOrder.findUnique({
    where: { id },
    include: {
      testRecord: {
        include: {
          project: true,
          attachments: true,
          cableRoutes: true,
          materialRequisitions: true,
        },
      },
      stateTransitions: { orderBy: { createdAt: "asc" } },
      handoverLogs: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
  });
}

export async function transitionReworkOrder(input: {
  reworkOrderId: string;
  fromStatus: string;
  toStatus: string;
  operatorRole: string;
  operatorId: string;
  operatorName: string;
  rectifyMethod?: string;
  remark?: string;
  idempotencyKey?: string;
}) {
  const idempotencyKey = input.idempotencyKey || uuidv4();

  const existing = await prisma.stateTransition.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    return prisma.reworkOrder.findUnique({ where: { id: input.reworkOrderId } });
  }

  const validation = validateTransition(
    {
      entityId: input.reworkOrderId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      operatorRole: input.operatorRole as Role,
      operatorId: input.operatorId,
      operatorName: input.operatorName,
      idempotencyKey,
    },
    REWORK_ORDER_MACHINE
  );

  if (!validation.valid || !validation.rule) {
    throw new Error(validation.error || "状态流转校验失败");
  }

  const rule = validation.rule;
  const updateData: Record<string, unknown> = { status: input.toStatus };

  if (rule.nextHolderRole) {
    updateData.currentHolderRole = rule.nextHolderRole;
  }
  if (input.rectifyMethod) {
    updateData.rectifyMethod = input.rectifyMethod;
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.reworkOrder.update({
      where: { id: input.reworkOrderId },
      data: updateData as Parameters<typeof tx.reworkOrder.update>[0]["data"],
    });

    await tx.stateTransition.create({
      data: {
        entityType: "REWORK_ORDER",
        entityId: input.reworkOrderId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        operatorRole: input.operatorRole as Role,
        operatorId: input.operatorId,
        operatorName: input.operatorName,
        action: rule.action,
        remark: input.remark,
        idempotencyKey,
      },
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
          toUserId: "",
          toUserName: "",
          handoverType: mapActionToHandoverType(rule.action),
          remark: input.remark,
          reworkOrderId: input.reworkOrderId,
        },
      });
    }

    await tx.idempotencyRecord.create({
      data: {
        idempotencyKey,
        responseHash: input.reworkOrderId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    if (input.toStatus === "CLOSED") {
      const testRecord = await tx.testRecord.findUnique({
        where: { id: order.testRecordId },
      });
      if (testRecord && testRecord.status === "REJECTED") {
        const allReworkOrders = await tx.reworkOrder.findMany({
          where: { testRecordId: order.testRecordId },
        });
        const allClosed = allReworkOrders.every((ro) => ro.status === "CLOSED" || ro.id === input.reworkOrderId);
        if (allClosed) {
          await tx.testRecord.update({
            where: { id: order.testRecordId },
            data: { status: "DRAFT", currentHolderRole: "CONSTRUCTION_TEAM" },
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
            },
          });
        }
      }
    }

    return order;
  });
}

export async function supplementReworkAttachment(input: {
  reworkOrderId: string;
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
        reworkOrderId: input.reworkOrderId,
      },
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
          reworkOrderId: input.reworkOrderId,
        },
      });
    }

    return tx.reworkOrder.findUnique({ where: { id: input.reworkOrderId } });
  });
}

function mapActionToHandoverType(action: string): string {
  if (action.includes("分配")) return "SUBMIT";
  if (action.includes("整改")) return "RECTIFY";
  if (action.includes("重新提交") || action.includes("提交整改")) return "RESUBMIT";
  if (action.includes("验证通过")) return "VERIFY";
  if (action.includes("验证不通过")) return "REJECT";
  if (action.includes("关闭")) return "ARCHIVE";
  return "SUBMIT";
}
