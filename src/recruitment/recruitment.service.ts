
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecruitmentDto } from './dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from './dto/update-recruitment.dto';
import { RecruitmentRecord, RecruitmentStatus, AuditType, TargetType } from '@prisma/client';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateRecruitmentDto, userId: string): Promise<RecruitmentRecord> {
    const recruitment = await this.prisma.recruitmentRecord.create({
      data: {
        ...createDto,
        creatorId: userId,
      },
    });

    await this.prisma.auditRecord.create({
      data: {
        auditType: AuditType.APPLICATION_SUBMITTED,
        targetType: TargetType.RECRUITMENT,
        targetId: recruitment.id,
        newStatus: RecruitmentStatus.ACTIVE,
        auditorId: userId,
        recruitmentId: recruitment.id,
      },
    });

    return recruitment;
  }

  async findAll(status?: RecruitmentStatus): Promise<RecruitmentRecord[]> {
    const where = status ? { status } : {};
    return this.prisma.recruitmentRecord.findMany({
      where,
      include: {
        creator: true,
        volunteers: { include: { auditRecords: { take: 1 } } },
        auditRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<RecruitmentRecord> {
    const recruitment = await this.prisma.recruitmentRecord.findUnique({
      where: { id },
      include: {
        creator: true,
        volunteers: { include: { auditRecords: { take: 1 } } },
        auditRecords: { orderBy: { createdAt: 'desc' } },
        exceptionLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!recruitment) {
      throw new NotFoundException('招募记录不存在');
    }

    return recruitment;
  }

  async update(id: string, updateDto: UpdateRecruitmentDto, userId: string): Promise<RecruitmentRecord> {
    const recruitment = await this.findOne(id);
    const previousStatus = recruitment.status;

    const updated = await this.prisma.recruitmentRecord.update({
      where: { id },
      data: updateDto,
    });

    if (updateDto.status && updateDto.status !== previousStatus) {
      await this.prisma.auditRecord.create({
        data: {
          auditType: AuditType.STATUS_CHANGED,
          targetType: TargetType.RECRUITMENT,
          targetId: id,
          previousStatus,
          newStatus: updateDto.status,
          auditorId: userId,
          recruitmentId: id,
        },
      });
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const recruitment = await this.findOne(id);
    await this.prisma.recruitmentRecord.delete({ where: { id } });
  }

  async getActiveRecruitments(): Promise<RecruitmentRecord[]> {
    return this.prisma.recruitmentRecord.findMany({
      where: { status: RecruitmentStatus.ACTIVE },
      include: { creator: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
