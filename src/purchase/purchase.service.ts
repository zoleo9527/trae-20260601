import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MealType, PurchaseStatus, SummaryStatus, TimelineBusinessType } from '../common/enums';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { StudentMealService } from '../student-meal/student-meal.service';
import { GeneratePurchaseDto, MealSummary, PurchaseOrder } from './interfaces/purchase.interface';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly studentMealService: StudentMealService
  ) {}

  getSummary(date: string): MealSummary {
    let summary = this.store.getMealSummary(date);
    if (!summary) {
      summary = this.generateSummary(date);
    }
    return summary;
  }

  private generateSummary(date: string): MealSummary {
    const orders = this.studentMealService.findAll({ date });
    const classMap = new Map<string, { name: string; count: number; specialCount: number }>();

    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      if (!classMap.has(order.classId)) {
        classMap.set(order.classId, { name: order.className, count: 0, specialCount: 0 });
      }
      const cls = classMap.get(order.classId)!;
      cls.count++;
      if (order.mealType === MealType.SPECIAL) {
        cls.specialCount++;
      }
    }

    const classBreakdown = Array.from(classMap.entries()).map(([classId, data]) => ({
      classId,
      className: data.name,
      count: data.count,
      specialCount: data.specialCount,
    }));

    const totalCount = orders.filter(o => o.status !== 'cancelled').length;
    const specialCount = orders.filter(o => o.status !== 'cancelled' && o.mealType === MealType.SPECIAL).length;

    const summary: MealSummary = {
      id: this.store.generateId(),
      date,
      totalCount,
      normalCount: totalCount - specialCount,
      specialCount,
      classBreakdown,
      status: SummaryStatus.DRAFT,
      createTime: new Date(),
      updateTime: new Date(),
    };

    this.store.saveMealSummary(summary);
    return summary;
  }

  confirmSummary(date: string, operator: User): MealSummary {
    const summary = this.getSummary(date);
    if (summary.status !== SummaryStatus.DRAFT) {
      throw new BadRequestException('汇总已确认，不能重复确认');
    }

    summary.status = SummaryStatus.CONFIRMED;
    summary.confirmTime = new Date();
    summary.confirmBy = operator.id;
    summary.confirmByName = operator.name;
    summary.updateTime = new Date();
    this.store.saveMealSummary(summary);

    this.store.createTimeline(TimelineBusinessType.SUMMARY, summary.id, '确认订餐汇总', operator, {
      date,
      totalCount: summary.totalCount,
      specialCount: summary.specialCount,
    });

    return summary;
  }

  findAllPurchaseOrders(params?: { date?: string; status?: PurchaseStatus }): PurchaseOrder[] {
    let orders = this.store.getPurchaseOrders();
    if (params?.date) {
      orders = orders.filter(o => o.date === params.date);
    }
    if (params?.status) {
      orders = orders.filter(o => o.status === params.status);
    }
    return orders.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }

  findOnePurchaseOrder(id: string): PurchaseOrder {
    const order = this.store.getPurchaseOrder(id);
    if (!order) {
      throw new NotFoundException('采购单不存在');
    }
    return order;
  }

  generatePurchaseOrder(dto: GeneratePurchaseDto, operator: User): PurchaseOrder {
    const summary = this.getSummary(dto.date);
    if (summary.status !== SummaryStatus.CONFIRMED) {
      throw new BadRequestException('请先确认订餐汇总后再生成采购单');
    }

    const existing = this.store.getPurchaseOrders().find(o => o.date === dto.date);
    if (existing) {
      throw new BadRequestException('该日期的采购单已存在');
    }

    const items = this.calculateIngredients(summary);

    const order: PurchaseOrder = {
      id: this.store.generateId(),
      orderNo: `CG${dto.date.replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      date: dto.date,
      summaryId: summary.id,
      items,
      status: PurchaseStatus.DRAFT,
      createTime: new Date(),
      updateTime: new Date(),
      createBy: operator.id,
      createByName: operator.name,
    };

    this.store.savePurchaseOrder(order);

    this.store.createTimeline(TimelineBusinessType.PURCHASE, order.id, '生成采购单', operator, {
      date: dto.date,
      itemCount: items.length,
    });

    return order;
  }

  private calculateIngredients(summary: MealSummary) {
    const perPerson = {
      rice: { quantity: 150, unit: 'g' },
      vegetables: { quantity: 200, unit: 'g' },
      meat: { quantity: 100, unit: 'g' },
      egg: { quantity: 50, unit: 'g' },
      oil: { quantity: 15, unit: 'g' },
      salt: { quantity: 3, unit: 'g' },
    };

    const specialExtra = {
      vegetables: { quantity: 50, unit: 'g' },
      meat: { quantity: 30, unit: 'g' },
    };

    const items = [];
    for (const [key, val] of Object.entries(perPerson)) {
      let quantity = val.quantity * summary.normalCount;
      if (specialExtra[key]) {
        quantity += specialExtra[key].quantity * summary.specialCount;
      }
      items.push({
        ingredient: this.getIngredientName(key),
        quantity: Math.ceil(quantity / 1000 * 10) / 10,
        unit: 'kg',
      });
    }

    return items;
  }

  private getIngredientName(key: string): string {
    const names: Record<string, string> = {
      rice: '大米',
      vegetables: '蔬菜',
      meat: '肉类',
      egg: '鸡蛋',
      oil: '食用油',
      salt: '食盐',
    };
    return names[key] || key;
  }

  submitPurchaseOrder(id: string, operator: User): PurchaseOrder {
    const order = this.findOnePurchaseOrder(id);
    if (order.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的采购单才能提交');
    }

    order.status = PurchaseStatus.SUBMITTED;
    order.submitTime = new Date();
    order.updateTime = new Date();
    this.store.savePurchaseOrder(order);

    this.store.createTimeline(TimelineBusinessType.PURCHASE, order.id, '提交采购单', operator, {
      orderNo: order.orderNo,
    });

    return order;
  }

  confirmReceive(id: string, operator: User): PurchaseOrder {
    const order = this.findOnePurchaseOrder(id);
    if (order.status !== PurchaseStatus.SUBMITTED) {
      throw new BadRequestException('只有已提交的采购单才能确认到货');
    }

    order.status = PurchaseStatus.RECEIVED;
    order.receiveTime = new Date();
    order.updateTime = new Date();
    this.store.savePurchaseOrder(order);

    this.store.createTimeline(TimelineBusinessType.PURCHASE, order.id, '确认采购到货', operator, {
      orderNo: order.orderNo,
    });

    return order;
  }
}
