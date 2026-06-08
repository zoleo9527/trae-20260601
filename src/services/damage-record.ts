import { store } from '../store';
import { handoverService } from './handover';
import { stuckOrderService } from './stuck-order';
import {
  DamageRecord,
  RecordDamageRequest,
  HandoverAction,
  Role,
  WagonAllocationStatus,
} from '../types';

export class DamageRecordService {
  record(req: RecordDamageRequest): DamageRecord {
    const plan = store.loadingPlans.get(req.loadingPlanId);
    if (!plan) throw new Error(`装车计划 ${req.loadingPlanId} 不存在`);

    const alloc = store.wagonAllocations.get(req.wagonAllocationId);
    if (!alloc) throw new Error(`车皮分配 ${req.wagonAllocationId} 不存在`);

    const now = new Date().toISOString();
    const hasPhoto = !!(req.photoUrls && req.photoUrls.length > 0);

    const record: DamageRecord = {
      id: store.generateId(),
      loadingPlanId: req.loadingPlanId,
      wagonAllocationId: req.wagonAllocationId,
      reportedBy: req.reportedBy,
      reportedAt: now,
      damageType: req.damageType,
      damageDescription: req.damageDescription,
      hasPhoto,
      photoUrls: req.photoUrls || [],
      createdAt: now,
    };

    store.damageRecords.set(record.id, record);

    if (!hasPhoto) {
      if (alloc.status === WagonAllocationStatus.Confirmed || alloc.status === WagonAllocationStatus.Loaded) {
        alloc.status = WagonAllocationStatus.Pending;
      }
    }

    handoverService.record({
      entityType: 'damage_record',
      entityId: record.id,
      fromRole: Role.LoadingLeader,
      toRole: Role.CustomerService,
      fromUserId: req.reportedBy,
      toUserId: 'system',
      action: hasPhoto ? HandoverAction.Submit : HandoverAction.Alert,
      comment: hasPhoto
        ? `货损报告（含照片），类型：${req.damageType}`
        : `货损报告（缺少照片！），类型：${req.damageType}，流程已阻断，需补照片后方可继续`,
    });

    stuckOrderService.scanDamage(record.id);

    return record;
  }

  addPhotos(recordId: string, photoUrls: string[]): DamageRecord {
    const record = store.damageRecords.get(recordId);
    if (!record) throw new Error(`货损记录 ${recordId} 不存在`);

    record.photoUrls = [...record.photoUrls, ...photoUrls];
    record.hasPhoto = record.photoUrls.length > 0;

    if (record.hasPhoto) {
      const activeStuck = store.getStuckOrdersByEntity('damage_record', recordId);
      for (const s of activeStuck) {
        stuckOrderService.resolve(s.id, '已补充现场照片');
      }

      const alloc = store.wagonAllocations.get(record.wagonAllocationId);
      if (alloc && alloc.status === WagonAllocationStatus.Pending) {
        alloc.status = WagonAllocationStatus.Confirmed;
      }

      handoverService.record({
        entityType: 'damage_record',
        entityId: recordId,
        fromRole: Role.LoadingLeader,
        toRole: Role.CustomerService,
        fromUserId: record.reportedBy,
        toUserId: 'system',
        action: HandoverAction.Confirm,
        comment: `货损记录已补充 ${photoUrls.length} 张照片`,
      });
    }

    return record;
  }

  getById(recordId: string): DamageRecord | undefined {
    return store.damageRecords.get(recordId);
  }

  list(): DamageRecord[] {
    return Array.from(store.damageRecords.values());
  }

  getByPlanId(planId: string): DamageRecord[] {
    return store.getDamageRecordsByPlanId(planId);
  }
}

export const damageRecordService = new DamageRecordService();
