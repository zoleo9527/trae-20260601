import { Injectable } from '@nestjs/common';
import { NotificationType } from '../common/enums';
import { InMemoryStore } from '../common/services/in-memory-store.service';

@Injectable()
export class NotificationService {
  constructor(private readonly store: InMemoryStore) {}

  notifyContractSubmitted(contractId: string, talentName: string) {
    return this.store.createNotification(
      NotificationType.CONTRACT_SUBMITTED,
      '新的签约申请待审核',
      `达人「${talentName}」的签约申请已提交，请及时审核`,
      'business',
      contractId,
      'contract',
    );
  }

  notifyContractRejected(contractId: string, talentName: string, reason: string) {
    return this.store.createNotification(
      NotificationType.CONTRACT_REJECTED,
      '签约申请被退回',
      `达人「${talentName}」的签约申请被退回，原因：${reason}`,
      'talent_agent',
      contractId,
      'contract',
    );
  }

  notifyContractApproved(contractId: string, talentName: string) {
    return this.store.createNotification(
      NotificationType.CONTRACT_APPROVED,
      '签约审核通过',
      `达人「${talentName}」的签约申请已通过，请及时完成档案建档`,
      'talent_agent',
      contractId,
      'contract',
    );
  }

  notifyArchiveNeeded(archiveId: string, talentName: string) {
    return this.store.createNotification(
      NotificationType.ARCHIVE_NEEDED,
      '待完善档案信息',
      `达人「${talentName}」的档案信息需要完善`,
      'talent_agent',
      archiveId,
      'archive',
    );
  }

  notifyScheduleConflict(talentName: string, brandName: string, conflictDate: Date) {
    return this.store.createNotification(
      NotificationType.SCHEDULE_CONFLICT,
      '排期冲突提醒',
      `达人「${talentName}」在「${brandName}」品牌合作中存在排期冲突，请及时处理`,
      'talent_agent',
      undefined,
      'brand_cooperation',
    );
  }

  notifyScriptOutOfSync(talentName: string, scriptTitle: string) {
    return this.store.createNotification(
      NotificationType.SCRIPT_OUT_OF_SYNC,
      '脚本版本未同步提醒',
      `达人「${talentName}」的脚本「${scriptTitle}」已修改但未同步，请确认`,
      'director',
      undefined,
      'script',
    );
  }

  notifyDataOverdue(talentName: string, brandName: string) {
    return this.store.createNotification(
      NotificationType.DATA_OVERDUE,
      '结案数据逾期未提交',
      `达人「${talentName}」与「${brandName}」的合作结案数据逾期未提交`,
      'business',
      undefined,
      'brand_cooperation',
    );
  }

  getNotificationsByRole(role: string) {
    return this.store.getNotificationsByRole(role);
  }

  markAsRead(id: string) {
    return this.store.markNotificationRead(id);
  }
}
