import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, MoreThan } from 'typeorm';
import { PrintOrder } from '../print-order/entities/print-order.entity';
import { OperationLog } from '../common/entities/operation-log.entity';
import { User } from '../auth/entities/user.entity';
import { PrintOrderStatus } from '../common/enums/print-order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { PriorityLevel } from '../common/enums/priority-level.enum';
import {
  InstallationTask,
  InstallationTaskStatus,
  TaskStuckLevel,
} from '../print-order/entities/installation-task.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PrintOrder)
    private readonly orderRepo: Repository<PrintOrder>,
    @InjectRepository(OperationLog)
    private readonly logRepo: Repository<OperationLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InstallationTask)
    private readonly taskRepo: Repository<InstallationTask>,
  ) {}

  async getOverview(user: User) {
    const totalActive = await this.orderRepo.count({
      where: { status: Not(In([PrintOrderStatus.COMPLETED, PrintOrderStatus.CANCELLED])) },
    });

    const statusBreakdown = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.status NOT IN (:...excluded)', {
        excluded: [PrintOrderStatus.COMPLETED, PrintOrderStatus.CANCELLED],
      })
      .groupBy('o.status')
      .getRawMany();

    const statusMap = Object.fromEntries(
      statusBreakdown.map((x) => [x.status, +x.count]),
    );

    const urgentWaiting = await this.orderRepo.find({
      where: {
        priority: PriorityLevel.URGENT,
        status: Not(In([PrintOrderStatus.COMPLETED, PrintOrderStatus.CANCELLED])),
      },
      relations: ['designer', 'installLeader'],
      order: { createdAt: 'ASC' },
      take: 10,
    });

    await this.refreshTaskStuckSilent();

    const stuckTasks = await this.taskRepo.find({
      where: {
        isActive: true,
        stuckLevel: In([TaskStuckLevel.WARNING, TaskStuckLevel.DANGER]),
      },
      relations: ['installLeader'],
      order: {
        stuckLevel: 'ASC',
        updatedAt: 'ASC',
      },
      take: 20,
    });

    const stuckOrderIds = [...new Set(stuckTasks.map((t) => t.orderId))];
    const stuckOrders = stuckOrderIds.length
      ? await this.orderRepo.find({
          where: { id: In(stuckOrderIds) },
          relations: ['designer', 'printOperator', 'installLeader'],
        })
      : [];

    const myTodoCount = await this.getMyTodoCount(user);

    return {
      totalActive,
      statusBreakdown: statusMap,
      urgentWaiting,
      stuckOrders,
      stuckTasks,
      myTodoCount,
    };
  }

  private async refreshTaskStuckSilent() {
    const now = new Date();
    const thresholds: Record<string, { warning: number; danger: number; hint: string }> = {
      [InstallationTaskStatus.ASSIGNED]: { warning: 60, danger: 120, hint: '已派工但安装队未开工' },
      [InstallationTaskStatus.IN_PROGRESS]: { warning: 240, danger: 480, hint: '安装超过预期时长' },
      [InstallationTaskStatus.PHOTO_SUBMITTED]: { warning: 60, danger: 120, hint: '照片回传后无人验收' },
      [InstallationTaskStatus.PHOTO_REJECTED]: { warning: 120, danger: 240, hint: '照片被退回，责任不清' },
    };

    const activeTasks = await this.taskRepo.find({ where: { isActive: true } });
    for (const task of activeTasks) {
      const config = thresholds[task.status];
      if (!config) continue;
      const minutes = Math.round((now.getTime() - new Date(task.updatedAt).getTime()) / 60000);
      task.stuckMinutes = minutes;
      if (minutes >= config.danger) {
        task.stuckLevel = TaskStuckLevel.DANGER;
        task.stuckHint = config.hint;
      } else if (minutes >= config.warning) {
        task.stuckLevel = TaskStuckLevel.WARNING;
        task.stuckHint = config.hint;
      } else {
        task.stuckLevel = TaskStuckLevel.NORMAL;
        task.stuckHint = null;
      }
      await this.taskRepo.save(task);
    }
  }

  private async getMyTodoCount(user: User): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    if (user.role === UserRole.DESIGNER) {
      counts.pendingDesign = await this.orderRepo.count({
        where: { status: PrintOrderStatus.PENDING_DESIGN },
      });
      counts.myDesigning = await this.orderRepo.count({
        where: {
          designer: { id: user.id },
          status: PrintOrderStatus.DESIGNING,
        },
      });
    }

    if (user.role === UserRole.PRINT_OPERATOR) {
      counts.pendingPrint = await this.orderRepo.count({
        where: { status: PrintOrderStatus.PENDING_PRINT },
      });
      counts.myPrinting = await this.orderRepo.count({
        where: {
          printOperator: { id: user.id },
          status: PrintOrderStatus.PRINTING,
        },
      });
    }

    if (user.role === UserRole.INSTALL_LEADER) {
      counts.myAssignedTasks = await this.taskRepo.count({
        where: {
          installLeaderId: user.id,
          isActive: true,
          status: In([
            InstallationTaskStatus.ASSIGNED,
            InstallationTaskStatus.IN_PROGRESS,
            InstallationTaskStatus.PHOTO_REJECTED,
          ]),
        },
      });
      counts.myStuckTasks = await this.taskRepo.count({
        where: {
          installLeaderId: user.id,
          isActive: true,
          stuckLevel: In([TaskStuckLevel.WARNING, TaskStuckLevel.DANGER]),
        },
      });
      counts.pendingInstall = await this.orderRepo.count({
        where: { status: PrintOrderStatus.PENDING_INSTALL },
      });
    }

    if (user.role === UserRole.RECEPTIONIST || user.role === UserRole.MANAGER) {
      counts.pendingPhotoReview = await this.taskRepo.count({
        where: { status: InstallationTaskStatus.PHOTO_SUBMITTED, isActive: true },
      });
      counts.rejectedTaskCount = await this.taskRepo.count({
        where: { status: InstallationTaskStatus.PHOTO_REJECTED, isActive: true },
      });
      counts.pendingDesignAssign = await this.orderRepo.count({
        where: { status: PrintOrderStatus.PENDING_DESIGN },
      });
      counts.pendingInstallAssign = await this.orderRepo.count({
        where: { status: PrintOrderStatus.PENDING_INSTALL },
      });
    }

    return counts;
  }

  async getWaitingForMe(user: User) {
    const result: any = { role: user.role };

    if (user.role === UserRole.DESIGNER) {
      const pendingPool = await this.orderRepo.find({
        where: { status: PrintOrderStatus.PENDING_DESIGN },
        relations: ['receptionist'],
        order: { priority: 'ASC', createdAt: 'ASC' },
        take: 30,
      });

      const myActive = await this.orderRepo.find({
        where: {
          designer: { id: user.id },
          status: PrintOrderStatus.DESIGNING,
        },
        order: { priority: 'ASC', createdAt: 'ASC' },
        take: 30,
      });

      result.pendingDesignPool = pendingPool;
      result.myDesigning = myActive;
    }

    if (user.role === UserRole.PRINT_OPERATOR) {
      const pendingPool = await this.orderRepo.find({
        where: { status: PrintOrderStatus.PENDING_PRINT },
        relations: ['designer'],
        order: { priority: 'ASC', createdAt: 'ASC' },
        take: 30,
      });

      const myActive = await this.orderRepo.find({
        where: {
          printOperator: { id: user.id },
          status: PrintOrderStatus.PRINTING,
        },
        order: { priority: 'ASC', createdAt: 'ASC' },
        take: 30,
      });

      result.pendingPrintPool = pendingPool;
      result.myPrinting = myActive;
    }

    if (user.role === UserRole.INSTALL_LEADER) {
      const myActiveTasks = await this.taskRepo
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.order', 'o')
        .where('t.installLeaderId = :uid', { uid: user.id })
        .andWhere('t.isActive = 1')
        .andWhere('t.status IN (:...statuses)', {
          statuses: [
            InstallationTaskStatus.ASSIGNED,
            InstallationTaskStatus.IN_PROGRESS,
            InstallationTaskStatus.PHOTO_REJECTED,
          ],
        })
        .addSelect(
          "CASE t.stuckLevel WHEN 'danger' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END",
          'stuck_order',
        )
        .orderBy('stuck_order', 'ASC')
        .addOrderBy('t.updatedAt', 'ASC')
        .getMany();

      const tasksWithOrders = await Promise.all(
        myActiveTasks.map(async (t) => {
          const order = await this.orderRepo.findOne({ where: { id: t.orderId } });
          return { ...t, order };
        }),
      );

      const pendingPool = await this.orderRepo.find({
        where: { status: PrintOrderStatus.PENDING_INSTALL },
        order: { priority: 'ASC', createdAt: 'ASC' },
        take: 20,
      });

      result.myActiveTasks = tasksWithOrders;
      result.pendingInstallPool = pendingPool;
    }

    if (user.role === UserRole.RECEPTIONIST || user.role === UserRole.MANAGER) {
      const photoReviewTasks = await this.taskRepo
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.order', 'o')
        .leftJoinAndSelect('t.installLeader', 'il')
        .where('t.status = :status', { status: InstallationTaskStatus.PHOTO_SUBMITTED })
        .andWhere('t.isActive = 1')
        .orderBy('t.updatedAt', 'ASC')
        .getMany();

      const rejectedTasks = await this.taskRepo
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.order', 'o')
        .leftJoinAndSelect('t.installLeader', 'il')
        .where('t.status = :status', { status: InstallationTaskStatus.PHOTO_REJECTED })
        .andWhere('t.isActive = 1')
        .orderBy('t.updatedAt', 'ASC')
        .getMany();

      const pendingDesignAssign = await this.orderRepo.find({
        where: { status: PrintOrderStatus.PENDING_DESIGN },
        relations: ['receptionist'],
        order: { priority: 'ASC', createdAt: 'ASC' },
        take: 20,
      });

      const pendingInstallAssign = await this.orderRepo.find({
        where: { status: PrintOrderStatus.PENDING_INSTALL },
        relations: ['printOperator'],
        order: { priority: 'ASC', createdAt: 'ASC' },
        take: 20,
      });

      result.photoReviewTasks = photoReviewTasks;
      result.rejectedTasks = rejectedTasks;
      result.pendingDesignAssign = pendingDesignAssign;
      result.pendingInstallAssign = pendingInstallAssign;
    }

    return result;
  }

  async getStuckAnalysis() {
    await this.refreshTaskStuckSilent();

    const statusLabels: Record<InstallationTaskStatus, string> = {
      [InstallationTaskStatus.ASSIGNED]: '已派工待安装',
      [InstallationTaskStatus.IN_PROGRESS]: '安装中',
      [InstallationTaskStatus.PHOTO_SUBMITTED]: '照片待验收',
      [InstallationTaskStatus.PHOTO_APPROVED]: '照片验收通过',
      [InstallationTaskStatus.PHOTO_REJECTED]: '照片被退回',
      [InstallationTaskStatus.COMPLETED]: '已完成',
      [InstallationTaskStatus.CANCELLED]: '已取消',
    };

    const thresholds: Record<string, { warning: number; danger: number; hint: string; nextAction: string }> = {
      [InstallationTaskStatus.ASSIGNED]: {
        warning: 60, danger: 120,
        hint: '已派工但安装队未开工',
        nextAction: '联系安装队长确认开工时间，或重新派工',
      },
      [InstallationTaskStatus.IN_PROGRESS]: {
        warning: 240, danger: 480,
        hint: '安装超过预期时长',
        nextAction: '查看安装进度备注，必要时增援或联系客户说明',
      },
      [InstallationTaskStatus.PHOTO_SUBMITTED]: {
        warning: 60, danger: 120,
        hint: '照片回传后无人验收',
        nextAction: '立即安排验收，通过或退回重拍',
      },
      [InstallationTaskStatus.PHOTO_REJECTED]: {
        warning: 120, danger: 240,
        hint: '照片被退回，责任不清',
        nextAction: '查看同条任务记录中的退回原因、派工信息和补充备注，确认责任后重派或重拍',
      },
    };

    const result = [];
    const taskStatuses = Object.keys(thresholds) as InstallationTaskStatus[];

    for (const status of taskStatuses) {
      const tasks = await this.taskRepo.find({
        where: { status, isActive: true },
        relations: ['installLeader', 'assignedBy'],
        order: { stuckLevel: 'ASC', updatedAt: 'ASC' },
      });
      const stuck = tasks.filter(
        (t) => t.stuckLevel === TaskStuckLevel.WARNING || t.stuckLevel === TaskStuckLevel.DANGER,
      );
      if (stuck.length === 0) continue;

      const config = thresholds[status]!;
      const orderIds = [...new Set(stuck.map((t) => t.orderId))];
      const orders = orderIds.length ? await this.orderRepo.findByIds(orderIds) : [];
      const orderMap = new Map(orders.map((o) => [o.id, o]));

      result.push({
        status,
        statusLabel: statusLabels[status],
        thresholdMinutes: config.warning,
        stuckCount: stuck.length,
        totalInStatus: tasks.length,
        judgementHint: config.hint,
        nextAction: config.nextAction,
        evidenceType: '一体化任务记录（派工+照片+退回原因+补充备注）',
        items: stuck.map((t) => {
          const order = orderMap.get(t.orderId);
          return {
            taskId: t.id,
            taskRound: t.taskRound,
            orderId: t.orderId,
            orderNo: order?.orderNo || '-',
            customerName: order?.customerName || '-',
            projectName: order?.projectName || '-',
            priority: order?.priority || PriorityLevel.NORMAL,
            lastUpdatedAt: t.updatedAt,
            minutesInStatus: t.stuckMinutes,
            stuckLevel: t.stuckLevel,
            stuckHint: t.stuckHint,
            installLeaderName: t.installLeader?.name || '-',
            assignedByName: t.assignedBy?.name || '-',
            rejectReason: t.rejectReason,
            hasPhotos: !!t.photoUrls?.length,
            hasSupplementNotes: !!t.supplementNotes?.length,
          };
        }),
      });
    }

    return result.sort((a, b) => b.stuckCount - a.stuckCount);
  }

  async getRecentChanges(limit = 30) {
    const logs = await this.logRepo.find({
      relations: ['operator'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const entityLabels: Record<string, string> = {
      PrintOrder: '喷绘订单',
      InstallationAssignment: '安装派工',
      PhotoReturn: '照片回传',
      OrderNote: '订单备注',
      InstallationTask: '安装任务',
    };

    const actionLabels: Record<string, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      assign_designer: '分配设计师',
      submit_design: '提交喷绘',
      start_print: '开始喷绘',
      complete_print: '完成喷绘',
      assign_installation: '安装派工',
      start_installation: '开始安装',
      submit_photo_return: '提交照片回传',
      approve_photo: '验收通过',
      reject_photo: '退回重拍',
      create_install_task: '【一体化】创建安装任务',
      start_install_task: '【一体化】开始安装',
      submit_task_photo: '【一体化】提交照片回传',
      approve_task_photo: '【一体化】验收通过',
      reject_task_photo: '【一体化】退回重拍',
    };

    return logs.map((log) => {
      const meta = log.metadata || {};
      let summary = '';
      if (log.entityType === 'PrintOrder') {
        summary = meta.orderNo ? `订单: ${meta.orderNo}` : '订单操作';
        if (meta.action === 'assign_designer') summary = `分配设计师: ${meta.designerName}`;
        if (meta.action === 'submit_design') summary = '设计完成，提交喷绘';
        if (meta.action === 'start_print') summary = '开始喷绘';
        if (meta.action === 'complete_print') summary = '喷绘完成';
        if (meta.action === 'assign_installation') summary = `安装派工: ${meta.installLeaderName}`;
        if (meta.action === 'start_installation') summary = '开始安装';
        if (meta.action === 'submit_photo_return') summary = `照片回传 (${meta.photoCount}张)`;
        if (meta.action === 'approve_photo') summary = '照片验收通过';
        if (meta.action === 'reject_photo') summary = '照片退回重拍';
        if (meta.action === 'create_install_task') summary = `创建任务#${meta.taskRound} → ${meta.installLeaderName}`;
        if (meta.action === 'start_install_task') summary = `开始安装任务#${meta.taskRound || ''}`;
        if (meta.action === 'submit_task_photo') summary = `任务提交照片 (${meta.photoCount}张)`;
        if (meta.action === 'approve_task_photo') summary = '任务照片验收通过';
        if (meta.action === 'reject_task_photo') summary = '任务照片退回重拍';
      } else if (log.entityType === 'InstallationTask') {
        summary = meta.contentPreview ? `任务补充备注: ${meta.contentPreview}` : '安装任务更新';
      } else if (log.entityType === 'OrderNote') {
        summary = meta.contentPreview ? `备注: ${meta.contentPreview}` : '添加备注';
      } else if (log.entityType === 'PhotoReturn') {
        summary = '照片回传操作';
      } else {
        summary = JSON.stringify(meta).slice(0, 50);
      }
      return {
        id: log.id,
        entityType: log.entityType,
        entityLabel: entityLabels[log.entityType] || log.entityType,
        entityId: log.entityId,
        action: log.action,
        actionLabel: actionLabels[log.action] || log.action,
        operatorName: log.operator?.name,
        operatorRole: log.operator?.role,
        metadata: log.metadata,
        summary,
        createdAt: log.createdAt,
      };
    });
  }

  async getWorkloadByRole() {
    const roles = [
      UserRole.DESIGNER,
      UserRole.PRINT_OPERATOR,
      UserRole.INSTALL_LEADER,
    ];

    const workload: Record<string, any[]> = {};

    for (const role of roles) {
      const users = await this.userRepo.find({
        where: { role, isActive: true },
      });

      const userWorkload = [];
      for (const user of users) {
        const activeStatuses = this.getActiveStatusesForRole(role);
        const activeOrders = await this.orderRepo.count({
          where: {
            [this.getRoleField(role)]: { id: user.id },
            status: In(activeStatuses),
          },
        });

        const activeTasks = role === UserRole.INSTALL_LEADER
          ? await this.taskRepo.count({
              where: {
                installLeaderId: user.id,
                isActive: true,
                status: In([
                  InstallationTaskStatus.ASSIGNED,
                  InstallationTaskStatus.IN_PROGRESS,
                  InstallationTaskStatus.PHOTO_REJECTED,
                ]),
              },
            })
          : 0;

        const stuckTaskCount = role === UserRole.INSTALL_LEADER
          ? await this.taskRepo.count({
              where: {
                installLeaderId: user.id,
                isActive: true,
                stuckLevel: In([TaskStuckLevel.WARNING, TaskStuckLevel.DANGER]),
              },
            })
          : 0;

        const completedToday = await this.orderRepo.count({
          where: {
            [this.getRoleField(role)]: { id: user.id },
            status: PrintOrderStatus.COMPLETED,
            completedAt: MoreThan(new Date(new Date().setHours(0, 0, 0, 0))),
          },
        });

        userWorkload.push({
          userId: user.id,
          userName: user.name,
          activeCount: activeOrders,
          activeTaskCount: activeTasks,
          stuckTaskCount,
          completedToday,
        });
      }

      workload[role] = userWorkload.sort((a, b) => {
        const aScore = (b.stuckTaskCount - a.stuckTaskCount) * 1000 + (b.activeCount - a.activeCount);
        return aScore;
      });
    }

    return workload;
  }

  private getRoleField(role: UserRole): string {
    switch (role) {
      case UserRole.DESIGNER:
        return 'designer';
      case UserRole.PRINT_OPERATOR:
        return 'printOperator';
      case UserRole.INSTALL_LEADER:
        return 'installLeader';
      default:
        return 'receptionist';
    }
  }

  private getActiveStatusesForRole(role: UserRole): PrintOrderStatus[] {
    switch (role) {
      case UserRole.DESIGNER:
        return [PrintOrderStatus.DESIGNING];
      case UserRole.PRINT_OPERATOR:
        return [PrintOrderStatus.PRINTING];
      case UserRole.INSTALL_LEADER:
        return [
          PrintOrderStatus.INSTALL_ASSIGNED,
          PrintOrderStatus.INSTALLING,
          PrintOrderStatus.PHOTO_REJECTED,
        ];
      default:
        return [];
    }
  }
}
