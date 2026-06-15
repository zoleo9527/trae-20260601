'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { Role, PartRequestStatus, RepairStatus } from '@/lib/enums';

export async function approvePartRequest(formData: FormData) {
  const user = await requireRole([Role.PARTS_ADMIN]);

  const requestId = formData.get('requestId') as string;
  const approvalNote = formData.get('approvalNote') as string;
  const deliveredItemsStr = formData.get('deliveredItems') as string;
  const deliveredItems = JSON.parse(deliveredItemsStr || '[]');

  const request = await prisma.partRequest.findUnique({
    where: { id: requestId },
    include: { items: true },
  });

  if (!request) return { error: '申请不存在' };
  if (request.status !== PartRequestStatus.PENDING && request.status !== PartRequestStatus.APPROVED)
    return { error: '当前状态不可审批' };

  const tx: any[] = [];

  for (const item of deliveredItems) {
    const origItem = request.items.find((i) => i.id === item.itemId);
    if (!origItem) continue;

    const actualDeliver = Math.min(item.qty, origItem.quantity);

    tx.push(
      prisma.partRequestItem.update({
        where: { id: item.itemId },
        data: { deliveredQty: actualDeliver },
      })
    );

    tx.push(
      prisma.part.update({
        where: { id: origItem.partId },
        data: { stock: { decrement: actualDeliver } },
      })
    );
  }

  tx.push(
    prisma.partRequest.update({
      where: { id: requestId },
      data: {
        status: PartRequestStatus.DELIVERED,
        approvedById: user.id,
        approvalNote,
        deliveredAt: new Date(),
      },
    })
  );

  const order = await prisma.repairOrder.findUnique({ where: { id: request.repairOrderId } });
  if (order && order.status === RepairStatus.PARTS_REQUESTED) {
    tx.push(
      prisma.repairOrder.update({
        where: { id: request.repairOrderId },
        data: { status: RepairStatus.PARTS_DELIVERED },
      })
    );
    tx.push(
      prisma.statusLog.create({
        data: {
          repairOrderId: request.repairOrderId,
          fromStatus: RepairStatus.PARTS_REQUESTED,
          toStatus: RepairStatus.PARTS_DELIVERED,
          note: approvalNote || `配件已出库发放，由${user.name}审批`,
          operatorId: user.id,
        },
      })
    );
  }

  await prisma.$transaction(tx);

  return { success: true };
}

export async function updatePartStock(formData: FormData) {
  await requireRole([Role.PARTS_ADMIN]);

  const partId = formData.get('partId') as string;
  const stockChange = parseInt(formData.get('stockChange') as string);
  const note = formData.get('note') as string;

  if (isNaN(stockChange)) return { error: '无效的数量' };

  await prisma.part.update({
    where: { id: partId },
    data: { stock: { increment: stockChange } },
  });

  return { success: true };
}
