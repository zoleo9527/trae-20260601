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

        // 收集已有售后单的商品ID，避免重复计算
        const afterSaleProductIds = new Set<string>();
        const hasWeightDiffAfterSale = order.afterSales.some((as: any) => as.type === 'WEIGHT_DIFF');

        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' && as.productId) {
            afterSaleProductIds.add(as.productId);
          }
        }

        // 称重补差 - 关键修复：跳过已有售后单的订单项
        for (const item of order.items) {
          if (item.weightDiff && item.weightDiff !== 0) {
            // 如果订单项商品已有缺货售后单，跳过，避免重复扣除
            const hasOutOfStockAfterSale = afterSaleProductIds.has(item.productId);
            // 如果订单已有称重补差售后单，跳过订单项级别的称重差
            if (!hasOutOfStockAfterSale && !hasWeightDiffAfterSale) {
              weightAdjustment += item.weightDiff;
            }
          }
        }

        // 退款和赔付 - 从售后单汇总
        for (const as of order.afterSales) {
          if (as.status !== 'APPROVED' && as.status !== 'COMPLETED') continue;

          if (as.type === 'OUT_OF_STOCK' || as.type === 'WEIGHT_DIFF') {
            refundAmount += as.amount;
          } else if (as.type === 'BAD_PRODUCT') {
            compensationAmount += as.amount;
          }
        }

        // 佣金调整 - 从补差记录汇总（排除售后关联的，只取独立的佣金调整）
        for (const adj of order.adjustments) {
          if (adj.status !== 'CONFIRMED') continue;
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
    // 按类型分组收集明细，便于前端按类别展示
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

        // ===== 1. 订单佣金明细 =====
        commissionLines.push(
          generateOrderCommissionLine({
            orderNo: order.orderNo,
            orderAmount: order.totalAmount,
            commissionBase: orderActualAmount,
            commissionRate,
            commissionAmount: orderCommission,
          }),
        );

        // 收集已有售后单的商品ID，避免重复展示
        const afterSaleProductIds = new Set<string>();
        const hasWeightDiffAfterSale = order.afterSales.some((as: any) => as.type === 'WEIGHT_DIFF');

        for (const as of order.afterSales) {
          if (as.type === 'OUT_OF_STOCK' && as.productId) {
            afterSaleProductIds.add(as.productId);
          }
        }

        // ===== 2. 称重补差明细 =====
        // 关键修复：跳过已有售后单的订单项，避免重复展示
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

        // ===== 3. 售后退款 & 赔付明细 =====
        for (const as of order.afterSales) {
          if (as.status !== 'APPROVED' && as.status !== 'COMPLETED') continue;

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
            // 用计算依据覆盖默认的计算详情
            refundLines[refundLines.length - 1].calculationDetail = detail;
          } else if (as.type === 'BAD_PRODUCT') {
            // 使用售后单存储的坏果率，不再硬编码为0
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
            // 用计算依据覆盖默认的计算详情
            compensationLines[compensationLines.length - 1].calculationDetail = detail;
          }
        }

        // ===== 4. 佣金调整明细 =====
        // 只取独立的佣金调整（排除售后关联的）
        for (const adj of order.adjustments) {
          if (adj.status !== 'CONFIRMED') continue;
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

    // ===== 按类别顺序组装明细 =====
    const lines: SettlementDetailLine[] = [];

    // 1. 佣金明细
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

    // 2. 称重补差明细
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

    // 3. 退款明细
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

    // 4. 赔付明细
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

    // 5. 佣金调整明细
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

    // 6. 最终汇总行
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
