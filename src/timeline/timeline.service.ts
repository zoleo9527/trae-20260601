import { Injectable } from '@nestjs/common';
import { TimelineBusinessType } from '../common/enums';
import { OperationTimeline } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';

@Injectable()
export class TimelineService {
  constructor(private readonly store: InMemoryStore) {}

  getOrderTimeline(orderId: string): OperationTimeline[] {
    return this.store
      .getTimelines()
      .filter(
        t =>
          (t.businessType === TimelineBusinessType.ORDER && t.businessId === orderId) ||
          (t.businessType === TimelineBusinessType.SPECIAL_TAG && t.detail?.orderId === orderId)
      )
      .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
  }

  getStudentTimeline(studentId: string, days: number = 30): OperationTimeline[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const orderIds = new Set(
      this.store
        .getMealOrders()
        .filter(o => o.studentId === studentId)
        .map(o => o.id)
    );

    return this.store
      .getTimelines()
      .filter(t => {
        if (new Date(t.operateTime) < cutoff) return false;
        if (t.detail?.studentId === studentId) return true;
        if (t.businessType === TimelineBusinessType.ORDER && orderIds.has(t.businessId)) return true;
        if (t.businessType === TimelineBusinessType.SPECIAL_TAG && t.detail?.studentId === studentId) return true;
        return false;
      })
      .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
  }

  getTimelineByBusiness(
    businessType: TimelineBusinessType,
    businessId: string
  ): OperationTimeline[] {
    return this.store
      .getTimelines()
      .filter(t => t.businessType === businessType && t.businessId === businessId)
      .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
  }

  getRecentChanges(limit: number = 10): OperationTimeline[] {
    return this.store
      .getTimelines()
      .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime())
      .slice(0, limit);
  }
}
