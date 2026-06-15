import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PartRequest } from './entities/part-request.entity';
import { QualityCheckRecord } from './entities/quality-check.entity';
import { Attachment } from './entities/attachment.entity';
import { IntakeOrder } from '../intake/entities/intake-order.entity';
import {
  CreatePartRequestDto,
  ConfirmPartArrivalDto,
} from './dto/part-request.dto';
import { CreateQualityCheckDto } from './dto/quality-check.dto';
import { CreateAttachmentDto } from './dto/attachment.dto';
import { User } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { IntakeStatus } from '../common/enums/intake-status.enum';
import { PartRequestStatus } from '../common/enums/part-request-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { OperationLogService } from '../common/services/operation-log.service';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(PartRequest)
    private readonly partReqRepo: Repository<PartRequest>,
    @InjectRepository(QualityCheckRecord)
    private readonly qcRepo: Repository<QualityCheckRecord>,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    @InjectRepository(IntakeOrder)
    private readonly intakeRepo: Repository<IntakeOrder>,
    private readonly logService: OperationLogService,
  ) {}

  async findOrderOrFail(orderId: string): Promise<IntakeOrder> {
    const order = await this.intakeRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BusinessException(ErrorCode.INTAKE_NOT_FOUND);
    }
    return order;
  }

  async checkTechnicianOwnership(order: IntakeOrder, user: User) {
    if (
      user.role === UserRole.TECHNICIAN &&
      order.technician?.id !== user.id
    ) {
      throw new BusinessException(
        ErrorCode.AUTH_FORBIDDEN,
        '只能处理自己负责的工单',
      );
    }
  }

  async createPartRequest(
    orderId: string,
    dto: CreatePartRequestDto,
    technician: User,
  ) {
    const order = await this.findOrderOrFail(orderId);
    await this.checkTechnicianOwnership(order, technician);

    if (
      order.status !== IntakeStatus.DIAGNOSING &&
      order.status !== IntakeStatus.REPAIRING &&
      order.status !== IntakeStatus.WAITING_PARTS
    ) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可申请备件',
      );
    }

    const req = this.partReqRepo.create({
      ...dto,
      order,
      requestedBy: technician,
      status: PartRequestStatus.PENDING,
    });
    const saved = await this.partReqRepo.save(req);

    if (order.status !== IntakeStatus.WAITING_PARTS) {
      order.status = IntakeStatus.WAITING_PARTS;
      await this.intakeRepo.save(order);
    }

    await this.logService.record(
      'PartRequest',
      saved.id,
      'create',
      technician,
      null,
      saved,
      { orderId, partName: dto.partName },
    );

    return saved;
  }

  async orderPart(requestId: string, operator: User) {
    const req = await this.partReqRepo.findOne({ where: { id: requestId } });
    if (!req) {
      throw new BusinessException(
        ErrorCode.INTAKE_NOT_FOUND,
        '备件申请不存在',
      );
    }
    if (req.status !== PartRequestStatus.PENDING) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '只有待处理申请可下单',
      );
    }

    const old = { ...req };
    req.status = PartRequestStatus.ORDERED;
    req.orderedAt = new Date();
    req.orderedBy = operator;
    const saved = await this.partReqRepo.save(req);

    await this.logService.record(
      'PartRequest',
      requestId,
      'update',
      operator,
      old,
      saved,
      { action: 'ordered' },
    );

    return saved;
  }

  async confirmPartArrival(
    requestId: string,
    dto: ConfirmPartArrivalDto,
    operator: User,
  ) {
    const req = await this.partReqRepo.findOne({
      where: { id: requestId },
      relations: ['order'],
    });
    if (!req) {
      throw new BusinessException(
        ErrorCode.INTAKE_NOT_FOUND,
        '备件申请不存在',
      );
    }
    if (
      req.status !== PartRequestStatus.PENDING &&
      req.status !== PartRequestStatus.ORDERED
    ) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '当前状态不可确认到货',
      );
    }

    const old = { ...req };
    req.status = PartRequestStatus.ARRIVED;
    req.arrivedAt = new Date();
    req.arrivedConfirmedBy = operator;
    req.arrivalNotes = dto.arrivalNotes || null;
    const saved = await this.partReqRepo.save(req);

    if (req.order) {
      const pendingCount = await this.partReqRepo.count({
        where: {
          orderId: req.orderId,
          status: In([PartRequestStatus.PENDING, PartRequestStatus.ORDERED]),
        },
      });
      if (pendingCount === 0 && req.order.status === IntakeStatus.WAITING_PARTS) {
        req.order.status = IntakeStatus.REPAIRING;
        await this.intakeRepo.save(req.order);
      }
    }

    await this.logService.record(
      'PartRequest',
      requestId,
      'update',
      operator,
      old,
      saved,
      { action: 'arrived' },
    );

    return saved;
  }

  async listPartRequests(orderId: string) {
    await this.findOrderOrFail(orderId);
    return this.partReqRepo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async createQualityCheck(
    orderId: string,
    dto: CreateQualityCheckDto,
    inspector: User,
  ) {
    const order = await this.findOrderOrFail(orderId);

    if (order.status !== IntakeStatus.QUALITY_CHECK) {
      throw new BusinessException(
        ErrorCode.INTAKE_STATUS_INVALID,
        '只有质检中状态可提交质检记录',
      );
    }

    const lastCheck = await this.qcRepo.findOne({
      where: { orderId },
      order: { checkRound: 'DESC' },
    });
    const nextRound = lastCheck ? lastCheck.checkRound + 1 : 1;

    const record = this.qcRepo.create({
      ...dto,
      order,
      inspector,
      checkRound: nextRound,
    });
    const saved = await this.qcRepo.save(record);

    order.status = dto.passed ? IntakeStatus.READY : IntakeStatus.REPAIRING;
    order.qualityCheck = {
      passed: dto.passed,
      inspector: inspector.name,
      notes: dto.notes,
      checkedAt: new Date().toISOString(),
    };
    await this.intakeRepo.save(order);

    await this.logService.record(
      'QualityCheck',
      saved.id,
      'create',
      inspector,
      null,
      saved,
      { orderId, passed: dto.passed, round: nextRound },
    );

    return saved;
  }

  async listQualityChecks(orderId: string) {
    await this.findOrderOrFail(orderId);
    return this.qcRepo.find({
      where: { orderId },
      order: { checkedAt: 'DESC' },
    });
  }

  async uploadAttachment(
    orderId: string,
    dto: CreateAttachmentDto,
    uploader: User,
  ) {
    await this.findOrderOrFail(orderId);

    const att = this.attachmentRepo.create({
      ...dto,
      orderId,
      uploadedBy: uploader,
    });
    const saved = await this.attachmentRepo.save(att);

    await this.logService.record(
      'Attachment',
      saved.id,
      'create',
      uploader,
      null,
      saved,
      { orderId, type: dto.type, fileName: dto.fileName },
    );

    return saved;
  }

  async listAttachments(orderId: string, type?: string) {
    await this.findOrderOrFail(orderId);
    const where: any = { orderId };
    if (type) {
      where.type = type;
    }
    return this.attachmentRepo.find({
      where,
      order: { uploadedAt: 'DESC' },
    });
  }

  async deleteAttachment(attachmentId: string, operator: User) {
    const att = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });
    if (!att) {
      throw new BusinessException(ErrorCode.INTERNAL_ERROR, '附件不存在');
    }
    if (
      operator.role !== UserRole.MANAGER &&
      att.uploadedBy?.id !== operator.id
    ) {
      throw new BusinessException(
        ErrorCode.AUTH_FORBIDDEN,
        '只能删除自己上传的附件',
      );
    }
    await this.attachmentRepo.remove(att);

    await this.logService.record(
      'Attachment',
      attachmentId,
      'delete',
      operator,
      att,
      null,
      { fileName: att.fileName },
    );

    return { success: true };
  }

  async getOrderEvidence(orderId: string) {
    await this.findOrderOrFail(orderId);

    const [partRequests, qualityChecks, attachments] = await Promise.all([
      this.listPartRequests(orderId),
      this.listQualityChecks(orderId),
      this.listAttachments(orderId),
    ]);
    return {
      partRequests,
      qualityChecks,
      attachments,
    };
  }
}
