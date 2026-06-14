import prisma from '../lib/prisma';
import { createStatusLog } from './statusLogService';
import { TrainingStatus, Role } from '@prisma/client';

export interface UpdateTrainingInput {
  trainingId: string;
  newStatus: TrainingStatus;
  handlerId: string;
  handlerName: string;
  handlerRole: Role;
  actualHours?: number;
  actualAt?: Date;
  exceptionReason?: string;
  reason: string;
  remark?: string;
}

export async function updateTrainingStatus(input: UpdateTrainingInput) {
  const training = await prisma.trainingHours.findUnique({
    where: { id: input.trainingId },
    include: { student: true },
  });

  if (!training) {
    throw new Error('学时记录不存在');
  }

  const previousStatus = training.status;

  const updateData: any = {
    status: input.newStatus,
    updatedAt: new Date(),
  };

  if (input.actualHours !== undefined) {
    updateData.actualHours = input.actualHours;
  }

  if (input.actualAt !== undefined) {
    updateData.actualAt = input.actualAt;
  }

  if (input.exceptionReason !== undefined) {
    updateData.exceptionReason = input.exceptionReason;
  }

  const updatedTraining = await prisma.trainingHours.update({
    where: { id: input.trainingId },
    data: updateData,
  });

  await createStatusLog({
    entityType: 'training_hours',
    entityId: input.trainingId,
    previousStatus,
    newStatus: input.newStatus,
    handlerId: input.handlerId,
    handlerName: input.handlerName,
    handlerRole: input.handlerRole,
    reason: input.reason,
    remark: input.remark,
  });

  return updatedTraining;
}

export async function getTrainingById(trainingId: string) {
  return await prisma.trainingHours.findUnique({
    where: { id: trainingId },
    include: {
      student: true,
      coach: true,
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function getTrainingList(filters: {
  studentId?: string;
  coachId?: string;
  status?: TrainingStatus;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (filters.studentId) {
    where.studentId = filters.studentId;
  }

  if (filters.coachId) {
    where.coachId = filters.coachId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.scheduledAt = {};
    if (filters.startDate) {
      where.scheduledAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.scheduledAt.lte = filters.endDate;
    }
  }

  return await prisma.trainingHours.findMany({
    where,
    include: {
      student: true,
      coach: true,
    },
    orderBy: { scheduledAt: 'desc' },
  });
}
