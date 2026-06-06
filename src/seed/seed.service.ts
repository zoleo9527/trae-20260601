import { Injectable } from '@nestjs/common';
import { MealType, OrderStatus, PurchaseStatus, SampleMealType, SpecialTagStatus, SpecialTagType, SummaryStatus, UserRole } from '../common/enums';
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

    const students = [
      this.createStudent('stu-001', '张小明', '20230201', class1.id, class1.name),
      this.createStudent('stu-002', '李小红', '20230202', class1.id, class1.name),
      this.createStudent('stu-003', '王小刚', '20230203', class1.id, class1.name),
      this.createStudent('stu-004', '赵小雨', '20230204', class1.id, class1.name),
      this.createStudent('stu-005', '刘小强', '20230205', class1.id, class1.name),
      this.createStudent('stu-006', '陈小燕', '20230206', class1.id, class1.name),
      this.createStudent('stu-007', '杨大壮', '20230207', class1.id, class1.name),
      this.createStudent('stu-008', '周小美', '20230208', class1.id, class1.name),
    ];

    for (let i = 9; i <= 30; i++) {
      this.createStudent(`stu-${String(i).padStart(3, '0')}`, `学生${i}`, `202302${String(i).padStart(2, '0')}`, class1.id, class1.name);
    }

    const today = '2026-06-06';
    const tomorrow = '2026-06-07';

    this.createSpecialTag('tag-001', students[0].id, students[0].name, SpecialTagType.ALLERGY, '花生过敏', '🥜花生过敏', true, null, teacherUser, '校医确诊');
    this.createSpecialTag('tag-002', students[0].id, students[0].name, SpecialTagType.HEALTH, '乳糖不耐受', '🥛乳糖不耐受', false, '2026-06-15', teacherUser, '近期肠胃不适');
    this.createSpecialTag('tag-003', students[3].id, students[3].name, SpecialTagType.RELIGION, '清真', '☪️清真', true, null, teacherUser, '回族');
    this.createSpecialTag('tag-004', students[3].id, students[3].name, SpecialTagType.ALLERGY, '坚果过敏', '🌰坚果过敏', true, null, teacherUser, '校医确诊');
    this.createSpecialTag('tag-005', students[4].id, students[4].name, SpecialTagType.HEALTH, '高嘌呤', '⚠️高嘌呤', false, '2026-07-01', teacherUser, '尿酸偏高');
    this.createSpecialTag('tag-006', students[4].id, students[4].name, SpecialTagType.OTHER, '排骨汤', '🍖排骨汤', false, '2026-06-10', teacherUser, '家属要求');

    this.createMealOrder('order-today-001', today, students[0], MealType.SPECIAL, OrderStatus.SERVED, teacherUser, ['花生过敏', '乳糖不耐受']);
    this.createMealOrder('order-today-002', today, students[1], MealType.NORMAL, OrderStatus.SERVED, teacherUser);
    this.createMealOrder('order-today-003', today, students[2], MealType.NORMAL, OrderStatus.CONFIRMED, teacherUser);
    this.createMealOrder('order-today-004', today, students[3], MealType.SPECIAL, OrderStatus.SERVED, teacherUser, ['清真', '坚果过敏']);
    this.createMealOrder('order-today-005', today, students[4], MealType.SPECIAL, OrderStatus.CANCELLED, teacherUser, ['高嘌呤']);
    this.createMealOrder('order-today-006', today, students[5], MealType.NORMAL, OrderStatus.PENDING, teacherUser);

    for (let i = 6; i < 30; i++) {
      const status = i < 20 ? OrderStatus.CONFIRMED : i < 25 ? OrderStatus.SERVED : OrderStatus.PENDING;
      this.createMealOrder(`order-today-${String(i + 1).padStart(3, '0')}`, today, students[i] || students[5], MealType.NORMAL, status, teacherUser);
    }

    this.createMealOrder('order-tomorrow-001', tomorrow, students[0], MealType.SPECIAL, OrderStatus.PENDING, teacherUser, ['花生过敏', '乳糖不耐受']);
    this.createMealOrder('order-tomorrow-002', tomorrow, students[1], MealType.NORMAL, OrderStatus.PENDING, teacherUser);
    this.createMealOrder('order-tomorrow-003', tomorrow, students[2], MealType.NORMAL, OrderStatus.CONFIRMED, teacherUser);
    this.createMealOrder('order-tomorrow-004', tomorrow, students[3], MealType.SPECIAL, OrderStatus.PENDING, teacherUser, ['清真', '坚果过敏']);
    this.createMealOrder('order-tomorrow-005', tomorrow, students[4], MealType.SPECIAL, OrderStatus.PENDING, teacherUser, ['高嘌呤']);

    for (let i = 5; i < 28; i++) {
      this.createMealOrder(`order-tomorrow-${String(i + 1).padStart(3, '0')}`, tomorrow, students[i] || students[5], MealType.NORMAL, OrderStatus.PENDING, teacherUser);
    }

    const summaryToday: MealSummary = {
      id: 'summary-today',
      date: today,
      totalCount: 568,
      normalCount: 545,
      specialCount: 23,
      classBreakdown: [
        { classId: class1.id, className: class1.name, count: 28, specialCount: 5 },
        { classId: class2.id, className: class2.name, count: 32, specialCount: 3 },
        { classId: class3.id, className: class3.name, count: 30, specialCount: 4 },
      ],
      status: SummaryStatus.CONFIRMED,
      confirmTime: new Date(),
      confirmBy: canteenUser.id,
      confirmByName: canteenUser.name,
      createTime: new Date(),
      updateTime: new Date(),
    };
    this.store.saveMealSummary(summaryToday);

    const summaryTomorrow: MealSummary = {
      id: 'summary-tomorrow',
      date: tomorrow,
      totalCount: 0,
      normalCount: 0,
      specialCount: 0,
      classBreakdown: [],
      status: SummaryStatus.DRAFT,
      createTime: new Date(),
      updateTime: new Date(),
    };
    this.store.saveMealSummary(summaryTomorrow);

    const purchaseToday: PurchaseOrder = {
      id: 'purchase-today',
      orderNo: 'CG20260606001',
      date: today,
      summaryId: summaryToday.id,
      items: [
        { ingredient: '大米', quantity: 85.2, unit: 'kg' },
        { ingredient: '蔬菜', quantity: 125.8, unit: 'kg' },
        { ingredient: '肉类', quantity: 62.5, unit: 'kg' },
        { ingredient: '鸡蛋', quantity: 31.2, unit: 'kg' },
        { ingredient: '食用油', quantity: 9.4, unit: 'kg' },
      ],
      status: PurchaseStatus.RECEIVED,
      createTime: new Date(Date.now() - 86400000),
      updateTime: new Date(),
      submitTime: new Date(Date.now() - 82800000),
      receiveTime: new Date(Date.now() - 43200000),
      createBy: purchaserUser.id,
      createByName: purchaserUser.name,
    };
    this.store.savePurchaseOrder(purchaseToday);

    const purchaseTomorrow: PurchaseOrder = {
      id: 'purchase-tomorrow',
      orderNo: 'CG20260607001',
      date: tomorrow,
      summaryId: summaryTomorrow.id,
      items: [
        { ingredient: '大米', quantity: 82.0, unit: 'kg' },
        { ingredient: '蔬菜', quantity: 120.0, unit: 'kg' },
        { ingredient: '肉类', quantity: 60.0, unit: 'kg' },
      ],
      status: PurchaseStatus.DRAFT,
      createTime: new Date(),
      updateTime: new Date(),
      createBy: purchaserUser.id,
      createByName: purchaserUser.name,
    };
    this.store.savePurchaseOrder(purchaseTomorrow);

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

    this.store.createTimeline('order' as any, 'order-today-001', '创建订餐', teacherUser as any, { date: today, mealType: MealType.SPECIAL });
    this.store.createTimeline('order' as any, 'order-today-001', '确认订餐', teacherUser as any, { from: OrderStatus.PENDING, to: OrderStatus.CONFIRMED });
    this.store.createTimeline('order' as any, 'order-today-001', '标记已配餐', canteenUser as any, { from: OrderStatus.CONFIRMED, to: OrderStatus.SERVED });
    this.store.createTimeline('special_tag' as any, 'tag-001', '新增特殊餐标签', teacherUser as any, { tagType: SpecialTagType.ALLERGY, tagContent: '花生过敏', studentName: students[0].name });
    this.store.createTimeline('summary' as any, 'summary-today', '确认订餐汇总', canteenUser as any, { date: today, totalCount: 568, specialCount: 23 });
    this.store.createTimeline('purchase' as any, 'purchase-today', '生成采购单', purchaserUser as any, { date: today, itemCount: 5 });
    this.store.createTimeline('purchase' as any, 'purchase-today', '提交采购单', purchaserUser as any, { orderNo: 'CG20260606001' });
    this.store.createTimeline('purchase' as any, 'purchase-today', '确认采购到货', purchaserUser as any, { orderNo: 'CG20260606001' });
    this.store.createTimeline('sample' as any, 'sample-lunch-today', '录入留样记录', canteenUser as any, { date: today, mealType: SampleMealType.LUNCH, dishCount: 4 });

    return {
      message: '学校食堂系统种子数据初始化完成（非满状态）',
      data: {
        users: [teacherUser, canteenUser, purchaserUser, adminUser],
        classes: [class1, class2, class3],
        students: students.length + 22,
        mealOrders: this.store.getMealOrders().length,
        specialTags: this.store.getSpecialTags().length,
        purchaseOrders: this.store.getPurchaseOrders().length,
        sampleRecords: this.store.getSampleRecords().length,
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
  }

  clear() {
    this.store.clearAll();
    return { message: '所有数据已清空' };
  }
}
