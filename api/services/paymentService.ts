import prisma from '../lib/prisma';
import { createStatusLog } from './statusLogService';
import { PaymentStatus, PaymentType, Role } from '@prisma/client';

export interface UpdatePaymentInput {
  paymentId: string;
  newStatus: PaymentStatus;
  handlerId: string;
  handlerName: string;
  handlerRole: Role;
  refundReason?: string;
  paidAt?: Date;
  settledAt?: Date;
  reason: string;
  remark?: string;
}

export async function updatePaymentStatus(input: UpdatePaymentInput) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { student: true },
  });

  if (!payment) {
    throw new Error('费用记录不存在');
  }

  const previousStatus = payment.status;

  const updateData: any = {
    status: input.newStatus,
    updatedAt: new Date(),
    handlerId: input.handlerId,
  };

  if (input.refundReason !== undefined) {
    updateData.refundReason = input.refundReason;
  }

  if (input.paidAt !== undefined) {
    updateData.paidAt = input.paidAt;
  }

  if (input.settledAt !== undefined) {
    updateData.settledAt = input.settledAt;
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: input.paymentId },
    data: updateData,
  });

  await createStatusLog({
    entityType: 'payment',
    entityId: input.paymentId,
    previousStatus,
    newStatus: input.newStatus,
    handlerId: input.handlerId,
    handlerName: input.handlerName,
    handlerRole: input.handlerRole,
    reason: input.reason,
    remark: input.remark,
  });

  return updatedPayment;
}

export async function getPaymentById(paymentId: string) {
  return await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: true,
      handler: true,
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function getPaymentList(filters: {
  studentId?: string;
  paymentType?: PaymentType;
  status?: PaymentStatus;
  handlerId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (filters.studentId) {
    where.studentId = filters.studentId;
  }

  if (filters.paymentType) {
    where.paymentType = filters.paymentType;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.handlerId) {
    where.handlerId = filters.handlerId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  return await prisma.payment.findMany({
    where,
    include: {
      student: true,
      handler: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function calculateRefund(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      trainingHours: true,
      payments: true,
    },
  });

  if (!student) {
    throw new Error('学员不存在');
  }

  const totalPaid = student.payments
    .filter(p => p.status === 'settled')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const completedHours = student.trainingHours
    .filter(t => t.status === 'completed' && t.actualHours)
    .reduce((sum, t) => sum + Number(t.actualHours), 0);

  const trainingFeePerHour = 150;

  const trainingCost = completedHours * trainingFeePerHour;

  const refund = Math.max(0, totalPaid - trainingCost);

  return {
    totalPaid,
    completedHours,
    trainingCost,
    refund,
    examType: student.examType,
  };
}
