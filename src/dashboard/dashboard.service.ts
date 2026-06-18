import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { IntakeService } from '../intake/service/intake.service';
import { MatchingService } from '../matching/service/matching.service';
import { OrderService } from '../order/service/order.service';
import { ReviewService } from '../review/service/review.service';
import { AuditService } from '../audit/service/audit.service';
import { Intake } from '../intake/entities/intake.entity';
import { Order } from '../order/entities/order.entity';
import { Review } from '../review/review.entity';
import { MatchingAttempt } from '../matching/entities/matching-attempt.entity';
import { Role, IntakeStatus, IntakeBlockReason, MatchingStatus, MatchingFailReason } from '../common/enums';
import { OrderStatus } from '../common/enums/order-status.enum';
import { ReviewStatus } from '../common/enums/review-status.enum';

const BLOCK_REASON_TEXT: Record<IntakeBlockReason, string> = {
  [IntakeBlockReason.NONE]: '无阻塞',
  [IntakeBlockReason.AWAITING_CUSTOMER_CLARIFICATION]: '等待客户澄清需求',
  [IntakeBlockReason.AWAITING_CS_FOLLOWUP]: '等待客服跟进',
  [IntakeBlockReason.NO_HOUSEKEEPER_AVAILABLE]: '暂无合适阿姨',
  [IntakeBlockReason.AWAITING_CUSTOMER_CONFIRM]: '等待客户确认匹配',
  [IntakeBlockReason.AWAITING_HOUSEKEEPER_CONFIRM]: '等待阿姨确认接单',
  [IntakeBlockReason.CUSTOMER_UNREACHABLE]: '客户联系不上',
  [IntakeBlockReason.HOUSEKEEPER_UNREACHABLE]: '阿姨联系不上',
  [IntakeBlockReason.AWAITING_QUALITY_REVIEW]: '等待质检处理',
};

const FAIL_REASON_TEXT: Record<MatchingFailReason, string> = {
  [MatchingFailReason.NONE]: '无',
  [MatchingFailReason.SKILL_MISMATCH]: '技能不匹配',
  [MatchingFailReason.TIME_UNAVAILABLE]: '时间不可用',
  [MatchingFailReason.AREA_NOT_COVERED]: '地域不覆盖',
  [MatchingFailReason.SALARY_BELOW_EXPECTATION]: '薪资低于期望',
  [MatchingFailReason.HOUSEKEEPER_ALREADY_ASSIGNED]: '阿姨已分配给其他需求',
  [MatchingFailReason.CUSTOMER_REJECTED_PREVIOUS]: '客户之前拒绝过',
  [MatchingFailReason.HOUSEKEEPER_HAS_NEGATIVE_REVIEW]: '阿姨差评率过高',
  [MatchingFailReason.SERVICE_SCOPE_UNCLEAR]: '服务范围不清晰',
  [MatchingFailReason.EXPERIENCE_INSUFFICIENT]: '经验不足',
  [MatchingFailReason.NO_MATCH_AFTER_N_ROUNDS]: '多轮匹配后无结果',
};

const NON_FINAL_INTAKE_STATUSES = [
  IntakeStatus.CREATED,
  IntakeStatus.CLARIFYING,
  IntakeStatus.CLARIFIED,
  IntakeStatus.MATCHING,
  IntakeStatus.MATCHED,
  IntakeStatus.CONFIRMED,
  IntakeStatus.SERVICE_STARTED,
];

const NON_FINAL_ORDER_STATUSES = [
  OrderStatus.DRAFT,
  OrderStatus.SCHEDULED,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_SERVICE,
  OrderStatus.DISPUTED,
];

