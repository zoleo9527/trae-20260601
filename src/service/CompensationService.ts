import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Compensation, CompensationStatus, CompensationType, CompensationApprover } from "../entity/Compensation";
import { Review, ReviewStatus } from "../entity/Review";
import { Store } from "../entity/Store";
import { AuditService } from "./AuditService";
import { AuditModule, AuditAction, AuditOperatorRole } from "../entity/AuditLog";
import { ErrorCode, ErrorMessage } from "../error/ErrorCode";

export interface CreateCompensationRequest {
  reviewId: string;
  type: CompensationType;
  amount: number;
  reason: string;
  pendingReason?: string;
  internalNotes?: string;
}

export interface UpdateCompensationRequest {
  pendingReason?: string;
  internalNotes?: string;
}

export interface CompensationQuery {
  reviewId?: string;
  storeCode?: string;
  status?: CompensationStatus;
  type?: CompensationType;
  startDate?: Date;
  endDate?: Date;
}

export class CompensationService {
  private compensationRepository: Repository<Compensation>;
  private reviewRepository: Repository<Review>;
  private storeRepository: Repository<Store>;
  private auditService: AuditService;

  constructor() {
    this.compensationRepository = AppDataSource.getRepository(Compensation);
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.storeRepository = AppDataSource.getRepository(Store);
    this.auditService = new AuditService();
  }

  async createCompensation(request: CreateCompensationRequest, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    const { reviewId, type, amount, reason, pendingReason, internalNotes } = request;

    const review = await this.reviewRepository.findOne({ where: { id: reviewId }, relations: ["store"] });
    if (!review) {
      return { code: ErrorCode.REVIEW_NOT_FOUND, message: ErrorMessage[ErrorCode.REVIEW_NOT_FOUND] };
    }

    if (review.status === ReviewStatus.CLOSED) {
      return { code: ErrorCode.REVIEW_ALREADY_RESOLVED, message: ErrorMessage[ErrorCode.REVIEW_ALREADY_RESOLVED] };
    }

    const existingPendingCompensation = await this.compensationRepository.findOne({
      where: { review: { id: reviewId }, status: CompensationStatus.PENDING },
    });
    if (existingPendingCompensation) {
      return { code: ErrorCode.DUPLICATE_RECORD, message: "该差评已有待审核的补偿申请" };
    }

    const compensation = this.compensationRepository.create({
      type,
      amount,
      reason,
      pendingReason,
      internalNotes,
      review,
      store: review.store,
      status: CompensationStatus.PENDING,
    });

    try {
      const savedCompensation = await this.compensationRepository.save(compensation);

      await this.auditService.createLog(
        AuditModule.COMPENSATION,
        AuditAction.CREATE,
        savedCompensation.id,
        operatorRole,
        operatorName,
        null,
        { id: savedCompensation.id, reviewId, type, amount, status: savedCompensation.status },
        `创建补偿申请，金额: ${amount}，类型: ${type}`,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: savedCompensation };
    } catch (error) {
      console.error("Failed to create compensation:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getCompensationById(id: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    try {
      const compensation = await this.compensationRepository.findOne({
        where: { id },
        relations: ["review", "store"],
      });

      if (!compensation) {
        return { code: ErrorCode.COMPENSATION_NOT_FOUND, message: ErrorMessage[ErrorCode.COMPENSATION_NOT_FOUND] };
      }

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: compensation };
    } catch (error) {
      console.error("Failed to get compensation:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async updateCompensation(id: string, request: UpdateCompensationRequest, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    const compensation = await this.compensationRepository.findOne({ where: { id } });
    if (!compensation) {
      return { code: ErrorCode.COMPENSATION_NOT_FOUND, message: ErrorMessage[ErrorCode.COMPENSATION_NOT_FOUND] };
    }

    if (compensation.status === CompensationStatus.COMPLETED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_COMPLETED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_COMPLETED] };
    }

    const beforeData = {
      pendingReason: compensation.pendingReason,
      internalNotes: compensation.internalNotes,
    };

    if (request.pendingReason !== undefined) {
      compensation.pendingReason = request.pendingReason;
    }
    if (request.internalNotes !== undefined) {
      compensation.internalNotes = request.internalNotes;
    }

    try {
      const updatedCompensation = await this.compensationRepository.save(compensation);

      const afterData = {
        pendingReason: updatedCompensation.pendingReason,
        internalNotes: updatedCompensation.internalNotes,
      };

      await this.auditService.createLog(
        AuditModule.COMPENSATION,
        AuditAction.UPDATE,
        updatedCompensation.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        "更新补偿备注信息",
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedCompensation };
    } catch (error) {
      console.error("Failed to update compensation:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getCompensations(query: CompensationQuery): Promise<{ code: ErrorCode; message: string; data?: Compensation[] }> {
    try {
      const queryBuilder = this.compensationRepository
        .createQueryBuilder("compensation")
        .leftJoinAndSelect("compensation.review", "review")
        .leftJoinAndSelect("compensation.store", "store");

      if (query.reviewId) {
        queryBuilder.andWhere("review.id = :reviewId", { reviewId: query.reviewId });
      }
      if (query.storeCode) {
        queryBuilder.andWhere("store.storeCode = :storeCode", { storeCode: query.storeCode });
      }
      if (query.status) {
        queryBuilder.andWhere("compensation.status = :status", { status: query.status });
      }
      if (query.type) {
        queryBuilder.andWhere("compensation.type = :type", { type: query.type });
      }
      if (query.startDate) {
        queryBuilder.andWhere("compensation.createdAt >= :startDate", { startDate: query.startDate });
      }
      if (query.endDate) {
        queryBuilder.andWhere("compensation.createdAt <= :endDate", { endDate: query.endDate });
      }

      const compensations = await queryBuilder.orderBy("compensation.createdAt", "DESC").getMany();

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: compensations };
    } catch (error) {
      console.error("Failed to get compensations:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async approveCompensation(id: string, approver: CompensationApprover, approverName: string, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    const compensation = await this.compensationRepository.findOne({
      where: { id },
      relations: ["review"],
    });

    if (!compensation) {
      return { code: ErrorCode.COMPENSATION_NOT_FOUND, message: ErrorMessage[ErrorCode.COMPENSATION_NOT_FOUND] };
    }

    if (compensation.status === CompensationStatus.APPROVED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_APPROVED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_APPROVED] };
    }

