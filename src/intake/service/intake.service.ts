import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Intake } from '../entities/intake.entity';
import { CreateIntakeDto } from '../dto/create-intake.dto';
import { UpdateIntakeDto } from '../dto/update-intake.dto';
import { AssignOwnerDto } from '../dto/assign-owner.dto';
import { ClarifyDto } from '../dto/clarify.dto';
import { QueryIntakeDto } from '../dto/query-intake.dto';
import { IntakeStatus, IntakeBlockReason, Role } from '../../common/enums';
import { ListResponseDto } from '../../common/dto/list-response.dto';
import { AuditService } from '../../audit/service/audit.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

@Injectable()
export class IntakeService {
  constructor(
    @InjectRepository(Intake)
    private readonly repo: Repository<Intake>,
    private readonly auditService: AuditService,
  ) {}

  private generateIntakeNo(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `IN-${y}${m}${d}-${rand}`;
  }

  private async auditQuickLog(
    entityType: string,
    entityId: string,
    action: AuditAction | string,
    actorRole?: Role,
    actorId?: string,
    actorName?: string,
    details?: any,
  ): Promise<void> {
    const actor = actorRole && actorId && actorName
      ? { role: actorRole, id: actorId, name: actorName }
      : undefined;
    const remark = details !== undefined ? JSON.stringify(details) : undefined;
    await this.auditService.quickLog(entityType, entityId, action, remark, actor);
  }

  private async getAuditTrail(id: string): Promise<any[]> {
    return this.auditService.getTrail('INTAKE', id);
  }

  private calcStuck(b: Date | null | undefined): number | null {
    return b ? Math.round(((Date.now() - new Date(b).getTime()) / 3600000) * 100) / 100 : null;
  }

  private async findOneOrFail(id: string): Promise<Intake> {
    const i = await this.repo.findOne({ where: { id } });
    if (!i) throw new NotFoundException('Intake not found');
    return i;
  }

