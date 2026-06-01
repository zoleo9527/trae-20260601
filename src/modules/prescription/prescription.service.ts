import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/error-codes';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';
import { RequestContext } from '../../common/decorators/request-context.decorator';
import { Prescription, AuditLog } from './prescription.entity';
import { PrescriptionStatus, PrescriptionAction } from './prescription.enum';
import { PrescriptionStateMachine } from './prescription.state-machine';
import {
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
  SubmitPrescriptionDto,
  ReviewPrescriptionDto,
  ApprovePrescriptionDto,
  RejectPrescriptionDto,
  SupplementPrescriptionDto,
  VoidPrescriptionDto,
  PrescriptionQueryDto,
} from './prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    private readonly stateMachine: PrescriptionStateMachine,
  ) {}

  async create(dto: CreatePrescriptionDto): Promise<Prescription> {
    const existing = await this.prescriptionRepository.findOne({
      where: { prescriptionNo: dto.prescriptionNo },
    });
    if (existing) {
      throw new BusinessException(ErrorCode.PRESCRIPTION_ALREADY_EXISTS, `处方编号 ${dto.prescriptionNo} 已存在`);
    }

    const prescription = this.prescriptionRepository.create({
      ...dto,
      currentStatus: PrescriptionStatus.DRAFT,
      auditLogs: [],
    });

    return this.prescriptionRepository.save(prescription);
  }

  async findAll(query: PrescriptionQueryDto): Promise<PaginatedResult<Prescription>> {
    const { page, pageSize, sortBy, sortOrder, currentStatus, storeId, patientName, startTime, endTime, prescriptionNo } = query;

    const where: any = {};

    if (currentStatus) {
      where.currentStatus = currentStatus;
    }
    if (storeId) {
      where.storeId = storeId;
    }
    if (patientName) {
      where.patientName = Like(`%${patientName}%`);
    }
    if (prescriptionNo) {
      where.prescriptionNo = Like(`%${prescriptionNo}%`);
    }

    const qb = this.prescriptionRepository.createQueryBuilder('prescription');
    qb.where(where);

    if (startTime && endTime) {
      qb.andWhere('prescription.createdAt BETWEEN :startTime AND :endTime', { startTime, endTime });
    } else if (startTime) {
      qb.andWhere('prescription.createdAt >= :startTime', { startTime });
    } else if (endTime) {
      qb.andWhere('prescription.createdAt <= :endTime', { endTime });
    }

    const orderField = sortBy || 'createdAt';
    qb.orderBy(`prescription.${orderField}`, sortOrder || 'DESC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({ where: { id } });
    if (!prescription) {
      throw new BusinessException(ErrorCode.PRESCRIPTION_NOT_FOUND);
    }
    return prescription;
  }

  async update(id: string, dto: UpdatePrescriptionDto): Promise<Prescription> {
    const prescription = await this.findOne(id);

    if (prescription.currentStatus !== PrescriptionStatus.DRAFT) {
      throw new BusinessException(
        ErrorCode.PRESCRIPTION_INVALID_STATE,
        '仅草稿状态的处方可以编辑',
        { currentStatus: prescription.currentStatus },
      );
    }

    Object.assign(prescription, dto);
    return this.prescriptionRepository.save(prescription);
  }

  async remove(id: string): Promise<void> {
    const prescription = await this.findOne(id);

    if (prescription.currentStatus !== PrescriptionStatus.DRAFT) {
      throw new BusinessException(
        ErrorCode.PRESCRIPTION_INVALID_STATE,
        '仅草稿状态的处方可以删除',
        { currentStatus: prescription.currentStatus },
      );
    }

    await this.prescriptionRepository.remove(prescription);
  }

  async submit(id: string, dto: SubmitPrescriptionDto, ctx: RequestContext): Promise<Prescription> {
    const prescription = await this.findOne(id);
    const action = PrescriptionAction.SUBMIT;

    this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);

    const beforeState = prescription.currentStatus;
    const nextState = this.stateMachine.getNextState(beforeState, action);

    this.addAuditLog(prescription, {
      beforeState,
      afterState: nextState,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      action,
      remark: dto.remark,
    });

    prescription.currentStatus = nextState;
    prescription.submitterId = ctx.userId;
    prescription.submitterName = ctx.userName;
    prescription.submitTime = new Date();

    return this.prescriptionRepository.save(prescription);
  }

  async review(id: string, dto: ReviewPrescriptionDto, ctx: RequestContext): Promise<Prescription> {
    const prescription = await this.findOne(id);
    const action = PrescriptionAction.REVIEW;

    this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);

    const beforeState = prescription.currentStatus;
    const nextState = this.stateMachine.getNextState(beforeState, action);

    this.addAuditLog(prescription, {
      beforeState,
      afterState: nextState,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      action,
      remark: dto.remark,
    });

    prescription.currentStatus = nextState;
    prescription.reviewerId = ctx.userId;
    prescription.reviewerName = ctx.userName;
    prescription.reviewTime = new Date();

    return this.prescriptionRepository.save(prescription);
  }

  async approve(id: string, dto: ApprovePrescriptionDto, ctx: RequestContext): Promise<Prescription> {
    const prescription = await this.findOne(id);
    const action = PrescriptionAction.APPROVE;

    this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);

    const beforeState = prescription.currentStatus;
    const nextState = this.stateMachine.getNextState(beforeState, action);

    this.addAuditLog(prescription, {
      beforeState,
      afterState: nextState,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      action,
      remark: dto.reviewRemark,
    });

    prescription.currentStatus = nextState;
    prescription.reviewerId = ctx.userId;
    prescription.reviewerName = ctx.userName;
    prescription.reviewTime = new Date();
    prescription.reviewRemark = dto.reviewRemark;

    return this.prescriptionRepository.save(prescription);
  }

  async reject(id: string, dto: RejectPrescriptionDto, ctx: RequestContext): Promise<Prescription> {
    const prescription = await this.findOne(id);
    const action = PrescriptionAction.REJECT;

    this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);

    const beforeState = prescription.currentStatus;
    const nextState = this.stateMachine.getNextState(beforeState, action);

    this.addAuditLog(prescription, {
      beforeState,
      afterState: nextState,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      action,
      remark: `${dto.rejectReason}${dto.reviewRemark ? ` | ${dto.reviewRemark}` : ''}`,
    });

    prescription.currentStatus = nextState;
    prescription.reviewerId = ctx.userId;
    prescription.reviewerName = ctx.userName;
    prescription.reviewTime = new Date();
    prescription.rejectReason = dto.rejectReason;
    prescription.reviewRemark = dto.reviewRemark;

    return this.prescriptionRepository.save(prescription);
  }

  async supplement(id: string, dto: SupplementPrescriptionDto, ctx: RequestContext): Promise<Prescription> {
    const prescription = await this.findOne(id);
    const action = PrescriptionAction.SUPPLEMENT;

    this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);

    const beforeState = prescription.currentStatus;
    const nextState = this.stateMachine.getNextState(beforeState, action);

    this.addAuditLog(prescription, {
      beforeState,
      afterState: nextState,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      action,
      remark: dto.supplementRemark,
    });

    prescription.currentStatus = nextState;
    prescription.supplementRemark = dto.supplementRemark;
    prescription.supplementTime = new Date();

    return this.prescriptionRepository.save(prescription);
  }

  async void(id: string, dto: VoidPrescriptionDto, ctx: RequestContext): Promise<Prescription> {
    const prescription = await this.findOne(id);
    const action = PrescriptionAction.VOID;

    this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);

    const beforeState = prescription.currentStatus;
    const nextState = this.stateMachine.getNextState(beforeState, action);

    this.addAuditLog(prescription, {
      beforeState,
      afterState: nextState,
      operatorId: ctx.userId,
      operatorName: ctx.userName,
      action,
      remark: dto.remark,
    });

    prescription.currentStatus = nextState;

    return this.prescriptionRepository.save(prescription);
  }

  async getAllowedActions(id: string, ctx: RequestContext): Promise<PrescriptionAction[]> {
    const prescription = await this.findOne(id);
    return this.stateMachine.getAllowedActions(prescription.currentStatus, ctx.userRole);
  }

  private addAuditLog(prescription: Prescription, log: Omit<AuditLog, 'timestamp'>): void {
    const auditLog: AuditLog = {
      ...log,
      timestamp: new Date(),
    };
    prescription.auditLogs = [...prescription.auditLogs, auditLog];
  }
}
