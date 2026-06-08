import { store } from '../store';
import { handoverService } from './handover';
import {
  StuckOrder,
  StuckType,
  StuckSeverity,
  StuckFilterParams,
  StuckSummaryItem,
  HandoverRecord,
  STUCK_THRESHOLDS,
  LoadingPlanStatus,
  WagonAllocationStatus,
  ArrivalPickupStatus,
} from '../types';

export class StuckOrderService {
  private hoursAgo(hours: number): string {
    const d = new Date();
    d.setTime(d.getTime() - hours * 60 * 60 * 1000);
    return d.toISOString();
  }

  private hoursBetween(isoA: string, isoB: string): number {
    return (new Date(isoB).getTime() - new Date(isoA).getTime()) / (1000 * 60 * 60);
  }

  private createStuck(params: Omit<StuckOrder, 'id' | 'resolvedAt' | 'resolution'>): StuckOrder {
    const existing = this.findUnresolved(params.entityType, params.entityId, params.stuckType);
    if (existing) return existing;

    const stuck: StuckOrder = {
      id: store.generateId(),
      ...params,
      resolvedAt: null,
      resolution: null,
    };
    store.stuckOrders.set(stuck.id, stuck);
    return stuck;
  }

  private findUnresolved(
    entityType: string,
    entityId: string,
    stuckType: StuckType
  ): StuckOrder | undefined {
    for (const s of store.stuckOrders.values()) {
      if (
        s.entityType === entityType &&
        s.entityId === entityId &&
        s.stuckType === stuckType &&
        !s.resolvedAt
      ) {
        return s;
      }
    }
    return undefined;
  }

  scanAll(): StuckOrder[] {
    const detected: StuckOrder[] = [];

    for (const plan of store.loadingPlans.values()) {
      detected.push(...this.scanPlan(plan.id));
    }

    for (const alloc of store.wagonAllocations.values()) {
      detected.push(...this.scanAllocation(alloc.id));
    }

    for (const notice of store.arrivalNotices.values()) {
      detected.push(...this.scanArrival(notice.id));
    }

    for (const rec of store.damageRecords.values()) {
      detected.push(...this.scanDamage(rec.id));
    }

    return detected;
  }

  scanPlan(planId: string): StuckOrder[] {
    const plan = store.loadingPlans.get(planId);
    if (!plan) return [];

    const now = new Date().toISOString();
    const detected: StuckOrder[] = [];

    if (plan.status === LoadingPlanStatus.Submitted && plan.submittedAt) {
      const elapsed = this.hoursBetween(plan.submittedAt, now);
      if (elapsed > STUCK_THRESHOLDS.PLAN_UNALLOCATED_HOURS) {
        detected.push(
          this.createStuck({
            entityType: 'loading_plan',
            entityId: planId,
            stuckType: StuckType.PlanUnallocated,
            severity: StuckSeverity.Warning,
            description: `装车计划 ${plan.planNo} 提交已超 ${elapsed.toFixed(1)} 小时，尚未分配车皮（阈值 ${STUCK_THRESHOLDS.PLAN_UNALLOCATED_HOURS}h）`,
            detectedAt: now,
          })
        );
      }
    }

    if (plan.changeHistory.length > 0) {
      const lastChange = plan.changeHistory[plan.changeHistory.length - 1];
      const elapsed = this.hoursBetween(lastChange.changedAt, now);
      if (elapsed > STUCK_THRESHOLDS.PLAN_CHANGE_HOURS && plan.status !== LoadingPlanStatus.Completed) {
        detected.push(
          this.createStuck({
            entityType: 'loading_plan',
            entityId: planId,
            stuckType: StuckType.PlanChangeTimeout,
            severity: StuckSeverity.Critical,
            description: `装车计划 ${plan.planNo} 变更后已超 ${elapsed.toFixed(1)} 小时未重新确认（阈值 ${STUCK_THRESHOLDS.PLAN_CHANGE_HOURS}h），变更原因：${lastChange.changeReason}`,
            detectedAt: now,
          })
        );
      }
    }

    return detected;
  }

  scanAllocation(allocId: string): StuckOrder[] {
    const alloc = store.wagonAllocations.get(allocId);
    if (!alloc) return [];

    const now = new Date().toISOString();
    const detected: StuckOrder[] = [];

    if (alloc.status === WagonAllocationStatus.Pending) {
      const elapsed = this.hoursBetween(alloc.allocatedAt, now);
      if (elapsed > STUCK_THRESHOLDS.ALLOCATION_UNCONFIRMED_HOURS) {
        detected.push(
          this.createStuck({
            entityType: 'wagon_allocation',
            entityId: allocId,
            stuckType: StuckType.AllocationUnconfirmed,
            severity: StuckSeverity.Warning,
            description: `车皮 ${alloc.wagonNo} 分配已超 ${elapsed.toFixed(1)} 小时，装卸班长尚未确认（阈值 ${STUCK_THRESHOLDS.ALLOCATION_UNCONFIRMED_HOURS}h）`,
            detectedAt: now,
          })
        );
      }
    }

    return detected;
  }

