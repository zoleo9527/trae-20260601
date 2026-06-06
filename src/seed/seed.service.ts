import { Injectable } from '@nestjs/common';
import { MealType, OrderStatus, PurchaseStatus, SampleMealType, SpecialTagStatus, SpecialTagType, SummaryStatus, TimelineBusinessType, UserRole } from '../common/enums';
import { ClassInfo, Student, User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { MealSummary, PurchaseOrder } from '../purchase/interfaces/purchase.interface';
import { SampleRecord } from '../sample/interfaces/sample.interface';
import { SpecialMealTag, SpecialTagLog } from '../special-meal/interfaces/special-meal.interface';
import { StudentMealOrder } from '../student-meal/interfaces/student-meal.interface';

@Injectable()
export class SeedService {
  constructor(private readonly store: InMemoryStore) {}

  private createUser(id: string, name: string, role: UserRole, email: string, classId?: string, className?: string): User {
    const user: User = { id, name, role, email, phone: '13800138000', classId, className };
    this.store.saveUser(user);
    return user;
  }

  private createClass(id: string, name: string, grade: string, teacherId: string, teacherName: string): ClassInfo {
    const cls: ClassInfo = { id, name, grade, teacherId, teacherName };
    this.store.saveClass(cls);
    return cls;
  }

  private createStudent(id: string, name: string, studentNo: string, classId: string, className: string): Student {
    const student: Student = { id, name, studentNo, classId, className };
    this.store.saveStudent(student);
    return student;
  }

  async seed() {
    this.store.clearAll();

    const teacherUser = this.createUser('teacher-001', '王老师', UserRole.CLASS_TEACHER, 'wang@school.com', 'class-001', '三年级2班');
    const canteenUser = this.createUser('admin-001', '张管理员', UserRole.CANTEEN_ADMIN, 'canteen@school.com');
    const purchaserUser = this.createUser('purchaser-001', '李采购', UserRole.PURCHASER, 'purchase@school.com');
    const adminUser = this.createUser('admin-root', '系统管理员', UserRole.ADMIN, 'admin@school.com');

    const class1 = this.createClass('class-001', '三年级2班', '三年级', teacherUser.id, teacherUser.name);
    const class2 = this.createClass('class-002', '三年级1班', '三年级', 'teacher-002', '李老师');
    const class3 = this.createClass('class-003', '四年级1班', '四年级', 'teacher-003', '张老师');

    const students: Student[] = [];
    const studentNames = ['张小明', '李小红', '王小刚', '赵小雨', '刘小强', '陈小燕', '杨大壮', '周小美', '吴小天', '郑小琳', '孙小龙', '钱小燕', '冯小伟', '刘小芳', '陈小龙', '杨小燕', '黄小刚', '赵小美', '周小强', '吴小燕', '郑小伟', '王小芳', '李小刚', '张小燕', '刘小伟', '陈小芳', '杨小龙', '黄小燕', '赵小刚', '周小美'];

    for (let i = 0; i < 30; i++) {
      const id = `stu-${String(i + 1).padStart(3, '0')}`;
      const student = this.createStudent(id, studentNames[i], `202302${String(i + 1).padStart(2, '0')}`, class1.id, class1.name);
      students.push(student);
    }

    const today = '2026-06-06';
    const tomorrow = '2026-06-07';

    this.createSpecialTag('tag-001', students[0].id, students[0].name, SpecialTagType.ALLERGY, '花生过敏', '🥜花生过敏', true, null, teacherUser, '校医确诊');
    this.createSpecialTag('tag-002', students[0].id, students[0].name, SpecialTagType.HEALTH, '乳糖不耐受', '🥛乳糖不耐受', false, '2026-06-15', teacherUser, '近期肠胃不适');
    this.createSpecialTag('tag-003', students[3].id, students[3].name, SpecialTagType.RELIGION, '清真', '☪️清真', true, null, teacherUser, '回族');
    this.createSpecialTag('tag-004', students[3].id, students[3].name, SpecialTagType.ALLERGY, '坚果过敏', '🌰坚果过敏', true, null, teacherUser, '校医确诊');
    this.createSpecialTag('tag-005', students[4].id, students[4].name, SpecialTagType.HEALTH, '高嘌呤', '⚠️高嘌呤', false, '2026-07-01', teacherUser, '尿酸偏高');
    this.createSpecialTag('tag-006', students[4].id, students[4].name, SpecialTagType.OTHER, '排骨汤', '🍖排骨汤', false, '2026-06-10', teacherUser, '家属要求');

    const specialStudentIds = new Set([0, 3, 4]);

    for (let i = 0; i < 30; i++) {
      const student = students[i];
      const isSpecial = specialStudentIds.has(i);
      let status: OrderStatus;

      if (i === 4) {
        status = OrderStatus.CANCELLED;
      } else if (i < 5) {
        status = i % 2 === 0 ? OrderStatus.SERVED : OrderStatus.CONFIRMED;
      } else if (i < 20) {
        status = OrderStatus.CONFIRMED;
      } else if (i < 25) {
        status = OrderStatus.SERVED;
      } else {
        status = OrderStatus.PENDING;
      }

      const orderId = `order-today-${String(i + 1).padStart(3, '0')}`;
      const tags = isSpecial ? this.getStudentTagContents(student.id) : undefined;

      this.createMealOrder(orderId, today, student, isSpecial ? MealType.SPECIAL : MealType.NORMAL, status, teacherUser, tags);

      if (status !== OrderStatus.CANCELLED) {
        this.store.createTimeline(
          TimelineBusinessType.ORDER,
          orderId,
          '创建订餐',
          teacherUser as any,
          { date: today, mealType: isSpecial ? MealType.SPECIAL : MealType.NORMAL, studentId: student.id }
        );

        if (status === OrderStatus.CONFIRMED || status === OrderStatus.SERVED) {
          this.store.createTimeline(
            TimelineBusinessType.ORDER,
            orderId,
            '确认订餐',
            teacherUser as any,
            { from: OrderStatus.PENDING, to: OrderStatus.CONFIRMED, studentId: student.id }
          );
        }

        if (status === OrderStatus.SERVED) {
          this.store.createTimeline(
            TimelineBusinessType.ORDER,
            orderId,
            '标记已配餐',
            canteenUser as any,
            { from: OrderStatus.CONFIRMED, to: OrderStatus.SERVED, studentId: student.id }
          );
        }
      }
    }

    for (let i = 0; i < 28; i++) {
      const student = students[i];
      const isSpecial = specialStudentIds.has(i);
      const status = i === 2 ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

      const orderId = `order-tomorrow-${String(i + 1).padStart(3, '0')}`;
      const tags = isSpecial ? this.getStudentTagContents(student.id) : undefined;

      this.createMealOrder(orderId, tomorrow, student, isSpecial ? MealType.SPECIAL : MealType.NORMAL, status, teacherUser, tags);

      this.store.createTimeline(
        TimelineBusinessType.ORDER,
        orderId,
        '创建订餐',
        teacherUser as any,
        { date: tomorrow, mealType: isSpecial ? MealType.SPECIAL : MealType.NORMAL, studentId: student.id }
      );

      if (status === OrderStatus.CONFIRMED) {
        this.store.createTimeline(
          TimelineBusinessType.ORDER,
          orderId,
          '确认订餐',
          teacherUser as any,
          { from: OrderStatus.PENDING, to: OrderStatus.CONFIRMED, studentId: student.id }
        );
      }
    }

    const todayOrders = this.store.getMealOrders().filter(o => o.date === today && o.status !== OrderStatus.CANCELLED);
    const specialCountToday = todayOrders.filter(o => o.mealType === MealType.SPECIAL).length;

    const classBreakdown = [
      { classId: class1.id, className: class1.name, count: todayOrders.length, specialCount: specialCountToday },
      { classId: class2.id, className: class2.name, count: 32, specialCount: 3 },
      { classId: class3.id, className: class3.name, count: 30, specialCount: 4 },
    ];

    const totalAll = classBreakdown.reduce((sum, c) => sum + c.count, 0);
    const specialAll = classBreakdown.reduce((sum, c) => sum + c.specialCount, 0);

    const summaryToday: MealSummary = {
      id: 'summary-today',
      date: today,
      totalCount: totalAll,
      normalCount: totalAll - specialAll,
      specialCount: specialAll,
      classBreakdown,
      status: SummaryStatus.CONFIRMED,
      confirmTime: new Date(),
      confirmBy: canteenUser.id,
      confirmByName: canteenUser.name,
      createTime: new Date(),
      updateTime: new Date(),
    };
    this.store.saveMealSummary(summaryToday);

    this.store.createTimeline(
      TimelineBusinessType.SUMMARY,
      'summary-today',
      '确认订餐汇总',
      canteenUser as any,
      { date: today, totalCount: totalAll, specialCount: specialAll }
    );

    const purchaseToday: PurchaseOrder = {
      id: 'purchase-today',
      orderNo: 'CG20260606001',
      date: today,
      summaryId: summaryToday.id,
      items: this.calculateIngredients(totalAll, specialAll),
      status: PurchaseStatus.RECEIVED,
      createTime: new Date(Date.now() - 86400000),
      updateTime: new Date(),
      submitTime: new Date(Date.now() - 82800000),
      receiveTime: new Date(Date.now() - 43200000),
      createBy: purchaserUser.id,
      createByName: purchaserUser.name,
    };
    this.store.savePurchaseOrder(purchaseToday);

    this.store.createTimeline(
      TimelineBusinessType.PURCHASE,
      'purchase-today',
      '生成采购单',
      purchaserUser as any,
      { date: today, itemCount: purchaseToday.items.length }
    );
    this.store.createTimeline(
      TimelineBusinessType.PURCHASE,
      'purchase-today',
      '提交采购单',
      purchaserUser as any,
      { orderNo: 'CG20260606001' }
    );
    this.store.createTimeline(
      TimelineBusinessType.PURCHASE,
      'purchase-today',
      '确认采购到货',
      purchaserUser as any,
      { orderNo: 'CG20260606001' }
    );

    const sampleLunch: SampleRecord = {
      id: 'sample-lunch-today',
      date: today,
      mealType: SampleMealType.LUNCH,
      dishes: ['红烧肉', '清炒时蔬', '番茄炒蛋', '紫菜蛋花汤'],
      specialDishes: ['清真牛肉饭', '无花生过敏套餐'],
      sampleTime: new Date(Date.now() - 14400000),
      operatorId: canteenUser.id,
      operatorName: canteenUser.name,
      expireTime: new Date(Date.now() + 172800000),
      storageLocation: 'A区留样柜-03层',
      createTime: new Date(),
    };
    this.store.saveSampleRecord(sampleLunch);

    this.store.createTimeline(
      TimelineBusinessType.SAMPLE,
      'sample-lunch-today',
      '录入留样记录',
      canteenUser as any,
      { date: today, mealType: SampleMealType.LUNCH, dishCount: 4 }
    );

    return {
      message: '学校食堂系统种子数据初始化完成（非满状态）',
      data: {
        users: [teacherUser, canteenUser, purchaserUser, adminUser],
        classes: [class1, class2, class3],
        students: students.length,
        mealOrders: this.store.getMealOrders().length,
        specialTags: this.store.getSpecialTags().length,
        purchaseOrders: this.store.getPurchaseOrders().length,
        sampleRecords: this.store.getSampleRecords().length,
        timelines: this.store.getTimelines().length,
      },
    };
  }

  private createMealOrder(
    id: string,
    date: string,
    student: Student,
    mealType: MealType,
    status: OrderStatus,
    operator: User,
    specialDietTag?: string[]
  ) {
    const order: StudentMealOrder = {
      id,
      date,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      className: student.className,
      status,
      mealType,
      specialDietTag,
      createTime: new Date(),
      updateTime: new Date(),
      createBy: operator.id,
      createByName: operator.name,
    };
    this.store.saveMealOrder(order);
  }

  private createSpecialTag(
    id: string,
    studentId: string,
    studentName: string,
    tagType: SpecialTagType,
    tagContent: string,
    tagLabel: string,
    isLongTerm: boolean,
    expireDate: string | null,
    operator: User,
    remark?: string
  ) {
    const tag: SpecialMealTag = {
      id,
      studentId,
      studentName,
      tagType,
      tagContent,
      tagLabel,
      status: SpecialTagStatus.ACTIVE,
      isLongTerm,
      expireDate: expireDate || undefined,
      createTime: new Date(),
      updateTime: new Date(),
      createBy: operator.id,
      createByName: operator.name,
      remark,
    };
    this.store.saveSpecialTag(tag);

    const log: SpecialTagLog = {
      id: this.store.generateId(),
      tagId: tag.id,
      studentId,
      operation: 'add',
      tagType,
      tagContent,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      operateTime: new Date(),
      remark,
    };
    this.store.saveSpecialTagLog(log);

    this.store.createTimeline(
      TimelineBusinessType.SPECIAL_TAG,
      tag.id,
      '新增特殊餐标签',
      operator as any,
      { tagType, tagContent, studentId, studentName }
    );
  }

  private getStudentTagContents(studentId: string): string[] {
    return this.store
      .getSpecialTags()
      .filter(t => t.studentId === studentId && t.status === SpecialTagStatus.ACTIVE)
      .map(t => t.tagContent);
  }

  private calculateIngredients(totalCount: number, specialCount: number) {
    const normalCount = totalCount - specialCount;
    const perPerson = {
      rice: { quantity: 150, unit: 'g' },
      vegetables: { quantity: 200, unit: 'g' },
      meat: { quantity: 100, unit: 'g' },
      egg: { quantity: 50, unit: 'g' },
      oil: { quantity: 15, unit: 'g' },
    };
    const specialExtra = {
      vegetables: { quantity: 50, unit: 'g' },
      meat: { quantity: 30, unit: 'g' },
    };

    const items = [];
    for (const [key, val] of Object.entries(perPerson)) {
      let quantityGrams = val.quantity * normalCount;
      if (specialExtra[key as keyof typeof specialExtra]) {
        quantityGrams += specialExtra[key as keyof typeof specialExtra].quantity * specialCount;
      }
      items.push({
        ingredient: this.getIngredientName(key),
        quantity: Math.ceil((quantityGrams / 1000) * 10) / 10,
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
    };
    return names[key] || key;
  }

  clear() {
    this.store.clearAll();
    return { message: '所有数据已清空' };
  }
}