    if (compensation.status === CompensationStatus.REJECTED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_REJECTED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_REJECTED] };
    }

    if (compensation.status === CompensationStatus.COMPLETED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_COMPLETED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_COMPLETED] };
    }

    const beforeData = { status: compensation.status, approvedBy: compensation.approvedBy };

    compensation.status = CompensationStatus.APPROVED;
    compensation.approvedBy = approver;
    compensation.approverName = approverName;
    compensation.approvedAt = new Date();

    try {
      const updatedCompensation = await this.compensationRepository.save(compensation);

      const afterData = { status: updatedCompensation.status, approvedBy: updatedCompensation.approvedBy, approvedAt: updatedCompensation.approvedAt };

      await this.auditService.createLog(
        AuditModule.COMPENSATION,
        AuditAction.APPROVE,
        updatedCompensation.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        `审核通过补偿申请，审批人: ${approverName} (${approver})`,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedCompensation };
    } catch (error) {
      console.error("Failed to approve compensation:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async rejectCompensation(id: string, rejectReason: string, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    const compensation = await this.compensationRepository.findOne({
      where: { id },
      relations: ["review"],
    });

    if (!compensation) {
      return { code: ErrorCode.COMPENSATION_NOT_FOUND, message: ErrorMessage[ErrorCode.COMPENSATION_NOT_FOUND] };
    }

    if (compensation.status === CompensationStatus.APPROVED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_APPROVED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_APPROVED] };
    }

    if (compensation.status === CompensationStatus.REJECTED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_REJECTED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_REJECTED] };
    }

    if (compensation.status === CompensationStatus.COMPLETED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_COMPLETED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_COMPLETED] };
    }

    const beforeData = { status: compensation.status, rejectReason: compensation.rejectReason };

    compensation.status = CompensationStatus.REJECTED;
    compensation.rejectReason = rejectReason;

    try {
      const updatedCompensation = await this.compensationRepository.save(compensation);

      const afterData = { status: updatedCompensation.status, rejectReason: updatedCompensation.rejectReason };

      await this.auditService.createLog(
        AuditModule.COMPENSATION,
        AuditAction.REJECT,
        updatedCompensation.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        `拒绝补偿申请，原因: ${rejectReason}`,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedCompensation };
    } catch (error) {
      console.error("Failed to reject compensation:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async processCompensation(id: string, paymentTransactionId: string, processor: CompensationApprover, processorName: string, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    const compensation = await this.compensationRepository.findOne({
      where: { id },
      relations: ["review"],
    });

    if (!compensation) {
      return { code: ErrorCode.COMPENSATION_NOT_FOUND, message: ErrorMessage[ErrorCode.COMPENSATION_NOT_FOUND] };
    }

    if (compensation.status !== CompensationStatus.APPROVED) {
      return { code: ErrorCode.COMPENSATION_STATUS_INVALID, message: ErrorMessage[ErrorCode.COMPENSATION_STATUS_INVALID] };
    }

    if (compensation.status === CompensationStatus.COMPLETED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_COMPLETED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_COMPLETED] };
    }

    const beforeData = { 
      status: compensation.status, 
      paymentTransactionId: compensation.paymentTransactionId,
      processedBy: compensation.processedBy,
      processorName: compensation.processorName 
    };

    compensation.status = CompensationStatus.PROCESSED;
    compensation.paymentTransactionId = paymentTransactionId;
    compensation.processedBy = processor;
    compensation.processorName = processorName;
    compensation.processedAt = new Date();

    try {
      const updatedCompensation = await this.compensationRepository.save(compensation);

      const afterData = { 
        status: updatedCompensation.status, 
        paymentTransactionId: updatedCompensation.paymentTransactionId,
        processedBy: updatedCompensation.processedBy,
        processorName: updatedCompensation.processorName,
        processedAt: updatedCompensation.processedAt
      };

      await this.auditService.createLog(
        AuditModule.COMPENSATION,
        AuditAction.UPDATE,
        updatedCompensation.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        `处理补偿支付，交易ID: ${paymentTransactionId}，处理人: ${processorName}`,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedCompensation };
    } catch (error) {
      console.error("Failed to process compensation:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async completeCompensation(id: string, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    const compensation = await this.compensationRepository.findOne({
      where: { id },
      relations: ["review"],
    });

    if (!compensation) {
      return { code: ErrorCode.COMPENSATION_NOT_FOUND, message: ErrorMessage[ErrorCode.COMPENSATION_NOT_FOUND] };
    }

    if (compensation.status !== CompensationStatus.PROCESSED) {
      return { code: ErrorCode.COMPENSATION_STATUS_INVALID, message: "补偿未处于处理状态，无法完成" };
    }

    if (compensation.status === CompensationStatus.COMPLETED) {
      return { code: ErrorCode.COMPENSATION_ALREADY_COMPLETED, message: ErrorMessage[ErrorCode.COMPENSATION_ALREADY_COMPLETED] };
    }

    const beforeData = { status: compensation.status };

    compensation.status = CompensationStatus.COMPLETED;
    compensation.completedAt = new Date();

    try {
      const updatedCompensation = await this.compensationRepository.save(compensation);

      const afterData = { status: updatedCompensation.status, completedAt: updatedCompensation.completedAt };

      await this.auditService.createLog(
        AuditModule.COMPENSATION,
        AuditAction.CLOSE,
        updatedCompensation.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        "完成补偿",
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedCompensation };
    } catch (error) {
      console.error("Failed to complete compensation:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getPendingCompensations(): Promise<{ code: ErrorCode; message: string; data?: Compensation[] }> {
    try {
      const compensations = await this.compensationRepository.find({
        where: { status: CompensationStatus.PENDING },
        relations: ["review", "store"],
        order: { createdAt: "ASC" },
      });
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: compensations };
    } catch (error) {
      console.error("Failed to get pending compensations:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getUncompletedCompensations(): Promise<{ code: ErrorCode; message: string; data?: Compensation[] }> {
    try {
      const compensations = await this.compensationRepository
        .createQueryBuilder("compensation")
        .leftJoinAndSelect("compensation.review", "review")
        .leftJoinAndSelect("compensation.store", "store")
        .where("compensation.status != :completedStatus", { completedStatus: CompensationStatus.COMPLETED })
        .orderBy("compensation.createdAt", "ASC")
        .getMany();

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: compensations };
    } catch (error) {
      console.error("Failed to get uncompleted compensations:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getCompensationWithDetails(id: string): Promise<{ code: ErrorCode; message: string; data?: Compensation }> {
    try {
      const compensation = await this.compensationRepository.findOne({
        where: { id },
        relations: ["review", "store"],
      });

      if (!compensation) {
        return { code: ErrorCode.COMPENSATION_NOT_FOUND, message: ErrorMessage[ErrorCode.COMPENSATION_NOT_FOUND] };
      }

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: compensation };
    } catch (error) {
      console.error("Failed to get compensation details:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }
}
