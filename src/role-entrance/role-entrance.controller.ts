import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MealType, OrderStatus, PurchaseStatus, SummaryStatus, UserRole } from '../common/enums';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { PurchaseService } from '../purchase/purchase.service';
import { SpecialMealService } from '../special-meal/special-meal.service';
import { StudentMealService } from '../student-meal/student-meal.service';
import { TimelineService } from '../timeline/timeline.service';

@ApiTags('role-entrance')
@Controller('role-entrance')
export class RoleEntranceController {
  constructor(
    private readonly studentMealService: StudentMealService,
    private readonly specialMealService: SpecialMealService,
    private readonly purchaseService: PurchaseService,
    private readonly timelineService: TimelineService,
    private readonly store: InMemoryStore
  ) {}

  @Get('class-teacher')
  @ApiOperation({ summary: '班主任工作台入口' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  classTeacherEntrance() {
    const today = '2026-06-06';
    const tomorrow = '2026-06-07';
    const classId = 'class-001';

    const tomorrowOrders = this.studentMealService.findAll({ date: tomorrow, classId });
    const pendingOrders = tomorrowOrders.filter(o => o.status === OrderStatus.PENDING);
    const specialOrders = tomorrowOrders.filter(o => o.mealType === 'special');
    const recentChanges = this.timelineService.getRecentChanges(10);

    const specialStudents = this.specialMealService.getAllSpecialStudents();
    const riskItems = this.extractTeacherRisks(specialStudents, tomorrowOrders);

    return {
      role: UserRole.CLASS_TEACHER,
      welcome: '班主任工作台 - 三年级2班',
      quickActions: [
        { key: 'confirm_orders', label: '确认明日订餐', path: '/student-meal/batch-confirm', method: 'POST' },
        { key: 'add_special_tag', label: '标记特殊餐', path: '/special-meal/tags', method: 'POST' },
        { key: 'view_special_review', label: '特殊餐回看', path: '/special-meal/student/:studentId/review', method: 'GET' },
        { key: 'report_exception', label: '上报异常', path: '/student-meal/:id/cancel', method: 'POST' },
      ],
      pendingTasks: {
        pendingOrders: {
          count: pendingOrders.length,
          items: pendingOrders.slice(0, 5).map(o => ({
            id: o.id,
            orderId: o.id,
            studentId: o.studentId,
            studentName: o.studentName,
            date: o.date,
            mealType: o.mealType,
            status: o.status,
            detailPath: `/student-meal/${o.id}/detail`,
            studentReviewPath: `/special-meal/student/${o.studentId}/review`,
          })),
        },
        specialToReview: specialOrders.slice(0, 3).map(o => ({
          id: o.id,
          orderId: o.id,
          studentId: o.studentId,
          studentName: o.studentName,
          specialTags: o.specialDietTag,
          detailPath: `/student-meal/${o.id}/detail`,
          studentReviewPath: `/special-meal/student/${o.studentId}/review`,
        })),
      },
      riskItems: [
        {
          type: 'multiple_tags',
          level: 'high',
          message: '赵小雨 连续3天标记特殊餐（清真+坚果过敏）',
          studentId: 'stu-004',
          studentName: '赵小雨',
          detailPath: '/special-meal/student/stu-004/review',
        },
        {
          type: 'tag_conflict',
          level: 'high',
          message: '刘小强 标签冲突：同时标记"高嘌呤"和"排骨汤"',
          studentId: 'stu-005',
          studentName: '刘小强',
          detailPath: '/special-meal/student/stu-005/review',
        },
      ],
      recentChanges: recentChanges.slice(0, 5).map(t => ({
        time: t.operateTime,
        operator: t.operatorName,
        action: t.action,
        detail: t.detail,
      })),
      stats: {
        tomorrowTotal: tomorrowOrders.length,
        tomorrowPending: pendingOrders.length,
        tomorrowSpecial: specialOrders.length,
        myClassStudents: this.store.getStudents().filter(s => s.classId === classId).length,
        specialStudentsCount: specialStudents.filter(s => s.classId === classId).length,
      },
    };
  }

  @Get('canteen-admin')
  @ApiOperation({ summary: '食堂管理员工作台入口' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  canteenAdminEntrance() {
    const today = '2026-06-06';
    const tomorrow = '2026-06-07';

    const todayStats = this.studentMealService.getStats(today);
    const tomorrowSummary = this.purchaseService.getSummary(tomorrow);
    const samples = this.store.getSampleRecords().filter(r => r.date === today);
    const recentChanges = this.timelineService.getRecentChanges(10);
    const specialStudents = this.specialMealService.getAllSpecialStudents();

    const pendingSummary = tomorrowSummary.status === SummaryStatus.DRAFT;
    const pendingSample = samples.length < 2;

    const pendingServeOrders = this.studentMealService
      .findAll({ date: today, status: OrderStatus.CONFIRMED })
      .slice(0, 8);

    const specialTodayOrders = this.studentMealService
      .findAll({ date: today })
      .filter(o => o.mealType === MealType.SPECIAL && o.status !== OrderStatus.CANCELLED)
      .slice(0, 6);

    return {
      role: UserRole.CANTEEN_ADMIN,
      welcome: '食堂管理员工作台',
      quickActions: [
        { key: 'confirm_summary', label: '确认订餐汇总', path: '/purchase/summary/:date/confirm', method: 'POST' },
        { key: 'mark_served', label: '标记配餐完成', path: '/student-meal/:id/serve', method: 'POST' },
        { key: 'record_sample', label: '录入留样记录', path: '/sample', method: 'POST' },
        { key: 'view_special_list', label: '特殊餐清单', path: '/special-meal/students/all', method: 'GET' },
      ],
      pendingTasks: {
        summaryToConfirm: pendingSummary
          ? {
              date: tomorrow,
              total: tomorrowSummary.totalCount,
              special: tomorrowSummary.specialCount,
              detailPath: `/purchase/summary/${tomorrow}`,
            }
          : null,
        sampleToRecord: pendingSample
          ? [{ mealType: 'dinner', label: '晚餐留样待录入', detailPath: '/sample' }]
          : [],
        ordersToServe: pendingServeOrders.map(o => ({
          id: o.id,
          orderId: o.id,
          studentId: o.studentId,
          studentName: o.studentName,
          className: o.className,
          mealType: o.mealType,
          specialTags: o.specialDietTag,
          detailPath: `/student-meal/${o.id}/detail`,
          studentReviewPath: `/special-meal/student/${o.studentId}/review`,
        })),
        specialMealToday: specialTodayOrders.map(o => ({
          id: o.id,
          orderId: o.id,
          studentId: o.studentId,
          studentName: o.studentName,
          className: o.className,
          specialTags: o.specialDietTag,
          detailPath: `/student-meal/${o.id}/detail`,
          studentReviewPath: `/special-meal/student/${o.studentId}/review`,
        })),
      },
      riskItems: [
        {
          type: 'special_ratio',
          level: 'medium',
          message: '三年级特殊餐占比15%（均值8%），建议关注',
        },
        {
          type: 'purchase_pending',
          level: 'medium',
          message: '明日食材采购还未确认到货',
        },
      ],
      recentChanges: recentChanges.slice(0, 5).map(t => ({
        time: t.operateTime,
        operator: t.operatorName,
        action: t.action,
        detail: t.detail,
      })),
      todayOverview: {
        ...todayStats,
        servingProgress: Math.round((todayStats.served / todayStats.total) * 100),
        sampleProgress: Math.round((samples.length / 2) * 100),
      },
      stats: {
        totalStudents: this.store.getStudents().length,
        specialStudentsCount: specialStudents.length,
        todayOrders: todayStats.total,
        pendingPurchase: this.store.getPurchaseOrders().filter(o => o.status !== PurchaseStatus.RECEIVED).length,
      },
    };
  }

  @Get('purchaser')
  @ApiOperation({ summary: '采购员工作台入口' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  purchaserEntrance() {
    const today = '2026-06-06';
    const tomorrow = '2026-06-07';

    const purchaseOrders = this.purchaseService.findAllPurchaseOrders();
    const pendingReceive = purchaseOrders.filter(o => o.status === PurchaseStatus.SUBMITTED);
    const recentChanges = this.timelineService.getRecentChanges(10);

    const tomorrowPurchase = purchaseOrders.find(o => o.date === tomorrow);
    const tomorrowSummary = this.store.getMealSummary(tomorrow);
    const needGenerate = !tomorrowPurchase && tomorrowSummary?.status === SummaryStatus.CONFIRMED;
    const summaryReady = tomorrowSummary?.status === SummaryStatus.CONFIRMED;

    return {
      role: UserRole.PURCHASER,
      welcome: '采购员工作台',
      quickActions: [
        { key: 'generate_purchase', label: '生成采购单', path: '/purchase/orders/generate', method: 'POST' },
        { key: 'submit_purchase', label: '提交采购单', path: '/purchase/orders/:id/submit', method: 'POST' },
        { key: 'confirm_receive', label: '确认到货', path: '/purchase/orders/:id/receive', method: 'POST' },
        { key: 'view_stats', label: '采购统计', path: '/purchase/orders', method: 'GET' },
      ],
      pendingTasks: {
        toReceive: pendingReceive.map(o => ({
          id: o.id,
          orderNo: o.orderNo,
          date: o.date,
          itemCount: o.items.length,
        })),
        toGenerate: needGenerate
          ? [{ date: tomorrow, summaryStatus: 'confirmed' }]
          : summaryReady
          ? []
          : [{ date: tomorrow, summaryStatus: 'pending' }],
      },
      recentChanges: recentChanges.slice(0, 5).map(t => ({
        time: t.operateTime,
        operator: t.operatorName,
        action: t.action,
        detail: t.detail,
      })),
      recentPurchases: purchaseOrders.slice(0, 5).map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        date: o.date,
        status: o.status,
        itemCount: o.items.length,
      })),
      stats: {
        totalPurchase: purchaseOrders.length,
        pendingSubmit: purchaseOrders.filter(o => o.status === PurchaseStatus.DRAFT).length,
        pendingReceive: pendingReceive.length,
        completed: purchaseOrders.filter(o => o.status === PurchaseStatus.RECEIVED).length,
      },
    };
  }

  @Get('users')
  @ApiOperation({ summary: '获取所有测试用户（用于切换角色）' })
  getUsers() {
    return this.store.getUsers();
  }

  private extractTeacherRisks(specialStudents: any[], orders: any[]) {
    const risks = [];
    for (const s of specialStudents) {
      if (s.tagCount >= 2) {
        risks.push({
          type: 'multiple_tags',
          level: 'medium',
          message: `${s.studentName} 有${s.tagCount}项特殊餐标记，配餐需注意`,
        });
      }
    }
    return risks.slice(0, 3);
  }
}
