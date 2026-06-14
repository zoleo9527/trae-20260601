import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

export interface StatusLogInput {
  entityType: 'training_hours' | 'payment' | 'exam_booking';
  entityId: string;
  previousStatus?: string;
  newStatus: string;
  handlerId: string;
  handlerName: string;
  handlerRole: Role;
  reason: string;
  remark?: string;
}

export async function createStatusLog(input: StatusLogInput) {
  return await prisma.statusLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      handlerId: input.handlerId,
      handlerName: input.handlerName,
      handlerRole: input.handlerRole,
      reason: input.reason,
      remark: input.remark,
    },
  });
}

export async function getStatusLogs(
  entityType: string,
  entityId: string
) {
  return await prisma.statusLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getStatusLogsByHandler(
  handlerId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  return await prisma.statusLog.findMany({
    where: {
      handlerId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 20,
    skip: options?.offset || 0,
  });
}
