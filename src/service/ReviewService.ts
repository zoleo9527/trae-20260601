import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Review, ReviewStatus, ReviewSource, ReviewLevel, ReviewType, HandlerRole } from "../entity/Review";
import { Store } from "../entity/Store";
import { Compensation, CompensationStatus } from "../entity/Compensation";
import { AuditService } from "./AuditService";
import { AuditModule, AuditAction, AuditOperatorRole } from "../entity/AuditLog";
import { ErrorCode, ErrorMessage } from "../error/ErrorCode";

export interface CreateReviewRequest {
  source: ReviewSource;
  orderId: string;
  customerName: string;
  customerPhone: string;
  content: string;
  level: ReviewLevel;
  type: ReviewType;
  orderAmount: number;
  storeCode: string;
}

export interface UpdateReviewRequest {
  status?: ReviewStatus;
  currentHandler?: HandlerRole;
  handlerName?: string;
  internalNotes?: string;
  blockedReason?: string;
}

export interface ReviewQuery {
  storeCode?: string;
  region?: string;
  status?: ReviewStatus;
  level?: ReviewLevel;
  type?: ReviewType;
  source?: ReviewSource;
  startDate?: Date;
  endDate?: Date;
  currentHandler?: HandlerRole;
}

export class ReviewService {
  private reviewRepository: Repository<Review>;
  private storeRepository: Repository<Store>;
  private compensationRepository: Repository<Compensation>;
  private auditService: AuditService;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.storeRepository = AppDataSource.getRepository(Store);
    this.compensationRepository = AppDataSource.getRepository(Compensation);
    this.auditService = new AuditService();
  }

  async createReview(request: CreateReviewRequest, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Review }> {
    const { source, orderId, customerName, customerPhone, content, level, type, orderAmount, storeCode } = request;

    const store = await this.storeRepository.findOne({ where: { storeCode } });
    if (!store) {
      return { code: ErrorCode.STORE_NOT_FOUND, message: ErrorMessage[ErrorCode.STORE_NOT_FOUND] };
    }

    const existingReview = await this.reviewRepository.findOne({ where: { orderId } });
    if (existingReview) {
      return { code: ErrorCode.DUPLICATE_RECORD, message: ErrorMessage[ErrorCode.DUPLICATE_RECORD] };
    }

    const review = this.reviewRepository.create({
      source,
      orderId,
      customerName,
      customerPhone,
      content,
      level,
      type,
      orderAmount,
      store,
      status: ReviewStatus.PENDING,
    });

    try {
      const savedReview = await this.reviewRepository.save(review);

      await this.auditService.createLog(
        AuditModule.REVIEW,
        AuditAction.CREATE,
        savedReview.id,
        AuditOperatorRole.SYSTEM,
        operatorName,
        null,
        { id: savedReview.id, orderId, status: savedReview.status },
        `创建差评记录，订单号: ${orderId}`,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: savedReview };
    } catch (error) {
      console.error("Failed to create review:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getReviewById(id: string): Promise<{ code: ErrorCode; message: string; data?: Review }> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ["store", "compensations"],
      });

      if (!review) {
        return { code: ErrorCode.REVIEW_NOT_FOUND, message: ErrorMessage[ErrorCode.REVIEW_NOT_FOUND] };
      }

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: review };
    } catch (error) {
      console.error("Failed to get review:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getReviews(query: ReviewQuery): Promise<{ code: ErrorCode; message: string; data?: Review[] }> {
    try {
      const queryBuilder = this.reviewRepository
        .createQueryBuilder("review")
        .leftJoinAndSelect("review.store", "store")
        .leftJoinAndSelect("review.compensations", "compensations");

      if (query.storeCode) {
        queryBuilder.andWhere("store.storeCode = :storeCode", { storeCode: query.storeCode });
      }
      if (query.region) {
        queryBuilder.andWhere("store.region = :region", { region: query.region });
      }
      if (query.status) {
        queryBuilder.andWhere("review.status = :status", { status: query.status });
      }
      if (query.level) {
        queryBuilder.andWhere("review.level = :level", { level: query.level });
      }
      if (query.type) {
        queryBuilder.andWhere("review.type = :type", { type: query.type });
      }
      if (query.source) {
        queryBuilder.andWhere("review.source = :source", { source: query.source });
      }
      if (query.currentHandler) {
        queryBuilder.andWhere("review.currentHandler = :currentHandler", { currentHandler: query.currentHandler });
      }
      if (query.startDate) {
        queryBuilder.andWhere("review.createdAt >= :startDate", { startDate: query.startDate });
      }
      if (query.endDate) {
        queryBuilder.andWhere("review.createdAt <= :endDate", { endDate: query.endDate });
      }

      const reviews = await queryBuilder.orderBy("review.createdAt", "DESC").getMany();

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: reviews };
    } catch (error) {
      console.error("Failed to get reviews:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async updateReview(id: string, request: UpdateReviewRequest, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Review }> {
    const review = await this.reviewRepository.findOne({ where: { id }, relations: ["compensations"] });
    if (!review) {
      return { code: ErrorCode.REVIEW_NOT_FOUND, message: ErrorMessage[ErrorCode.REVIEW_NOT_FOUND] };
    }

    if (review.status === ReviewStatus.CLOSED) {
      return { code: ErrorCode.REVIEW_ALREADY_RESOLVED, message: ErrorMessage[ErrorCode.REVIEW_ALREADY_RESOLVED] };
    }

    const beforeData = {
      status: review.status,
      currentHandler: review.currentHandler,
      handlerName: review.handlerName,
      internalNotes: review.internalNotes,
      blockedReason: review.blockedReason,
    };

    if (request.status !== undefined) {
      if (request.status === ReviewStatus.RESOLVED || request.status === ReviewStatus.CLOSED) {
        const pendingCompensations = review.compensations?.filter(c => c.status === CompensationStatus.PENDING);
        if (pendingCompensations && pendingCompensations.length > 0) {
          return { code: ErrorCode.COMPENSATION_STATUS_INVALID, message: "存在待审核的补偿申请，无法关闭差评" };
        }
        review.resolvedAt = new Date();
      }

      review.status = request.status;
    }

    if (request.currentHandler !== undefined) {
      review.currentHandler = request.currentHandler;
    }
    if (request.handlerName !== undefined) {
      review.handlerName = request.handlerName;
    }
    if (request.internalNotes !== undefined) {
      review.internalNotes = request.internalNotes;
    }
    if (request.blockedReason !== undefined) {
      review.blockedReason = request.blockedReason;
    }

    try {
      const updatedReview = await this.reviewRepository.save(review);

      const afterData = {
        status: updatedReview.status,
        currentHandler: updatedReview.currentHandler,
        handlerName: updatedReview.handlerName,
        internalNotes: updatedReview.internalNotes,
        blockedReason: updatedReview.blockedReason,
      };

      const action = request.currentHandler ? AuditAction.ASSIGN : AuditAction.UPDATE;
      const description = request.currentHandler
        ? `分配处理人: ${request.handlerName} (${request.currentHandler})`
        : `更新差评状态: ${request.status}`;

      await this.auditService.createLog(
        AuditModule.REVIEW,
        action,
        updatedReview.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        description,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedReview };
    } catch (error) {
      console.error("Failed to update review:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async assignHandler(id: string, handlerRole: HandlerRole, handlerName: string, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Review }> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      return { code: ErrorCode.REVIEW_NOT_FOUND, message: ErrorMessage[ErrorCode.REVIEW_NOT_FOUND] };
    }

    if (review.status === ReviewStatus.CLOSED) {
      return { code: ErrorCode.REVIEW_ALREADY_RESOLVED, message: ErrorMessage[ErrorCode.REVIEW_ALREADY_RESOLVED] };
    }

    const beforeData = { currentHandler: review.currentHandler, handlerName: review.handlerName, status: review.status };

    review.currentHandler = handlerRole;
    review.handlerName = handlerName;
    review.status = ReviewStatus.PROCESSING;

    try {
      const updatedReview = await this.reviewRepository.save(review);

      const afterData = { currentHandler: updatedReview.currentHandler, handlerName: updatedReview.handlerName, status: updatedReview.status };

      await this.auditService.createLog(
        AuditModule.REVIEW,
        AuditAction.ASSIGN,
        updatedReview.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        `分配处理人: ${handlerName} (${handlerRole})`,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedReview };
    } catch (error) {
      console.error("Failed to assign handler:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async resolveReview(id: string, notes: string, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Review }> {
    const review = await this.reviewRepository.findOne({ where: { id }, relations: ["compensations"] });
    if (!review) {
      return { code: ErrorCode.REVIEW_NOT_FOUND, message: ErrorMessage[ErrorCode.REVIEW_NOT_FOUND] };
    }

    if (review.status === ReviewStatus.CLOSED) {
      return { code: ErrorCode.REVIEW_ALREADY_RESOLVED, message: ErrorMessage[ErrorCode.REVIEW_ALREADY_RESOLVED] };
    }

    const pendingCompensations = review.compensations?.filter(c => c.status === "pending");
    if (pendingCompensations && pendingCompensations.length > 0) {
      return { code: ErrorCode.COMPENSATION_STATUS_INVALID, message: "存在待审核的补偿申请，无法解决差评" };
    }

    const beforeData = { status: review.status, internalNotes: review.internalNotes };

    review.status = ReviewStatus.RESOLVED;
    review.internalNotes = notes;
    review.resolvedAt = new Date();

    try {
      const updatedReview = await this.reviewRepository.save(review);

      const afterData = { status: updatedReview.status, internalNotes: updatedReview.internalNotes, resolvedAt: updatedReview.resolvedAt };

      await this.auditService.createLog(
        AuditModule.REVIEW,
        AuditAction.RESOLVE,
        updatedReview.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        `解决差评: ${notes}`,
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedReview };
    } catch (error) {
      console.error("Failed to resolve review:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async closeReview(id: string, operatorRole: AuditOperatorRole, operatorName: string, ipAddress: string): Promise<{ code: ErrorCode; message: string; data?: Review }> {
    const review = await this.reviewRepository.findOne({ where: { id }, relations: ["compensations"] });
    if (!review) {
      return { code: ErrorCode.REVIEW_NOT_FOUND, message: ErrorMessage[ErrorCode.REVIEW_NOT_FOUND] };
    }

    if (review.status === ReviewStatus.CLOSED) {
      return { code: ErrorCode.REVIEW_ALREADY_RESOLVED, message: ErrorMessage[ErrorCode.REVIEW_ALREADY_RESOLVED] };
    }

    const pendingCompensations = review.compensations?.filter(c => c.status !== "completed");
    if (pendingCompensations && pendingCompensations.length > 0) {
      return { code: ErrorCode.COMPENSATION_STATUS_INVALID, message: "存在未完成的补偿记录，无法关闭差评" };
    }

    const beforeData = { status: review.status };

    review.status = ReviewStatus.CLOSED;
    if (!review.resolvedAt) {
      review.resolvedAt = new Date();
    }

    try {
      const updatedReview = await this.reviewRepository.save(review);

      const afterData = { status: updatedReview.status };

      await this.auditService.createLog(
        AuditModule.REVIEW,
        AuditAction.CLOSE,
        updatedReview.id,
        operatorRole,
        operatorName,
        beforeData,
        afterData,
        "关闭差评",
        ipAddress
      );

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: updatedReview };
    } catch (error) {
      console.error("Failed to close review:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getPendingReviews(): Promise<{ code: ErrorCode; message: string; data?: Review[] }> {
    try {
      const reviews = await this.reviewRepository.find({
        where: { status: ReviewStatus.PENDING },
        relations: ["store"],
        order: { createdAt: "ASC" },
      });
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: reviews };
    } catch (error) {
      console.error("Failed to get pending reviews:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getBlockedReviews(): Promise<{ code: ErrorCode; message: string; data?: Review[] }> {
    try {
      const reviews = await this.reviewRepository.find({
        where: { blockedReason: (qb) => qb.not().isNull() },
        relations: ["store"],
        order: { updatedAt: "DESC" },
      });
      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: reviews };
    } catch (error) {
      console.error("Failed to get blocked reviews:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }

  async getReviewWithDetails(id: string): Promise<{ code: ErrorCode; message: string; data?: Review }> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ["store", "compensations"],
      });

      if (!review) {
        return { code: ErrorCode.REVIEW_NOT_FOUND, message: ErrorMessage[ErrorCode.REVIEW_NOT_FOUND] };
      }

      return { code: ErrorCode.SUCCESS, message: ErrorMessage[ErrorCode.SUCCESS], data: review };
    } catch (error) {
      console.error("Failed to get review details:", error);
      return { code: ErrorCode.DATABASE_ERROR, message: ErrorMessage[ErrorCode.DATABASE_ERROR] };
    }
  }
}