  async incrementRound(id: string, actorRole: Role, actorId: string, actorName: string): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    const oldRound = i.currentMatchingRound;
    i.currentMatchingRound += 1;
    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.MATCH_ROUND, actorRole, actorId, actorName, {
      oldRound,
      newRound: s.currentMatchingRound,
    });
    return s;
  }

  async create(dto: CreateIntakeDto, actorRole: Role, actorId: string, actorName: string): Promise<Intake> {
    const intakeNo = this.generateIntakeNo();
    const x = this.repo.create({
      ...dto,
      intakeNo,
      status: IntakeStatus.CREATED,
      blockReason: IntakeBlockReason.NONE,
      ownerRole: Role.CUSTOMER_SERVICE,
      currentMatchingRound: 0,
    });
    const s = await this.repo.save(x);
    await this.auditQuickLog('INTAKE', s.id, AuditAction.CREATE, actorRole, actorId, actorName, dto);
    return s;
  }

  async assignOwner(
    id: string,
    dto: AssignOwnerDto,
    actorRole: Role,
    actorId: string,
    actorName: string,
  ): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    const o = { ownerRole: i.ownerRole, ownerId: i.ownerId, ownerName: i.ownerName };
    i.ownerRole = dto.ownerRole;
    i.ownerId = dto.ownerId;
    i.ownerName = dto.ownerName;
    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.ASSIGN, actorRole, actorId, actorName, { old: o, new: dto });
    return s;
  }

  async clarify(id: string, dto: ClarifyDto): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    const old = { status: i.status, blockReason: i.blockReason, serviceScope: i.serviceScope };

    if (dto.serviceScope && dto.serviceScope.trim().length > 0) {
      i.serviceScope = dto.serviceScope;
      i.status = IntakeStatus.CLARIFIED;
      if (
        i.blockReason === IntakeBlockReason.AWAITING_CUSTOMER_CLARIFICATION ||
        i.blockReason === IntakeBlockReason.AWAITING_CS_FOLLOWUP
      ) {
        i.blockReason = IntakeBlockReason.NONE;
        i.blockedAt = null;
      }
    } else {
      i.status = IntakeStatus.CLARIFYING;
      i.blockReason = IntakeBlockReason.AWAITING_CUSTOMER_CLARIFICATION;
      i.blockedAt = new Date();
    }

    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.CLARIFY, dto.actorRole, dto.actorId, dto.actorName, {
      old,
      new: { status: s.status, blockReason: s.blockReason, notes: dto.clarificationNotes },
    });
    return s;
  }

  async startMatching(
    id: string,
    actorRole: Role,
    actorId: string,
    actorName: string,
  ): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    const old = { status: i.status };
    if (i.status !== IntakeStatus.CLARIFIED && i.status !== IntakeStatus.CREATED) {
      if (!i.serviceScope || i.serviceScope.trim().length === 0) {
        i.blockReason = IntakeBlockReason.AWAITING_CUSTOMER_CLARIFICATION;
      }
    }
    i.status = IntakeStatus.MATCHING;
    i.currentMatchingRound += 1;
    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.START_MATCHING, actorRole, actorId, actorName, {
      old,
      new: s.status,
    });
    return s;
  }

  async updateBlockReason(
    id: string,
    r: IntakeBlockReason,
    actorRole: Role,
    actorId: string,
    actorName: string,
  ): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    const old = { br: i.blockReason, ba: i.blockedAt };
    i.blockReason = r;
    i.blockedAt = r !== IntakeBlockReason.NONE ? new Date() : null;
    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.UPDATE_BLOCK_REASON, actorRole, actorId, actorName, {
      old,
      new: { br: s.blockReason, ba: s.blockedAt },
    });
    return s;
  }

  async findAll(q: QueryIntakeDto): Promise<ListResponseDto<Intake & { stuckHours: number | null }>> {
    const page = q.page || 1,
      ps = q.pageSize || 20,
      sk = (page - 1) * ps;
    const w: FindOptionsWhere<Intake> = {};
    if (q.status) w.status = q.status;
    if (q.blockReason) w.blockReason = q.blockReason;
    if (q.ownerRole) w.ownerRole = q.ownerRole;
    if (q.ownerId) w.ownerId = q.ownerId;
    if (q.serviceType) w.serviceType = q.serviceType;
    const [l, t] = await this.repo.findAndCount({ where: w, skip: sk, take: ps, order: { createdAt: 'DESC' } });
    const list = l.map((x) => ({ ...x, stuckHours: this.calcStuck(x.blockedAt) }));
    return new ListResponseDto(list, t, page, ps);
  }

  async findOne(id: string): Promise<Intake & { stuckHours: number | null; auditTrail: any[] }> {
    const i = await this.findOneOrFail(id);
    const auditTrail = await this.getAuditTrail(id);
    return { ...i, stuckHours: this.calcStuck(i.blockedAt), auditTrail };
  }

  async getAuditTrailOnly(id: string): Promise<any[]> {
    await this.findOneOrFail(id);
    return this.getAuditTrail(id);
  }

  async detectStuckCases(): Promise<any[]> {
    const th = 24;
    const cutoff = new Date(Date.now() - th * 3600000);

    const blockReasons = [
      IntakeBlockReason.AWAITING_CUSTOMER_CLARIFICATION,
      IntakeBlockReason.AWAITING_CS_FOLLOWUP,
      IntakeBlockReason.AWAITING_QUALITY_REVIEW,
    ];

    const all = await this.repo.find({
      where: {
        blockReason: In(blockReasons),
      },
    });

    return all
      .filter((x) => x.blockedAt && new Date(x.blockedAt) <= cutoff)
      .map((x) => ({
        id: x.id,
        status: x.status,
        blockReason: x.blockReason,
        blockedAt: x.blockedAt,
        stuckHours: this.calcStuck(x.blockedAt),
        ownerRole: x.ownerRole,
        ownerId: x.ownerId,
        ownerName: x.ownerName,
        customerName: x.customerName,
      }));
  }

  async cancel(
    id: string,
    reason: string,
    actorRole: Role,
    actorId: string,
    actorName: string,
  ): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    const os = i.status;
    i.status = IntakeStatus.CANCELLED;
    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.CANCEL, actorRole, actorId, actorName, {
      oldStatus: os,
      reason,
    });
    return s;
  }

  async complete(
    id: string,
    actorRole: Role,
    actorId: string,
    actorName: string,
  ): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    const os = i.status;
    i.status = IntakeStatus.COMPLETED;
    i.blockReason = IntakeBlockReason.NONE;
    i.blockedAt = null;
    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.COMPLETE, actorRole, actorId, actorName, { oldStatus: os });
    return s;
  }

  async update(
    id: string,
    dto: UpdateIntakeDto,
    actorRole: Role,
    actorId: string,
    actorName: string,
  ): Promise<Intake> {
    const i = await this.findOneOrFail(id);
    Object.assign(i, dto);
    const s = await this.repo.save(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.UPDATE, actorRole, actorId, actorName, dto);
    return s;
  }

  async remove(
    id: string,
    actorRole: Role,
    actorId: string,
    actorName: string,
  ): Promise<void> {
    const i = await this.findOneOrFail(id);
    await this.repo.remove(i);
    await this.auditQuickLog('INTAKE', id, AuditAction.DELETE, actorRole, actorId, actorName, { action: 'DELETE' });
  }
}
