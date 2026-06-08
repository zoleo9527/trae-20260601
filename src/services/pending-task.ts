import { store } from '../store';
import { handoverService } from './handover';
import { stuckOrderService } from './stuck-order';
import {
  Role,
  PendingTaskItem,
  PendingTaskSummaryItem,
  PendingTaskFilterParams,
  PendingTaskListResult,
  HandoverAction,
  LoadingPlanStatus,
  WagonAllocationStatus,
  ArrivalPickupStatus,
} from '../types';

export class PendingTaskService {
  getByRole(role: Role, filter?: PendingTaskFilterParams): PendingTaskListResult {
    stuckOrderService.scanAll();

    const tasks: PendingTaskItem[] = [];

    for (const plan of store.loadingPlans.values()) {
      if (plan.status === LoadingPlanStatus.Completed) continue;

      const latest = handoverService.getLatestAction('loading_plan', plan.id);
      if (!latest) continue;

      if (latest.toRole !== role) continue;

      const isWaiting =
        latest.action === HandoverAction.Submit ||
        latest.action === HandoverAction.Change ||
        latest.action === HandoverAction.Alert;

      if (!isWaiting) continue;

      const stuckOrders = stuckOrderService.getByEntity('loading_plan', plan.id);
      const activeStuck = stuckOrders.filter((s) => !s.resolvedAt);
      const blockingReason = activeStuck.length > 0 ? activeStuck.map((s) => s.description).join('; ') : null;

      tasks.push({
        entityType: 'loading_plan',
        entityId: plan.id,
        entityDisplayId: plan.planNo,
        currentStatus: plan.status,
        waitingForRole: role,
        waitingSince: latest.timestamp,
        dwellHours: (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60),
        blockingReason,
        relatedStuckOrders: activeStuck,
      });
    }

    for (const alloc of store.wagonAllocations.values()) {
      if (alloc.status === WagonAllocationStatus.Released) continue;

      const latest = handoverService.getLatestAction('wagon_allocation', alloc.id);
      if (!latest) continue;

      if (latest.toRole !== role) continue;

      const isWaiting =
        latest.action === HandoverAction.Submit ||
        latest.action === HandoverAction.Change ||
        latest.action === HandoverAction.Alert;

      if (!isWaiting) continue;

      const stuckOrders = stuckOrderService.getByEntity('wagon_allocation', alloc.id);
      const activeStuck = stuckOrders.filter((s) => !s.resolvedAt);
      const blockingReason = activeStuck.length > 0 ? activeStuck.map((s) => s.description).join('; ') : null;

      tasks.push({
        entityType: 'wagon_allocation',
        entityId: alloc.id,
        entityDisplayId: alloc.allocationNo,
        currentStatus: alloc.status,
        waitingForRole: role,
        waitingSince: latest.timestamp,
        dwellHours: (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60),
        blockingReason,
        relatedStuckOrders: activeStuck,
      });
    }

    for (const notice of store.arrivalNotices.values()) {
      if (notice.pickupStatus === ArrivalPickupStatus.PickedUp) continue;

      const latest = handoverService.getLatestAction('arrival_notice', notice.id);
      if (!latest) continue;

      if (latest.toRole !== role) continue;

      const isWaiting =
        latest.action === HandoverAction.Submit ||
        latest.action === HandoverAction.Change ||
        latest.action === HandoverAction.Alert;

      if (!isWaiting) continue;

      const stuckOrders = stuckOrderService.getByEntity('arrival_notice', notice.id);
      const activeStuck = stuckOrders.filter((s) => !s.resolvedAt);
      const blockingReason = activeStuck.length > 0 ? activeStuck.map((s) => s.description).join('; ') : null;

      tasks.push({
        entityType: 'arrival_notice',
        entityId: notice.id,
        entityDisplayId: notice.noticeNo,
        currentStatus: notice.pickupStatus,
        waitingForRole: role,
        waitingSince: latest.timestamp,
        dwellHours: (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60),
        blockingReason,
        relatedStuckOrders: activeStuck,
      });
    }

    for (const rec of store.damageRecords.values()) {
      const latest = handoverService.getLatestAction('damage_record', rec.id);
      if (!latest) continue;

      if (latest.toRole !== role) continue;

      const isWaiting =
        latest.action === HandoverAction.Submit ||
        latest.action === HandoverAction.Change ||
        latest.action === HandoverAction.Alert;

      if (!isWaiting) continue;

      const stuckOrders = stuckOrderService.getByEntity('damage_record', rec.id);
      const activeStuck = stuckOrders.filter((s) => !s.resolvedAt);
      const blockingReason = activeStuck.length > 0 ? activeStuck.map((s) => s.description).join('; ') : null;

      tasks.push({
        entityType: 'damage_record',
        entityId: rec.id,
        entityDisplayId: rec.id.slice(0, 8),
        currentStatus: rec.hasPhoto ? 'has_photo' : 'missing_photo',
        waitingForRole: role,
        waitingSince: latest.timestamp,
        dwellHours: (Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60),
        blockingReason,
        relatedStuckOrders: activeStuck,
      });
    }

    let filtered = tasks;

    if (filter?.minDwellHours !== undefined) {
      filtered = filtered.filter((t) => t.dwellHours >= filter.minDwellHours!);
    }

    if (filter?.blockedOnly) {
      filtered = filtered.filter((t) => t.blockingReason !== null);
    }

    filtered.sort((a, b) => {
      if (a.blockingReason && !b.blockingReason) return -1;
      if (!a.blockingReason && b.blockingReason) return 1;
      return a.dwellHours - b.dwellHours > 0 ? -1 : 1;
    });

    const reopenedCount = this.countReopenedForRole(role);

    return { tasks: filtered, reopenedCount };
  }

  private countReopenedForRole(role: Role): number {
    let count = 0;
    for (const record of store.handoverRecords) {
      if (
        record.action === HandoverAction.Alert &&
        record.comment &&
        record.comment.startsWith('卡单重开') &&
        (record.fromRole === role || record.toRole === role)
      ) {
        count++;
      }
    }
    return count;
  }

  summary(): PendingTaskSummaryItem[] {
    stuckOrderService.scanAll();

    const allRoles: Role[] = [Role.FreightClerk, Role.LoadingLeader, Role.CustomerService];
    const entityTypes: Array<'loading_plan' | 'wagon_allocation' | 'arrival_notice' | 'damage_record'> = [
      'loading_plan',
      'wagon_allocation',
      'arrival_notice',
      'damage_record',
    ];

    const items: PendingTaskSummaryItem[] = [];

    for (const role of allRoles) {
      const result = this.getByRole(role);
      const tasks = result.tasks;

      for (const et of entityTypes) {
        const group = tasks.filter((t) => t.entityType === et);
        if (group.length === 0) continue;

        items.push({
          role,
          entityType: et,
          count: group.length,
          maxDwellHours: Math.max(...group.map((t) => t.dwellHours)),
          blockedCount: group.filter((t) => t.blockingReason !== null).length,
        });
      }
    }

    items.sort((a, b) => {
      if (a.blockedCount !== b.blockedCount) return b.blockedCount - a.blockedCount;
      return b.maxDwellHours - a.maxDwellHours;
    });

    return items;
  }
}

export const pendingTaskService = new PendingTaskService();
