import prisma from '../lib/prisma.js';
import type { FulfillmentBatch } from '@prisma/client';

export type BatchStatus = 'CREATED' | 'DELIVERED' | 'SETTLED';

export interface CreateBatchDto {
  groupPointId: string;
  deliveryDate: Date;
  orderIds: string[];
}

export class FulfillmentBatchService {
  async createBatch(dto: CreateBatchDto): Promise<FulfillmentBatch> {
    const batchNo = await this.generateBatchNo();

    const orders = await prisma.order.findMany({
      where: { id: { in: dto.orderIds } },
      include: { items: true },
    });

    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.fulfillmentBatch.create({
        data: {
          batchNo,
          groupPointId: dto.groupPointId,
          deliveryDate: dto.deliveryDate,
          status: 'CREATED',
          totalOrderCount: orders.length,
          totalAmount,
        },
      });

      await tx.order.updateMany({
        where: { id: { in: dto.orderIds } },
        data: { batchId: b.id },
      });

      return b;
    });

    return batch;
  }

  async getBatch(id: string): Promise<FulfillmentBatch | null> {
    return prisma.fulfillmentBatch.findUnique({
      where: { id },
      include: {
        groupPoint: { include: { leader: true } },
        orders: { include: { items: true } },
      },
    });
  }

  async listBatches(
    groupPointId?: string,
    status?: BatchStatus,
  ): Promise<FulfillmentBatch[]> {
    const where: any = {};
    if (groupPointId) where.groupPointId = groupPointId;
    if (status) where.status = status;

    return prisma.fulfillmentBatch.findMany({
      where,
      include: {
        groupPoint: { include: { leader: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markDelivered(batchId: string): Promise<FulfillmentBatch> {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.fulfillmentBatch.update({
        where: { id: batchId },
        data: { status: 'DELIVERED' },
      });

      await tx.order.updateMany({
        where: { batchId },
        data: { status: 'FULFILLED' },
      });

      return batch;
    });
  }

  async markSettled(batchId: string, settlementId: string): Promise<FulfillmentBatch> {
    return prisma.fulfillmentBatch.update({
      where: { id: batchId },
      data: {
        status: 'SETTLED',
        settlementId,
        settledAt: new Date(),
      },
    });
  }

  private async generateBatchNo(): Promise<string> {
    const date = new Date();
    const prefix = `BAT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await prisma.fulfillmentBatch.count({
      where: {
        batchNo: {
          startsWith: prefix,
        },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
}

export const fulfillmentBatchService = new FulfillmentBatchService();
