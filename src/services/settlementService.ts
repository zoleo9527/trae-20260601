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

export interface SettlementSummary {
  id: string;
  settlementNo: string;
  periodStart: Date;
  periodEnd: Date;
  status: SettlementStatus;
  netSettlement: number;
  refundAmount: number;
  compensationAmount: number;
  commissionAdjust: number;
  isDisputed: boolean;
  batchCount: number;
  orderCount: number;
  afterSaleCount: number;
  adjustmentCount: number;
  createdAt: Date;
  lockedAt?: Date | null;
  paidAt?: Date | null;
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
            allAfterSaleIds.push(as.id);
          }
          for (const adj of order.adjustments) {
            allAdjustmentIds.push(adj.id);
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
              },
            },
          },
        },
        afterSales: true,
        adjustments: true,
      },
    });

    if (!settlement) return null;

    const scopedBatches = this.attachSettlementRecordsToOrders(
      settlement.batches,
      settlement.afterSales,
      settlement.adjustments,
    );

    const detailLines = this.generateDetailLines(
      scopedBatches,
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

  async listLeaderSettlements(
    leaderId: string,
    status?: SettlementStatus,
  ): Promise<SettlementSummary[]> {
    const where: any = { leaderId };
    if (status) where.status = status;

    const settlements = await prisma.commissionSettlement.findMany({
      where,
      include: {
        batches: {
          select: { id: true, totalOrderCount: true },
        },
        _count: {
          select: { afterSales: true, adjustments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return settlements.map((s: any) => ({
      id: s.id,
      settlementNo: s.settlementNo,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      status: s.status as SettlementStatus,
      netSettlement: s.netSettlement,
      refundAmount: s.refundAmount,
      compensationAmount: s.compensationAmount,
      commissionAdjust: s.commissionAdjust,
      isDisputed: s.status === 'DISPUTED',
      batchCount: s.batches.length,
      orderCount: s.batches.reduce((sum: number, b: any) => sum + b.totalOrderCount, 0),
      afterSaleCount: s._count.afterSales,
      adjustmentCount: s._count.adjustments,
      createdAt: s.createdAt,
      lockedAt: s.lockedAt,
      paidAt: s.paidAt,
    }));
  }

  async getLeaderSettlementDetails(leaderId: string, settlementId: string): Promise<SettlementWithDetails | null> {
    const settlement = await this.getSettlement(settlementId);
    if (!settlement || settlement.leaderId !== leaderId) {
      return null;
    }
    return settlement;
  }

  private attachSettlementRecordsToOrders(
    batches: any[],
    afterSales: any[],
    adjustments: any[],
  ): any[] {
    const afterSalesByOrderId = new Map<string, any[]>();
    for (const as of afterSales) {
      const list = afterSalesByOrderId.get(as.orderId) || [];
      list.push(as);
      afterSalesByOrderId.set(as.orderId, list);
    }

    const adjustmentsByOrderId = new Map<string, any[]>();
    for (const adj of adjustments) {
      const list = adjustmentsByOrderId.get(adj.orderId) || [];
      list.push(adj);
      adjustmentsByOrderId.set(adj.orderId, list);
    }

    for (const batch of batches) {
      for (const order of batch.orders) {
        order.afterSales = afterSalesByOrderId.get(order.id) || [];
        order.adjustments = adjustmentsByOrderId.get(order.id) || [];
      }
    }

    return batches;
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

        const afterSaleProductIds = new Set<string>();
        const hasWeightDiffAfterSale = order.afterSales.some((as: any) => as.type === 'WEIGHT_DIFF');

        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' && as.productId) {
            afterSaleProductIds.add(as.productId);
          }
        }

        for (const item of order.items) {
          if (item.weightDiff && item.weightDiff !== 0) {
            const hasOutOfStockAfterSale = afterSaleProductIds.has(item.productId);
            if (!hasOutOfStockAfterSale && !hasWeightDiffAfterSale) {
              weightAdjustment += item.weightDiff;
            }
          }
        }

        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' || as.type === 'WEIGHT_DIFF') {
            refundAmount += as.amount;
          } else if (as.type === 'BAD_PRODUCT') {
            compensationAmount += as.amount;
          }
        }

        for (const adj of order.adjustments) {
          if (adj.type === 'COMMISSION_ADJUST' && !adj.afterSaleId) {
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
    const commissionLines: SettlementDetailLine[] = [];
    const weightLines: SettlementDetailLine[] = [];
    const refundLines: SettlementDetailLine[] = [];
    const compensationLines: SettlementDetailLine[] = [];
    const adjustmentLines: SettlementDetailLine[] = [];
    let orderCount = 0;

    for (const batch of batches) {
      for (const order of batch.orders) {
        orderCount++;

        const orderActualAmount = order.actualAmount ?? order.totalAmount;
        const orderCommission = calculateCommission(orderActualAmount, commissionRate);

        commissionLines.push(
          generateOrderCommissionLine({
            orderNo: order.orderNo,
            orderAmount: order.totalAmount,
            commissionBase: orderActualAmount,
            commissionRate,
            commissionAmount: orderCommission,
          }),
        );

        const afterSaleProductIds = new Set<string>();
        const hasWeightDiffAfterSale = order.afterSales.some((as: any) => as.type === 'WEIGHT_DIFF');

        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' && as.productId) {
            afterSaleProductIds.add(as.productId);
          }
        }

        for (const item of order.items) {
          if (item.weightDiff && item.weightDiff !== 0) {
            const hasOutOfStockAfterSale = afterSaleProductIds.has(item.productId);
            if (!hasOutOfStockAfterSale && !hasWeightDiffAfterSale) {
              const diffRate = item.subtotal > 0
                ? Math.abs((item.weightDiff / item.subtotal) * 1000)
                : 0;

              weightLines.push(
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
        }

        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' || as.type === 'WEIGHT_DIFF') {
            const detail = as.calculationDetail || `售后单 ${as.afterSaleNo}：${as.reason}，退款 ${as.amount}分`;
            refundLines.push(
              generateRefundLine({
                orderNo: order.orderNo,
                afterSaleNo: as.afterSaleNo,
                reason: as.reason,
                amount: as.amount,
              }),
            );
            refundLines[refundLines.length - 1].calculationDetail = detail;
          } else if (as.type === 'BAD_PRODUCT') {
            const badRate = as.badRate ?? 0;
            const detail = as.calculationDetail ||
              `售后单 ${as.afterSaleNo}：坏果率${badRate}%，订单金额${order.totalAmount}分，赔付${as.amount}分`;

            compensationLines.push(
              generateCompensationLine({
                orderNo: order.orderNo,
                afterSaleNo: as.afterSaleNo,
                badRate,
                orderAmount: order.totalAmount,
                compensation: as.amount,
              }),
            );
            compensationLines[compensationLines.length - 1].calculationDetail = detail;
          }
        }

        for (const adj of order.adjustments) {
          if (adj.type === 'COMMISSION_ADJUST' && !adj.afterSaleId) {
            adjustmentLines.push(
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

    const lines: SettlementDetailLine[] = [];

    if (commissionLines.length > 0) {
      lines.push({
        lineType: 'summary',
        description: '===== 一、订单佣金 =====',
        amount: amounts.commissionAmount,
        calculationFormula: '小计',
        calculationDetail: `共 ${commissionLines.length} 笔订单佣金，合计 ${amounts.commissionAmount} 分`,
      });
      lines.push(...commissionLines);
    }

    if (weightLines.length > 0) {
      lines.push({
        lineType: 'summary',
        description: '===== 二、称重补差 =====',
        amount: amounts.weightAdjustment,
        calculationFormula: '小计',
        calculationDetail: `共 ${weightLines.length} 笔称重差异，合计 ${amounts.weightAdjustment} 分`,
      });
      lines.push(...weightLines);
    }

    if (refundLines.length > 0) {
      lines.push({
        lineType: 'summary',
        description: '===== 三、退款扣除 =====',
        amount: -amounts.refundAmount,
        calculationFormula: '小计',
        calculationDetail: `共 ${refundLines.length} 笔退款，合计扣除 ${amounts.refundAmount} 分`,
      });
      lines.push(...refundLines);
    }

    if (compensationLines.length > 0) {
      lines.push({
        lineType: 'summary',
        description: '===== 四、赔付扣除 =====',
        amount: -amounts.compensationAmount,
        calculationFormula: '小计',
        calculationDetail: `共 ${compensationLines.length} 笔赔付，合计扣除 ${amounts.compensationAmount} 分`,
      });
      lines.push(...compensationLines);
    }

    if (adjustmentLines.length > 0) {
      lines.push({
        lineType: 'summary',
        description: '===== 五、佣金调整 =====',
        amount: amounts.commissionAdjust,
        calculationFormula: '小计',
        calculationDetail: `共 ${adjustmentLines.length} 笔调整，合计 ${amounts.commissionAdjust} 分`,
      });
      lines.push(...adjustmentLines);
    }

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
