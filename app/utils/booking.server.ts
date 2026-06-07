import { prisma } from "./db.server";
import type { ActionType, Prisma } from "@prisma/client";

export async function generateBookingNumber(tx?: Prisma.TransactionClient) {
  const client = tx || prisma;
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  
  const count = await client.booking.count({
    where: {
      createdAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    },
  });
  
  return `BK${dateStr}${String(count + 1).padStart(4, "0")}`;
}

export async function logAction(
  bookingId: string,
  actorId: string,
  actionType: ActionType,
  description: string,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;
  return client.actionLog.create({
    data: {
      bookingId,
      actorId,
      actionType,
      description,
      oldValues: oldValues as any,
      newValues: newValues as any,
    },
  });
}

export async function getBookingWithDetails(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      handTag: true,
      locker: true,
      technician: true,
      createdBy: { select: { id: true, name: true, role: true } },
      verifiedBy: { select: { id: true, name: true, role: true } },
      deposits: {
        include: {
          receivedBy: { select: { id: true, name: true, role: true } },
          verifiedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      exceptions: {
        include: {
          reportedBy: { select: { id: true, name: true, role: true } },
          assignedTo: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      actionLogs: {
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
