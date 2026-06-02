import prisma from '../lib/prisma.js';
import {
  calculateCommission,
  calculateNetSettlement,
  generateOrderCommissionLine,
  generateWeightAdjustmentLine,
  generateRefundLine,
  generateCompensationLine,
  generateCommissionAdjustmentLine,
  generateSummaryLine,
  type SettlementDetailLine,
} from '../utils/amountCalculator.js';
import type { CommissionSettlement } from '@prisma/client';

export type SettlementStatus = 'DRAFT' | 'REVIEWING' | 'LOCKED' | 'PAID' | 'DISPUTED';

export interface CreateSettlementDto {
  leaderId: string;
  periodStart: Date;
  periodEnd: Date;
  batchIds: string[];
  createdBy: string;
}

export interface SettlementWithDetails extends CommissionSettlement {
  detailLines: SettlementDetailLine[];
}

export class SettlementService {
  async createSettlement(dto: CreateSettlementDto): Promise<SettlementWithDetails> {
    const settlementNo = await this.generateSettlementNo();

    const batches = await prisma.fulfillmentBatch.findMany({
      where: {
        id: { in: dto.batchIds },
        status: { in: ['DELIVERED', 'SETTLED'] },
      },
      include: {
        groupPoint: { include: { leader: true } },
        orders: {
          include: {
            items: true,
            afterSales: {
              where: { status: { in: ['APPROVED', 'COMPLETED'] } },
            },
            adjustments: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
    });

    const leader = await prisma.leader.findUniqueOrThrow({
      where: { id: dto.leaderId },
    });

    // 计算各项金额
    const calculationResult = this.calculateSettlementAmounts(batches, leader.commissionRate);
    const detailLines = this.generateDetailLines(batches, calculationResult, leader.commissionRate);

    const settlement = await prisma.$transaction(async (tx) => {
      const s = await tx.commissionSettlement.create({
        data: {
          settlementNo,
          leaderId: dto.leaderId,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          status: 'DRAFT',
          orderTotalAmount: calculationResult.orderTotalAmount,
          commissionBase: calculationResult.commissionBase,
          commissionAmount: calculationResult.commissionAmount,
          weightAdjustment: calculationResult.weightAdjustment,
          refundAmount: calculationResult.refundAmount,
          compensationAmount: calculationResult.compensationAmount,
          commissionAdjust: calculationResult.commissionAdjust,
          netSettlement: calculationResult.netSettlement,
          createdBy: dto.createdBy,
        },
      });

      await tx.fulfillmentBatch.updateMany({
        where: { id: { in: dto.batchIds } },
        data: {
          settlementId: s.id,
          status: 'SETTLED',
          settledAt: new Date(),
        },
      });

      const allAfterSaleIds: string[] = [];
      const allAdjustmentIds: string[] = [];

      for (const batch of batches) {
        for (const order of batch.orders) {
          for (const as of order.afterSales) {
            if (as.status === 'APPROVED' || as.status === 'COMPLETED') {
              allAfterSaleIds.push(as.id);
            }
          }
          for (const adj of order.adjustments) {
            if (adj.status === 'CONFIRMED') {
              allAdjustmentIds.push(adj.id);
            }
          }
        }
      }

      if (allAfterSaleIds.length > 0) {
        await tx.afterSaleOrder.updateMany({
          where: { id: { in: allAfterSaleIds } },
          data: { settlementId: s.id },
        });
      }

      if (allAdjustmentIds.length > 0) {
        await tx.adjustmentRecord.updateMany({
          where: { id: { in: allAdjustmentIds } },
          data: { settlementId: s.id },
        });
      }

      return s;
    });

    return {
      ...settlement,
      detailLines,
    };
  }

  async getSettlement(id: string): Promise<SettlementWithDetails | null> {
    const settlement = await prisma.commissionSettlement.findUnique({
      where: { id },
      include: {
        leader: true,
        batches: {
          include: {
            orders: {
              include: {
                items: true,
                afterSales: true,
                adjustments: true,
              },
            },
          },
        },
        afterSales: true,
        adjustments: true,
      },
    });

    if (!settlement) return null;

    const detailLines = this.generateDetailLines(
      settlement.batches,
      {
        orderTotalAmount: settlement.orderTotalAmount,
        commissionBase: settlement.commissionBase,
        commissionAmount: settlement.commissionAmount,
        weightAdjustment: settlement.weightAdjustment,
        refundAmount: settlement.refundAmount,
        compensationAmount: settlement.compensationAmount,
        commissionAdjust: settlement.commissionAdjust,
        netSettlement: settlement.netSettlement,
      },
      settlement.leader.commissionRate,
    );

    return {
      ...settlement,
      detailLines,
    };
  }

  async listSettlements(
    leaderId?: string,
    status?: SettlementStatus,
  ): Promise<CommissionSettlement[]> {
    const where: any = {};
    if (leaderId) where.leaderId = leaderId;
    if (status) where.status = status;

    return prisma.commissionSettlement.findMany({
      where,
      include: {
        leader: true,
        _count: {
          select: { batches: true, afterSales: true, adjustments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitForReview(settlementId: string): Promise<CommissionSettlement> {
    return prisma.commissionSettlement.update({
      where: { id: settlementId },
      data: { status: 'REVIEWING' },
    });
  }

  async lockSettlement(settlementId: string, lockedBy: string): Promise<CommissionSettlement> {
    return prisma.commissionSettlement.update({
      where: { id: settlementId },
      data: {
        status: 'LOCKED',
        lockedBy,
        lockedAt: new Date(),
      },
    });
  }

  async markPaid(settlementId: string): Promise<CommissionSettlement> {
    return prisma.commissionSettlement.update({
      where: { id: settlementId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  async flagDispute(settlementId: string): Promise<CommissionSettlement> {
    return prisma.commissionSettlement.update({
      where: { id: settlementId },
      data: { status: 'DISPUTED' },
    });
  }

  async getLeaderSettlementDetails(leaderId: string, settlementId: string): Promise<SettlementWithDetails | null> {
    const settlement = await this.getSettlement(settlementId);
    if (!settlement || settlement.leaderId !== leaderId) {
      return null;
    }
    return settlement;
  }

  private calculateSettlementAmounts(
    batches: any[],
    defaultCommissionRate: number,
  ) {
    let orderTotalAmount = 0;
    let commissionBase = 0;
    let weightAdjustment = 0;
    let refundAmount = 0;
    let compensationAmount = 0;
    let commissionAdjust = 0;

    for (const batch of batches) {
      for (const order of batch.orders) {
        orderTotalAmount += order.totalAmount;

        const orderActualAmount = order.actualAmount ?? order.totalAmount;
        commissionBase += orderActualAmount;

        // 称重补差
        for (const item of order.items) {
          if (item.weightDiff) {
            weightAdjustment += item.weightDiff;
          }
        }

        // 退款和赔付
        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' || as.type === 'WEIGHT_DIFF') {
            refundAmount += as.amount;
          } else if (as.type === 'BAD_PRODUCT') {
            compensationAmount += as.amount;
          }
        }

        // 佣金调整
        for (const adj of order.adjustments) {
          if (adj.type === 'COMMISSION_ADJUST') {
            commissionAdjust += adj.amount;
          }
        }
      }
    }

    const commissionAmount = calculateCommission(commissionBase, defaultCommissionRate);
    const netSettlement = calculateNetSettlement({
      commissionAmount,
      weightAdjustment,
      refundAmount,
      compensationAmount,
      commissionAdjust,
    });

    return {
      orderTotalAmount,
      commissionBase,
      commissionAmount,
      weightAdjustment,
      refundAmount,
      compensationAmount,
      commissionAdjust,
      netSettlement,
    };
  }

  private generateDetailLines(
    batches: any[],
    amounts: {
      orderTotalAmount: number;
      commissionBase: number;
      commissionAmount: number;
      weightAdjustment: number;
      refundAmount: number;
      compensationAmount: number;
      commissionAdjust: number;
      netSettlement: number;
    },
    commissionRate: number,
  ): SettlementDetailLine[] {
    const lines: SettlementDetailLine[] = [];
    let orderCount = 0;

    for (const batch of batches) {
      for (const order of batch.orders) {
        orderCount++;

        const orderActualAmount = order.actualAmount ?? order.totalAmount;
        const orderCommission = calculateCommission(orderActualAmount, commissionRate);

        lines.push(
          generateOrderCommissionLine({
            orderNo: order.orderNo,
            orderAmount: order.totalAmount,
            commissionBase: orderActualAmount,
            commissionRate,
            commissionAmount: orderCommission,
          }),
        );

        // 称重补差明细
        for (const item of order.items) {
          if (item.weightDiff && item.weightDiff !== 0) {
            const diffRate = item.subtotal > 0
              ? Math.abs((item.weightDiff / item.subtotal) * 1000)
              : 0;

            lines.push(
              generateWeightAdjustmentLine({
                orderNo: order.orderNo,
                estimatedAmount: item.subtotal,
                actualAmount: item.actualSubtotal ?? item.subtotal,
                diff: item.weightDiff,
                diffRate: Math.round(diffRate * 100) / 100,
              }),
            );
          }
        }

        // 售后明细
        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' || as.type === 'WEIGHT_DIFF') {
            lines.push(
              generateRefundLine({
                orderNo: order.orderNo,
                afterSaleNo: as.afterSaleNo,
                reason: as.reason,
                amount: as.amount,
              }),
            );
          } else if (as.type === 'BAD_PRODUCT') {
            const badRate = 0; // 可以从售后单扩展字段获取
            lines.push(
              generateCompensationLine({
                orderNo: order.orderNo,
                afterSaleNo: as.afterSaleNo,
                badRate,
                orderAmount: order.totalAmount,
                compensation: as.amount,
              }),
            );
          }
        }

        // 佣金调整明细
        for (const adj of order.adjustments) {
          if (adj.type === 'COMMISSION_ADJUST') {
            lines.push(
              generateCommissionAdjustmentLine({
                adjustmentNo: adj.adjustmentNo,
                reason: adj.reason,
                amount: adj.amount,
                operator: adj.operator ?? '系统',
              }),
            );
          }
        }
      }
    }

    // 汇总行
    lines.push(
      generateSummaryLine({
        orderCount,
        orderTotal: amounts.orderTotalAmount,
        commissionTotal: amounts.commissionAmount,
        weightAdjustment: amounts.weightAdjustment,
        refundTotal: amounts.refundAmount,
        compensationTotal: amounts.compensationAmount,
        commissionAdjust: amounts.commissionAdjust,
        netSettlement: amounts.netSettlement,
      }),
    );

    return lines;
  }

  private async generateSettlementNo(): Promise<string> {
    const date = new Date();
    const prefix = `SET${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await prisma.commissionSettlement.count({
      where: {
        settlementNo: {
          startsWith: prefix,
        },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
}

export const settlementService = new SettlementService();
