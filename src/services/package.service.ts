import { PrismaClient } from '@prisma/client';
import { PackageStatus, OrderStatus, ReviewStatus, EmployeeRole } from '../types';
import prisma from '../lib/prisma';

export class PackageService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createPackage(
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
    weight?: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== OrderStatus.PICKED) {
        throw new Error('订单状态不正确，无法创建包裹');
      }

      const packageNo = `P${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const pkg = await tx.package.create({
        data: {
          packageNo,
          orderId,
          weight,
          status: PackageStatus.CREATED,
        },
      });

      const packageItemsData = items.map((item) => ({
        packageId: pkg.id,
        productId: item.productId,
        quantity: item.quantity,
      }));

      if (packageItemsData.length > 0) {
        await tx.packageItem.createMany({
          data: packageItemsData,
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REVIEWING },
      });

      await tx.package.update({
        where: { id: pkg.id },
        data: { status: PackageStatus.REVIEWING },
      });

      return pkg.id;
    });
  }

  async reviewPackage(
    packageId: string,
    reviewerId: string,
    items: Array<{ productId: string; expectedQty: number; actualQty: number }>,
    notes?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reviewer = await tx.employee.findUnique({
        where: { id: reviewerId },
      });

      if (!reviewer) {
        throw new Error('复核员不存在');
      }

      if (reviewer.role !== EmployeeRole.REVIEWER) {
        throw new Error('只有复核员可以执行复核操作');
      }

      const pkg = await tx.package.findUnique({
        where: { id: packageId },
        include: { packageItems: true, order: true },
      });

      if (!pkg) {
        throw new Error('包裹不存在');
      }

      if (pkg.status !== PackageStatus.REVIEWING) {
        throw new Error('包裹状态不正确，无法复核');
      }

      const allMatch = items.every((item) => item.expectedQty === item.actualQty);
      const status = allMatch ? ReviewStatus.PASSED : ReviewStatus.REJECTED;

      const recordNo = `R${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const reviewRecord = await tx.reviewRecord.create({
        data: {
          recordNo,
          packageId,
          reviewerId,
          status,
          notes,
        },
      });

      const reviewItemsData = items.map((item) => ({
        reviewRecordId: reviewRecord.id,
        productId: item.productId,
        expectedQty: item.expectedQty,
        actualQty: item.actualQty,
        isMatch: item.expectedQty === item.actualQty,
      }));

      if (reviewItemsData.length > 0) {
        await tx.reviewItem.createMany({
          data: reviewItemsData,
        });
      }

      if (status === ReviewStatus.PASSED) {
        await tx.package.update({
          where: { id: packageId },
          data: { status: PackageStatus.REVIEWED },
        });

        await tx.order.update({
          where: { id: pkg.orderId },
          data: { status: OrderStatus.REVIEWED },
        });

        await tx.packageItem.updateMany({
          where: { packageId },
          data: { actualQuantity: items[0]?.actualQty || 0 },
        });
      } else {
        await tx.package.update({
          where: { id: packageId },
          data: { status: PackageStatus.REJECTED },
        });
      }

      return reviewRecord.id;
    });
  }

  async shipPackage(packageId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pkg = await tx.package.findUnique({
        where: { id: packageId },
        include: { order: true },
      });

      if (!pkg) {
        throw new Error('包裹不存在');
      }

      if (pkg.status !== PackageStatus.REVIEWED) {
        throw new Error('包裹未通过复核，无法出库');
      }

      await tx.package.update({
        where: { id: packageId },
        data: {
          status: PackageStatus.SHIPPED,
          shippedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: pkg.orderId },
        data: { status: OrderStatus.SHIPPED },
      });

      return packageId;
    });
  }

  async getPackageById(packageId: string) {
    return this.prisma.package.findUnique({
      where: { id: packageId },
      include: {
        order: { select: { id: true, orderNo: true, customerName: true } },
        packageItems: {
          include: { product: { select: { id: true, sku: true, name: true } } },
        },
        reviewRecord: {
          include: {
            reviewer: { select: { id: true, name: true } },
            reviewItems: {
              include: { product: { select: { id: true, sku: true, name: true } } },
            },
          },
        },
      },
    });
  }

  async getReviewRecordById(recordId: string) {
    return this.prisma.reviewRecord.findUnique({
      where: { id: recordId },
      include: {
        package: { select: { id: true, packageNo: true } },
        reviewer: { select: { id: true, name: true, code: true } },
        reviewItems: {
          include: { product: { select: { id: true, sku: true, name: true } } },
        },
      },
    });
  }

  async listPackages(page: number = 1, pageSize: number = 20, status?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNo: true } },
        },
      }),
      this.prisma.package.count({ where }),
    ]);

    return { packages, total, page, pageSize };
  }

  async updatePackageItems(packageId: string, items: Array<{ productId: string; quantity: number }>) {
    return this.prisma.$transaction(async (tx) => {
      const pkg = await tx.package.findUnique({
        where: { id: packageId },
      });

      if (!pkg) {
        throw new Error('包裹不存在');
      }

      if (
        pkg.status === PackageStatus.SHIPPED ||
        pkg.status === PackageStatus.REVIEWED
      ) {
        throw new Error('已出库或已复核的包裹不能修改明细');
      }

      await tx.packageItem.deleteMany({
        where: { packageId },
      });

      const packageItemsData = items.map((item) => ({
        packageId,
        productId: item.productId,
        quantity: item.quantity,
      }));

      if (packageItemsData.length > 0) {
        await tx.packageItem.createMany({
          data: packageItemsData,
        });
      }

      return packageId;
    });
  }
}
