import prisma from '../lib/prisma.js';
import { calculateWeightAdjustment } from '../utils/amountCalculator.js';
import type { Order, OrderItem } from '@prisma/client';

export type OrderStatus = 'PENDING' | 'FULFILLED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderDto {
  groupPointId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItemDto[];
}

export interface FulfillOrderItemDto {
  orderItemId: string;
  actualQuantity: number;
  actualSubtotal: number;
}

export interface FulfillOrderDto {
  items: FulfillOrderItemDto[];
}

export class OrderService {
  async createOrder(dto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    const orderNo = await this.generateOrderNo();
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const order = await prisma.order.create({
      data: {
        orderNo,
        groupPointId: dto.groupPointId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        totalAmount,
        status: 'PENDING',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  }

  async getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
    return prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async getOrderByNo(orderNo: string): Promise<(Order & { items: OrderItem[] }) | null> {
    return prisma.order.findUnique({
      where: { orderNo },
      include: { items: true },
    });
  }

  async listOrders(groupPointId?: string, status?: OrderStatus): Promise<Array<Order & { items: OrderItem[] }>> {
    const where: any = {};
    if (groupPointId) where.groupPointId = groupPointId;
    if (status) where.status = status;

    return prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async fulfillOrder(orderId: string, dto: FulfillOrderDto): Promise<Order & { items: OrderItem[] }> {
    let actualTotal = 0;
    const itemUpdates = [];

    for (const item of dto.items) {
      const orderItem = await prisma.orderItem.findUniqueOrThrow({
        where: { id: item.orderItemId },
      });

      const weightResult = calculateWeightAdjustment(orderItem.subtotal, item.actualSubtotal);

      itemUpdates.push(
        prisma.orderItem.update({
          where: { id: item.orderItemId },
          data: {
            actualQuantity: item.actualQuantity,
            actualSubtotal: item.actualSubtotal,
            weightDiff: weightResult.diff,
          },
        }),
      );

      actualTotal += item.actualSubtotal;
    }

    await prisma.$transaction([
      ...itemUpdates,
      prisma.order.update({
        where: { id: orderId },
        data: {
          actualAmount: actualTotal,
          status: 'FULFILLED',
        },
      }),
    ]);

    return this.getOrder(orderId) as Promise<Order & { items: OrderItem[] }>;
  }

  async completeOrder(orderId: string): Promise<Order> {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });
  }

  async cancelOrder(orderId: string): Promise<Order> {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await prisma.order.count({
      where: {
        orderNo: {
          startsWith: prefix,
        },
      },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
}

export const orderService = new OrderService();
