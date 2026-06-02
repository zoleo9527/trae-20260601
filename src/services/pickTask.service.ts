import { PrismaClient } from '@prisma/client';
import { PickTaskStatus, EmployeeRole, OrderStatus, WaveStatus } from '../types';
import prisma from '../lib/prisma';

export class PickTaskService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async assignTask(taskId: string, pickerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const picker = await tx.employee.findUnique({
        where: { id: pickerId },
      });

      if (!picker) {
        throw new Error('拣货员不存在');
      }

      if (picker.role !== EmployeeRole.PICKER) {
        throw new Error('只有拣货员可以领取拣货任务');
      }

      const task = await tx.pickTask.findUnique({
        where: { id: taskId },
        include: { wave: true },
      });

      if (!task) {
        throw new Error('拣货任务不存在');
      }

      if (task.wave.status !== WaveStatus.IN_PROGRESS) {
        throw new Error('波次未开始，无法领取任务');
      }

      if (task.status !== PickTaskStatus.PENDING) {
        throw new Error('任务状态不正确，无法领取');
      }

      if (task.assignedToId) {
        throw new Error('任务已被领取');
      }

      return tx.pickTask.update({
        where: { id: taskId },
        data: {
          status: PickTaskStatus.ASSIGNED,
          assignedToId: pickerId,
        },
        include: {
          product: true,
          location: true,
          assignedTo: true,
        },
      });
    });
  }

  async startPicking(taskId: string, pickerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.pickTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error('拣货任务不存在');
      }

      if (task.status !== PickTaskStatus.ASSIGNED) {
        throw new Error('任务状态不正确，无法开始拣货');
      }

      if (task.assignedToId !== pickerId) {
        throw new Error('只能开始自己领取的任务');
      }

      return tx.pickTask.update({
        where: { id: taskId },
        data: {
          status: PickTaskStatus.PICKING,
        },
        include: {
          product: true,
          location: true,
          assignedTo: true,
        },
      });
    });
  }

  async completeTask(taskId: string, pickerId: string, pickedQuantity: number) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.pickTask.findUnique({
        where: { id: taskId },
        include: { orderItem: true },
      });

      if (!task) {
        throw new Error('拣货任务不存在');
      }

      if (task.status !== PickTaskStatus.PICKING) {
        throw new Error('任务状态不正确，无法完成');
      }

      if (task.assignedToId !== pickerId) {
        throw new Error('只能完成自己领取的任务');
      }

      if (pickedQuantity < 0) {
        throw new Error('拣货数量不能为负数');
      }

      if (pickedQuantity > task.quantity) {
        throw new Error('拣货数量不能超过任务数量');
      }

      const inventory = await tx.inventory.findUnique({
        where: {
          productId_locationId: {
            productId: task.productId,
            locationId: task.locationId,
          },
        },
      });

      if (!inventory || inventory.quantity < pickedQuantity) {
        throw new Error('库存不足');
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { decrement: pickedQuantity },
        },
      });

      return tx.pickTask.update({
        where: { id: taskId },
        data: {
          status: PickTaskStatus.PICKED,
          pickedQuantity,
          pickedById: pickerId,
          pickedAt: new Date(),
        },
        include: {
          product: true,
          location: true,
          pickedBy: true,
          orderItem: true,
        },
      });
    });
  }

  async getMyTasks(pickerId: string, status?: string) {
    const where: any = { assignedToId: pickerId };
    if (status) {
      where.status = status;
    }

    return this.prisma.pickTask.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        product: true,
        location: true,
        wave: true,
        orderItem: {
          include: {
            order: { select: { id: true, orderNo: true } },
          },
        },
      },
    });
  }

  async getAvailableTasks() {
    return this.prisma.pickTask.findMany({
      where: { status: PickTaskStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        product: true,
        location: true,
        wave: true,
        orderItem: {
          include: {
            order: { select: { id: true, orderNo: true } },
          },
        },
      },
    });
  }

  async getTaskById(taskId: string) {
    return this.prisma.pickTask.findUnique({
      where: { id: taskId },
      include: {
        product: true,
        location: true,
        wave: true,
        assignedTo: true,
        pickedBy: true,
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });
  }
}
