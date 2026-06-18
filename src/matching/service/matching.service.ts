import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchingAttempt } from '../entities/matching-attempt.entity';
import { MatchingSnapshot } from '../entities/matching-snapshot.entity';
import { RunMatchingDto } from '../dto/run-matching.dto';
import { RespondMatchingDto } from '../dto/respond-matching.dto';
import { QueryMatchingDto } from '../dto/query-matching.dto';
import { MatchingStatus, MatchingFailReason, Role } from '../../common/enums';
import { HousekeeperService } from '../../housekeeper/service/housekeeper.service';
import { IntakeService } from '../../intake/service/intake.service';
import { AuditService } from '../../audit/service/audit.service';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(MatchingAttempt)
    private readonly attemptRepo: Repository<MatchingAttempt>,
    @InjectRepository(MatchingSnapshot)
    private readonly snapshotRepo: Repository<MatchingSnapshot>,
    private readonly housekeeperService: HousekeeperService,
    private readonly intakeService: IntakeService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: QueryMatchingDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const qb = this.attemptRepo.createQueryBuilder('a');
    const { intakeId, round, status, housekeeperId } = query;
    if (intakeId) qb.andWhere('a.intakeId = :iid', { iid: intakeId });
    if (round !== undefined) qb.andWhere('a.round = :r', { r: round });
    if (status) qb.andWhere('a.status = :s', { s: status });
    if (housekeeperId) qb.andWhere('a.housekeeperId = :hid', { hid: housekeeperId });
    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * pageSize).take(pageSize).orderBy('a.round', 'DESC').addOrderBy('a.rank', 'ASC').getMany();
    return { items, total, page, pageSize };
  }

  async runMatching(dto: RunMatchingDto, actor: { role: Role; id: string; name: string }) {
    const topN = dto.topN ?? 5;
    const intake = await this.intakeService.findOne(dto.intakeId);
    const updated = await this.intakeService.incrementRound(dto.intakeId, actor.role, actor.id, actor.name);
    const round = updated.currentMatchingRound;
    const startTime = intake.startTime || new Date();
    const candidates = await this.housekeeperService.findActiveAndAvailable(startTime);
    const scoredList: any[] = [];
    for (const hk of candidates) {
      let score = 0;
      const fails: string[] = [];
      let failReason = MatchingFailReason.NONE;
      const skillsArr = (hk.skills || '').split(',');
      const svc = (intake.serviceType || '').toLowerCase();
      let skillScore = 0;
      const basicSkills = ['保洁', '烹饪', '老人', '育儿'];
      if (svc && skillsArr.some(s => s.includes(svc) || svc.includes(s))) {
        skillScore = 30;
      } else if (basicSkills.some(b => skillsArr.some(s => s.includes(b)))) {
        skillScore = 15;
      } else if (svc) {
        failReason = MatchingFailReason.SKILL_MISMATCH;
        fails.push('技能不匹配');
      }
      score += skillScore;
      let areaScore = 0;
      const addr = (intake.address || '');
      const cov = (hk.coverageArea || '');
      if (addr && cov && (cov.includes(addr) || addr.includes(cov.split(',')[0]))) {
        areaScore = 20;
      } else if (!addr) {
        areaScore = 10;
      } else {
        if (failReason === MatchingFailReason.NONE) failReason = MatchingFailReason.AREA_NOT_COVERED;
        fails.push('地域不覆盖');
      }
      score += areaScore;
      let salaryScore = 0;
      const budget = intake.salaryBudget || 0;
      const expMin = hk.expectedMinSalary || 0;
      if (budget >= expMin) {
        salaryScore = 20;
      } else if (expMin > 0 && (expMin - budget) / expMin < 0.1) {
        salaryScore = 10;
      } else if (budget > 0) {
        if (failReason === MatchingFailReason.NONE) failReason = MatchingFailReason.SALARY_BELOW_EXPECTATION;
        fails.push('薪资低于期望');
      }
      score += salaryScore;
      const rating = parseFloat(hk.averageRating as any) || 0;
      const ratingScore = Math.min(rating * 3, 15);
      score += ratingScore;
      const expScore = Math.min(hk.experienceYears || 0, 10);
      score += expScore;
      if (hk.noShowCount > 0) {
        score -= hk.noShowCount * 10;
      }
      if (hk.currentAssignedIntakeId && hk.currentAssignedIntakeId !== intake.id) {
        if (failReason === MatchingFailReason.NONE) failReason = MatchingFailReason.HOUSEKEEPER_ALREADY_ASSIGNED;
        fails.push('阿姨已分配给其他需求');
      }
      if (hk.negativeReviews > 0 && hk.totalReviews > 0) {
        const negRate = hk.negativeReviews / hk.totalReviews;
        if (negRate > 0.3) {
          if (failReason === MatchingFailReason.NONE) failReason = MatchingFailReason.HOUSEKEEPER_HAS_NEGATIVE_REVIEW;
          fails.push('阿姨差评率过高');
        }
      }
      scoredList.push({
        housekeeperId: hk.id,
        housekeeper: hk,
        score,
        failReason,
        failDetails: fails.join('; '),
      });
    }
    scoredList.sort((a, b) => b.score - a.score);
    const topList = scoredList.slice(0, topN);
    const totalCandidates = scoredList.length;
    const shortlisted = topList.length;
    const now = new Date();
    for (let idx = 0; idx < topList.length; idx++) {
      const c = topList[idx];
      const attempt = this.attemptRepo.create({
        intakeId: intake.id,
        housekeeperId: c.housekeeperId,
        round,
        rank: idx + 1,
        status: MatchingStatus.RECOMMENDED,
        score: c.score,
        failReason: c.failReason,
        failDetails: c.failDetails,
        recommendedAt: now,
        actorRole: actor.role,
        actorId: actor.id,
      });
      const saved = await this.attemptRepo.save(attempt);
      this.auditService.quickLog('MATCHING', saved.id, 'RECOMMEND', 'round=' + round + ',score=' + c.score, actor);
    }
    const snapshotData = topList.map((c, idx) => ({
      rank: idx + 1,
      housekeeperId: c.housekeeperId,
      name: c.housekeeper.name,
      phone: c.housekeeper.phone,
      score: c.score,
      failReason: c.failReason,
      failDetails: c.failDetails,
    }));
    const snapshot = this.snapshotRepo.create({
      intakeId: intake.id,
      round,
      generatedBy: actor.name,
      totalCandidates,
      shortlistedCandidates: shortlisted,
      snapshotJson: JSON.stringify(snapshotData),
    });
    await this.snapshotRepo.save(snapshot);
    this.auditService.quickLog('MATCH', intake.id, 'MATCH_ROUND', 'round=' + round, actor);
    const warning = !intake.serviceScope || intake.serviceScope.trim() === ''
      ? 'SERVICE_SCOPE_UNCLEAR: 服务内容未澄清，匹配准确度下降' : undefined;
    return { round, candidates: snapshotData, warning };
  }

  async respondCustomer(dto: RespondMatchingDto) {
    const attempt = await this.attemptRepo.findOne({ where: { id: dto.attemptId } });
    if (!attempt) throw new NotFoundException('匹配尝试不存在');
    if (dto.accept) {
      attempt.status = MatchingStatus.ACCEPTED;
      attempt.acceptedAt = new Date();
    } else {
      attempt.status = MatchingStatus.REJECTED_BY_CUSTOMER;
      attempt.customerRejectedAt = new Date();
      attempt.rejectionNotes = dto.rejectionNotes;
    }
    attempt.actorRole = dto.actorRole;
    attempt.actorId = dto.actorId;
    const saved = await this.attemptRepo.save(attempt);
    const actor = { role: dto.actorRole, id: dto.actorId, name: dto.actorName };
    this.auditService.quickLog('MATCHING', saved.id, dto.accept ? 'CUSTOMER_ACCEPT' : 'CUSTOMER_REJECT', dto.rejectionNotes || '', actor);
    return saved;
  }

  async respondHousekeeper(dto: RespondMatchingDto) {
    const attempt = await this.attemptRepo.findOne({ where: { id: dto.attemptId } });
    if (!attempt) throw new NotFoundException('匹配尝试不存在');
    if (dto.accept) {
      attempt.status = MatchingStatus.ACCEPTED;
      attempt.acceptedAt = new Date();
    } else {
      attempt.status = MatchingStatus.REJECTED_BY_HOUSEKEEPER;
      attempt.housekeeperRejectedAt = new Date();
      attempt.rejectionNotes = dto.rejectionNotes;
    }
    attempt.actorRole = dto.actorRole;
    attempt.actorId = dto.actorId;
    const saved = await this.attemptRepo.save(attempt);
    const actor = { role: dto.actorRole, id: dto.actorId, name: dto.actorName };
    this.auditService.quickLog('MATCHING', saved.id, dto.accept ? 'HOUSEKEEPER_ACCEPT' : 'HOUSEKEEPER_REJECT', dto.rejectionNotes || '', actor);
    return saved;
  }

  async getLatestRound(intakeId: string) {
    const snapshots = await this.snapshotRepo.find({ where: { intakeId }, order: { round: 'DESC' }, take: 1 });
    if (snapshots.length === 0) return null;
    const snap = snapshots[0];
    const attempts = await this.attemptRepo.find({ where: { intakeId, round: snap.round }, order: { rank: 'ASC' } });
    return { round: snap.round, snapshot: snap, candidates: attempts };
  }

  async getTrace(intakeId: string) {
    const snapshots = await this.snapshotRepo.find({ where: { intakeId }, order: { round: 'ASC' } });
    const attempts = await this.attemptRepo.find({ where: { intakeId }, order: { round: 'ASC', rank: 'ASC' } });
    return { snapshots, attempts };
  }

  async analyzeFailures(intakeId: string) {
    const attempts = await this.attemptRepo.find({ where: { intakeId } });
    const counts: Record<string, number> = {};
    for (const a of attempts) {
      if (a.failReason && a.failReason !== MatchingFailReason.NONE) {
        counts[a.failReason] = (counts[a.failReason] || 0) + 1;
      }
    }
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count }));
    const total = attempts.length;
    const accepted = attempts.filter(a => a.status === MatchingStatus.ACCEPTED).length;
    return { topReasons: ranked, totalAttempts: total, acceptedCount: accepted, successRate: total > 0 ? accepted / total : 0 };
  }
}
