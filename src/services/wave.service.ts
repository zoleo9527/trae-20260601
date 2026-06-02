import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { WaveStatus, OrderStatus, PickTaskStatus, EmployeeRole } from '../types';
import prisma from '../lib/prisma';

export class WaveService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createWave(name: string | undefined, orderIds: string[], createdById: string) {
    return this.prisma.$transaction(async (tx) => {
      const supervisor = await tx.employee.findUnique({
        where: { id: createdById },
      });

      if (!supervisor) {
        throw new Error('员工不存在');
      }

      if (supervisor.role !== EmployeeRole.WAREHOUSE_SUPERVISOR) {
        throw new Error('只有仓库主管可以创建波次');
      }

      const orders = await tx.order.findMany({
        where: {
          id: { in: orderIds },
        },
      });

      if (orders.length !== orderIds.length) {
        throw new Error('部分订单不存在');
      }

      const lockedNow = new Date();
      const lockResult = await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          status: OrderStatus.PENDING,
          waveId: null,
        },
        data: {
          status: OrderStatus.WAVE_ASSIGNED,
          waveLockedAt: lockedNow,
        },
      });

      if (lockResult.count !== orderIds.length) {
        throw new Error(`部分订单已被其他波次锁定或状态不正确，无法全部分配（成功锁定 ${lockResult.count}/${orderIds.length}）`);
      }

      const waveNo = `W${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const wave = await tx.wave.create({
        data: {
          waveNo,
          name: name || `波次-${waveNo}`,
          status: WaveStatus.CREATED,
          createdById,
        },
      });

      await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          waveId: null,
        },
        data: {
          waveId: wave.id,
        },
      });

      const ordersWithItems = await tx.order.findMany({
        where: { id: { in: orderIds } },
        include: { orderItems: true },
      });

      const allOrderItems = ordersWithItems.flatMap((o) => o.orderItems);

      const pickTasksData = [];
      for (const item of allOrderItems) {
        const inventory = await tx.inventory.findFirst({
          where: { productId: item.productId, quantity: { gte: item.quantity } },
          orderBy: { quantity: 'desc' },
        });

        if (!inventory) {
          throw new Error(`商品库存不足: ${item.productId}`);
        }

        pickTasksData.push({
          taskNo: `T${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${pickTasksData.length}`,
          waveId: wave.id,
          orderItemId: item.id,
          productId: item.productId,
          locationId: inventory.locationId,
          quantity: item.quantity,
          status: PickTaskStatus.PENDING,
        });
      }

      if (pickTasksData.length > 0) {
        await tx.pickTask.createMany({
          data: pickTasksData,
        });
      }

      return wave.id;
    });
  }

  async startWave(waveId: string, operatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wave = await tx.wave.findUnique({
        where: { id: waveId },
      });

      if (!wave) {
        throw new Error('波次不存在');
      }

      if (wave.status !== WaveStatus.CREATED) {
        throw new Error('只有新建状态的波次可以开始');
      }

      await tx.wave.update({
        where: { id: waveId },
        data: { status: WaveStatus.IN_PROGRESS },
      });

      await tx.order.updateMany({
        where: { waveId },
        data: { status: OrderStatus.PICKING },
      });

      return waveId;
    });
  }

  async getWaveById(waveId: string) {
    return this.prisma.wave.findUnique({
      where: { id: waveId },
      include: {
        createdBy: { select: { id: true, name: true, code: true } },
        orders: {
          include: {
            orderItems: {
              include: {
                product: { select: { id: true, sku: true, name: true } },
              },
            },
          },
        },
        pickTasks: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
            location: { select: { id: true, code: true } },
            assignedTo: { select: { id: true, name: true, code: true } },
            pickedBy: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async listWaves(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [waves, total] = await Promise.all([
      this.prisma.wave.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { orders: true, pickTasks: true } },
        },
      }),
      this.prisma.wave.count(),
    ]);

    return { waves, total, page, pageSize };
  }

  async completeWave(waveId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pendingTasks = await tx.pickTask.count({
        where: {
          waveId,
          status: { not: PickTaskStatus.PICKED },
        },
      });

      if (pendingTasks > 0) {
        throw new Error(`还有 ${pendingTasks} 个拣货任务未完成`);
      }

      const wave = await tx.wave.update({
        where: { id: waveId },
        data: { status: WaveStatus.COMPLETED },
      });

      await tx.order.updateMany({
        where: { waveId, status: OrderStatus.PICKING },
        data: { status: OrderStatus.PICKED },
      });

      return wave;
    });
  }

  async getWaveTraceability(waveId: string) {
    const wave = await this.prisma.wave.findUnique({
      where: { id: waveId },
      include: {
        createdBy: true,
        orders: {
          include: {
            orderItems: {
              include: { product: true },
            },
            packages: {
              include: {
                reviewRecord: {
                  include: {
                    reviewer: true,
                    reviewItems: { include: { product: true } },
                  },
                },
                feedback: {
                  include: {
                    traceabilityLogs: {
                      include: { operator: true },
                    },
                  },
                },
              },
            },
          },
        },
        pickTasks: {
          include: {
            product: true,
            location: true,
            assignedTo: true,
            pickedBy: true,
          },
        },
      },
    });

    if (!wave) {
      throw new Error('波次不存在');
    }

    return wave;
  }
}
