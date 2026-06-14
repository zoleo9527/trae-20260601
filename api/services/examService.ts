import prisma from '../lib/prisma';
import { createStatusLog } from './statusLogService';
import { ExamStatus, Role } from '@prisma/client';

export interface UpdateExamInput {
  examId: string;
  newStatus: ExamStatus;
  handlerId: string;
  handlerName: string;
  handlerRole: Role;
  scheduledDate?: Date;
  location?: string;
  score?: number;
  retestFee?: number;
  reason: string;
  remark?: string;
}

export async function updateExamStatus(input: UpdateExamInput) {
  const exam = await prisma.examBooking.findUnique({
    where: { id: input.examId },
    include: { student: true },
  });

  if (!exam) {
    throw new Error('考试预约记录不存在');
  }

  const previousStatus = exam.status;

  const updateData: any = {
    status: input.newStatus,
    updatedAt: new Date(),
  };

  if (input.scheduledDate !== undefined) {
    updateData.scheduledDate = input.scheduledDate;
  }

  if (input.location !== undefined) {
    updateData.location = input.location;
  }

  if (input.score !== undefined) {
    updateData.score = input.score;
  }

  if (input.retestFee !== undefined) {
    updateData.retestFee = input.retestFee;
  }

  const updatedExam = await prisma.examBooking.update({
    where: { id: input.examId },
    data: updateData,
  });

  await createStatusLog({
    entityType: 'exam_booking',
    entityId: input.examId,
    previousStatus,
    newStatus: input.newStatus,
    handlerId: input.handlerId,
    handlerName: input.handlerName,
    handlerRole: input.handlerRole,
    reason: input.reason,
    remark: input.remark,
  });

  if (input.newStatus === 'retest' && input.retestFee) {
    await prisma.payment.create({
      data: {
        studentId: exam.studentId,
        paymentType: 'retest',
        amount: input.retestFee,
        status: 'pending',
        handlerId: input.handlerId,
      },
    });
  }

  return updatedExam;
}

export async function getExamById(examId: string) {
  return await prisma.examBooking.findUnique({
    where: { id: examId },
    include: {
      student: true,
      examiner: true,
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function getExamList(filters: {
  studentId?: string;
  status?: ExamStatus;
  examinerId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (filters.studentId) {
    where.studentId = filters.studentId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.examinerId) {
    where.examinerId = filters.examinerId;
  }

  if (filters.search) {
    where.OR = [
      { student: { name: { contains: filters.search, mode: 'insensitive' } } },
      { student: { phone: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters.startDate || filters.endDate) {
    where.scheduledDate = {};
    if (filters.startDate) {
      where.scheduledDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.scheduledDate.lte = filters.endDate;
    }
  }

  return await prisma.examBooking.findMany({
    where,
    include: {
      student: true,
      examiner: true,
    },
    orderBy: { scheduledDate: 'desc' },
  });
}
