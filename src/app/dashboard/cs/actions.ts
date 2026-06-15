'use server';

import prisma from '@/lib/prisma';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { Role, RepairStatus, AppointmentStatus } from '@/lib/enums';
import { generateOrderNo, REPAIR_STATUS_LABELS } from '@/lib/status';
import { redirect } from 'next/navigation';

export async function createRepairOrder(formData: FormData) {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const customerName = formData.get('customerName') as string;
  const customerPhone = formData.get('customerPhone') as string;
  const customerAddress = formData.get('customerAddress') as string;
  const applianceType = formData.get('applianceType') as string;
  const applianceBrand = formData.get('applianceBrand') as string;
  const applianceModel = formData.get('applianceModel') as string;
  const faultDescription = formData.get('faultDescription') as string;
  const priority = formData.get('priority') as string;

  let customer = await prisma.customer.findFirst({
    where: { phone: customerPhone },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
      },
    });
  } else {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customerName,
        address: customerAddress,
      },
    });
  }

  const order = await prisma.repairOrder.create({
    data: {
      orderNo: generateOrderNo(),
      customerId: customer.id,
      applianceType,
      applianceBrand,
      applianceModel: applianceModel || undefined,
      faultDescription,
      priority,
      status: RepairStatus.PENDING,
    },
  });

  await prisma.statusLog.create({
    data: {
      repairOrderId: order.id,
      fromStatus: null,
      toStatus: RepairStatus.PENDING,
      note: `客服${user.name}新建报修单，记录故障信息`,
      operatorId: user.id,
    },
  });

  redirect(`/dashboard/cs/orders/${order.id}`);
}

export async function acceptOrder(orderId: string) {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (order.status !== RepairStatus.PENDING) return { error: '当前状态不可受理' };

  await prisma.$transaction([
    prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status: RepairStatus.ACCEPTED,
        acceptedById: user.id,
      },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: RepairStatus.PENDING,
        toStatus: RepairStatus.ACCEPTED,
        note: `客服${user.name}受理工单`,
        operatorId: user.id,
      },
    }),
  ]);

  return { success: true };
}

export async function assignOrder(formData: FormData) {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const orderId = formData.get('orderId') as string;
  const engineerId = formData.get('engineerId') as string;
  const note = formData.get('note') as string;

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };

  const engineer = await prisma.user.findUnique({ where: { id: engineerId } });
  if (!engineer || engineer.role !== Role.ENGINEER) return { error: '无效的工程师' };

  await prisma.$transaction([
    prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status: RepairStatus.ASSIGNED,
        assignedToId: engineerId,
      },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: order.status,
        toStatus: RepairStatus.ASSIGNED,
        note: note || `分配给工程师${engineer.name}`,
        operatorId: user.id,
      },
    }),
  ]);

  return { success: true };
}

const VALID_TIME_SLOTS = new Set([
  '09:00-11:00',
  '10:00-12:00',
  '14:00-16:00',
  '15:00-17:00',
  '18:00-20:00',
]);

