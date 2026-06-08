import { v4 as uuidv4 } from 'uuid';
import {
  LoadingPlan,
  WagonAllocation,
  ArrivalNotice,
  DamageRecord,
  HandoverRecord,
  StuckOrder,
} from '../types';

class Store {
  loadingPlans: Map<string, LoadingPlan> = new Map();
  wagonAllocations: Map<string, WagonAllocation> = new Map();
  arrivalNotices: Map<string, ArrivalNotice> = new Map();
  damageRecords: Map<string, DamageRecord> = new Map();
  handoverRecords: HandoverRecord[] = [];
  stuckOrders: Map<string, StuckOrder> = new Map();
  idempotencyKeys: Map<string, { entityType: string; entityId: string }> = new Map();

  generateId(): string {
    return uuidv4();
  }

  getLoadingPlansByPlanNo(planNo: string): LoadingPlan | undefined {
    for (const plan of this.loadingPlans.values()) {
      if (plan.planNo === planNo) return plan;
    }
    return undefined;
  }

  getAllocationsByPlanId(planId: string): WagonAllocation[] {
    const result: WagonAllocation[] = [];
    for (const alloc of this.wagonAllocations.values()) {
      if (alloc.loadingPlanId === planId) result.push(alloc);
    }
    return result;
  }

  getArrivalNoticesByPlanId(planId: string): ArrivalNotice[] {
    const result: ArrivalNotice[] = [];
    for (const notice of this.arrivalNotices.values()) {
      if (notice.loadingPlanId === planId) result.push(notice);
    }
    return result;
  }

  getDamageRecordsByPlanId(planId: string): DamageRecord[] {
    const result: DamageRecord[] = [];
    for (const rec of this.damageRecords.values()) {
      if (rec.loadingPlanId === planId) result.push(rec);
    }
    return result;
  }

  getHandoverRecords(entityType: string, entityId: string): HandoverRecord[] {
    return this.handoverRecords.filter(
      (r) => r.entityType === entityType && r.entityId === entityId
    );
  }

  getActiveStuckOrders(): StuckOrder[] {
    const result: StuckOrder[] = [];
    for (const stuck of this.stuckOrders.values()) {
      if (!stuck.resolvedAt) result.push(stuck);
    }
    return result;
  }

  getStuckOrdersByEntity(entityType: string, entityId: string): StuckOrder[] {
    const result: StuckOrder[] = [];
    for (const stuck of this.stuckOrders.values()) {
      if (stuck.entityType === entityType && stuck.entityId === entityId) result.push(stuck);
    }
    return result;
  }
}

export const store = new Store();
