import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Review } from '../review.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { AssignQualityDto } from '../dto/assign-quality.dto';
import { FollowUpDto } from '../dto/follow-up.dto';
import { EscalateDto } from '../dto/escalate.dto';
import { ResolveDto } from '../dto/resolve.dto';
import { CloseDto } from '../dto/close.dto';
import { QueryReviewDto } from '../dto/query-review.dto';
import { ListResponseDto } from '../../common/dto/list-response.dto';
import { ReviewStatus, Role } from '../../common/enums';
import { AuditService } from '../../audit/service/audit.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { HousekeeperService } from '../../housekeeper/service/housekeeper.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly auditService: AuditService,
    private readonly housekeeperService: HousekeeperService,
  ) {}

  private async findOneOrFail(id: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('评价不存在');
    return review;
  }

  private async auditQuickLog(
    entityId: string,
    action: AuditAction | string,
    actor: { role: Role; id: string; name: string },
    details?: any,
  ): Promise<void> {
    const remark = details !== undefined ? JSON.stringify(details) : undefined;
    await this.auditService.quickLog('REVIEW', entityId, action, remark, actor);
  }

  private async auditStatusChange(
    entityId: string,
    oldStatus: string,
    newStatus: string,
    actor: { role: Role; id: string; name: string },
    remark?: string,
  ): Promise<void> {
    await this.auditService.logStatusChange('REVIEW', entityId, 'status', oldStatus, newStatus, actor, remark);
  }

  async create(dto: CreateReviewDto, actor: { role: Role; id: string; name: string }): Promise<Review> {
    const status = dto.rating <= 3 ? ReviewStatus.AWAITING_QUALITY_ASSIGN : ReviewStatus.RESOLVED;
    const review = this.reviewRepo.create({
      ...dto,
      status,
    });
    const saved = await this.reviewRepo.save(review);

    await this.auditQuickLog(saved.id, AuditAction.CREATE, actor, { dto, status });

    if (status === ReviewStatus.RESOLVED) {
      await this.housekeeperService.incrementReview(dto.housekeeperId, dto.rating > 3, dto.rating);
    }

    return saved;
  }

  async assignQuality(
    id: string,
    dto: AssignQualityDto,
    actor: { role: Role; id: string; name: string },
  ): Promise<Review> {
    const review = await this.findOneOrFail(id);

    if (dto.assignedRole !== Role.QUALITY_SUPERVISOR) {
      throw new BadRequestException('分配角色必须是质检主管');
    }

    if (review.status !== ReviewStatus.AWAITING_QUALITY_ASSIGN && review.status !== ReviewStatus.SUBMITTED) {
      throw new BadRequestException('当前状态不允许分配质检主管');
    }

    const oldStatus = review.status;
    review.assignedRole = dto.assignedRole;
    review.assignedId = dto.assignedId;
    review.assignedName = dto.assignedName;
    review.status = ReviewStatus.QUALITY_FOLLOWING;

    const saved = await this.reviewRepo.save(review);

    await this.auditQuickLog(saved.id, AuditAction.ASSIGN, actor, { dto, oldStatus, newStatus: saved.status });
    await this.auditStatusChange(saved.id, oldStatus, saved.status, actor, '分配质检主管');

    return saved;
  }

  async followUp(
    id: string,
    dto: FollowUpDto,
    actor: { role: Role; id: string; name: string },
  ): Promise<Review> {
    const review = await this.findOneOrFail(id);

    if (review.status !== ReviewStatus.QUALITY_FOLLOWING && review.status !== ReviewStatus.ESCALATED) {
      throw new BadRequestException('当前状态不允许跟进');
    }

    const existingNotes = review.followUpNotes || '';
    const newNotes = existingNotes
      ? `${existingNotes}\n[${new Date().toISOString()}] ${actor.name}: ${dto.followUpNotes}`
      : `[${new Date().toISOString()}] ${actor.name}: ${dto.followUpNotes}`;

    review.followUpNotes = newNotes;
    const saved = await this.reviewRepo.save(review);

    await this.auditQuickLog(saved.id, AuditAction.FOLLOW_UP, actor, { followUpNotes: dto.followUpNotes });

    return saved;
  }

  async escalate(
    id: string,
    dto: EscalateDto,
    actor: { role: Role; id: string; name: string },
  ): Promise<Review> {
    const review = await this.findOneOrFail(id);

    if (review.status !== ReviewStatus.QUALITY_FOLLOWING) {
      throw new BadRequestException('当前状态不允许升级');
    }

    const oldStatus = review.status;
    review.status = ReviewStatus.ESCALATED;
    review.escalatedAt = new Date();

    const saved = await this.reviewRepo.save(review);

    await this.auditQuickLog(saved.id, AuditAction.ESCALATE, actor, { reason: dto.reason, oldStatus, newStatus: saved.status });
    await this.auditStatusChange(saved.id, oldStatus, saved.status, actor, dto.reason);

    return saved;
  }

  async resolve(
    id: string,
    dto: ResolveDto,
    actor: { role: Role; id: string; name: string },
  ): Promise<Review> {
    const review = await this.findOneOrFail(id);

    if (
      review.status !== ReviewStatus.QUALITY_FOLLOWING &&
      review.status !== ReviewStatus.ESCALATED
    ) {
      throw new BadRequestException('当前状态不允许解决');
    }

    const oldStatus = review.status;
    review.status = ReviewStatus.RESOLVED;
    review.resolvedAt = new Date();
    review.resolution = dto.resolution;

    const saved = await this.reviewRepo.save(review);

    await this.housekeeperService.incrementReview(review.housekeeperId, review.rating > 3, review.rating);
    await this.auditQuickLog(saved.id, AuditAction.RESOLVE, actor, { resolution: dto.resolution, oldStatus, newStatus: saved.status });
    await this.auditStatusChange(saved.id, oldStatus, saved.status, actor, dto.resolution);

    return saved;
  }

  async closeWithoutResolution(
    id: string,
    dto: CloseDto,
    actor: { role: Role; id: string; name: string },
  ): Promise<Review> {
    const review = await this.findOneOrFail(id);

    if (
      review.status !== ReviewStatus.QUALITY_FOLLOWING &&
      review.status !== ReviewStatus.ESCALATED
    ) {
      throw new BadRequestException('当前状态不允许关闭');
    }

    const oldStatus = review.status;
    review.status = ReviewStatus.CLOSED_WITHOUT_RESOLUTION;
    review.closedAt = new Date();

    const saved = await this.reviewRepo.save(review);

    await this.housekeeperService.incrementReview(review.housekeeperId, false, review.rating);
    await this.auditQuickLog(saved.id, AuditAction.CLOSE_WITHOUT_RESOLUTION, actor, { reason: dto.reason, oldStatus, newStatus: saved.status });
    await this.auditStatusChange(saved.id, oldStatus, saved.status, actor, dto.reason);

    return saved;
  }

  async findAll(q: QueryReviewDto): Promise<ListResponseDto<Review>> {
    const page = q.page || 1;
    const pageSize = q.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const w: FindOptionsWhere<Review> = {};
    if (q.status) w.status = q.status;
    if (q.orderId) w.orderId = q.orderId;
    if (q.housekeeperId) w.housekeeperId = q.housekeeperId;
    const [list, total] = await this.reviewRepo.findAndCount({
      where: w,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return new ListResponseDto(list, total, page, pageSize);
  }

  async findOne(id: string): Promise<Review> {
    return this.findOneOrFail(id);
  }

  async getAuditTrail(id: string): Promise<any[]> {
    await this.findOneOrFail(id);
    return this.auditService.getTrail('REVIEW', id);
  }
}
