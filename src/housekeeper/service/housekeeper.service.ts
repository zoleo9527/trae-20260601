import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Housekeeper } from '../entities/housekeeper.entity';
import { CreateHousekeeperDto } from '../dto/create-housekeeper.dto';
import { UpdateHousekeeperDto } from '../dto/update-housekeeper.dto';
import { QueryHousekeeperDto } from '../dto/query-housekeeper.dto';
import { HousekeeperStatus, Role } from '../../common/enums';

@Injectable()
export class HousekeeperService {
  constructor(
    @InjectRepository(Housekeeper)
    private readonly housekeeperRepo: Repository<Housekeeper>,
  ) {}

  async create(dto: CreateHousekeeperDto): Promise<Housekeeper> {
    const housekeeper = this.housekeeperRepo.create(dto);
    return this.housekeeperRepo.save(housekeeper);
  }

  async update(id: string, dto: UpdateHousekeeperDto): Promise<Housekeeper> {
    const hk = await this.findOne(id);
    Object.assign(hk, dto);
    return this.housekeeperRepo.save(hk);
  }

  async findAll(query: QueryHousekeeperDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { status, skills, minRating, coverageArea } = query;
    const qb = this.housekeeperRepo.createQueryBuilder('hk');

    if (status) qb.andWhere('hk.status = :status', { status });
    if (skills) qb.andWhere('hk.skills LIKE :skills', { skills: '%' + skills + '%' });
    if (coverageArea) qb.andWhere('hk.coverageArea LIKE :ca', { ca: '%' + coverageArea + '%' });
    if (minRating !== undefined) qb.andWhere('hk.averageRating >= :mr', { mr: minRating });

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('hk.createdAt', 'DESC')
      .getMany();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Housekeeper> {
    const hk = await this.housekeeperRepo.findOne({ where: { id } });
    if (!hk) throw new NotFoundException('阿姨不存在');
    return hk;
  }

  async markNoShow(id: string, actor: { role: Role; id: string; name: string }) {
    const hk = await this.findOne(id);
    hk.noShowCount += 1;
    if (hk.noShowCount >= 2) {
      hk.status = HousekeeperStatus.SUSPENDED;
    }
    await this.housekeeperRepo.save(hk);
    if ((global as any).auditService) {
      (global as any).auditService.quickLog('HOUSEKEEPER', id, 'MARK_NO_SHOW', 'noShowCount=' + hk.noShowCount, actor);
    }
    return hk;
  }

  async changeStatus(id: string, status: HousekeeperStatus, actor: { role: Role; id: string; name: string }) {
    const hk = await this.findOne(id);
    const oldStatus = hk.status;
    hk.status = status;
    await this.housekeeperRepo.save(hk);
    if ((global as any).auditService) {
      (global as any).auditService.quickLog('HOUSEKEEPER', id, 'CHANGE_STATUS', oldStatus + ' -> ' + status, actor);
    }
    return hk;
  }

  async incrementReview(id: string, isPositive: boolean, rating: number) {
    const hk = await this.findOne(id);
    const oldTotal = hk.totalReviews;
    const oldAvg = parseFloat(hk.averageRating as any);
    const newAvg = ((oldAvg * oldTotal) + rating) / (oldTotal + 1);
    hk.averageRating = Number(newAvg.toFixed(2)) as any;
    hk.totalReviews = oldTotal + 1;
    if (!isPositive) hk.negativeReviews += 1;
    return this.housekeeperRepo.save(hk);
  }

  async findActiveAndAvailable(startTime: Date): Promise<Housekeeper[]> {
    const list = await this.housekeeperRepo.find({
      where: [
        { status: HousekeeperStatus.ACTIVE },
        { status: HousekeeperStatus.NO_SHOW_RISK },
      ],
    });
    return list.filter(hk => !hk.availableFrom || new Date(hk.availableFrom).getTime() <= new Date(startTime).getTime());
  }
}
