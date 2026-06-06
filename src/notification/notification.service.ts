import { Injectable } from '@nestjs/common';
import { NotificationType, UserRole } from '../common/enums';
import { InMemoryStore } from '../common/services/in-memory-store.service';

@Injectable()
export class NotificationService {
  constructor(private readonly store: InMemoryStore) {}

  notifyOrderCreated(date: string, className: string, count: number) {
    return this.store.createNotification(
      NotificationType.ORDER_CREATED,
      '新的订餐申请已提交',
      `${className} 已提交 ${date} 的订餐，共 ${count} 份`,
      UserRole.CANTEEN_ADMIN,
      undefined,
      'order'
    );
  }

  notifySummaryConfirmed(date: string, totalCount: number) {
    return this.store.createNotification(
      NotificationType.SUMMARY_CONFIRMED,
      '订餐汇总已确认',
      `${date} 的订餐汇总已确认，总计 ${totalCount} 份`,
      UserRole.PURCHASER,
      undefined,
      'summary'
    );
  }

  notifySpecialTagAdded(studentName: string, tagContent: string) {
    return this.store.createNotification(
      NotificationType.SPECIAL_TAG_ADDED,
      '新的特殊餐标记',
      `学生「${studentName}」新增特殊餐标记：${tagContent}`,
      UserRole.CANTEEN_ADMIN,
      undefined,
      'special_tag'
    );
  }

  notifySpecialTagRisk(studentName: string, riskMessage: string) {
    return this.store.createNotification(
      NotificationType.SPECIAL_TAG_RISK,
      '特殊餐风险提醒',
      `学生「${studentName}」存在风险：${riskMessage}`,
      UserRole.CLASS_TEACHER,
      undefined,
      'special_tag'
    );
  }

  notifyPurchaseCreated(orderNo: string, date: string) {
    return this.store.createNotification(
      NotificationType.PURCHASE_CREATED,
      '采购单已生成',
      `${date} 的采购单 ${orderNo} 已生成，请确认`,
      UserRole.PURCHASER,
      undefined,
      'purchase'
    );
  }

  notifySamplePending(date: string, mealType: string) {
    return this.store.createNotification(
      NotificationType.SAMPLE_PENDING,
      '留样记录待录入',
      `${date} 的${mealType === 'lunch' ? '午餐' : '晚餐'}留样还未录入`,
      UserRole.CANTEEN_ADMIN,
      undefined,
      'sample'
    );
  }

  getNotificationsByRole(role: string) {
    return this.store.getNotificationsByRole(role);
  }

  markAsRead(id: string) {
    return this.store.markNotificationRead(id);
  }
}
