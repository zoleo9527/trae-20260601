import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MealType, OrderStatus, TimelineBusinessType } from '../common/enums';
import { ClassInfo, Student, User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { BatchConfirmOrderDto, BatchCreateOrderDto, CreateOrderDto, StudentMealOrder } from './interfaces/student-meal.interface';

@Injectable()
export class StudentMealService {
  constructor(private readonly store: InMemoryStore) {}

  findAll(params?: { date?: string; classId?: string; status?: OrderStatus; studentId?: string }): StudentMealOrder[] {
    let orders = this.store.getMealOrders();
    if (params?.date) {
      orders = orders.filter(o => o.date === params.date);
    }
    if (params?.classId) {
      orders = orders.filter(o => o.classId === params.classId);
    }
    if (params?.status) {
      orders = orders.filter(o => o.status === params.status);
    }
    if (params?.studentId) {
      orders = orders.filter(o => o.studentId === params.studentId);
    }
    return orders.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  }

  findOne(id: string): StudentMealOrder {
    const order = this.store.getMealOrder(id);
    if (!order) {
      throw new NotFoundException('订餐记录不存在');
    }
    return order;
  }

  create(dto: CreateOrderDto, operator: User): StudentMealOrder {
    const student = this.store.getStudent(dto.studentId);
    if (!student) {
      throw new BadRequestException('学生不存在');
    }

    const existing = this.store.getMealOrders().find(
      o => o.date === dto.date && o.studentId === dto.studentId && o.status !== OrderStatus.CANCELLED
    );
    if (existing) {
      throw new BadRequestException('该学生当日已有有效订餐');
    }

    const order: StudentMealOrder = {
      id: this.store.generateId(),
      date: dto.date,
      studentId: dto.studentId,
      studentName: student.name,
      classId: student.classId,
      className: student.className,
      status: OrderStatus.PENDING,
      mealType: dto.mealType,
      specialDietTag: dto.specialDietTag || [],
      remark: dto.remark,
      createTime: new Date(),
      updateTime: new Date(),
      createBy: operator.id,
      createByName: operator.name,
    };

    this.store.saveMealOrder(order);
    this.store.createTimeline(TimelineBusinessType.ORDER, order.id, '创建订餐', operator, {
      date: order.date,
      mealType: order.mealType,
    });

    return order;
  }

  batchCreate(dto: BatchCreateOrderDto, operator: User): { count: number; orders: StudentMealOrder[] } {
    const created: StudentMealOrder[] = [];
    for (const item of dto.orders) {
      try {
        const order = this.create(
          {
            date: dto.date,
            studentId: item.studentId,
            mealType: item.mealType,
            specialDietTag: item.specialDietTag,
            remark: item.remark,
          },
          operator
        );
        created.push(order);
      } catch (e) {
        // 跳过已存在的
      }
    }
    return { count: created.length, orders: created };
  }

  confirm(id: string, operator: User): StudentMealOrder {
    const order = this.findOne(id);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只有待确认状态的订餐才能确认');
    }
    const previousState = { status: order.status };
    order.status = OrderStatus.CONFIRMED;
    order.updateTime = new Date();
    this.store.saveMealOrder(order);
    this.store.createTimeline(TimelineBusinessType.ORDER, order.id, '确认订餐', operator, {
      from: previousState.status,
      to: order.status,
    });
    return order;
  }

  batchConfirm(dto: BatchConfirmOrderDto, operator: User): { count: number } {
    let count = 0;
    for (const id of dto.orderIds) {
      try {
        this.confirm(id, operator);
        count++;
      } catch (e) {
        // 跳过不能确认的
      }
    }
    return { count };
  }

  cancel(id: string, reason: string, operator: User): StudentMealOrder {
    const order = this.findOne(id);
    if (order.status === OrderStatus.SERVED) {
      throw new BadRequestException('已配餐的订餐不能取消');
    }
    const previousState = { status: order.status };
    order.status = OrderStatus.CANCELLED;
    order.updateTime = new Date();
    this.store.saveMealOrder(order);
    this.store.createTimeline(TimelineBusinessType.ORDER, order.id, '取消订餐', operator, {
      from: previousState.status,
      to: order.status,
      reason,
    });
    return order;
  }

  markServed(id: string, operator: User): StudentMealOrder {
    const order = this.findOne(id);
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('只有已确认状态的订餐才能标记为已配餐');
    }
    const previousState = { status: order.status };
    order.status = OrderStatus.SERVED;
    order.updateTime = new Date();
    this.store.saveMealOrder(order);
    this.store.createTimeline(TimelineBusinessType.ORDER, order.id, '标记已配餐', operator, {
      from: previousState.status,
      to: order.status,
    });
    return order;
  }

  getStats(date: string, classId?: string) {
    const orders = this.findAll({ date, classId });
    return {
      date,
      total: orders.length,
      pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
      confirmed: orders.filter(o => o.status === OrderStatus.CONFIRMED).length,
      cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
      served: orders.filter(o => o.status === OrderStatus.SERVED).length,
      normalMeal: orders.filter(o => o.mealType === MealType.NORMAL).length,
      specialMeal: orders.filter(o => o.mealType === MealType.SPECIAL).length,
    };
  }

  getStudentsByClass(classId: string): Student[] {
    return this.store.getStudents().filter(s => s.classId === classId);
  }

  getAllClasses(): ClassInfo[] {
    return this.store.getClasses();
  }
}
