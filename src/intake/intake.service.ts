import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Like } from 'typeorm';
import { IntakeOrder } from './entities/intake-order.entity';
import { PrivacyConsent } from '../privacy/entities/privacy-consent.entity';
import { CreateIntakeDto } from './dto/create-intake.dto';
import { IntakeQueryDto } from './dto/intake-query.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';
import { User } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { IntakeStatus } from '../common/enums/intake-status.enum';
import { OperationLogService } from '../common/services/operation-log.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class IntakeService {
  constructor(
    @InjectRepository(IntakeOrder)
    private readonly intakeRepo: Repository<IntakeOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PrivacyConsent)
    private readonly consentRepo: Repository<PrivacyConsent>,
    private readonly logService: OperationLogService,
  ) {}

  private generateOrderNo(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `RJ${y}${m}${d}${rand}`;
  }

  private buildDefaultConsentContent(): string {
    return `
【隐私授权同意书】

为保障您的合法权益并顺利完成维修服务，我们需要您的授权同意：

1. 数据访问授权：同意维修人员在维修过程中访问您的手机数据以完成故障诊断和维修操作。
2. 照片备份说明：如需拆机检测，我们会对手机外观及重要部件进行拍照存档，维修完成后可申请删除。
3. 联系授权：同意我们在维修过程中及完成后通过电话或微信与您联系，告知维修进度和取机信息。
4. 信息披露限制：您的个人信息仅用于本次维修服务，未经同意不会披露给任何第三方。

您的签名即表示已阅读并同意以上条款。
    `.trim();
  }

  async create(dto: CreateIntakeDto, receptionist: User) {
    const orderNo = this.generateOrderNo();

    const technician = dto.technicianId
      ? await this.userRepo.findOne({ where: { id: dto.technicianId, role: UserRole.TECHNICIAN } })
      : null;

    const order = this.intakeRepo.create({
      ...dto,
      orderNo,
      receptionist,
      technician,
      status: IntakeStatus.WAITING_CONSENT,
    });
    const savedOrder = await this.intakeRepo.save(order);

    const consent = this.consentRepo.create({
      order: savedOrder,
      orderId: savedOrder.id,
      consentContent: this.buildDefaultConsentContent(),
      consentItems: {
        allowDataAccess: true,
        allowPhotoBackup: true,
        allowContactRepair: true,
        allowDisclosure: false,
      },
      customerName: dto.customerName,
    });
    await this.consentRepo.save(consent);

    await this.logService.record(
      'IntakeOrder',
      savedOrder.id,
      'create',
      receptionist,
      null,
      savedOrder,
      { orderNo: savedOrder.orderNo },
    );

    return {
      ...savedOrder,
      privacyConsent: consent,
    };
  }

  async findAll(query: IntakeQueryDto, user: User) {
    const { page = 1, pageSize = 20, status, keyword, technicianId } = query;
    const qb = this.intakeRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.receptionist', 'r')
      .leftJoinAndSelect('o.technician', 't')
      .leftJoinAndSelect('o.privacyConsent', 'c');

    if (user.role === UserRole.TECHNICIAN) {
      qb.andWhere('(t.id = :tid OR t.id IS NULL)', { tid: user.id });
    }

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }
    if (technicianId) {
      qb.andWhere('t.id = :tid', { tid: technicianId });
    }
    if (keyword) {
      qb.andWhere(
        new Brackets((sq) => {
          sq.where('o.customerName LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('o.customerPhone LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('o.orderNo LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('o.phoneModel LIKE :kw', { kw: `%${keyword}%` });
        }),
      );
    }

    qb.addSelect(
      "CASE o.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END",
      'priority_order',
    );
    qb.orderBy('priority_order', 'ASC');
    qb.addOrderBy('o.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const order = await this.intakeRepo.findOne({
      where: { id },
      relations: ['receptionist', 'technician', 'privacyConsent'],
    });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    return order;
  }

  async update(id: string, dto: UpdateIntakeDto, operator: User) {
    const order = await this.findOne(id);
    const oldValue = { ...order };

    const statusFlow: Record<IntakeStatus, IntakeStatus[]> = {
      [IntakeStatus.PENDING]: [IntakeStatus.WAITING_CONSENT, IntakeStatus.CANCELLED],
      [IntakeStatus.WAITING_CONSENT]: [IntakeStatus.CONSENT_SIGNED, IntakeStatus.CANCELLED],
      [IntakeStatus.CONSENT_SIGNED]: [IntakeStatus.DIAGNOSING, IntakeStatus.CANCELLED],
      [IntakeStatus.DIAGNOSING]: [IntakeStatus.WAITING_PARTS, IntakeStatus.REPAIRING, IntakeStatus.CANCELLED],
      [IntakeStatus.WAITING_PARTS]: [IntakeStatus.REPAIRING, IntakeStatus.CANCELLED],
      [IntakeStatus.REPAIRING]: [IntakeStatus.QUALITY_CHECK, IntakeStatus.CANCELLED],
      [IntakeStatus.QUALITY_CHECK]: [IntakeStatus.READY, IntakeStatus.REPAIRING, IntakeStatus.CANCELLED],
      [IntakeStatus.READY]: [IntakeStatus.COMPLETED],
      [IntakeStatus.COMPLETED]: [],
      [IntakeStatus.CANCELLED]: [],
    };

    if (dto.status && dto.status !== order.status) {
      const allowed = statusFlow[order.status];
      if (!allowed || !allowed.includes(dto.status)) {
        throw new BusinessException(ErrorCode.INTAKE_STATUS_INVALID, undefined, {
          current: order.status,
          target: dto.status,
          allowed,
        });
      }
      order.status = dto.status;

      if (dto.status === IntakeStatus.COMPLETED) {
        order.completedAt = new Date();
      }
    }

    if (dto.diagnosisResult !== undefined) {
      order.diagnosisResult = dto.diagnosisResult;
    }
    if (dto.repairNotes !== undefined) {
      order.repairNotes = dto.repairNotes;
    }
    if (dto.priority !== undefined) {
      order.priority = dto.priority;
    }
    if (dto.technicianId !== undefined) {
      order.technician = dto.technicianId
        ? await this.userRepo.findOne({ where: { id: dto.technicianId } })
        : null;
    }

    const saved = await this.intakeRepo.save(order);

    await this.logService.record(
      'IntakeOrder',
      id,
      'update',
      operator,
      oldValue,
      saved,
      { changes: Object.keys(dto) },
    );

    return saved;
  }

  async getOperationLogs(id: string, page = 1, pageSize = 20) {
    await this.findOne(id);
    return this.logService.findByEntity('IntakeOrder', id, page, pageSize);
  }

  async getStatusFlowConfig() {
    return {
      [IntakeStatus.PENDING]: { label: '待登记', next: [IntakeStatus.WAITING_CONSENT, IntakeStatus.CANCELLED] },
      [IntakeStatus.WAITING_CONSENT]: { label: '待签隐私授权', next: [IntakeStatus.CONSENT_SIGNED, IntakeStatus.CANCELLED] },
      [IntakeStatus.CONSENT_SIGNED]: { label: '已授权待诊断', next: [IntakeStatus.DIAGNOSING, IntakeStatus.CANCELLED] },
      [IntakeStatus.DIAGNOSING]: { label: '诊断中', next: [IntakeStatus.WAITING_PARTS, IntakeStatus.REPAIRING, IntakeStatus.CANCELLED] },
      [IntakeStatus.WAITING_PARTS]: { label: '待备件', next: [IntakeStatus.REPAIRING, IntakeStatus.CANCELLED] },
      [IntakeStatus.REPAIRING]: { label: '维修中', next: [IntakeStatus.QUALITY_CHECK, IntakeStatus.CANCELLED] },
      [IntakeStatus.QUALITY_CHECK]: { label: '质检中', next: [IntakeStatus.READY, IntakeStatus.REPAIRING, IntakeStatus.CANCELLED] },
      [IntakeStatus.READY]: { label: '待取机', next: [IntakeStatus.COMPLETED] },
      [IntakeStatus.COMPLETED]: { label: '已完成', next: [] },
      [IntakeStatus.CANCELLED]: { label: '已取消', next: [] },
    };
  }
}
