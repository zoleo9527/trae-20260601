import { store } from '../store';
import { handoverService } from './handover';
import { stuckOrderService } from './stuck-order';
import { loadingPlanService } from './loading-plan';
import {
  WagonAllocation,
  WagonAllocationStatus,
  LoadingPlanStatus,
  AllocateWagonRequest,
  ConfirmAllocationRequest,
  HandoverAction,
  HandoverRecord,
  StuckOrder,
  Role,
} from '../types';

export class WagonAllocationService {
  allocate(req: AllocateWagonRequest): { allocation: WagonAllocation; created: boolean } {
    if (req.idempotencyKey) {
      const existing = store.idempotencyKeys.get(req.idempotencyKey);
      if (existing && existing.entityType === 'wagon_allocation') {
        const alloc = store.wagonAllocations.get(existing.entityId);
        if (alloc) return { allocation: alloc, created: false };
      }
    }

    const plan = store.loadingPlans.get(req.loadingPlanId);
    if (!plan) throw new Error(`装车计划 ${req.loadingPlanId} 不存在`);

    if (plan.status !== LoadingPlanStatus.Submitted && plan.status !== LoadingPlanStatus.Allocated) {
      throw new Error(`装车计划当前状态 ${plan.status} 不可分配车皮`);
    }

    const now = new Date().toISOString();
    const allocation: WagonAllocation = {
      id: store.generateId(),
      allocationNo: `WA-${Date.now()}`,
      loadingPlanId: req.loadingPlanId,
      wagonNo: req.wagonNo,
      wagonType: req.wagonType,
      loadCapacity: req.loadCapacity,
      actualLoadWeight: null,
      status: WagonAllocationStatus.Pending,
      allocatedBy: req.allocatedBy,
      allocatedAt: now,
      confirmedBy: null,
      confirmedAt: null,
      idempotencyKey: req.idempotencyKey || null,
    };

    store.wagonAllocations.set(allocation.id, allocation);

    if (req.idempotencyKey) {
      store.idempotencyKeys.set(req.idempotencyKey, {
        entityType: 'wagon_allocation',
        entityId: allocation.id,
      });
    }

    loadingPlanService.markAllocated(req.loadingPlanId);

    handoverService.record({
      entityType: 'wagon_allocation',
      entityId: allocation.id,
      fromRole: Role.LoadingLeader,
      toRole: Role.LoadingLeader,
      fromUserId: req.allocatedBy,
      toUserId: 'system',
      action: HandoverAction.Submit,
      comment: `车皮 ${req.wagonNo}（${req.wagonType}）已分配至装车计划 ${plan.planNo}，待装卸班长确认`,
    });

    stuckOrderService.scanAllocation(allocation.id);

    return { allocation, created: true };
  }

  confirm(allocationId: string, req: ConfirmAllocationRequest): WagonAllocation {
    const alloc = store.wagonAllocations.get(allocationId);
    if (!alloc) throw new Error(`车皮分配 ${allocationId} 不存在`);

    if (alloc.status !== WagonAllocationStatus.Pending) {
      throw new Error(`车皮分配当前状态 ${alloc.status} 不可确认`);
    }

    const activeStuck = store.getStuckOrdersByEntity('wagon_allocation', allocationId);
    if (activeStuck.length > 0) {
      throw new Error('该车皮分配存在未解决的卡单，请先处理异常后再确认');
    }

    alloc.status = WagonAllocationStatus.Confirmed;
    alloc.confirmedBy = req.confirmedBy;
    alloc.confirmedAt = new Date().toISOString();
    if (req.actualLoadWeight !== undefined) {
      alloc.actualLoadWeight = req.actualLoadWeight;
    }

    loadingPlanService.markLoading(alloc.loadingPlanId);

    handoverService.record({
      entityType: 'wagon_allocation',
      entityId: allocationId,
      fromRole: Role.LoadingLeader,
      toRole: Role.CustomerService,
      fromUserId: req.confirmedBy,
      toUserId: 'system',
      action: HandoverAction.Confirm,
      comment: `装卸班长 ${req.confirmedBy} 确认车皮 ${alloc.wagonNo}，流程转交客服`,
    });

    return alloc;
  }

  getById(allocationId: string): WagonAllocation | undefined {
    return store.wagonAllocations.get(allocationId);
  }

  getByPlanId(planId: string): WagonAllocation[] {
    return store.getAllocationsByPlanId(planId);
  }

  list(): WagonAllocation[] {
    return Array.from(store.wagonAllocations.values());
  }

  getAllocationHistory(planId: string): {
    plan: ReturnType<typeof loadingPlanService.getById>;
    allocations: WagonAllocation[];
    handovers: HandoverRecord[];
    stuckOrders: StuckOrder[];
  } {
    const plan = loadingPlanService.getById(planId);
    const allocations = this.getByPlanId(planId);
    const allHandovers: ReturnType<typeof handoverService.getRecordsForEntity> = [];
    const allStuck: ReturnType<typeof stuckOrderService.getByEntity> = [];

    if (plan) {
      allHandovers.push(...handoverService.getRecordsForEntity('loading_plan', planId));
      allStuck.push(...stuckOrderService.getByEntity('loading_plan', planId));
    }

    for (const alloc of allocations) {
      allHandovers.push(...handoverService.getRecordsForEntity('wagon_allocation', alloc.id));
      allStuck.push(...stuckOrderService.getByEntity('wagon_allocation', alloc.id));
    }

    allHandovers.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      plan,
      allocations,
      handovers: allHandovers,
      stuckOrders: allStuck,
    };
  }
}

export const wagonAllocationService = new WagonAllocationService();