  scanArrival(noticeId: string): StuckOrder[] {
    const notice = store.arrivalNotices.get(noticeId);
    if (!notice) return [];

    const now = new Date().toISOString();
    const detected: StuckOrder[] = [];

    if (
      notice.pickupStatus === ArrivalPickupStatus.Notified ||
      notice.pickupStatus === ArrivalPickupStatus.Unclaimed
    ) {
      const reference = notice.consigneeNotifiedAt || notice.arrivalDate;
      const elapsed = this.hoursBetween(reference, now);
      if (elapsed > STUCK_THRESHOLDS.ARRIVAL_UNCLAIMED_HOURS) {
        notice.pickupStatus = ArrivalPickupStatus.Unclaimed;
        if (!notice.unclaimedSince) {
          notice.unclaimedSince = now;
        }
        detected.push(
          this.createStuck({
            entityType: 'arrival_notice',
            entityId: noticeId,
            stuckType: StuckType.ArrivalUnclaimed,
            severity: StuckSeverity.Critical,
            description: `到货通知 ${notice.noticeNo} 已超 ${elapsed.toFixed(1)} 小时无人提货（收货人：${notice.consigneeName}，阈值 ${STUCK_THRESHOLDS.ARRIVAL_UNCLAIMED_HOURS}h）`,
            detectedAt: now,
          })
        );
      }
    }

    return detected;
  }

  scanDamage(damageId: string): StuckOrder[] {
    const rec = store.damageRecords.get(damageId);
    if (!rec) return [];

    const now = new Date().toISOString();
    const detected: StuckOrder[] = [];

    if (!rec.hasPhoto) {
      detected.push(
        this.createStuck({
          entityType: 'damage_record',
          entityId: damageId,
          stuckType: StuckType.DamageNoPhoto,
          severity: StuckSeverity.Critical,
          description: `货损记录 ${rec.id} 缺少现场照片，报告人：${rec.reportedBy}，损类型：${rec.damageType}。货损无照片将导致责任认定困难，流程已阻断。`,
          detectedAt: now,
        })
      );
    }

    return detected;
  }

  resolve(stuckId: string, resolution: string): StuckOrder | null {
    const stuck = store.stuckOrders.get(stuckId);
    if (!stuck) return null;

    stuck.resolvedAt = new Date().toISOString();
    stuck.resolution = resolution;
    return stuck;
  }

  getActive(): StuckOrder[] {
    this.scanAll();
    return store.getActiveStuckOrders();
  }

  getByEntity(entityType: string, entityId: string): StuckOrder[] {
    return store.getStuckOrdersByEntity(entityType, entityId);
  }

  filter(params: StuckFilterParams): StuckOrder[] {
    this.scanAll();

    let results = store.getActiveStuckOrders();

    if (params.severity) {
      results = results.filter((s) => s.severity === params.severity);
    }

    if (params.stuckType) {
      results = results.filter((s) => s.stuckType === params.stuckType);
    }

    if (params.entityType) {
      results = results.filter((s) => s.entityType === params.entityType);
    }

    if (params.since) {
      const since = new Date(params.since).getTime();
      results = results.filter((s) => new Date(s.detectedAt).getTime() >= since);
    }

    if (params.until) {
      const until = new Date(params.until).getTime();
      results = results.filter((s) => new Date(s.detectedAt).getTime() <= until);
    }

    const severityOrder: Record<string, number> = {
      [StuckSeverity.Critical]: 0,
      [StuckSeverity.Warning]: 1,
    };

    results.sort((a, b) => {
      const sevDiff = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
      if (sevDiff !== 0) return sevDiff;
      return new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
    });

    return results;
  }

  summary(): StuckSummaryItem[] {
    this.scanAll();

    const active = store.getActiveStuckOrders();

    const grouped = new Map<string, { items: StuckOrder[] }>();

    for (const s of active) {
      const key = `${s.stuckType}::${s.severity}`;
      if (!grouped.has(key)) {
        grouped.set(key, { items: [] });
      }
      grouped.get(key)!.items.push(s);
    }

    const summaryItems: StuckSummaryItem[] = [];

    for (const [, group] of grouped) {
      const items = group.items;
      items.sort((a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime());
      summaryItems.push({
        stuckType: items[0].stuckType,
        severity: items[0].severity,
        count: items.length,
        earliestDetectedAt: items[0].detectedAt,
      });
    }

    const severityOrder: Record<string, number> = {
      [StuckSeverity.Critical]: 0,
      [StuckSeverity.Warning]: 1,
    };

    summaryItems.sort((a, b) => {
      const sevDiff = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
      if (sevDiff !== 0) return sevDiff;
      return new Date(a.earliestDetectedAt).getTime() - new Date(b.earliestDetectedAt).getTime();
    });

    return summaryItems;
  }

  getTrail(stuckId: string): { stuck: StuckOrder; trail: HandoverRecord[] } | null {
    const stuck = store.stuckOrders.get(stuckId);
    if (!stuck) return null;

    const records = handoverService.getRecordsForEntity(stuck.entityType, stuck.entityId);

    const trail = [...records].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return { stuck, trail };
  }
}

export const stuckOrderService = new StuckOrderService();
