import { PrismaClient } from '@prisma/client';
import { FeedbackStatus, FeedbackType, EmployeeRole } from '../types';
import prisma from '../lib/prisma';

export class AfterSalesService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createFeedback(
    packageId: string,
    type: string,
    description: string,
    reportedByCustomer: string,
    customerPhone: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const pkg = await tx.package.findUnique({
        where: { id: packageId },
        include: { order: true },
      });

      if (!pkg) {
        throw new Error('包裹不存在');
      }

      const feedbackNo = `F${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const feedback = await tx.afterSalesFeedback.create({
        data: {
          feedbackNo,
          packageId,
          orderId: pkg.orderId,
          type,
          status: FeedbackStatus.SUBMITTED,
          description,
          reportedByCustomer,
          customerPhone,
        },
      });

      await tx.traceabilityLog.create({
        data: {
          feedbackId: feedback.id,
          action: 'FEEDBACK_SUBMITTED',
          notes: `客户提交售后反馈: ${type}`,
        },
      });

      return feedback.id;
    });
  }

  async startInvestigation(feedbackId: string, handledById: string) {
    return this.prisma.$transaction(async (tx) => {
      const handler = await tx.employee.findUnique({
        where: { id: handledById },
      });

      if (!handler) {
        throw new Error('处理人不存在');
      }

      if (handler.role !== EmployeeRole.CUSTOMER_SERVICE) {
        throw new Error('只有客服人员可以处理售后反馈');
      }

      const feedback = await tx.afterSalesFeedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        throw new Error('售后反馈不存在');
      }

      if (feedback.status !== FeedbackStatus.SUBMITTED) {
        throw new Error('反馈状态不正确，无法开始调查');
      }

      await tx.afterSalesFeedback.update({
        where: { id: feedbackId },
        data: {
          status: FeedbackStatus.INVESTIGATING,
          handledById,
        },
      });

      await tx.traceabilityLog.create({
        data: {
          feedbackId,
          action: 'INVESTIGATION_STARTED',
          operatorId: handledById,
          notes: '开始售后调查',
        },
      });

      return feedbackId;
    });
  }

  async traceRootCause(feedbackId: string) {
    const feedback = await this.prisma.afterSalesFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        package: {
          include: {
            order: {
              include: {
                wave: true,
                orderItems: {
                  include: {
                    product: true,
                    pickTasks: true,
                  },
                },
              },
            },
            reviewRecord: {
              include: {
                reviewer: true,
                reviewItems: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
    });

    if (!feedback) {
      throw new Error('售后反馈不存在');
    }

    const traceResult: any = {
      feedback,
      package: feedback.package,
      order: feedback.package.order,
      wave: feedback.package.order.wave,
      reviewRecord: feedback.package.reviewRecord,
      possibleCauses: [],
    };

    if (feedback.type === FeedbackType.MISSING_ITEM) {
      for (const item of feedback.package.order.orderItems) {
        const pickTask = item.pickTasks[0];
        if (pickTask && pickTask.pickedQuantity < item.quantity) {
          traceResult.possibleCauses.push({
            type: 'INSUFFICIENT_PICK',
            description: `商品 ${item.product.sku} 拣货数量不足`,
            pickTask,
            expected: item.quantity,
            actual: pickTask.pickedQuantity,
          });
        }
      }

      if (feedback.package.reviewRecord) {
        for (const reviewItem of feedback.package.reviewRecord.reviewItems) {
          if (!reviewItem.isMatch) {
            traceResult.possibleCauses.push({
              type: 'REVIEW_MISMATCH',
              description: `复核时发现商品 ${reviewItem.product.sku} 数量不匹配`,
              reviewItem,
            });
          }
        }
      }
    }

    if (feedback.type === FeedbackType.WRONG_SKU) {
      if (feedback.package.reviewRecord) {
        for (const reviewItem of feedback.package.reviewRecord.reviewItems) {
          if (!reviewItem.isMatch) {
            traceResult.possibleCauses.push({
              type: 'WRONG_ITEM_PICKED',
              description: `拣货或复核时商品错误`,
              reviewItem,
            });
          }
        }
      }
    }

    if (feedback.package.order.wave) {
      const wavePickTasks = await this.prisma.pickTask.findMany({
        where: { waveId: feedback.package.order.wave.id },
        include: {
          product: true,
          location: true,
          pickedBy: true,
          assignedTo: true,
        },
      });
      traceResult.wavePickTasks = wavePickTasks;
    }

    return traceResult;
  }

  async resolveFeedback(
    feedbackId: string,
    handledById: string,
    rootCauseWaveId: string | undefined,
    rootCausePickTaskId: string | undefined,
    resolution: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const feedback = await tx.afterSalesFeedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        throw new Error('售后反馈不存在');
      }

      if (feedback.status !== FeedbackStatus.INVESTIGATING) {
        throw new Error('反馈状态不正确，无法结案');
      }

      await tx.afterSalesFeedback.update({
        where: { id: feedbackId },
        data: {
          status: FeedbackStatus.RESOLVED,
          rootCauseWaveId,
          rootCausePickTaskId,
          resolution,
          handledAt: new Date(),
        },
      });

      await tx.traceabilityLog.create({
        data: {
          feedbackId,
          action: 'FEEDBACK_RESOLVED',
          operatorId: handledById,
          relatedWaveId: rootCauseWaveId,
          relatedPickTaskId: rootCausePickTaskId,
          notes: resolution,
        },
      });

      return feedbackId;
    });
  }

  async closeFeedback(feedbackId: string, handledById: string) {
    return this.prisma.$transaction(async (tx) => {
      const feedback = await tx.afterSalesFeedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        throw new Error('售后反馈不存在');
      }

      if (feedback.status !== FeedbackStatus.RESOLVED) {
        throw new Error('只有已解决的反馈可以关闭');
      }

      await tx.afterSalesFeedback.update({
        where: { id: feedbackId },
        data: {
          status: FeedbackStatus.CLOSED,
        },
      });

      await tx.traceabilityLog.create({
        data: {
          feedbackId,
          action: 'FEEDBACK_CLOSED',
          operatorId: handledById,
          notes: '售后反馈已关闭',
        },
      });

      return feedbackId;
    });
  }

  async getFeedbackById(feedbackId: string) {
    return this.prisma.afterSalesFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        package: {
          include: {
            order: { select: { id: true, orderNo: true, waveId: true } },
          },
        },
        handledBy: { select: { id: true, name: true } },
        rootCauseWave: { select: { id: true, waveNo: true, name: true } },
        rootCausePickTask: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
            pickedBy: { select: { id: true, name: true } },
          },
        },
        traceabilityLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            operator: { select: { id: true, name: true } },
            relatedWave: { select: { id: true, waveNo: true } },
            relatedPickTask: { select: { id: true, taskNo: true } },
            relatedPackage: { select: { id: true, packageNo: true } },
          },
        },
      },
    });
  }

  async listFeedbacks(page: number = 1, pageSize: number = 20, status?: string, type?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const [feedbacks, total] = await Promise.all([
      this.prisma.afterSalesFeedback.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          package: { select: { id: true, packageNo: true } },
          handledBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.afterSalesFeedback.count({ where }),
    ]);

    return { feedbacks, total, page, pageSize };
  }

  async getFullTraceabilityChain(feedbackId: string) {
    const feedback = await this.prisma.afterSalesFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        package: {
          include: {
            order: {
              include: {
                wave: {
                  include: {
                    createdBy: true,
                    pickTasks: {
                      include: {
                        product: true,
                        location: true,
                        assignedTo: true,
                        pickedBy: true,
                      },
                    },
                  },
                },
                orderItems: {
                  include: {
                    product: true,
                    pickTasks: true,
                  },
                },
              },
            },
            packageItems: {
              include: { product: true },
            },
            reviewRecord: {
              include: {
                reviewer: true,
                reviewItems: {
                  include: { product: true },
                },
              },
            },
          },
        },
        handledBy: true,
        rootCauseWave: true,
        rootCausePickTask: true,
        traceabilityLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            operator: true,
            relatedWave: true,
            relatedPickTask: true,
            relatedPackage: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new Error('售后反馈不存在');
    }

    return {
      feedback,
      timeline: this.buildTimeline(feedback),
    };
  }

  private buildTimeline(feedback: any) {
    const timeline: any[] = [];

    if (feedback.package.order.wave) {
      timeline.push({
        time: feedback.package.order.wave.createdAt,
        type: 'WAVE_CREATED',
        title: '波次创建',
        description: `波次 ${feedback.package.order.wave.waveNo} 由 ${feedback.package.order.wave.createdBy.name} 创建`,
        data: feedback.package.order.wave,
      });
    }

    if (feedback.package.order.wave?.pickTasks) {
      for (const task of feedback.package.order.wave.pickTasks) {
        if (task.pickedAt) {
          timeline.push({
            time: task.pickedAt,
            type: 'PICK_COMPLETED',
            title: '拣货完成',
            description: `商品 ${task.product.sku} 由 ${task.pickedBy?.name || '未知'} 完成拣货`,
            data: task,
          });
        }
      }
    }

    if (feedback.package.reviewRecord) {
      timeline.push({
        time: feedback.package.reviewRecord.reviewedAt,
        type: 'REVIEW_COMPLETED',
        title: '复核完成',
        description: `包裹由 ${feedback.package.reviewRecord.reviewer.name} 复核，结果: ${feedback.package.reviewRecord.status}`,
        data: feedback.package.reviewRecord,
      });
    }

    if (feedback.package.shippedAt) {
      timeline.push({
        time: feedback.package.shippedAt,
        type: 'PACKAGE_SHIPPED',
        title: '包裹出库',
        description: `包裹 ${feedback.package.packageNo} 已出库发货`,
        data: feedback.package,
      });
    }

    timeline.push({
      time: feedback.createdAt,
      type: 'FEEDBACK_SUBMITTED',
      title: '售后反馈提交',
      description: `客户 ${feedback.reportedByCustomer} 提交 ${feedback.type} 反馈: ${feedback.description}`,
      data: feedback,
    });

    for (const log of feedback.traceabilityLogs) {
      timeline.push({
        time: log.createdAt,
        type: log.action,
        title: this.getActionTitle(log.action),
        description: log.notes,
        data: log,
      });
    }

    return timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  private getActionTitle(action: string): string {
    const titles: Record<string, string> = {
      FEEDBACK_SUBMITTED: '售后反馈提交',
      INVESTIGATION_STARTED: '开始调查',
      FEEDBACK_RESOLVED: '反馈解决',
      FEEDBACK_CLOSED: '反馈关闭',
    };
    return titles[action] || action;
  }
}
