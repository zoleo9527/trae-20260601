import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto';
import { Volunteer, VolunteerStatus, AuditType, TargetType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VolunteerService {
  constructor(private prisma: PrismaService) {}

  async create(createVolunteerDto: CreateVolunteerDto, userId: string): Promise<Volunteer> {
    const existing = await this.prisma.volunteer.findUnique({
      where: { idCard: createVolunteerDto.idCard },
    });

    if (existing) {
      throw new ConflictException('该身份证号已注册');
    }

    const applicationId = uuidv4();
    const recruitmentRecordId = createVolunteerDto.recruitmentRecordId || undefined;

    const result = await this.prisma.$transaction(async (tx) => {
      const volunteer = await tx.volunteer.create({
        data: {
          ...createVolunteerDto,
          applicationId,
          recruitmentRecordId,
        },
      });

      await tx.auditRecord.create({
        data: {
          auditType: AuditType.APPLICATION_SUBMITTED,
          targetType: TargetType.VOLUNTEER,
          targetId: volunteer.id,
          newStatus: VolunteerStatus.PENDING,
          auditorId: userId,
          volunteerId: volunteer.id,
        },
      });

      if (recruitmentRecordId) {
        await tx.recruitmentRecord.update({
          where: { id: recruitmentRecordId },
          data: { appliedCount: { increment: 1 } },
        });
      }

      return volunteer;
    });

    return result;
  }

  async findAll(status?: VolunteerStatus): Promise<Volunteer[]> {
    const where = status ? { status } : {};
    return this.prisma.volunteer.findMany({
      where,
      include: {
        recruitmentRecord: true,
        auditRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
        exceptionLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Volunteer> {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { id },
      include: {
        recruitmentRecord: true,
        auditRecords: { orderBy: { createdAt: 'desc' } },
        exceptionLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!volunteer) {
      throw new NotFoundException('志愿者不存在');
    }

    return volunteer;
  }

  async update(id: string, updateVolunteerDto: UpdateVolunteerDto, userId: string): Promise<Volunteer> {
    const volunteer = await this.findOne(id);
    const previousStatus = volunteer.status;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.volunteer.update({
        where: { id },
        data: updateVolunteerDto,
      });

      if (updateVolunteerDto.status && updateVolunteerDto.status !== previousStatus) {
        await tx.auditRecord.create({
          data: {
            auditType: AuditType.STATUS_CHANGED,
            targetType: TargetType.VOLUNTEER,
            targetId: id,
            previousStatus,
            newStatus: updateVolunteerDto.status,
            auditorId: userId,
            volunteerId: id,
          },
        });
      }

      return updated;
    });

    return result;
  }

  async remove(id: string): Promise<void> {
    const volunteer = await this.findOne(id);
    await this.prisma.volunteer.delete({ where: { id } });
  }

  async getPendingCount(): Promise<number> {
    return this.prisma.volunteer.count({ where: { status: VolunteerStatus.PENDING } });
  }

  async getRecentChanges(limit: number = 10): Promise<Volunteer[]> {
    return this.prisma.volunteer.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        auditRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }
}