export async function scheduleAppointment(formData: FormData) {
  try {
    const user = await requireRole([Role.CUSTOMER_SERVICE]);

    const orderId = formData.get('orderId') as string;
    const scheduledDate = formData.get('scheduledDate') as string;
    const timeSlot = formData.get('timeSlot') as string;
    const note = formData.get('note') as string;
    const engineerId = formData.get('engineerId') as string;

    if (!orderId) return { error: '工单ID不能为空' };
    if (!scheduledDate) return { error: '请选择预约日期' };
    if (!timeSlot) return { error: '请选择时间段' };
    if (!engineerId) return { error: '请选择上门工程师' };

    if (!VALID_TIME_SLOTS.has(timeSlot)) {
      return { error: '无效的时间段' };
    }

    const dateObj = new Date(scheduledDate);
    if (isNaN(dateObj.getTime())) {
      return { error: '预约日期格式不正确' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    if (dateOnly < today) {
      return { error: '预约日期不能早于今天' };
    }

    const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
    if (!order) return { error: '工单不存在' };

    const scheduleable = [
      RepairStatus.ACCEPTED,
      RepairStatus.ASSIGNED,
      RepairStatus.APPOINTMENT_SCHEDULED,
    ];
    if (!scheduleable.includes(order.status as RepairStatus)) {
      return { error: `当前状态「${REPAIR_STATUS_LABELS[order.status as RepairStatus]}」不允许预约` };
    }

    const engineer = await prisma.user.findUnique({ where: { id: engineerId } });
    if (!engineer || engineer.role !== Role.ENGINEER) {
      return { error: '无效的工程师' };
    }

    const orderUpdateData: any = {
      status: RepairStatus.APPOINTMENT_SCHEDULED,
      assignedToId: engineerId,
    };

    const isFirstAssignment = !order.assignedToId;
    const isReassignment = order.assignedToId && order.assignedToId !== engineerId;

    const txItems: any[] = [
      prisma.appointment.create({
        data: {
          repairOrderId: orderId,
          scheduledDate: dateObj,
          timeSlot,
          note,
          engineerId: engineerId,
          createdById: user.id,
          status: AppointmentStatus.SCHEDULED,
        },
      }),
      prisma.repairOrder.update({
        where: { id: orderId },
        data: orderUpdateData,
      }),
    ];

    if (isFirstAssignment) {
      txItems.push(
        prisma.statusLog.create({
          data: {
            repairOrderId: orderId,
            fromStatus: order.status,
            toStatus: RepairStatus.ASSIGNED,
            note: `分配给工程师${engineer.name}`,
            operatorId: user.id,
          },
        }),
        prisma.statusLog.create({
          data: {
            repairOrderId: orderId,
            fromStatus: RepairStatus.ASSIGNED,
            toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
            note: `预约上门时间：${scheduledDate} ${timeSlot}${note ? ' - ' + note : ''}`,
            operatorId: user.id,
          },
        })
      );
    } else if (isReassignment) {
      txItems.push(
        prisma.statusLog.create({
          data: {
            repairOrderId: orderId,
            fromStatus: order.status,
            toStatus: RepairStatus.ASSIGNED,
            note: `改派给工程师${engineer.name}`,
            operatorId: user.id,
          },
        }),
        prisma.statusLog.create({
          data: {
            repairOrderId: orderId,
            fromStatus: RepairStatus.ASSIGNED,
            toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
            note: `预约上门时间：${scheduledDate} ${timeSlot}${note ? ' - ' + note : ''}`,
            operatorId: user.id,
          },
        })
      );
    } else {
      txItems.push(
        prisma.statusLog.create({
          data: {
            repairOrderId: orderId,
            fromStatus: order.status,
            toStatus: RepairStatus.APPOINTMENT_SCHEDULED,
            note: `预约上门时间：${scheduledDate} ${timeSlot}${note ? ' - ' + note : ''}`,
            operatorId: user.id,
          },
        })
      );
    }

    await prisma.$transaction(txItems);

    return { success: true };
  } catch (err: any) {
    console.error('scheduleAppointment error:', err);
    return { error: err?.message || '预约失败，请稍后重试' };
  }
}

export async function confirmCustomer(orderId: string) {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (order.status !== RepairStatus.REPAIR_COMPLETED) return { error: '当前状态不可操作' };

  await prisma.$transaction([
    prisma.repairOrder.update({
      where: { id: orderId },
      data: { status: RepairStatus.CUSTOMER_CONFIRMED },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: RepairStatus.REPAIR_COMPLETED,
        toStatus: RepairStatus.CUSTOMER_CONFIRMED,
        note: `客服${user.name}电话回访，客户确认维修满意`,
        operatorId: user.id,
      },
    }),
  ]);

  return { success: true };
}

export async function closeOrder(formData: FormData) {
  const user = await requireRole([Role.CUSTOMER_SERVICE]);

  const orderId = formData.get('orderId') as string;
  const closedNote = formData.get('closedNote') as string;

  const order = await prisma.repairOrder.findUnique({ where: { id: orderId } });
  if (!order) return { error: '工单不存在' };
  if (
    order.status !== RepairStatus.CUSTOMER_CONFIRMED &&
    order.status !== RepairStatus.REPAIR_COMPLETED
  )
    return { error: '当前状态不可关闭' };

  await prisma.$transaction([
    prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status: RepairStatus.CLOSED,
        closedById: user.id,
        closedNote,
      },
    }),
    prisma.statusLog.create({
      data: {
        repairOrderId: orderId,
        fromStatus: order.status,
        toStatus: RepairStatus.CLOSED,
        note: closedNote || `客服${user.name}关闭工单`,
        operatorId: user.id,
      },
    }),
  ]);

  return { success: true };
}
