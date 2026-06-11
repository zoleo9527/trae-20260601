import { prisma } from "~/db.server";
import type { UrgencyInput } from "~/models/types";

export async function createUrgency(input: UrgencyInput) {
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
      reason: input.reason,
    },
  });
}

export async function listUrgencyLogs(entityType: string, entityId: string) {
  return prisma.urgencyLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHandoverTimeline(testRecordId?: string, reworkOrderId?: string) {
  const logs: Array<Record<string, unknown>> = [];

  if (testRecordId) {
    const recordLogs = await prisma.handoverLog.findMany({
      where: { testRecordId },
      orderBy: { createdAt: "asc" },
    });
    logs.push(...recordLogs.map((l) => ({ ...l, source: "TEST_RECORD" })));

    const reworkOrders = await prisma.reworkOrder.findMany({
      where: { testRecordId },
      select: { id: true },
    });
    if (reworkOrders.length > 0) {
      const reworkLogIds = reworkOrders.map((ro) => ro.id);
      const reworkLogs = await prisma.handoverLog.findMany({
        where: { reworkOrderId: { in: reworkLogIds } },
        orderBy: { createdAt: "asc" },
      });
      logs.push(...reworkLogs.map((l) => ({ ...l, source: "REWORK_ORDER" })));
    }
  }

  if (reworkOrderId) {
    const orderLogs = await prisma.handoverLog.findMany({
      where: { reworkOrderId },
      orderBy: { createdAt: "asc" },
    });
    logs.push(...orderLogs.map((l) => ({ ...l, source: "REWORK_ORDER" })));
  }

  logs.sort((a, b) => {
    const ta = a.createdAt as Date;
    const tb = b.createdAt as Date;
    return ta.getTime() - tb.getTime();
  });

  return logs;
}

export async function checkIdempotency(idempotencyKey: string): Promise<boolean> {
  const existing = await prisma.idempotencyRecord.findUnique({
    where: { idempotencyKey },
  });
  if (!existing) return false;
  if (existing.expiresAt < new Date()) {
    await prisma.idempotencyRecord.delete({ where: { idempotencyKey } });
    return false;
  }
  return true;
}
