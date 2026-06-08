import { store } from '../store';
import { handoverService } from './handover';
import { stuckOrderService } from './stuck-order';
import {
  LoadingPlan,
  LoadingPlanStatus,
  SubmitLoadingPlanRequest,
  ChangeLoadingPlanRequest,
  PlanChangeRecord,
  HandoverAction,
  Role,
} from '../types';

export class LoadingPlanService {
  submit(req: SubmitLoadingPlanRequest): { plan: LoadingPlan; created: boolean } {
    if (req.idempotencyKey) {
      const existing = store.idempotencyKeys.get(req.idempotencyKey);
      if (existing && existing.entityType === 'loading_plan') {
        const plan = store.loadingPlans.get(existing.entityId);
        if (plan) return { plan, created: false };
      }
    }

    const existingByNo = store.getLoadingPlansByPlanNo(req.planNo);
    if (existingByNo) {
      return { plan: existingByNo, created: false };
    }

    const now = new Date().toISOString();
    const plan: LoadingPlan = {
      id: store.generateId(),
      planNo: req.planNo,
      freightTicketNo: req.freightTicketNo,
      status: LoadingPlanStatus.Submitted,
      cargoType: req.cargoType,
      cargoWeight: req.cargoWeight,
      cargoVolume: req.cargoVolume,
      plannedLoadDate: req.plannedLoadDate,
      destinationStation: req.destinationStation,
      submittedBy: req.submittedBy,
      submittedAt: now,
      changeHistory: [],
      createdAt: now,
      updatedAt: now,
      idempotencyKey: req.idempotencyKey || null,
    };

    store.loadingPlans.set(plan.id, plan);

    if (req.idempotencyKey) {
      store.idempotencyKeys.set(req.idempotencyKey, {
        entityType: 'loading_plan',
        entityId: plan.id,
      });
    }

    handoverService.record({
      entityType: 'loading_plan',
      entityId: plan.id,
      fromRole: Role.FreightClerk,
      toRole: Role.LoadingLeader,
      fromUserId: req.submittedBy,
      toUserId: 'system',
      action: HandoverAction.Submit,
      comment: `货运员 ${req.submittedBy} 提交装车计划 ${req.planNo}`,
    });

    return { plan, created: true };
  }

  change(planId: string, req: ChangeLoadingPlanRequest): LoadingPlan {
    const plan = store.loadingPlans.get(planId);
    if (!plan) throw new Error(`装车计划 ${planId} 不存在`);

    if (plan.status === LoadingPlanStatus.Completed) {
      throw new Error('已完成的装车计划不可变更');
    }

    const previousValues: Record<string, unknown> = {};
    for (const key of Object.keys(req.changes)) {
      if (key in plan) {
        previousValues[key] = (plan as unknown as Record<string, unknown>)[key];
      }
    }

    const changeRecord: PlanChangeRecord = {
      changedAt: new Date().toISOString(),
      changedBy: req.changedBy,
      changeReason: req.changeReason,
      previousValue: previousValues,
      newValue: req.changes,
    };

    for (const [key, value] of Object.entries(req.changes)) {
      if (key in plan) {
        (plan as unknown as Record<string, unknown>)[key] = value;
      }
    }

    plan.changeHistory.push(changeRecord);
    plan.updatedAt = new Date().toISOString();

    if (plan.status === LoadingPlanStatus.Allocated) {
      plan.status = LoadingPlanStatus.Submitted;
    }

    handoverService.record({
      entityType: 'loading_plan',
      entityId: planId,
      fromRole: Role.FreightClerk,
      toRole: Role.LoadingLeader,
      fromUserId: req.changedBy,
      toUserId: 'system',
      action: HandoverAction.Change,
      comment: `装车计划变更，原因：${req.changeReason}`,
    });

    stuckOrderService.scanPlan(planId);

    return plan;
  }

  getById(planId: string): LoadingPlan | undefined {
    return store.loadingPlans.get(planId);
  }

  getByPlanNo(planNo: string): LoadingPlan | undefined {
    return store.getLoadingPlansByPlanNo(planNo);
  }

  list(): LoadingPlan[] {
    return Array.from(store.loadingPlans.values());
  }

  markAllocated(planId: string): LoadingPlan {
    const plan = store.loadingPlans.get(planId);
    if (!plan) throw new Error(`装车计划 ${planId} 不存在`);
    plan.status = LoadingPlanStatus.Allocated;
    plan.updatedAt = new Date().toISOString();
    return plan;
  }

  markLoading(planId: string): LoadingPlan {
    const plan = store.loadingPlans.get(planId);
    if (!plan) throw new Error(`装车计划 ${planId} 不存在`);
    plan.status = LoadingPlanStatus.Loading;
    plan.updatedAt = new Date().toISOString();
    return plan;
  }

  markCompleted(planId: string): LoadingPlan {
    const plan = store.loadingPlans.get(planId);
    if (!plan) throw new Error(`装车计划 ${planId} 不存在`);
    plan.status = LoadingPlanStatus.Completed;
    plan.updatedAt = new Date().toISOString();

    const activeStuck = store.getStuckOrdersByEntity('loading_plan', planId);
    for (const s of activeStuck) {
      stuckOrderService.resolve(s.id, '装车计划已完成，卡单自动解除');
    }

    return plan;
  }

  return(planId: string, returnedBy: string, reason: string): LoadingPlan {
    const plan = store.loadingPlans.get(planId);
    if (!plan) throw new Error(`装车计划 ${planId} 不存在`);

    plan.status = LoadingPlanStatus.Returned;
    plan.updatedAt = new Date().toISOString();

    handoverService.record({
      entityType: 'loading_plan',
      entityId: planId,
      fromRole: Role.LoadingLeader,
      toRole: Role.FreightClerk,
      fromUserId: returnedBy,
      toUserId: plan.submittedBy,
      action: HandoverAction.Return,
      comment: `装卸班长退回装车计划，原因：${reason}`,
    });

    return plan;
  }
}

export const loadingPlanService = new LoadingPlanService();
