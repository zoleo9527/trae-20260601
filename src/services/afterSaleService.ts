import prisma from '../lib/prisma.js';
import { calculateBadProductCompensation, calculateOutOfStockRefund } from '../utils/amountCalculator.js';
import type { AfterSaleOrder } from '@prisma/client';

export type AfterSaleType = 'OUT_OF_STOCK' | 'BAD_PRODUCT' | 'WEIGHT_DIFF' | 'OTHER';
export type AfterSaleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface CreateAfterSaleDto {
  orderId: string;
  type: AfterSaleType;
  reason: string;
  amount?: number;
  // 坏果赔付需要
  badQuantity?: number;
  totalQuantity?: number;
  // 缺货退款需要
  productId?: string;
  quantity?: number;
}

export interface HandleAfterSaleDto {
  status: AfterSaleStatus;
  handledBy: string;
  comment?: string;
}

export class AfterSaleService {
  async createAfterSale(dto: CreateAfterSaleDto): Promise<AfterSaleOrder> {
    const afterSaleNo = await this.generateAfterSaleNo();
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: dto.orderId },
      include: { items: true },
    });

    let amount = dto.amount || 0;
    let badQuantity: number | undefined;
    let totalQuantity: number | undefined;
    let badRate: number | undefined;
    let productId: string | undefined;
    let quantity: number | undefined;
    let unitPrice: number | undefined;
    let calculationDetail: string | undefined;

    // 根据类型自动计算金额
    switch (dto.type) {
      case 'OUT_OF_STOCK': {
        const item = order.items.find((i) => i.productId === dto.productId);
        if (item && dto.quantity) {
          amount = calculateOutOfStockRefund(item.unitPrice, dto.quantity);
          productId = dto.productId;
          quantity = dto.quantity;
          unitPrice = item.unitPrice;
          calculationDetail = `缺货商品单价${item.unitPrice}分 × 数量${dto.quantity} = 退款${amount}分`;
        }
        break;
      }
      case 'BAD_PRODUCT': {
        if (dto.badQuantity && dto.totalQuantity) {
          const result = calculateBadProductCompensation(
            order.totalAmount,
            dto.totalQuantity,
            dto.badQuantity,
          );
          amount = result.compensation;
          badQuantity = dto.badQuantity;
          totalQuantity = dto.totalQuantity;
          badRate = result.badRate;
          const badProductAmount = Math.floor((order.totalAmount * badQuantity) / totalQuantity);
          calculationDetail = `订单总额${order.totalAmount}分 × 坏果占比${badQuantity}/${totalQuantity} = 坏果金额${badProductAmount}分 × 120% = 赔付${amount}分（坏果率${result.badRate}%）`;
        }
        break;
      }
      case 'WEIGHT_DIFF': {
        if (dto.amount) {
          calculationDetail = `称重差异${dto.amount}分`;
        }
        break;
      }
    }

    const afterSale = await prisma.afterSaleOrder.create({
      data: {
        afterSaleNo,
        orderId: dto.orderId,
        type: dto.type,
        reason: dto.reason,
        amount,
        status: 'PENDING',
        badQuantity,
        totalQuantity,
        badRate,
        productId,
        quantity,
        unitPrice,
        calculationDetail,
      },
    });

    // 创建对应的补差记录
    await prisma.adjustmentRecord.create({
      data: {
        adjustmentNo: await this.generateAdjustmentNo(),
        orderId: dto.orderId,
        afterSaleId: afterSale.id,
        type: this.mapAfterSaleToAdjustmentType(dto.type),
        amount: -amount, // 售后金额从团长处扣除
        reason: dto.reason,
        status: 'PENDING',
      },
    });

    return afterSale;
  }

  async getAfterSale(id: string): Promise<AfterSaleOrder | null> {
    return prisma.afterSaleOrder.findUnique({
      where: { id },
      include: {
        order: { include: { items: true } },
      },
    });
  }

  async listAfterSales(
    orderId?: string,
    type?: AfterSaleType,
    status?: AfterSaleStatus,
  ): Promise<AfterSaleOrder[]> {
    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (type) where.type = type;
    if (status) where.status = status;

    return prisma.afterSaleOrder.findMany({
      where,
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleAfterSale(afterSaleId: string, dto: HandleAfterSaleDto): Promise<AfterSaleOrder> {
    return prisma.$transaction(async (tx) => {
      const afterSale = await tx.afterSaleOrder.update({
        where: { id: afterSaleId },
        data: {
          status: dto.status,
          handledBy: dto.handledBy,
          handledAt: new Date(),
        },
        include: { adjustments: true },
      });

      // 同步更新补差记录状态
      const adjustmentStatus = dto.status === 'APPROVED' || dto.status === 'COMPLETED' ? 'CONFIRMED' : 'REJECTED';

      for (const adj of afterSale.adjustments) {
        await tx.adjustmentRecord.update({
          where: { id: adj.id },
          data: { status: adjustmentStatus, operator: dto.handledBy },
        });
      }

      return afterSale;
    });
  }

  private mapAfterSaleToAdjustmentType(type: AfterSaleType): any {
    const map: Record<string, string> = {
      OUT_OF_STOCK: 'OUT_OF_STOCK_REFUND',
      BAD_PRODUCT: 'BAD_PRODUCT_COMP',
      WEIGHT_DIFF: 'WEIGHT_REFUND',
      OTHER: 'OTHER',
    };
    return map[type] || 'OTHER';
  }

  private async generateAfterSaleNo(): Promise<string> {
    const date = new Date();
    const prefix = `AS${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await prisma.afterSaleOrder.count({
      where: {
        afterSaleNo: {
          startsWith: prefix,
        },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
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

export const afterSaleService = new AfterSaleService();
