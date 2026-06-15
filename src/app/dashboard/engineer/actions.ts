'use server';

import prisma from '@/lib/prisma';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { Role, RepairStatus, PartRequestStatus, AppointmentStatus } from '@/lib/enums';
import { redirect } from 'next/navigation';

export async function dispatchEngineer(orderId: string) {
  const user = await requireRole([Role.ENGINEER]);

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (order.assignedToId !== user.id) return { error: '您不是该工单的负责工程师' };
  if (
    ![RepairStatus.ASSIGNED, RepairStatus.APPOINTMENT_SCHEDULED, RepairStatus.PARTS_DELIVERED].includes(
      order.status
    )
  )
    return { error: '当前状态不可出发' };

  await prisma.$transaction([
    prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: RepairStatus.ENGINEER_DISPATCHED },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: order.status,
        toStatus: RepairStatus.ENGINEER_DISPATCHED,
        note: `工程师${user.name}已出发前往客户地址`,
        operatorId: user.id,
      },
    }),
  ]);

  return { success: true };
}

export async function completeDiagnosis(formData: FormData) {
  const user = await requireRole([Role.ENGINEER]);

  const orderId = formData.get('orderId') as string;
  const diagnosisNote = formData.get('diagnosisNote') as string;

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (order.assignedToId !== user.id) return { error: '您不是该工单的负责工程师' };
  if (order.status !== RepairStatus.ENGINEER_DISPATCHED) return { error: '当前状态不可完成检测' };

  await prisma.$transaction([
    prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: RepairStatus.DIAGNOSIS_DONE },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: order.status,
        toStatus: RepairStatus.DIAGNOSIS_DONE,
        note: diagnosisNote || `工程师${user.name}完成现场检测`,
        operatorId: user.id,
      },
    }),
  ]);

  return { success: true };
}

export async function startRepair(orderId: string) {
  const user = await requireRole([Role.ENGINEER]);

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (order.assignedToId !== user.id) return { error: '您不是该工单的负责工程师' };
  if (
    ![RepairStatus.DIAGNOSIS_DONE, RepairStatus.PARTS_DELIVERED].includes(order.status)
  )
    return { error: '当前状态不可开始维修' };

  await prisma.$transaction([
    prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: RepairStatus.REPAIR_IN_PROGRESS },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: order.status,
        toStatus: RepairStatus.REPAIR_IN_PROGRESS,
        note: `工程师${user.name}开始维修作业`,
        operatorId: user.id,
      },
    }),
  ]);

  return { success: true };
}

export async function completeRepair(formData: FormData) {
  const user = await requireRole([Role.ENGINEER]);

  const orderId = formData.get('orderId') as string;
  const repairNote = formData.get('repairNote') as string;

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (order.assignedToId !== user.id) return { error: '您不是该工单的负责工程师' };
  if (order.status !== RepairStatus.REPAIR_IN_PROGRESS) return { error: '当前状态不可完工' };

  const activeAppointment = await prisma.appointment.findFirst({
    where: {
      repairOrderId: orderId,
      status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.CONFIRMED] },
    },
    orderBy: { createdAt: 'desc' },
  });

  const tx: any[] = [
    prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: RepairStatus.REPAIR_COMPLETED },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: order.status,
        toStatus: RepairStatus.REPAIR_COMPLETED,
        note: repairNote || `工程师${user.name}完成维修`,
        operatorId: user.id,
      },
    }),
  ];

  if (activeAppointment) {
    tx.push(
      prisma.appointment.update({
        where: { id: activeAppointment.id },
        data: {
          status: AppointmentStatus.COMPLETED,
          completedAt: new Date(),
          completionNote: repairNote || '维修完成',
        },
      })
    );
  }

  await prisma.$transaction(tx);

  return { success: true };
}

export async function createPartRequest(formData: FormData) {
  const user = await requireRole([Role.ENGINEER]);

  const orderId = formData.get('orderId') as string;
  const note = formData.get('note') as string;
  const partIds = formData.getAll('partIds') as string[];
  const quantities = formData.getAll('quantities') as string[];

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (order.assignedToId !== user.id) return { error: '您不是该工单的负责工程师' };

  const items = partIds
    .map((partId, idx) => ({
      partId,
      quantity: parseInt(quantities[idx]) || 1,
    }))
    .filter((i) => i.quantity > 0);

  if (items.length === 0) return { error: '请选择配件' };

  await prisma.$transaction([
    prisma.partRequest.create({
      data: {
        repairOrderId: orderId,
        status: PartRequestStatus.PENDING,
        requestedById: user.id,
        note,
        items: { create: items },
      },
    }),
    ...(order.status !== RepairStatus.PARTS_REQUESTED
      ? [
          prisma.repairOrder.update({
            where: { id: orderId },
            data: { status: RepairStatus.PARTS_REQUESTED },
          }),
          prisma.statusLog.create({
            data: {
              repairOrderId: orderId,
              fromStatus: order.status,
              toStatus: RepairStatus.PARTS_REQUESTED,
              note: note || `工程师${user.name}申请配件`,
              operatorId: user.id,
            },
          }),
        ]
      : []),
  ]);

  return { success: true };
}