const NON_FINAL_REVIEW_STATUSES = [
  ReviewStatus.SUBMITTED,
  ReviewStatus.AWAITING_QUALITY_ASSIGN,
  ReviewStatus.QUALITY_FOLLOWING,
  ReviewStatus.ESCALATED,
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Intake)
    private readonly intakeRepo: Repository<Intake>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(MatchingAttempt)
    private readonly attemptRepo: Repository<MatchingAttempt>,
    private readonly intakeService: IntakeService,
    private readonly matchingService: MatchingService,
    private readonly orderService: OrderService,
    private readonly reviewService: ReviewService,
    private readonly auditService: AuditService,
  ) {}

  private calcStuckHours(blockedAt?: Date): number {
    if (!blockedAt) return 0;
    const ms = Date.now() - new Date(blockedAt).getTime();
    return Math.round((ms / 3600000) * 100) / 100;
  }

  private groupByOwner<T extends { ownerId?: string; ownerName?: string }>(items: T[]) {
    const map = new Map();
    for (const item of items) {
      const oid = item.ownerId || 'unassigned';
      const oname = item.ownerName || '未分配';
      if (!map.has(oid)) {
        map.set(oid, { ownerName: oname, count: 0, items: [] });
      }
      const entry = map.get(oid);
      entry.count += 1;
      entry.items.push(item);
    }
    return map;
  }

  private buildOwnerSummary(role: Role, roleName: string, intakes: Intake[], orders: Order[], reviews: Review[]) {
    const intakeByOwner = this.groupByOwner(intakes);
    const orderByOwner = this.groupByOwner(orders);
    const reviewByOwner = this.groupByOwner(reviews);
    const ownerIds = new Set([
      ...Array.from(intakeByOwner.keys()),
      ...Array.from(orderByOwner.keys()),
      ...Array.from(reviewByOwner.keys()),
    ]);
    const byOwner = new Map();
    for (const oid of ownerIds) {
      const ie = intakeByOwner.get(oid);
      const oe = orderByOwner.get(oid);
      const re = reviewByOwner.get(oid);
      byOwner.set(oid, {
        ownerName: ie?.ownerName || oe?.ownerName || re?.ownerName || '未分配',
        intakes: ie?.count || 0,
        reviews: re?.count || 0,
        orders: oe?.count || 0,
        items: [...(ie?.items || []), ...(oe?.items || []), ...(re?.items || [])],
      });
    }
    const sortedOwners = Array.from(byOwner.entries()).sort(
      (a, b) => b[1].intakes + b[1].reviews + b[1].orders - (a[1].intakes + a[1].reviews + a[1].orders),
    );
    return {
      role,
      roleName,
      total: intakes.length + orders.length + reviews.length,
      intakes: Array.from(intakeByOwner.entries()).map(([id, v]) => ({
        id,
        name: v.ownerName,
        count: v.count,
        details: v.items,
      })),
      reviews: Array.from(reviewByOwner.entries()).map(([id, v]) => ({
        id,
        name: v.ownerName,
        count: v.count,
        details: v.items,
      })),
      orders: Array.from(orderByOwner.entries()).map(([id, v]) => ({
        id,
        name: v.ownerName,
        count: v.count,
        details: v.items,
      })),
      byOwner: new Map(sortedOwners),
    };
  }

  async getOwnerSummary() {
    const activeIntakes = await this.intakeRepo.find({
      where: { status: In(NON_FINAL_INTAKE_STATUSES) },
      order: { createdAt: 'DESC' },
    });
    const activeOrders = await this.orderRepo.find({
      where: { status: In(NON_FINAL_ORDER_STATUSES) },
      order: { statusChangedAt: 'DESC' },
    });
    const activeReviews = await this.reviewRepo.find({
      where: { status: In(NON_FINAL_REVIEW_STATUSES) },
      order: { createdAt: 'DESC' },
    });
    const csIntakes = activeIntakes.filter(i => i.ownerRole === Role.CUSTOMER_SERVICE || !i.ownerRole);
    const csOrders = activeOrders.filter(o => o.ownerRole === Role.CUSTOMER_SERVICE || !o.ownerRole);
    const hkIntakes = activeIntakes.filter(i => i.ownerRole === Role.HOUSEKEEPER);
    const hkOrders = activeOrders.filter(o => o.ownerRole === Role.HOUSEKEEPER);
    const qsIntakes = activeIntakes.filter(i => i.ownerRole === Role.QUALITY_SUPERVISOR);
    const qsOrders = activeOrders.filter(o => o.ownerRole === Role.QUALITY_SUPERVISOR);
    const customerService = this.buildOwnerSummary(Role.CUSTOMER_SERVICE, '客服', csIntakes, csOrders, []);
    const housekeepers = this.buildOwnerSummary(Role.HOUSEKEEPER, '家政员', hkIntakes, hkOrders, []);
    const qualitySupervisors = this.buildOwnerSummary(Role.QUALITY_SUPERVISOR, '质检主管', qsIntakes, qsOrders, activeReviews);
    this.auditService.quickLog('DASHBOARD', 'owner-summary', 'QUERY', '查询责任人汇总');
    return {
      generatedAt: new Date().toISOString(),
      totalActive: {
        intakes: activeIntakes.length,
        orders: activeOrders.length,
        reviews: activeReviews.length,
      },
      byRole: { customerService, housekeepers, qualitySupervisors },
    };
  }

  async getBlockedIntakes() {
    const blocked = await this.intakeRepo.find({
      where: { blockReason: Not(IntakeBlockReason.NONE) },
      order: { blockedAt: 'ASC' },
    });
    const list = blocked.map(i => ({
      id: i.id,
      intakeNo: i.intakeNo,
      customerName: i.customerName,
      customerPhone: i.customerPhone,
      status: i.status,
      blockReason: i.blockReason,
      blockReasonText: BLOCK_REASON_TEXT[i.blockReason] || i.blockReason,
      blockedAt: i.blockedAt,
      stuckHours: this.calcStuckHours(i.blockedAt),
      ownerRole: i.ownerRole,
      ownerId: i.ownerId,
      ownerName: i.ownerName,
      serviceType: i.serviceType,
      currentMatchingRound: i.currentMatchingRound,
    }));
    const byReason = new Map();
    for (const item of list) {
      const key = item.blockReason;
      if (!byReason.has(key)) byReason.set(key, { count: 0, items: [], avgStuckHours: 0 });
      const entry = byReason.get(key);
      entry.count += 1;
      entry.items.push(item);
    }
    for (const [, v] of byReason.entries()) {
      v.avgStuckHours = v.items.length > 0
        ? Math.round((v.items.reduce((s, x) => s + x.stuckHours, 0) / v.items.length) * 100) / 100
        : 0;
    }
    const byStuckLevel = {
      critical: list.filter(i => i.stuckHours >= 72),
      warning: list.filter(i => i.stuckHours >= 24 && i.stuckHours < 72),
      normal: list.filter(i => i.stuckHours < 24),
    };
    this.auditService.quickLog('DASHBOARD', 'blocked-intakes', 'QUERY', `查询卡住Intake，共${list.length}条`);
    return {
      generatedAt: new Date().toISOString(),
      total: list.length,
      avgStuckHours: list.length > 0
        ? Math.round((list.reduce((s, x) => s + x.stuckHours, 0) / list.length) * 100) / 100
        : 0,
      maxStuckHours: list.length > 0 ? Math.max(...list.map(i => i.stuckHours)) : 0,
      byStuckLevel: {
        critical: byStuckLevel.critical.length,
        warning: byStuckLevel.warning.length,
        normal: byStuckLevel.normal.length,
      },
      byReason: Object.fromEntries(
        Array.from(byReason.entries()).map(([k, v]) => [k, {
          reason: k,
          reasonText: BLOCK_REASON_TEXT[k as IntakeBlockReason] || k,
          count: v.count,
          avgStuckHours: v.avgStuckHours,
          items: v.items,
        }]),
      ),
      list,
    };
  }

  async getMatchingBlockReasons(intakeId?: string) {
    const where: any = {};
    if (intakeId) where.intakeId = intakeId;
    const attempts = await this.attemptRepo.find({ where });
    const intakeIds = Array.from(new Set(attempts.map(a => a.intakeId)));
    const intakes = intakeIds.length > 0 ? await this.intakeRepo.find({ where: { id: In(intakeIds) } }) : [];
    const intakeMap = new Map(intakes.map(i => [i.id, i]));
    const perIntakeMap = new Map();
    for (const a of attempts) {
      if (!perIntakeMap.has(a.intakeId)) perIntakeMap.set(a.intakeId, []);
      perIntakeMap.get(a.intakeId).push(a);
    }
    const perIntake = Array.from(perIntakeMap.entries()).map(([iid, attList]) => {
      const reasonCounts: Record<string, number> = {};
      let accepted = 0;
      for (const a of attList) {
        if (a.status === MatchingStatus.ACCEPTED) accepted += 1;
        if (a.failReason && a.failReason !== MatchingFailReason.NONE) {
          reasonCounts[a.failReason] = (reasonCounts[a.failReason] || 0) + 1;
        }
      }
      const topReasons = Object.entries(reasonCounts)
        .sort((a: [string, any], b: [string, any]) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));
      const i = intakeMap.get(iid);
      return {
        intakeId: iid,
        intakeNo: i?.intakeNo || '',
        customerName: i?.customerName || '',
        currentRound: i?.currentMatchingRound || 0,
        totalAttempts: attList.length,
        acceptedCount: accepted,
        successRate: attList.length > 0 ? Math.round((accepted / attList.length) * 10000) / 10000 : 0,
        topReasons,
      };
    }).sort((a, b) => b.totalAttempts - a.totalAttempts);
    const globalReasonCounts: Record<string, number> = {};
    let totalAccepted = 0;
    const byRoundMap = new Map();
    for (const a of attempts) {
      if (a.status === MatchingStatus.ACCEPTED) totalAccepted += 1;
      if (a.failReason && a.failReason !== MatchingFailReason.NONE) {
        globalReasonCounts[a.failReason] = (globalReasonCounts[a.failReason] || 0) + 1;
      }
      const r = a.round || 1;
      if (!byRoundMap.has(r)) byRoundMap.set(r, { attempts: [], reasons: {}, accepted: 0 });
      const re = byRoundMap.get(r);
      re.attempts.push(a);
      if (a.status === MatchingStatus.ACCEPTED) re.accepted += 1;
      if (a.failReason && a.failReason !== MatchingFailReason.NONE) {
        re.reasons[a.failReason] = (re.reasons[a.failReason] || 0) + 1;
      }
    }
    const totalAttempts = attempts.length;
    const topReasons = Object.entries(globalReasonCounts)
      .sort((a: [string, any], b: [string, any]) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({
        reason,
        reasonText: FAIL_REASON_TEXT[reason as MatchingFailReason] || reason,
        count,
        percentage: totalAttempts > 0 ? Math.round((count / totalAttempts) * 10000) / 10000 : 0,
      }));
    const byRound = Array.from(byRoundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, data]) => {
        const ta = data.attempts.length;
        const acc = data.accepted;
        const rej = ta - acc;
        const reasons = Object.entries(data.reasons)
          .sort((a: [string, any], b: [string, any]) => b[1] - a[1])
          .slice(0, 5)
          .map(([reason, count]) => ({ reason, count }));
        return {
          round,
          totalAttempts: ta,
          accepted: acc,
          rejected: rej,
          successRate: ta > 0 ? Math.round((acc / ta) * 10000) / 10000 : 0,
          topReasons: reasons,
        };
      });
    const roundsByIntake = new Map();
    for (const a of attempts) {
      if (!roundsByIntake.has(a.intakeId)) roundsByIntake.set(a.intakeId, new Set());
      roundsByIntake.get(a.intakeId).add(a.round || 1);
    }
    const totalIntakesWithAttempts = roundsByIntake.size;
    const avgRounds = totalIntakesWithAttempts > 0
      ? Math.round((Array.from(roundsByIntake.values()).reduce((s, rs) => s + rs.size, 0) / totalIntakesWithAttempts) * 100) / 100
      : 0;
    const targetIntake = intakeId ? intakeMap.get(intakeId) : null;
    this.auditService.quickLog(
      'DASHBOARD',
      'matching-block-reasons',
      'QUERY',
      intakeId ? `查询单个Intake匹配失败分析: ${intakeId}` : '查询全局匹配失败分析',
    );
    const result: any = {
      intakeId: intakeId || undefined,
      intakeNo: targetIntake?.intakeNo,
      customerName: targetIntake?.customerName,
      totalIntakes: totalIntakesWithAttempts,
      totalAttempts,
      totalAccepted,
      overallSuccessRate: totalAttempts > 0 ? Math.round((totalAccepted / totalAttempts) * 10000) / 10000 : 0,
      topReasons,
      byRound,
    };
    if (!intakeId) {
      result.perIntake = perIntake;
      result.avgRoundsPerIntake = avgRounds;
    }
    return result;
  }

  async getOverview() {
    const [allIntakes, allOrders, allReviews, allAttempts] = await Promise.all([
      this.intakeRepo.find(),
      this.orderRepo.find(),
      this.reviewRepo.find(),
      this.attemptRepo.find(),
    ]);
    const countBy = <T, K extends keyof T>(arr: T[], key: K): Record<string, number> => {
      const r: Record<string, number> = {};
      for (const x of arr) {
        const k = String(x[key] || 'UNKNOWN');
        r[k] = (r[k] || 0) + 1;
      }
      return r;
    };
    const intakeByStatus = countBy(allIntakes, 'status');
    const orderByStatus = countBy(allOrders, 'status');
    const reviewByStatus = countBy(allReviews, 'status');
    const blockedCount = allIntakes.filter(i => i.blockReason && i.blockReason !== IntakeBlockReason.NONE).length;
    const totalAttempts = allAttempts.length;
    const acceptedAttempts = allAttempts.filter(a => a.status === MatchingStatus.ACCEPTED).length;
    const roundsByIntake = new Map();
    for (const a of allAttempts) {
      if (!roundsByIntake.has(a.intakeId)) roundsByIntake.set(a.intakeId, new Set());
      roundsByIntake.get(a.intakeId).add(a.round || 1);
    }
    const avgRounds = roundsByIntake.size > 0
      ? Math.round((Array.from(roundsByIntake.values()).reduce((s, rs) => s + rs.size, 0) / roundsByIntake.size) * 100) / 100
      : 0;
    const totalRating = allReviews.reduce((s, r) => s + (r.rating || 0), 0);
    const avgRating = allReviews.length > 0 ? Math.round((totalRating / allReviews.length) * 100) / 100 : 0;
    const activeCsOwners = new Set<string>();
    const activeHkOwners = new Set<string>();
    const activeQsOwners = new Set<string>();
    for (const i of allIntakes) {
      if (!i.ownerId) continue;
      if (i.ownerRole === Role.CUSTOMER_SERVICE) activeCsOwners.add(i.ownerId);
      else if (i.ownerRole === Role.HOUSEKEEPER) activeHkOwners.add(i.ownerId);
      else if (i.ownerRole === Role.QUALITY_SUPERVISOR) activeQsOwners.add(i.ownerId);
    }
    for (const o of allOrders) {
      if (!o.ownerId) continue;
      if (o.ownerRole === Role.CUSTOMER_SERVICE) activeCsOwners.add(o.ownerId);
      else if (o.ownerRole === Role.HOUSEKEEPER) activeHkOwners.add(o.ownerId);
      else if (o.ownerRole === Role.QUALITY_SUPERVISOR) activeQsOwners.add(o.ownerId);
    }
    for (const r of allReviews) {
      if (!r.ownerId) continue;
      if (r.ownerRole === Role.CUSTOMER_SERVICE) activeCsOwners.add(r.ownerId);
      else if (r.ownerRole === Role.HOUSEKEEPER) activeHkOwners.add(r.ownerId);
      else if (r.ownerRole === Role.QUALITY_SUPERVISOR) activeQsOwners.add(r.ownerId);
    }
    this.auditService.quickLog('DASHBOARD', 'overview', 'QUERY', '查询综合统计总览');
    return {
      generatedAt: new Date().toISOString(),
      stats: {
        intakes: {
          total: allIntakes.length,
          created: intakeByStatus[IntakeStatus.CREATED] || 0,
          clarifying: (intakeByStatus[IntakeStatus.CLARIFYING] || 0) + (intakeByStatus[IntakeStatus.CLARIFIED] || 0),
          matching: intakeByStatus[IntakeStatus.MATCHING] || 0,
          matched: (intakeByStatus[IntakeStatus.MATCHED] || 0) + (intakeByStatus[IntakeStatus.CONFIRMED] || 0),
          inService: intakeByStatus[IntakeStatus.SERVICE_STARTED] || 0,
          completed: intakeByStatus[IntakeStatus.COMPLETED] || 0,
          cancelled: intakeByStatus[IntakeStatus.CANCELLED] || 0,
          blocked: blockedCount,
        },
        orders: {
          total: allOrders.length,
          scheduled: orderByStatus[OrderStatus.SCHEDULED] || 0,
          confirmed: orderByStatus[OrderStatus.CONFIRMED] || 0,
          inService: orderByStatus[OrderStatus.IN_SERVICE] || 0,
          completed: orderByStatus[OrderStatus.COMPLETED] || 0,
          disputed: orderByStatus[OrderStatus.DISPUTED] || 0,
          noShow: (orderByStatus[OrderStatus.NO_SHOW_BY_HOUSEKEEPER] || 0) + (orderByStatus[OrderStatus.NO_SHOW_BY_CUSTOMER] || 0),
          cancelled: orderByStatus[OrderStatus.CANCELLED] || 0,
        },
        reviews: {
          total: allReviews.length,
          submitted: reviewByStatus[ReviewStatus.SUBMITTED] || 0,
          inProgress: (reviewByStatus[ReviewStatus.AWAITING_QUALITY_ASSIGN] || 0) + (reviewByStatus[ReviewStatus.QUALITY_FOLLOWING] || 0),
          resolved: reviewByStatus[ReviewStatus.RESOLVED] || 0,
          escalated: reviewByStatus[ReviewStatus.ESCALATED] || 0,
          avgRating,
        },
        matching: {
          totalAttempts,
          accepted: acceptedAttempts,
          successRate: totalAttempts > 0 ? Math.round((acceptedAttempts / totalAttempts) * 10000) / 10000 : 0,
          avgRoundsPerIntake: avgRounds,
        },
        owners: {
          customerService: activeCsOwners.size,
          housekeepers: activeHkOwners.size,
          qualitySupervisors: activeQsOwners.size,
          activeCsWithWork: activeCsOwners.size,
          activeHkWithWork: activeHkOwners.size,
          activeQsWithWork: activeQsOwners.size,
        },
      },
    };
  }
}
