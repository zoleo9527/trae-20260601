import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Housekeeper } from '../../housekeeper/entities/housekeeper.entity';
import { Intake } from '../../intake/entities/intake.entity';
import { Order } from '../../order/entities/order.entity';
import { Review } from '../../review/review.entity';
import { MatchingAttempt } from '../../matching/entities/matching-attempt.entity';
import { MatchingSnapshot } from '../../matching/entities/matching-snapshot.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { HousekeeperService } from '../../housekeeper/service/housekeeper.service';
import { IntakeService } from '../../intake/service/intake.service';
import { OrderService } from '../../order/service/order.service';
import { ReviewService } from '../../review/service/review.service';
import { Role, IntakeStatus, IntakeBlockReason, HousekeeperStatus } from '../../common/enums';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { ReviewStatus } from '../../common/enums/review-status.enum';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Housekeeper)
    private readonly housekeeperRepo: Repository<Housekeeper>,
    @InjectRepository(Intake)
    private readonly intakeRepo: Repository<Intake>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(MatchingAttempt)
    private readonly matchingAttemptRepo: Repository<MatchingAttempt>,
    @InjectRepository(MatchingSnapshot)
    private readonly matchingSnapshotRepo: Repository<MatchingSnapshot>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    private readonly housekeeperService: HousekeeperService,
    private readonly intakeService: IntakeService,
    private readonly orderService: OrderService,
    private readonly reviewService: ReviewService,
  ) {}

  private generateIntakeNo(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `IN-${y}${m}${d}-${rand}`;
  }

  private generateOrderNo(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `OD-${y}${m}${d}-${rand}`;
  }

  async seedHousekeepers(): Promise<Housekeeper[]> {
    const housekeepersData = [
      { name: '李阿姨', phone: '13800000001', skills: '月嫂,育儿嫂', coverageArea: '朝阳区', experienceYears: 5, expectedMinSalary: 8000, averageRating: 4.8 },
      { name: '王阿姨', phone: '13800000002', skills: '保姆,保洁', coverageArea: '海淀区', experienceYears: 3, expectedMinSalary: 6000, averageRating: 4.5 },
      { name: '张阿姨', phone: '13800000003', skills: '月嫂,催乳师', coverageArea: '西城区', experienceYears: 8, expectedMinSalary: 10000, averageRating: 4.9 },
      { name: '赵阿姨', phone: '13800000004', skills: '老人护理,烹饪', coverageArea: '丰台区', experienceYears: 6, expectedMinSalary: 7000, averageRating: 4.6 },
      { name: '刘阿姨', phone: '13800000005', skills: '保洁,育儿', coverageArea: '东城区', experienceYears: 4, expectedMinSalary: 6500, averageRating: 4.7 },
      { name: '孙阿姨', phone: '13800000006', skills: '月嫂,育儿嫂,催乳师', coverageArea: '朝阳区', experienceYears: 10, expectedMinSalary: 12000, averageRating: 5.0 },
    ];
    const created: Housekeeper[] = [];
    for (const data of housekeepersData) {
      const hk = this.housekeeperRepo.create({
        ...data,
        status: HousekeeperStatus.ACTIVE,
        totalReviews: 0,
        negativeReviews: 0,
        noShowCount: 0,
        hasCriminalRecordCheck: false,
        hasHealthCertificate: false,
      });
      created.push(await this.housekeeperRepo.save(hk));
    }
    return created;
  }

  async seedIntakes(): Promise<Intake[]> {
    const intakesData = [
      { customerName: '陈女士', customerPhone: '13900000001', address: '朝阳区建国路88号', serviceType: '月嫂', salaryBudget: 9000, startTime: new Date('2026-07-01'), status: IntakeStatus.CREATED, blockReason: IntakeBlockReason.NONE, ownerRole: Role.CUSTOMER_SERVICE, ownerId: 'cs-wang', ownerName: '客服小王', currentMatchingRound: 0 },
      { customerName: '刘先生', customerPhone: '13900000002', address: '海淀区中关村大街', serviceType: '保姆', salaryBudget: 7000, startTime: new Date('2026-07-05'), status: IntakeStatus.CLARIFYING, blockReason: IntakeBlockReason.AWAITING_CUSTOMER_CLARIFICATION, ownerRole: Role.CUSTOMER_SERVICE, ownerId: 'cs-li', ownerName: '客服小李', currentMatchingRound: 0, blockedAt: new Date() },
      { customerName: '周女士', customerPhone: '13900000003', address: '东城区朝阳门', serviceType: '保洁', salaryBudget: 4000, startTime: new Date('2026-06-25'), status: IntakeStatus.MATCHING, blockReason: IntakeBlockReason.NONE, ownerRole: Role.CUSTOMER_SERVICE, ownerId: 'cs-wang', ownerName: '客服小王', currentMatchingRound: 2 },
      { customerName: '吴先生', customerPhone: '13900000004', address: '丰台区方庄', serviceType: '老人护理', salaryBudget: 7500, startTime: new Date('2026-07-10'), status: IntakeStatus.CREATED, blockReason: IntakeBlockReason.NONE, ownerRole: Role.CUSTOMER_SERVICE, ownerId: 'cs-zhang', ownerName: '客服小张', currentMatchingRound: 0 },
    ];
    const created: Intake[] = [];
    for (const data of intakesData) {
      const intake = this.intakeRepo.create({ ...data, intakeNo: this.generateIntakeNo() });
      created.push(await this.intakeRepo.save(intake));
    }
    return created;
  }

  async seedOrders(housekeepers: Housekeeper[], intakes: Intake[]): Promise<Order[]> {
    const chenIntake = intakes.find(i => i.customerName === '陈女士');
    const zhouIntake = intakes.find(i => i.customerName === '周女士');
    const liHousekeeper = housekeepers.find(h => h.name === '李阿姨');
    const liuHousekeeper = housekeepers.find(h => h.name === '刘阿姨');
    const ordersData = [
      { intakeId: chenIntake?.id, housekeeperId: liHousekeeper!.id, customerName: '陈女士', customerPhone: '13900000001', address: '朝阳区建国路88号', serviceType: '月嫂', scheduledStart: new Date('2026-07-01'), salaryAmount: 8000, status: OrderStatus.SCHEDULED, ownerRole: Role.CUSTOMER_SERVICE, ownerId: 'cs-wang', ownerName: '客服小王' },
      { intakeId: zhouIntake?.id, housekeeperId: liuHousekeeper!.id, customerName: '周女士', customerPhone: '13900000003', address: '东城区朝阳门', serviceType: '保洁', scheduledStart: new Date('2026-06-25'), salaryAmount: 4000, status: OrderStatus.CONFIRMED, serviceClarificationStatus: 'CLARIFIED', ownerRole: Role.CUSTOMER_SERVICE, ownerId: 'cs-wang', ownerName: '客服小王' },
    ];
    const created: Order[] = [];
    for (const data of ordersData) {
      const order = this.orderRepo.create({ ...data, orderNo: this.generateOrderNo(), statusChangedAt: new Date(), clarificationContactCount: 0 });
      created.push(await this.orderRepo.save(order));
    }
    return created;
  }

  async seedReviews(orders: Order[], housekeepers: Housekeeper[]): Promise<Review[]> {
    const firstOrder = orders[0];
    const secondOrder = orders[1];
    const liHousekeeper = housekeepers.find(h => h.name === '李阿姨');
    const liuHousekeeper = housekeepers.find(h => h.name === '刘阿姨');
    const reviewsData = [
      { orderId: firstOrder.id, customerName: '陈女士', housekeeperId: liHousekeeper!.id, rating: 2, content: '服务态度不好，迟到', status: ReviewStatus.AWAITING_QUALITY_ASSIGN },
      { orderId: secondOrder.id, customerName: '周女士', housekeeperId: liuHousekeeper!.id, rating: 5, content: '服务非常认真', status: ReviewStatus.RESOLVED, resolvedAt: new Date() },
    ];
    const created: Review[] = [];
    for (const data of reviewsData) {
      const review = this.reviewRepo.create(data);
      created.push(await this.reviewRepo.save(review));
    }
    return created;
  }

  async seed() {
    await this.clearAll();
    const housekeepers = await this.seedHousekeepers();
    const intakes = await this.seedIntakes();
    const orders = await this.seedOrders(housekeepers, intakes);
    const reviews = await this.seedReviews(orders, housekeepers);
    return {
      success: true,
      counts: { housekeepers: housekeepers.length, intakes: intakes.length, orders: orders.length, reviews: reviews.length },
    };
  }

  async clearAll() {
    await this.auditLogRepo.clear();
    await this.matchingSnapshotRepo.clear();
    await this.matchingAttemptRepo.clear();
    await this.reviewRepo.clear();
    await this.orderRepo.clear();
    await this.intakeRepo.clear();
    await this.housekeeperRepo.clear();
  }

  async getSeedSummary() {
    const [housekeepers, intakes, orders, reviews, matchingAttempts, matchingSnapshots, auditLogs] = await Promise.all([
      this.housekeeperRepo.count(),
      this.intakeRepo.count(),
      this.orderRepo.count(),
      this.reviewRepo.count(),
      this.matchingAttemptRepo.count(),
      this.matchingSnapshotRepo.count(),
      this.auditLogRepo.count(),
    ]);
    return { housekeepers, intakes, orders, reviews, matchingAttempts, matchingSnapshots, auditLogs };
  }
}
