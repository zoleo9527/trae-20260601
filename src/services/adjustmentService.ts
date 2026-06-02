import prisma from '../lib/prisma.js';
import type { AdjustmentRecord } from '@prisma/client';

export type AdjustmentType = 'WEIGHT_REFUND' | 'WEIGHT_SUPPLEMENT' | 'OUT_OF_STOCK_REFUND' | 'BAD_PRODUCT_COMP' | 'COMMISSION_ADJUST' | 'OTHER';
export type AdjustmentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface CreateAdjustmentDto {
  orderId: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  operator: string;
}

export interface HandleAdjustmentDto {
  status: AdjustmentStatus;
  operator: string;
  comment?: string;
}

export class AdjustmentService {
  async createAdjustment(dto: CreateAdjustmentDto): Promise<AdjustmentRecord> {
    const adjustmentNo = await this.generateAdjustmentNo();

    return prisma.adjustmentRecord.create({
      data: {
        adjustmentNo,
        orderId: dto.orderId,
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
        status: 'PENDING',
        operator: dto.operator,
      },
    });
  }

  async getAdjustment(id: string): Promise<AdjustmentRecord | null> {
    return prisma.adjustmentRecord.findUnique({
      where: { id },
      include: {
        order: true,
        afterSale: true,
      },
    });
  }

  async listAdjustments(
    orderId?: string,
    type?: AdjustmentType,
    status?: AdjustmentStatus,
  ): Promise<AdjustmentRecord[]> {
    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (type) where.type = type;
    if (status) where.status = status;

    return prisma.adjustmentRecord.findMany({
      where,
      include: {
        order: true,
        afterSale: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleAdjustment(adjustmentId: string, dto: HandleAdjustmentDto): Promise<AdjustmentRecord> {
    return prisma.adjustmentRecord.update({
      where: { id: adjustmentId },
      data: {
        status: dto.status,
        operator: dto.operator,
      },
    });
  }

  async listUnsettledAdjustments(): Promise<AdjustmentRecord[]> {
    return prisma.adjustmentRecord.findMany({
      where: {
        status: 'CONFIRMED',
        settlementId: null,
      },
      include: {
        order: {
          include: {
            groupPoint: {
              include: { leader: true },
            },
          },
        },
        afterSale: true,
      },
    });
  }

  private async generateAdjustmentNo(): Promise<string> {
    const date = new Date();
    const prefix = `ADJ${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await prisma.adjustmentRecord.count({
      where: {
        adjustmentNo: {
          startsWith: prefix,
        },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
}

export const adjustmentService = new AdjustmentService();
