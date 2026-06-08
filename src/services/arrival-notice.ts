import { store } from '../store';
import { handoverService } from './handover';
import { stuckOrderService } from './stuck-order';
import {
  ArrivalNotice,
  ArrivalPickupStatus,
  RecordArrivalRequest,
  HandoverAction,
  Role,
} from '../types';

export class ArrivalNoticeService {
  recordArrival(req: RecordArrivalRequest): ArrivalNotice {
    const plan = store.loadingPlans.get(req.loadingPlanId);
    if (!plan) throw new Error(`装车计划 ${req.loadingPlanId} 不存在`);

    const alloc = store.wagonAllocations.get(req.wagonAllocationId);
    if (!alloc) throw new Error(`车皮分配 ${req.wagonAllocationId} 不存在`);

    if (alloc.status !== 'confirmed' && alloc.status !== 'loaded') {
      throw new Error(`车皮分配状态 ${alloc.status} 不可录入到达通知`);
    }

    const now = new Date().toISOString();
    const notice: ArrivalNotice = {
      id: store.generateId(),
      noticeNo: `AN-${Date.now()}`,
      loadingPlanId: req.loadingPlanId,
      wagonAllocationId: req.wagonAllocationId,
      arrivalDate: req.arrivalDate,
      pickupStatus: ArrivalPickupStatus.Notified,
      consigneeName: req.consigneeName,
      consigneePhone: req.consigneePhone,
      consigneeNotifiedAt: now,
      unclaimedSince: null,
      createdAt: now,
    };

    store.arrivalNotices.set(notice.id, notice);

    handoverService.record({
      entityType: 'arrival_notice',
      entityId: notice.id,
      fromRole: Role.LoadingLeader,
      toRole: Role.CustomerService,
      fromUserId: alloc.confirmedBy || 'system',
      toUserId: 'system',
      action: HandoverAction.Submit,
      comment: `货物到达，已通知收货人 ${req.consigneeName}（${req.consigneePhone}）`,
    });

    stuckOrderService.scanArrival(notice.id);

    return notice;
  }

  markPickedUp(noticeId: string, operatorId: string): ArrivalNotice {
    const notice = store.arrivalNotices.get(noticeId);
    if (!notice) throw new Error(`到达通知 ${noticeId} 不存在`);

    notice.pickupStatus = ArrivalPickupStatus.PickedUp;

    const activeStuck = store.getStuckOrdersByEntity('arrival_notice', noticeId);
    for (const s of activeStuck) {
      stuckOrderService.resolve(s.id, `收货人已提货，操作人：${operatorId}`);
    }

    handoverService.record({
      entityType: 'arrival_notice',
      entityId: noticeId,
      fromRole: Role.CustomerService,
      toRole: Role.CustomerService,
      fromUserId: operatorId,
      toUserId: operatorId,
      action: HandoverAction.Confirm,
      comment: `收货人 ${notice.consigneeName} 已提货`,
    });

    return notice;
  }

  getById(noticeId: string): ArrivalNotice | undefined {
    return store.arrivalNotices.get(noticeId);
  }

  list(): ArrivalNotice[] {
    return Array.from(store.arrivalNotices.values());
  }

  getByPlanId(planId: string): ArrivalNotice[] {
    return store.getArrivalNoticesByPlanId(planId);
  }
}

export const arrivalNoticeService = new ArrivalNoticeService();
