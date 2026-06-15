import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, Not } from 'typeorm';
import { IntakeOrder } from '../intake/entities/intake-order.entity';
import { OperationLog } from '../common/entities/operation-log.entity';
import { PrivacyConsent } from '../privacy/entities/privacy-consent.entity';
import { User } from '../auth/entities/user.entity';
import { IntakeStatus } from '../common/enums/intake-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { PriorityLevel } from '../common/enums/priority-level.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(IntakeOrder)
    private readonly intakeRepo: Repository<IntakeOrder>,
    @InjectRepository(OperationLog)
    private readonly logRepo: Repository<OperationLog>,
    @InjectRepository(PrivacyConsent)
    private readonly consentRepo: Repository<PrivacyConsent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getOverview(user: User) {
    const totalActive = await this.intakeRepo.count({
      where: { status: Not(In([IntakeStatus.COMPLETED, IntakeStatus.CANCELLED])) },
    });

    const statusBreakdown = await this.intakeRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.status NOT IN (:...excluded)', {
        excluded: [IntakeStatus.COMPLETED, IntakeStatus.CANCELLED],
      })
      .groupBy('o.status')
      .getRawMany();

    const statusMap = Object.fromEntries(
      statusBreakdown.map((x) => [x.status, +x.count]),
    );

    const urgentWaiting = await this.intakeRepo.find({
      where: {
        priority: PriorityLevel.URGENT,
        status: Not(In([IntakeStatus.COMPLETED, IntakeStatus.CANCELLED])),
      },
      relations: ['technician'],
      order: { createdAt: 'ASC' },
      take: 10,
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stuckOrders = await this.intakeRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.technician', 't')
      .where('o.status IN (:...stuckStatus)', {
        stuckStatus: [
          IntakeStatus.WAITING_CONSENT,
          IntakeStatus.WAITING_PARTS,
          IntakeStatus.QUALITY_CHECK,
        ],
      })
      .andWhere('o.updatedAt < :threshold', { threshold: oneHourAgo })
      .andWhere('o.status NOT IN (:...excluded)', {
        excluded: [IntakeStatus.COMPLETED, IntakeStatus.CANCELLED],
      })
      .orderBy('o.updatedAt', 'ASC')
      .limit(20)
      .getMany();

    return {
      totalActive,
      statusBreakdown: statusMap,
      urgentWaiting,
      stuckOrders,
    };
  }

  async getWaitingForMe(user: User) {
    if (user.role === UserRole.RECEPTIONIST || user.role === UserRole.MANAGER) {
      const unsignedConsents = await this.consentRepo.find({
        where: { isSigned: false },
        relations: ['order'],
        order: { createdAt: 'ASC' },
        take: 20,
      });

      const readyOrders = await this.intakeRepo.find({
        where: { status: IntakeStatus.READY },
        relations: ['receptionist'],
        order: { updatedAt: 'ASC' },
        take: 20,
      });

      return {
        role: user.role,
        unsignedConsents: unsignedConsents.map((c) => ({
          id: c.id,
          orderId: c.orderId,
          orderNo: c.order?.orderNo,
          customerName: c.customerName,
          createdAt: c.createdAt,
        })),
        readyForPickup: readyOrders,
      };
    }

    if (user.role === UserRole.TECHNICIAN) {
      const assigned = await this.intakeRepo.find({
        where: {
          technician: { id: user.id },
          status: In([
            IntakeStatus.CONSENT_SIGNED,
            IntakeStatus.DIAGNOSING,
            IntakeStatus.WAITING_PARTS,
            IntakeStatus.REPAIRING,
          ]),
        },
        order: {
          priority: 'ASC',
          createdAt: 'ASC',
        },
        take: 30,
      });

      const unassigned = await this.intakeRepo.find({
        where: {
          status: In([IntakeStatus.CONSENT_SIGNED, IntakeStatus.DIAGNOSING]),
          technician: null,
        },
        order: {
          priority: 'ASC',
          createdAt: 'ASC',
        },
        take: 20,
      });

      return {
        role: user.role,
        myAssigned: assigned,
        unassignedPool: unassigned,
      };
    }

    return { role: user.role };
  }

  async getStuckAnalysis() {
    const statusLabels: Record<IntakeStatus, string> = {
      [IntakeStatus.PENDING]: '待登记',
      [IntakeStatus.WAITING_CONSENT]: '待签隐私授权',
      [IntakeStatus.CONSENT_SIGNED]: '已授权待诊断',
      [IntakeStatus.DIAGNOSING]: '诊断中',
      [IntakeStatus.WAITING_PARTS]: '待备件',
      [IntakeStatus.REPAIRING]: '维修中',
      [IntakeStatus.QUALITY_CHECK]: '质检中',
      [IntakeStatus.READY]: '待取机',
      [IntakeStatus.COMPLETED]: '已完成',
      [IntakeStatus.CANCELLED]: '已取消',
    };

    const stuckThresholds: Partial<Record<IntakeStatus, number>> = {
      [IntakeStatus.WAITING_CONSENT]: 30 * 60 * 1000,
      [IntakeStatus.CONSENT_SIGNED]: 60 * 60 * 1000,
      [IntakeStatus.DIAGNOSING]: 2 * 60 * 60 * 1000,
      [IntakeStatus.WAITING_PARTS]: 4 * 60 * 60 * 1000,
      [IntakeStatus.REPAIRING]: 4 * 60 * 60 * 1000,
      [IntakeStatus.QUALITY_CHECK]: 2 * 60 * 60 * 1000,
      [IntakeStatus.READY]: 24 * 60 * 60 * 1000,
    };

    const stuckJudgement: Partial<Record<IntakeStatus, { hint: string; nextAction: string; evidenceType: string }>> = {
      [IntakeStatus.WAITING_CONSENT]: {
        hint: '客户未签署隐私授权，维修无法启动',
        nextAction: '联系客户签署授权（/privacy/order/:id/sign）',
        evidenceType: '隐私授权记录',
      },
      [IntakeStatus.CONSENT_SIGNED]: {
        hint: '已授权但无维修师接手',
        nextAction: '分配或由维修师领取工单（/repair/:id/claim）',
        evidenceType: '工单分配记录',
      },
      [IntakeStatus.DIAGNOSING]: {
        hint: '诊断超过预期时长',
        nextAction: '查看维修师诊断记录与照片附件，必要时升级处理',
        evidenceType: '诊断照片 / 维修师诊断结果',
      },
      [IntakeStatus.WAITING_PARTS]: {
        hint: '备件未到货或未确认',
        nextAction: '查看备件申请单状态，跟进供应商或确认到货（/repair/part-request/:id/arrive）',
        evidenceType: '备件申请记录 / 备件实物照片',
      },
      [IntakeStatus.REPAIRING]: {
        hint: '维修超过预期时长',
        nextAction: '查看维修进度备注与维修前后对比照片',
        evidenceType: '维修过程照片 / 维修备注',
      },
      [IntakeStatus.QUALITY_CHECK]: {
        hint: '质检未完成或被退回',
        nextAction: '完成结构化质检（/repair/:id/quality-check），查看质检历史中不合格项',
        evidenceType: '质检记录 / 质检照片',
      },
      [IntakeStatus.READY]: {
        hint: '客户未取机',
        nextAction: '联系客户取机，完成交付闭环',
        evidenceType: '取机通知记录',
      },
    };

    const result = [];
    const now = new Date();

    for (const status of Object.keys(stuckThresholds) as IntakeStatus[]) {
      const threshold = stuckThresholds[status];
      const cutoff = new Date(now.getTime() - threshold);

      const orders = await this.intakeRepo.find({
        where: {
          status,
          updatedAt: MoreThan(new Date(0)),
        },
        relations: ['technician', 'receptionist'],
        order: { updatedAt: 'ASC' },
      });

      const stuck = orders.filter((o) => new Date(o.updatedAt) < cutoff);

      if (stuck.length > 0) {
        const judgement = stuckJudgement[status] || {
          hint: '请查看工单详情与操作日志',
          nextAction: '打开工单详情跟进',
          evidenceType: '工单操作日志',
        };
        result.push({
          status,
          statusLabel: statusLabels[status],
          thresholdMinutes: Math.round(threshold / 60000),
          stuckCount: stuck.length,
          totalInStatus: orders.length,
          judgementHint: judgement.hint,
          nextAction: judgement.nextAction,
          evidenceType: judgement.evidenceType,
          evidenceEndpoint: `/repair/:orderId/evidence`,
          items: stuck.map((o) => ({
            id: o.id,
            orderNo: o.orderNo,
            customerName: o.customerName,
            phoneModel: `${o.phoneBrand} ${o.phoneModel}`,
            priority: o.priority,
            lastUpdatedAt: o.updatedAt,
            minutesInStatus: Math.round(
              (now.getTime() - new Date(o.updatedAt).getTime()) / 60000,
            ),
            technicianName: o.technician?.name,
            evidenceLink: {
              orderEvidence: `/repair/${o.id}/evidence`,
              logs: `/intake/${o.id}/logs`,
            },
          })),
        });
      }
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
      IntakeOrder: '接机工单',
      PrivacyConsent: '隐私授权',
      PartRequest: '备件申请',
      QualityCheck: '质检记录',
      Attachment: '附件/照片',
    };

    const actionLabels: Record<string, string> = {
      create: '创建',
      update: '更新',
      sign: '签署',
      revoke: '撤销',
      delete: '删除',
      ordered: '标记已下单',
      arrived: '确认到货',
    };

    return logs.map((log) => {
      const meta = log.metadata || {};
      let summary = '';
      if (log.entityType === 'PartRequest') {
        summary = meta.partName ? `备件: ${meta.partName}` : '备件操作';
        if (meta.action === 'ordered') summary += ' (已下单)';
        if (meta.action === 'arrived') summary += ' (已到货)';
      } else if (log.entityType === 'QualityCheck') {
        summary = meta.passed ? '质检通过' : '质检退回';
      } else if (log.entityType === 'Attachment') {
        summary = meta.fileName ? `附件: ${meta.fileName} (${meta.type || ''})` : '附件上传';
      } else if (log.entityType === 'IntakeOrder') {
        summary = meta.orderNo || '工单操作';
      } else if (log.entityType === 'PrivacyConsent') {
        summary = log.action === 'sign' ? '客户签署授权' : '授权操作';
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

  async getTechnicianWorkload() {
    const techs = await this.userRepo.find({
      where: { role: UserRole.TECHNICIAN, isActive: true },
    });

    const activeStatuses = [
      IntakeStatus.CONSENT_SIGNED,
      IntakeStatus.DIAGNOSING,
      IntakeStatus.WAITING_PARTS,
      IntakeStatus.REPAIRING,
      IntakeStatus.QUALITY_CHECK,
    ];

    const workload = [];
    for (const tech of techs) {
      const activeOrders = await this.intakeRepo.count({
        where: {
          technician: { id: tech.id },
          status: In(activeStatuses),
        },
      });
      const completedToday = await this.intakeRepo.count({
        where: {
          technician: { id: tech.id },
          status: IntakeStatus.COMPLETED,
          completedAt: MoreThan(new Date(new Date().setHours(0, 0, 0, 0))),
        },
      });

      workload.push({
        technicianId: tech.id,
        technicianName: tech.name,
        activeCount: activeOrders,
        completedToday,
      });
    }

    return workload.sort((a, b) => b.activeCount - a.activeCount);
  }
}
