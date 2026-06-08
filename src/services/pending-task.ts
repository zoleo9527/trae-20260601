import { store } from '../store';
import { handoverService } from './handover';
import { stuckOrderService } from './stuck-order';
import {
  Role,
  PendingTaskItem,
  HandoverAction,
  LoadingPlanStatus,
  WagonAllocationStatus,
  ArrivalPickupStatus,
} from '../types';

export class PendingTaskService {
  getByRole(role: Role): PendingTaskItem[] {
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

    tasks.sort((a, b) => {
      if (a.blockingReason && !b.blockingReason) return -1;
      if (!a.blockingReason && b.blockingReason) return 1;
      return a.dwellHours - b.dwellHours > 0 ? -1 : 1;
    });

    return tasks;
  }
}

export const pendingTaskService = new PendingTaskService();
